"""Przycinanie puli SZUKAJ / SZUKAJ+ / SZUKAJ LOST po odświeżeniu (prośba użytkownika): modele, które na całym ciągu kodów nie spełniają
kryteriów SZUKAJ, wypadają z puli; model, który użytkownik ma w MOJE (listy MOJE GRY, BANK — ze stan.json), zostaje, dopóki
użytkownik nie zdecyduje (--usun). Numery P się nie zmieniają: pula dostaje listę `nr` (numer każdego modelu), appki pokazują P z niej.
Liczy silnikiem z repo appki (engine.py: run_cfg / run_cfgA) na bazie seed_<t>.txt + dopisane.txt — tak jak search.py i appka.
Użycie:  python3 przytnij.py --repo /home/user/szukaj60plus --cel xx1 --stan ../px5060/kody/stan.json [--kryteria domyslne|moje]
                             [--usun P12,P345] [--zapisz]
  --kryteria domyslne = kryteria z pliku puli / search.py (appka bez zmian ustawień), moje = ustawione w appce na telefonie (stan.json)."""
import argparse, json, os, re, sys
import numpy as np

PFX = {'S': '_szukaj_v1_', 'S+': '_szukajp_v1_', 'L': '_szbust_v1_'}


def jl(s, d):
    try:
        v = json.loads(s)
        return v if v is not None else d
    except Exception:
        return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', required=True); ap.add_argument('--cel', required=True); ap.add_argument('--stan', required=True)
    ap.add_argument('--kryteria', choices=['domyslne', 'moje'], default='domyslne'); ap.add_argument('--usun', default='')
    ap.add_argument('--zapisz', action='store_true')
    a = ap.parse_args()
    R = os.path.join(a.repo, 'szukaj'); sys.path.insert(0, R)
    import engine as E
    rn = os.path.basename(os.path.normpath(a.repo)); t = 't50' if '50' in rn else 't60'
    app = 'S+' if 'plus' in rn else 'L' if 'bust' in rn else 'S'
    pf = os.path.join(R, f'pool_{t}_{a.cel}.json'); P = json.load(open(pf)); pool = P['pool']; nr = P.get('nr') or list(range(1, len(pool) + 1))
    kod = re.sub(r'\D', '', open(os.path.join(R, f'seed_{t}.txt')).read())
    if os.path.exists(os.path.join(R, 'dopisane.txt')):
        kod += re.sub(r'\D', '', open(os.path.join(R, 'dopisane.txt')).read())
    al = E.ALPH[t]; X = np.array([al.index(kod[i:i + 3]) for i in range(0, len(kod) - len(kod) % 3, 3)], np.int64)
    y = np.array([c[E.TARGET_POS[a.cel]] == '1' for c in al], np.uint8)
    assert P['seedN'] == len(X), f"pula liczona do Nr {P['seedN']}, kodów {len(X)} — najpierw search.py na tych samych kodach"
    # silnik: tablice predykatów prosto z opisów modeli (STEP, TRIGGER, STEP2)
    preds = sorted({m[1] for m in pool} | {m[6] for m in pool if len(m) > 6 and m[6]}); tri = sorted({m[3] for m in pool})
    pi = {p: i for i, p in enumerate(preds)}; ti = {p: i for i, p in enumerate(tri)}
    def tabs(L):
        T = np.zeros((len(L), 3, len(al)), np.uint8); N = np.zeros(len(L), np.int64)
        for k, p in enumerate(L):
            T[k], N[k] = E.table(p, al)
        return T, N
    STAB, SL = tabs(preds); TTAB, TL = tabs(tri)
    if app == 'S+':
        cfg = np.array([[pi[m[1]], ti[m[3]], m[2], m[4], pi[m[6]] if len(m) > 6 and m[6] else -1, (m[5] if len(m) > 5 else 1) or 1] for m in pool], np.int64)
        OUT = np.zeros((len(cfg), 13), np.int64); E.run_cfg(STAB, SL, TTAB, TL, cfg, X, y, len(X), OUT)
    else:
        cfg = np.array([[pi[m[1]], ti[m[3]], m[2], m[4]] for m in pool], np.int64)
        if app == 'L':
            sys.argv = ['search.py']; import search as SR
            OUT = np.zeros((len(cfg), E.NA), np.int64); E.run_cfgA(STAB, SL, TTAB, TL, cfg, X, y, len(X), int(len(X) * SR.SPLIT), SR.GAP, OUT)
        else:
            OUT = np.zeros((len(cfg), 11), np.int64); E.run_cfg(STAB, SL, TTAB, TL, cfg, X, y, len(X), OUT)
    cyc = OUT[:, 1] + OUT[:, 2]; bu = OUT[:, 2]
    # kryteria: domyślne (plik puli) albo ustawione w appce (stan.json)
    st = json.load(open(a.stan)); S = st.get('storage', {})
    K = {'rules': P['rules'], 'minCyc': P['minCyc'], 'minBust': P.get('minBust', 0), 'maxClose': P.get('maxClose', 0)}
    if a.kryteria == 'moje':
        u = jl(S.get(f'{t}{PFX[app]}rules', ''), {})
        if u.get('rules'):
            K.update({k: u[k] for k in ('rules', 'minCyc', 'minBust', 'maxClose') if k in u})
    rules = [list(r) for r in K['rules']]
    if not any(r[0] is None for r in rules):
        rules.append([None, 11])
    lim = np.full(len(cyc), -1)
    for r in reversed(rules):
        lim[cyc <= r[0] if r[0] is not None else cyc >= 0] = r[1]
    ok = (cyc >= K['minCyc']) & (lim >= 0) & (bu <= lim)
    if app == 'L':
        ok &= (bu >= K['minBust']) & (OUT[:, 17] <= K['maxClose'])
    # modele w MOJE: listy MOJE GRY tej appki i BANK
    nf = 7 if app == 'S+' else 5
    sk = lambda m: '|'.join(map(str, (list(m) + [1, ''])[:nf] if app == 'S+' and len(m) == 5 else list(m)[:nf]))
    moje = {}
    for g in jl(S.get(f'{t}{PFX[app]}moje_{a.cel}', '[]'), []):   # MOJE GRY tej appki (stare zakłady — historia — się nie liczą)
        if isinstance(g, dict) and isinstance(g.get('m'), list):
            moje[sk(g['m'])] = g.get('id', '?')
    for b in jl(S.get('moje_v1_bank', '[]'), []):
        if isinstance(b, dict) and b.get('a') == app and b.get('t') == t and b.get('tg') == a.cel and isinstance(b.get('m'), list):
            moje[sk(b['m'])] = (b.get('id') or '?') + ' (BANK)'
    usun = {int(x.strip().lstrip('Pp')) for x in a.usun.split(',') if x.strip()}
    zost, wyp, pyt = [], [], []
    for k, m in enumerate(pool):
        w_moje = sk(m) in moje
        if nr[k] in usun:
            wyp.append(k)
        elif ok[k]:
            zost.append(k)
        elif w_moje:
            zost.append(k); pyt.append(k)
        else:
            wyp.append(k)
    print(f"{app}{t[1:]} {a.cel} ({a.kryteria}: min {K['minCyc']} cykli, progi {rules}{', min LOST %d, powtórki ≤ %d' % (K['minBust'], K['maxClose']) if app == 'L' else ''}): "
          f"pula {len(pool)} → zostaje {len(zost)}, wypada {len(wyp)}")
    for k in pyt:
        print(f"   ? P{nr[k]} w MOJE ({moje[sk(pool[k])]}) nie spełnia kryteriów: {int(cyc[k])} cykli, {int(bu[k])} LOST — zostaje, zapytać użytkownika")
    if a.zapisz:
        P['pool'] = [pool[k] for k in zost]; P['nr'] = [nr[k] for k in zost]; P['przyciete'] = {'kryteria': a.kryteria, 'wypadlo': len(wyp), 'w_moje_zostawione': len(pyt)}
        json.dump(P, open(pf, 'w'), ensure_ascii=False, separators=(',', ':'))
        print(f'   zapisano {pf}: {len(P["pool"])} modeli, numery P{min(P["nr"])}–P{max(P["nr"])}')


if __name__ == '__main__':
    main()
