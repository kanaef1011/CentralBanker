// TAB 1 – BRIEFING: chọn kịch bản, đọc tình hình đầu nhiệm kỳ và mục tiêu.

import { N_Q, PI_TARGET, SCENARIOS } from "../core/model.js";
import { APP, newRun } from "../core/state.js";
import { $, SC, T, fmt, fmtS, pct } from "../core/utils.js";
import { renderAll } from "../main.js";
import { confirmIf } from "../ui/dialogs.js";
import { setTab } from "../ui/header.js";
import { stF, stG, stPi, stU, stY } from "../ui/status.js";

// ===== 1. BRIEFING =====
export function renderBrief() {
  const sc = SC(),
    s0 = APP.run.H[0],
    t = T();
  const neutral = sc.rstar + PI_TARGET;
  // Mỗi dòng của bảng: [tên chỉ số, giá trị, mốc so sánh, đánh giá].
  const startRows = [
    ["Inflation", pct(s0.pi), "Target 2%", stPi(s0.pi)],
    ["Unemployment", pct(s0.u), `Natural rate ${pct(sc.uStar)}`, stU(s0.u)],
    [
      "Real GDP growth (year on year)",
      pct(s0.g),
      `Potential ${pct(sc.gPot)}`,
      stG(s0.g),
    ],
    [
      "Aggregate demand vs capacity",
      fmtS(s0.y) + "%",
      "Balanced at 0%",
      stY(s0.y),
    ],
    [
      "Policy rate",
      pct(s0.i, 2),
      `Neutral ≈ ${pct(neutral)}`,
      [
        "neu",
        s0.i < neutral - 0.5
          ? "Below neutral"
          : s0.i > neutral + 0.5
            ? "Above neutral"
            : "Near neutral",
      ],
    ],
    ["Average borrowing rate", pct(s0.lend), "Financial conditions", stF(s0.f)],
    [
      "Central bank balance sheet",
      fmt(s0.B, 0) + "% of GDP",
      "Normal ≈ 10% of GDP",
      ["neu", s0.B > 15 ? "Large (after QE)" : "Normal"],
    ],
    [
      "Central bank credibility",
      Math.round(s0.c * 100) + "/100",
      "Do people trust the 2% target?",
      ["neu", s0.c >= 0.7 ? "High" : s0.c >= 0.5 ? "Medium" : "Low"],
    ],
  ];
  // Dựng HTML bằng template literal (chuỗi nằm trong dấu `...`): ${...} dùng để chèn giá trị.
  // Mẹo hay gặp: mang.map(x => `<tr>...</tr>`).join("") biến một mảng thành nhiều thẻ HTML.
  $("#v-brief").innerHTML = `<div class="brief-grid">
    <div class="stack">
      <h3>Choose a scenario</h3>
      <div class="sc-list">${Object.entries(SCENARIOS)
        .map(
          ([k, v]) =>
            `<button class="sc" data-sc="${k}" aria-pressed="${k === APP.key}"><span class="nm">${v.name}</span><span class="tg">${v.tag}</span></button>`,
        )
        .join("")}</div>
      <div class="panel stack">
        <h3>Settings</h3>
        <label class="toggle" for="optNoise"><input type="checkbox" id="optNoise" ${APP.noise ? "checked" : ""} ${t > 0 ? "disabled" : ""}><span><b>Include uncertainty</b><br><span class="muted">Each quarter brings small shocks the model cannot predict. Every strategy run on the same shock set gets the same "luck", so comparisons stay fair.</span></span></label>
        <div class="row small"><span class="muted">Shock set no.</span><b>${APP.seed}</b><button class="btn small" id="btnSeed" ${t > 0 ? "disabled" : ""}>Use another set</button></div>
        ${t > 0 ? '<p class="small muted">Settings are locked mid-term. Click "Start over" to change them.</p>' : ""}
      </div>
    </div>
    <div class="stack">
      <div class="panel stack">
        <div class="row" style="justify-content:space-between"><h2>${sc.name}</h2><span class="pill acc">${N_Q} quarters · 3 years</span></div>
        <p class="brief-text">${sc.brief}</p>
        <div class="challenge"><b>Your challenge:</b> ${sc.challenge}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Indicator at start of term</th><th>Now</th><th>Benchmark</th><th>Assessment</th></tr></thead>
        <tbody>${startRows.map((r) => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td class="muted">${r[2]}</td><td><span class="pill ${r[3][0]}">${r[3][1]}</span></td></tr>`).join("")}</tbody></table></div>
        <div class="row"><button class="btn primary big" id="btnStart" style="width:auto">${t > 0 ? `Continue (now at quarter ${t})` : "Start setting policy"}</button>${t > 0 ? '<button class="btn" id="btnRestart">Start over</button>' : ""}</div>
      </div>
      <div class="two">
        <div class="panel stack"><h3>Your objectives</h3><ul class="clean">
          <li><b>Price stability:</b> inflation close to 2% (comfort zone 1–3%).</li>
          <li><b>Economic stability:</b> unemployment near its natural rate of ${pct(sc.uStar)}, output close to capacity.</li>
          <li><b>Sound decision-making:</b> match your words with your actions to keep credibility, and avoid abrupt moves that unsettle markets.</li>
        </ul><p class="small muted">These objectives can clash in the short run: tightening lowers inflation but slows the economy and raises unemployment.</p></div>
        <div class="panel stack"><h3>What you control, and what you don't</h3><ul class="clean">
          <li><b>You control:</b> the policy rate, quantitative easing (QE), quantitative tightening (QT) and forward guidance.</li>
          <li><b>Outside your control (held fixed):</b> taxes and government spending, structural reforms, exchange-rate intervention and supervision of individual banks. They may appear as outside events.</li>
        </ul></div>
      </div>
    </div></div>`;
  // Gắn sự kiện SAU khi đã chèn HTML (nút phải có trên trang rồi mới tìm được).
  // Đổi kịch bản giữa chừng thì hỏi xác nhận trước.
  document.querySelectorAll(".sc").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.sc;
        if (k === APP.key) return;
        confirmIf(
          T() > 0,
          "Switch scenario?",
          'Your current term will be discarded. To keep it for comparison, save it in the "Compare strategies" tab first.',
          () => {
            newRun(k);
            renderAll();
          },
        );
      }),
  );
  $("#optNoise").onchange = (e) => {
    APP.noise = e.target.checked;
    newRun(APP.key);
    renderAll();
  };
  const bs = $("#btnSeed");
  if (bs)
    bs.onclick = () => {
      APP.seed = 1000 + Math.floor(Math.random() * 9000);
      newRun(APP.key);
      renderAll();
    };
  $("#btnStart").onclick = () => setTab("play");
  const br = $("#btnRestart");
  if (br)
    br.onclick = () =>
      confirmIf(
        true,
        "Start over?",
        "All decisions in this term will be erased.",
        () => {
          newRun(APP.key);
          renderAll();
        },
      );
}
