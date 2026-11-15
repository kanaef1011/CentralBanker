import {
  FG_LEVELS,
  N_Q,
  PI_TARGET,
  forecast,
  grade,
  scoreRun,
  stepRun,
} from "../core/model.js";
import { APP, baseFc, newRun, resetDec } from "../core/state.js";
import {
  $,
  SC,
  T,
  cur,
  esc,
  fgText,
  fmt,
  fmtS,
  pct,
  qName,
  qShort,
} from "../core/utils.js";
import { renderAll } from "../main.js";
import { chartBox, drawChart, series } from "../ui/charts.js";
import { closeDialog, confirmIf, openDialog } from "../ui/dialogs.js";
import { setTab } from "../ui/header.js";
import { stF, stG, stPi, stU, stY } from "../ui/status.js";
import { renderADAS } from "./adas.js";
import { benchmarks } from "./evaluate.js";
import { learnDialog } from "./learn.js";

// ===== 2. POLICY ROOM =====
export function renderPlay() {
  const t = T(),
    done = t >= N_Q;
  $("#v-play").innerHTML = `<div class="play">
    <div class="stack" style="min-width:0">
      <div class="panel adas" id="adas"></div>
      <aside class="panel ctl stack" id="ctl"></aside>
    </div>
    <div class="stack" style="min-width:0">
      <div class="kpis" id="kpis"></div>
      <div class="panel stack" id="staff"></div>
      <div class="charts">
        ${chartBox(
          "chPi",
          "Inflation",
          [
            { n: "Headline inflation", c: "var(--s-pi)" },
            { n: "Core inflation", c: "var(--muted)" },
          ].concat(
            done ? [] : [{ n: "Staff forecast", c: "var(--s-pi)", dash: 1 }],
          ),
          "green band: 1–3%",
        )}
        ${chartBox("chU", "Unemployment", [{ n: "Unemployment rate", c: "var(--s-u)" }].concat(done ? [] : [{ n: "Staff forecast", c: "var(--s-u)", dash: 1 }]))}
        ${chartBox("chG", "Real GDP growth", [{ n: "Year on year", c: "var(--s-g)" }].concat(done ? [] : [{ n: "Staff forecast", c: "var(--s-g)", dash: 1 }]))}
        ${chartBox("chY", "Aggregate demand vs capacity", [{ n: "Output gap", c: "var(--brass)" }].concat(done ? [] : [{ n: "Staff forecast", c: "var(--brass)", dash: 1 }]), "% of potential")}
        ${chartBox("chR", "Interest rates & financial conditions", [
          { n: "Policy rate", c: "var(--s-rate)" },
          { n: "10-year bond yield", c: "var(--s-L)" },
          { n: "Average borrowing rate", c: "var(--s-lend)" },
        ])}
        ${chartBox("chB", "Balance sheet & credit", [
          { n: "Central bank assets (% GDP)", c: "var(--s-L)" },
          { n: "Credit growth (%/yr)", c: "var(--brass)" },
        ])}
      </div>
      <div class="panel stack" id="whyBox"></div>
    </div>
    <aside class="side stack" id="side"></aside>
  </div>`;
  renderADAS();
  renderControls();
  renderKpis();
  renderStaff();
  renderCharts();
  renderWhy();
  renderSide();
  if (done) setTimeout(() => endDialog(), 50);
}

