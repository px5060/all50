// ===== T50 RAZEM — nakładka x1x 2-slot (Test50, strategie C i A, K8) =====
// Karty GRA liczone z obu silników (runEngineC / runEngineA) na tym samym ciągu.
// Krok gry w oknie po START = K bazy 2-slot + pozycja slotu (SLOT1 → +1, SLOT2 → +2), jak w Pikoff 2-slot.
(function () {
  const esc = window.__t50esc;
  const STAWKI = { 1: 8, 2: 8, 3: 16, 4: 32, 5: 64, 6: 128, 7: 256, 8: 512 };   // progresja K8 jak w Pikoff 2-slot
  const NAME = { C: 'C · Wszystkie', A: 'A · Ignoruj' };
  let cache = null;
  function both() {
    const key = codes.length + ':' + codes[codes.length - 1];
    if (!cache || cache.key !== key) cache = { key, C: runEngineC(codes), A: runEngineA(codes) };
    return cache;
  }

  function sync() { cache = null; const s = load(); codes = s && s.length ? s : SEED_CODES(); recompute(); renderAll(false); }
  function add(c) {
    addCode(c);
    const E = both(), i = codes.length - 1, out = [];
    ['C', 'A'].forEach(s => E[s].M.forEach(m => {
      const ev = (E[s].rows[i].cells[m.name] || {}).events || [];
      if (ev.length) out.push(`<b>${s}·${m.name}</b> ${esc(ev.map(e => e[1]).join(' | '))}`);
    }));
    return out.join('<br>');
  }
  function undo1() { window.__t50auto1(undo); }

  const nextKrok = two => two.K + (two.phase === 'SLOT2' ? 2 : 1);
  function trigNext(E, s, m) {                     // czy x1x na następnym wierszu da trigger temu modelowi
    const two = E.two;
    if (two.phase === 'WAITING' || nextKrok(two) !== m.K) return false;
    if (s === 'C') return true;
    return !E.M.filter(x => x.K === m.K).some(x => E.models[x.name].windows.some(w => !w.started));   // A: okno w toku → IGNORED
  }
  function cardList(goFn, s) {
    const E = both()[s], two = E.two;
    return E.M.map(m => {
      const ws = E.models[m.name].windows, L = [];
      ws.filter(w => w.started).forEach(w => {
        const n = nextKrok(two);
        if (n > MAX_KROKI) L.push({ p: 5, txt: `trig#${w.tn} · K>${MAX_KROKI} → LOSS przy najbliższym WIN bazy`, sub: '', er: w.eventEr });
        else if (two.phase !== 'WAITING') L.push({ p: 1, txt: `▼ GRA x1x · krok ${n}/${MAX_KROKI} · ${STAWKI[n]} zł`, sub: `trig#${w.tn} · baza ${two.phase}`, stake: STAWKI[n], er: w.eventEr });
        else L.push({ p: 4, txt: `trig#${w.tn} · w grze · po x1x (BUILDUP) krok ${n}/${MAX_KROKI} · ${STAWKI[n]} zł`, sub: 'baza WAITING', er: w.eventEr });
      });
      ws.filter(w => !w.started).forEach(w => L.push(w.krok === m.offset - 1
        ? { p: 4, txt: `trig#${w.tn} · ★ START przy następnym WIN`, sub: `off +${m.offset}`, er: w.eventEr }
        : { p: 5, txt: `trig#${w.tn} · krok ${w.krok}/${m.offset} · START za ${m.offset - w.krok} WIN`, sub: '', er: w.eventEr }));
      if (trigNext(E, s, m)) L.push({ p: 3, txt: `trigger jeśli wpadnie x1x (WIN K=${m.K})`, sub: `start po ${m.offset} WIN-ach` });
      if (!L.length) L.push({ p: 6, txt: `brak · trigger przy WIN K=${m.K}`, sub: `off +${m.offset} · baza ${two.phase}, K=${two.K}` });
      L.sort((a, b) => a.p - b.p);
      const st = statsFor(E, m.name);
      return { id: m.name, rule: `${s} · K${m.K} · off +${m.offset}`, lines: L,
        meta: [`${st.trig} trig · ${st.games} gier · W ${st.win} · L ${st.loss}${s === 'A' ? ` · IGN ${st.ign}` : ''}`, `WR ${st.wr.toFixed(1)}%`],
        go: er => goFn(`${s}:${m.name}`, er) };
    });
  }
  function cards(goFn) { return ['C', 'A'].map(s => ({ name: NAME[s], cards: cardList(goFn, s) })); }
  function lines() {
    const items = [], ids = [];
    ['C', 'A'].forEach(s => {
      cardList(() => {}, s).forEach(c => c.lines.forEach(l => items.push(Object.assign({ id: `${s}·${c.id}` }, l))));
      const E = both()[s]; E.M.forEach(m => { if (trigNext(E, s, m)) ids.push(`${s}·${m.name}`); });
    });
    return { sections: [{ name: '', items }], trig: ids.length ? [['x1x', ids]] : [] };
  }
  function go(key, er) {
    const [s, nm] = String(key).split(':');
    if (s && nm) {
      if (strat !== s) switchStrat(s);
      cur = nm; buildMtabs(); renderAll(false);
    }
    if (er) jumpTo(er);
  }

  window.T50 = {
    count: () => codes.length, last: () => codes[codes.length - 1], seedN: SEED_STR.length / 3,
    sync, add, undo: undo1, lines, cards, go, render: () => renderAll(false),
    selfTest: () => {
      const seed = SEED_CODES();
      const got = ['C', 'A'].map(s => {
        const E = s === 'C' ? runEngineC(seed) : runEngineA(seed);
        let w = 0, l = 0; E.M.forEach(m => { const st = statsFor(E, m.name); w += st.win; l += st.loss; });
        return `${s}: ${w} W / ${l} L`;
      }).join(' · ');
      return { ok: got === '__SLOT2_REF__', txt: `seed ${seed.length}: ${got}` };
    },
  };
})();
