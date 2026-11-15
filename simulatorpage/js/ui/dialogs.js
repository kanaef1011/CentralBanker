// HỘP THOẠI dùng chung (thông báo, xác nhận, kiến thức).

import { $ } from "../core/utils.js";

// ===== DIALOGS =====
export let lastFocus = null;
// Mở hộp thoại; nhớ phần tử đang được chọn để trả lại khi đóng (giúp người dùng bàn phím).
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
// Nếu need = true thì hỏi xác nhận trước khi làm fn; nếu không thì làm luôn.
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
// Bấm ra vùng nền tối hoặc nhấn phím Esc để đóng hộp thoại.
$("#ov").addEventListener("click", (e) => {
  if (e.target.id === "ov") closeDialog();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#ov").classList.contains("on")) closeDialog();
});
