// TAB 4 – COMPARE: lưu chiến lược và so sánh với quy tắc Taylor và "không làm gì" trên cùng bộ sốc.

import { N_Q, grade, scoreRun } from '../core/model.js';
import { APP, newRun, storeSaved } from '../core/state.js';
import { $, CMP_COLORS, SC, T, cur, esc, fmt, pct, qShort } from '../core/utils.js';
import { chartBox, drawChart, series } from '../ui/charts.js';
import { setTab } from '../ui/header.js';
import { benchmarks } from './evaluate.js';

// ===== 4. COMPARE =====
// Danh sách các đường để so sánh: ván hiện tại, 2 chiến lược mẫu và các chiến lược đã lưu.
export function compareList() {
  const b = benchmarks();
  const list = [{ id: 'current', name: 'Current term' + (T() < N_Q ? ` (to ${qShort(T())})` : ''), H: APP.run.H, score: scoreRun(APP.run), kind: 'cur' },
    { id: 'taylor', name: 'Taylor rule (benchmark)', H: b.taylor.run.H, score: b.taylor.score, kind: 'bench' },
    { id: 'hold', name: 'Do nothing (benchmark)', H: b.hold.run.H, score: b.hold.score, kind: 'bench' }];
  APP.saved.filter(s => s.key === APP.key).forEach(s => list.push({ id: s.id, name: s.name, H: s.H, score: s.score, kind: 'saved', diff: s.seed !== APP.run.seed || s.noise !== APP.run.noise, notes: s.notes }));
  return list.map((x, k) => ({ ...x, color: CMP_COLORS[k % CMP_COLORS.length] }));
}
// Vẽ tab So sánh: ô lưu, danh sách bật/tắt, 4 biểu đồ và bảng điểm.
export function renderCompare() {
  const list = compareList(), vis = list.filter(x => !APP.hidden[x.id]);
  const canSave = T() > 0;
  $('#v-compare').innerHTML = `<div class="stack">
    <div class="two">
      <div class="panel stack"><h3>Save the current strategy</h3>
        <p class="small muted">Save this term, click "Restart scenario" and try a different approach under the same conditions, then compare.</p>
        <div class="row"><input type="text" id="saveName" placeholder="e.g. Hike hard early" value="" style="flex:1" ${canSave ? '' : 'disabled'}><button class="btn primary" id="btnSave" ${canSave ? '' : 'disabled'}>Save</button><button class="btn" id="btnSaveReset" ${canSave ? '' : 'disabled'}>Save & restart</button></div>
        ${canSave ? '' : '<p class="small muted">Set policy for at least one quarter before saving.</p>'}
      </div>
      <div class="panel stack"><h3>Strategies to show · ${SC().name}</h3><div class="cmp-list">
        ${list.map(x => `<label class="cmp-item" for="cb-${x.id}"><input type="checkbox" id="cb-${x.id}" data-id="${x.id}" ${APP.hidden[x.id] ? '' : 'checked'}><span class="sw" style="background:${x.color}"></span><span>${esc(x.name)}${x.diff ? ' <span class="pill warn">different shock set</span>' : ''}</span>${x.kind === 'saved' ? `<button class="x" data-del="${x.id}">Delete</button>` : ''}</label>`).join('')}
      </div></div>
    </div>
    <div class="charts">
      ${chartBox('cPi', 'Inflation', vis.map(x => ({ n: x.name, c: x.color })), 'green band: 1–3%')}
      ${chartBox('cU', 'Unemployment', vis.map(x => ({ n: x.name, c: x.color })))}
      ${chartBox('cY', 'Demand vs capacity (%)', vis.map(x => ({ n: x.name, c: x.color })))}
      ${chartBox('cI', 'Policy rate', vis.map(x => ({ n: x.name, c: x.color })))}
    </div>
    <div class="panel stack"><h3>Comparison table</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Strategy</th><th>Total</th><th>Prices</th><th>Jobs</th><th>Output</th><th>Financial</th><th>Credibility</th><th>Final inflation</th><th>Peak unemployment</th><th>Peak rate</th><th>Max balance sheet</th></tr></thead><tbody>
      ${list.map(x => { const s = x.score, H = x.H, l = H[H.length - 1]; return `<tr><td><span class="sw" style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${x.color};margin-right:6px"></span>${esc(x.name)}</td><td><b>${s ? Math.round(s.total) + ' · ' + grade(s.total) : '—'}</b></td><td>${s ? Math.round(s.parts.price) : '—'}</td><td>${s ? Math.round(s.parts.jobs) : '—'}</td><td>${s ? Math.round(s.parts.growth) : '—'}</td><td>${s ? Math.round(s.parts.fin) : '—'}</td><td>${s ? Math.round(s.parts.cred) : '—'}</td><td>${pct(l.pi)}</td><td>${pct(Math.max(...H.map(r => r.u)))}</td><td>${pct(Math.max(...H.map(r => r.i)), 2)}</td><td>${fmt(Math.max(...H.map(r => r.B)), 0)}% GDP</td></tr>`; }).join('')}
    </tbody></table></div>
    <p class="small muted"><b>Taylor rule</b> (John Taylor, 1993): policy rate = neutral real rate + inflation + 0.5 × (inflation − 2%) + 0.5 × output gap, adjusted gradually, with QE when the rate hits 0%. It is a reference point, not the right answer: in some scenarios other strategies do better.</p></div>
  </div>`;
  const ser = (k, d) => vis.map(x => ({ name: x.name, data: series(x.H, k), color: x.color, w: x.kind === 'cur' ? 2.75 : 2, end: 1, d }));
  drawChart($('#cPi'), { title: 'Inflation', band: [1, 3], refs: [{ y: 2, label: 'Target' }], zero: true, series: ser('pi') });
  drawChart($('#cU'), { title: 'Unemployment', refs: [{ y: SC().uStar, label: 'Natural' }], series: ser('u') });
  drawChart($('#cY'), { title: 'Demand', zero: true, series: ser('y') });
  drawChart($('#cI'), { title: 'Policy rate', floor0: true, series: vis.map(x => ({ name: x.name, data: series(x.H, 'i'), color: x.color, step: 1, w: x.kind === 'cur' ? 2.75 : 2, d: 2 })) });
  document.querySelectorAll('.cmp-item input').forEach(c => c.onchange = () => { APP.hidden[c.dataset.id] = !c.checked; renderCompare(); });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = e => { e.preventDefault(); APP.saved = APP.saved.filter(s => s.id !== b.dataset.del); storeSaved(); renderCompare(); });
  // Chỉ lưu những trường cần để vẽ lại, cho gọn bộ nhớ localStorage.
  const save = () => {
    const nm = ($('#saveName').value || '').trim() || `Strategy ${APP.saved.filter(s => s.key === APP.key).length + 1}`;
    const H = APP.run.H.map(r => ({ t: r.t, pi: r.pi, u: r.u, y: r.y, g: r.g, i: r.i, B: r.B, qe: r.qe, fg: r.fg, c: r.c, di: r.di || 0, credit: r.credit }));
    APP.saved.push({ id: 's' + Date.now(), name: nm, key: APP.key, seed: APP.run.seed, noise: APP.run.noise, H, score: scoreRun(APP.run), notes: APP.notes });
    storeSaved();
  };
  if (canSave) {
    $('#btnSave').onclick = () => { save(); renderCompare(); };
    $('#btnSaveReset').onclick = () => { save(); newRun(APP.key); setTab('play'); };
  }
}
