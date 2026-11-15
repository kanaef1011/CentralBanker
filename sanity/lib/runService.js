/**
 * Server-side service: mọi ghi vào document `run` đi qua đây.
 * Client chỉ gửi quyết định; server replay engine và ghi kết quả.
 *
 * engine.cjs là phần <script> mô hình tách nguyên văn từ file HTML. Engine đọc kịch bản
 * qua SCENARIOS[key], nên ta nạp kịch bản từ Sanity vào object đó với key = _id document.
 */
import {createClient} from '@sanity/client'
import {createRequire} from 'node:module'
import {SCENARIO_FULL} from './queries.js'

const require = createRequire(import.meta.url)
const engine = require('./engine.cjs')

export const writeClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2025-10-01',
  token: process.env.SANITY_WRITE_TOKEN, // chỉ ở server
  useCdn: false,
})

/** @typedef {{quarter: number, i: number, qe: number, fg: number, decidedAt?: string}} Decision */

const now = () => new Date().toISOString()

// ---------- Chuyển đổi Sanity → engine ----------

async function loadScenario(scenarioId) {
  if (!engine.SCENARIOS[scenarioId]) {
    const doc = await writeClient.fetch(SCENARIO_FULL, {id: scenarioId})
    if (!doc) throw new Error('Không tìm thấy kịch bản')
    const events = {}
    for (const e of doc.events ?? []) {
      events[e.quarter] = {title: e.title, text: e.text, kind: e.kind, supply: e.supply || 0, demand: e.demand || 0, stress: e.stress || 0}
    }
    engine.SCENARIOS[scenarioId] = {name: doc.name, tag: doc.tag, brief: doc.brief, challenge: doc.challenge, ...doc.params, events}
  }
  return scenarioId
}

/** Dựng lại nhiệm kỳ từ chuỗi quyết định, giống hệt commit() trong UI. */
function replay(key, seed, noise, decisions) {
  const r = engine.initRun(key, seed)
  r.noise = noise
  for (const d of decisions) {
    const fc = engine.forecast(r, d, 1)[0]
    const row = engine.stepRun(r, d)
    row.fc = fc ? {pi: fc.pi, u: fc.u, y: fc.y, g: fc.g} : undefined
  }
  return r
}

function toStates(H) {
  return H.map((r) => ({
    _key: `q${r.t}`,
    _type: 'quarterState',
    t: r.t, pi: r.pi, core: r.core, piE: r.piE, y: r.y, u: r.u, g: r.g, i: r.i, di: r.di ?? 0,
    B: r.B, qe: r.qe ?? 0, fg: r.fg, c: r.c, stress: r.stress, supply: r.supply, demand: r.demand,
    tp: r.tp, L: r.L, sp: r.sp, lend: r.lend, rl: r.rl, f: r.f, credit: r.credit,
    shockD: r.shock?.d, shockP: r.shock?.p, eventQuarter: r.event ? r.t : undefined,
    cy: r.cy, cpi: r.cpi, fc: r.fc,
  }))
}

/** scoreRun() + các chỉ số runStats() mà tab Evaluate hiển thị. */
function toScore(run) {
  const s = engine.scoreRun(run)
  if (!s) return undefined
  const H = run.H, rows = H.slice(1)
  const sc = engine.SCENARIOS[run.key]
  const excessU = rows.reduce((a, r) => a + Math.max(0, r.u - sc.uStar), 0) / 4
  const piDrop = H[0].pi - H[H.length - 1].pi
  const brokenFG = rows.filter((r, k) => (H[k].fg >= 1 && r.di < -0.01) || (H[k].fg <= -1 && r.di > 0.01)).length
  return {
    _type: 'runScore',
    total: s.total, grade: engine.grade(s.total), ...s.parts,
    ePi: s.ePi, eU: s.eU, eG: s.eG, vol: s.vol,
    sacrifice: piDrop > 0.3 && excessU >= 0.02 ? excessU / piDrop : undefined,
    peakRate: Math.max(...H.map((r) => r.i)),
    maxB: Math.max(...H.map((r) => r.B)),
    brokenFG,
  }
}

async function getOwnRun(runId, playerId) {
  const doc = await writeClient.getDocument(runId)
  if (!doc || doc.player?._ref !== playerId) throw new Error('Không có quyền')
  return doc
}

// ---------- Người chơi (tùy chọn) ----------

/**
 * Lấy hoặc tạo người chơi. authId là ID đăng nhập, hoặc UUID ẩn danh client lưu trong localStorage.
 * _id tất định nên gọi nhiều lần vẫn chỉ có một document.
 */
export async function ensurePlayer(authId, displayName) {
  const _id = `player.${Buffer.from(authId).toString('base64url')}`
  await writeClient.createIfNotExists({_id, _type: 'player', authId, displayName, createdAt: now()})
  return _id
}

// ---------- Lượt chơi ----------

/** newRun(key) trong UI. */
export async function startRun({playerId, scenarioId, seed, noise}) {
  const key = await loadScenario(scenarioId)
  const r = replay(key, seed, noise, [])
  const doc = await writeClient.create({
    _type: 'run',
    kind: 'player',
    player: {_type: 'reference', _ref: playerId},
    scenario: {_type: 'reference', _ref: scenarioId},
    seed, noise, status: 'in_progress', quartersDone: 0, saved: false,
    startedAt: now(), decisions: [], states: toStates(r.H),
  })
  // Khóa kịch bản: lượt chơi được dựng lại từ thông số này, không được sửa nữa
  await writeClient.patch(scenarioId).set({locked: true}).commit()
  return doc
}

