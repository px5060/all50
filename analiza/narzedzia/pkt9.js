// Ocena „pkt z 9” z aplikacji SZUKAJ / SZUKAJ+ / SZUKAJ LOST — kod OC wycięty z szukaj_template.html aplikacji (1:1, bez kopii w repo).
// Użycie: node pkt9.js <repo aplikacji, np. szukaj60plus> < cykle.json   ({"N": liczba kodów, "cyc": [[krok WIN 1–8 albo 9 = LOST, wiersz zakładu], …]})
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = process.env.PX5060 || path.join(__dirname, '..', '..', '..', 'px5060');
const src = fs.readFileSync(path.join(D, process.argv[2], 'szukaj', 'szukaj_template.html'), 'utf8');
const a = src.indexOf('const OC = (() => {'), b = src.indexOf('})();', a) + 5;
if (a < 0) throw new Error('brak OC w szukaj_template.html');
const OC = vm.runInNewContext(src.slice(a, b) + '\n;OC', {});
const d = JSON.parse(fs.readFileSync(0, 'utf8')), r = OC.model(d.cyc, d.N), bk = w => { const x = OC.bank(d.cyc, d.N, w); return x && x.score; };   // + BANK +3 / +5 (jak w statystykach)
console.log(JSON.stringify(r && { score: r.score, v: r.v, pts: r.pts, okresy: r.okresy, k7: r.k7, B: r.B, bootMed: r.bootMed, bootP: r.bootP, b3: bk(3), b5: bk(5) }));
