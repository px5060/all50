// ===== T50 RAZEM — nakładka T50 1T / T50 200 (ten sam szablon apki: MODELS, results, fcs) =====
(function () {
  const esc = window.__t50esc;

  function sync() {
    added = [];
    const s = lsGet(LS_ADDED, '');
    if (/^(\d{3})*$/.test(s)) for (let i = 0; i < s.length; i += 3) added.push(s.substr(i, 3));
    recompute(); render();
  }
  function add(c) {
    const t = document.getElementById('toast'); t.innerHTML = '';
    addCode(c);
    return t.innerHTML;                      // „Nr N: <b>kod</b><br>…” — RAZEM odcina prefiks
  }
  function undo1() { window.__t50auto1(undo); }

  // karty GRA — linie 1:1 z forecastNext() tej apki (te same priorytety p1…p6)
  function cardList(goFn) {
    return MODELS.map((m, i) => {
      const r = results[i], f = fcs[i];
      const W = r.d.filter(x => x.wynik === 'WIN').length, B = r.d.filter(x => x.wynik === 'BUST').length;
      return {
        id: m.m, rule: `${m.id} · zakład +${m.offset}`,
        lines: f.map(x => ({ p: x.p, txt: x.tekst, sub: x.sub || '', stake: x.p === 1 ? x.stawka : 0 })),
        meta: [`${r.d.length} zakł. · WIN ${W} · BUST ${B}`, window.__t50zl(r.st.bilans)],
        go: er => goFn(m.m, er),
      };
    });
  }
  function cards(goFn) { return [{ name: '', cards: cardList(goFn) }]; }
  function lines() {
    const items = [].concat(...cardList(() => {}).map(c => c.lines.map(l => Object.assign({ id: c.id }, l))));
    const trig = ALL8.map(c => [c, fcs.map((f, i) => f.some(x => x.p === 3 && x.kody.includes(c)) ? MODELS[i].m : null).filter(Boolean)])
      .filter(x => x[1].length);
    return { sections: [{ name: '', items }], trig };
  }

  window.T50 = {
    count: () => codes.length, last: () => codes[codes.length - 1], seedN: SEED_N,
    sync, add, undo: undo1, lines, cards,
    go: id => goTable(id),
    render: () => render(),
    selfTest: () => {
      const errs = selfTest(seedArr.slice(0, TABLE.nCodesRef));
      return { ok: !errs.length, txt: errs.length ? errs.slice(0, 3).map(esc).join('; ') : `statystyki ${MODELS.length} modeli na ${TABLE.nCodesRef} kodach = arkusz STATYSTYKI` };
    },
  };
})();
