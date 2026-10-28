// ZESZYT T50 / T60 — stan modeli z MODELE.json liczony silnikami ZESZYTU (repo zeszyt: silnik.js, silnik60.js), 1:1 z aplikacją.
// Użycie: node zeszyt.js MODELE.json kody_t50.json kody_t60.json   (eksporty z RAZEM; brak pliku = grupa pominięta)
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = process.env.PX5060 || path.join(__dirname, '..', '..', '..', 'px5060');
const silnik = f => vm.runInNewContext(fs.readFileSync(path.join(D, 'zeszyt', f), 'utf8') + '\n;({buildBook, liczModel, modNum, modDef, STAWKI, partsOf});', {});
const kody = f => { const s = fs.readFileSync(f, 'utf8'); if (s.trim()[0] === '{') return JSON.parse(s).codes; const d = s.replace(/\D/g, ''); return d.match(/.{3}/g); };
const [, , fModele, f50, f60] = process.argv;
const MODELE = JSON.parse(fs.readFileSync(fModele, 'utf8'));
const CEL = { '2/3xx': ['2', '3'], '1xx': ['1'], x1x: ['x1x'], xx1: ['xx1'] };

function raport(E, C, def, czestosc) {
  const n = C.length, B = E.buildBook(n), BB = E.buildBook(n + 400), M = E.liczModel(C, B, E.modDef(def)), N = E.modNum(M), t = M.teraz, L = M.limit;
  const nrOf = g => BB.cards[g.k].parts[g.p][g.r - 1].nr;
  const k = t.gra ? t.s : 1, gry = M.gry.map(g => g.s);
  const reach = gry.filter(s => s >= k), h = Math.floor(gry.length / 2), win = a => a.filter(s => s <= L).length;
  const poLost = []; gry.forEach((s, i) => { if (s > L && i + 1 < gry.length) poLost.push(gry[i + 1] > L ? 'L' : 'W' + gry[i + 1]); });
  // kolejne kroki: połowy (T50) / strony (T60) z wierszami modelu
  const mx = Math.max(...def.w), units = [];
  BB.cards.forEach((cd, kk) => cd.parts.forEach((rows, p) => { if (E.partsOf(kk)[p] >= mx) units.push({ kk, p, rows }); }));
  let ui = units.findIndex(u => u.kk === t.k && u.p === t.p);
  const w = [...def.w].sort((a, b) => a - b), warunek = w.filter(r => units[ui].rows[r - 1].nr > n).map(r => units[ui].rows[r - 1].nr);
  const plan = []; let s = k, on = false;
  if (!t.gra) ui++;
  while (s <= L && units[ui]) { for (const r of w) { if (t.gra && !on && r !== t.r) continue; on = true; plan.push(`k${s} ${E.STAWKI[s - 1]} zł Nr ${units[ui].rows[r - 1].nr}`); if (++s > L) break; } ui++; }
  const left = L - k + 1, real = left > 0 ? 1 - (1 - czestosc) ** left : 0;
  return {
    nazwa: M.nazwa, gier: N.G.length, lost: N.bust, max: N.max, lostNr: M.gry.filter(g => g.s > L).map(nrOf).slice(-3),
    teraz: t.gra ? (k > L ? `LOST w toku (krok ${k} za limitem k${L}) — gra skończy się na trafieniu, potem nowy cykl` : `GRA k${k} ${E.STAWKI[k - 1]} zł Nr ${t.nr}`)
      : `CZEKA — start od k1, jeśli na Nr ${warunek.join(', ') || '(ta połowa/strona już z trafieniem → następna)'} nie będzie trafienia`,
    od_kroku: `${win(reach)}/${reach.length}`, polowy: `${win(gry.slice(0, h).filter(x => x >= k))}/${gry.slice(0, h).filter(x => x >= k).length} · ${win(gry.slice(h).filter(x => x >= k))}/${gry.slice(h).filter(x => x >= k).length}`,
    po_lost: poLost.join(' '), realnie: `${Math.round(real * 100)}%`,
    do_limitu: E.STAWKI.slice(k - 1, L).reduce((a, b) => a + b, 0), plan: plan.length > 5 ? [...plan.slice(0, 4), '…', plan[plan.length - 1]] : plan,
  };
}
for (const [grupa, f, plik] of [['ZESZYT T50', 'silnik.js', f50], ['ZESZYT T60', 'silnik60.js', f60]]) {
  if (!plik || !MODELE[grupa]) continue;
  const E = silnik(f), C = kody(plik);
  console.log(`\n=== ${grupa} (kody do Nr ${C.length}) ===`);
  for (const m of MODELE[grupa]) {
    const def = grupa === 'ZESZYT T50' ? { w: m.w, poz: m.poz ?? 1, czekaj: m.czekaj ?? 1, war: m.war || '', limit: m.limit || 9 }
      : { w: m.w, cel: CEL[m.cel], cz: m.czekaj ?? 1, limit: m.limit || 9 };
    const poz = grupa === 'ZESZYT T50' ? def.poz : null;
    const cz = C.filter(c => grupa === 'ZESZYT T50' ? c[poz] === '1' : (c[0] !== '0' && def.cel.includes(c[0])) || (c[1] === '1' && def.cel.includes('x1x')) || (c[2] === '1' && def.cel.includes('xx1'))).length / C.length;
    const r = raport(E, C, def, cz);
    console.log(`${m.wybor ? '★ ' : '  '}${r.nazwa} | ${r.teraz} | historia od tego kroku ${r.od_kroku} (połowy ${r.polowy}) · realnie ${r.realnie} | gier ${r.gier}, LOST ${r.lost}${r.lostNr.length ? ' (Nr ' + r.lostNr.join(', ') + ')' : ''} | po LOST: ${r.po_lost || '—'} | do limitu ${r.do_limitu} zł${m.uwaga ? ' | ' + m.uwaga : ''}`);
    console.log(`      ${r.plan.join(' → ')}`);
  }
}
