import { PI_TARGET } from "../core/model.js";
import { SC } from "../core/utils.js";

// ===== INDICATOR STATUS =====
export function stPi(x) {
  if (x < 0) return ["bad", "Deflation"];
  const d = Math.abs(x - PI_TARGET);
  if (d <= 0.5) return ["good", "On target"];
  if (d <= 1.5) return ["warn", x > PI_TARGET ? "A bit high" : "A bit low"];
  return ["bad", x > PI_TARGET ? "Too high" : "Too low"];
}
export function stU(x) {
  const d = x - SC().uStar;
  if (Math.abs(d) <= 0.4) return ["good", "Near natural rate"];
  if (d < 0) return ["warn", "Tight labour market"];
  return [d > 1.2 ? "bad" : "warn", "High unemployment"];
}
export function stG(x) {
  const g = SC().gPot;
  if (x < 0) return ["bad", "Contracting"];
  if (Math.abs(x - g) <= 0.75) return ["good", "Sustainable"];
  return ["warn", x > g ? "Running hot" : "Sluggish"];
}
export function stY(x) {
  if (Math.abs(x) <= 0.5) return ["good", "Balanced"];
  if (x > 0) return [x > 1.5 ? "bad" : "warn", "Excess demand"];
  return [x < -1.5 ? "bad" : "warn", "Weak demand"];
}
export function stF(f) {
  if (f > 0.4) return ["neu", "Tight"];
  if (f < -0.4) return ["neu", "Loose"];
  return ["neu", "Neutral"];
}
