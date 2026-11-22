// ĐIỂM KHỞI ĐỘNG: file duy nhất được simulator.html nạp (<script type="module">).
// Các dòng import bên dưới sẽ kéo theo toàn bộ những file còn lại.

import { APP, loadSaved, newRun } from "./core/state.js";
import { renderHeader, setTab } from "./ui/header.js";
import { renderADAS } from "./views/adas.js";
import { renderBrief } from "./views/briefing.js";
import { askAboutOldStrategies, renderCompare } from "./views/compare.js";
import { renderEval } from "./views/evaluate.js";
import { renderLearn } from "./views/learn.js";
import { renderCharts, renderPlay } from "./views/policy-room.js";
import { logout } from "./services/strategies.js";

// ===== STARTUP =====
// Vẽ lại thanh trên cùng và tab đang mở. Gọi hàm này mỗi khi dữ liệu trong APP thay đổi.
export function renderAll() {
  renderHeader();
  if (APP.tab === "brief") renderBrief();
  if (APP.tab === "play") renderPlay();
  if (APP.tab === "eval") renderEval();
  if (APP.tab === "compare") renderCompare();
  if (APP.tab === "learn") renderLearn();
}
// Bấm vào nút tab nào thì chuyển sang tab đó (data-tab trong HTML cho biết tên tab).
document
  .querySelectorAll("nav.tabs button")
  .forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));
// Khi kéo đổi kích thước cửa sổ: chờ 120ms sau lần thay đổi cuối cùng rồi mới vẽ lại biểu đồ
// (kỹ thuật "debounce"), tránh phải vẽ lại hàng trăm lần.
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
// KHỞI ĐỘNG: tạo ván đầu tiên → mở tab → tải chiến lược đã lưu từ Firestore.
// Có thể mở thẳng một tab bằng #hash trên địa chỉ, ví dụ simulator.html#play.
// Tải từ Firestore mất một lúc, nên game hiện ra trước; tải xong thì vẽ lại tab So sánh nếu đang mở.
// Sau đó, nếu trình duyệt còn chiến lược cũ (lưu trước khi có tài khoản) thì hỏi người dùng.
loadSaved().then(() => {
  if (APP.tab === "compare") renderCompare();
  askAboutOldStrategies();
});
newRun("lam-phat");
export let startTab = "brief";
if (
  location.hash &&
  ["brief", "play", "eval", "compare", "learn"].includes(location.hash.slice(1))
)
  startTab = location.hash.slice(1);
setTab(startTab);

document.getElementById("logoutBtn").addEventListener("click", async function () {
  // Đăng xuất khỏi Firebase (nếu không, lần sau vẫn được coi là đã đăng nhập)
  await logout();
  // Xóa email khỏi localStorage
  localStorage.removeItem("email");
  // Chuyển hướng về trang đăng nhập
  window.location.href = "/loginpage/login.html";
});
