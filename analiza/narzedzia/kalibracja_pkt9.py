"""Kalibracja skali „pkt z 9” z SZUKAJ (prośba użytkownika: czy skala przewiduje). Stare pule (seedN = T0, jak kalibracja.py): skala liczona
kodem aplikacji przeniesionym 1:1 do numba (--sprawdz: porównanie z pkt9.js) tylko na kodach < T0, potem każdy zakład po T0 (trafił / nie)
względem modeli tej samej tabeli i celu na tych samych wierszach; przedział 90% — losowanie wierszy (zakłady wielu modeli na jednym meczu
nie są niezależne). Wynik: sekcja SKALA9 w kalibracja.json (ocena.py pokazuje ją przy skali 9 pkt).
Użycie: python3 kalibracja_pkt9.py --stan ../px5060/kody/stan.json --pule KATALOG_ZE_STARYMI_PULAMI [--sprawdz] [--zapisz]
        (KATALOG: pliki <repo>_pool_<t>_<cel>.json — pule sprzed odświeżenia, jak w kalibracja.py)"""
import argparse, glob, json, math, os, random, subprocess, sys
import numpy as np
from numba import njit, prange
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S
from propozycje import tabela_pred, _hit, limit_lost

TU = os.path.dirname(os.path.abspath(__file__))
# ===== skala 9 pkt: OC.model z szukaj_template.html przeniesiony 1:1 (bez permutacji — nie daje punktów); rng = mulberry32 (seed 42) =====
M = np.uint64(0xFFFFFFFF)
MST = np.array(S.ST, np.int64); CU = np.concatenate(([0], np.cumsum(MST))); WIN = np.concatenate(([0], MST * 3 - CU[1:]))   # zysk cyklu wygranego na kroku k


@njit(cache=True)
def rnd(st):
    st = (st + np.uint64(0x6D2B79F5)) & M
    t = ((st ^ (st >> np.uint64(15))) * (st | np.uint64(1))) & M
    t = (t ^ ((t + (((t ^ (t >> np.uint64(7))) * (t | np.uint64(61))) & M)) & M)) & M
    return st, float((t ^ (t >> np.uint64(14))) & M) / 4294967296.0


@njit(cache=True)
def prog(o, b, n, Kl, lo, hi, WIN, CU):
    bs = 0; W = 0; B = 0; p = 0
    for j in range(n):
        if b[j] < lo or b[j] >= hi: continue
        if o[j]:
            p += WIN[bs + 1]; W += 1; bs = 0
        else:
            bs += 1
            if bs == Kl:
                p -= CU[Kl]; B += 1; bs = 0
    return W, B, p


