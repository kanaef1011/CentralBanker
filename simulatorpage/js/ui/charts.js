import { N_Q, forecast } from "../core/model.js";
import { $, esc, fmt, qShort } from "../core/utils.js";

// ===== SVG CHARTS =====
export function niceStep(range) {
  const raw = range / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}
export function drawChart(box, cfg) {
  const svgHost = box.querySelector(".svgh");
  const W = Math.max(240, svgHost.clientWidth || 300),
    H = cfg.h || 150;
  const m = { l: 34, r: 8, t: 8, b: 20 };
  const n = N_Q;
  const pad = 8;
  const X = (i) => m.l + pad + (i * (W - m.l - m.r - 2 * pad)) / n;
  let vals = [];
  cfg.series.forEach((s) =>
    (s.type === "fan" ? s.lo.concat(s.hi) : s.data).forEach((v) => {
      if (v !== null && v !== undefined && !isNaN(v)) vals.push(v);
    }),
  );
  (cfg.refs || []).forEach((r) => vals.push(r.y));
  if (cfg.band) vals.push(cfg.band[0], cfg.band[1]);
  if (cfg.zero) vals.push(0);
  let lo = Math.min(...vals),
    hi = Math.max(...vals);
  if (hi - lo < (cfg.minRange || 2)) {
    const c = (hi + lo) / 2;
    lo = c - (cfg.minRange || 2) / 2;
    hi = c + (cfg.minRange || 2) / 2;
  }
  const step = niceStep(hi - lo);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  if (cfg.floor0 && lo < 0 && Math.min(...vals) >= 0) lo = 0;
  const Y = (v) => m.t + ((hi - v) * (H - m.t - m.b)) / (hi - lo);
  let g = "";
  for (let v = lo; v <= hi + 1e-9; v += step) {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/>`;
    g += `<text x="${m.l - 5}" y="${Y(v) + 3.5}" text-anchor="end">${fmt(v, step < 1 ? (step < 0.5 ? 2 : 1) : 0)}</text>`;
  }
  for (let i = 0; i <= n; i += W < 360 ? 2 : 1)
    g += `<text x="${X(i)}" y="${H - 5}" text-anchor="middle">${i}</text>`;
  if (cfg.band)
    g += `<rect x="${m.l}" width="${W - m.l - m.r}" y="${Y(cfg.band[1])}" height="${Y(cfg.band[0]) - Y(cfg.band[1])}" fill="var(--good)" opacity=".09"/>`;
  (cfg.refs || []).forEach((r) => {
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(r.y)}" y2="${Y(r.y)}" stroke="var(--muted)" stroke-dasharray="3 3" stroke-width="1"/>`;
    g += `<text x="${W - m.r - 2}" y="${Y(r.y) - 4}" text-anchor="end">${esc(r.label)}</text>`;
  });
  if (cfg.zero && lo < 0)
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--muted)" stroke-width="1"/>`;
  if (cfg.now !== undefined)
    g += `<line x1="${X(cfg.now)}" x2="${X(cfg.now)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--muted)" stroke-width="1" opacity=".5"/>`;
  cfg.series.forEach((s) => {
    if (s.type === "fan") {
      const idx = s.lo
        .map((v, i) => (v === null || v === undefined ? null : i))
        .filter((i) => i !== null);
      if (idx.length > 1)
        g += `<path d="M${idx.map((i) => X(i) + "," + Y(s.hi[i])).join("L")}L${idx
          .slice()
          .reverse()
          .map((i) => X(i) + "," + Y(s.lo[i]))
          .join("L")}Z" fill="${s.color}" opacity=".12"/>`;
      return;
    }
    if (s.type === "bar") {
      const bw = Math.max(3, ((W - m.l - m.r - 2 * pad) / n) * 0.55);
      s.data.forEach((v, i) => {
        if (v === null || v === undefined) return;
        const y0 = Y(Math.max(lo, 0)),
          y1 = Y(v);
        g += `<rect x="${X(i) - bw / 2}" width="${bw}" y="${Math.min(y0, y1)}" height="${Math.max(1, Math.abs(y1 - y0))}" rx="1.5" fill="${s.color}" opacity="${s.dash ? 0.35 : 0.85}"/>`;
      });
      return;
    }
    let d = "",
      started = false,
      pts = [];
    s.data.forEach((v, i) => {
      if (v === null || v === undefined || isNaN(v)) {
        started = false;
        return;
      }
      if (s.step && started) d += `L${X(i)},${Y(s.data[i - 1])}`;
      d += (started ? "L" : "M") + X(i) + "," + Y(v);
      started = true;
      pts.push([i, v]);
    });
    if (!pts.length) return;
    if (s.area && pts.length > 1) {
      const base = Y(
        Math.max(lo, Math.min(hi, s.areaBase !== undefined ? s.areaBase : lo)),
      );
      g += `<path d="${d}L${X(pts[pts.length - 1][0])},${base}L${X(pts[0][0])},${base}Z" fill="${s.color}" opacity=".08"/>`;
    }
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2}" ${s.dash ? 'stroke-dasharray="4 3"' : ""} stroke-linejoin="round" stroke-linecap="round" opacity="${s.op || 1}"/>`;
    if (s.end) {
      const [i, v] = pts[pts.length - 1];
      g += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="${s.color}" stroke="var(--surface)" stroke-width="1.5"/>`;
    }
  });
  g += `<line class="guide" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink)" stroke-width="1" opacity="0"/>`;
  g += `<rect class="hit" x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent"/>`;
  svgHost.innerHTML = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(cfg.title || "")}">${g}</svg>`;
  const svg = svgHost.querySelector("svg"),
    tip = box.querySelector(".tip"),
    guide = svg.querySelector(".guide");
  const show = (e) => {
    const rect = svg.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const i = Math.max(
      0,
      Math.min(
        n,
        Math.round(
          ((px * W) / rect.width - m.l - pad) / ((W - m.l - m.r - 2 * pad) / n),
        ),
      ),
    );
    const rows = cfg.series.filter(
      (s) =>
        s.type !== "fan" &&
        !s.noTip &&
        s.data[i] !== null &&
        s.data[i] !== undefined &&
        !isNaN(s.data[i]),
    );
    if (!rows.length) {
      tip.style.display = "none";
      guide.setAttribute("opacity", 0);
      return;
    }
    guide.setAttribute("x1", X(i));
    guide.setAttribute("x2", X(i));
    guide.setAttribute("opacity", 0.35);
    tip.innerHTML =
      `<b>${qShort(i)}</b>${cfg.now !== undefined && i > cfg.now ? " · staff forecast" : ""}<br>` +
      rows
        .map(
          (s) =>
            `<span class="sw" style="background:${s.color}"></span>${esc(s.name)}: ${fmt(s.data[i], s.d ?? 1)}${s.unit ?? "%"}`,
        )
        .join("<br>");
    tip.style.display = "block";
    const bx = (X(i) * rect.width) / W + 10;
    tip.style.left = Math.min(bx, rect.width - tip.offsetWidth - 4) + "px";
    tip.style.top = "34px";
  };
  svg.addEventListener("mousemove", show);
  svg.addEventListener("touchstart", show, { passive: true });
  svg.addEventListener("mouseleave", () => {
    tip.style.display = "none";
    guide.setAttribute("opacity", 0);
  });
}
export function chartBox(id, title, legend, note) {
  return `<div class="chart" id="${id}"><div class="ct"><b>${title}</b>${note ? `<span class="small muted">${note}</span>` : ""}</div>
  <div class="legend">${legend.map((l) => `<span><i class="${l.dash ? "dash" : ""}" style="background:${l.c};color:${l.c}"></i>${l.n}</span>`).join("")}</div>
  <div class="svgh"></div><div class="tip"></div></div>`;
}
export const series = (H, k) => {
  const a = new Array(N_Q + 1).fill(null);
  H.forEach((r) => (a[r.t] = typeof k === "function" ? k(r) : r[k]));
  return a;
};
