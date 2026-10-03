// ===== T50 RAZEM — nakładka T50 x1x 2.0 (1T + 200 + 2T w jednej apce, silniki przełączane useEng) =====
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

  // karty GRA aktywnego silnika — linie 1:1 z forecastNext() (te same priorytety p1…p6)
  function cardList(k, goFn) {
    return MODELS.map((m, i) => {
      const r = results[i], f = fcs[i];
      const W = r.d.filter(x => x.wynik === 'WIN').length, B = r.d.filter(x => x.wynik === 'BUST').length;
      return {
        id: `${LBL[k]}·${m.m}`, rule: `${m.id} · zakład +${m.offset}`,
        lines: f.map(x => ({ p: x.p, txt: x.tekst, sub: x.sub || '', stake: x.p === 1 ? x.stawka : 0 })),
        meta: [`${r.d.length} zakł. · WIN ${W} · BUST ${B}`, window.__t50zl(r.st.bilans)],
        go: er => goFn(`${k}|${m.m}`, er),
      };
    });
  }
  function cards(goFn) {
    return eachEng(k => ({ name: `T50 ${LBL[k]} · ${OPIS[k]}`, full: true, cards: cardList(k, goFn) }));
  }
  function lines() {
    const items = [], hint = {};
    eachEng(k => {
      cardList(k, () => {}).forEach(c => c.lines.forEach(l => items.push(Object.assign({ id: c.id }, l))));
      fcs.forEach((f, i) => f.forEach(x => { if (x.p === 3) x.kody.forEach(c => (hint[c] = hint[c] || []).push(`${LBL[k]}·${MODELS[i].m}`)); }));
    });
    return { sections: [{ name: '', items }], trig: ALL8.filter(c => hint[c]).map(c => [c, hint[c]]) };
  }

  window.T50 = {
    count: () => codes.length, last: () => codes[codes.length - 1], seedN: SEED_N,
    sync, add, undo: undo1, lines, cards,
    go: sel => goTable(String(sel).includes('|') ? sel : `${curK}|${sel}`),
    render: () => render(),
    selfTest: () => {
      const errs = [].concat(...eachEng(k => selfTest(seedArr.slice(0, TABLE.nCodesRef)).map(e => `${LBL[k]}: ${e}`)));
      const n = eachEng(() => MODELS.length);
      return { ok: !errs.length, txt: errs.length ? errs.slice(0, 3).map(esc).join('; ')
        : `statystyki ${n.reduce((a, b) => a + b, 0)} modeli (1T: ${n[0]}, 200: ${n[1]}, 2T: ${n[2]}) = arkusze STATYSTYKI` };
    },
  };
})();
