// ===== ECONOMIC MODEL (pure, no DOM) =====
const PI_TARGET = 2;
const N_Q = 12;

const SCENARIOS = {
  'lam-phat': {
    name: 'Inflation surge',
    tag: 'Overheating economy',
    brief: 'After a period of heavy stimulus, spending is booming while supply chains are jammed. Inflation is more than three times the target and unemployment is at a record low. The policy rate is still near zero, and the central bank balance sheet is still swollen from earlier rounds of QE.',
    challenge: 'Bring inflation back to 2% without pushing the economy into a deep recession.',
    pi0: 6.8, piPrev: 6.0, yPre: [-0.6, 0.4, 1.1, 1.6], y0: 1.9, u0: 3.6, i0: 0.5, B0: 32, c0: 0.6,
    rstar: 0.5, uStar: 4.5, gPot: 2.0, tp: 0.8, sp: 1.8, stress0: 0, supply0: 1.1, supplyRho: 0.7, demand0: 0.2,
    events: {
      2: { title: 'Global energy prices cool', text: 'Oil prices fall 15% from last quarter, easing pressure on production costs.', supply: -0.5, kind: 'good' },
      5: { title: 'Unions win 7% pay rises', text: 'Many industries raise wages to catch up with past inflation. Risk of a wage–price spiral.', supply: 0.45, kind: 'bad' },
      8: { title: 'Housing market stalls', text: 'Home sales drop sharply as mortgage rates bite.', demand: -0.35, kind: 'bad' }
    }
  },
  'suy-thoai': {
    name: 'Demand-driven recession',
    tag: 'Firms cutting investment',
    brief: 'Business confidence has collapsed after a trade shock. Orders are falling, factories are cutting shifts and unemployment is rising fast. Inflation is still close to target but drifting down.',
    challenge: 'Stop the slide and bring unemployment back to its natural rate without creating inflation later.',
    pi0: 2.1, piPrev: 2.4, yPre: [0.5, 0.2, -0.4, -1.0], y0: -1.6, u0: 5.5, i0: 4.5, B0: 12, c0: 0.75,
    rstar: 1.0, uStar: 4.5, gPot: 2.0, tp: 0.8, sp: 1.8, stress0: 0.4, supply0: 0, supplyRho: 0.6, demand0: -0.5,
    events: {
      1: { title: 'Exports keep falling', text: 'Exports are down 8% year on year; industrial parks are laying off workers.', demand: -0.5, kind: 'bad' },
      2: { title: 'Firms shelve expansion plans', text: 'A survey shows 40% of businesses are postponing new investment.', demand: -0.35, kind: 'bad' },
      7: { title: 'New trade deal signed', text: 'Export markets reopen and business confidence improves.', demand: 0.5, kind: 'good' }
    }
  },
  'khung-hoang': {
    name: 'Financial crisis',
    tag: 'Rates stuck near 0%',
    brief: 'Several large banks have suffered heavy losses and credit markets have almost frozen: lending spreads have soared and firms cannot borrow. The policy rate is only 1%, close to zero.',
    challenge: 'With little room left to cut rates, use QE and forward guidance to ease financial conditions.',
    pi0: 1.3, piPrev: 1.9, yPre: [0.3, -0.5, -1.4, -2.3], y0: -3.1, u0: 6.6, i0: 1.0, B0: 8, c0: 0.7,
    rstar: 0.0, uStar: 4.5, gPot: 1.8, tp: 0.9, sp: 1.8, stress0: 2.2, supply0: -0.2, supplyRho: 0.6, demand0: -0.7,
    events: {
      1: { title: 'Another bank fails', text: 'Depositors panic and banks stop lending to each other.', stress: 0.8, demand: -0.4, kind: 'bad' },
      3: { title: 'Government guarantees deposits', text: 'Fiscal policy (outside your control) helps calm depositors.', stress: -0.6, kind: 'good' },
      9: { title: 'Firms start hiring again', text: 'New business registrations rise for the first time in two years.', demand: 0.3, kind: 'good' }
    }
  },
  'dinh-lam': {
    name: 'Stagflation (oil shock)',
    tag: 'High inflation + high unemployment',
    brief: 'World oil prices have doubled. Rising production costs are pushing prices up while output falls. People are starting to believe inflation will stay high for a long time.',
    challenge: 'Face the hardest trade-off: tighten to anchor inflation expectations, or ease to protect jobs?',
    pi0: 5.6, piPrev: 4.4, yPre: [0.4, 0.3, -0.1, -0.5], y0: -0.9, u0: 5.5, i0: 3.0, B0: 10, c0: 0.45,
    rstar: 1.0, uStar: 4.5, gPot: 2.0, tp: 0.8, sp: 1.8, stress0: 0.2, supply0: 1.5, supplyRho: 0.8, demand0: -0.2,
    events: {
      3: { title: 'Conflict disrupts oil supply', text: 'Oil jumps another 30%. Fuel, transport and food prices all rise.', supply: 1.0, kind: 'bad' },
      6: { title: 'Household inflation expectations rise', text: 'Survey: people expect prices to rise 6% over the next year.', supply: 0.35, kind: 'bad' },
      9: { title: 'Oil prices start to fall', text: 'Producers raise output and oil drops 20%.', supply: -0.8, kind: 'good' }
    }
  },
  'ha-canh': {
    name: 'Soft landing',
    tag: 'Slightly hot, hidden risks',
    brief: 'The economy is growing well, inflation is a little above target and the labour market is tight. Everything looks fine, but risk is building up in property lending.',
    challenge: 'Guide inflation gently back to 2% and react in time when a shock hits.',
    pi0: 3.5, piPrev: 3.2, yPre: [0.3, 0.6, 0.9, 1.1], y0: 1.3, u0: 3.9, i0: 3.5, B0: 18, c0: 0.72,
    rstar: 1.0, uStar: 4.5, gPot: 2.0, tp: 0.8, sp: 1.8, stress0: 0, supply0: 0.3, supplyRho: 0.6, demand0: 0.4,
    events: {
      6: { title: 'Regional bank turmoil', text: 'Three property lenders run into liquidity trouble. Lending spreads jump.', stress: 1.6, demand: -0.5, kind: 'bad' },
      7: { title: 'Consumers tighten their belts', text: 'Retail sales fall for a second month in a row.', demand: -0.3, kind: 'bad' }
    }
  }
};

