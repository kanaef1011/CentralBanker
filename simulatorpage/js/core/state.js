// TRẠNG THÁI CỦA ỨNG DỤNG
// Mọi dữ liệu đang dùng được gom vào một object duy nhất là APP.
// Giao diện luôn được vẽ lại từ APP: dữ liệu thay đổi → gọi renderAll() → màn hình cập nhật.

import { N_Q, forecast, initRun } from "./model.js";
import { DEFAULT_SEED, T, cur } from "./utils.js";

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
// Đọc các chiến lược đã lưu từ localStorage (bộ nhớ của trình duyệt, còn lại sau khi tải lại trang).
// JSON.parse đổi chuỗi thành object. try/catch phòng khi dữ liệu hỏng hoặc trình duyệt chặn.
export function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem("cbsim.saved.v1") || "[]");
    if (Array.isArray(s)) APP.saved = s;
  } catch (e) {
    APP.saved = [];
  }
}
// Ghi danh sách chiến lược vào localStorage (JSON.stringify đổi object thành chuỗi).
export function storeSaved() {
  try {
    localStorage.setItem("cbsim.saved.v1", JSON.stringify(APP.saved));
  } catch (e) {
    /* ignore */
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
