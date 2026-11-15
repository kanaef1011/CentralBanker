// TAB 3 – EVALUATE: chấm điểm nhiệm kỳ, thống kê đánh đổi, nhật ký quyết định và bài giải trình.

import {
  N_Q,
  SCENARIOS,
  grade,
  holdDecision,
  scoreRun,
  simulateStrategy,
  taylorDecision,
} from "../core/model.js";
import { APP } from "../core/state.js";
import {
  $,
  SC,
  T,
  cur,
  esc,
  fgText,
  fmt,
  fmtS,
  pct,
  qShort,
} from "../core/utils.js";
import { setTab } from "../ui/header.js";
import { stPi } from "../ui/status.js";

// ===== 3. EVALUATE =====
// Bộ nhớ đệm (cache): chạy 2 chiến lược mẫu một lần rồi dùng lại, không phải tính lại mỗi lần vẽ.
export const benchCache = {};
export function benchmarks() {
  const k = `${APP.key}|${APP.run.seed}|${APP.run.noise}`;
  if (!benchCache[k]) {
    const ta = simulateStrategy(
      APP.key,
      APP.run.seed,
      APP.run.noise,
      taylorDecision,
    );
    const ho = simulateStrategy(
      APP.key,
      APP.run.seed,
      APP.run.noise,
      holdDecision,
    );
    benchCache[k] = {
      taylor: { run: ta, score: scoreRun(ta) },
      hold: { run: ho, score: scoreRun(ho) },
    };
  }
  return benchCache[k];
}
// Thống kê nhanh của một ván: số quý lạm phát trong 1–3%, thất nghiệp cao nhất, số lần thất hứa...
export function runStats(run) {
  const sc = SCENARIOS[run.key],
    H = run.H,
    rows = H.slice(1);
  const inBand = rows.filter((r) => r.pi >= 1 && r.pi <= 3).length;
  const maxU = Math.max(...H.map((r) => r.u)),
    minU = Math.min(...H.map((r) => r.u));
  const maxPi = Math.max(...H.map((r) => r.pi));
  const excessU = rows.reduce((a, r) => a + Math.max(0, r.u - sc.uStar), 0) / 4; // point-years
  const piDrop = H[0].pi - H[H.length - 1].pi;
  const peakI = Math.max(...H.map((r) => r.i));
  const brokenFG = rows.filter((r, k) => {
    const p = H[k];
    return (p.fg >= 1 && r.di < -0.01) || (p.fg <= -1 && r.di > 0.01);
  }).length;
  return {
    inBand,
    maxU,
    minU,
    maxPi,
    excessU,
    piDrop,
    peakI,
    brokenFG,
    n: rows.length,
  };
}
// Vẽ tab Evaluate. Nếu chưa chơi quý nào thì hiện lời nhắc.
export function renderEval() {
  const t = T(),
    sco = scoreRun(APP.run),
    sc = SC();
  if (!sco) {
    $("#v-eval").innerHTML =
      `<div class="panel stack" style="max-width:640px"><h2>Nothing to evaluate yet</h2><p>Set policy for at least one quarter. Scores cover the whole term, and later quarters count more because policy needs time to work.</p><div><button class="btn primary" id="goPlay">Go to the policy room</button></div></div>`;
    $("#goPlay").onclick = () => setTab("play");
    return;
  }
  const b = benchmarks(),
    st = runStats(APP.run);
  const parts = [
    [
      "Price stability",
      sco.parts.price,
      `Average gap of ${fmt(sco.ePi, 2)} pp from the 2% target. Inflation was within 1–3% in ${st.inBand}/${st.n} quarters.`,
      "30%",
    ],
    [
      "Jobs",
      sco.parts.jobs,
      `Unemployment averaged ${fmt(sco.eU, 2)} pp away from its natural rate of ${pct(sc.uStar)}. Peak: ${pct(st.maxU)}.`,
      "25%",
    ],
    [
      "Stable output",
      sco.parts.growth,
      `Demand averaged ${fmt(sco.eG, 2)}% away from productive capacity.`,
      "15%",
    ],
    [
      "Financial stability",
      sco.parts.fin,
      `Penalties for moving the rate more than 0.5 pp per quarter, trading assets above 2% of GDP per quarter, credit growth above 12% a year, or a balance sheet above 35% of GDP.`,
      "15%",
    ],
    [
      "Credibility",
      sco.parts.cred,
      `Credibility at end of term: ${Math.round(cur().c * 100)}/100. Times you acted against your guidance: ${st.brokenFG}.`,
      "15%",
    ],
  ];
  // Tỷ lệ hy sinh: phải chịu bao nhiêu thất nghiệp (điểm-năm) để giảm được 1 điểm % lạm phát.
  const sacrifice =
    st.piDrop <= 0.3
      ? "—"
      : st.excessU < 0.02
        ? "≈ 0"
        : fmt(st.excessU / st.piDrop, 2);
  const sacNote =
    st.piDrop <= 0.3
      ? "Only calculated when inflation fell by more than 0.3 pp."
      : st.excessU < 0.02
        ? "Inflation fell without unemployment rising above its natural rate. Check whether inflation actually reached target."
        : 'Point-years of unemployment above the natural rate paid for each 1 pp cut in inflation. Lower is "cheaper".';
  $("#v-eval").innerHTML = `<div class="stack">
    <div class="eval-top">
      <div class="panel gradebox"><span class="small muted">${t >= N_Q ? "Result for your term" : `Running score after ${t}/${N_Q} quarters`}</span><span class="grade">${grade(sco.total)}</span><span class="score">${Math.round(sco.total)} / 100 points</span>
        <span class="small muted">Under the same conditions:<br>Taylor rule ${Math.round(b.taylor.score.total)} (${grade(b.taylor.score.total)}) · Do nothing ${Math.round(b.hold.score.total)} (${grade(b.hold.score.total)})</span></div>
      <div class="panel stack"><h3>Score by objective</h3><div class="parts">${parts.map((p) => `<div class="part"><span><b>${p[0]}</b> <span class="small muted">· ${p[3]}</span></span><span class="pb"><span style="width:${p[1]}%"></span></span><b style="text-align:right">${Math.round(p[1])}</b><span class="pd">${p[2]}</span></div>`).join("")}</div></div>
    </div>
    <div class="panel stack"><h3>The trade-offs you made</h3>
      <div class="insights">
        <div class="ins"><div class="k">Inflation moved</div><div class="v">${pct(APP.run.H[0].pi)} → ${pct(cur().pi)}</div><div class="d">Peak during term: ${pct(st.maxPi)}</div></div>
        <div class="ins"><div class="k">Unemployment range</div><div class="v">${pct(st.minU)} – ${pct(st.maxU)}</div><div class="d">Natural rate ${pct(sc.uStar)}</div></div>
        <div class="ins"><div class="k">Sacrifice ratio</div><div class="v">${sacrifice}</div><div class="d">${sacNote}</div></div>
        <div class="ins"><div class="k">Peak policy rate</div><div class="v">${pct(st.peakI, 2)}</div><div class="d">Balance sheet at end: ${fmt(cur().B, 0)}% of GDP</div></div>
      </div>
      <p class="small muted">Note: these are results from a simplified model. In reality, policy effects also depend on expectations, fiscal policy, the global economy and many factors the model leaves out.</p>
    </div>
    <div class="panel stack"><h3>Decision log</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Quarter</th><th>Policy rate</th><th>QE/QT</th><th>Guidance</th><th>Inflation</th><th>Unemployment</th><th>GDP</th><th>Credibility</th><th>Event</th></tr></thead><tbody>
      ${APP.run.H.map((r) => `<tr><td>${qShort(r.t)}</td><td>${pct(r.i, 2)}${r.t ? ` <span class="muted small">${fmtS(r.di, 2)}</span>` : ""}</td><td>${r.t ? (Math.abs(r.qe) < 0.01 ? "—" : (r.qe > 0 ? "QE " : "QT ") + fmt(Math.abs(r.qe), 1)) : "—"}</td><td>${r.t ? fgText(r.fg).short : "—"}</td><td><span class="pill ${stPi(r.pi)[0]}">${pct(r.pi)}</span></td><td>${pct(r.u)}</td><td>${pct(r.g)}</td><td>${Math.round(r.c * 100)}</td><td class="l small">${r.event ? esc(r.event.title) : ""}</td></tr>`).join("")}
    </tbody></table></div></div>
    <div class="panel stack"><h3>Defend your decisions</h3>
      <p class="small muted">Write 4–6 sentences as if you were the Governor testifying before parliament: (1) the main problem you prioritised, (2) the tools you chose and how they work, (3) the trade-offs you accepted, (4) evidence from the charts, (5) what you would do differently.</p>
      <textarea id="notes" placeholder="Example: I prioritised bringing inflation back to target because inflation expectations were rising and credibility had fallen to 55/100. I raised the policy rate by 3 pp over the first two quarters…">${esc(APP.notes)}</textarea>
      <div class="row"><button class="btn" id="btnCopy">Copy report</button><span class="small muted" id="copyMsg"></span></div>
    </div></div>`;
  $("#notes").oninput = (e) => {
    APP.notes = e.target.value;
  };
  // Sao chép báo cáo: navigator.clipboard ghi vào bộ nhớ tạm, await chờ cho xong.
  // Trình duyệt có thể chặn, nên bọc trong try/catch.
  $("#btnCopy").onclick = async () => {
    const txt = reportText();
    const msg = $("#copyMsg");
    try {
      await navigator.clipboard.writeText(txt);
      msg.textContent = "Copied. Paste it into your assignment or a message.";
    } catch (e) {
      msg.textContent =
        "Your browser blocked copying. Select the log and your argument and copy them by hand.";
    }
  };
}
// Tạo báo cáo dạng chữ thuần (mỗi phần tử mảng là một dòng).
export function reportText() {
  const sco = scoreRun(APP.run),
    sc = SC();
  const lines = [
    `CENTRAL BANK SIMULATOR — ${sc.name}`,
    `Result: ${Math.round(sco.total)}/100 (${grade(sco.total)}) after ${T()}/${N_Q} quarters`,
    `Price stability ${Math.round(sco.parts.price)} · Jobs ${Math.round(sco.parts.jobs)} · Output ${Math.round(sco.parts.growth)} · Financial ${Math.round(sco.parts.fin)} · Credibility ${Math.round(sco.parts.cred)}`,
    "",
    "Quarter | Policy rate | QE/QT | Guidance | Inflation | Unemployment | GDP",
  ];
  APP.run.H.forEach((r) =>
    lines.push(
      `${qShort(r.t)} | ${pct(r.i, 2)} | ${r.t ? fmtS(r.qe, 1) : "—"} | ${r.t ? fgText(r.fg).short : "—"} | ${pct(r.pi)} | ${pct(r.u)} | ${pct(r.g)}`,
    ),
  );
  lines.push("", "My argument:", APP.notes || "(not written yet)");
  return lines.join("\n");
}
