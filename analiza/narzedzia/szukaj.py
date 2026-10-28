"""Silnik modeli SZUKAJ / SZUKAJ+ / SZUKAJ LOST (1:1 z szukaj*/szukaj/engine.py, bez numba) i MIX3 v14 z RAZEM T60.
Model SZUKAJ = [typ, STEP, x, TRIGGER, off, tn, STEP2]: STEP ×x pod rząd → [STEP2 raz] → TRIGGER ×tn → zakład na ostatnim
TRIGGER + off. Progresja trwała K8 8 · 8 · 16 · … · 512 zł, kurs 3,0; przegrany k8 = LOST. Nazwa w aplikacjach: P{n} = pula[n − 1]
(T60: osobna pula dla celu x1x i xx1)."""
import itertools, json, os, random

ST = [8, 8, 16, 32, 64, 128, 256, 512]
ALPH = {'t50': [a + b + c for a in '01' for b in '01' for c in '01'],
        't60': [a + b + c for a in '0123' for b in '01' for c in '01']}
TPOS = {'x1x': 1, 'xx1': 2}
REPO = {'S': 'szukaj', 'S+': 'szukaj{}plus', 'L': 'szukajbust'}
RAZEM = {'TOP7 M3': ('t60', 'x1x', ['S', '001∪010∪200', 3, '000∪101', 4])}   # TOP7 = silnik 1T (sprawdzone: WIN 106 / LOST 0)


def katalog():
    return os.environ.get('PX5060') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'px5060')


def kody(path):
    """Eksport z RAZEM (.json z 'codes') albo plik tekstowy z kodami."""
    s = open(path).read()
    if s.lstrip().startswith('{'):
        return json.loads(s)['codes']
    s = ''.join(ch for ch in s if ch.isdigit())
    return [s[i:i + 3] for i in range(0, len(s), 3)]


_pule = {}
def model(app, tabela, cel, nr):
    if app == 'R':
        return RAZEM[nr][2]
    num = tabela[1:]
    repo = (REPO[app] + ('' if '{}' in REPO[app] else '{}')).format(num)
    p = os.path.join(katalog(), repo, 'szukaj', f'pool_{tabela}_{cel}.json')
    if p not in _pule:
        _pule[p] = json.load(open(p))['pool']
    return _pule[p][nr - 1]


def _m1(p, c):
    return any(len(q) == 3 and all(a == 'x' or a == b for a, b in zip(q, c)) for q in p.split('∪'))


def _pred(pred, alph):
    return [set(c for c in alph if _m1(p, c)) for p in pred.split(' → ')]


def _hit(P, X, i):
    L = len(P)
    return i >= L - 1 and all(X[i - L + 1 + j] in P[j] for j in range(L))


def run(m, X, tpos, alph, state=None, stop=False, ev=None):
    """Maszyna stanów. state = (st, cnt, tc, bs, i). stop=True → zwraca ('BET', wiersz TRIGGERA, wiersz zakładu, bs) przy pierwszym zakładzie."""
    SP, TP = _pred(m[1], alph), _pred(m[3], alph)
    tn = m[5] if len(m) > 5 else 1
    S2 = _pred(m[6], alph) if len(m) > 6 and m[6] else None
    x, off = m[2], m[4]
    st, cnt, tc, bs, i = state or (0, 0, 0, 0, 0)
    n = len(X)
    while i < n:
        if st == 0:
            if _hit(SP, X, i):
                cnt += 1
                if cnt >= x:
                    st = 1 if S2 else 2
            else:
                cnt = 0
            i += 1
        elif st == 1:
            if _hit(S2, X, i):
                st = 2
            i += 1
        elif _hit(TP, X, i):
            tc += 1
            if tc < tn:
                i += 1
                continue
            bp = i + off
            if stop:
                return ('BET', i, bp, bs)
            if bp >= n:
                return ('PEND', i, bp, bs)
            w = X[bp][tpos] == '1'
            if ev is not None:
                ev.append((bp, w, bs + 1))
            bs = 0 if (w or bs == 7) else bs + 1
            st = 0; cnt = 0; tc = 0; i = bp + 1
        else:
            i += 1
    return ('STATE', (st, cnt, tc, bs, i))


