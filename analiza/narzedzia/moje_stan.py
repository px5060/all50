"""Co jest w telefonie — z pliku stan.json, który MOJE (☁ Kopia w GitHub, od 1.33.0) wysyła do prywatnego repo (np. px5060/kody):
kody T50 / T60, modele w MOJE (z krokiem i fazą), BANK, ZESZYT T50 / T60, ostatnie zakłady. --modele-json PLIK: lista w formacie
analiza/MODELE.json (odtworzenie list z telefonu do narzędzi; „wybor” ustawić ręcznie).
Użycie: python3 moje_stan.py ../px5060/kody/stan.json [--zaklady 15] [--modele-json /tmp/MODELE_z_telefonu.json]"""
import argparse, json, re
from datetime import datetime

PFX = {'_szukaj_v1_': 'S', '_szukajp_v1_': 'S+', '_szbust_v1_': 'L'}
FAZA = {0: 'czeka na STEP', 1: 'STEP był', 2: 'zakład ustawiony'}
GRUPA = {'now': 'GRAJ TERAZ', 'soon': 'ZA CHWILĘ', 'wait': 'CZEKAJĄ', 'bust': 'LOST (po LOST-cie)', 'done': 'ZAKOŃCZONE'}
ST = [8, 8, 16, 32, 64, 128, 256, 512]


def jl(s, d):
    try:
        v = json.loads(s)
        return v if v is not None else d
    except Exception:
        return d


def czas(ms):
    return datetime.fromtimestamp(ms / 1000).strftime('%d.%m %H:%M') if ms else '?'


