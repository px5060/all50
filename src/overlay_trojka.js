// ===== T50 RAZEM — nakładka TRÓJKA V1.3 (Test50 x1x, T1/T2, off +7, K8) =====
// Okna liczone tak samo jak etykiety w _models(): TRIGGER → przygotowanie 1–5/6 → ★ START (6) → gra w cyklu T+7.
(function () {
  const esc = window.__t50esc;
  const NICE = { SEEK: 'szukam pary', PENDING1: '1. trafienie', SPRAWDZ: 'SPRAWDŹ — 3-cie decyduje', IGNORE: 'po WIN — ignoruję' };

  function sync() { codes = load().map(toCode).filter(Boolean); recompute(); renderAll(false); }
  function add(c) {
    addCode(c);
    const ev = MODELS.map(m => { const mm = (model.rowModel[model.N] || {})[m.name]; return mm ? `<b>${m.name}</b> ${esc(mm.text)}` : ''; }).filter(Boolean);
    return ev.join('<br>');
  }
  function undo1() { window.__t50auto1(undo); }

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
  // pulpit apki czyta model.openWindows, którego silnik nie wypełnia — wypełniamy po każdym przeliczeniu
  const _recompute = recompute;
  recompute = function () {
    _recompute();
    MODELS.forEach(m => { model.openWindows[m.name] = openWindows(m); });
  };
  MODELS.forEach(m => { model.openWindows[m.name] = openWindows(m); });
  renderPulpit();

  function playLine(w) {
    const bs = model.baseState, K = bs.K;
    if (K > K_LIMIT) return { p: 5, txt: `trig#${w.tn} · GRA w bieżącym cyklu · K=${K} > ${K_LIMIT} → BUST przy zamknięciu`, sub: '', er: w.eventEr };
    const sub = {
      SEEK: `czeka na x1x (1. trafienie pary) · krok gry ${K}`,
      PENDING1: `następny wiersz: x1x = para → krok gry ${K}`,
      SPRAWDZ: `następny wiersz: x1x = ✓ WIN K=${K} · inny kod = miss → K${K + 1}`,
      IGNORE: 'po WIN — x1x ignorowane, cykl od następnego trafienia',
    }[bs.state] || bs.state;
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
        go: er => goFn(m.name, er) };
    });
  }
  function cards(goFn) { return [{ name: '', cards: cardList(goFn) }]; }
  function lines() {
    const items = [].concat(...cardList(() => {}).map(c => c.lines.map(l => Object.assign({ id: c.id }, l))));
    const bs = model.baseState;
    const ids = bs.state === 'SPRAWDZ' ? MODELS.filter(m => m.trig.has(bs.K)).map(m => m.name) : [];
    return { sections: [{ name: '', items }], trig: ids.length ? [['x1x', ids]] : [] };
  }
  function note() {
    const bs = model.baseState;
    return `baza: ${NICE[bs.state] || bs.state} · K=${bs.K} · WIN-cykli ${model.winCycles.length}`;
  }
  function go(name, er) {
    const t = document.querySelector(`.tab[data-m="${name}"]`);
    if (t && cur !== name) t.click();
    if (er) jumpTo(er);
  }

  window.T50 = {
    count: () => codes.length, last: () => codes[codes.length - 1], seedN: SEED.length / 3,
    sync, add, undo: undo1, lines, cards, note, go, render: () => renderAll(false),
    selfTest: () => {
      const m = new V13Model(SEED.match(/.{3}/g));
      const got = MODELS.map(x => { const s = m.stats(x.name); return `${x.name}: ${s.games} gier, ${s.wins} W, PnL ${s.pnl}`; }).join(' · ');
      return { ok: got === '__TROJKA_REF__', txt: `seed ${SEED.length / 3}: ${got}` };
    },
  };
})();