const FG_LEVELS = [
  { v: -2, short: 'Strong ease', text: 'The Board commits to keeping rates low for a long time and stands ready to ease further.' },
  { v: -1, short: 'Lean ease', text: 'The Board is leaning towards cutting rates at upcoming meetings.' },
  { v: 0, short: 'Neutral', text: 'The next decision will depend on the economic data.' },
  { v: 1, short: 'Lean hike', text: 'The Board is leaning towards raising rates at upcoming meetings.' },
  { v: 2, short: 'Strong hike', text: 'The Board commits to keep raising rates until inflation is back at target.' }
];

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
//
function makeShocks(seed) {
  const r = makeRng(seed);
  const g = () => { const u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const out = [];
  for (let k = 0; k <= N_Q + 8; k++) out.push({ d: g() * 0.28, p: g() * 0.18 });
  return out;
}

//
function finance(sc, i, B, stress, piE, fg, c, y) {
  const qeEff = (B - 10) * (1 + 0.6 * stress);
  const tp = Math.max(-1, sc.tp + 0.35 * stress - 0.045 * qeEff);
  const L = 0.5 * i + 0.5 * (sc.rstar + piE) + tp + 0.35 * fg * c;
  const sp = Math.max(0.6, sc.sp + 1.0 * stress + 0.08 * Math.max(0, -y) - 0.02 * Math.max(0, B - 10) * stress);
  const lend = L + sp;
  const rl = lend - piE;
  const neutral = sc.rstar + sc.tp + sc.sp;
  return { tp, L, sp, lend, rl, f: rl - neutral };
}

function initRun(key, seed) {
  const sc = SCENARIOS[key];
  const piE0 = sc.c0 * PI_TARGET + (1 - sc.c0) * sc.piPrev;
  const fin0 = finance(sc, sc.i0, sc.B0, sc.stress0, piE0, 0, sc.c0, sc.y0);
  const g0 = sc.gPot + (sc.y0 - sc.yPre[0]);
  return {
    key, seed, noise: true,
    shocks: makeShocks(seed),
    yPre: sc.yPre.slice(),
    H: [{
      t: 0, pi: sc.pi0, core: sc.pi0 - sc.supply0, piE: piE0, y: sc.y0, u: sc.u0, g: g0, i: sc.i0, B: sc.B0, qe: 0, fg: 0, c: sc.c0,
      stress: sc.stress0, supply: sc.supply0, demand: sc.demand0, ...fin0,
      credit: clamp(7 + 1.2 * sc.y0 - 2.0 * fin0.f, -8, 25), event: null
    }]
  };
}

//
function stepRun(run, dec, opts = {}) {
  const sc = SCENARIOS[run.key];
  const H = run.H;
  const t = H.length - 1;
  const s = H[t];
  const prev = t > 0 ? H[t - 1] : { f: s.f, y: run.yPre[3] };
  const noise = opts.noise !== undefined ? opts.noise : run.noise;
  const sh = noise ? run.shocks[t + 1] : { d: 0, p: 0 };
  const ev = opts.noEvents ? null : (sc.events[t + 1] || null);

  const i = clamp(Math.round(dec.i * 4) / 4, 0, 12);
  const B = clamp(s.B + dec.qe, 5, 45);
  const qe = B - s.B;
  const fg = dec.fg;
  const di = i - s.i;

  //
  let dc = 0.015 - 0.01 * Math.abs(s.pi - PI_TARGET);
  if (s.fg >= 1 && di < -0.01) dc -= 0.08;
  if (s.fg <= -1 && di > 0.01) dc -= 0.08;
  if ((s.fg >= 1 && di > 0.01) || (s.fg <= -1 && di < -0.01)) dc += 0.015;
  const c = clamp(s.c + dc, 0.15, 0.9);

  const stress = Math.max(0, s.stress * 0.75 + (ev && ev.stress || 0));
  const supply = s.supply * sc.supplyRho + (ev && ev.supply || 0);
  const demand = s.demand * 0.6 + (ev && ev.demand || 0);
  const piE = c * PI_TARGET + (1 - c) * s.pi;
  const fin = finance(sc, i, B, stress, piE, fg, c, s.y);

  const yLag2 = t >= 1 ? H[t - 1].y : run.yPre[3];
  const fLag2 = prev.f;
  const y = 0.72 * s.y - 0.42 * (0.3 * fin.f + 0.45 * s.f + 0.25 * fLag2) + demand + sh.d;
  //
  const core = 0.6 * s.core + 0.4 * piE + 0.16 * (0.5 * s.y + 0.5 * yLag2) + sh.p;
  const pi = core + supply;
  const u = s.u + 0.45 * ((sc.uStar - 0.45 * y) - s.u);
  const yAgo = (t + 1 - 4) >= 0 ? H[t + 1 - 4].y : run.yPre[t + 1];
  const g = sc.gPot + (y - yAgo);
  const credit = clamp(7 + 1.2 * y - 2.0 * fin.f, -8, 25);

  //
  const cy = { inertia: -0.28 * s.y, fin: -0.42 * (0.3 * fin.f + 0.45 * s.f + 0.25 * fLag2), demand, shock: sh.d };
  const cpi = { expect: 0.4 * (piE - s.core), demand: 0.16 * (0.5 * s.y + 0.5 * yLag2), supply: supply - s.supply, shock: sh.p };
  const row = { cy, cpi, t: t + 1, pi, core, piE, y, u, g, i, B, qe, fg, c, stress, supply, demand, ...fin, credit, event: ev, di, shock: sh };
  H.push(row);
  return row;
}

//
function forecast(run, dec, k = 4) {
  const clone = { ...run, H: run.H.map(r => ({ ...r })) };
  const out = [];
  for (let j = 0; j < k && clone.H.length - 1 < N_Q; j++) {
    out.push(stepRun(clone, j === 0 ? dec : { i: dec.i, qe: 0, fg: dec.fg }, { noise: false, noEvents: true }));
  }
  return out;
}

//
function taylorDecision(run) {
  const sc = SCENARIOS[run.key];
  const s = run.H[run.H.length - 1];
  const target = sc.rstar + s.pi + 0.5 * (s.pi - PI_TARGET) + 0.5 * s.y;
  let i = clamp(Math.round((0.55 * s.i + 0.45 * target) * 4) / 4, 0, 12);
  let qe = 0;
  if (target < 0.5 && i <= 0.5) qe = Math.min(4, (0.5 - target) * 1.2);
  else if (s.B > 15 && s.pi > 2.5) qe = -1.5;
  const fg = target > i + 0.75 ? 1 : (target < i - 0.75 ? -1 : 0);
  return { i, qe: Math.round(qe * 2) / 2, fg };
}
function holdDecision(run) {
  const s = run.H[run.H.length - 1];
  return { i: s.i, qe: 0, fg: 0 };
}
function simulateStrategy(key, seed, noise, fn) {
  const run = initRun(key, seed); run.noise = noise;
  while (run.H.length - 1 < N_Q) stepRun(run, fn(run));
  return run;
}

//
function scoreRun(run) {
  const sc = SCENARIOS[run.key];
  const rows = run.H.slice(1);
  if (!rows.length) return null;
  let W = 0, ePi = 0, eU = 0, eG = 0, vol = 0, st = 0;
  rows.forEach(r => {
    const w = 0.2 + Math.pow(r.t / N_Q, 1.5);
    W += w;
    ePi += w * Math.abs(r.pi - PI_TARGET);
    eU += w * Math.abs(r.u - sc.uStar);
    eG += w * Math.abs(r.y);
    vol += Math.max(0, Math.abs(r.di) - 0.5) + 0.1 * Math.max(0, Math.abs(r.qe) - 2);
    st += Math.max(0, r.credit - 12) / 6;
  });
  ePi /= W; eU /= W; eG /= W; vol /= rows.length; st /= rows.length;
  const last = rows[rows.length - 1];
  const bsPen = Math.max(0, last.B - 35) / 25;
  const parts = {
    price: 100 * Math.exp(-ePi / 2.2),
    jobs: 100 * Math.exp(-eU / 1.5),
    growth: 100 * Math.exp(-eG / 2.0),
    fin: 100 * Math.exp(-(vol / 0.6 + st + bsPen)),
    cred: clamp((last.c - 0.15) / 0.75, 0, 1) * 100
  };
  const total = 0.3 * parts.price + 0.25 * parts.jobs + 0.15 * parts.growth + 0.15 * parts.fin + 0.15 * parts.cred;
  return { parts, total, ePi, eU, eG, vol };
}
function grade(x) {
  if (x >= 85) return 'A'; if (x >= 72) return 'B'; if (x >= 58) return 'C'; if (x >= 45) return 'D'; return 'E';
}

if (typeof module !== 'undefined') module.exports = { SCENARIOS, FG_LEVELS, initRun, stepRun, forecast, taylorDecision, holdDecision, simulateStrategy, scoreRun, grade, N_Q, PI_TARGET };

