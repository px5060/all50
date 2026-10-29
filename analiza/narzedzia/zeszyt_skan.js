// Propozycje modeli ZESZYTU (jak SZUKAJ W ZESZYCIE): wszystkie układy wierszy, ustawienia domyślne wyszukiwarki
// (T50: X+X, po 1 pustej trójce, bez warunku i „+ z boku”, do k9 / k10; T60: x1x i xx1, 2–3 wiersze, po 1 pustej stronie, do k9 / k10),
// min. 100 gier, najwyżej 2 LOST. Ułożone wg zamknięcia w historii od obecnego kroku; osobno: GRA teraz i CZEKA na start.
// Użycie: node zeszyt_skan.js T50.json T60.json [top] [min_przypadkow] [do_kroku]   (do_kroku: zakładany krok gry, 0 = limit modelu)
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = process.env.PX5060 || path.join(__dirname, '..', '..', '..', 'px5060');
const silnik = f => vm.runInNewContext(fs.readFileSync(path.join(D, 'zeszyt', f), 'utf8') + '\n;({buildBook, liczModel, modNum, modDef, STAWKI, przygotuj: typeof przygotuj === "function" ? przygotuj : null, szybkiModel: typeof szybkiModel === "function" ? szybkiModel : null});', {});
// kody: eksport RAZEM ('codes'), stan.json z MOJE ({t50|t60: {kody}} + poprawki ZESZYTU zeszyt_v1_poprawki_<t> — jak liczy ZESZYT) albo tekst
const kody = (f, t) => { const s = fs.readFileSync(f, 'utf8'); if (s.trim()[0] !== '{') return s.replace(/\D/g, '').match(/.{3}/g);
  const d = JSON.parse(s); if (d.codes) return d.codes; const c = d[t].kody.match(/.{3}/g);
  let P = {}; try { P = JSON.parse((d.storage || {})['zeszyt_v1_poprawki_' + t] || '{}') || {}; } catch (e) {}
  for (const nr in P) if (+nr >= 1 && +nr <= c.length && /^\d{3}$/.test(P[nr])) c[nr - 1] = P[nr]; return c; };
const [, , f50, f60, topS, minS, doS] = process.argv, TOP = +topS || 6, MIN = +minS || 20, DO = +doS || 0;

function wypisz(lab, E, C, B, lista, czest) {
  const n = C.length, gra = [], czeka = [];
  for (const { def, s } of lista) {
    const L = def.limit, g = s.length, b = s.filter(x => x > L).length;
    if (g < 100 || b > 2) continue;
    const M = E.liczModel(C, B, E.modDef(def)), t = M.teraz, k = t.gra ? t.s : 1, LL = DO ? Math.min(DO, L) : L;   // LL: zakładany krok gry
    if (k > LL) continue;
    const reach = s.filter(x => x >= k), w = reach.filter(x => x <= LL).length;
    if (reach.length < MIN) continue;
    const real = 1 - (1 - czest(def)) ** (LL - k + 1);
    (t.gra ? gra : czeka).push({ nazwa: M.nazwa, k, LL, nr: t.nr, h: w / reach.length, w, r: reach.length, real, g, b, stawka: E.STAWKI[k - 1] });
  }
  const sort = a => { a.sort((x, y) => y.h - x.h || y.real - x.real || y.r - x.r); const seen = new Set();   // te same wiersze z innym limitem — raz
    return a.filter(x => { const key = x.nazwa.replace(/ k\d+$/, ''); if (seen.has(key)) return false; seen.add(key); return true; }); };
  console.log(`\n=== ${lab} — propozycje (kody do Nr ${n}; min. 100 gier, ≤ 2 LOST; ułożone wg wygranej w historii do ${DO ? 'k' + DO : 'limitu'}) ===`);
  console.log('  GRA teraz:');
  for (const x of sort(gra).slice(0, TOP)) console.log(`    ${x.nazwa} | k${x.k} ${x.stawka} zł Nr ${x.nr} | wygrana k${x.k}→k${x.LL} w historii: ${x.w}/${x.r} (${Math.round(100 * x.h)}%) · realnie ${Math.round(100 * x.real)}% | gier ${x.g}, LOST ${x.b}`);
  console.log('  CZEKA na start (k1 po pustej trójce / stronie; szczegóły i Nr startu: model.py):');
  for (const x of sort(czeka).slice(0, TOP)) console.log(`    ${x.nazwa} | czeka na pustą trójkę/stronę, najbliższy wiersz modelu Nr ${x.nr} | wygrana k1→k${x.LL} w historii: ${x.w}/${x.r} (${Math.round(100 * x.h)}%) · realnie ${Math.round(100 * x.real)}% | gier ${x.g}, LOST ${x.b}`);
}
if (f50) {
  const E = silnik('silnik.js'), C = kody(f50, 't50'), B = E.buildBook(C.length), H = E.przygotuj(C, B), lista = [], p = C.filter(c => c[1] === '1').length / C.length;
  for (let a = 1; a <= 28; a++) for (let b = a + 1; b <= 28; b++) for (let d = b + 1; d <= 28; d++) for (const war of ['', 'boki']) for (const limit of [9, 10]) {
    const def = { w: [a, b, d], poz: 1, czekaj: 1, war, limit }; lista.push({ def, s: E.szybkiModel(H, E.modDef(def)).s });
  }
  wypisz('ZESZYT T50', E, C, B, lista, () => p);
}
if (f60) {
  const E = silnik('silnik60.js'), C = kody(f60, 't60'), B = E.buildBook(C.length), lista = [], pc = { x1x: C.filter(c => c[1] === '1').length / C.length, xx1: C.filter(c => c[2] === '1').length / C.length };
  for (const cel of ['x1x', 'xx1']) for (let a = 1; a <= 30; a++) for (let b = a + 1; b <= 30; b++) for (const w of [[a, b], ...Array.from({ length: 30 - b }, (_, i) => [a, b, b + 1 + i])]) for (const limit of [9, 10]) {
    const def = { w, cel: [cel], cz: 1, limit }, M = E.liczModel(C, B, E.modDef(def)); lista.push({ def, s: M.gry.map(g => g.s) });
  }
  wypisz('ZESZYT T60', E, C, B, lista, d => pc[d.cel[0]]);
}
