// TRẠNG THÁI CỦA ỨNG DỤNG
// Mọi dữ liệu đang dùng được gom vào một object duy nhất là APP.
// Giao diện luôn được vẽ lại từ APP: dữ liệu thay đổi → gọi renderAll() → màn hình cập nhật.

import { N_Q, forecast, initRun } from "./model.js";
import { DEFAULT_SEED, T, cur } from "./utils.js";
import {
  deleteStrategy,
  fetchStrategies,
  saveStrategies,
  saveStrategy,
  waitForUser,
} from "../services/strategies.js";

// ===== STATE =====
// key: kịch bản đang chơi · tab: tab đang mở · seed/noise: bộ sốc và có bật bất định không
// run: ván đang chơi · dec: quyết định đang soạn (chưa công bố) · notes: bài giải trình
// saved: các chiến lược đã lưu · hidden: đường nào đang ẩn trong tab So sánh
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
// ===== CHIẾN LƯỢC ĐÃ LƯU (trên Firestore, theo từng tài khoản) =====
// user: người đang đăng nhập (Firebase Auth)
// savedStatus: "loading" (đang tải) · "ready" (đã tải xong) · "error" (không tải được)
APP.user = null;
APP.savedStatus = "loading";

// Khoá cũ trong localStorage, từ hồi chiến lược còn lưu trên trình duyệt.
const OLD_KEY = "cbsim.saved.v1";

// Đọc chiến lược của người đang đăng nhập. Chưa đăng nhập thì đưa về trang login.
// async/await: chờ Firebase trả lời mà không làm đứng trang web.
export async function loadSaved() {
  const user = await waitForUser();
  if (!user) {
    location.href = "/loginpage/login.html";
    return;
  }
  APP.user = user;
  try {
    APP.saved = await fetchStrategies(user.uid);
    APP.savedStatus = "ready";
  } catch (e) {
    console.error("Could not load saved strategies:", e);
    APP.savedStatus = "error";
  }
}

// ----- Chiến lược CŨ trong localStorage (lưu trước khi có tài khoản) -----
// Dữ liệu này không gắn với tài khoản nào: trên máy dùng chung, nó có thể là của người khác.
// Vì vậy KHÔNG tự chuyển, mà hỏi người dùng trước (xem askAboutOldStrategies trong compare.js).

// Trả về các chiến lược cũ chưa có trong tài khoản (mảng rỗng nếu không có gì).
export function oldLocalStrategies() {
  let old = [];
  try {
    old = JSON.parse(localStorage.getItem(OLD_KEY) || "[]");
  } catch (e) {
    /* dữ liệu cũ hỏng thì coi như không có */
  }
  if (!Array.isArray(old)) return [];
  const have = new Set(APP.saved.map((s) => s.id));
  return old.filter((s) => s && s.id && !have.has(s.id));
}

// Người dùng chọn "Thêm vào tài khoản": lưu lên Firestore rồi xoá bản cũ trên máy.
export async function importOldLocalStrategies(list) {
  await saveStrategies(APP.user.uid, list);
  APP.saved.push(...list);
  discardOldLocalStrategies();
}

// Người dùng chọn "Xoá": bỏ dữ liệu cũ khỏi trình duyệt.
export function discardOldLocalStrategies() {
  try {
    localStorage.removeItem(OLD_KEY);
  } catch (e) {
    /* ignore */
  }
}

// Thêm một chiến lược: hiện ngay trên màn hình, rồi lưu lên Firestore.
// Nếu lưu thất bại thì gỡ nó ra lại và báo lỗi cho nơi gọi (throw).
export async function addSaved(strategy) {
  APP.saved.push(strategy);
  try {
    await saveStrategy(APP.user.uid, strategy);
  } catch (e) {
    APP.saved = APP.saved.filter((s) => s.id !== strategy.id);
    throw e;
  }
}

// Xoá một chiến lược: gỡ khỏi màn hình ngay, nếu Firestore báo lỗi thì trả lại.
export async function removeSaved(id) {
  const before = APP.saved;
  APP.saved = APP.saved.filter((s) => s.id !== id);
  try {
    await deleteStrategy(APP.user.uid, id);
  } catch (e) {
    APP.saved = before;
    throw e;
  }
}

// Bắt đầu một nhiệm kỳ mới cho kịch bản key.
export function newRun(key) {
  APP.key = key;
  APP.run = initRun(key, APP.seed);
  APP.run.noise = APP.noise;
  APP.notes = "";
  resetDec();
}
// Đặt lại quyết định nháp = giữ nguyên như quý vừa rồi.
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
