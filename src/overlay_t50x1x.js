// ===== T50 RAZEM — nakładka T50 x1x 2.0 (1T + 200 + 2T w jednej apce, silniki przełączane useEng) =====
// TABELA w układzie wspólnym UT (jak T60 RAZEM / TOP5), GRA w układzie UG (karty), API window.T50.
(function () {
  const esc = window.__t50esc;

  // zakładka RAZEM = jeden silnik: zostawiamy w KEYS tylko go i liczymy od nowa
  const ENGK = window.__T50_ENG;
  if (ENGK) {
    KEYS.splice(0, KEYS.length, ENGK);
    useEng(ENGK); recompute();
    document.querySelector('header h1').textContent = `T50 ${LBL[ENGK]} · ${OPIS[ENGK]}`;
  }

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

  // ---- stan FSM na KAŻDYM wierszu (także bez etykiety) — odtworzony z etykiet silnika ----
  // CZEKAM NA STEP (licznik n/x) → STEP otwarty → [T1 → czekam na T2] → TRIGGER/T2 → przed grą → WIN/LOSS/BUST
  const trigTxt = m => m.TRIGGER || m.TRIGGER1;
  const two = m => !!m.TRIGGER2;
  let PHr = null, PH = null;
  function phases(mi) {
    if (PHr !== results) { PHr = results; PH = []; }
    if (PH[mi]) return PH[mi];
    const r = results[mi], m = MODELS[mi], out = new Array(r.lab.length);
    let ph = 'step', cnt = 0, t1 = null;
    for (let i = 0; i < r.lab.length; i++) {
      const L = r.lab[i];
      if (!L) {
        if (ph === 'step') {
          out[i] = cnt > 0 && m.xSTEP > 1 ? { t: `licznik STEP ${cnt}/${m.xSTEP} → 0 (kod spoza STEP)`, k: 'RESET' }
                                          : { t: 'czekam na STEP', sub: `${m.STEP}${m.xSTEP > 1 ? ' ×' + m.xSTEP : ''}`, k: 'wait' };
          cnt = 0;
        } else if (ph === 'open') out[i] = two(m) ? { t: 'STEP otwarty · czekam na T1', sub: `T1 ${m.TRIGGER1}`, k: 'wait' }
                                                  : { t: 'STEP otwarty · czekam na TRIGGER', sub: `TRIGGER ${trigTxt(m)}`, k: 'wait' };
        else if (ph === 't1') out[i] = { t: `T1 był (Nr ${t1 + 1}) · czekam na T2`, sub: `T2 ${m.TRIGGER2}`, k: 'wait' };
        else out[i] = { t: '—', k: 'wait' };
        continue;
      }
      const k = L[0];
      if (k === 'STEP') { if (L[1] === 'STEP') ph = 'open'; else cnt = +L[1].split(' ')[1].split('/')[0]; }
      else if (k === 'T1') { ph = 't1'; t1 = i; }
      else if (k === 'GAP') ph = 'open';
      else if (k === 'TRIG' || k === 'WAIT') ph = 'bet';
      else if (k === 'WIN' || k === 'LOSS' || k === 'BUST') { ph = 'step'; cnt = 0; }
    }
    return (PH[mi] = out);
  }

  // ---- TABELA (UT) — etykiety 1:1 z lab / playPlan silnika ----
  const BY = new WeakMap();
  const betAt = (mi, i) => { const r = results[mi]; if (!BY.has(r)) BY.set(r, new Map(r.d.map(x => [x.w_ZAKLAD - 1, x]))); return BY.get(r).get(i); };
  const pending = r => r.st.faza === 'CZEKA NA MECZ ZAKŁADU';
  const A = {
    // łańcuch zakładu z rekordu silnika: STEP (w_STEP, seria/układ) · T1 (2T) · TRIGGER/T2 · czekanie · zakład
    chain: (mi, i) => {
      const r = results[mi], pe = getPlans()[mi].get(i); if (!pe) return null;
      const m = MODELS[mi], d = pe.pending ? r.st : r.d.find(x => x.w_ZAKLAD - 1 === pe.betI);
      const parts = p => p ? String(p).split(' → ').length : 1, back = (end, n) => Array.from({ length: n }, (_, q) => end - n + 1 + q);
      const tp = m.TRIGGER2 || m.TRIGGER || m.TRIGGER1, trig = back(pe.trigI, parts(tp));
      if (m.TRIGGER2 && d && d.w_T1) trig.unshift(...back(d.w_T1 - 1, parts(m.TRIGGER1)));
      const step = d && d.w_STEP ? back(d.w_STEP - 1, String(m.STEP).includes(' → ') ? parts(m.STEP) : (m.xSTEP || 1)) : [];
      return { step, trig, betI: pe.betI, k: pe.k, res: pe.pending ? null : pe.wyn === 'WIN' ? 'win' : pe.wyn === 'BUST' ? 'bust' : 'loss' };
    },
    stats: mi => {
      const r = results[mi], s = computeStats(r, codes.length), rr = rankingRow(r, codes), z = window.__t50zl;
      return [['Ocena (pkt z 9)', window.__ocena(computeStats(r, codes.length, { mc: true }).score)], ['Zakłady / cykle', `${s.zakl} / ${s.cykle}`], ['WIN / BUST', `${s.W} / ${s.B}`], ['Trafienie', `${s.hit.toFixed(1)} %`],
        ['Bilans', z(s.P)], ['Max seria przegranych', s.ml], ['Max wyłożone', `${s.maxwyl} zł`],
        ['WIN na krokach k1…k8', [1, 2, 3, 4, 5, 6, 7, 8].map(j => s['wk' + j]).join(' · ')], ['BUST przy K6 / K7', `${s.k6} / ${s.k7}`],
        ['Okresy na plus (z 5)', s.okresy], ['Stan teraz', `${r.st.faza} · K${r.st.krok} · ${r.st.stawka} zł`], ['Ostatni zakład', rr.ostatni]];
    },
    win: () => 'x1x',   // kod, który daje WIN zakładu
    N: () => codes.length, code: i => codes[i], isNew: i => i >= SEED_N,
    models: () => MODELS.map(m => ({ id: m.m })),
    desc: mi => { const m = MODELS[mi]; return esc(`${m.m} · ${m.id}: ${defin(m)} · K8`); },
    descTxt: mi => { const m = MODELS[mi]; return `${m.id}: ${defin(m)} · K8`; },
    last: mi => { const r = results[mi]; return pending(r) ? Math.max(codes.length - 1, r.st.w_ZAKLAD - 1) : codes.length - 1; },
    codeRole: (mi, i) => { const L = results[mi].lab[i]; if (!L) return null; return L[0] === 'WIN' ? 'win' : L[0] === 'TRIG' ? 'trig' : (L[0] === 'STEP' || L[0] === 'T1') ? 'step' : null; },
    cell: (mi, i) => {
      const r = results[mi], pe = getPlans()[mi].get(i), out = { det: [] };
      if (pe) {
        out.gra = { t: pe.t, css: sty(pe.st) };
        out.det.push(['Trigger', `Nr ${pe.trigI + 1} (+${r.m.offset})`], ['Zakład', `Nr ${pe.betI + 1} · K${pe.k} · ${pe.stake} zł`]);
      }
      if (i < codes.length) {
        const L = r.lab[i], x = betAt(mi, i);
        if (L) out.stan = { t: L[1], css: sty(L[0]), sub: x ? `krok ${x.krok} · ${x.stawka} zł${x.wynik_cyklu !== null ? ` · wynik ${x.wynik_cyklu}` : ''} · bilans ${x.bilans}` : '' };
        else { const p = phases(mi)[i]; out.stan = { t: p.t, css: sty(p.k), sub: p.sub || '' }; }
        if (x) out.det.push(['Krok / stawka', `K${x.krok} · ${x.stawka} zł`], ['Wynik', x.wynik], ['Bilans', `${x.bilans} zł`]);
      }
      return out;
    },
    ev: (mi, i) => !!getPlans()[mi].get(i) || !!(results[mi].lab[i]),
    tag: (mi, i) => {
      const pe = getPlans()[mi].get(i);
      if (i >= codes.length) return pe ? { t: pe.tag, css: sty(pe.st) } : null;
      const s = shortTag(results[mi].lab[i], pe); return { t: s.tag, css: sty(s.st) };
    },
    chip: (mi, i) => {
      const p = getPlans()[mi].get(i);
      if (!p || p.st === 'czek') return null;
      return { css: sty(p.st), t: p.st === 'TRIG_PEND' ? `▶ gra Nr ${p.betI + 1}` : p.st === 'NEXT_BET' ? (p.betI === i ? `GRA K${p.k} ${p.stake} zł` : `▼ nast. GRA K${p.k}`) : `${p.wyn === 'WIN' ? 'WIN' : p.wyn === 'BUST' ? 'BUST' : 'LOSS'} K${p.k}` };
    },
    rowInfo: i => [['Kod', codes[i] == null ? '—' : `${codes[i]}${isX1x(codes[i]) ? ' (x1x)' : ''}`]],
    legend: () => `Kolumna <b>GRA</b>: <span style="${sty('TRIG_PEND')}">▶ TRIGGER → start gry</span><span style="${sty('czek')}">start gry za n</span><span style="${sty('NEXT_BET')}">▼ następny wiersz = GRA</span><span style="${sty('BET_WIN')}">WIN</span><span style="${sty('BET_LOSS')}">LOSS / BUST</span>
      <br><b>Stan/Rola</b>: <span style="${sty('STEP')}">step n/x · STEP</span>${STYLES.T1 ? `<span style="${sty('T1')}">T1</span><span style="${sty('GAP')}">przerwa minęła</span>` : ''}<span style="${sty('TRIG')}">TRIGGER → zakład</span><span style="${sty('WAIT')}">przed grą</span><span style="${sty('WIN')}">WIN</span><span style="${sty('LOSS')}">przegrana</span><span style="${sty('BUST')}">BUST</span><span style="${sty('RESET')}">licznik → 0</span><span style="${sty('wait')}">czekam na STEP / TRIGGER</span>
      <br>WSZ: T trigger · liczba = za ile wierszy · ▼ następny = gra · W/L/B wynik · H1 step 1/x · OP STEP · T1 · P przerwa · · czekanie. Wiersze przerywane = przyszłe kody gry w toku.`,
    bottomH: () => document.querySelector('nav').offsetHeight,
  };
  UT.A = A;
  renderTab = function () { UT.render($main, A); };
  // STATY: na dole podsumowanie MOJE ZAKŁADY tej tabeli
  const renderStat0 = renderStat;
  renderStat = function () { renderStat0.apply(this, arguments); if (window.__MJ && __MJ.mount) __MJ.mount($main); };

  // tapnięcie w GRA → TABELA modelu; gra w toku → wiersz TRIGGERA, inaczej koniec tabeli
  goTable = function (sel) {
    const [k, id] = String(sel).includes('|') ? String(sel).split('|') : [curK, sel];
    useEng(k);
    const mi = MODELS.findIndex(m => m.m === id), r = results[mi];
    UT.open(mi < 0 ? 'ALL' : id, r && pending(r) ? (r.st.w_TRIGGER || r.st.w_T2) - 1 : null);
    view = 'tab';
    if (document.activeElement) document.activeElement.blur();
    render();
  };

  // ---- GRA (UG) — linie 1:1 z forecastNext() (priorytety p1…p6) ----
  function cardList(k, goFn) {
    return MODELS.map((m, i) => {
      const r = results[i], f = fcs[i];
      const W = r.d.filter(x => x.wynik === 'WIN').length, B = r.d.filter(x => x.wynik === 'BUST').length;
      return {
        id: `${LBL[k]}·${m.m}`, mid: m.m, rule: `${m.id} · zakład +${m.offset}`,
        lines: f.map(x => ({ p: x.p, txt: x.tekst, sub: x.sub || '', stake: x.p === 1 ? x.stawka : 0 })),
        meta: [`${r.d.length} zakł. · WIN ${W} · BUST ${B}`, window.__t50zl(r.st.bilans)],
        go: er => goFn(`${k}|${m.m}`, er), stats: () => A.stats(i),
      };
    });
  }
  function cards(goFn) {
    return eachEng(k => ({ name: `T50 ${LBL[k]} · ${OPIS[k]}`, full: true, cards: cardList(k, goFn) }));
  }
  const _rg = renderGra;
  renderGra = function () {
    _rg();                                   // podpowiedź „TRIGGER da” pod polem kodu (apka samodzielna)
    UG.render($main, { N: codes.length, sections: cards(sel => goTable(sel)), last: codes.slice(-8),
      idleSub: 'Żaden model nie gra na następnym wierszu.' });
  };

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
    go: sel => goTable(sel),
    render: () => render(),
    selfTest: () => {
      const errs = [].concat(...eachEng(k => selfTest(seedArr.slice(0, TABLE.nCodesRef)).map(e => `${LBL[k]}: ${e}`)));
      const n = eachEng(k => `${LBL[k]}: ${MODELS.length}`);
      return { ok: !errs.length, txt: errs.length ? errs.slice(0, 3).map(esc).join('; ')
        : `statystyki modeli (${n.join(', ')}) na ${TABLE.nCodesRef} kodach = arkusz STATYSTYKI` };
    },
  };
  render();
})();
