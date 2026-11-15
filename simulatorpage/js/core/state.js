import { N_Q, forecast, initRun } from "./model.js";
import { DEFAULT_SEED, T, cur } from "./utils.js";

// ===== STATE =====
export const APP = {
  key: "lam-phat",
  tab: "brief",
  seed: DEFAULT_SEED,
  noise: true,
  run: null,
  dec: null,
  notes: "",
  saved: [],
  hidden: {},
};
export function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem("cbsim.saved.v1") || "[]");
    if (Array.isArray(s)) APP.saved = s;
  } catch (e) {
    APP.saved = [];
  }
}
export function storeSaved() {
  try {
    localStorage.setItem("cbsim.saved.v1", JSON.stringify(APP.saved));
  } catch (e) {
    /* ignore */
  }
}

export function newRun(key) {
  APP.key = key;
  APP.run = initRun(key, APP.seed);
  APP.run.noise = APP.noise;
  APP.notes = "";
  resetDec();
}
export function resetDec() {
  const s = cur();
  APP.dec = { i: s.i, qe: 0, fg: s.fg };
}
// Staff baseline forecast: policy left unchanged, no knowledge of future events or surprises. Never uses the draft decision.
export function baseFc() {
  const t = T(),
    s = cur();
  if (t >= N_Q) return [];
  return forecast(APP.run, { i: s.i, qe: 0, fg: s.fg }, Math.min(4, N_Q - t));
}
