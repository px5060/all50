"""Kalibracja oceny modeli: ile historia modelu („wygrana do k8 od obecnego kroku”) przewiduje naprawdę — na kodach, których
wybór nie znał (prośba użytkownika: bardziej zaawansowana ocena). Wynik: kalibracja.json (n0 — siła „ściągania” historii do zwykłej
częstości; tabela: historia → co było potem) — używa go ocena.py.
  SZUKAJ / S+ / LOST: pula policzona do Nr T0 (seedN puli), wynik bieżącego cyklu każdego modelu na kodach po T0.
  ZESZYT T50 / T60: wszystkie układy (bez wyboru z góry), kilka punktów T0 (kalibracja_zeszyt.js), wynik gry w toku / następnej.
Użycie:  python3 kalibracja.py --stan ../px5060/kody/stan.json --pule KATALOG_ZE_STARYMI_PULAMI [--zeszyt wynik_js.jsonl] [--zapisz]
         (KATALOG: pliki <repo>_pool_<t>_<cel>.json — pule sprzed odświeżenia; nowsze pule: z historii repo SZUKAJ)"""
import argparse, glob, json, os, sys
import numpy as np
from numba import njit, prange
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S
from propozycje import tabela_pred, _hit, limit_lost

TU = os.path.dirname(os.path.abspath(__file__))


@njit(cache=True)
def _sim_t0(stab, sL, ttab, tL, x, off, s2tab, s2L, use2, tn, X, y, N, T0, out):
    """out[0..8] = cykle zamknięte przed T0 (WIN k1..k8, LOST); out[9] = krok w T0; out[10] / out[11] = zakłady / trafienia po T0
    (każdy zakład osobno — bez obcinania cykli, które nie zdążyły się skończyć przed końcem danych)"""
    st = 0; cnt = 0; tc = 0; bs = 0; i = 0; rec = False
    while i < N:
        if not rec and i >= T0:
            rec = True; out[9] = bs + 1
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
                break
            if not rec and bp >= T0:
                rec = True; out[9] = bs + 1
            win = y[X[bp]]
            if rec:
                out[10] += 1
                if win:
                    out[11] += 1
            else:
                if win:
                    out[bs] += 1
                elif bs == 7:
                    out[8] += 1
            if win or bs == 7:
                bs = 0
            else:
                bs += 1
            st = 0; cnt = 0; tc = 0; i = bp + 1
        else:
            i += 1


@njit(parallel=True, cache=True)
def _run_t0(A, AL, B, BL, C, CL, U2, XS, OFF, TN, X, y, N, T0, OUT):
    for k in prange(A.shape[0]):
        _sim_t0(A[k], AL[k], B[k], BL[k], XS[k], OFF[k], C[k], CL[k], U2[k], TN[k], X, y, N, T0, OUT[k])


def skan_t0(pool, codes, tabela, cel, T0):
    alph = S.ALPH[tabela]; idx = {c: i for i, c in enumerate(alph)}
    X = np.array([idx[c] for c in codes], np.int64); y = np.array([c[S.TPOS[cel]] == '1' for c in alph], np.bool_)
    n = len(pool); A = np.zeros((n, 3, len(alph)), np.uint8); B = A.copy(); C = A.copy()
    AL = np.zeros(n, np.int64); BL = AL.copy(); CL = AL.copy(); XS = AL.copy(); OFF = AL.copy(); TN = AL.copy(); U2 = np.zeros(n, np.bool_)
    for k, m in enumerate(pool):
        A[k], AL[k] = tabela_pred(m[1], alph); B[k], BL[k] = tabela_pred(m[3], alph)
        s2 = m[6] if len(m) > 6 else ''
        C[k], CL[k] = tabela_pred(s2 or 'xxx', alph); U2[k] = bool(s2); XS[k] = m[2]; OFF[k] = m[4]; TN[k] = m[5] if len(m) > 5 else 1
    OUT = np.zeros((n, 12), np.int64); _run_t0(A, AL, B, BL, C, CL, U2, XS, OFF, TN, X, y, len(X), T0, OUT)
    return OUT


def rekordy_szukaj(katalog, stan):
    """→ rekordy {w, r, w3, k, hh, bh, nh, nb, ph, po, g}: kryterium użytkownika w T0 (wygrana do k8 / w 3 krokach od kroku k),
    trafienia / zakłady w historii (hh / bh, częstość celu ph) i po T0 (nh / nb, częstość celu po)"""
    R = []
    for f in sorted(glob.glob(os.path.join(katalog, '*_pool_t*_*.json'))):
        b = os.path.basename(f); repo, rest = b.split('_pool_'); tabela, cel = rest[:-5].split('_')
        P = json.load(open(f)); X = S.kody(stan, tabela); T0 = P['seedN']
        if len(X) - T0 < 50:
            continue
        tp = S.TPOS[cel]; ph = sum(c[tp] == '1' for c in X[:T0]) / T0; po = sum(c[tp] == '1' for c in X[T0:]) / (len(X) - T0)
        O = skan_t0(P['pool'], X, tabela, cel, T0); lost_app = 'bust' in repo; n0r = len(R)
        for o in O:
            cyk = int(o[:9].sum()); lost = int(o[8]); lim = limit_lost(cyk, P['rules']); k = int(o[9])
            if k < 1 or o[10] == 0 or cyk < P['minCyc'] or lim is None or lost > lim or (lost_app and lost < P.get('minBust', 0)):
                continue
            hh = int(o[:8].sum()); bh = int(sum((s + 1) * o[s] for s in range(8)) + 8 * o[8])
            R.append({'w': int(o[k - 1:8].sum()), 'r': int(o[k - 1:9].sum()), 'w3': int(o[k - 1:min(k + 2, 8)].sum()), 'k': k, 'L': 8,
                      'hh': hh, 'bh': bh, 'nh': int(o[11]), 'nb': int(o[10]), 'ph': ph, 'po': po, 'g': f'{repo} {cel}'})
        print(f'  {repo} {tabela} {cel}: T0 = Nr {T0}, po T0 {len(X) - T0} kodów (cel {po:.1%}, wcześniej {ph:.1%}), modeli: {len(R) - n0r}', flush=True)
    return R