export function renderControls() {
  const t = T(),
    s = cur(),
    d = APP.dec,
    done = t >= N_Q;
  const di = d.i - s.i;
  const Bn = Math.max(5, Math.min(45, s.B + d.qe));
  const qeLbl =
    d.qe > 0
      ? `QE: buy bonds worth ${fmt(d.qe, 1)}% of GDP`
      : d.qe < 0
        ? `QT: shrink by ${fmt(-d.qe, 1)}% of GDP`
        : "No change in holdings";
  $("#ctl").innerHTML = `
    <div class="row" style="justify-content:space-between"><h3 style="margin:0">Decision ${done ? "" : "for " + qName(t + 1)}</h3></div>
    <div class="tool">
      <div class="head"><span class="name">Policy rate</span><button class="info" data-learn="rate">What is this?</button></div>
      <div class="stepper"><button class="sbtn" id="iDn" aria-label="Lower by 0.25 points" ${done ? "disabled" : ""}>−</button>
        <div class="mid"><div class="bignum">${pct(d.i, 2)}</div><div class="small ${Math.abs(di) < 0.01 ? "muted" : ""}" style="color:${di > 0.01 ? "var(--bad)" : di < -0.01 ? "var(--s-u)" : ""}">${Math.abs(di) < 0.01 ? "Unchanged from last quarter" : (di > 0 ? "Up " : "Down ") + fmt(Math.abs(di), 2) + " pp"}</div></div>
        <button class="sbtn" id="iUp" aria-label="Raise by 0.25 points" ${done ? "disabled" : ""}>+</button></div>
      <input type="range" id="iR" min="0" max="12" step="0.25" value="${d.i}" ${done ? "disabled" : ""} aria-label="Policy rate">
      <div class="scale"><span>0%</span><span>Neutral ≈ ${pct(SC().rstar + PI_TARGET)}</span><span>12%</span></div>
      ${d.i <= 0.001 ? '<p class="small" style="color:var(--warn)">At 0%, the rate cannot go lower. Consider QE and forward guidance.</p>' : ""}
    </div>
    <div class="tool">
      <div class="head"><span class="name">Asset purchases (QE / QT)</span><button class="info" data-learn="qe">What is this?</button></div>
      <div><b>${qeLbl}</b></div>
      <input type="range" id="qR" min="-4" max="5" step="0.5" value="${d.qe}" ${done ? "disabled" : ""} aria-label="QE or QT, % of GDP per quarter">
      <div class="scale"><span>QT −4</span><span>0</span><span>QE +5 (% GDP/qtr)</span></div>
      <div class="bs"><div class="row" style="justify-content:space-between"><span class="muted">Balance sheet</span><span>${fmt(s.B, 0)} → <b>${fmt(Bn, 0)}% of GDP</b></span></div>
        <div class="bsbar"><span style="width:${(Bn / 45) * 100}%"></span><em style="left:${(10 / 45) * 100}%;width:2px"></em></div>
        <span class="small muted">Gold mark: normal size, 10% of GDP. Allowed range 5–45% of GDP.</span></div>
    </div>
    <div class="tool">
      <div class="head"><span class="name">Forward guidance</span><button class="info" data-learn="fg">What is this?</button></div>
      <div class="seg">${FG_LEVELS.map((f) => `<button data-fg="${f.v}" aria-pressed="${d.fg === f.v}" ${done ? "disabled" : ""}>${f.short}</button>`).join("")}</div>
      <p class="quote">“${fgText(d.fg).text}”</p>
      <p class="small muted">Your words carry weight in line with your credibility (${Math.round(s.c * 100)}/100). Acting against your guidance next quarter will cost credibility.</p>
    </div>
    ${
      done
        ? ""
        : `<div class="tool">
      <div class="head"><span class="name">Decision being drafted</span></div>
      <ul class="clean small">
        <li>Policy rate: ${Math.abs(di) < 0.01 ? "hold at " + pct(d.i, 2) : (di > 0 ? "raise " : "cut ") + fmt(Math.abs(di), 2) + " pp → " + pct(d.i, 2)}</li>
        <li>Assets: ${d.qe > 0 ? "QE " + fmt(d.qe, 1) + "% of GDP" : d.qe < 0 ? "QT " + fmt(-d.qe, 1) + "% of GDP" : "no purchases or sales"}</li>
        <li>Guidance: ${fgText(d.fg).short.toLowerCase()}</li>
      </ul>
      <p class="small muted">As in real life, you can't see the results before you announce. Rely on today's data and your understanding of how policy is transmitted. Many effects take 1–3 quarters to appear.</p>
    </div>
    <button class="btn primary big" id="btnGo">Announce decision → ${qShort(t + 1)}</button>`
    }
    ${done ? '<p class="small muted">Your term is over.</p><button class="btn primary big" id="btnToEval">See your evaluation</button>' : ""}
    <div class="row"><button class="btn small" id="btnUndo" ${t === 0 ? "disabled" : ""}>↶ Go back 1 quarter</button><button class="btn small" id="btnReset">Restart scenario</button></div>`;
  if (!done) {
    const setI = (v) => {
      APP.dec.i = Math.max(0, Math.min(12, Math.round(v * 4) / 4));
      refreshDraft();
    };
    $("#iDn").onclick = () => setI(APP.dec.i - 0.25);
    $("#iUp").onclick = () => setI(APP.dec.i + 0.25);
    $("#iR").oninput = (e) => setI(+e.target.value);
    $("#qR").oninput = (e) => {
      APP.dec.qe = +e.target.value;
      refreshDraft();
    };
    document.querySelectorAll("[data-fg]").forEach(
      (b) =>
        (b.onclick = () => {
          APP.dec.fg = +b.dataset.fg;
          refreshDraft();
        }),
    );
    $("#btnGo").onclick = commit;
  }
  if (done) $("#btnToEval").onclick = () => setTab("eval");
  document
    .querySelectorAll("#ctl [data-learn]")
    .forEach((b) => (b.onclick = () => learnDialog(b.dataset.learn)));
  $("#btnUndo").onclick = () => {
    if (T() > 0) {
      APP.run.H.pop();
      resetDec();
      renderAll();
    }
  };
  $("#btnReset").onclick = () =>
    confirmIf(
      T() > 0,
      "Restart this scenario?",
      "All decisions in this term will be erased. The shock set stays the same, so you can try another approach under identical conditions.",
      () => {
        newRun(APP.key);
        renderAll();
      },
    );
}
export function refreshDraft() {
  // keep keyboard focus when the tools column re-renders
  const id = document.activeElement && document.activeElement.id;
  const fgFocus =
    document.activeElement && document.activeElement.dataset
      ? document.activeElement.dataset.fg
      : undefined;
  renderControls();
  if (id) {
    const e = document.getElementById(id);
    if (e) e.focus();
  } else if (fgFocus !== undefined) {
    const e = document.querySelector(`[data-fg="${fgFocus}"]`);
    if (e) e.focus();
  }
}

