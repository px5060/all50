// Kalibracja ZESZYTU do kalibracja.py: wszystkie układy (bez wyboru z góry — uczciwe cofnięcie w czasie), punkty T (część kodów).
// Dla każdego modelu w kryteriach w T (≥ 100 gier w proporcji do długości historii, ≤ 2 LOST): kryterium użytkownika w T (wygrana do limitu / w 3 krokach od kroku w T),
// trafienia / zakłady w historii przed T i po T (każdy wiersz modelu = zakład; gry zaczęte po T, do końca danych).
// Użycie: node kalibracja_zeszyt.js stan.json [punkty, np. 0.5,0.75] [T60: co który model, np. 3] > zeszyt.jsonl
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const D = process.env.PX5060 || path.join(__dirname, '..', '..', '..', 'px5060');
const silnik = f => vm.runInNewContext(fs.readFileSync(path.join(D, 'zeszyt', f), 'utf8') + '\n;({buildBook, liczModel, modDef, przygotuj: typeof przygotuj === "function" ? przygotuj : null, szybkiModel: typeof szybkiModel === "function" ? szybkiModel : null});', {});
const [, , fStan, ptS, coS] = process.argv, PT = (ptS || '0.5,0.75').split(',').map(Number), CO = +coS || 3;
const st = JSON.parse(fs.readFileSync(fStan, 'utf8'));
const kody = t => { const c = st[t].kody.match(/.{3}/g); let P = {}; try { P = JSON.parse((st.storage || {})['zeszyt_v1_poprawki_' + t] || '{}') || {}; } catch (e) {}
  for (const nr in P) if (+nr >= 1 && +nr <= c.length && /^\d{3}$/.test(P[nr])) c[nr - 1] = P[nr]; return c; };
function rekord(sT, tT, sF, L, ph, po, g, fr) {   // sT: gry przed T, tT: krok gry w toku w T (0 = brak), sF: gry na całym ciągu; fr = T / N
  if (sT.length < Math.round(100 * fr) || sT.filter(x => x > L).length > 2) return null;   // „min. 100 gier” w proporcji do długości historii w T
  const k = tT || 1, reach = sT.filter(x => x >= k), od = sT.length + (tT ? 1 : 0), po_ = sF.slice(od);   // po T: gry zaczęte po T
  if (!po_.length || k > L) return null;
  return { w: reach.filter(x => x <= L).length, r: reach.length, w3: reach.filter(x => x <= Math.min(k + 2, L)).length, k, L,
    hh: sT.length, bh: sT.reduce((a, b) => a + b, 0), nh: po_.length, nb: po_.reduce((a, b) => a + b, 0), ph, po, g };
}
const out = [];
{ // T50: X+X (środek), po 1 pustej trójce, bez warunku i „+ z boku”, do k9 / k10 — jak SZUKAJ W ZESZYCIE
  const E = silnik('silnik.js'), C = kody('t50'), N = C.length, B = E.buildBook(N), HF = E.przygotuj(C, B);
  for (const pt of PT) {
    const T = Math.floor(N * pt), CT = C.slice(0, T), HT = E.przygotuj(CT, E.buildBook(T));
    const ph = CT.filter(c => c[1] === '1').length / T, po = C.slice(T).filter(c => c[1] === '1').length / (N - T);
    for (let a = 1; a <= 28; a++) for (let b = a + 1; b <= 28; b++) for (let d = b + 1; d <= 28; d++) for (const war of ['', 'boki']) for (const limit of [9, 10]) {
      const md = E.modDef({ w: [a, b, d], poz: 1, czekaj: 1, war, limit }), mT = E.szybkiModel(HT, md), mF = E.szybkiModel(HF, md);
      const r = rekord(mT.s, mT.teraz, mF.s, limit, ph, po, 'ZESZYT T50', T / N); if (r) out.push(r);
    }
    process.stderr.write(`T50 punkt ${pt} (Nr ${T}): rekordów ${out.length}\n`);
  }
}
{ // T60: x1x i xx1, 2–3 wiersze, po 1 pustej stronie, do k10 (co CO-ty układ — liczModel jest wolniejszy)
  const E = silnik('silnik60.js'), C = kody('t60'), N = C.length, B = E.buildBook(N); let n = 0; const n0 = out.length;
  const pt = PT[Math.floor(PT.length / 2)], T = Math.floor(N * pt), CT = C.slice(0, T), BT = E.buildBook(T);
  for (const cel of ['x1x', 'xx1']) {
    const pos = cel === 'x1x' ? 1 : 2, ph = CT.filter(c => c[pos] === '1').length / T, po = C.slice(T).filter(c => c[pos] === '1').length / (N - T);
    for (let a = 1; a <= 30; a++) for (let b = a + 1; b <= 30; b++) for (const w of [[a, b], ...Array.from({ length: 30 - b }, (_, i) => [a, b, b + 1 + i])]) {
      if (n++ % CO) continue;
      const md = E.modDef({ w, cel: [cel], cz: 1, limit: 10 }), mT = E.liczModel(CT, BT, md), mF = E.liczModel(C, B, md);
      const r = rekord(mT.gry.map(g => g.s), mT.teraz.gra ? mT.teraz.s : 0, mF.gry.map(g => g.s), 10, ph, po, 'ZESZYT T60 ' + cel, T / N); if (r) out.push(r);
    }
  }
  process.stderr.write(`T60 punkt ${pt} (Nr ${T}): rekordów ${out.length - n0}\n`);
}
for (const r of out) console.log(JSON.stringify(r));
