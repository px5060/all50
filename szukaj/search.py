"""Szukanie puli modeli na całej bazie (seed z ../index.html + opcjonalnie szukaj/dopisane.txt).
Uruchom w katalogu szukaj/:  python3 search.py t50|t60 x1x|xx1 [n_konfiguracji]   (wymaga: pip install numba numpy)
Potem:                        python3 build_szukaj.py t50|t60   → ../szukaj.html"""
import sys, json, itertools, time, re, pathlib, numpy as np
from engine import *

HERE = pathlib.Path(__file__).resolve().parent


def seed_codes():
    """MASTER_SEED z appki RAZEM + kody z dopisane.txt (same cyfry, dowolne odstępy) — np. skopiowane z eksportu."""
    s = re.search(r"const MASTER_SEED = '(\d+)'", (HERE.parent / 'index.html').read_text()).group(1)
    f = HERE / 'dopisane.txt'
    if f.exists():
        s += re.sub(r'\D', '', f.read_text())
    return [s[i:i + 3] for i in range(0, len(s) - len(s) % 3, 3)]
RULES = [(200, 5), (300, 9), (400, 11)]
MIN_CYC = 100
MARGIN = 1          # w puli też modele o 1 BUST ponad limit (mogą wejść z nowymi kodami); appka filtruje ściśle


def specs(name):
    al = ALPH[name]
    pats = [a + b + c for a in FIRST[name] for b in '01x' for c in '01x' if a + b + c != 'xxx']
    step = []
    for r in (1, 2, 3) if name == 't50' else (1, 2):
        for U in itertools.combinations(al, r):
            step.append(('SERIA', '∪'.join(U)))
    step += [('UKŁAD', p + ' → ' + q) for p in pats for q in pats]
    trig = pats + [p + ' → ' + q for p in pats for q in pats]
    return al, step, trig


def tabs(preds, al):
    T = np.zeros((len(preds), 3, len(al)), np.uint8); L = np.zeros(len(preds), np.int64)
    for k, p in enumerate(preds):
        T[k], L[k] = table(p, al)
    return T, L


def main():
    name, target = sys.argv[1], sys.argv[2]
    n = int(sys.argv[3]) if len(sys.argv) > 3 else 6_000_000
    codes = seed_codes()
    al, step, trig = specs(name)
    X = np.array([al.index(c) for c in codes], np.int64)
    y = np.array([c[TARGET_POS[target]] == '1' for c in al], np.uint8)
    STAB, SL = tabs([s for _, s in step], al); TTAB, TL = tabs(trig, al)
    rng = np.random.default_rng(7)
    a = rng.integers(0, len(step), n); b = rng.integers(0, len(trig), n); off = rng.integers(1, 8, n)
    ser = np.array([t == 'SERIA' for t, _ in step])[a]
    x = np.where(ser, rng.integers(1, 6, n), 1)
    cfg = np.unique(np.stack([a, b, x, off], 1).astype(np.int64), axis=0)
    OUT = np.zeros((len(cfg), 11), np.int64)
    t = time.time(); run_cfg(STAB, SL, TTAB, TL, cfg, X, y, len(X), OUT)
    cyc = OUT[:, 1] + OUT[:, 2]; bu = OUT[:, 2]
    lim = np.full(len(cfg), -1)
    for mc, mb in reversed(RULES):
        lim[cyc <= mc] = mb
    ok = (cyc >= MIN_CYC) & (lim >= 0) & (bu <= lim + MARGIN)
    strict = ok & (bu <= lim)
    print(f'{name} {target}: {len(cfg):,} konfiguracji w {time.time()-t:.0f}s; spełnia ściśle {strict.sum():,}, z marginesem {ok.sum():,}')
    for lo, hi in [(100, 200), (201, 300), (301, 400)]:
        g = strict & (cyc >= lo) & (cyc <= hi); print(f'   cykle {lo}-{hi}: {g.sum():,}')
    # pula warstwowa: w każdym przedziale cykli najlepsze wg BUST/cykl (potem więcej cykli)
    idx = []
    for lo, hi, take in [(100, 200, 1200), (201, 300, 1200), (301, 400, 600)]:
        g = np.where(ok & (cyc >= lo) & (cyc <= hi))[0]
        idx += list(g[np.lexsort((-cyc[g], bu[g] / cyc[g]))][:take])
    pool = []
    for k in idx:
        t_, s_ = step[cfg[k, 0]]
        pool.append([t_[0], s_, int(cfg[k, 2]), trig[cfg[k, 1]], int(cfg[k, 3])])
    json.dump({'name': name, 'target': target, 'seedN': len(codes), 'rules': RULES, 'minCyc': MIN_CYC, 'pool': pool},
              open(HERE / f'pool_{name}_{target}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print('   pula zapisana:', len(pool))


if __name__ == '__main__':
    main()
