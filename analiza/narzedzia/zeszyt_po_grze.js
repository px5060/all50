// ZESZYT T50 — „pierwsza połówka po grze” (szukania z rozmowy 21–22.11, opis: analiza/BRIEF_zeszyt_po_grze.md).
// Model jak w SZUKAJ W ZESZYCIE: 3 wiersze połówki (1–28), środek X+X (2. cyfra kodu = gol 51'–60'), bez „+ z boku”, po 1 pustej trójce, limit k9 / k10.
// Gra modelu kończy się trafieniem środka; „pierwsza połówka po grze” = następna połówka po tej, na której gra się skończyła.
// Tam: trafienie środka na którymś wierszu = brak triggera (model czeka dalej), wszystkie wiersze puste = trigger (gra od następnej połówki).
// Użycie (z katalogu all50; pule / silniki: bash analiza/narzedzia/pobierz.sh; stan telefonu: ../px5060/kody/stan.json):
//   node analiza/narzedzia/zeszyt_po_grze.js ranking [--min 80] [--top 15]          wszystkie układy wg najmniejszego udziału triggerów od razu po grze
//   node analiza/narzedzia/zeszyt_po_grze.js teraz [--karta 277L] [--top 15]        układy, dla których bieżąca/następna połówka = pierwsza próba po grze
//   node analiza/narzedzia/zeszyt_po_grze.js polost [--od 12] [--do 28] [--wszystkie] [--max-lost 99]
//        po LOST-cie, teraz pierwsza połówka po nim (jeszcze nie rozegrana do końca), w historii po KAŻDYM LOST-cie na pierwszej połówce trafienie
//   node analiza/narzedzia/zeszyt_po_grze.js razem 11.12.27 6.21.27 …                 zestaw układów: wspólne wiersze do progresji, historia
//   node analiza/narzedzia/zeszyt_po_grze.js zestawy [--karta 277L] [--wierszy 8] [--max-ukl 3] [--min-razem 5] [--top 15]
//        zestawy układów, które TERAZ są razem na pierwszej próbie po grze i dają dokładnie N wierszy (progresja N kroków na połówce);
//        ranking: najwięcej połówek w historii, na których wszystkie były naraz na pierwszej próbie i progresja nigdy nie przegrała
//        (--max-ukl 4: ok. 200 mln zestawów, ok. 4 min; 3: ok. 6 mln, kilka sekund)
//   node analiza/narzedzia/zeszyt_po_grze.js progresja [--kroki 5]                    sprawdzenie progresji 8·8·16·32·… na środek (od trafienia / sztywno w połówkach)
//   opcje wspólne: --stan ../px5060/kody/stan.json
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const A = process.argv.slice(2), tryb = A[0], opt = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; }, flaga = k => A.includes('--' + k);
const D = process.env.PX5060 || path.join(__dirname, '..', '..', '..', 'px5060'), STAN = opt('stan', path.join(D, 'kody', 'stan.json'));
const E = vm.runInNewContext(fs.readFileSync(path.join(D, 'zeszyt', 'silnik.js'), 'utf8') + '\n;({buildBook, partsOf});', {});
const d = JSON.parse(fs.readFileSync(STAN, 'utf8')), c = d.t50.kody.match(/.{3}/g); let P = {}; try { P = JSON.parse((d.storage || {}).zeszyt_v1_poprawki_t50 || '{}') || {}; } catch (e) {}
for (const nr in P) if (+nr >= 1 && +nr <= c.length && /^\d{3}$/.test(P[nr])) c[nr - 1] = P[nr];   // poprawki kodów z ZESZYTU (jak liczy ZESZYT)
const n = c.length, B = E.buildBook(n + 60), POZ = 1, ST = [8, 8, 16, 32, 64, 128, 256, 512, 1024, 2048], KURS = 3;
const kw = row => [...row.pre, ...(row.nr ? [row.nr] : []), ...row.dop], hitK = x => c[x - 1][POZ] === '1';
const pol = (k, p) => `${k} ${p ? 'P' : 'L'}`, pct = (a, b) => b ? `${a}/${b} (${(100 * a / b).toFixed(1)}%)` : '—';
const trojki = (od, do_) => { const T = []; for (let a = od; a <= do_; a++) for (let b = a + 1; b <= do_; b++) for (let e = b + 1; e <= do_; e++) T.push([a, b, e]); return T; };
// przebieg modelu: H = połówki {k, p, gra (w grze), pierwsza (pierwsza próba po grze), poLost (… po LOST-cie), hit (wiersz trafienia), krok};
// teraz = połówka w toku {k, p, r (pierwszy nierozegrany wiersz), rozeg, pierwsza, poLost}
function przebieg(w, L) {
  const mx = Math.max(...w), H = []; let gra = null, nobs = 0, poGrze = false, poLost = false, gry = 0, lost = 0, ostLost = false, teraz = null;
  scan: for (let k = 0; k < B.cards.length; k++) for (let p = 0; p < B.cards[k].parts.length; p++) {
    if (E.partsOf(k)[p] < mx) continue;
    const rows = B.cards[k].parts[p], rozeg = []; let hit = 0, krok = 0;
    for (const r of w) { const row = rows[r - 1];
      if (row.nr > n) { teraz = { k, p, r, rozeg, pierwsza: poGrze && !gra, poLost: poLost && !gra, gra: !!gra }; break scan; }
      for (const x of kw(row)) { if (x > n) continue; if (gra) gra.st++; krok++; if (hitK(x)) { hit = r; break; } }
      rozeg.push(r); if (hit) break; }
    if (gra) { H.push({ k, p, gra: true, hit }); if (hit) { gry++; ostLost = gra.st > L; if (ostLost) lost++; poGrze = true; poLost = ostLost; gra = null; nobs = 0; } continue; }
    H.push({ k, p, pierwsza: poGrze, poLost, hit, krok }); poGrze = false; poLost = false;
    if (hit) { nobs = 0; continue; }
    if (++nobs === 1) { gra = { st: 0 }; nobs = 0; }
  }
  return { w, L, H, gry, lost, ostLost, teraz };
}
const statPoGrze = R => { const E1 = R.H.filter(h => h.pierwsza), t = E1.length, trig = E1.filter(h => !h.hit).length, h = t >> 1;
  return { t, trig, ud: t ? trig / t : 1, t1: E1.slice(0, h).filter(x => !x.hit).length, h, t2: E1.slice(h).filter(x => !x.hit).length, wg: R.w.map(r => E1.filter(x => x.hit === r).length) }; };