def dopasuj(R):
    """n0: trafialność zakładu modelu ≈ (hh + n0·ph) / (bh + n0) (historia ściągana do zwykłej częstości). Po T0 porównuję względnie
    (okres po T0 może mieć inną częstość celu — wspólną dla wszystkich modeli): oczekiwane po = po · szac / ph. Wybór n0 = max wiarygodność."""
    hh = np.array([x['hh'] for x in R], float); bh = np.array([x['bh'] for x in R], float); ph = np.array([x['ph'] for x in R]); po = np.array([x['po'] for x in R])
    nh = np.array([x['nh'] for x in R], float); nb = np.array([x['nb'] for x in R], float)
    wyn = []
    for n0 in [0, 10, 30, 100, 300, 1000, 3000, 10000, 30000, 1e5, 1e6, 1e9]:
        q = np.clip(po * ((hh + n0 * ph) / (bh + n0)) / ph, 1e-6, 1 - 1e-6)
        wyn.append((float(np.sum(nh * np.log(q) + (nb - nh) * np.log(1 - q))), n0))
    return max(wyn)[1], wyn


def tabela_grup(R):
    """kryterium użytkownika (wygrana do k8 od obecnego kroku, ≥ 20 przypadków) → trafialność zakładów po T0 względem zwykłej w tym okresie"""
    out = []
    for lab, lo, hi in [('100%', 1.0, 1.01), ('95–99%', 0.95, 1.0), ('90–95%', 0.90, 0.95), ('80–90%', 0.80, 0.90), ('< 80%', 0, 0.80)]:
        G = [x for x in R if x['r'] >= 20 and lo <= x['w'] / x['r'] < hi]
        if not G:
            continue
        nb = sum(x['nb'] for x in G); nh = sum(x['nh'] for x in G); po = sum(x['po'] * x['nb'] for x in G) / nb
        rel = (nh / nb) / po
        out.append({'historia': lab, 'modeli': len(G), 'zakladow_po': nb, 'trafialnosc_po': round(nh / nb, 4), 'zwykla_po': round(po, 4), 'wzgledem_zwyklej': round(rel, 3)})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stan', required=True); ap.add_argument('--pule'); ap.add_argument('--zeszyt'); ap.add_argument('--zapisz', action='store_true')
    a = ap.parse_args()
    wynik = {'opis': 'Kalibracja oceny (kalibracja.py): czy historia modelu przewiduje trafialność jego zakładów na kodach, których wybór nie znał. '
                     'Trafialność zakładu ≈ (trafienia + n0·zwykła) / (zakłady + n0); wygrana do k8 od kroku k ≈ 1 − (1 − szac)^(9 − k).'}
    for nazwa, R in (('SZUKAJ', rekordy_szukaj(a.pule, a.stan) if a.pule else []),
                     ('ZESZYT', [json.loads(l) for l in open(a.zeszyt)] if a.zeszyt else [])):
        if not R:
            continue
        n0, _ = dopasuj(R); G = tabela_grup(R); nb = sum(x['nb'] for x in R); nh = sum(x['nh'] for x in R); po = sum(x['po'] * x['nb'] for x in R) / nb
        wynik[nazwa] = {'modeli': len(R), 'zakladow_po': nb, 'n0': n0, 'trafialnosc_po': round(nh / nb, 4), 'zwykla_po': round(po, 4), 'grupy': G}
        print(f'\n=== {nazwa}: {len(R)} modeli, {nb} zakładów po T0 · n0 = {n0:g} ===')
        print(f'  wszystkie: trafialność zakładu po T0 {nh / nb:.1%}, zwykła w tym okresie {po:.1%} (× {nh / nb / po:.3f})')
        for g in G:
            print(f"  historia do k8 / limitu {g['historia']:7} ({g['modeli']} modeli, {g['zakladow_po']} zakładów): trafialność po {g['trafialnosc_po']:.1%} · zwykła {g['zwykla_po']:.1%} · × {g['wzgledem_zwyklej']:.3f}")
    if a.zapisz:
        p = os.path.join(TU, '..', 'kalibracja.json'); json.dump(wynik, open(p, 'w'), ensure_ascii=False, indent=1); print('\nzapisano', os.path.normpath(p))


if __name__ == '__main__':
    main()
