import { $ } from "../core/utils.js";

// ===== DIALOGS =====
export let lastFocus = null;
export function openDialog(html) {
  lastFocus = document.activeElement;
  $("#dlg").innerHTML = html;
  $("#ov").classList.add("on");
  const f = $("#dlg").querySelector("button");
  if (f) f.focus();
}
export function closeDialog() {
  $("#ov").classList.remove("on");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
export function confirmIf(need, title, text, fn) {
  if (!need) {
    fn();
    return;
  }
  openDialog(
    `<h2>${title}</h2><p>${text}</p><div class="row"><button class="btn primary" id="cYes">Confirm</button><button class="btn" id="cNo">Cancel</button></div>`,
  );
  $("#cYes").onclick = () => {
    closeDialog();
    fn();
  };
  $("#cNo").onclick = closeDialog;
}
$("#ov").addEventListener("click", (e) => {
  if (e.target.id === "ov") closeDialog();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#ov").classList.contains("on")) closeDialog();
});