@njit(cache=True)
def score9(o, b, n, N, WIN, CU):
    if n < 20: return -1, 0.0, 0.0, 0
    BIG = 1 << 40
    okr = 0
    for s in range(5):
        if prog(o, b, n, 8, (s * N) // 5, ((s + 1) * N) // 5, WIN, CU)[2] > 0: okr += 1
    cut = int(N * 0.6)
    _, Bo, Po = prog(o, b, n, 8, cut, BIG, WIN, CU)
    k7 = prog(o, b, n, 7, -1, BIG, WIN, CU)[1]; B8 = prog(o, b, n, 8, -1, BIG, WIN, CU)[1]
    IT = 5000; bb = np.empty(IT); neg = 0; st = np.uint64(42)
    for it in range(IT):
        bs = 0; v = 0
        for j in range(n):
            st, r = rnd(st); x = o[int(math.floor(r * n))]
            if x:
                v += WIN[bs + 1]; bs = 0
            else:
                bs += 1
                if bs == 8:
                    v -= CU[8]; bs = 0
        bb[it] = v
        if v <= 0: neg += 1
    med = np.median(bb); bp = neg / IT
    sc = (2 if med > 0 else 0) + (1 if bp < 0.35 else 0) + (2 if okr == 5 else 1 if okr == 4 else 0) + (2 if k7 <= 3 else 1 if k7 <= 5 else 0) \
        + (1 if Bo == 0 and Po > 0 else 0) + (1 if B8 == 0 else 0)
    return sc, med, bp, k7


@njit(cache=True)
def sim(stab, sL, ttab, tL, x, off, s2tab, s2L, use2, tn, X, y, N, T0, WIN, CU, ST, out, rows):
    """out: 0..8 cykle przed T0 (WIN k1..k8, LOST), 9 krok w T0, 10 zakłady po, 11 trafienia po, 12 zysk po (zł), 13 LOST po, 14 pkt9, 15 boot med, 16 boot P"""
    maxb = T0 + 10
    o = np.zeros(maxb, np.uint8); b = np.zeros(maxb, np.int64); n = 0; cs = 0   # zakłady zamkniętych cykli przed T0 (b = wiersz rozliczenia cyklu)
    st = 0; cnt = 0; tc = 0; bs = 0; i = 0; rec = False; nr = 0
    while i < N:
        if not rec and i >= T0:
            rec = True; out[9] = bs + 1
        if st == 0:
            if _hit(stab, sL, X, i):
                cnt += 1
                if cnt >= x: st = 1 if use2 else 2
            else: cnt = 0
            i += 1
        elif st == 1:
            if _hit(s2tab, s2L, X, i): st = 2
            i += 1
        elif _hit(ttab, tL, X, i):
            tc += 1
            if tc < tn:
                i += 1; continue
            bp = i + off
            if bp >= N: break
            if not rec and bp >= T0:
                rec = True; out[9] = bs + 1
            win = y[X[bp]]
            if rec:
                out[10] += 1; rows[nr] = bp - T0; nr += 1
                if win:
                    out[11] += 1; out[12] += 2 * ST[bs]
                else:
                    out[12] -= ST[bs]
                    if bs == 7: out[13] += 1
            else:
                o[n] = 1 if win else 0; n += 1
                if win:
                    out[bs] += 1
                elif bs == 7:
                    out[8] += 1
                if win or bs == 7:
                    for j in range(cs, n): b[j] = bp
                    cs = n
            if win or bs == 7: bs = 0
            else: bs += 1
            st = 0; cnt = 0; tc = 0; i = bp + 1
        else:
            i += 1
    sc, med, bpr, k7 = score9(o, b, cs, T0, WIN, CU)   # tylko zamknięte cykle, N = T0 (jak appka przy T0)
    out[14] = sc; out[15] = int(med); out[16] = int(bpr * 10000)


@njit(parallel=True, cache=True)
def run(A, AL, B, BL, C, CL, U2, XS, OFF, TN, X, y, N, T0, WIN, CU, ST, OUT, ROWS):
    for k in prange(A.shape[0]):
        sim(A[k], AL[k], B[k], BL[k], XS[k], OFF[k], C[k], CL[k], U2[k], TN[k], X, y, N, T0, WIN, CU, ST, OUT[k], ROWS[k])


def skan(pool, codes, tabela, cel, T0):
    alph = S.ALPH[tabela]; idx = {c: i for i, c in enumerate(alph)}
    X = np.array([idx[c] for c in codes], np.int64); y = np.array([c[S.TPOS[cel]] == '1' for c in alph], np.bool_)
    n = len(pool); A = np.zeros((n, 3, len(alph)), np.uint8); B = A.copy(); C = A.copy()
    AL = np.zeros(n, np.int64); BL = AL.copy(); CL = AL.copy(); XS = AL.copy(); OFF = AL.copy(); TN = AL.copy(); U2 = np.zeros(n, np.bool_)
    for k, m in enumerate(pool):
        A[k], AL[k] = tabela_pred(m[1], alph); B[k], BL[k] = tabela_pred(m[3], alph)
        s2 = m[6] if len(m) > 6 else ''
        C[k], CL[k] = tabela_pred(s2 or 'xxx', alph); U2[k] = bool(s2); XS[k] = m[2]; OFF[k] = m[4]; TN[k] = m[5] if len(m) > 5 else 1
    OUT = np.zeros((n, 17), np.int64); ROWS = np.full((n, len(X) - T0 + 5), -1, np.int64)
    run(A, AL, B, BL, C, CL, U2, XS, OFF, TN, X, y, len(X), T0, WIN, CU, np.array(S.ST, np.int64), OUT, ROWS)
    return OUT, ROWS, X, y


def rekordy(katalog, stan):
    """→ rekordy modeli w kryteriach puli przy T0: pkt (skala przy T0), kryterium użytkownika (w, r, w3, k), zakłady po T0 (wiersze),
    zysk po T0; + trafienia wierszy po T0 dla każdej tabeli i celu"""
    R, HIT, OKR = [], {}, {}
    for f in sorted(glob.glob(os.path.join(katalog, '*_pool_t*_*.json'))):
        repo, rest = os.path.basename(f).split('_pool_'); tabela, cel = rest[:-5].split('_')
        P = json.load(open(f)); codes = S.kody(stan, tabela); T0 = P['seedN']; tp = S.TPOS[cel]
        if len(codes) - T0 < 50:
            continue
        ph = sum(c[tp] == '1' for c in codes[:T0]) / T0; po = sum(c[tp] == '1' for c in codes[T0:]) / (len(codes) - T0)
        OUT, ROWS, X, y = skan(P['pool'], codes, tabela, cel, T0); lost_app = 'bust' in repo; n0 = len(R)
        HIT[(tabela, cel)] = np.array([float(y[X[i]]) for i in range(T0, len(codes))]); OKR[f'{tabela} {cel}'] = {'T0': T0, 'kodow_po': len(codes) - T0, 'cel_po': round(po, 4), 'cel_przed': round(ph, 4)}
        for o, rw in zip(OUT, ROWS):
            cyk = int(o[:9].sum()); lost = int(o[8]); lim = limit_lost(cyk, P['rules']); k = int(o[9])
            if k < 1 or o[10] == 0 or cyk < P['minCyc'] or lim is None or lost > lim or (lost_app and lost < P.get('minBust', 0)):
                continue
            R.append({'t': tabela, 'cel': cel, 'k': k, 'w': int(o[k - 1:8].sum()), 'r': int(o[k - 1:9].sum()), 'w3': int(o[k - 1:min(k + 2, 8)].sum()),
                      'q3': 1 - (1 - ph) ** max(0, min(3, 9 - k)), 'nb': int(o[10]), 'zysk': int(o[12]), 'pkt': int(o[14]), 'rows': rw[rw >= 0]})
        print(f'  {repo} {tabela} {cel}: T0 = Nr {T0}, po T0 {len(codes) - T0} kodów (cel {po:.1%}, wcześniej {ph:.1%}), modeli: {len(R) - n0}', flush=True)
    return R, HIT, OKR


def grupy(R, HIT, n=2000, seed=11):
    """pasma skali → trafialność zakładów po T0 względem modeli tej samej tabeli i celu na tych samych wierszach (× 1 = jak wszyscy)"""
    STR = list(HIT); rng = np.random.default_rng(seed)
    IDX = {t: rng.integers(0, len(HIT[s]), (n, len(HIT[s]))) for s in STR for t in [s[0]]}   # T60 x1x i xx1 — te same mecze
    def bets(G):
        B = {s: np.zeros(len(HIT[s])) for s in STR}
        for x in G:
            np.add.at(B[(x['t'], x['cel'])], x['rows'], 1)
        return B
    ALL = bets(R)
    def rel(B, it=None):
        h = e = 0.0
        for s in STR:
            i = IDX[s[0]][it] if it is not None else slice(None); b, a, yy = B[s][i], ALL[s][i], HIT[s][i]
            h += (b * yy).sum(); e += b.sum() * (a * yy).sum() / a.sum()
        return h / e
    out = []
    for naz, filtr in (('wszystkie modele pul', lambda x: True), ('Twoje kryterium przy T0', lambda x: x['r'] >= 20 and x['w'] / x['r'] >= 0.95 and x['w3'] / x['r'] >= x['q3']),
                       ('Twoje kryterium, od k3', lambda x: x['k'] >= 3 and x['r'] >= 20 and x['w'] / x['r'] >= 0.95 and x['w3'] / x['r'] >= x['q3'])):
        G = [x for x in R if filtr(x)]; P = {}
        for lab, lo, hi in (('≤ 4', 0, 4), ('5–6', 5, 6), ('≥ 7', 7, 9), ('9', 9, 9)):
            H = [x for x in G if lo <= x['pkt'] <= hi]
            if not H:
                continue
            B = bets(H); bs = np.array([rel(B, i) for i in range(n)])
            P[lab] = bs; out.append({'grupa': naz, 'pkt': lab, 'modeli': len(H), 'zakladow_po': int(sum(x['nb'] for x in H)), 'wzgledem': round(rel(B), 3),
                                     'p5': round(float(np.percentile(bs, 5)), 3), 'p95': round(float(np.percentile(bs, 95)), 3), 'zysk_model': round(float(np.mean([x['zysk'] for x in H])))})
        if '≥ 7' in P and '≤ 4' in P:
            d = P['≥ 7'] - P['≤ 4']
            out.append({'grupa': naz, 'pkt': '≥ 7 − ≤ 4', 'roznica': round(float(np.mean(d)), 3), 'p5': round(float(np.percentile(d, 5)), 3),
                        'p95': round(float(np.percentile(d, 95)), 3), 'szansa_lepsze': round(float(np.mean(d > 0)), 2)})
    return out


def sprawdz(stan, ile=15, seed=1):
    """numba = kod aplikacji? losowe modele z obecnych pul: skala z score9 i z pkt9.js (kod OC z szukaj_template.html)"""
    random.seed(seed); zle = n = 0
    for app, tab, cel in (('S', 't50', 'x1x'), ('S+', 't60', 'xx1'), ('L', 't60', 'x1x')):
        X = S.kody(stan, tab); repo = (S.REPO[app] + ('' if '{}' in S.REPO[app] else '{}')).format(tab[1:])
        P = json.load(open(os.path.join(S.katalog(), repo, 'szukaj', f'pool_{tab}_{cel}.json')))['pool']; pool = random.sample(P, ile)
        OUT = skan(pool, X + ['000'], tab, cel, len(X))[0]
        for m, o in zip(pool, OUT):
            ev = []; S.run(m, X, S.TPOS[cel], S.ALPH[tab], ev=ev); cyc = [[kk if w else 9, bp] for bp, w, kk in ev if w or kk == 8]
            js = json.loads(subprocess.run(['node', os.path.join(TU, 'pkt9.js'), repo], input=json.dumps({'N': len(X), 'cyc': cyc}), capture_output=True, text=True).stdout)
            n += 1; zle += (js['score'] if js else -1) != o[14]
    print(f'sprawdzenie z kodem aplikacji: {n} modeli, różnic {zle}'); return zle == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stan', required=True); ap.add_argument('--pule'); ap.add_argument('--sprawdz', action='store_true'); ap.add_argument('--zapisz', action='store_true')
    a = ap.parse_args()
    if a.sprawdz and not sprawdz(a.stan):
        sys.exit('numba ≠ kod aplikacji — nie zapisuję')
    if not a.pule:
        return
    R, HIT, OKR = rekordy(a.pule, a.stan); G = grupy(R, HIT)
    print(f'\n=== skala 9 pkt przy T0 → trafialność zakładów po T0 względem modeli tej samej tabeli i celu ({len(R)} modeli) ===')
    for g in G:
        if 'roznica' in g:
            print(f"  {g['grupa']}: ≥ 7 vs ≤ 4 różnica {g['roznica']:+.3f} (90%: {g['p5']:+.3f}…{g['p95']:+.3f}), szansa, że ≥ 7 lepsze: {g['szansa_lepsze']:.0%}")
        else:
            print(f"  {g['grupa']:25} {g['pkt']:4} pkt: {g['modeli']:6} modeli, {g['zakladow_po']:7} zakładów · × {g['wzgledem']:.3f} (90%: {g['p5']:.3f}–{g['p95']:.3f}) · zysk/model {g['zysk_model']:+d} zł")
    if a.zapisz:
        p = os.path.join(TU, '..', 'kalibracja.json'); K = json.load(open(p)) if os.path.exists(p) else {}
        K['SKALA9'] = {'opis': 'kalibracja_pkt9.py: skala 9 pkt przy T0 (stare pule) → trafialność zakładów po T0 względem modeli tej samej tabeli i celu na tych samych wierszach; p5–p95 = 90% (losowanie wierszy)',
                       'modeli': len(R), 'okres': OKR, 'grupy': G}
        json.dump(K, open(p, 'w'), ensure_ascii=False, indent=1); print('\nzapisano', os.path.normpath(p))


if __name__ == '__main__':
    main()
