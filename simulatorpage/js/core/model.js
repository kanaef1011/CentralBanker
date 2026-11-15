// MÔ HÌNH KINH TẾ
// File này chỉ làm phép tính, KHÔNG đụng tới giao diện (DOM).
// Nhờ tách riêng như vậy, ta có thể chạy thử mô hình bằng Node mà không cần trình duyệt.
// Mỗi lần gọi stepRun() = kinh tế đi thêm 1 quý (3 tháng).

// ===== ECONOMIC MODEL (pure, no DOM) =====
// Mục tiêu lạm phát 2%/năm: mức mà phần lớn ngân hàng trung ương (Fed, ECB...) theo đuổi.
export const PI_TARGET = 2;
// Số quý của nhiệm kỳ: 12 quý = 3 năm.
export const N_Q = 12;

// 5 KỊCH BẢN. Khoá viết không dấu: lam-phat = lạm phát, suy-thoai = suy thoái,
// khung-hoang = khủng hoảng, dinh-lam = đình lạm, ha-canh = hạ cánh mềm.
// Ý nghĩa các trường số liệu ban đầu:
//   pi0 / piPrev : lạm phát quý này / quý trước (%)
//   y0 / yPre    : output gap = cầu so với năng lực sản xuất (%); yPre là 4 quý trước đó
//   u0           : tỷ lệ thất nghiệp (%)
//   i0           : lãi suất chính sách (%)
//   B0           : bảng cân đối của NHTW (% GDP)
//   c0           : uy tín của NHTW, từ 0 (không ai tin) đến 1 (ai cũng tin)
//   rstar        : lãi suất thực trung lập (không kích thích cũng không kìm hãm)
//   uStar / gPot : thất nghiệp tự nhiên / tăng trưởng tiềm năng
//   tp / sp      : phần bù kỳ hạn / chênh lệch rủi ro khi vay
//   stress0      : mức căng thẳng tài chính
//   supply0, supplyRho : cú sốc cung (giá dầu, lương...) và tốc độ nó tắt dần
//   demand0      : cú sốc cầu
//   events       : sự kiện bất ngờ, đánh số theo quý (2 = xảy ra ở quý 2)
export const SCENARIOS = {
  "lam-phat": {
    name: "Inflation surge",
    tag: "Overheating economy",
    brief:
      "After a period of heavy stimulus, spending is booming while supply chains are jammed. Inflation is more than three times the target and unemployment is at a record low. The policy rate is still near zero, and the central bank balance sheet is still swollen from earlier rounds of QE.",
    challenge:
      "Bring inflation back to 2% without pushing the economy into a deep recession.",
    pi0: 6.8,
    piPrev: 6.0,
    yPre: [-0.6, 0.4, 1.1, 1.6],
    y0: 1.9,
    u0: 3.6,
    i0: 0.5,
    B0: 32,
    c0: 0.6,
    rstar: 0.5,
    uStar: 4.5,
    gPot: 2.0,
    tp: 0.8,
    sp: 1.8,
    stress0: 0,
    supply0: 1.1,
    supplyRho: 0.7,
    demand0: 0.2,
    events: {
      2: {
        title: "Global energy prices cool",
        text: "Oil prices fall 15% from last quarter, easing pressure on production costs.",
        supply: -0.5,
        kind: "good",
      },
      5: {
        title: "Unions win 7% pay rises",
        text: "Many industries raise wages to catch up with past inflation. Risk of a wage–price spiral.",
        supply: 0.45,
        kind: "bad",
      },
      8: {
        title: "Housing market stalls",
        text: "Home sales drop sharply as mortgage rates bite.",
        demand: -0.35,
        kind: "bad",
      },
    },
  },
  "suy-thoai": {
    name: "Demand-driven recession",
    tag: "Firms cutting investment",
    brief:
      "Business confidence has collapsed after a trade shock. Orders are falling, factories are cutting shifts and unemployment is rising fast. Inflation is still close to target but drifting down.",
    challenge:
      "Stop the slide and bring unemployment back to its natural rate without creating inflation later.",
    pi0: 2.1,
    piPrev: 2.4,
    yPre: [0.5, 0.2, -0.4, -1.0],
    y0: -1.6,
    u0: 5.5,
    i0: 4.5,
    B0: 12,
    c0: 0.75,
    rstar: 1.0,
    uStar: 4.5,
    gPot: 2.0,
    tp: 0.8,
    sp: 1.8,
    stress0: 0.4,
    supply0: 0,
    supplyRho: 0.6,
    demand0: -0.5,
    events: {
      1: {
        title: "Exports keep falling",
        text: "Exports are down 8% year on year; industrial parks are laying off workers.",
        demand: -0.5,
        kind: "bad",
      },
      2: {
        title: "Firms shelve expansion plans",
        text: "A survey shows 40% of businesses are postponing new investment.",
        demand: -0.35,
        kind: "bad",
      },
      7: {
        title: "New trade deal signed",
        text: "Export markets reopen and business confidence improves.",
        demand: 0.5,
        kind: "good",
      },
    },
  },
  "khung-hoang": {
    name: "Financial crisis",
    tag: "Rates stuck near 0%",
    brief:
      "Several large banks have suffered heavy losses and credit markets have almost frozen: lending spreads have soared and firms cannot borrow. The policy rate is only 1%, close to zero.",
    challenge:
      "With little room left to cut rates, use QE and forward guidance to ease financial conditions.",
    pi0: 1.3,
    piPrev: 1.9,
    yPre: [0.3, -0.5, -1.4, -2.3],
    y0: -3.1,
    u0: 6.6,
    i0: 1.0,
    B0: 8,
    c0: 0.7,
    rstar: 0.0,
    uStar: 4.5,
    gPot: 1.8,
    tp: 0.9,
    sp: 1.8,
    stress0: 2.2,
    supply0: -0.2,
    supplyRho: 0.6,
    demand0: -0.7,
    events: {
      1: {
        title: "Another bank fails",
        text: "Depositors panic and banks stop lending to each other.",
        stress: 0.8,
        demand: -0.4,
        kind: "bad",
      },
      3: {
        title: "Government guarantees deposits",
        text: "Fiscal policy (outside your control) helps calm depositors.",
        stress: -0.6,
        kind: "good",
      },
      9: {
        title: "Firms start hiring again",
        text: "New business registrations rise for the first time in two years.",
        demand: 0.3,
        kind: "good",
      },
    },
  },
  "dinh-lam": {
    name: "Stagflation (oil shock)",
    tag: "High inflation + high unemployment",
    brief:
      "World oil prices have doubled. Rising production costs are pushing prices up while output falls. People are starting to believe inflation will stay high for a long time.",
    challenge:
      "Face the hardest trade-off: tighten to anchor inflation expectations, or ease to protect jobs?",
    pi0: 5.6,
    piPrev: 4.4,
    yPre: [0.4, 0.3, -0.1, -0.5],
    y0: -0.9,
    u0: 5.5,
    i0: 3.0,
    B0: 10,
    c0: 0.45,
    rstar: 1.0,
    uStar: 4.5,
    gPot: 2.0,
    tp: 0.8,
    sp: 1.8,
    stress0: 0.2,
    supply0: 1.5,
    supplyRho: 0.8,
    demand0: -0.2,
    events: {
      3: {
        title: "Conflict disrupts oil supply",
        text: "Oil jumps another 30%. Fuel, transport and food prices all rise.",
        supply: 1.0,
        kind: "bad",
      },
      6: {
        title: "Household inflation expectations rise",
        text: "Survey: people expect prices to rise 6% over the next year.",
        supply: 0.35,
        kind: "bad",
      },
      9: {
        title: "Oil prices start to fall",
        text: "Producers raise output and oil drops 20%.",
        supply: -0.8,
        kind: "good",
      },
    },
  },
  "ha-canh": {
    name: "Soft landing",
    tag: "Slightly hot, hidden risks",
    brief:
      "The economy is growing well, inflation is a little above target and the labour market is tight. Everything looks fine, but risk is building up in property lending.",
    challenge:
      "Guide inflation gently back to 2% and react in time when a shock hits.",
    pi0: 3.5,
    piPrev: 3.2,
    yPre: [0.3, 0.6, 0.9, 1.1],
    y0: 1.3,
    u0: 3.9,
    i0: 3.5,
    B0: 18,
    c0: 0.72,
    rstar: 1.0,
    uStar: 4.5,
    gPot: 2.0,
    tp: 0.8,
    sp: 1.8,
    stress0: 0,
    supply0: 0.3,
    supplyRho: 0.6,
    demand0: 0.4,
    events: {
      6: {
        title: "Regional bank turmoil",
        text: "Three property lenders run into liquidity trouble. Lending spreads jump.",
        stress: 1.6,
        demand: -0.5,
        kind: "bad",
      },
      7: {
        title: "Consumers tighten their belts",
        text: "Retail sales fall for a second month in a row.",
        demand: -0.3,
        kind: "bad",
      },
    },
  },
};

