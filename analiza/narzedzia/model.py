"""Jeden model — do „sesji jednego modelu” (prowadzimy go do WIN albo LOST). Szczegóły: historia, ostatnie cykle, zakłady tej serii,
zamknięcie od obecnego kroku, po LOST, najbliższy zakład (Nr albo warunek), stawka, ile do limitu; ZESZYT — cały plan z Nr.
Przykłady (zamiast --t50 / --t60 można --stan stan.json z MOJE):
  python3 model.py "L 3911 t50 x1x"        --t50 T50.json      (SZUKAJ: S / S+ / L, numer P, tabela, cel)
  python3 model.py "S+ 4539 t60 x1x"       --t60 T60.json
  python3 model.py "R MIX3 T1+5"           --t60 T60.json      (RAZEM: MIX3 T1+5, TOP7 M3)
  python3 model.py "Z50 XX+ 1·2·14 +bok k10" --t50 T50.json    (ZESZYT T50: nazwa jak w aplikacji; ×2 = po 2 pustych, ×0 = od razu)
  python3 model.py "Z60 xx1 16·27 k10"     --t60 T60.json      (ZESZYT T60: cel x1x / xx1 / 1xx / 2/3xx)"""
import argparse, json, os, re, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S

TU = os.path.dirname(os.path.abspath(__file__))


def zeszyt_def(t50, toks):
    d = {}
    for t in toks:
        if t in ('+XX', 'X+X', 'XX+'): d['poz'] = ['+XX', 'X+X', 'XX+'].index(t)
        elif t in ('x1x', 'xx1', '1xx', '2/3xx'): d['cel'] = t
        elif re.fullmatch(r'\d+([·.]\d+)+|\d+', t): d['w'] = [int(x) for x in re.split(r'[·.]', t)]
        elif t == '+bok': d['war'] = 'boki'
        elif re.fullmatch(r'[×x]\d', t): d['czekaj'] = int(t[1])
        elif t == 'razu': d['czekaj'] = 0
        elif re.fullmatch(r'k\d+', t): d['limit'] = int(t[1:])
    if not t50 and 'cel' not in d:
        raise SystemExit('ZESZYT T60: podaj cel (x1x / xx1 / 1xx / 2/3xx)')
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('model'); ap.add_argument('--t50'); ap.add_argument('--t60'); ap.add_argument('--stan')
    a = ap.parse_args()
    if a.stan: a.t50, a.t60 = a.t50 or a.stan, a.t60 or a.stan   # stan.json z MOJE (☁ Kopia w GitHub) = obie tabele
    toks = a.model.split()
    if toks[0] in ('Z50', 'Z60'):
        grupa = 'ZESZYT T50' if toks[0] == 'Z50' else 'ZESZYT T60'
        plik = a.t50 if toks[0] == 'Z50' else a.t60
        if not plik: raise SystemExit(f'brak eksportu kodów (--{"t50" if toks[0] == "Z50" else "t60"})')
        f = os.path.join(tempfile.gettempdir(), 'model_jeden.json'); json.dump({grupa: [zeszyt_def(toks[0] == 'Z50', toks[1:])]}, open(f, 'w'))
        subprocess.run(['node', os.path.join(TU, 'zeszyt.js'), f, a.t50 if toks[0] == 'Z50' else '', a.t60 if toks[0] == 'Z60' else ''],
                       env={**os.environ, 'SZCZEGOLY': '1'}, check=False)
        return
    if toks[0] == 'R' and ' '.join(toks[1:]) == 'MIX3 T1+5':
        r = S.mix3(S.kody(a.t60, 't60'))
        print(f"R MIX3 T1+5 (kody do Nr {len(S.kody(a.t60, 't60'))}) | gier {r['gier']}, LOST {r['lost']}, ostatnie {' '.join(r['ostatnie'])}")
        print(f"  teraz: {'k%d %d zł — ' % (r['k'], r['stawka']) + ('krok przegrany, czeka na HIT' if r['krok_przegrany'] else 'gra na najbliższym kodzie HIT/STEP') if r['gra'] else 'czeka na cykl gry'}"
              f" | historia od tego kroku {r['od_kroku'][0]}/{r['od_kroku'][1]} | HIT = 101/201/301, STEP = 100/200/300, inne kody się nie liczą")
        return
    if toks[0] == 'R':
        tabela, cel, m = S.RAZEM[' '.join(toks[1:])]
    else:
        app, nr, tabela, cel = toks[0], int(toks[1].lstrip('P')), toks[2], toks[3]
        m = S.model(app, tabela, cel, nr)
    X = S.kody(a.t50 if tabela == 't50' else a.t60, tabela)
    r = S.analiza(m, X, tabela, cel)
    s2 = f" → STEP2 {m[6]}" if len(m) > 6 and m[6] else ''
    tn = m[5] if len(m) > 5 else 1
    print(f"{a.model} (kody do Nr {len(X)}) | {m}")
    print(f"  jak gra: STEP {m[1]}{' ×' + str(m[2]) if m[2] > 1 else ''}{s2} → TRIGGER {m[3]}{' ×' + str(tn) if tn > 1 else ''} → zakład {m[4]} w. po TRIGGERZE, cel {cel}")
    print(f"  historia: WIN {r['win']} / LOST {len(r['lost_nr'])} (Nr {', '.join(map(str, r['lost_nr'][-5:])) or '—'}) | ostatnie: {' '.join(r['ostatnie10'] if 'ostatnie10' in r else r['ost10'])}")
    print(f"  po LOST: {' '.join(r['po_lost']) or '—'}{' | TERAZ PO LOST-CIE' if r['po_lost_teraz'] else ''}")
    print(f"  teraz: k{r['k']} {r['stawka']} zł | ta seria: {', '.join(r['seria']) or '—'} | {r.get('zaklad', '')}")
    print(f"  od k{r['k']} do k8 zamykał {r['od_kroku'][0]}/{r['od_kroku'][1]} (starsza połowa {r['polowy'][0][0]}/{r['polowy'][0][1]} · nowsza {r['polowy'][1][0]}/{r['polowy'][1][1]})"
          f" · realnie {100 * r['realnie']:.0f}% | do k8 najwyżej {r['do_limitu']} zł")


if __name__ == '__main__':
    main()
