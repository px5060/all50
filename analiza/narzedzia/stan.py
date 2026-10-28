"""Stan wszystkich modeli z MODELE.json na najnowszych kodach: krok i stawka teraz, najbliższy zakład (Nr albo warunek),
historia zamknięcia od obecnego kroku, realna szansa do limitu, po LOST. Liczy silnikami aplikacji (SZUKAJ 1:1, ZESZYT 1:1).
Użycie:  bash analiza/narzedzia/pobierz.sh   (raz na sesję)
         python3 analiza/narzedzia/stan.py --t50 eksport_T50.json --t60 eksport_T60.json [--grupa "MOJE T50"] [--tylko-wybor]"""
import argparse, json, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S

TU = os.path.dirname(os.path.abspath(__file__))


def pct(a, b):
    return f'{a}/{b} ({100 * a / b:.0f}%)' if b else '—'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--t50'); ap.add_argument('--t60')
    ap.add_argument('--modele', default=os.path.join(TU, '..', 'MODELE.json'))
    ap.add_argument('--grupa'); ap.add_argument('--tylko-wybor', action='store_true')
    a = ap.parse_args()
    M = json.load(open(a.modele))
    X = {'t50': S.kody(a.t50) if a.t50 else None, 't60': S.kody(a.t60) if a.t60 else None}
    for grupa in ('MOJE T50', 'MOJE T60'):
        tab = grupa[-3:].lower()
        if X[tab] is None or (a.grupa and a.grupa != grupa):
            continue
        print(f'\n=== {grupa} (kody do Nr {len(X[tab])}) ===')
        for m in M[grupa]:
            if a.tylko_wybor and not m.get('wybor'):
                continue
            gw = '★ ' if m.get('wybor') else '  '
            uw = f" | {m['uwaga']}" if m.get('uwaga') else ''
            if m['nr'] == 'MIX3 T1+5':
                r = S.mix3(X['t60'])
                stan = (f"k{r['k']} {r['stawka']} zł — " + ('krok przegrany, czeka na HIT' if r['krok_przegrany'] else 'gra na najbliższym kodzie HIT/STEP')) if r['gra'] else 'czeka na cykl gry'
                print(f"{gw}R MIX3 T1+5 | {stan} | historia od tego kroku {pct(*r['od_kroku'])} | gier {r['gier']}, LOST {r['lost']}, ostatnie {' '.join(r['ostatnie'])}{uw}")
                continue
            if m['app'] == 'R':
                tabela, cel, mdl = S.RAZEM[m['nr']]
                nazwa = f"R {m['nr']}"
            else:
                tabela, cel, mdl = m['tabela'], m['cel'], S.model(m['app'], m['tabela'], m['cel'], m['nr'])
                nazwa = f"{m['app']} P{m['nr']} {cel}"
            r = S.analiza(mdl, X[tabela], tabela, cel)
            print(f"{gw}{nazwa} | k{r['k']} {r['stawka']} zł | {r.get('zaklad', '')} | od tego kroku {pct(*r['od_kroku'])} "
                  f"(połowy {pct(*r['polowy'][0])} · {pct(*r['polowy'][1])}) · realnie {100 * r['realnie']:.0f}% | WIN {r['win']} LOST {len(r['lost_nr'])}"
                  f"{' (ost. Nr ' + str(r['lost_nr'][-1]) + ')' if r['lost_nr'] else ''} | {'PO LOST · ' if r['po_lost_teraz'] else ''}po LOST: {' '.join(r['po_lost']) or '—'} | do k8 {r['do_limitu']} zł{uw}")
    if (a.t50 or a.t60) and (not a.grupa or a.grupa.startswith('ZESZYT')):
        mod = a.modele
        if a.tylko_wybor or a.grupa:
            sel = {g: [m for m in v if (not a.tylko_wybor or m.get('wybor'))] for g, v in M.items() if g.startswith('ZESZYT') and (not a.grupa or g == a.grupa)}
            mod = os.path.join(tempfile.gettempdir(), 'modele_wybor.json'); json.dump(sel, open(mod, 'w'))
        subprocess.run(['node', os.path.join(TU, 'zeszyt.js'), mod, a.t50 or '', a.t60 or ''], check=False)


if __name__ == '__main__':
    main()