const nrWierszy = (k, p, w) => w.map(r => `w.${r} Nr ${kw(B.cards[k].parts[p][r - 1]).join('+')}`).join(' · ');
const stanT = R => !R.teraz ? '?' : R.teraz.pierwsza ? `TERAZ pierwsza próba po grze (karta ${pol(R.teraz.k, R.teraz.p)}${R.teraz.rozeg.length ? ', rozegrane ' + R.teraz.rozeg.join('·') : ''})` : R.teraz.gra ? 'w grze' : 'czeka na pustą trójkę';
const pFreq = c.filter(x => x[POZ] === '1').length / n;
console.log(`kody T50 do Nr ${n} · środek (2. cyfra) w ${(100 * pFreq).toFixed(1)}% kodów · zwykły trigger (3 puste wiersze) ≈ ${(100 * (1 - pFreq) ** 3).toFixed(0)}%`);

if (tryb === 'ranking' || tryb === 'teraz') {
  const min = +opt('min', 80), top = +opt('top', 15), karta = opt('karta'), W = [];
  for (const w of trojki(1, 28)) { const R = przebieg(w, 9), S = statPoGrze(R); if (S.t < min) continue;
    if (tryb === 'teraz') { const T = R.teraz; if (!T || !T.pierwsza || T.rozeg.length || (karta && pol(T.k, T.p).replace(' ', '') !== karta.toUpperCase())) continue; }
    W.push({ R, S }); }
  W.sort((x, y) => x.S.ud - y.S.ud || y.S.t - x.S.t);
  const U = W.map(x => x.S.ud);
  console.log(`${tryb === 'teraz' ? 'pierwsza próba po grze teraz' : 'wszystkie układy'} (≥ ${min} gier): ${W.length} · średnio trigger od razu po grze ${(100 * U.reduce((a, b) => a + b, 0) / (U.length || 1)).toFixed(1)}% · najmniej ${U.length ? (100 * U[0]).toFixed(1) : '—'}% · < 20%: ${U.filter(x => x < 0.2).length} · < 25%: ${U.filter(x => x < 0.25).length}`);
  for (const { R, S } of W.slice(0, top)) console.log(`  ${R.w.join('·').padEnd(9)} | gier ${R.gry}, LOST k9 ${R.lost} | trigger od razu po grze ${pct(S.trig, S.t)} · połowy historii ${S.t1}/${S.h} · ${S.t2}/${S.t - S.h} | trafienie w wierszu ${R.w.join('/')}: ${S.wg.join('/')} | ${stanT(R)}${tryb === 'teraz' ? ' | ' + nrWierszy(R.teraz.k, R.teraz.p, R.w) : ''}`);
} else if (tryb === 'polost') {
  const od = +opt('od', 12), do_ = +opt('do', 28), wsz = flaga('wszystkie'), maxL = +opt('max-lost', 99), best = {};
  for (const w of trojki(1, 28)) for (const L of [9, 10]) {
    const R = przebieg(w, L), T = R.teraz; if (!R.lost || R.lost > maxL || !R.ostLost || !T || !T.poLost) continue;
    const poL = R.H.filter(h => h.poLost); if (poL.some(h => !h.hit)) continue;   // po każdym wcześniejszym LOST-cie trafienie na pierwszej połówce
    const zostaje = w.filter(r => !T.rozeg.includes(r)); if (zostaje.some(r => r < od || r > do_) || w.filter(r => r >= od && r <= do_).length < (wsz ? 3 : 2)) continue;
    const key = w.join('·'); if (!best[key] || R.lost > best[key].R.lost) best[key] = { R, poL, zostaje };
  }
  const L = Object.values(best).sort((x, y) => y.R.lost - x.R.lost || y.R.gry - x.R.gry);
  console.log(`po LOST-cie, teraz pierwsza połówka po nim, w historii zawsze trafienie na pierwszej połówce · do gry tylko wiersze ${od}–${do_}${wsz ? ' (wszystkie 3)' : ''}: ${L.length}`);
  for (const { R, poL, zostaje } of L) console.log(`  ${R.w.join('·')} k${R.L} | gier ${R.gry}, LOST ${R.lost} | po wcześniejszych LOST-ach trafienie w wierszu ${poL.map(h => h.hit).join(', ')} | karta ${pol(R.teraz.k, R.teraz.p)}, rozegrane bez trafienia: ${R.teraz.rozeg.join('·') || '—'} · do gry: ${nrWierszy(R.teraz.k, R.teraz.p, zostaje)}`);
} else if (tryb === 'razem') {
  const M = A.slice(1).filter(x => /^\d+([.·]\d+){2}$/.test(x)).map(x => przebieg(x.split(/[.·]/).map(Number).sort((a, b) => a - b), 9));
  if (!M.length) { console.log('podaj układy, np. razem 11.12.27 6.21.27'); process.exit(1); }
  const T0 = M[0].teraz, R9 = [...new Set(M.flatMap(R => R.w))].sort((a, b) => a - b);
  console.log(`zestaw ${M.length} układów · wspólne wiersze ${R9.join(', ')} · teraz: ${M.map(R => `${R.w.join('·')} ${stanT(R)}`).join(' | ')}`);
  if (T0) { let s = 0; console.log(`progresja na środek po wierszach (karta ${pol(T0.k, T0.p)}; stawki ${ST.slice(0, R9.length).join('·')}, kurs ${KURS}):`);
    R9.forEach((r, i) => { s += ST[i]; console.log(`  ${i + 1}. ${nrWierszy(T0.k, T0.p, [r])} · stawka ${ST[i]} · razem ${s} · przy trafieniu ${KURS * ST[i] - s >= 0 ? '+' : ''}${KURS * ST[i] - s} · zamyka: ${M.filter(R => R.w.includes(r)).map(R => R.w.join('·')).join(', ')}`); }); }
  const S = M.map(R => new Map(R.H.map(h => [`${h.k}.${h.p}`, h]))), K = [...S[0].keys()].filter(k => S.every(m => m.has(k)));
  const wsz = K.filter(k => S.every(m => m.get(k).pierwsza));
  console.log(`historia (${K.length} połówek): wszystkie ${M.length} naraz na pierwszej próbie po grze — ${wsz.length} razy`);
  for (const k of wsz) { const [kk, pp] = k.split('.').map(Number), rows = B.cards[kk].parts[pp], kody = R9.map(r => c[rows[r - 1].nr - 1]), i = kody.findIndex(x => x[POZ] === '1');
    console.log(`  karta ${pol(kk, pp)}: trafienie ${S.filter(m => m.get(k).hit).length}/${M.length} · progresja wygrałaby na kroku ${i + 1} (w.${R9[i]})`); }
  const puste = K.filter(k => { const [kk, pp] = k.split('.').map(Number), rows = B.cards[kk].parts[pp]; return R9.every(r => kw(rows[r - 1]).every(x => !hitK(x))); });
  const idx = puste.map(k => K.indexOf(k)), gaps = idx.slice(1).map((x, i) => x - idx[i]);
  console.log(`wszystkie ${R9.length} wierszy bez środka: ${pct(puste.length, K.length)} (teoria ${(100 * (1 - pFreq) ** R9.length).toFixed(1)}%) · ostatnio: karta ${puste.length ? puste[puste.length - 1].replace('.0', ' L').replace('.1', ' P') : '—'}, ${idx.length ? K.length - 1 - idx[idx.length - 1] : '—'} połówek temu · odstęp średnio ${gaps.length ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : '—'}, najdłuższy ${gaps.length ? Math.max(...gaps) : '—'}, najkrótszy ${gaps.length ? Math.min(...gaps) : '—'}`);
  for (const prog of [M.length - 2, M.length - 1].filter(x => x >= 2)) { const Kp = K.filter(k => S.filter(m => m.get(k).pierwsza).length >= prog);
    console.log(`co najmniej ${prog} z ${M.length} naraz na pierwszej próbie: ${Kp.length} razy · wszystkie z nich trigger: ${Kp.filter(k => S.filter(m => m.get(k).pierwsza).every(m => !m.get(k).hit)).length}`); }
} else if (tryb === 'zestawy') {
  // zestawy 2–3 (--max-ukl) układów, które TERAZ są na pierwszej próbie po grze na tej samej połówce i razem dają dokładnie --wierszy wierszy
  // (progresja 8·8·16·… po sumie wierszy, np. 8 wierszy = 8 kroków = 1 024 zł); historia: połówki, na których wszystkie były naraz na pierwszej próbie
  const Wn = +opt('wierszy', 8), min = +opt('min', 80), top = +opt('top', 15), karta = opt('karta'), maxU = +opt('max-ukl', 3), minRazem = +opt('min-razem', 5);
  const HI = new Map(), HK = []; for (let k = 0; k < B.cards.length; k++) for (let p = 0; p < B.cards[k].parts.length; p++) { HI.set(`${k}.${p}`, HK.length); HK.push([k, p]); }
  const NW = (HK.length + 31) >> 5, bc = x => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24; };
  // maska wierszy ze środkiem na każdej rozegranej do końca połówce (bit r = wiersz r)
  const hitM = HK.map(([k, p]) => { const rows = B.cards[k].parts[p]; let m = 0, ok = true;
    rows.forEach((row, i) => { const X = kw(row); if (!row.nr || X.some(x => x > n)) { ok = false; return; } if (X.some(hitK)) m |= 1 << (i + 1); }); return ok ? m : -1; });
  const G = {};
  for (const w of trojki(1, 28)) { const R = przebieg(w, 9), T = R.teraz; if (!T || !T.pierwsza || T.rozeg.length) continue;
    const pk = pol(T.k, T.p).replace(' ', ''); if (karta && pk !== karta.toUpperCase()) continue; const S = statPoGrze(R); if (S.t < min) continue;
    const F = new Uint32Array(NW); for (const h of R.H) if (h.pierwsza) { const i = HI.get(`${h.k}.${h.p}`); F[i >> 5] |= 1 << (i & 31); }
    (G[pk] = G[pk] || { i: HI.get(`${T.k}.${T.p}`), C: [] }).C.push({ R, S, F, m: w.reduce((a, r) => a | 1 << r, 0) }); }
  const pk = karta ? karta.toUpperCase() : Object.keys(G).sort((a, b) => G[a].i - G[b].i)[0];
  if (!G[pk]) { console.log(`brak układów na pierwszej próbie po grze na karcie ${pk || '?'}`); process.exit(0); }
  const C = G[pk].C.sort((x, y) => x.S.ud - y.S.ud), [tk, tp] = HK[G[pk].i], Z = [];
  const rowsOf = m => { const r = []; for (let i = 1; i <= 28; i++) if (m >> i & 1) r.push(i); return r; };
  const buf = Array.from({ length: maxU + 1 }, () => new Uint32Array(NW)), sel = []; let wszZ = 0, oczek = 0, zeroN = 0, progZ = 0;
  const zapisz = (d, um) => {   // d = liczba układów; buf[d] = połówki, na których wszystkie były naraz na pierwszej próbie
    for (let a = 0; a < d; a++) { let u = 0; for (let b = 0; b < d; b++) if (b !== a) u |= C[sel[b]].m; if (!(C[sel[a]].m & ~u)) return; }
    const W = rowsOf(um), razem = [], kroki = []; let przeg = 0;
    for (let j = 0; j < NW; j++) { let x = buf[d][j]; while (x) { const b = 31 - Math.clz32(x & -x); x &= x - 1; const i = 32 * j + b, h = hitM[i] & um; razem.push(i);
      if (h) kroki.push(W.findIndex(r => h >> r & 1) + 1); else przeg++; } }
    wszZ++; oczek += (1 - (1 - pFreq) ** Wn) ** razem.length;
    if (!przeg) { zeroN++; if (razem.length >= progZ) { Z.push({ sel: sel.slice(0, d), um, razem, kroki, przeg }); if (Z.length > 4000) { Z.sort((x, y) => y.razem.length - x.razem.length); Z.length = 2000; progZ = Z[Z.length - 1].razem.length; } } } };
  const dfs = (od, d, um) => {
    for (let i = od; i < C.length; i++) { const u = um | C[i].m; if (u === um) continue; const bu = bc(u); if (bu > Wn) continue;
      const Fi = C[i].F, A = buf[d], O = buf[d + 1]; let cnt = 0;
      if (d === 0) for (let j = 0; j < NW; j++) { O[j] = Fi[j]; cnt += bc(Fi[j]); } else for (let j = 0; j < NW; j++) { O[j] = A[j] & Fi[j]; cnt += bc(O[j]); }
      if (cnt < minRazem) continue; sel[d] = i;
      if (bu === Wn) { if (d >= 1) zapisz(d + 1, u); } else if (d + 1 < maxU) dfs(i + 1, d + 1, u); } };
  dfs(0, 0, 0);
  for (const z of Z) z.ud = z.sel.reduce((a, i) => a + C[i].S.ud, 0) / z.sel.length;
  Z.sort((x, y) => y.razem.length - x.razem.length || x.ud - y.ud); Z.length = Math.min(Z.length, top);
  for (const z of Z) { const W = rowsOf(z.um), pe = hitM.filter((m, i) => m >= 0 && E.partsOf(HK[i][0])[HK[i][1]] >= W[W.length - 1]); z.puste = pe.filter(m => !(m & z.um)).length; z.wsz = pe.length; }
  console.log(`karta ${pk}: układów na pierwszej próbie po grze (≥ ${min} gier) ${C.length} · zestawy 2–${maxU} układów dające razem ${Wn} wierszy (≥ ${minRazem} razy naraz w historii): ${wszZ}`);
  console.log(`  bez przegranej progresji, gdy wszystkie były naraz na pierwszej próbie: ${zeroN} (z samego przypadku oczekiwane ok. ${oczek.toFixed(0)}) · wszystkie ${Wn} wierszy puste: teoria ${(100 * (1 - pFreq) ** Wn).toFixed(1)}%`);
  for (const z of Z) { const W = rowsOf(z.um);
    console.log(`  ${z.sel.map(i => C[i].R.w.join('·')).join(' + ').padEnd(30)} | wiersze ${W.join(',')} | naraz na 1. próbie ${z.razem.length}×, progresja przegrana ${z.przeg}×, wygrana na krokach ${z.kroki.filter(x => x).join(',')} | wszystkie ${Wn} puste w historii ${pct(z.puste, z.wsz)} | trigger po grze: ${z.sel.map(i => (100 * C[i].S.ud).toFixed(0) + '%').join(' / ')}`);
    console.log(`      Nr: ${W.map(r => kw(B.cards[tk].parts[tp][r - 1]).join('+')).join(' · ')} · ostatnio naraz: ${z.razem.slice(-3).map(i => pol(...HK[i])).join(', ')}`); }
} else if (tryb === 'progresja') {
  const kroki = +opt('kroki', 5), seria = nrs => { let post = 0; for (let i = 0; i < nrs.length; i++) { post += ST[i]; if (hitK(nrs[i])) return { k: i + 1, bil: KURS * ST[i] - post, post }; } return { k: 0, bil: -post, post }; };
  const rap = (nazwa, S) => { const w = S.filter(s => s.k).length, bil = S.reduce((a, s) => a + s.bil, 0), post = S.reduce((a, s) => a + s.post, 0); console.log(`${nazwa}: serii ${S.length} · wygranych ${pct(w, S.length)} · bilans ${bil} zł (${(100 * bil / post).toFixed(1)}% postawionych ${post} zł)`); };
  { const S = []; for (let i = 1; i + kroki - 1 <= n;) { const s = seria(Array.from({ length: kroki }, (_, j) => i + j)); S.push(s); i += s.k || kroki; } rap(`A) ${kroki} kolejnych kodów, nowa seria od kodu po trafieniu`, S); }
  { const S = []; for (let k = 0; k < B.cards.length; k++) for (let p = 0; p < B.cards[k].parts.length; p++) { const rows = B.cards[k].parts[p], len = E.partsOf(k)[p];
      for (let a = 1; a + kroki - 1 <= len; a += kroki) { const nrs = []; for (let r = a; r < a + kroki; r++) if (rows[r - 1].nr && rows[r - 1].nr <= n) nrs.push(rows[r - 1].nr); if (nrs.length === kroki) S.push(seria(nrs)); } }
    rap(`B) sztywno w połówkach: wiersze 1–${kroki}, ${kroki + 1}–${2 * kroki} …`, S); }
  const q = 1 - pFreq; let ev = 0, post = 0, sum = 0; for (let i = 0; i < kroki; i++) { sum += ST[i]; post += q ** i * ST[i]; ev += q ** i * pFreq * (KURS * ST[i] - sum); } ev -= q ** kroki * sum;
  console.log(`teoria (kody bez pamięci): wygrana serii ${(100 * (1 - q ** kroki)).toFixed(1)}% · średnio ${ev.toFixed(2)} zł na serię (${(100 * ev / post).toFixed(1)}% postawionego)`);
} else console.log('tryby: ranking | teraz | polost | razem | progresja (opis na górze pliku)');
