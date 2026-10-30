"""Modele z pul SZUKAJ / SZUKAJ+ / SZUKAJ LOST (w kryteriach appki), które mają zakład ustawiony na najbliższe wiersze — prośba użytkownika
„wyszukaj modele T60, które grają na następnym wierszu, krok k4”. Ułożone wg głównego kryterium (wygrana od obecnego kroku do k8 w historii,
≥ 20 przypadków), potem wygrana w 3 krokach. Przy każdym: W TELEFONIE / już oceniony (oceny.json), ten sam Nr co model w MOJE (podwójna
stawka na jeden mecz) i „≈ P…” — prawie ten sam model co wyżej na liście (≥ 60% wspólnych zakładów; do telefonu tylko jeden z takiej grupy).
Potem każdego kandydata przez ocena.py (PROJEKT.md → Propozycje do telefonu).
Użycie:  python3 teraz.py t60 [--kroki 4] [--za 1] [--cel x1x|xx1] [--top 12] [--stan ../px5060/kody/stan.json] [--kody ../px5060/kody]
  --kroki 4 albo 2-5 (krok teraz), --za 1 = zakład na następnym wierszu (Nr N+1), --za 3 = na jednym z 3 najbliższych."""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S
from propozycje import skan, limit_lost
from ocena import modele_telefonu, moje_modele, zaklady, jl


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('tabela', choices=['t50', 't60']); ap.add_argument('--kroki', default='1-6'); ap.add_argument('--za', type=int, default=1)
    ap.add_argument('--cel'); ap.add_argument('--top', type=int, default=12); ap.add_argument('--min', type=int, default=20)
    ap.add_argument('--stan', default=os.path.join(S.katalog(), 'kody', 'stan.json')); ap.add_argument('--kody', default=os.path.join(S.katalog(), 'kody'))
    a = ap.parse_args(); t = a.tabela
    k0, k1 = (map(int, a.kroki.split('-')) if '-' in a.kroki else (int(a.kroki),) * 2)
    cele = [a.cel] if a.cel else (['x1x'] if t == 't50' else ['x1x', 'xx1'])
    stan = json.load(open(a.stan)); X = S.kody(a.stan, t); N = len(X)
    po = os.path.join(a.kody, 'oceny.json'); oc = {o['id'] for o in (jl(open(po).read(), {}) if os.path.exists(po) else {}).get('oceny', [])}
    tel = {x[0] for x in modele_telefonu(stan)}
    # najbliższe zakłady modeli z telefonu (MOJE GRY, BANK) — ten sam Nr = ten sam mecz
    nr_tel = {}
    for app, cel, mid, m in moje_modele(stan, t):
        r = S.run(m, X, S.TPOS[cel], S.ALPH[t])
        if r[0] == 'PEND':
            nr_tel.setdefault(r[2] + 1, []).append(f'{app}{t[1:]} {str(mid).split()[0]} {cel}')
    kand, mniej = [], 0
    for app in ('S+', 'S', 'L'):
        for cel in cele:
            path = os.path.join(S.katalog(), (S.REPO[app] + ('' if '{}' in S.REPO[app] else '{}')).format(t[1:]), 'szukaj', f'pool_{t}_{cel}.json')
            P = json.load(open(path)); O = skan(P['pool'], X, t, cel); NR = P.get('nr') or range(1, len(P['pool']) + 1)
            for i, o in enumerate(O):
                cyk = int(o[:9].sum()); lost = int(o[8]); k = int(o[9]) + 1; lim = limit_lost(cyk, P['rules'])
                if cyk < P['minCyc'] or lim is None or lost > lim or int(o[10]) != 2 or not (k0 <= k <= k1) or (app == 'L' and lost < P.get('minBust', 0)):
                    continue
                m = S.model(app, t, cel, NR[i]); r = S.run(m, X, S.TPOS[cel], S.ALPH[t])
                if r[0] != 'PEND' or not (N <= r[2] < N + a.za):
                    continue
                reach = int(o[k - 1:9].sum())
                if reach < a.min:
                    mniej += 1; continue
                kand.append(dict(h=int(o[k - 1:8].sum()) / reach, h3=int(o[k - 1:min(k + 2, 8)].sum()) / reach, reach=reach, w=int(o[k - 1:8].sum()),
                                 w3=int(o[k - 1:min(k + 2, 8)].sum()), app=app, nr=NR[i], cel=cel, k=k, cyk=cyk, lost=lost, pl=bool(o[11]), bet=r[2] + 1,
                                 m=m, sp=json.dumps(list(m[1:5]) + [m[5] if len(m) > 5 else 1, m[6] if len(m) > 6 else ''])))
    kand.sort(key=lambda r: (-round(r['h'], 2), -r['h3'], -r['reach'], ['S+', 'S', 'L'].index(r['app'])))   # 97% = 97% (zaokrąglone), potem w 3 krokach
    seen = set(); kand = [r for r in kand if not (r['sp'] + r['cel'] in seen or seen.add(r['sp'] + r['cel']))]   # ten sam model w S i S+ — raz (S+ ma pierwszeństwo)
    za = f'Nr {N + 1}' if a.za == 1 else f'Nr {N + 1}–{N + a.za}'
    print(f"=== {t.upper()}: zakład na {za}, krok k{k0}{'' if k0 == k1 else '–k' + str(k1)}{', ' + a.cel if a.cel else ''} · w kryteriach appki "
          f"(≥ {a.min} przypadków od kroku): {len(kand)}{f' (mniej niż {a.min}: {mniej})' if mniej else ''} ===")
    pok = []
    for r in kand[:a.top]:
        ev, _ = zaklady(r['m'], X, t, r['cel']); B = {e[0] for e in ev}; dup = ''
        for q in pok:
            if q['cel'] == r['cel']:
                wsp = len(B & q['B']) / max(1, min(len(B), len(q['B'])))
                if wsp >= 0.6:
                    dup = f" | ≈ {q['app']} P{q['nr']} ({100 * wsp:.0f}% wspólnych)"; break
        r['B'] = B; pok.append(r); i = f"{r['app']}|{t}|{r['cel']}|P{r['nr']}"
        print(f"  {r['app']} P{r['nr']} {r['cel']} | k{r['k']} {S.ST[r['k'] - 1]} zł Nr {r['bet']} | do k8 {r['w']}/{r['reach']} ({100 * r['h']:.0f}%) · w 3 krokach "
              f"{r['w3']}/{r['reach']} ({100 * r['h3']:.0f}%) | cykli {r['cyk']}, LOST {r['lost']}{' | PO LOST' if r['pl'] else ''}"
              f"{' | W TELEFONIE' if i in tel else ''}{' | już oceniony' if i in oc else ''}"
              f"{(' | ten sam Nr co ' + ', '.join(nr_tel[r['bet']])) if r['bet'] in nr_tel else ''}{dup}")
    print('\nDalej: każdy kandydat przez ocena.py (np. ocena.py S+ %s x1x <nr>), do telefonu najwyżej 2 z werdyktem GRAĆ, z różnych grup „≈”.' % t)


if __name__ == '__main__':
    main()
