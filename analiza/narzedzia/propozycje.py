"""Propozycje modeli z całych pul (jak ekran GRA w SZUKAJ / SZUKAJ+ / SZUKAJ LOST): modele w kryteriach aplikacji
(min. cykli, max LOST wg przedziałów z puli), teraz na krokach --kroki, ułożone wg zamknięcia w historii od obecnego kroku
(min. --min przypadków), potem realna szansa. Dla najlepszych: najbliższy zakład. ZESZYT T50 / T60: zeszyt_skan.js.
Wymaga numba (pip install numba numpy).
Użycie: python3 propozycje.py --t50 T50.json --t60 T60.json [--kroki 2-4] [--top 6] [--po-lost] [--bez-zeszytu]"""
import argparse, json, os, subprocess, sys
import numpy as np
from numba import njit, prange
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S

TU = os.path.dirname(os.path.abspath(__file__))


def tabela_pred(pred, alph):
    parts = pred.split(' → ')
    t = np.zeros((3, len(alph)), np.uint8)
    for j, p in enumerate(parts):
        t[j] = [S._m1(p, c) for c in alph]
    return t, len(parts)


@njit(cache=True)
def _hit(tab, L, X, i):
    if i < L - 1:
        return False
    for j in range(L):
        if tab[j, X[i - L + 1 + j]] == 0:
            return False
    return True


@njit(cache=True)
def _sim(stab, sL, ttab, tL, x, off, s2tab, s2L, use2, tn, X, y, N, out):
    """out[0..8] = cykle zamknięte WIN na k1..k8 / LOST (8); out[9] = bs teraz; out[10] = faza (0 STEP?, 1 STEP był, 2 zakład ustawiony);
    out[11] = ostatni cykl LOST (1/0)"""
    st = 0; cnt = 0; tc = 0; bs = 0; i = 0; ph = 0; last = 0
    while i < N:
        if st == 0:
            if _hit(stab, sL, X, i):
                cnt += 1
                if cnt >= x:
                    st = 1 if use2 else 2
            else:
                cnt = 0
            i += 1
        elif st == 1:
            if _hit(s2tab, s2L, X, i):
                st = 2
            i += 1
        elif _hit(ttab, tL, X, i):
            tc += 1
            if tc < tn:
                i += 1
                continue
            bp = i + off
            if bp >= N:
                ph = 2
                break
            if y[X[bp]]:
                out[bs] += 1; bs = 0; last = 0
            elif bs == 7:
                out[8] += 1; bs = 0; last = 1
            else:
                bs += 1
            st = 0; cnt = 0; tc = 0; i = bp + 1
        else:
            i += 1
    if ph == 0 and st >= 1:
        ph = 1
    out[9] = bs; out[10] = ph; out[11] = last


@njit(parallel=True, cache=True)
def _run(A, AL, B, BL, C, CL, U2, XS, OFF, TN, X, y, N, OUT):
    for k in prange(A.shape[0]):
        _sim(A[k], AL[k], B[k], BL[k], XS[k], OFF[k], C[k], CL[k], U2[k], TN[k], X, y, N, OUT[k])


def skan(pool, codes, tabela, cel):
    alph = S.ALPH[tabela]; idx = {c: i for i, c in enumerate(alph)}
    X = np.array([idx[c] for c in codes], np.int64); y = np.array([c[S.TPOS[cel]] == '1' for c in alph], np.bool_)
    n = len(pool); A = np.zeros((n, 3, len(alph)), np.uint8); B = A.copy(); C = A.copy()
    AL = np.zeros(n, np.int64); BL = AL.copy(); CL = AL.copy(); XS = AL.copy(); OFF = AL.copy(); TN = AL.copy(); U2 = np.zeros(n, np.bool_)
    for k, m in enumerate(pool):
        A[k], AL[k] = tabela_pred(m[1], alph); B[k], BL[k] = tabela_pred(m[3], alph)
        s2 = m[6] if len(m) > 6 else ''
        C[k], CL[k] = tabela_pred(s2 or 'xxx', alph); U2[k] = bool(s2); XS[k] = m[2]; OFF[k] = m[4]; TN[k] = m[5] if len(m) > 5 else 1
    OUT = np.zeros((n, 12), np.int64); _run(A, AL, B, BL, C, CL, U2, XS, OFF, TN, X, y, len(X), OUT)
    return OUT


