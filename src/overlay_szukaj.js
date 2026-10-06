// ===== RAZEM — tabela SZUKAJ: modele przeniesione z appek SZUKAJ / SZUKAJ+ (STEP ×x → [STEP2] → TRIGGER ×n → zakład +off, K8) =====
// Silnik = FSM 1:1 z SZUKAJ+ (sim / labels z workera); zwykły SZUKAJ to ten sam model z TRIGGER ×1 i bez STEP2.
// Lista modeli: klucz <app>razem_v1_szk (wspólna domena) — dopisują ją SZUKAJ / SZUKAJ+ (przycisk w oknie statystyk modelu)
// albo zakładka MODELE tutaj (z MOJE GRY appek SZUKAJ / SZUKAJ+).
(function () {
  const C = window.__SZK, esc = window.__t50esc, zl = window.__t50zl;
  const ST = [8, 8, 16, 32, 64, 128, 256, 512], CUM = [8, 16, 32, 64, 128, 256, 512, 1024];
  const AL = C.alph, TPOS = { x1x: 1, xx1: 2, '1xx': 0 };
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const fmt = v => Number(v).toLocaleString('pl-PL');

  // ---- kody: wspólny ciąg z powłoki RAZEM ----
  let codes = [], X = new Int8Array(0), N = 0;
  function readCodes() { try { return window.parent.__allCodes(); } catch (e) { return []; } }
  const masterN = () => { try { return window.parent[C.masterVar] || 0; } catch (e) { return 0; } };

  // ---- silnik (1:1 z SZUKAJ+) ----
  const m1 = (p, c) => p.split('∪').some(q => q.length === 3 && [...q].every((x, i) => x === 'x' || x === c[i]));
  const _tc = new Map();
  function tab(pred) {
    let v = _tc.get(pred); if (v) return v;
    const parts = pred.split(' → '), t = new Uint8Array(3 * AL.length);
    parts.forEach((p, j) => AL.forEach((c, k) => { t[j * AL.length + k] = m1(p, c) ? 1 : 0; }));
    v = { t, L: parts.length }; _tc.set(pred, v); return v;
  }
  function hit(P, i) {
    if (i < P.L - 1) return false;
    const A = AL.length;
    for (let j = 0; j < P.L; j++) if (!P.t[j * A + X[i - P.L + 1 + j]]) return false;
    return true;
  }
  function sim(md) {
    const m = md.m, Y = md.Y, S = tab(m[1]), T = tab(m[3]), x = m[2], off = m[4], tn = m[5] || 1, S2 = m[6] ? tab(m[6]) : null;
    let st = 0, cnt = 0, tc = 0, bs = 0, i = 0, pnl = 0, nb = 0, nw = 0, nbu = 0, srow = -1, wz = -1, ph = 0, le = -1, lt = 0, lk = 0;
    while (i < N) {
      if (st === 0) {
        if (hit(S, i)) { cnt++; if (cnt >= x) { st = S2 ? 1 : 2; srow = i; } } else cnt = 0;
        i++;
      } else if (st === 1) { if (hit(S2, i)) st = 2; i++; }
      else if (hit(T, i)) {
        tc++; if (tc < tn) { i++; continue; }
        const bp = i + off;
        if (bp >= N) { ph = 2; wz = bp; break; }
        const w = Y[X[bp]] === 1;
        nb++;
        if (w) { pnl += ST[bs] * 3 - CUM[bs]; nw++; le = bp; lt = 1; lk = bs + 1; bs = 0; }
        else if (bs === 7) { pnl -= CUM[7]; nbu++; le = bp; lt = 2; lk = 8; bs = 0; }
        else bs++;
        st = 0; cnt = 0; tc = 0; i = bp + 1;
      } else i++;
    }
    if (ph === 0 && st >= 1) ph = 1;
    return { nb, nw, nbu, pnl, bs, ph, srow, wz, cnt, st, tc, le, lt, lk };
  }
  // K: 0 czekam na STEP · 1 czekam na TRIGGER (A = ile już było) · 2 step n/x · 3 STEP · 4 TRIGGER → zakład (A = krok, B = wiersz zakładu)
  //    5 przed grą · 6 WIN (B = zysk) · 7 przegrana · 8 BUST · 9 licznik → 0 · 10 STEP2 · 11 czekam na STEP2 · 12 TRIGGER n/tn
  function labels(md) {
    const m = md.m, Y = md.Y, S = tab(m[1]), T = tab(m[3]), x = m[2], off = m[4], tn = m[5] || 1, S2 = m[6] ? tab(m[6]) : null;
    const K = new Int8Array(N), A = new Int16Array(N), B = new Int32Array(N);
    let st = 0, cnt = 0, tc = 0, bs = 0, i = 0;
    while (i < N) {
      if (st === 0) {
        if (hit(S, i)) { cnt++; if (cnt >= x) { st = S2 ? 1 : 2; K[i] = 3; } else { K[i] = 2; } A[i] = cnt; }
        else { K[i] = cnt > 0 ? 9 : 0; cnt = 0; }
        i++;
      } else if (st === 1) { if (hit(S2, i)) { st = 2; K[i] = 10; } else K[i] = 11; i++; }
      else if (hit(T, i)) {
        tc++;
        if (tc < tn) { K[i] = 12; A[i] = tc; i++; continue; }
        const bp = i + off;
        K[i] = 4; A[i] = bs + 1; B[i] = bp;
        for (let j = i + 1; j < Math.min(bp, N); j++) { K[j] = 5; A[j] = bs + 1; B[j] = bp; }
        if (bp >= N) break;
        const w = Y[X[bp]] === 1;
        A[bp] = bs + 1;
        if (w) { K[bp] = 6; B[bp] = ST[bs] * 3 - CUM[bs]; bs = 0; }
        else if (bs === 7) { K[bp] = 8; B[bp] = -CUM[7]; bs = 0; }
        else { K[bp] = 7; bs++; }
        st = 0; cnt = 0; tc = 0; i = bp + 1;
      } else { K[i] = 1; A[i] = tc; i++; }
    }
    return { K, A, B };
  }
  // gry do STATY (T50Stat): od pierwszego zakładu na kroku 1 do WIN (K = krok) albo BUST (K = 9)
  function games(md) {
    const { K, A } = R(md).lb, out = []; let t0 = null;
    for (let i = 0; i < N; i++) {
      if (K[i] === 4 && A[i] === 1) t0 = i;
      else if (K[i] === 6) { out.push({ trigEr: t0, er: i, K: A[i] }); t0 = null; }
      else if (K[i] === 8) { out.push({ trigEr: t0, er: i, K: 9 }); t0 = null; }
    }
    return out;
  }

  // ---- lista modeli ----
  const norm = (m, plus) => [m[0], m[1], +m[2] || 1, m[3], +m[4] || 1, plus ? (+m[5] || 1) : 1, plus ? (m[6] || '') : ''];
  const spec = (m, tgt) => norm(m, true).join('|') + '|' + tgt;
  function getList() {
    try { const v = JSON.parse(lsGet(C.key, '[]')); return Array.isArray(v) ? v.filter(e => e && Array.isArray(e.m) && C.targets.includes(e.tgt)) : []; } catch (e) { return []; }
  }
  function setList(a) { lsSet(C.key, JSON.stringify(a)); }
  let L = [], CA = {};
  function rebuild() {
    codes = readCodes(); N = codes.length; X = Int8Array.from(codes.map(c => AL.indexOf(c)));
    const seen = new Set();
    L = getList().filter(e => { const s = spec(e.m, e.tgt); if (seen.has(s)) return false; seen.add(s); return true; })
      .map(e => ({ e, id: e.id, m: norm(e.m, true), tgt: e.tgt, Y: AL.map(c => c[TPOS[e.tgt]] === '1' ? 1 : 0) }));
    CA = {};
  }
  const R = md => CA[md.id] || (CA[md.id] = { r: sim(md), lb: labels(md) });
  const TN = m => m[5] || 1;
  const partsOf = p => String(p).split(' → ');
  function ruleTxt(m) {
    const typ = m[0] === 'S' ? 'SERIA' : 'UKŁAD';
    return `STEP ${typ} ${m[1]}${m[0] === 'S' && m[2] > 1 ? ' ×' + m[2] : ''}${m[6] ? ` → STEP2 ${m[6]}` : ''} → TRIGGER ${m[3]}${TN(m) > 1 ? ' ×' + TN(m) : ''} → zakład +${m[4]}`;
  }
  function nextHit(pred) {   // które kody na następnym wierszu dadzą trafienie wzorca
    const parts = partsOf(pred), n = parts.length;
    for (let j = 0; j < n - 1; j++) if (!m1(parts[j], codes[codes.length - (n - 1) + j] || 'XXX')) return [];
    return AL.filter(c => m1(parts[n - 1], c));
  }

  const F = window.T50Frame(C.title, [['gra', 'GRA'], ['tab', 'TABELA'], ['stat', 'STATY'], ['lista', 'MODELE']]);

  // ---- TABELA (UT) ----
  const CSS = { L0: 'color:#8b93a7', L1: 'color:#8b93a7', L2: 'background:#FFF2CC;color:#7F6000', L3: 'background:#FFF2CC;color:#7F6000;font-weight:700',
    L3b: 'background:#E4D2F7;color:#4B1F7A;font-weight:700', L4: 'background:#F4B183;color:#000;font-weight:700', L4c: 'background:#F8CBAD;color:#000;font-weight:700',
    L5: 'background:#F2F2F2;color:#595959', L6: 'background:#C6EFCE;color:#006100;font-weight:700', L7: 'background:#FCE4E4;color:#9C0006',
    L8: 'background:#FF6666;color:#fff;font-weight:700', L9: 'background:#E7E6E6;color:#C00000' };
  const FC_BET = 'background:#FF6600;color:#fff', FC_COND = 'background:#FFF2CC;color:#7F6000';
  function trigRows(md, lb, t) {   // wiersze TRIGGER-a zakończonego w t (układ 2-kodowy → także t-1) + wcześniejsze TRIGGERY n/tn
    const two = partsOf(md.m[3]).length === 2, out = [t];
    if (two) out.push(t - 1);
    for (let j = t - 1; j >= 0 && (lb.K[j] === 12 || lb.K[j] === 1); j--) if (lb.K[j] === 12) { out.push(j); if (two) out.push(j - 1); }
    return out.filter(j => j >= 0);
  }
  const A = {
    chain: (mi, i) => {
      const md = L[mi]; if (!md || i >= N) return null;
      const lb = R(md).lb, K = lb.K;
      let bet = -1;
      if (K[i] >= 6 && K[i] <= 8) bet = i;
      else if (K[i] === 4 || K[i] === 5) bet = lb.B[i];
      else if ([1, 2, 3, 10, 11, 12].includes(K[i])) {
        for (let j = i + 1; j < N; j++) { if (K[j] === 4) { bet = lb.B[j]; break; } if (K[j] === 0 || K[j] === 9 || K[j] >= 6 && K[j] <= 8) break; }
      }
      if (bet < 0) return null;
      let t = -1; for (let j = Math.min(bet, N) - 1; j >= 0; j--) if (K[j] === 4 && lb.B[j] === bet) { t = j; break; }
      if (t < 0) return null;
      const trig = trigRows(md, lb, t), step = [], sTwo = partsOf(md.m[1]).length === 2;
      for (let j = Math.min(...trig) - 1; j >= 0; j--) {
        const k = K[j];
        if (k === 2 || k === 3 || k === 10) { step.push(j); if ((k === 3 && sTwo) || (k === 10 && partsOf(md.m[6]).length === 2)) step.push(j - 1); }
        else if (k === 1 || k === 11) continue;
        else break;
      }
      return { step: step.filter(j => j >= 0), trig, betI: bet, k: lb.A[t], res: bet >= N ? null : K[bet] === 6 ? 'win' : K[bet] === 8 ? 'bust' : 'loss' };
    },
    stats: mi => {
      const md = L[mi], r = R(md).r, g = games(md);
      return [['Ocena (pkt z 9)', window.__ocenaGames(g, N, ST, 3)], ['Skąd', `${md.e.src || 'SZUKAJ'} · ${md.e.orig || md.id} · BET ${md.tgt}`], ['Reguła', ruleTxt(md.m)]]
        .concat(window.T50Stat.brief(g, N, ST, 3), [['Teraz', `krok ${r.bs + 1} · ${ST[r.bs]} zł · ${nowTxt(md)}`]]);
    },
    win: mi => (L[mi] || L[0] || { tgt: C.targets[0] }).tgt,
    fc: mi => {
      const md = L[mi]; if (!md) return [];
      const r = R(md).r, m = md.m, s = r.bs, win = `${md.tgt} = ✓ WIN ${zl(3 * ST[s] - CUM[s])}`, nxt = s < 7 ? `inny kod = pudło → k${s + 2} ${ST[s + 1]} zł` : 'inny kod = BUST −1 024 zł';
      if (r.ph === 2) {
        const out = [];
        for (let j = N; j < r.wz; j++) out.push({ t: `czekam na grę (dowolny kod) · zakład k${s + 1} na Nr ${r.wz + 1}`, css: CSS.L5, tag: '·', stan: 'przed grą' });
        out.push({ t: `GRA k${s + 1} · ${ST[s]} zł: ${win}`, sub: nxt, css: FC_BET, tag: 'G' });
        return out;
      }
      if (r.ph === 1) {
        const tn = TN(m);
        return [r.st === 1 ? { t: `STEP2 ${m[6]}`, wait: true, css: FC_COND } : null,
          { t: `TRIGGER ${m[3]}${tn > 1 ? ` (${r.st === 1 ? 0 : r.tc}/${tn} → ${tn})` : ''}`, wait: r.st !== 1, css: FC_COND },
          { t: `zakład +${m[4]} · k${s + 1} ${ST[s]} zł`, sub: nxt, css: FC_BET }].filter(Boolean);
      }
      return [];
    },
    N: () => N, code: i => codes[i], isNew: i => { const n = masterN(); return n ? i >= n : false; },
    models: () => L.map(md => ({ id: md.id })),
    desc: mi => { const md = L[mi]; return esc(`${md.id}: ${ruleTxt(md.m)} · BET ${md.tgt} · K8 (z ${md.e.src || 'SZUKAJ'})`); },
    descTxt: mi => { const md = L[mi]; return `${ruleTxt(md.m)} · BET ${md.tgt} · K8`; },
    last: () => N - 1,
    codeRole: (mi, i) => { if (i >= N) return null; const k = R(L[mi]).lb.K[i]; return k === 6 ? 'win' : (k === 4 || k === 12) ? 'trig' : (k === 2 || k === 3 || k === 10) ? 'step' : null; },
    cell: (mi, i) => {
      const out = { det: [] }; if (i >= N) return out;
      const md = L[mi], m = md.m, lb = R(md).lb, k = lb.K[i], a = lb.A[i], b = lb.B[i], tn = TN(m), c = codes[i];
      const G = (t, cl, sub) => { out.gra = { t, css: CSS[cl], sub: sub || '' }; };
      const S = (t, cl, sub) => { out.stan = { t, css: CSS[cl], sub: sub || '' }; };
      switch (k) {
        case 0: S('czekam na STEP', 'L0', `STEP ${m[1]}`); break;
        case 1: S(`${m[6] ? 'STEP2 był' : 'STEP otwarty'} · czekam na TRIGGER${tn > 1 ? ` (${a}/${tn})` : ''}`, 'L1', `TRIGGER ${m[3]}`); break;
        case 2: S(`STEP ${a}/${m[2]}`, 'L2', `${c} z grupy ${m[1]} — potrzeba ${m[2]} pod rząd`); break;
        case 3: S(m[0] === 'S' && m[2] > 1 ? `STEP ${a}/${m[2]} — SPEŁNIONY` : 'STEP — SPEŁNIONY', 'L3', `od następnego wiersza czekam na ${m[6] ? `STEP2 (${m[6]})` : 'TRIGGER'}`); break;
        case 9: S('seria STEP przerwana — licznik → 0', 'L9', `${c} spoza ${m[1]}`); break;
        case 10: S('STEP2 — SPEŁNIONY', 'L3b', `od następnego wiersza czekam na TRIGGER${tn > 1 ? ` ×${tn}` : ''}`); break;
        case 11: S('STEP otwarty · czekam na STEP2', 'L1', `STEP2 ${m[6]}`); break;
        case 12: G(`TRIGGER ${a}/${tn}`, 'L4c', `jeszcze ${tn - a} → dopiero ${tn}. TRIGGER ustawia zakład`); S('TRIGGER — liczę dalej', 'L1'); break;
        case 4: G(`▶ TRIGGER${tn > 1 ? ` ${tn}/${tn}` : ''} → zakład k${a} ${ST[a - 1]} zł na Nr ${b + 1}`, 'L4', `gra ${m[4]} ${m[4] === 1 ? 'wiersz' : m[4] <= 4 ? 'wiersze' : 'wierszy'} dalej`);
          S('TRIGGER', 'L4', `zakład na Nr ${b + 1}`); out.det.push(['Zakład', `Nr ${b + 1} · k${a} · ${ST[a - 1]} zł na ${md.tgt}`]); break;
        case 5: G(`czekam na grę · zakład k${a} ${ST[a - 1]} zł na Nr ${b + 1}`, 'L5', `za ${b - i} w.`); S('przed grą', 'L5'); break;
        case 6: G(`GRA k${a} ${ST[a - 1]} zł → ✓ WIN +${b} zł`, 'L6', `${c} to ${md.tgt}`); S('WIN · progresja → krok 1 · czekam na STEP', 'L6');
          out.det.push(['Zakład', `k${a} · ${ST[a - 1]} zł · WIN +${b} zł`]); break;
        case 7: G(`GRA k${a} ${ST[a - 1]} zł ✗ pudło → następny zakład k${a + 1} ${ST[a]} zł`, 'L7', `${c} to nie ${md.tgt}`); S(`pudło · progresja → k${a + 1} · czekam na STEP`, 'L7');
          out.det.push(['Zakład', `k${a} · ${ST[a - 1]} zł · pudło`]); break;
        case 8: G('GRA k8 512 zł → BUST −1 024 zł', 'L8', `${c} to nie ${md.tgt} na kroku 8`); S('BUST · progresja → krok 1 · czekam na STEP', 'L8');
          out.det.push(['Zakład', 'k8 · 512 zł · BUST −1 024 zł']); break;
      }
      return out;
    },
    ev: (mi, i) => { if (i >= N) return false; const k = R(L[mi]).lb.K[i]; return k === 2 || k === 3 || k === 4 || k === 6 || k === 7 || k === 8 || k === 10 || k === 12; },
    tag: (mi, i) => {
      if (i >= N) return null;
      const lb = R(L[mi]).lb, k = lb.K[i], a = lb.A[i];
      const T = { 0: ['·', 'L0'], 1: ['·', 'L1'], 2: [String(a), 'L2'], 3: ['S', 'L3'], 4: ['T', 'L4'], 5: ['·', 'L5'], 6: ['W', 'L6'], 7: ['x', 'L7'], 8: ['B', 'L8'], 9: ['0', 'L9'], 10: ['S2', 'L3b'], 11: ['·', 'L1'], 12: ['t', 'L4c'] }[k] || ['·', 'L0'];
      return { t: T[0], css: CSS[T[1]] };
    },
    rowInfo: i => [['Kod', codes[i] == null ? '—' : codes[i]]],
    legend: () => `<b>GRA</b>: <span style="${CSS.L4}">▶ TRIGGER → zakład</span><span style="${CSS.L4c}">TRIGGER n/tn</span><span style="${CSS.L5}">czekam na grę</span><span style="${CSS.L6}">✓ WIN</span><span style="${CSS.L7}">✗ pudło</span><span style="${CSS.L8}">BUST</span>
      <br><b>Stan/Rola</b>: <span style="${CSS.L2}">STEP n/x</span><span style="${CSS.L3}">STEP spełniony</span><span style="${CSS.L3b}">STEP2</span><span style="${CSS.L9}">licznik → 0</span><span style="${CSS.L0}">czekam</span>
      <br>WSZ: liczba = STEP n/x · S STEP · S2 STEP2 · t TRIGGER n/tn · T TRIGGER → zakład · W WIN · x pudło · B BUST. Progresja trwała K8: 8, 8, 16, 32, 64, 128, 256, 512 zł (kurs 3).`,
    bottomH: () => F.nav.offsetHeight,
  };
  UT.A = A;

  // ---- GRA (UG) ----
  function nowTxt(md) {
    const r = R(md).r, m = md.m;
    if (r.ph === 2) return r.wz === N ? `GRA na następnym wierszu (Nr ${r.wz + 1})` : `zakład ustawiony na Nr ${r.wz + 1} (za ${r.wz + 1 - N})`;
    if (r.ph === 1) return r.st === 1 ? `STEP otwarty — czekam na STEP2 ${m[6]}` : `${m[6] ? 'STEP2 był' : 'STEP otwarty'} — czekam na TRIGGER${TN(m) > 1 ? ` ${r.tc + 1}/${TN(m)}` : ''}`;
    return `czekam na STEP${m[0] === 'S' && m[2] > 1 ? ` (licznik ${r.cnt}/${m[2]})` : ''}`;
  }
  function trigWhere(md) {
    const r = R(md).r, m = md.m, t = r.wz - m[4], two = partsOf(m[3]).length === 2;
    return `TRIGGER ${two ? `Nr ${t}–${t + 1} (${codes[t - 1]} + ${codes[t]})` : `Nr ${t + 1} (${codes[t]})`} = ${m[3]} · +${m[4]}`;
  }
  function trigNow(md) {   // kody na następnym wierszu, które dadzą ostatni TRIGGER (zakład)
    const r = R(md).r, m = md.m;
    return r.ph === 1 && r.st !== 1 && r.tc + 1 >= TN(m) ? nextHit(m[3]) : [];
  }
  function cardList(goFn) {
    return L.map((md, mi) => {
      const r = R(md).r, m = md.m, s = r.bs + 1, stake = ST[r.bs], lines = [];
      const t = r.wz - m[4];
      if (r.ph === 2 && r.wz === N) lines.push({ p: 1, txt: `▼ GRA k${s} · ${stake} zł na ${md.tgt}`, sub: trigWhere(md), stake, k: s, er: t + 1 });
      else if (r.ph === 2) lines.push({ p: 4, txt: `gra za ${r.wz + 1 - N} → Nr ${r.wz + 1} · k${s} · ${stake} zł na ${md.tgt}`, sub: trigWhere(md), er: t + 1 });
      else if (r.ph === 1 && r.st === 1) { const sc = nextHit(m[6]); lines.push({ p: 5, txt: `STEP otwarty (Nr ${r.srow + 1}) — czekam na STEP2 ${m[6]}`, sub: sc.length ? `jeśli Nr ${N + 1} = ${sc.join(', ')} → STEP2` : 'następny wiersz nie da STEP2', er: r.srow + 1 }); }
      else if (r.ph === 1) {
        const tc = nextHit(m[3]), tn = TN(m), last = r.tc + 1 >= tn;
        if (tc.length) lines.push({ p: 3, txt: `TRIGGER jeśli wpadnie ${tc.join(', ')}`, sub: last ? `→ zakład k${s} ${stake} zł na Nr ${N + 1 + m[4]}` : `→ TRIGGER ${r.tc + 1}/${tn}`, er: r.srow + 1 });
        else lines.push({ p: 5, txt: `${m[6] ? 'STEP2 był' : `STEP otwarty (Nr ${r.srow + 1})`} — czekam na TRIGGER ${m[3]}${tn > 1 ? ` (było ${r.tc}/${tn})` : ''}`, sub: 'następny wiersz nie da TRIGGERA', er: r.srow + 1 });
      } else lines.push({ p: 6, txt: `czekam na STEP ${m[1]}${m[0] === 'S' && m[2] > 1 ? ` (licznik ${r.cnt}/${m[2]})` : ''}`, sub: `krok ${s} · ${stake} zł` });
      return { id: md.id, mid: md.id, rule: `${ruleTxt(m)} · BET ${md.tgt}`, lines,
        meta: [`cykle ${r.nw + r.nbu} · W ${r.nw} · BUST ${r.nbu} · krok ${s}`, zl(r.pnl)],
        go: er => goFn(md.id, er), stats: () => A.stats(mi) };
    });
  }
  function cards(goFn) { return L.length ? [{ name: '', cards: cardList(goFn) }] : []; }
  function lines() {
    const items = [], hint = {};
    cardList(() => {}).forEach(c => c.lines.forEach(l => items.push(Object.assign({ id: c.id }, l))));
    L.forEach(md => trigNow(md).forEach(c => (hint[c] = hint[c] || []).push(md.id)));
    return { sections: [{ name: '', items }], trig: AL.filter(c => hint[c]).map(c => [c, hint[c]]) };
  }
  function go(id, er) { UT.open(String(id), er ? er - 1 : null); F.show('tab'); }

  // ---- MODELE: lista przeniesionych + dodawanie z MOJE GRY appek SZUKAJ / SZUKAJ+ ----
  function mojeSz() {
    const out = [];
    C.src.forEach(([src, pre, plus]) => C.targets.forEach(tgt => {
      let a = []; try { a = JSON.parse(lsGet(pre + tgt, '[]')); } catch (e) {}
      (Array.isArray(a) ? a : []).forEach(g => { if (g && Array.isArray(g.m)) out.push({ src, plus, tgt, g }); });
    }));
    return out;
  }
  const mkId = (src, tgt, orig) => `${src === 'SZUKAJ+' ? 'S+' : 'S'}·${C.targets.length > 1 ? tgt + '·' : ''}${orig}`;
  function addModel(src, plus, tgt, m, orig) {
    const a = getList(), mm = norm(m, plus);
    if (a.some(e => spec(e.m, e.tgt) === spec(mm, tgt))) return false;
    a.push({ m: mm, tgt, id: mkId(src, tgt, orig), orig, src, t: Date.now(), start: N }); setList(a); return true;
  }
  function redraw() { rebuild(); F.setN(`n=${fmt(N)} · ${L.length} mod.`); F.render(F.view); }
  function changed() { redraw(); try { window.parent.refresh(); } catch (e) {} }   // lista modeli zmieniona → GRA / chipy w powłoce
  function renderList() {
    const box = (t, b) => `<div class="card"><h2>${t}</h2>${b}</div>`;
    let h = box(`Modele w tej tabeli · ${L.length}`, L.length ? L.map((md, i) => {
      const r = R(md).r;
      return `<div class="szk-r"><div><b>${esc(md.id)}</b> <span class="muted">${esc(md.e.src || '')}${md.e.orig ? ' ' + esc(md.e.orig) : ''} · BET ${md.tgt}</span><div class="szk-s">${esc(ruleTxt(md.m))}</div>
        <div class="szk-s">cykle ${r.nw + r.nbu} · W ${r.nw} · BUST ${r.nbu} · <span class="${r.pnl >= 0 ? 'pos' : 'neg'}">${zl(r.pnl)}</span> · teraz k${r.bs + 1} · ${esc(nowTxt(md))}</div></div>
        <button class="szk-del" data-i="${i}">✕</button></div>`;
    }).join('') : `<div class="muted">Pusto. Model z SZUKAJ / SZUKAJ+ dodasz: w tamtej appce przytrzymaj kartę modelu → <b>„⇢ Dodaj do ${esc(C.razem)}”</b>, albo poniżej z MOJE GRY.</div>`);
    const M = mojeSz(), have = new Set(getList().map(e => spec(e.m, e.tgt)));
    h += box('Dodaj z MOJE GRY (SZUKAJ / SZUKAJ+)', M.length ? M.map((x, i) => {
      const mm = norm(x.g.m, x.plus), on = have.has(spec(mm, x.tgt));
      return `<div class="szk-r"><div><b>${esc(x.src)} · ${esc(x.g.id || '?')}</b> <span class="muted">BET ${x.tgt}</span><div class="szk-s">${esc(ruleTxt(mm))}</div></div>
        <button class="szk-add${on ? ' on' : ''}" data-j="${i}"${on ? ' disabled' : ''}>${on ? '✓ jest' : '＋ dodaj'}</button></div>`;
    }).join('') : '<div class="muted">W MOJE GRY appek SZUKAJ / SZUKAJ+ nie ma teraz modeli (ten sam telefon i przeglądarka).</div>');
    h += box('Jak to działa', `<div class="muted">Tabela liczy przeniesione modele na wspólnym ciągu RAZEM — ten sam silnik co SZUKAJ+ (STEP ×x → [STEP2] → TRIGGER ×n → zakład +off),
      progresja trwała K8: ${ST.join(' · ')} zł, kurs 3. Karty trafiają na wspólny ekran GRA, do MOJE GRY i MOJE ZAKŁADY jak modele z innych tabel.
      Usunięcie (✕) zabiera model tylko z RAZEM — w SZUKAJ zostaje.</div>`);
    F.main.innerHTML = `<style>.szk-r{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #2a3142}.szk-r>div{flex:1;min-width:0}.szk-s{font-size:11.5px;color:#c9cfdc;margin-top:2px}
      .szk-del,.szk-add{border:0;border-radius:8px;padding:8px 10px;font-weight:700;font-size:13px;background:#242a38;color:#ff8a8a}.szk-add{background:#7030A0;color:#fff}.szk-add.on{background:#242a38;color:#5fd38a}</style>` + h;
    F.main.querySelectorAll('.szk-del').forEach(b => b.onclick = () => {
      const md = L[+b.dataset.i]; if (!md || !confirm(`Usunąć ${md.id} z ${C.razem}? (w SZUKAJ zostaje)`)) return;
      setList(getList().filter(e => spec(e.m, e.tgt) !== spec(md.m, md.tgt))); changed();
    });
    F.main.querySelectorAll('.szk-add').forEach(b => b.onclick = () => { const x = M[+b.dataset.j]; if (x && addModel(x.src, x.plus, x.tgt, x.g.m, x.g.id || '?')) changed(); });
  }

  // ---- STATY ----
  function renderStat() {
    if (!L.length) { F.main.innerHTML = `<div class="card muted">Brak modeli — dodaj je w zakładce MODELE.</div>`; if (window.__MJ && __MJ.mount) __MJ.mount(F.main); return; }
    window.T50Stat.render(F.main, {
      title: 'SZUKAJ w RAZEM', N, ST, odds: 3,
      note: `Cykl = gra od zakładu na kroku 1 do WIN albo BUST (progresja trwała K8: ${ST.join(' · ')} zł, kurs 3, BUST −1 024 zł).`,
      groups: [{ name: '', items: L.map(md => ({ id: md.id, sub: `${md.e.src || 'SZUKAJ'} · BET ${md.tgt}`, def: ruleTxt(md.m), games: games(md), extra: [['Teraz', esc(nowTxt(md))]] })) }],
    });
  }

  F.render = v => {
    if (v === 'gra') UG.render(F.main, { N, sections: cards((id, er) => go(id, er)), last: codes.slice(-8), idleSub: L.length ? 'Żaden model nie gra na następnym wierszu.' : 'Brak modeli — dodaj je w zakładce MODELE.' });
    else if (v === 'tab') { if (L.length) UT.render(F.main, A); else F.main.innerHTML = '<div class="card muted">Brak modeli — dodaj je w zakładce MODELE.</div>'; }
    else if (v === 'lista') renderList();
    else renderStat();
  };
  function sync() { redraw(); }
  function add() {
    redraw();
    const i = N - 1, out = [];
    L.forEach((md, mi) => { const k = R(md).lb.K[i]; if ([3, 4, 6, 7, 8, 10, 12].includes(k)) { const c = A.cell(mi, i); out.push(`<b>${esc(md.id)}</b> ${esc((c.gra || c.stan).t)}`); } });
    return out.join('<br>');
  }
  window.addEventListener('storage', e => { if (e.key === C.key) changed(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && JSON.stringify(getList().map(e => e.id)) !== JSON.stringify(L.map(md => md.e.id))) changed(); });

  rebuild();
  F.setN(`n=${fmt(N)} · ${L.length} mod.`);
  F.show('gra');

  const API = {
    count: () => N, last: () => codes[N - 1], seedN: 0,
    sync, add, undo: sync, lines, cards, go, render: () => F.render(F.view),
    remove: id => { const md = L.find(x => x.id === id); if (!md) return false; setList(getList().filter(e => spec(e.m, e.tgt) !== spec(md.m, md.tgt))); changed(); return true; },
    rowRes: (id, r) => { const md = L.find(x => x.id === id); if (!md || r >= N) return null; const k = R(md).lb.K[r]; return k === 6 ? 'win' : k === 7 || k === 8 ? 'lost' : 'none'; },
    track: (id, from) => { const md = L.find(x => x.id === id); if (!md) return null; const K = R(md).lb.K; for (let i = Math.max(0, from); i < N; i++) if (K[i] === 6 || K[i] === 8) return { win: K[i] === 6, i, t: A.cell(L.indexOf(md), i).gra.t }; return null; },
    selfTest: () => {
      const bad = L.filter(md => { const r = R(md).r, K = R(md).lb.K; let w = 0, b = 0; for (let i = 0; i < N; i++) { if (K[i] === 6) w++; else if (K[i] === 8) b++; } return w !== r.nw || b !== r.nbu; });
      return { ok: !bad.length, txt: bad.length ? `niezgodne: ${bad.map(x => x.id).join(', ')}` : `${L.length} modeli · silnik = etykiety na ${fmt(N)} kodach` };
    },
    // do testów: silnik na dowolnym modelu
    _sim: (m, tgt) => { const md = { id: '_t', m: norm(m, true), tgt, Y: AL.map(c => c[TPOS[tgt]] === '1' ? 1 : 0) }; return sim(md); },
  };
  window.T50 = API; window.T60 = API;
})();
