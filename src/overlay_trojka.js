// ===== T50 RAZEM — nakładka TRÓJKA V1.3 (Test50 x1x, T1/T2, off +7, K8) =====
// Wygląd jak T50 1T/200/2T: GRA (karty UG) · TABELA (UT: Nr · Kod · GRA · Stan/Rola) · STATY.
// Okna liczone tak samo jak etykiety w _models(): TRIGGER → przygotowanie 1–5/6 → ★ START (6) → gra w cyklu T+7.
(function () {
  const esc = window.__t50esc;
  const NICE = { SEEK: 'szukam pary', PENDING1: '1. trafienie', SPRAWDZ: 'SPRAWDŹ — 3-cie decyduje', IGNORE: 'po WIN — ignoruję' };

  function openWindows(m) {
    const n = model.winCycles.length, out = [];
    let tn = 0;
    for (let i = 0; i < n; i++) {
      if (!m.trig.has(model.winCycles[i][1])) continue;
      tn++;
      if (i + OFFSET < n) continue;                       // okno rozliczone (WIN/LOSS)
      const done = n - 1 - i;                             // ile WIN-cykli minęło od triggera (0…6)
      out.push({ tn, done, eventEr: model.winCycles[i + done][0] });
    }
    return out;
  }
  // stary pulpit czyta model.openWindows, którego silnik nie wypełnia — wypełniamy po każdym przeliczeniu
  const _recompute = recompute;
  recompute = function () {
    _recompute();
    MODELS.forEach(m => { model.openWindows[m.name] = openWindows(m); });
  };
  MODELS.forEach(m => { model.openWindows[m.name] = openWindows(m); });

  const F = window.T50Frame('TRÓJKA V1.3 · Test50 x1x · off +7 · K8', [['gra', 'GRA'], ['tab', 'TABELA'], ['stat', 'STATY']]);
  const _renderAll = renderAll;
  renderAll = function (keep) { _renderAll(keep); F.setN(`n=${model.N.toLocaleString('pl-PL')}`); F.render(F.view); };

  function sync() { codes = load().map(toCode).filter(Boolean); recompute(); renderAll(false); }
  function add(c) {
    addCode(c);
    const ev = MODELS.map(m => { const mm = (model.rowModel[model.N] || {})[m.name]; return mm ? `<b>${m.name}</b> ${esc(mm.text)}` : ''; }).filter(Boolean);
    return ev.join('<br>');
  }
  function undo1() { window.__t50auto1(undo); }

  // ---- TABELA (UT) — etykiety 1:1 z rowRole (baza V1.3) i rowModel (model) ----
  const ms = prio => { const a = MODEL_STYLE[prio] || ['#FFFFFF', '#000000']; return `background:${a[0]};color:${a[1]}`; };
  const bs = bk => `background:${BASE_FILL[bk] || '#F2F2F2'};color:#000`;
  const TAG = { trigger: 'T', krok: 'p', start: '★', gra: 'k', win: 'W', loss: 'L' };
  const EVN = { trigger: 'TRIGGER', krok: 'przygotowanie', start: '★ START', gra: 'krok gry', win: 'WIN', loss: 'LOSS (BUST)' };
  const SUBR = { SKIP: 'poza parą — szukam 1. trafienia x1x', para: '1. trafienie pary', 'SPRAWDŹ': '2. trafienie — następny x1x = WIN', miss: 'brak 3. trafienia → K+1', WIN: 'koniec cyklu (WIN-cykl)' };
  // gry modelu z wierszem rozliczenia (jak _models(): okno trigger i → WIN-cykl i+OFFSET)
  const ST3 = [8, 16, 32, 64, 128, 256, 512, 1024];   // profit(M) = 3·stawka_M − suma stawek; BUST −2040
  function gamesOf(m) {
    const wc = model.winCycles, out = [];
    for (let i = 0; i + OFFSET < wc.length; i++) if (m.trig.has(wc[i][1])) out.push({ trigEr: wc[i][0] - 1, er: wc[i + OFFSET][0] - 1, K: wc[i + OFFSET][1] });
    return out;
  }
  const A = {
    stats: mi => {
      const m = MODELS[mi], s = model.stats(m.name), b = model.baseState;
      return [['Triggery (WIN M=' + [...m.trig][0] + ')', s.trig]].concat(window.T50Stat.brief(gamesOf(m), model.N, ST3, 3),
        [['Okna otwarte', s.open], ['Baza teraz', `${NICE[b.state] || b.state} · K=${b.K}`]]);
    },
    win: () => 'x1x',   // kod, który daje WIN zakładu
    N: () => model.N, code: i => model.codes[i], isNew: i => i >= SEED.length / 3,
    models: () => MODELS.map(m => ({ id: m.name })),
    desc: mi => { const m = MODELS[mi]; return `${m.name}: TRIGGER = WIN-cykl M=${[...m.trig][0]} · przygotowanie ${START_STEP - 1} cykli · ★ START · gra w cyklu T+${OFFSET} · K${K_LIMIT}`; },
    descTxt: mi => { const m = MODELS[mi]; return `trigger M=${[...m.trig][0]} · gra w cyklu T+${OFFSET} · K${K_LIMIT}`; },
    last: () => model.N - 1,
    codeRole: (mi, i) => { const mm = (model.rowModel[i + 1] || {})[MODELS[mi].name]; if (!mm) return null; return mm.prio === 'win' ? 'win' : mm.prio === 'trigger' ? 'trig' : 'step'; },
    cell: (mi, i) => {
      const er = i + 1, out = { det: [] };
      if (i >= model.N) return out;
      const r = model.rowRole[er] || { txt: 'SKIP', K: null, bk: 'SKIP' };
      out.stan = { t: r.txt, css: bs(r.bk), sub: r.K != null ? `M cyklu = ${r.K}` : (SUBR[r.bk] || '') };
      if (r.K != null) out.det.push(['M (długość cyklu)', r.K]);
      const mm = (model.rowModel[er] || {})[MODELS[mi].name];
      if (mm) {
        const seg = mm.text.split(' | ');
        out.gra = { t: mm.text, css: ms(mm.prio), full: seg.length > 1 ? seg : null };
        out.det.push(['Zdarzenie', EVN[mm.prio] || mm.prio]);
      }
      return out;
    },
    ev: (mi, i) => !!(model.rowModel[i + 1] || {})[MODELS[mi].name],
    tag: (mi, i) => {
      if (i >= model.N) return null;
      const mm = (model.rowModel[i + 1] || {})[MODELS[mi].name];
      if (mm) return { t: TAG[mm.prio] || '•', css: ms(mm.prio) };
      const r = model.rowRole[i + 1] || { bk: 'SKIP' };
      return { t: '·', css: bs(r.bk) };
    },
    rowInfo: i => { const r = model.rowRole[i + 1]; return r ? [['Rola bazy', r.txt + (r.K != null ? ` · M=${r.K}` : '')]] : []; },
    legend: () => `<b>GRA</b> (model): <span style="${ms('trigger')}">▶ TRIGGER</span><span style="${ms('krok')}">przygotowanie n/6</span><span style="${ms('start')}">★ START</span><span style="${ms('gra')}">krok gry</span><span style="${ms('win')}">✓ WIN</span><span style="${ms('loss')}">✗ LOSS</span>
      <br><b>Stan/Rola</b> (baza V1.3): ${Object.keys(BASE_FILL).map(k => `<span style="${bs(k)}">${{ para: 'para Kn', 'SPRAWDŹ': 'SPRAWDŹ Kn', WIN: '✓ WIN', miss: 'miss', SKIP: 'SKIP' }[k] || k}</span>`).join('')}
      <br>WSZ: T trigger · p przygotowanie · ★ START · k krok gry · W WIN · L LOSS · · bez zdarzenia (kolor = rola bazy). [T:n] = numer triggera.`,
    bottomH: () => F.nav.offsetHeight,
  };

  // ---- GRA (UG) ----
  function playLine(w) {
    const b = model.baseState, K = b.K;
    if (K > K_LIMIT) return { p: 5, txt: `trig#${w.tn} · GRA w bieżącym cyklu · K=${K} > ${K_LIMIT} → BUST przy zamknięciu`, sub: '', er: w.eventEr };
    const sub = {
      SEEK: `czeka na x1x (1. trafienie pary) · krok gry ${K}`,
      PENDING1: `następny wiersz: x1x = para → krok gry ${K}`,
      SPRAWDZ: `następny wiersz: x1x = ✓ WIN K=${K} · inny kod = miss → K${K + 1}`,
      IGNORE: 'po WIN — x1x ignorowane, cykl od następnego trafienia',
    }[b.state] || b.state;
    return { p: 2, txt: `trig#${w.tn} · GRA w bieżącym cyklu (T+${OFFSET}) · K=${K}`, sub, er: w.eventEr };
  }
  function cardList(goFn) {
    return MODELS.map(m => {
      const L = openWindows(m).map(w =>
        w.done >= START_STEP ? playLine(w)
          : w.done === START_STEP - 1 ? { p: 4, txt: `trig#${w.tn} · ★ START po następnym WIN-cyklu`, sub: `gra w cyklu T+${OFFSET}`, er: w.eventEr }
          : { p: 5, txt: `trig#${w.tn} · przygotowanie ${w.done}/${START_STEP}`, sub: `START za ${START_STEP - w.done} WIN-cykli`, er: w.eventEr });
      const M = [...m.trig][0];
      if (!L.length) L.push({ p: 6, txt: `brak otwartych okien · czeka na TRIGGER (WIN M=${M})`, sub: `off +${OFFSET} · K${K_LIMIT}` });
      L.sort((a, b) => a.p - b.p);
      const s = model.stats(m.name);
      return { id: m.name, rule: `trigger M=${M} · off +${OFFSET} · K${K_LIMIT}`, lines: L,
        meta: [`${s.games} gier · W ${s.wins} · L ${s.loss} · WR ${s.wr.toFixed(1)}%`, window.__t50zl(s.pnl)],
        go: er => goFn(m.name, er), stats: () => A.stats(MODELS.indexOf(m)) };
    });
  }
  function cards(goFn) { return [{ name: '', cards: cardList(goFn) }]; }
  function note() {
    const b = model.baseState;
    return `baza: ${NICE[b.state] || b.state} · K=${b.K} · WIN-cykli ${model.winCycles.length}`;
  }
  function lines() {
    const items = [].concat(...cardList(() => {}).map(c => c.lines.map(l => Object.assign({ id: c.id }, l))));
    const b = model.baseState;
    const ids = b.state === 'SPRAWDZ' ? MODELS.filter(m => m.trig.has(b.K)).map(m => m.name) : [];
    return { sections: [{ name: '', items }], trig: ids.length ? [['x1x', ids]] : [] };
  }
  function go(name, er) { UT.open(name, er ? er - 1 : null); F.show('tab'); }

  // ---- STATY ----
  function renderStat() {
    const b = model.baseState, row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
    window.T50Stat.render(F.main, {
      title: 'TRÓJKA V1.3', N: model.N, ST: ST3, odds: 3,
      note: `Cykl = okno po triggerze (gra w WIN-cyklu T+${OFFSET}). Zakłady na krokach 1…M cyklu: ${ST3.join(' · ')} zł, WIN = 3× stawka, K>${K_LIMIT} = BUST −2 040 zł.`,
      groups: [{ name: '', items: MODELS.map(m => {
        const s = model.stats(m.name), M = [...m.trig][0];
        return { id: m.name, sub: `trigger M=${M} · off +${OFFSET} · K${K_LIMIT}`, def: `TRIGGER = WIN-cykl M=${M} → przygotowanie ${START_STEP - 1} cykli → ★ START → gra x1x w cyklu T+${OFFSET}`,
          games: gamesOf(m), extra: [['Triggery · okna otwarte', `${s.trig} · ${s.open}`], ['Stan teraz', esc(cardList(() => {}).find(c => c.id === m.name).lines[0].txt)]] };
      }) }],
      tail: `<div class="card"><h2>Baza V1.3</h2><table class="stt"><tbody>${row('Kodów', model.N)}${row('WIN-cykli', model.winCycles.length)}${row('Stan bazy', `${NICE[b.state] || b.state} · K=${b.K}`)}${row('Wersja silnika', APP_VER)}</tbody></table></div>`,
    });
  }

  F.render = v => {
    if (v === 'gra') UG.render(F.main, { N: model.N, note: `<b>TRÓJKA</b> · ${note()}`, sections: cards((name, er) => go(name, er)), last: model.codes.slice(-8), idleSub: 'Żaden model nie gra na następnym wierszu.' });
    else if (v === 'tab') UT.render(F.main, A);
    else renderStat();
  };
  F.setN(`n=${model.N.toLocaleString('pl-PL')}`);
  F.show('gra');

  window.T50 = {
    count: () => codes.length, last: () => codes[codes.length - 1], seedN: SEED.length / 3,
    sync, add, undo: undo1, lines, cards, note, go, render: () => F.render(F.view),
    selfTest: () => {
      const m = new V13Model(SEED.match(/.{3}/g));
      const got = MODELS.map(x => { const s = m.stats(x.name); return `${x.name}: ${s.games} gier, ${s.wins} W, PnL ${s.pnl}`; }).join(' · ');
      return { ok: got === '__TROJKA_REF__', txt: `seed ${SEED.length / 3}: ${got}` };
    },
  };
})();