// 5 mức định hướng chính sách (forward guidance). v âm = nghiêng về nới lỏng, v dương = nghiêng về thắt chặt.
export const FG_LEVELS = [
  {
    v: -2,
    short: "Strong ease",
    text: "The Board commits to keeping rates low for a long time and stands ready to ease further.",
  },
  {
    v: -1,
    short: "Lean ease",
    text: "The Board is leaning towards cutting rates at upcoming meetings.",
  },
  {
    v: 0,
    short: "Neutral",
    text: "The next decision will depend on the economic data.",
  },
  {
    v: 1,
    short: "Lean hike",
    text: "The Board is leaning towards raising rates at upcoming meetings.",
  },
  {
    v: 2,
    short: "Strong hike",
    text: "The Board commits to keep raising rates until inflation is back at target.",
  },
];

// Kẹp x vào trong khoảng [a, b]. Ví dụ: clamp(15, 0, 12) = 12; clamp(-3, 0, 12) = 0.
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Bộ sinh số ngẫu nhiên có "hạt giống" (seed).
// Cùng một seed luôn cho ra cùng một dãy số, nên mọi chiến lược đều gặp cùng một "vận may"
// và việc so sánh mới công bằng. Math.random() không làm được điều này vì mỗi lần mỗi khác.
// (Các phép >>> , ^ , Math.imul là thao tác trên bit; không cần hiểu chi tiết để dùng.)
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Tạo sẵn danh sách cú sốc nhỏ cho từng quý: d = sốc cầu, p = sốc giá.
// Hàm g() dùng phép biến đổi Box–Muller để đổi số ngẫu nhiên đều thành phân phối chuẩn (hình chuông):
// phần lớn cú sốc nhỏ, thỉnh thoảng mới có cú lớn.
export function makeShocks(seed) {
  const r = makeRng(seed);
  const g = () => {
    const u = 1 - r(),
      v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const out = [];
  for (let k = 0; k <= N_Q + 8; k++) out.push({ d: g() * 0.28, p: g() * 0.18 });
  return out;
}

// ĐIỀU KIỆN TÀI CHÍNH: từ công cụ của NHTW tính ra lãi suất người dân và doanh nghiệp thực sự phải trả.
// Tham số: i = lãi suất chính sách, B = bảng cân đối, stress = căng thẳng thị trường,
// piE = lạm phát kỳ vọng, fg = định hướng, c = uy tín, y = output gap.
export function finance(sc, i, B, stress, piE, fg, c, y) {
  // QE có tác dụng mạnh hơn khi thị trường đang căng thẳng. 10 = quy mô bảng cân đối bình thường.
  const qeEff = (B - 10) * (1 + 0.6 * stress);
  // Phần bù kỳ hạn: tăng khi thị trường căng thẳng, giảm khi NHTW mua trái phiếu (QE).
  const tp = Math.max(-1, sc.tp + 0.35 * stress - 0.045 * qeEff);
  // Lợi suất trái phiếu 10 năm ≈ ½ lãi suất hôm nay + ½ lãi suất "bình thường" dài hạn
  // + phần bù kỳ hạn + tác động của lời định hướng (nhân với uy tín c: càng uy tín, lời nói càng có trọng lượng).
  const L = 0.5 * i + 0.5 * (sc.rstar + piE) + tp + 0.35 * fg * c;
  // Ngân hàng đòi thêm phần bù rủi ro, nhất là khi thị trường căng thẳng hoặc kinh tế suy yếu.
  const sp = Math.max(
    0.6,
    sc.sp +
      1.0 * stress +
      0.08 * Math.max(0, -y) -
      0.02 * Math.max(0, B - 10) * stress,
  );
  // Lãi suất vay bình quân = lợi suất 10 năm + phần bù rủi ro.
  const lend = L + sp;
  // Lãi suất THỰC = lãi suất danh nghĩa − lạm phát kỳ vọng. Đây mới là chi phí vay thật sự.
  const rl = lend - piE;
  // f = lãi suất thực so với mức trung lập. f > 0: điều kiện thắt chặt; f < 0: nới lỏng.
  const neutral = sc.rstar + sc.tp + sc.sp;
  return { tp, L, sp, lend, rl, f: rl - neutral };
}

// Tạo một "ván chơi" mới.
// run.H (History = lịch sử) là mảng các quý; H[0] là tình hình lúc bắt đầu nhiệm kỳ.
export function initRun(key, seed) {
  const sc = SCENARIOS[key];
  // Lạm phát kỳ vọng = uy tín × mục tiêu 2% + (1 − uy tín) × lạm phát gần đây.
  const piE0 = sc.c0 * PI_TARGET + (1 - sc.c0) * sc.piPrev;
  const fin0 = finance(sc, sc.i0, sc.B0, sc.stress0, piE0, 0, sc.c0, sc.y0);
  const g0 = sc.gPot + (sc.y0 - sc.yPre[0]);
  return {
    key,
    seed,
    noise: true,
    shocks: makeShocks(seed),
    yPre: sc.yPre.slice(),
    H: [
      {
        t: 0,
        pi: sc.pi0,
        core: sc.pi0 - sc.supply0,
        piE: piE0,
        y: sc.y0,
        u: sc.u0,
        g: g0,
        i: sc.i0,
        B: sc.B0,
        qe: 0,
        fg: 0,
        c: sc.c0,
        stress: sc.stress0,
        supply: sc.supply0,
        demand: sc.demand0,
        ...fin0,
        credit: clamp(7 + 1.2 * sc.y0 - 2.0 * fin0.f, -8, 25),
        event: null,
      },
    ],
  };
}

// TRÁI TIM CỦA MÔ HÌNH
// Nhận quyết định dec = { i: lãi suất, qe: mua/bán tài sản, fg: định hướng },
// tính ra tình hình kinh tế của quý tiếp theo rồi thêm vào run.H.
export function stepRun(run, dec, opts = {}) {
  const sc = SCENARIOS[run.key];
  const H = run.H;
  const t = H.length - 1;
  const s = H[t];
  // prev = quý trước nữa. Cần nó vì chính sách tác động có ĐỘ TRỄ (1–3 quý).
  const prev = t > 0 ? H[t - 1] : { f: s.f, y: run.yPre[3] };
  const noise = opts.noise !== undefined ? opts.noise : run.noise;
  // Lấy cú sốc ngẫu nhiên của quý này (nếu người chơi bật "Include uncertainty").
  const sh = noise ? run.shocks[t + 1] : { d: 0, p: 0 };
  // Sự kiện kịch bản của quý tới (nếu có).
  const ev = opts.noEvents ? null : sc.events[t + 1] || null;

  // Làm tròn lãi suất tới bước 0,25 điểm % và giữ trong khoảng 0–12%.
  const i = clamp(Math.round(dec.i * 4) / 4, 0, 12);
  const B = clamp(s.B + dec.qe, 5, 45);
  const qe = B - s.B;
  const fg = dec.fg;
  const di = i - s.i;

  // --- UY TÍN (credibility) ---
  // Mỗi quý uy tín tăng nhẹ, nhưng giảm nếu lạm phát xa mục tiêu.
  // "Nói một đằng làm một nẻo" (hứa tăng lãi suất mà lại giảm, hoặc ngược lại) → mất 0,08.
  // Giữ đúng lời hứa → được cộng thêm.
  let dc = 0.015 - 0.01 * Math.abs(s.pi - PI_TARGET);
  if (s.fg >= 1 && di < -0.01) dc -= 0.08;
  if (s.fg <= -1 && di > 0.01) dc -= 0.08;
  if ((s.fg >= 1 && di > 0.01) || (s.fg <= -1 && di < -0.01)) dc += 0.015;
  const c = clamp(s.c + dc, 0.15, 0.9);

  // Các cú sốc tắt dần (nhân với hệ số < 1 mỗi quý), cộng thêm tác động của sự kiện mới.
  const stress = Math.max(0, s.stress * 0.75 + ((ev && ev.stress) || 0));
  const supply = s.supply * sc.supplyRho + ((ev && ev.supply) || 0);
  const demand = s.demand * 0.6 + ((ev && ev.demand) || 0);
  // Kỳ vọng lạm phát: càng uy tín, người dân càng tin lạm phát sẽ về 2%.
  const piE = c * PI_TARGET + (1 - c) * s.pi;
  const fin = finance(sc, i, B, stress, piE, fg, c, s.y);

  // Giá trị của 2 quý trước, dùng để mô phỏng độ trễ.
  const yLag2 = t >= 1 ? H[t - 1].y : run.yPre[3];
  const fLag2 = prev.f;
  // OUTPUT GAP (cầu so với năng lực sản xuất):
  // 72% giữ quán tính từ quý trước − tác động của điều kiện tài chính
  // (30% từ quý này, 45% từ quý trước, 25% từ hai quý trước) + sự kiện + sốc ngẫu nhiên.
  const y =
    0.72 * s.y -
    0.42 * (0.3 * fin.f + 0.45 * s.f + 0.25 * fLag2) +
    demand +
    sh.d;
  // LẠM PHÁT LÕI: 60% quán tính + 40% kỳ vọng + áp lực cầu (đường Phillips).
  const core =
    0.6 * s.core + 0.4 * piE + 0.16 * (0.5 * s.y + 0.5 * yLag2) + sh.p;
  // LẠM PHÁT CHUNG = lạm phát lõi + sốc cung (giá dầu, lương...).
  const pi = core + supply;
  // THẤT NGHIỆP (định luật Okun): mỗi quý dịch dần 45% về mức (tự nhiên − 0,45 × output gap).
  const u = s.u + 0.45 * (sc.uStar - 0.45 * y - s.u);
  // Tăng trưởng GDP so với cùng kỳ năm trước = tăng trưởng tiềm năng + thay đổi output gap trong 4 quý.
  const yAgo = t + 1 - 4 >= 0 ? H[t + 1 - 4].y : run.yPre[t + 1];
  const g = sc.gPot + (y - yAgo);
  // Tăng trưởng tín dụng: cao khi kinh tế nóng và tiền rẻ.
  const credit = clamp(7 + 1.2 * y - 2.0 * fin.f, -8, 25);

  // Lưu PHẦN ĐÓNG GÓP của từng yếu tố (cy: vào cầu, cpi: vào lạm phát)
  // để giao diện giải thích được "vì sao" kinh tế thay đổi.
  const cy = {
    inertia: -0.28 * s.y,
    fin: -0.42 * (0.3 * fin.f + 0.45 * s.f + 0.25 * fLag2),
    demand,
    shock: sh.d,
  };
  const cpi = {
    expect: 0.4 * (piE - s.core),
    demand: 0.16 * (0.5 * s.y + 0.5 * yLag2),
    supply: supply - s.supply,
    shock: sh.p,
  };
  // Gói tất cả kết quả của quý mới thành một object rồi thêm vào lịch sử.
  const row = {
    cy,
    cpi,
    t: t + 1,
    pi,
    core,
    piE,
    y,
    u,
    g,
    i,
    B,
    qe,
    fg,
    c,
    stress,
    supply,
    demand,
    ...fin,
    credit,
    event: ev,
    di,
    shock: sh,
  };
  H.push(row);
  return row;
}

// DỰ BÁO CỦA CHUYÊN VIÊN: chạy thử k quý tới trên một BẢN SAO của ván chơi,
// không có sốc ngẫu nhiên và sự kiện. Dùng bản sao để không làm thay đổi ván thật.
export function forecast(run, dec, k = 4) {
  const clone = { ...run, H: run.H.map((r) => ({ ...r })) };
  const out = [];
  for (let j = 0; j < k && clone.H.length - 1 < N_Q; j++) {
    out.push(
      stepRun(clone, j === 0 ? dec : { i: dec.i, qe: 0, fg: dec.fg }, {
        noise: false,
        noEvents: true,
      }),
    );
  }
  return out;
}

// QUY TẮC TAYLOR (John Taylor, 1993) — chiến lược mẫu để so sánh:
// lãi suất mục tiêu = lãi suất trung lập + lạm phát + 0,5 × (lạm phát − 2%) + 0,5 × output gap.
// Điều chỉnh từ từ (55% lãi suất cũ + 45% mục tiêu). Khi lãi suất chạm 0% thì dùng thêm QE.
export function taylorDecision(run) {
  const sc = SCENARIOS[run.key];
  const s = run.H[run.H.length - 1];
  const target = sc.rstar + s.pi + 0.5 * (s.pi - PI_TARGET) + 0.5 * s.y;
  let i = clamp(Math.round((0.55 * s.i + 0.45 * target) * 4) / 4, 0, 12);
  let qe = 0;
  if (target < 0.5 && i <= 0.5) qe = Math.min(4, (0.5 - target) * 1.2);
  else if (s.B > 15 && s.pi > 2.5) qe = -1.5;
  const fg = target > i + 0.75 ? 1 : target < i - 0.75 ? -1 : 0;
  return { i, qe: Math.round(qe * 2) / 2, fg };
}
// Chiến lược "không làm gì": giữ nguyên lãi suất, không QE, định hướng trung lập.
export function holdDecision(run) {
  const s = run.H[run.H.length - 1];
  return { i: s.i, qe: 0, fg: 0 };
}
// Chạy đủ 12 quý với một chiến lược tự động fn (dùng cho tab So sánh).
export function simulateStrategy(key, seed, noise, fn) {
  const run = initRun(key, seed);
  run.noise = noise;
  while (run.H.length - 1 < N_Q) stepRun(run, fn(run));
  return run;
}

// CHẤM ĐIỂM nhiệm kỳ (0–100).
// Quý càng về sau càng có trọng số lớn (w), vì tình hình lúc đầu là "di sản" người chơi được giao lại.
// Mỗi mục tính bằng 100 × e^(−sai lệch / mức chịu đựng): sai lệch 0 → 100 điểm, càng lệch càng giảm.
export function scoreRun(run) {
  const sc = SCENARIOS[run.key];
  const rows = run.H.slice(1);
  if (!rows.length) return null;
  let W = 0,
    ePi = 0,
    eU = 0,
    eG = 0,
    vol = 0,
    st = 0;
  rows.forEach((r) => {
    const w = 0.2 + Math.pow(r.t / N_Q, 1.5);
    W += w;
    ePi += w * Math.abs(r.pi - PI_TARGET);
    eU += w * Math.abs(r.u - sc.uStar);
    eG += w * Math.abs(r.y);
    vol +=
      Math.max(0, Math.abs(r.di) - 0.5) + 0.1 * Math.max(0, Math.abs(r.qe) - 2);
    st += Math.max(0, r.credit - 12) / 6;
  });
  ePi /= W;
  eU /= W;
  eG /= W;
  vol /= rows.length;
  st /= rows.length;
  const last = rows[rows.length - 1];
  const bsPen = Math.max(0, last.B - 35) / 25;
  const parts = {
    price: 100 * Math.exp(-ePi / 2.2),
    jobs: 100 * Math.exp(-eU / 1.5),
    growth: 100 * Math.exp(-eG / 2.0),
    fin: 100 * Math.exp(-(vol / 0.6 + st + bsPen)),
    cred: clamp((last.c - 0.15) / 0.75, 0, 1) * 100,
  };
  // Tổng có trọng số: giá cả 30%, việc làm 25%, sản lượng 15%, tài chính 15%, uy tín 15%.
  const total =
    0.3 * parts.price +
    0.25 * parts.jobs +
    0.15 * parts.growth +
    0.15 * parts.fin +
    0.15 * parts.cred;
  return { parts, total, ePi, eU, eG, vol };
}
// Đổi điểm số thành xếp loại A–E.
export function grade(x) {
  if (x >= 85) return "A";
  if (x >= 72) return "B";
  if (x >= 58) return "C";
  if (x >= 45) return "D";
  return "E";
}
