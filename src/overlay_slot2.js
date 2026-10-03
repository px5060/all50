// ===== T50 RAZEM — nakładka x1x 2-slot (Test50, strategie C i A, K8) =====
// Wygląd jak T50 1T/200/2T: GRA (karty UG) · TABELA (UT: Nr · Kod · GRA · Stan/Rola) · STATY.
// Oba silniki (runEngineC / runEngineA) liczone na tym samym ciągu.
// Krok gry w oknie po START = K bazy 2-slot + pozycja slotu (SLOT1 → +1, SLOT2 → +2), jak w Pikoff 2-slot.
(function () {
  const esc = window.__t50esc;
  const STAWKI = { 1: 8, 2: 8, 3: 16, 4: 32, 5: 64, 6: 128, 7: 256, 8: 512 };   // progresja K8 jak w Pikoff 2-slot
  const NAME = { C: 'C · Wszystkie', A: 'A · Ignoruj' };
  let cache = null;
  function both() {
    const key = codes.length + ':' + codes[codes.length - 1];
    if (!cache || cache.key !== key) cache = { key, C: runEngineC(codes), A: runEngineA(codes), play: {} };
    return cache;
  }
  // lista modeli tabeli: C·M5O3 … A·M10O11
  const ML = () => ['C', 'A'].flatMap(s => MODELS[s].map(m => ({ s, m, id: `${s}·${m.name}` })));

  const F = window.T50Frame('x1x 2-SLOT · Test50 · strategie C / A · K8', [['gra', 'GRA'], ['tab', 'TABELA'], ['stat', 'STATY']]);
  const _renderAll = renderAll;
  renderAll = function (keep) { _renderAll(keep); F.setN(`n=${codes.length.toLocaleString('pl-PL')}`); if (F.render) F.render(F.view); };

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

  // ---- zakłady w oknie po START, wiersz po wierszu (do kolumny GRA) ----
  function play(s, name) {
    const C = both();
    const key = s + name;
    if (C.play[key]) return C.play[key];
    const E = C[s], out = new Array(E.rows.length);
    let started = [], kAcc = 0;
    E.rows.forEach((row, i) => {
      const evs = (row.cells[name] || {}).events || [];
      if (row.role === 'WIN') {
        if (started.length && row.K <= MAX_KROKI) out[i] = { k: row.K, res: 'win', tn: started };
        started = evs.filter(e => e[0] === 'start').map(e => (e[1].match(/T:(\d+)/) || [])[1]);
        kAcc = 0; return;
      }
      if (!started.length) return;
      if (row.role === 'krok1 miss') { const n = kAcc + 1; out[i] = n <= MAX_KROKI ? { k: n, res: 'miss', tn: started } : { over: true, tn: started }; }
      else if (row.role === 'krok2 miss') { const n = kAcc + 2; out[i] = n <= MAX_KROKI ? { k: n, res: 'miss', tn: started } : { over: true, tn: started }; kAcc += 2; }
      else out[i] = { wait: true, k: kAcc + 1, tn: started };
    });
    return (C.play[key] = out);
  }

  // ---- TABELA (UT) — etykiety 1:1 z silnika (rola bazy + zdarzenia modelu) ----
  const es = p => { const a = EV_STYLE[p] || ['#FFFFFF', '#000000']; return `background:${a[0]};color:${a[1]}`; };
  const bsty = r => `background:${BASE_FILL[r] || '#F2F2F2'};color:#000`;
  const MISS = 'background:#FCE4E4;color:#9C0006', WAITP = 'background:#DEEBF7;color:#2E75B6';
  const SUBR = { SKIP: 'czekam na x1x (BUILDUP)', BUILDUP: 'x1x — następne 2 wiersze to sloty', 'krok1 miss': 'slot 1 pudło → slot 2', 'krok2 miss': 'slot 2 pudło → K+2, czekam na x1x', WIN: 'trafienie w slocie — koniec cyklu' };
  const TAG = { trigger: 'T', start: '★', win: 'W', loss: 'L', ignored: '⊘' };
  const pm = mi => ML()[mi];
  const A = {
    win: () => 'x1x',   // kod, który daje WIN zakładu
    N: () => codes.length, code: i => codes[i], isNew: i => i >= SEED_STR.length / 3,
    models: () => ML().map(x => ({ id: x.id })),
    defSel: () => 'C·' + MODELS.C[0].name,
    desc: mi => { const { s, m } = pm(mi); return `${s}·${m.name}: trigger = WIN bazy z K=${m.K} · START po ${m.offset} WIN · gra x1x w slotach, K8 · strategia ${NAME[s]}`; },
    descTxt: mi => { const { s, m } = pm(mi); return `trigger K=${m.K} · START po ${m.offset} WIN · ${NAME[s]}`; },
    last: () => codes.length - 1,
    codeRole: (mi, i) => {
      const { s, m } = pm(mi), c = both()[s].rows[i].cells[m.name] || {};
      if (c.prio === 'win') return 'win'; if (c.prio === 'trigger') return 'trig';
      return c.prio || play(s, m.name)[i] ? 'step' : null;
    },
    cell: (mi, i) => {
      const out = { det: [] };
      if (i >= codes.length) return out;
      const { s, m } = pm(mi), row = both()[s].rows[i], c = row.cells[m.name] || {}, p = play(s, m.name)[i];
      out.stan = { t: row.role === 'WIN' ? `✓ WIN K=${row.K}` : (BASE_TXT[row.role] || row.role), css: bsty(row.role), sub: SUBR[row.role] || '' };
      if (row.K != null) out.det.push(['K bazy (WIN)', row.K]);
      const evs = c.events || [];
      const pl = p && p.k && !p.wait ? `GRA x1x · krok ${p.k}/${MAX_KROKI} · ${STAWKI[p.k]} zł ${p.res === 'win' ? '✓' : '✗ pudło'}` : null;
      if (evs.length) out.gra = { t: evs.map(e => e[1]).join(' | '), css: es(c.prio), full: evs.length > 1 ? evs.map(e => e[1]) : null, sub: pl || '' };
      else if (pl) out.gra = { t: pl, css: MISS, sub: `okno T:${p.tn.join(',')}` };
      else if (p && p.over) out.gra = { t: `K>${MAX_KROKI} — bez zakładu, LOSS przy WIN bazy`, css: es('loss'), sub: `okno T:${p.tn.join(',')}` };
      else if (p && p.wait) out.gra = { t: `w grze · po x1x krok ${p.k}/${MAX_KROKI}`, css: WAITP, sub: `okno T:${p.tn.join(',')}` };
      if (p && p.k && !p.wait) out.det.push(['Zakład', `krok ${p.k} · ${STAWKI[p.k]} zł · ${p.res === 'win' ? 'WIN' : 'pudło'}`]);
      return out;
    },
    ev: (mi, i) => { const { s, m } = pm(mi); return !!((both()[s].rows[i].cells[m.name] || {}).events || []).length || !!play(s, m.name)[i]; },
    tag: (mi, i) => {
      if (i >= codes.length) return null;
      const { s, m } = pm(mi), row = both()[s].rows[i], c = row.cells[m.name] || {}, p = play(s, m.name)[i];
      if (c.prio) return { t: c.prio === 'krok' ? ((c.events.find(e => e[0] === 'krok') || [, ''])[1].match(/krok (\d+)/) || [, 'k'])[1] : (TAG[c.prio] || '•'), css: es(c.prio) };
      if (p && p.k && !p.wait) return { t: 'x', css: MISS };
      if (p) return { t: 'g', css: WAITP };
      return { t: '·', css: bsty(row.role) };
    },
    rowInfo: i => { const r = both().C.rows[i]; return r ? [['Rola bazy 2-slot', (BASE_TXT[r.role] || r.role) + (r.K != null ? ` · K=${r.K}` : '')]] : []; },
    legend: () => `<b>GRA</b> (model): <span style="${es('trigger')}">▶ TRIGGER</span><span style="${es('krok')}">krok n (do START)</span><span style="${es('start')}">★ START</span><span style="${WAITP}">w grze · czeka na x1x</span><span style="${MISS}">krok gry ✗ pudło</span><span style="${es('win')}">✓ WIN</span><span style="${es('loss')}">✗ LOSS</span><span style="${es('ignored')}">⊘ IGNORED (A)</span>
      <br><b>Stan/Rola</b> (baza 2-slot): ${Object.keys(BASE_FILL).map(k => `<span style="${bsty(k)}">${BASE_TXT[k] || k}</span>`).join('')}
      <br>WSZ: T trigger · liczba = krok do START · ★ START · g w grze · x pudło · W WIN · L LOSS · ⊘ ignorowany · · bez zdarzenia (kolor = rola bazy). Stawki K8: 8, 8, 16, 32, 64, 128, 256, 512 zł.`,
    bottomH: () => F.nav.offsetHeight,
  };

  // ---- GRA (UG) ----
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
    UT.open(nm ? `${s}·${nm}` : String(key), er ? er - 1 : null);
    F.show('tab');
  }

  // ---- STATY ----
  function renderStat() {
    const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
    let h = '';
    ['C', 'A'].forEach(s => {
      const E = both()[s];
      h += `<div class="card"><h2>Strategia ${NAME[s]}</h2><table class="stt"><tbody>`;
      E.M.forEach(m => {
        const st = statsFor(E, m.name);
        h += row(`<b style="color:#e8ebf2">${m.name}</b> · K${m.K} · off +${m.offset}`, `${st.trig} trig · ${st.games} gier · W ${st.win} · L ${st.loss}${s === 'A' ? ` · IGN ${st.ign}` : ''} · okna ${st.open} · WR ${st.wr.toFixed(1)}%`);
      });
      h += `</tbody></table></div>`;
    });
    const two = both().C.two;
    h += `<div class="card"><h2>Baza 2-slot</h2><table class="stt"><tbody>${row('Kodów', codes.length)}${row('Faza bazy', `${two.phase} · K=${two.K}`)}${row('Stawki K8', '8 · 8 · 16 · 32 · 64 · 128 · 256 · 512 zł')}${row('Wersja silnika', APP_VER)}</tbody></table></div>`;
    F.main.innerHTML = h;
  }

  F.render = v => {
    if (v === 'gra') UG.render(F.main, { N: codes.length, sections: cards((k, er) => go(k, er)), last: codes.slice(-8), idleSub: `Faza bazy: ${both().C.two.phase}, K=${both().C.two.K}` });
    else if (v === 'tab') UT.render(F.main, A);
    else renderStat();
  };
  function start() { F.setN(`n=${codes.length.toLocaleString('pl-PL')}`); F.show('gra'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.T50 = {
    count: () => codes.length, last: () => codes[codes.length - 1], seedN: SEED_STR.length / 3,
    sync, add, undo: undo1, lines, cards, go, render: () => F.render(F.view),
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
