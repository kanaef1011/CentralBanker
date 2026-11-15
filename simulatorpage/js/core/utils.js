import { FG_LEVELS, SCENARIOS } from "./model.js";
import { APP } from "./state.js";

// ===== UTILITIES =====
export const $ = (s) => document.querySelector(s);
export const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
export const fmt = (x, d = 1) => {
  if (x === null || x === undefined || isNaN(x)) return "—";
  const v = Math.abs(x) < Math.pow(10, -d) / 2 ? 0 : x;
  return (v < 0 ? "−" : "") + Math.abs(v).toFixed(d);
};
export const fmtS = (x, d = 1) => {
  const v = Math.abs(x) < Math.pow(10, -d) / 2 ? 0 : x;
  return (v > 0 ? "+" : "") + fmt(v, d);
};
export const pct = (x, d = 1) => fmt(x, d) + "%";
export const qName = (t) =>
  t === 0
    ? "Start of term"
    : `Year ${Math.ceil(t / 4)} · Q${((t - 1) % 4) + 1}`;
export const qShort = (t) => (t === 0 ? "Start" : "Q" + t);
export const SC = () => SCENARIOS[APP.key];
export const cur = () => APP.run.H[APP.run.H.length - 1];
export const T = () => APP.run.H.length - 1;
export const fgText = (v) => FG_LEVELS.find((f) => f.v === v);
export const DEFAULT_SEED = 2026;
export const CMP_COLORS = [
  "var(--accent)",
  "#bf3d2a",
  "#2b5c9c",
  "#a87a26",
  "#7b52a8",
  "#6b7a73",
];
