import { APP, loadSaved, newRun } from "./core/state.js";
import { renderHeader, setTab } from "./ui/header.js";
import { renderADAS } from "./views/adas.js";
import { renderBrief } from "./views/briefing.js";
import { renderCompare } from "./views/compare.js";
import { renderEval } from "./views/evaluate.js";
import { renderLearn } from "./views/learn.js";
import { renderCharts, renderPlay } from "./views/policy-room.js";

// ===== STARTUP =====
export function renderAll() {
  renderHeader();
  if (APP.tab === "brief") renderBrief();
  if (APP.tab === "play") renderPlay();
  if (APP.tab === "eval") renderEval();
  if (APP.tab === "compare") renderCompare();
  if (APP.tab === "learn") renderLearn();
}
document
  .querySelectorAll("nav.tabs button")
  .forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));
export let rz = null;
window.addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    if (APP.tab === "play") {
      renderCharts();
      renderADAS();
    }
    if (APP.tab === "compare") renderCompare();
  }, 120);
});
loadSaved();
newRun("lam-phat");
export let startTab = "brief";
if (
  location.hash &&
  ["brief", "play", "eval", "compare", "learn"].includes(location.hash.slice(1))
)
  startTab = location.hash.slice(1);
setTab(startTab);
