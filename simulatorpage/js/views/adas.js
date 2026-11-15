import { APP } from "../core/state.js";
import { $, T, cur, fmt, fmtS, pct, qName } from "../core/utils.js";
import { learnDialog } from "./learn.js";

// ===== AD–AS GRAPH (actual state only; does not react to the draft decision) =====
export const S_AD = 1.0,
  S_AS = 0.5; // illustrative slopes
export function adasDiag(y, pi) {
  if (y > 0.5 && pi > 3)
    return "Demand too strong: output above potential (right of LRAS), inflation above target.";
  if (y < -0.5 && pi > 3)
    return "Stagflation: SRAS has shifted up, so output is below potential but inflation is still high.";
  if (y < -0.5 && pi < 1.5)
    return "Weak demand: output below potential (left of LRAS), inflation below target.";
  if (y > 0.5 && pi < 1.5)
    return "High output with low inflation: supply conditions are favourable.";
  if (y < -0.5) return "Output below potential: there is spare capacity.";
  if (y > 0.5) return "Output above potential: the economy is running hot.";
  if (pi > 3)
    return "Output near potential but inflation still high: expectations have not come down yet.";
  if (pi < 1) return "Output near potential but inflation is low.";
  return "Close to ideal: equilibrium near LRAS and the 2% target.";
}
export function adasShiftText(r, p) {
  const dAD = r.y - p.y + (r.pi - p.pi) / S_AD;
  const dAS = r.pi - p.pi - S_AS * (r.y - p.y);
  const pickReason = (comps, sign) => {
    const c = comps
      .filter((x) => Math.sign(x[0]) === sign && Math.abs(x[0]) > 0.03)
      .sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]))[0];
    return c ? c[1] : null;
  };
  let s = [];
  if (Math.abs(dAD) > 0.15) {
    const sg = Math.sign(dAD);
    const why = pickReason(
      [
        [
          r.cy.fin,
          sg < 0
            ? "high borrowing costs (a lagged effect of earlier quarters)"
            : "cheaper borrowing (a lagged effect of earlier quarters)",
        ],
        [
          r.cy.demand,
          sg < 0
            ? "an outside event that cut spending"
            : "an outside event that boosted spending",
        ],
        [r.cy.inertia, "the economy gradually correcting towards potential"],
        [r.cy.shock, "surprises outside the model"],
      ],
      sg,
    );
    s.push(
      `<b>AD shifted ${sg < 0 ? "left" : "right"}</b>${why ? " because of " + why : ""}.`,
    );
  } else s.push("AD barely moved.");
  if (Math.abs(dAS) > 0.15) {
    const sg = Math.sign(dAS);
    const why = pickReason(
      [
        [
          r.cpi.expect,
          sg > 0
            ? "inflation expectations and price inertia"
            : "cooling inflation expectations",
        ],
        [
          r.cpi.supply,
          sg > 0
            ? "rising input costs (a supply shock)"
            : "falling input costs",
        ],
        [
          r.cpi.demand,
          sg > 0
            ? "wage pressure in a tight labour market"
            : "easing wage pressure as unemployment rises",
        ],
        [r.cpi.shock, "surprises outside the model"],
      ],
      sg,
    );
    s.push(
      `<b>SRAS shifted ${sg > 0 ? "up (less supply)" : "down (more supply)"}</b>${why ? " because of " + why : ""}.`,
    );
  } else s.push("SRAS barely moved.");
  return s.join(" ");
}
export function renderADAS() {
  const box = $("#adas");
  if (!box) return;
  const t = T(),
    r = cur(),
    p = t > 0 ? APP.run.H[t - 1] : null;
  box.innerHTML = `<div class="row" style="justify-content:space-between"><h3 style="margin:0">Where the economy is now</h3><button class="info" data-learn="adas">How to read this</button></div>
    <div class="adas-svg"></div>
    <div class="legend"><span><i style="background:var(--s-u)"></i>AD</span><span><i style="background:var(--s-pi)"></i>SRAS</span><span><i style="background:var(--ink)"></i>LRAS</span>${p ? '<span><i class="dash" style="color:var(--muted)"></i>last quarter</span>' : ""}</div>
    <p class="small"><b>Equilibrium</b> <span style="color:var(--brass)">●</span> output ${fmtS(r.y)}% vs potential, inflation ${pct(r.pi)}. ${adasDiag(r.y, r.pi)}</p>
    ${p ? `<p class="small muted" style="margin-top:4px">${qName(t)}: ${adasShiftText(r, p)}</p>` : ""}
    <p class="small muted" style="margin-top:4px">AD shifts gradually over several quarters: today's decision mostly shows up on this graph 1–3 quarters later.</p>`;
  box.querySelector("[data-learn]").onclick = () => learnDialog("adas");
  const host = box.querySelector(".adas-svg");
  const W = Math.max(240, host.clientWidth || 270),
    H = 236;
  const m = { l: 26, r: 10, t: 22, b: 34 };
  const pts = [[r.y, r.pi]].concat(p ? [[p.y, p.pi]] : []);
  const R = Math.max(4, ...pts.map((q) => Math.abs(q[0]) + 1.8));
  let lo = Math.min(0, ...pts.map((q) => q[1] - 2.5)),
    hi = Math.max(5, ...pts.map((q) => q[1] + 2.5));
  lo = Math.floor(lo);
  hi = Math.ceil(hi);
  const X = (x) => m.l + ((x + R) / (2 * R)) * (W - m.l - m.r);
  const Y = (v) => m.t + ((hi - v) / (hi - lo)) * (H - m.t - m.b);
  const adLine = (q) => {
    const x1 = -R,
      x2 = R;
    return [
      X(x1),
      Y(q[1] - S_AD * (x1 - q[0])),
      X(x2),
      Y(q[1] - S_AD * (x2 - q[0])),
    ];
  };
  const asLine = (q) => {
    const x1 = -R,
      x2 = R;
    return [
      X(x1),
      Y(q[1] + S_AS * (x1 - q[0])),
      X(x2),
      Y(q[1] + S_AS * (x2 - q[0])),
    ];
  };
  const ln = (c, col, w, dash, op) =>
    `<line x1="${c[0]}" y1="${c[1]}" x2="${c[2]}" y2="${c[3]}" stroke="${col}" stroke-width="${w}" ${dash ? 'stroke-dasharray="4 3"' : ""} opacity="${op || 1}" stroke-linecap="round"/>`;
  let g = `<defs><clipPath id="adClip"><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/></clipPath>
    <marker id="arrAD" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--s-u)"/></marker>
    <marker id="arrAS" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--s-pi)"/></marker></defs>`;
  // frame & axes
  g += `<line x1="${m.l}" y1="${H - m.b}" x2="${W - m.r}" y2="${H - m.b}" stroke="var(--muted)"/><line x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${H - m.b}" stroke="var(--muted)"/>`;
  for (let v = lo; v <= hi; v += hi - lo > 8 ? 2 : 1)
    g += `<text x="${m.l - 5}" y="${Y(v) + 3.5}" text-anchor="end">${fmt(v, 0)}</text>`;
  g += `<text x="${m.l}" y="${H - m.b + 13}" text-anchor="start">${fmtS(-R, 0)}%</text><text x="${W - m.r}" y="${H - m.b + 13}" text-anchor="end">${fmtS(R, 0)}%</text>`;
  g += `<text x="${(m.l + W - m.r) / 2}" y="${H - 4}" text-anchor="middle">Real output vs potential →</text>`;
  g += `<text x="0" y="11">↑ Price level / inflation (%)</text>`;
  // inflation target
  g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(2)}" y2="${Y(2)}" stroke="var(--good)" stroke-dasharray="3 3" opacity=".8"/><text x="${W - m.r - 2}" y="${Y(2) + 12}" text-anchor="end" style="fill:var(--good)">Target 2%</text>`;
  // LRAS
  g += `<line x1="${X(0)}" x2="${X(0)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink)" stroke-width="2"/><text x="${X(0) + 4}" y="${m.t + 22}" style="fill:var(--ink);font-weight:600">LRAS</text><text x="${X(0)}" y="${H - m.b + 13}" text-anchor="middle" style="fill:var(--ink)">Y*</text>`;
  g += `<g clip-path="url(#adClip)">`;
  if (p)
    g +=
      ln(adLine([p.y, p.pi]), "var(--s-u)", 1.5, 1, 0.45) +
      ln(asLine([p.y, p.pi]), "var(--s-pi)", 1.5, 1, 0.45);
  g +=
    ln(adLine([r.y, r.pi]), "var(--s-u)", 2.5) +
    ln(asLine([r.y, r.pi]), "var(--s-pi)", 2.5);
  // shift arrows
  if (p) {
    const piA = r.pi + 0.35 * (hi - r.pi);
    const xo = p.y + (p.pi - piA) / S_AD,
      xn = r.y + (r.pi - piA) / S_AD;
    if (Math.abs(xn - xo) > 0.15)
      g += `<line x1="${X(xo)}" y1="${Y(piA)}" x2="${X(xn)}" y2="${Y(piA)}" stroke="var(--s-u)" stroke-width="1.5" marker-end="url(#arrAD)"/>`;
    const x0 = Math.min(R * 0.7, Math.max(r.y, p.y) + 1.2);
    const yo = p.pi + S_AS * (x0 - p.y),
      yn = r.pi + S_AS * (x0 - r.y);
    if (Math.abs(yn - yo) > 0.15)
      g += `<line x1="${X(x0)}" y1="${Y(yo)}" x2="${X(x0)}" y2="${Y(yn)}" stroke="var(--s-pi)" stroke-width="1.5" marker-end="url(#arrAS)"/>`;
    g += `<circle cx="${X(p.y)}" cy="${Y(p.pi)}" r="4" fill="var(--surface)" stroke="var(--muted)" stroke-width="1.5"/>`;
  }
  g += `</g>`;
  // curve labels
  const adEndY = Math.min(
    H - m.b - 4,
    Math.max(m.t + 10, Y(r.pi - S_AD * (R * 0.8 - r.y))),
  );
  g += `<text x="${X(R * 0.8)}" y="${adEndY - 4}" text-anchor="middle" style="fill:var(--s-u);font-weight:600">AD</text>`;
  const asLblY = Math.min(
    H - m.b - 4,
    Math.max(m.t + 10, Y(r.pi + S_AS * (-R * 0.8 - r.y))),
  );
  g += `<text x="${X(-R * 0.8)}" y="${asLblY - 5}" text-anchor="middle" style="fill:var(--s-pi);font-weight:600">SRAS</text>`;
  // equilibrium
  g += `<line x1="${X(r.y)}" x2="${X(r.y)}" y1="${Y(r.pi)}" y2="${H - m.b}" stroke="var(--brass)" stroke-dasharray="2 3"/>`;
  g += `<circle cx="${X(r.y)}" cy="${Y(r.pi)}" r="5" fill="var(--brass)" stroke="var(--surface)" stroke-width="1.5"/>`;
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Aggregate demand and supply graph: output ${fmtS(r.y)}% vs potential, inflation ${pct(r.pi)}">${g}</svg>`;
}