def limit_lost(cyk, rules):
    for mc, mb in rules:
        if mc is None or cyk <= mc:
            return mb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--t50'); ap.add_argument('--t60'); ap.add_argument('--kroki', default='2-4'); ap.add_argument('--top', type=int, default=6)
    ap.add_argument('--min', type=int, default=20); ap.add_argument('--po-lost', action='store_true'); ap.add_argument('--bez-zeszytu', action='store_true')
    a = ap.parse_args()
    k0, k1 = map(int, a.kroki.split('-'))
    for tabela, plik, cele in (('t50', a.t50, ['x1x']), ('t60', a.t60, ['x1x', 'xx1'])):
        if not plik:
            continue
        X = S.kody(plik); p = {c: sum(x[S.TPOS[c]] == '1' for x in X) / len(X) for c in cele}; kand = []
        for app in ('S', 'S+', 'L'):
            for cel in cele:
                path = os.path.join(S.katalog(), (S.REPO[app] + ('' if '{}' in S.REPO[app] else '{}')).format(tabela[1:]), 'szukaj', f'pool_{tabela}_{cel}.json')
                P = json.load(open(path)); O = skan(P['pool'], X, tabela, cel)
                for i, o in enumerate(O):
                    cyk = int(o[:9].sum()); lost = int(o[8]); k = int(o[9]) + 1
                    lim = limit_lost(cyk, P['rules'])
                    if cyk < P['minCyc'] or lim is None or lost > lim or not (k0 <= k <= k1) or (a.po_lost and not o[11]):
                        continue
                    reach = int(o[k - 1:9].sum()); w = int(o[k - 1:8].sum())
                    if reach < a.min:
                        continue
                    kand.append((w / reach, 1 - (1 - p[cel]) ** (9 - k), reach, app, i + 1, cel, k, w, int(o[10]), bool(o[11]), cyk, lost,
                                 json.dumps([cel] + list(P['pool'][i][1:5]) + [P['pool'][i][5] if len(P['pool'][i]) > 5 else 1,
                                                                             P['pool'][i][6] if len(P['pool'][i]) > 6 else ''])))
        kand.sort(key=lambda r: (-r[0], -r[1], -r[2], ['S+', 'S', 'L'].index(r[3])))
        seen = set(); kand = [r for r in kand if not (r[-1] in seen or seen.add(r[-1]))]   # ten sam model w SZUKAJ i SZUKAJ+ — raz
        print(f"\n=== MOJE {tabela.upper()} — propozycje z pul (kody do Nr {len(X)}, kroki k{k0}–k{k1}{', po LOST' if a.po_lost else ''}; w kryteriach: {len(kand)}) ===")
        for hist, real, reach, app, nr, cel, k, w, ph, pl, cyk, lost, _ in kand[:a.top]:
            r = S.analiza(S.model(app, tabela, cel, nr), X, tabela, cel, mc=200)
            print(f"  {app} P{nr} {cel} | k{k} {S.ST[k - 1]} zł | od k{k}: {w}/{reach} ({100 * hist:.0f}%) · realnie {100 * real:.0f}% | cykli {cyk}, LOST {lost}"
                  f"{' | PO LOST' if pl else ''} | {r.get('zaklad', '')}")
    if not a.bez_zeszytu and (a.t50 or a.t60):
        subprocess.run(['node', os.path.join(TU, 'zeszyt_skan.js'), a.t50 or '', a.t60 or '', str(a.top), str(a.min)], check=False)


if __name__ == '__main__':
    main()