def zeszyt_nazwa(m, t60):
    w = '·'.join(map(str, sorted(m.get('w', []))))
    if t60:
        cel = m.get('cel') or ['2', '3']
        d = [x for x in '123' if x in cel]
        c = '+'.join(filter(None, [('1-3xx' if len(d) == 3 else '/'.join(d) + 'xx') if d else '', 'x1x' if 'x1x' in cel else '', 'xx1' if 'xx1' in cel else '']))
        cz = m.get('cz', 1)
        return f"{c} {w}{'' if cz == 1 else (' ×%d' % cz if cz else ' od razu')} k{m.get('limit', 9)}"
    poz, cz = m.get('poz', 1), m.get('czekaj', 1)
    return (['+XX ', '', 'XX+ '][poz] + w + (' +bok' if m.get('war') else '') + ('' if cz == 1 else f' ×{cz}') + ('' if m.get('limit', 9) == 9 else f" k{m['limit']}"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stan'); ap.add_argument('--zaklady', type=int, default=15); ap.add_argument('--modele-json')
    a = ap.parse_args()
    d = json.load(open(a.stan)); S = d.get('storage', {})
    print(f"stan z telefonu: zapisano {d.get('zapisano', '?')} · MOJE {d.get('wersja', '?')}")
    for t in ('t50', 't60'):
        k = d[t]['kody']; n = d[t]['n']
        print(f"  {t.upper()}: Nr {n} · ostatnie: " + ' '.join(f"{n - 5 + i}:{k[3 * (n - 6 + i):3 * (n - 5 + i)]}" for i in range(6)))
    # modele w MOJE (lista policzona przez MOJE)
    for t in ('t50', 't60'):
        L = [m for m in d.get('modele', []) if m.get('tabela') == t]
        print(f"\n=== MOJE {t.upper()}: {len(L)} modeli ===")
        for m in L:
            krok = m.get('krok')
            print(f"  {m.get('nazwa')} | {('k%d %d zł' % (krok, ST[krok - 1])) if krok else ''} | {FAZA.get(m.get('faza'), '')}"
                  f"{' Nr %d' % m['zaklad_nr'] if m.get('zaklad_nr') else ''}{' | BANK' if m.get('bank') else ''}{' | po LOST' if m.get('lost') else ''}{' | ' + GRUPA.get(m['grupa'], m['grupa']) if m.get('grupa') else ''}")
    # BANK
    bank = jl(S.get('moje_v1_bank', '[]'), [])
    if bank:
        print(f"\n=== BANK: {len(bank)} ===")
        for x in bank:
            print(f"  {x.get('a')} {x.get('t')} {x.get('tg')} {x.get('id')} · dodany {czas(x.get('t0'))} przy Nr {x.get('at')}")
    # ZESZYT
    for key, t60 in (('zeszyt_v1_modele', False), ('zeszyt_v1_modele60', True)):
        Z = jl(S.get(key, '[]'), [])
        if Z:
            print(f"\n=== ZESZYT {'T60' if t60 else 'T50'}: {len(Z)} ===")
            for m in Z:
                print(f"  {zeszyt_nazwa(m, t60)}{' · lista LOST' if m.get('lista') == 'lost' else ''}")
    # zakłady (MOJE GRY w SZUKAJ / SZUKAJ+ / LOST)
    zak = []
    for k, v in S.items():
        mm = re.match(r'^(t50|t60)(_szukaj_v1_|_szukajp_v1_|_szbust_v1_)bets_(x1x|xx1)$', k)
        if mm:
            for b in jl(v, []):
                if isinstance(b, dict):
                    zak.append((b.get('t', 0), f"{PFX[mm.group(2)]}{mm.group(1)[1:]} {mm.group(3)} {b.get('id')} · Nr {b.get('row', -1) + 1} · k{b.get('step')} · {b.get('stake')} zł{' · BANK +%s' % b['bank'] if b.get('bank') else ''}"))
    for k in ('t50razem_v1_bets', 't60razem_v1_bets', 'zeszyt_v1_zaklady'):
        for b in jl(S.get(k, '[]'), []):
            if isinstance(b, dict):
                zak.append((b.get('t', 0), f"{k.split('_')[0].upper()} " + json.dumps({x: y for x, y in b.items() if x not in ('m', 't')}, ensure_ascii=False)[:160]))
    if zak:
        print(f"\n=== ZAKŁADY (ostatnie {a.zaklady} z {len(zak)}) ===")
        for t, s in sorted(zak)[-a.zaklady:]:
            print(f"  {czas(t)} · {s}")
    if a.modele_json:
        out = {'opis': f"Odtworzone z telefonu (stan.json {d.get('zapisano', '')}). Ustaw 'wybor' ręcznie.", 'MOJE T50': [], 'MOJE T60': [], 'ZESZYT T50': [], 'ZESZYT T60': []}
        seen = set()
        def dodaj(t, app, tg, mid, uw=''):
            key = (t, app, tg, mid)
            if key in seen or not mid or not re.match(r'^P\d+$', str(mid)):
                return
            seen.add(key)
            out['MOJE ' + t.upper()].append({'app': app, 'nr': int(str(mid)[1:]), 'tabela': t, 'cel': tg, **({'uwaga': uw} if uw else {})})
        for k, v in S.items():
            mm = re.match(r'^(t50|t60)(_szukaj_v1_|_szukajp_v1_|_szbust_v1_)moje_(x1x|xx1)$', k)
            if mm:
                for g in jl(v, []):
                    if isinstance(g, dict): dodaj(mm.group(1), PFX[mm.group(2)], mm.group(3), g.get('id'))
        for x in bank:
            dodaj(x.get('t'), x.get('a'), x.get('tg'), x.get('id'), 'w BANK')
        for m in d.get('modele', []):
            if m.get('app') == 'R' and any(n in str(m.get('nazwa')) for n in ('MIX3 T1+5', 'TOP7 M3')):
                nm = 'MIX3 T1+5' if 'MIX3 T1+5' in m['nazwa'] else 'TOP7 M3'
                out['MOJE ' + m['tabela'].upper()].append({'app': 'R', 'nr': nm})
        CEL = {('2', '3'): '2/3xx', ('1',): '1xx', ('x1x',): 'x1x', ('xx1',): 'xx1'}
        for m in jl(S.get('zeszyt_v1_modele', '[]'), []):
            out['ZESZYT T50'].append({k: v for k, v in {'w': m.get('w'), 'poz': m.get('poz'), 'czekaj': m.get('czekaj'), 'war': m.get('war') or None, 'limit': m.get('limit')}.items() if v is not None})
        for m in jl(S.get('zeszyt_v1_modele60', '[]'), []):
            out['ZESZYT T60'].append({k: v for k, v in {'cel': CEL.get(tuple(m.get('cel', ['2', '3'])), 'x1x'), 'w': m.get('w'), 'czekaj': m.get('cz'), 'limit': m.get('limit')}.items() if v is not None})
        json.dump(out, open(a.modele_json, 'w'), ensure_ascii=False, indent=1)
        print(f"\nzapisano {a.modele_json}: " + ', '.join(f"{g} {len(v)}" for g, v in out.items() if g != 'opis'))


if __name__ == '__main__':
    main()