export function commit() {
  const fc1 = forecast(APP.run, APP.dec, 1)[0];
  const row = stepRun(APP.run, APP.dec);
  row.fc = fc1 ? { pi: fc1.pi, u: fc1.u, y: fc1.y, g: fc1.g } : null;
  resetDec();
  renderAll();
  const w = $("#whyBox");
  if (w && window.innerWidth < 860)
    w.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function renderStaff() {
  const box = $("#staff");
  if (!box) return;
  const t = T(),
    s = cur();
  if (t >= N_Q) {
    box.innerHTML =
      '<h3>Staff forecast</h3><p class="small muted">Your term is over, so there is no further forecast.</p>';
    return;
  }
  const fc = baseFc(),
    e = fc[fc.length - 1];
  const dir = (d, th) =>
    d < -th ? "fall" : d > th ? "rise" : "stay roughly flat";
  const dPi = e.pi - s.pi,
    dU = e.u - s.u;
  const pipe =
    t > 0 && H_changed()
      ? " Much of this movement is already “in the pipeline” from your earlier decisions."
      : "";
  box.innerHTML = `<div class="row" style="justify-content:space-between"><h3>Staff forecast · if policy stays unchanged</h3><span class="small muted">Briefing for ${qName(t + 1)}</span></div>
    <p class="small">If the policy rate stays at <b>${pct(s.i, 2)}</b> with no QE/QT and the same guidance, staff expect inflation to <b>${dir(dPi, 0.25)}</b> (${pct(s.pi)} → ${pct(e.pi)}) and unemployment to <b>${dir(dU, 0.15)}</b> (${pct(s.u)} → ${pct(e.u)}) by ${qShort(e.t)}.${pipe}</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Now (${qShort(t)})</th>${fc.map((r) => `<th>${qShort(r.t)}</th>`).join("")}</tr></thead><tbody>
      <tr><td>Inflation</td><td><b>${pct(s.pi)}</b></td>${fc.map((r) => `<td>${pct(r.pi)}</td>`).join("")}</tr>
      <tr><td>Unemployment</td><td><b>${pct(s.u)}</b></td>${fc.map((r) => `<td>${pct(r.u)}</td>`).join("")}</tr>
      <tr><td>Real GDP growth</td><td><b>${pct(s.g)}</b></td>${fc.map((r) => `<td>${pct(r.g)}</td>`).join("")}</tr>
      <tr><td>Demand vs capacity</td><td><b>${fmtS(s.y)}%</b></td>${fc.map((r) => `<td>${fmtS(r.y)}%</td>`).join("")}</tr>
    </tbody></table></div>
    <p class="small muted">This forecast does not change when you adjust the tools: it only shows where the economy is heading if you do nothing new. It cannot see future events or surprises; the shaded bands on the charts show how uncertain it becomes further out.</p>`;
}
export function H_changed() {
  return APP.run.H.slice(1).some(
    (r) => Math.abs(r.di) > 0.01 || Math.abs(r.qe) > 0.01,
  );
}
export function kpiTile(lbl, val, st, ref, delta) {
  return `<div class="kpi ${st[0]}"><div class="row" style="justify-content:space-between;gap:6px"><span class="lbl">${lbl}</span><span class="pill ${st[0] === "neu" ? "" : st[0]}">${st[1]}</span></div>
  <div class="val">${val}</div><div class="meta"><span>${ref}</span><span>${delta}</span></div></div>`;
}
export function renderKpis() {
  const s = cur(),
    p = APP.run.H[T() - 1],
    sc = SC();
  const dl = (k, d = 1) =>
    p ? `${fmtS(s[k] - p[k], d)} pp vs last qtr` : "Start of term";
  $("#kpis").innerHTML =
    kpiTile("Inflation", pct(s.pi), stPi(s.pi), "Target 2%", dl("pi")) +
    kpiTile(
      "Unemployment",
      pct(s.u),
      stU(s.u),
      `Natural ${pct(sc.uStar)}`,
      dl("u"),
    ) +
    kpiTile(
      "Real GDP growth",
      pct(s.g),
      stG(s.g),
      `Potential ${pct(sc.gPot)}`,
      dl("g"),
    ) +
    kpiTile(
      "Demand vs capacity",
      fmtS(s.y) + "%",
      stY(s.y),
      "Balanced 0%",
      dl("y"),
    ) +
    kpiTile(
      "Avg borrowing rate",
      pct(s.lend),
      stF(s.f),
      `Real ${pct(s.rl)}`,
      dl("lend"),
    );
}
export function fcArr(H, fc, k, spread) {
  const mid = new Array(N_Q + 1).fill(null),
    lo = mid.slice(),
    hi = mid.slice();
  const last = H[H.length - 1];
  mid[last.t] = lo[last.t] = hi[last.t] = last[k];
  fc.forEach((r, j) => {
    const w = spread[0] + spread[1] * (j + 1);
    mid[r.t] = r[k];
    lo[r.t] = r[k] - w;
    hi[r.t] = r[k] + w;
  });
  return { mid, lo, hi };
}
export function renderCharts() {
  if (APP.tab !== "play") return;
  const H = APP.run.H,
    t = T(),
    sc = SC();
  const fc = baseFc();
  const F = (k, sp, col) => {
    if (!fc.length) return [];
    const a = fcArr(H, fc, k, sp);
    return [
      { type: "fan", lo: a.lo, hi: a.hi, color: col },
      { name: "Staff forecast", data: a.mid, color: col, dash: 1, w: 1.75 },
    ];
  };
  const fy = new Array(N_Q + 1).fill(null);
  fc.forEach((r) => (fy[r.t] = r.y));
  drawChart($("#chPi"), {
    title: "Inflation",
    now: t,
    band: [1, 3],
    refs: [{ y: 2, label: "Target 2%" }],
    zero: true,
    series: [
      ...F("pi", [0.1, 0.2], "var(--s-pi)"),
      {
        name: "Core",
        data: series(H, "core"),
        color: "var(--muted)",
        w: 1.5,
        op: 0.8,
      },
      {
        name: "Inflation",
        data: series(H, "pi"),
        color: "var(--s-pi)",
        area: 1,
        end: 1,
        w: 2.5,
      },
    ],
  });
  drawChart($("#chU"), {
    title: "Unemployment",
    now: t,
    refs: [{ y: sc.uStar, label: "Natural " + pct(sc.uStar) }],
    series: [
      ...F("u", [0.05, 0.1], "var(--s-u)"),
      {
        name: "Unemployment",
        data: series(H, "u"),
        color: "var(--s-u)",
        area: 1,
        end: 1,
        w: 2.5,
      },
    ],
  });
  drawChart($("#chG"), {
    title: "GDP",
    now: t,
    zero: true,
    refs: [{ y: sc.gPot, label: "Potential " + pct(sc.gPot) }],
    series: [
      ...F("g", [0.15, 0.3], "var(--s-g)"),
      {
        name: "Real GDP",
        data: series(H, "g"),
        color: "var(--s-g)",
        area: 1,
        areaBase: 0,
        end: 1,
        w: 2.5,
      },
    ],
  });
  drawChart($("#chY"), {
    title: "Aggregate demand",
    now: t,
    zero: true,
    series: [
      {
        name: "Staff forecast",
        data: fy,
        color: "var(--brass)",
        type: "bar",
        dash: 1,
      },
      {
        name: "Output gap",
        data: series(H, "y"),
        color: "var(--brass)",
        type: "bar",
      },
    ],
  });
  drawChart($("#chR"), {
    title: "Interest rates",
    now: t,
    floor0: true,
    series: [
      {
        name: "Borrowing rate",
        data: series(H, "lend"),
        color: "var(--s-lend)",
        w: 2,
      },
      {
        name: "10-year yield",
        data: series(H, "L"),
        color: "var(--s-L)",
        w: 2,
      },
      {
        name: "Policy rate",
        data: series(H, "i"),
        color: "var(--s-rate)",
        step: 1,
        w: 2.5,
        d: 2,
        end: 1,
      },
    ],
  });
  drawChart($("#chB"), {
    title: "Balance sheet",
    now: t,
    zero: true,
    refs: [{ y: 10, label: "Normal size" }],
    series: [
      {
        name: "CB assets",
        data: series(H, "B"),
        color: "var(--s-L)",
        step: 1,
        w: 2.5,
        area: 1,
        d: 0,
        unit: "% GDP",
        end: 1,
      },
      {
        name: "Credit",
        data: series(H, "credit"),
        color: "var(--brass)",
        w: 2,
        unit: "%/yr",
      },
    ],
  });
}

export function contribRows(items, scale) {
  const mx = Math.max(scale, ...items.map((x) => Math.abs(x[1])));
  return `<div class="contrib">${items
    .map(([k, v, c]) => {
      const w = (Math.abs(v) / mx) * 50;
      return `<div class="cr"><span>${k}</span><span class="bar"><span style="${v >= 0 ? `left:50%` : `left:${50 - w}%`};width:${w}%;background:${c}"></span></span><span class="num">${fmtS(v, 2)}</span></div>`;
    })
    .join("")}</div>`;
}
export function renderWhy() {
  const t = T(),
    box = $("#whyBox");
  if (t === 0) {
    const s = cur(),
      sc = SC();
    box.innerHTML = `<h3>What is going on?</h3><div class="why">
      <div class="it"><span class="tg">Situation</span><span>${sc.brief}</span></div>
      <div class="it"><span class="tg">Tip</span><span>Monetary policy works with a lag: the policy rate moves borrowing costs right away, but spending and investment take 1–3 quarters to change clearly, and inflation takes longer still. That is why the staff forecast above matters: it shows where the economy is already heading. Choose your tools on the left, then click “Announce decision”. Results only appear after you announce.</span></div>
      <div class="it"><span class="tg">Real rate</span><span>Borrowing rate ${pct(s.lend)} minus expected inflation ${pct(s.piE)} = real interest rate ${pct(s.rl)}. Compared with neutral, financial conditions are <b>${stF(s.f)[1].toLowerCase()}</b>.</span></div>
    </div>`;
    return;
  }
  const r = APP.run.H[t],
    p = APP.run.H[t - 1],
    items = explainRow(r, p);
  const dy = r.y - p.y,
    dpi = r.pi - p.pi;
  box.innerHTML = `<div class="row" style="justify-content:space-between"><h3>Why did the economy change in ${qName(t)}?</h3><span class="small muted">Based on the model's assumptions</span></div>
    <div class="why">${items.map((x) => `<div class="it"><span class="tg">${x.tag}</span><span>${x.html}</span></div>`).join("")}</div>
    <div class="two">
      <div class="stack" style="gap:6px"><b class="small">Aggregate demand changed ${fmtS(dy, 2)} pp because of:</b>${contribRows(
        [
          ["Self-correction", r.cy.inertia, "var(--muted)"],
          ["Financial conditions", r.cy.fin, "var(--s-L)"],
          ["Outside events", r.cy.demand, "var(--brass)"],
          ["Surprises", r.cy.shock, "var(--s-pi)"],
        ],
        0.5,
      )}</div>
      <div class="stack" style="gap:6px"><b class="small">Inflation changed ${fmtS(dpi, 2)} pp because of:</b>${contribRows(
        [
          ["Expectations & inertia", r.cpi.expect, "var(--muted)"],
          ["Demand pressure", r.cpi.demand, "var(--brass)"],
          ["Supply shocks (oil, wages…)", r.cpi.supply, "var(--s-pi)"],
          ["Surprises", r.cpi.shock, "var(--s-u)"],
        ],
        0.5,
      )}</div>
    </div>`;
}
export function explainRow(r, p) {
  const out = [];
  // Policy
  let pol =
    r.di > 0.01
      ? `You <b>raised</b> the policy rate by ${fmt(r.di, 2)} pp to ${pct(r.i, 2)}.`
      : r.di < -0.01
        ? `You <b>cut</b> the policy rate by ${fmt(-r.di, 2)} pp to ${pct(r.i, 2)}.`
        : `You <b>held</b> the policy rate at ${pct(r.i, 2)}.`;
  if (r.qe > 0.01)
    pol += ` You bought bonds worth ${fmt(r.qe, 1)}% of GDP (QE), taking the balance sheet to ${fmt(r.B, 0)}% of GDP.`;
  else if (r.qe < -0.01)
    pol += ` You shrank the balance sheet by ${fmt(-r.qe, 1)}% of GDP (QT), leaving ${fmt(r.B, 0)}% of GDP.`;
  pol += ` Guidance: “${fgText(r.fg).short.toLowerCase()}”.`;
  const broke = (p.fg >= 1 && r.di < -0.01) || (p.fg <= -1 && r.di > 0.01);
  const kept = (p.fg >= 1 && r.di > 0.01) || (p.fg <= -1 && r.di < -0.01);
  if (broke)
    pol += ` <b style="color:var(--bad)">You acted against last quarter's guidance, so credibility fell</b> (${Math.round(p.c * 100)} → ${Math.round(r.c * 100)}).`;
  else if (kept)
    pol +=
      " Your action matched last quarter's guidance, which strengthens credibility.";
  out.push({ tag: "Policy", html: pol });
  // Markets
  const dL = r.L - p.L;
  const comp = [
    [0.5 * (r.i - p.i), "the change in the policy rate"],
    [0.5 * (r.piE - p.piE), "the change in expected inflation"],
    [
      r.tp - p.tp,
      r.B !== p.B
        ? r.B > p.B
          ? "central bank bond buying (QE) lowering the term premium"
          : "central bank selling (QT) raising the term premium"
        : "a change in market stress",
    ],
    [
      0.35 * (r.fg * r.c - p.fg * p.c),
      "forward guidance shifting expectations of future rates",
    ],
  ].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
  out.push({
    tag: "Markets",
    html:
      Math.abs(dL) < 0.03
        ? `The 10-year bond yield barely moved (${pct(r.L, 2)}).`
        : `The 10-year bond yield ${dL > 0 ? "rose" : "fell"} ${fmt(Math.abs(dL), 2)} pp to ${pct(r.L, 2)}, mainly because of ${comp[0][1]} (${fmtS(comp[0][0], 2)})${Math.abs(comp[1][0]) > 0.05 ? ` and ${comp[1][1]} (${fmtS(comp[1][0], 2)})` : ""}. Markets react almost instantly.`,
  });
  // Credit
  let cr = `Average borrowing rate ${pct(p.lend)} → <b>${pct(r.lend)}</b>. After subtracting expected inflation of ${pct(r.piE)}, the real rate is ${pct(r.rl)}, so financial conditions are <b>${stF(r.f)[1].toLowerCase()}</b>. Credit is growing ${pct(r.credit)} a year.`;
  if (r.stress > 0.5)
    cr += ` Markets are stressed, so banks demand an extra ${fmt(r.sp, 1)} pp risk spread.`;
  if (r.credit > 12)
    cr +=
      ' <b style="color:var(--warn)">Credit is growing too fast: risk of an asset bubble.</b>';
  out.push({ tag: "Credit", html: cr });
  // Demand
  let ad = `Demand vs capacity: ${fmtS(p.y)}% → <b>${fmtS(r.y)}%</b>. `;
  ad +=
    r.cy.fin < -0.15
      ? "High real borrowing costs lead firms to delay investment and households to cut back on mortgages and car loans. "
      : r.cy.fin > 0.15
        ? "Cheap credit encourages firms to invest and households to spend. "
        : "";
  ad +=
    "Most of this effect comes from decisions made 1–2 quarters ago (the lag).";
  if (r.event && r.event.demand)
    ad += ` The event “${esc(r.event.title)}” contributed ${fmtS(r.event.demand)} pp.`;
  out.push({ tag: "Demand", html: ad });
  // Jobs
  const du = r.u - p.u;
  out.push({
    tag: "Jobs",
    html: `Unemployment ${pct(p.u)} → <b>${pct(r.u)}</b>. ${Math.abs(du) < 0.05 ? "The labour market barely moved." : du < 0 ? "Output rose, so firms hired more workers." : "Output fell, so firms cut jobs."} Firms adjust staffing more slowly than output (Okun's law).`,
  });
  // Inflation
  const drv = [
    [r.cpi.expect, "expectations and price inertia"],
    [r.cpi.demand, "demand pressure"],
    [r.cpi.supply, "supply shocks (input costs)"],
  ].sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
  out.push({
    tag: "Inflation",
    html: `Inflation ${pct(p.pi)} → <b>${pct(r.pi)}</b> (core ${pct(r.core)}). Main driver: ${drv[0][1]} (${fmtS(drv[0][0], 2)} pp). ${r.cpi.demand > 0.1 ? "Demand above capacity lets firms raise prices." : r.cpi.demand < -0.1 ? "Weak demand holds firms back from raising prices." : ""}`,
  });
  // Model vs outcome
  if (r.fc) {
    const ep = r.pi - r.fc.pi,
      ey = r.y - r.fc.y;
    if (Math.abs(ep) > 0.2 || Math.abs(ey) > 0.3) {
      const why = [
        r.event ? `the event “${esc(r.event.title)}”` : "",
        Math.abs(r.shock.d) > 0.15 || Math.abs(r.shock.p) > 0.12
          ? "surprises outside the model"
          : "",
      ]
        .filter(Boolean)
        .join(" and ");
      out.push({
        tag: "Uncertainty",
        html: `Without surprises, the model would have produced inflation of ${pct(r.fc.pi)} and a demand gap of ${fmtS(r.fc.y)}%; the actual figures were ${pct(r.pi)} and ${fmtS(r.y)}%. The difference came from ${why || "surprises"}. Policymaking always involves uncertainty.`,
      });
    } else
      out.push({
        tag: "Uncertainty",
        html: `Few surprises this quarter: the outcome was close to what the model predicts from your decision.`,
      });
  }
  return out;
}

export function reflectQ() {
  const t = T(),
    H = APP.run.H,
    s = cur(),
    p = H[t - 1];
  if (t === 0)
    return "Look at the starting indicators: what is the biggest problem? If you could use only one tool, which would you pick, and why?";
  if (t >= N_Q)
    return 'If you could do it again, which decision would you change first? Try it in the "Compare strategies" tab.';
  if ((p.fg >= 1 && s.di < -0.01) || (p.fg <= -1 && s.di > 0.01))
    return "You just went back on your word. Next time you give guidance, how much will markets believe you?";
  if (s.i <= 0.01 && s.y < -1)
    return "The policy rate is at 0%. What other tools do you have to lower long-term borrowing costs and support the economy?";
  if (s.cpi && s.cpi.supply > 0.3)
    return "Inflation rose because of a supply shock. Will raising interest rates bring oil prices down? If not, why might a central bank still need to respond?";
  if (
    t <= 3 &&
    H.slice(1).some((r) => Math.abs(r.di) > 0.4) &&
    Math.abs(s.y - H[0].y) < 0.8
  )
    return "You changed the policy rate, but output and unemployment have hardly moved. Why do the effects take so long to show up?";
  if (s.pi < p.pi - 0.15 && s.u > p.u + 0.05)
    return "Inflation is falling but unemployment is rising. What trade-off is this? How much extra unemployment will you accept to bring inflation down?";
  if (s.c < p.c - 0.02 && s.pi > 3)
    return "Credibility is slipping because inflation is persisting. Does that make bringing inflation down easier or harder? Why?";
  if (s.credit > 12)
    return "Credit is growing very fast. What could go wrong if this continues for several years?";
  if (s.fc && Math.abs(s.pi - s.fc.pi) > 0.3)
    return "The outcome included surprises outside the model. When the future is uncertain, should a central bank act boldly or move cautiously, step by step?";
  if (Math.abs(s.pi - 2) < 0.5 && Math.abs(s.u - SC().uStar) < 0.5)
    return "The indicators are close to target. If you hold rates steady, what does the staff forecast say will happen over the next 4 quarters? Do you agree?";
  return "If you were a family paying off a mortgage, how would this quarter's decision affect you? What about a saver?";
}
export function renderSide() {
  const t = T(),
    H = APP.run.H,
    s = cur(),
    p = H[t - 1];
  const arr = (d, flat = 0.04) =>
    d === null
      ? ""
      : d > flat
        ? '<span class="arr up">▲</span>'
        : d < -flat
          ? '<span class="arr dn">▼</span>'
          : '<span class="arr fl">■</span>';
  const D = (k) => (p ? s[k] - p[k] : null);
  const nodes = [
    ["Policy rate", pct(s.i, 2), D("i")],
    ["10-year bond yield", pct(s.L, 2), D("L")],
    ["Borrowing rates & credit", pct(s.lend), D("lend")],
    ["Consumption & investment (demand)", fmtS(s.y) + "%", D("y")],
    ["Output & jobs (unemployment)", pct(s.u), D("u")],
    ["Inflation", pct(s.pi), D("pi")],
  ];
  const lags = [
    "instant · via expectations & QE",
    "instant · plus risk spread",
    "1–3 quarters",
    "1–2 quarters",
    "1–2 quarters",
  ];
  const news = H.filter((r) => r.event)
    .slice()
    .reverse();
  $("#side").innerHTML = `
    <div class="panel"><h3>Policy transmission chain</h3><p class="small muted" style="margin:4px 0 10px">Arrows: change from last quarter.</p>
      <div class="chain">${nodes.map((n, k) => `<div class="node"><span class="nk">${n[0]}</span><span class="nv">${n[1]}${arr(n[2])}</span></div>${k < lags.length ? `<div class="link">${lags[k]}</div>` : ""}`).join("")}</div>
      <div class="expect"><b>Expected inflation: ${pct(s.piE)}</b> · Credibility ${Math.round(s.c * 100)}/100<br>The higher your credibility, the more people believe inflation will return to 2%, so it falls faster and at lower cost.</div>
    </div>
    <div class="panel stack"><h3>Think about it</h3><div class="ask">${reflectQ()}</div></div>
    <div class="panel stack"><h3>Economic news</h3><div class="news">${news.length ? news.map((r) => `<div class="ni ${r.event.kind}"><div class="q">${qName(r.t)}</div><b>${esc(r.event.title)}</b><br><span class="muted">${esc(r.event.text)}</span></div>`).join("") : '<p class="small muted">No major events yet. News will appear when an outside shock hits.</p>'}</div></div>`;
}

export function endDialog() {
  if (APP.endShown === APP.run) return;
  APP.endShown = APP.run;
  const sco = scoreRun(APP.run),
    b = benchmarks();
  openDialog(`<h2>Your 3-year term is over</h2>
    <div class="row"><span class="grade" style="font-size:48px">${grade(sco.total)}</span><div><div class="score">${Math.round(sco.total)} points</div><div class="small muted">Taylor rule: ${Math.round(b.taylor.score.total)} · Do nothing: ${Math.round(b.hold.score.total)}</div></div></div>
    <p>See which trade-offs you made in the Evaluate tab, then save this strategy to compare it with a different approach.</p>
    <div class="row"><button class="btn primary" id="dEval">See evaluation</button><button class="btn" id="dCmp">Compare strategies</button><button class="btn" id="dClose">Close</button></div>`);
  $("#dEval").onclick = () => {
    closeDialog();
    setTab("eval");
  };
  $("#dCmp").onclick = () => {
    closeDialog();
    setTab("compare");
  };
  $("#dClose").onclick = closeDialog;
}
