import { N_Q, grade, scoreRun } from "../core/model.js";
import { APP } from "../core/state.js";
import { $, SC, T, cur } from "../core/utils.js";
import { renderAll } from "../main.js";

// ===== HEADER & TABS =====
export function renderHeader() {
  const t = T(),
    s = cur(),
    sc = SC();
  $("#hScen").textContent = sc.name;
  $("#hQlabel").textContent =
    t >= N_Q ? "Term complete" : `${t}/${N_Q} quarters done`;
  let q = "";
  for (let k = 1; k <= N_Q; k++)
    q += `<i class="${k <= t ? "on" : ""} ${k > 1 && (k - 1) % 4 === 0 ? "y" : ""}"></i>`;
  $("#hQbar").innerHTML = q;
  $("#hCred").style.width = Math.round(s.c * 100) + "%";
  $("#hCredV").textContent = Math.round(s.c * 100) + "/100";
  const sco = scoreRun(APP.run);
  $("#hScore").textContent = sco
    ? `${Math.round(sco.total)} pts · ${grade(sco.total)}`
    : "Not yet";
}
export function setTab(tab) {
  APP.tab = tab;
  document
    .querySelectorAll("nav.tabs button")
    .forEach((b) =>
      b.setAttribute("aria-selected", b.dataset.tab === tab ? "true" : "false"),
    );
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.toggle("on", v.id === "v-" + tab));
  renderAll();
}
