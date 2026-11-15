// TAB ? – LEARN: kiến thức nền, mô hình và cách chấm điểm.

import { forecast } from "../core/model.js";
import { $, SC, pct } from "../core/utils.js";
import { closeDialog, openDialog } from "../ui/dialogs.js";

// ===== LEARN =====
// Nội dung các thẻ kiến thức: t = tiêu đề, b = nội dung HTML (<dl> là danh sách định nghĩa).
export const LEARN = {
  rate: {
    t: "Policy rate",
    b: `<dl>
    <dt>What it is</dt><dd>The interest rate the central bank charges when it lends to commercial banks for short periods. In the US it is the federal funds rate; in Vietnam, the State Bank's refinancing rate is one of its policy rates.</dd>
    <dt>How it works</dt><dd>Policy rate up → banks raise lending rates → firms invest less and households borrow less for homes and cars → aggregate demand falls → firms hire fewer people and find it harder to raise prices → inflation falls.</dd>
    <dt>Lags</dt><dd>Borrowing costs change almost immediately; spending and investment respond after 1–3 quarters; inflation is slowest.</dd>
    <dt>Limits</dt><dd>It cannot go much below 0%. It does not fix the cause of a supply shock (such as an oil price spike).</dd>
    <dt>Real-world example</dt><dd>In 2022 the US Federal Reserve raised its rate from 0–0.25% to 4.25–4.5% to fight the highest inflation in 40 years. In 2023 the State Bank of Vietnam cut its policy rates four times to support growth.</dd></dl>`,
  },
  qe: {
    t: "Quantitative easing / tightening (QE / QT)",
    b: `<dl>
    <dt>What QE is</dt><dd>The central bank creates money to buy long-term bonds in the market. Bond prices rise and long-term yields fall, pulling down mortgage and business borrowing rates, even when the policy rate is already at 0%.</dd>
    <dt>What QT is</dt><dd>The reverse: the central bank sells bonds or lets them mature without reinvesting. Long-term yields rise and financial conditions tighten.</dd>
    <dt>When it works best</dt><dd>When financial markets are stressed and the policy rate has hit bottom. In this simulation, QE is more powerful when market stress is high.</dd>
    <dt>Limits</dt><dd>A very large balance sheet is hard to shrink later and can inflate asset prices. The simulation deducts points when the balance sheet exceeds 35% of GDP.</dd>
    <dt>Real-world example</dt><dd>After the 2008 crisis the Fed bought assets, growing its balance sheet from about $900 billion to about $4.5 trillion. From mid-2022 the Fed began QT.</dd></dl>`,
  },
  adas: {
    t: "Reading the AD–AS graph",
    b: `<dl>
    <dt>The curves</dt><dd><b>AD</b> (aggregate demand, slopes down): total spending by households, firms, government and the rest of the world. <b>SRAS</b> (short-run aggregate supply, slopes up): firms produce more when prices are higher. <b>LRAS</b> (vertical): potential output Y*, set by labour, capital and technology.</dd>
    <dt>Equilibrium</dt><dd>Where AD meets SRAS. Right of LRAS: the economy is overheating. Left of LRAS: spare capacity and high unemployment.</dd>
    <dt>What monetary policy moves</dt><dd>The policy rate, QE/QT and forward guidance shift <b>AD</b>: tightening pushes AD left, easing pushes it right, but it takes 1–3 quarters.</dd>
    <dt>What the central bank can't do</dt><dd>It cannot shift SRAS back when oil prices rise, and it cannot move LRAS. When SRAS shifts up (stagflation), every choice about AD means trading off inflation against output.</dd>
    <dt>Expectations</dt><dd>If people expect high inflation, workers demand higher wages and firms raise prices, so SRAS shifts up. Central bank credibility helps keep SRAS stable.</dd>
    <dt>Note</dt><dd>The vertical axis uses the inflation rate instead of the price level, to match the dashboard. The slopes of the curves are illustrative only.</dd></dl>`,
  },
  fg: {
    t: "Forward guidance",
    b: `<dl>
    <dt>What it is</dt><dd>The central bank announces in advance what it intends to do with interest rates. Because long-term borrowing costs depend on expected future rates, words alone can change financial conditions today.</dd>
    <dt>How it works</dt><dd>“We will keep rates low for a long time” → markets expect lower future rates → long-term yields fall → borrowing gets cheaper.</dd>
    <dt>What makes it work</dt><dd>Credibility. Promises from a credible central bank have more effect. Saying one thing and doing another destroys credibility and weakens every tool afterwards.</dd>
    <dt>Real-world example</dt><dd>In August 2011 the Fed said it expected to keep rates exceptionally low “at least through mid-2013”. In 2012 ECB President Mario Draghi pledged to do “whatever it takes” to preserve the euro, and bond yields in several countries fell sharply.</dd></dl>`,
  },
};
// Vẽ tab Learn từ dữ liệu LEARN cộng thêm vài thẻ cố định.
export function renderLearn() {
  const sc = SC();
  $("#v-learn").innerHTML = `<div class="learn">
    ${Object.values(LEARN)
      .map(
        (x) =>
          `<div class="panel"><h2 style="font-size:18px">${x.t}</h2>${x.b}</div>`,
      )
      .join("")}
    <div class="panel"><h2 style="font-size:18px">Objectives and trade-offs</h2><dl>
      <dt>The short-run trade-off (Phillips curve)</dt><dd>To bring down inflation caused by overheating demand, the central bank has to cool demand, and unemployment usually rises for a while.</dd>
      <dt>Supply shocks: the hardest problem</dt><dd>When oil prices jump, inflation rises and output falls at the same time. Tightening anchors expectations but deepens the downturn; easing supports jobs but can let inflation become entrenched.</dd>
      <dt>A lesson from history</dt><dd>In the early 1980s the Fed under Paul Volcker pushed interest rates close to 20%. US inflation fell from about 13% (1980) to about 3% (1983), but unemployment rose above 10% at one point.</dd>
      <dt>The long run</dt><dd>Monetary policy cannot keep unemployment below its natural rate forever. Trying to do so only creates inflation.</dd></dl></div>
    <div class="panel"><h2 style="font-size:18px">The model behind the simulation</h2>
      <p class="small muted">A simplified macroeconomic model; each step is one quarter. Outcomes follow the relationships below, not random assignment.</p>
      <div class="eq">10-year yield = ½ policy rate + ½ (neutral real rate + expected inflation) + term premium + guidance effect × credibility</div>
      <div class="eq">The term premium falls when the central bank buys assets (QE), more so when markets are stressed</div>
      <div class="eq">Borrowing rate = 10-year yield + credit risk spread · Real rate = borrowing rate − expected inflation</div>
      <div class="eq">Demand<sub>this quarter</sub> = 0.72 × demand<sub>last quarter</sub> − 0.42 × financial conditions (30% this quarter, 45% last quarter, 25% two quarters ago) + events</div>
      <div class="eq">Unemployment moves gradually towards: natural rate − 0.45 × output gap (Okun's law)</div>
      <div class="eq">Core inflation = 60% inertia + 40% expectations + 0.16 × demand pressure (1–2 quarter lag) · Headline inflation = core + supply shocks</div>
      <div class="eq">Expected inflation = credibility × 2% + (1 − credibility) × last quarter's inflation</div>
      <div class="eq">Staff forecast = the same equations run forward 4 quarters with policy unchanged, no scripted events and no surprises</div>
      <p class="small muted">Current scenario settings: neutral real rate ${pct(sc.rstar)}, natural unemployment ${pct(sc.uStar)}, potential growth ${pct(sc.gPot)}.</p></div>
    <div class="panel"><h2 style="font-size:18px">Assumptions and limits</h2><ul class="clean small">
      <li>Policy works with lags; results do not appear immediately.</li>
      <li>Outside shocks are scripted in each scenario; small surprises (if switched on) come from a fixed shock set so comparisons are fair.</li>
      <li>You cannot see the result of your own decision in advance. The staff forecast only shows the path if policy stays unchanged, and it cannot see future events or surprises.</li>
      <li>Fiscal, structural and exchange-rate policy and bank supervision are outside your control and appear only as assumptions or events.</li>
      <li>In reality, how policy is transmitted depends on expectations, the financial system, the global economy and many factors the model leaves out. The coefficients are chosen to be easy to understand, not to forecast a real economy.</li></ul></div>
    <div class="panel"><h2 style="font-size:18px">How scoring works</h2><ul class="clean small">
      <li><b>Price stability (30%)</b>: how far inflation is from 2%.</li>
      <li><b>Jobs (25%)</b>: how far unemployment is from its natural rate.</li>
      <li><b>Stable output (15%)</b>: how far demand is from productive capacity.</li>
      <li><b>Financial stability (15%)</b>: avoid abrupt moves, credit booms and an oversized balance sheet.</li>
      <li><b>Credibility (15%)</b>: credibility at the end of your term.</li>
      <li>Later quarters count more, because the situation at the start is a "legacy" you inherited.</li>
      <li>Grades: A ≥ 85 · B ≥ 72 · C ≥ 58 · D ≥ 45 · E below 45.</li></ul></div>
    <div class="panel"><h2 style="font-size:18px">Glossary</h2><dl>
      <dt>Core inflation</dt><dd>Inflation excluding volatile items such as energy and food.</dd>
      <dt>Inflation expectations</dt><dd>The inflation rate people and firms expect; it shapes how they set prices and negotiate wages.</dd>
      <dt>Neutral interest rate</dt><dd>The rate that neither stimulates nor holds back the economy.</dd>
      <dt>Output gap</dt><dd>Aggregate demand compared with productive capacity. Positive: overheating; negative: spare capacity.</dd>
      <dt>Natural rate of unemployment</dt><dd>Unemployment when the economy is in balance, caused by people changing jobs and skill mismatches.</dd>
      <dt>Term premium</dt><dd>The extra yield investors demand for holding long-term rather than short-term bonds.</dd>
      <dt>Sacrifice ratio</dt><dd>Point-years of unemployment above the natural rate needed to cut inflation by 1 pp.</dd>
      <dt>Zero lower bound (ZLB)</dt><dd>The policy rate cannot go much below zero, so the central bank needs other tools such as QE and forward guidance.</dd>
      <dt>pp (percentage point)</dt><dd>The arithmetic difference between two percentages: from 3% to 4% is a rise of 1 pp.</dd></dl></div>
  </div>`;
}
// Mở một thẻ kiến thức trong hộp thoại (nút "What is this?").
export function learnDialog(k) {
  const x = LEARN[k];
  openDialog(
    `<h2>${x.t}</h2><div class="learn" style="display:block">${x.b}</div><div><button class="btn primary" id="dOk">Got it</button></div>`,
  );
  $("#dOk").onclick = closeDialog;
}