def analiza(m, X, tabela, cel, mc=400):
    """Historia, stan teraz, zamknięcie od obecnego kroku, po LOST i najbliższy zakład. Wiersze jako Nr (od 1)."""
    alph, tpos = ALPH[tabela], TPOS[cel]
    ev = []
    res = run(m, X, tpos, alph, ev=ev)
    cyc, seria = [], []
    for bp, w, k in ev:                       # cykle: (krok WIN 1–8 albo 9 = LOST, Nr rozliczenia); seria = zakłady bieżącego cyklu
        seria.append((bp + 1, k, w))
        if w:
            cyc.append((k, bp + 1)); seria = []
        elif k == 8:
            cyc.append((9, bp + 1)); seria = []
    k = (res[3] if res[0] == 'PEND' else res[1][3]) + 1
    reach = [c for c in cyc if c[0] >= k]
    h = len(cyc) // 2
    p = sum(c[tpos] == '1' for c in X) / len(X)
    out = dict(cykle=len(cyc), win=sum(c[0] <= 8 for c in cyc), lost_nr=[c[1] for c in cyc if c[0] == 9],
               ostatnie=['L' if c[0] == 9 else f'W{c[0]}' for c in cyc[-3:]], k=k, stawka=ST[k - 1],
               od_kroku=(sum(c[0] <= 8 for c in reach), len(reach)),
               polowy=[(sum(c[0] <= 8 for c in r), len(r)) for r in ([c for c in cyc[:h] if c[0] >= k], [c for c in cyc[h:] if c[0] >= k])],
               po_lost=[('L' if cyc[i + 1][0] == 9 else f'W{cyc[i + 1][0]}') for i, c in enumerate(cyc) if c[0] == 9 and i + 1 < len(cyc)],
               po_lost_teraz=bool(cyc) and cyc[-1][0] == 9, realnie=1 - (1 - p) ** (9 - k), do_limitu=sum(ST[k - 1:]),
               seria=[f'k{k_} Nr {nr} pudło' for nr, k_, w in seria],
               ost10=[('L' if c[0] == 9 else f'W{c[0]}') + f'@{c[1]}' for c in cyc[-10:]])
    N = len(X)
    if res[0] == 'PEND':
        out['zaklad'] = f'zakład ustawiony: Nr {res[2] + 1}'
        return out
    state = res[1]
    for L in (1, 2):
        hits = {}
        for ext in itertools.product(alph, repeat=L):
            r = run(m, X + list(ext), tpos, alph, state, True)
            if r[0] == 'BET' and r[1] == N + L - 1:
                hits.setdefault(r[2] + 1, []).append(' '.join(ext))
        if hits:
            out['zaklad'] = '; '.join(f"Nr {nr}, jeśli na Nr {N + 1}{'–' + str(N + L) if L > 1 else ''} padnie {' / '.join(v[:6])}{' …' if len(v) > 6 else ''}"
                                      for nr, v in sorted(hits.items()))
            return out
    rnd, waits = random.Random(7), []
    for _ in range(mc):
        ext = []
        while len(ext) < 300:
            ext.append(rnd.choice(X))
            r = run(m, X + ext, tpos, alph, state, True)
            if r[0] == 'BET':
                waits.append(r[2] + 1 - N)
                break
    waits.sort()
    if waits:
        out['zaklad'] = f'zwykle za {waits[len(waits) // 4]}–{waits[3 * len(waits) // 4]} wierszy (Nr pokaże GRAJ TERAZ)'
    return out


# ===== MIX3 v14 (RAZEM T60): HIT = 101/201/301, STEP = 100/200/300, inne kody się nie liczą =====
HITS, STEPS = {'101', '201', '301'}, {'100', '200', '300'}


def mix3(X, TM=1, OFF=5):
    """T{TM}+{OFF}: po cyklu z M = TM gramy cykl o OFF dalej; WIN = M ≤ 8. Zwraca historię i stan otwartego cyklu."""
    cyc, inC, a, kr, lastS = [], False, None, [], False
    for i, c in enumerate(X):
        h, s = c in HITS, c in STEPS
        if not h and not s:
            continue
        if not inC:
            if h:
                inC, a, kr, lastS = True, i + 1, [], False
            continue
        if s:
            lastS = True
        elif lastS:
            kr.append(i + 1); lastS = False
        else:
            cyc.append((a, i + 1, len(kr) + 1)); a, kr, lastS = i + 1, [], False
    gry = [cyc[t + OFF] for t in range(len(cyc) - OFF) if cyc[t][2] == TM]
    gra = len(cyc) - OFF >= 0 and cyc[len(cyc) - OFF][2] == TM
    k = len(kr) + 1
    reach = [g for g in gry if g[2] >= k]
    return dict(gier=len(gry), lost=sum(g[2] > 8 for g in gry), ostatnie=[f'W{g[2]}' if g[2] <= 8 else 'L' for g in gry[-3:]],
                gra=gra, k=k, stawka=ST[min(k, 8) - 1], krok_przegrany=lastS,
                od_kroku=(sum(g[2] <= 8 for g in reach), len(reach)))