/** commit() trong UI: nút "Announce decision". Dùng _rev để chặn hai tab ghi đè nhau. */
export async function commitDecision(runId, playerId, input) {
  const doc = await getOwnRun(runId, playerId)
  if (doc.status !== 'in_progress') throw new Error('Nhiệm kỳ đã kết thúc')
  const key = await loadScenario(doc.scenario._ref)
  const n = (doc.decisions?.length ?? 0) + 1
  const decisions = [...(doc.decisions ?? []), {
    _key: `d${n}`, _type: 'decision', quarter: n,
    i: Math.min(12, Math.max(0, Math.round(input.i * 4) / 4)),
    qe: Math.min(5, Math.max(-4, Math.round(input.qe * 2) / 2)),
    fg: Math.min(2, Math.max(-2, Math.round(input.fg))),
    decidedAt: now(),
  }]
  const r = replay(key, doc.seed, doc.noise, decisions)
  const done = n >= engine.N_Q
  return writeClient
    .patch(runId)
    .ifRevisionId(doc._rev)
    .set({
      decisions, states: toStates(r.H), score: toScore(r), quartersDone: n,
      ...(done ? {status: 'completed', completedAt: now()} : {}),
    })
    .commit()
}

/** Nút "Go back 1 quarter". */
export async function undoQuarter(runId, playerId) {
  const doc = await getOwnRun(runId, playerId)
  if (!doc.decisions?.length) return doc
  const key = await loadScenario(doc.scenario._ref)
  const decisions = doc.decisions.slice(0, -1)
  const r = replay(key, doc.seed, doc.noise, decisions)
  return writeClient
    .patch(runId)
    .ifRevisionId(doc._rev)
    .set({decisions, states: toStates(r.H), score: toScore(r), quartersDone: decisions.length, status: 'in_progress'})
    .unset(['completedAt'])
    .commit()
}

/** Ô "Defend your decisions" (APP.notes). */
export async function updateNotes(runId, playerId, notes) {
  await getOwnRun(runId, playerId)
  return writeClient.patch(runId).set({notes: String(notes ?? '')}).commit()
}

/**
 * Nút "Save" trong tab Compare. Khác bản localStorage ở chỗ không chép snapshot,
 * chỉ đánh dấu lượt hiện tại là đã lưu. Lượt đã lưu không chơi tiếp được nữa.
 */
export async function saveStrategy(runId, playerId, name) {
  const doc = await getOwnRun(runId, playerId)
  if (!doc.quartersDone) throw new Error('Cần chơi ít nhất một quý trước khi lưu')
  const count = await writeClient.fetch(
    `count(*[_type == "run" && player._ref == $p && scenario._ref == $s && saved == true])`,
    {p: playerId, s: doc.scenario._ref},
  )
  return writeClient
    .patch(runId)
    .set({
      saved: true,
      name: (name ?? '').trim() || `Strategy ${count + 1}`,
      ...(doc.status === 'in_progress' ? {status: 'abandoned'} : {}),
    })
    .commit()
}

/** Nút "Save & restart": lưu lượt hiện tại rồi mở lượt mới cùng kịch bản và bộ sốc. */
export async function saveAndRestart(runId, playerId, name) {
  const saved = await saveStrategy(runId, playerId, name)
  return startRun({playerId, scenarioId: saved.scenario._ref, seed: saved.seed, noise: saved.noise})
}

/** Nút "Delete" của một chiến lược đã lưu. */
export async function deleteStrategy(runId, playerId) {
  await getOwnRun(runId, playerId)
  return writeClient.delete(runId)
}

/** benchmarks() trong UI. _id tất định nên mỗi tổ hợp (kịch bản, seed, noise) chỉ tính một lần. */
export async function ensureBenchmarks(scenarioId, seed, noise) {
  const key = await loadScenario(scenarioId)
  const tx = writeClient.transaction()
  for (const kind of ['taylor', 'hold']) {
    const _id = `bench.${Buffer.from(`${scenarioId}|${seed}|${noise}|${kind}`).toString('base64url')}`
    const r = engine.simulateStrategy(key, seed, noise, kind === 'taylor' ? engine.taylorDecision : engine.holdDecision)
    tx.createIfNotExists({
      _id, _type: 'run', kind,
      scenario: {_type: 'reference', _ref: scenarioId},
      seed, noise, status: 'completed', quartersDone: engine.N_Q,
      startedAt: now(), completedAt: now(),
      decisions: r.H.slice(1).map((h) => ({_key: `d${h.t}`, _type: 'decision', quarter: h.t, i: h.i, qe: h.qe, fg: h.fg})),
      states: toStates(r.H), score: toScore(r),
    })
  }
  return tx.commit()
}

/** Kiểm toán: dựng lại từ decisions và so với điểm đang lưu. */
export async function verifyRun(runId) {
  const doc = await writeClient.getDocument(runId)
  if (!doc) throw new Error('Không tìm thấy')
  const key = await loadScenario(doc.scenario._ref)
  const fresh = toScore(replay(key, doc.seed, doc.noise, doc.decisions ?? []))
  return {ok: Math.abs((fresh?.total ?? 0) - (doc.score?.total ?? 0)) < 1e-6, stored: doc.score?.total, recomputed: fresh?.total}
}
