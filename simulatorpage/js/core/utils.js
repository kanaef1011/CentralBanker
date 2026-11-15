// CÁC HÀM TIỆN ÍCH dùng chung cho mọi file giao diện: chọn phần tử, định dạng số, tên quý...
// Ghi chú cú pháp: `x => ...` là arrow function (hàm mũi tên), cách viết hàm ngắn gọn.
// `import { ... } from '...'` lấy các tên mà file khác đã `export`.

import { FG_LEVELS, SCENARIOS } from "./model.js";
import { APP } from "./state.js";

// ===== UTILITIES =====
// $('#id') là cách viết tắt của document.querySelector: tìm phần tử HTML đầu tiên khớp bộ chọn CSS.
export const $ = (s) => document.querySelector(s);
// Thoát các ký tự đặc biệt của HTML (&, <, >, ") trước khi chèn chữ vào innerHTML.
// Nhờ vậy chữ người dùng gõ không bị hiểu nhầm thành thẻ HTML (tránh lỗi hiển thị và tấn công XSS).
export const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
// Định dạng số với d chữ số thập phân. Dùng dấu trừ "−" cho đẹp,
// và số rất nhỏ thì hiện thành 0 (tránh hiện "−0.0").
export const fmt = (x, d = 1) => {
  if (x === null || x === undefined || isNaN(x)) return "—";
  const v = Math.abs(x) < Math.pow(10, -d) / 2 ? 0 : x;
  return (v < 0 ? "−" : "") + Math.abs(v).toFixed(d);
};
// Giống fmt nhưng luôn có dấu: +1.2 hoặc −0.5 (dùng để hiện mức thay đổi).
export const fmtS = (x, d = 1) => {
  const v = Math.abs(x) < Math.pow(10, -d) / 2 ? 0 : x;
  return (v > 0 ? "+" : "") + fmt(v, d);
};
// Thêm ký hiệu %: pct(2.345) → "2.3%".
export const pct = (x, d = 1) => fmt(x, d) + "%";
// Tên quý dễ đọc, ví dụ quý 6 → "Year 2 · Q2". Dấu % ở đây là phép chia lấy dư.
export const qName = (t) =>
  t === 0
    ? "Start of term"
    : `Year ${Math.ceil(t / 4)} · Q${((t - 1) % 4) + 1}`;
export const qShort = (t) => (t === 0 ? "Start" : "Q" + t);
// Lối tắt: SC() = kịch bản hiện tại, cur() = quý mới nhất, T() = số quý đã trôi qua.
export const SC = () => SCENARIOS[APP.key];
export const cur = () => APP.run.H[APP.run.H.length - 1];
export const T = () => APP.run.H.length - 1;
// Tìm thông tin của một mức định hướng theo giá trị v (−2 … 2).
export const fgText = (v) => FG_LEVELS.find((f) => f.v === v);
// Bộ sốc mặc định, và bảng màu cho các đường trong tab So sánh.
export const DEFAULT_SEED = 2026;
export const CMP_COLORS = [
  "var(--accent)",
  "#bf3d2a",
  "#2b5c9c",
  "#a87a26",
  "#7b52a8",
  "#6b7a73",
];
