"""Propozycje modeli dla telefonu: plik od_claude.json w prywatnym repo z kodami (np. px5060/kody). MOJE (1.34.0+) pokazuje je na TERAZ
(„📥 Od Claude”) i dodaje dopiero po „＋ Dodaj” użytkownika — do MOJE (TERAZ), BANK albo ZESZYTU. Decyzje wracają w stan.json (moje_v1_odclaude).
Narzędzie tylko zapisuje plik; commit i push do repo z kodami robi się osobno (git -C ../px5060/kody …).
Użycie:
  python3 od_claude.py moje  S+ t60 xx1 5070 [--uwaga "…"]       model z puli SZUKAJ / SZUKAJ+ / LOST (P…) → MOJE (TERAZ)
  python3 od_claude.py bank  S+ t60 xx1 3619 [--uwaga "…"]       → BANK
  python3 od_claude.py zeszyt t50 6,11,27 [--limit 10] [--poz 1] [--czekaj 1] [--bok] [--lost] [--uwaga "…"]
  python3 od_claude.py zeszyt t60 1,5,11 --cel x1x [--limit 9] [--czekaj 1] [--lost] [--uwaga "…"]   (cel: 2/3xx, 1xx, 1-3xx, x1x, xx1)
  python3 od_claude.py lista                                     propozycje i decyzje z telefonu
  python3 od_claude.py usun ID | wyczysc                         wyczysc = usuń propozycje, o których telefon już zdecydował
Opcje: --kody KATALOG (domyślnie ../px5060/kody), --mimo (dodaj, choć model już jest w telefonie)."""
import argparse, json, os, sys, time
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S

NF = {'S': 5, 'S+': 7, 'L': 5}
PFX = {'S': '_szukaj_v1_', 'S+': '_szukajp_v1_', 'L': '_szbust_v1_'}
CEL60 = {'2/3xx': ['2', '3'], '1xx': ['1'], '1-3xx': ['1', '2', '3'], 'x1x': ['x1x'], 'xx1': ['xx1']}


def jl(s, d):
    try:
        v = json.loads(s)
        return v if v is not None else d
    except Exception:
        return d


def wczytaj(kat):
    p = os.path.join(kat, 'od_claude.json')
    d = jl(open(p).read(), {}) if os.path.exists(p) else {}
    if not isinstance(d.get('propozycje'), list):
        d['propozycje'] = []
    st = os.path.join(kat, 'stan.json')
    return p, d, (json.load(open(st)) if os.path.exists(st) else {})


def zapisz(p, d):
    d['opis'] = 'Propozycje Claude dla MOJE (📥 Od Claude) — dodaje dopiero „＋ Dodaj” na telefonie.'
    d['zapisano'] = datetime.now().astimezone().isoformat(timespec='seconds')
    json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1)
    print(f"zapisano {p}: {len(d['propozycje'])} propozycji — teraz commit i push do repo z kodami")


def opis(p):
    if p.get('gdzie') == 'ZESZYT':
        cz = p.get('czekaj', p.get('cz', 1)); dod = '' if cz == 1 else f' ×{cz}' if cz else ' od razu'
        cel = '' if p['tabela'] == 't50' else ({','.join(v): k for k, v in CEL60.items()}.get(','.join(p['cel']), '?') + ' ')
        return f"ZESZYT {p['tabela'].upper()} {cel}{'·'.join(map(str, p['w']))}{' +bok' if p.get('war') else ''}{dod} k{p.get('limit', 9)}"
    return f"{p['gdzie']}: {p['app']}{p['tabela'][1:]} {p['cel']} {p['model']}"


def w_telefonie(p, stan):
    """Czy taki model już jest w telefonie (wg ostatniego stan.json)."""
    St = stan.get('storage', {})
    if p['gdzie'] == 'ZESZYT':
        L = jl(St.get('zeszyt_v1_modele' if p['tabela'] == 't50' else 'zeszyt_v1_modele60', '[]'), [])
        return any(m.get('w') == p['w'] and m.get('limit') == p['limit'] and (m.get('poz') == p['poz'] and m.get('czekaj') == p['czekaj'] and (m.get('war') or '') == p['war']
                   if p['tabela'] == 't50' else m.get('cel') == p['cel'] and m.get('cz') == p['cz']) for m in L if isinstance(m, dict))
    sp = lambda m: '|'.join(map(str, m[:NF[p['app']]]))
    L = jl(St.get(f"{p['tabela']}{PFX[p['app']]}moje_{p['cel']}", '[]'), []) + [b for b in jl(St.get('moje_v1_bank', '[]'), []) if b.get('a') == p['app'] and b.get('t') == p['tabela'] and b.get('tg') == p['cel']]
    return any(isinstance(g, dict) and isinstance(g.get('m'), list) and sp(g['m']) == sp(p['m']) for g in L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('co', choices=['moje', 'bank', 'zeszyt', 'lista', 'usun', 'wyczysc']); ap.add_argument('arg', nargs='*')
    ap.add_argument('--kody', default=os.path.join(S.katalog(), 'kody')); ap.add_argument('--uwaga', default='')
    ap.add_argument('--limit', type=int); ap.add_argument('--poz', type=int, default=1); ap.add_argument('--czekaj', type=int, default=1)
    ap.add_argument('--bok', action='store_true'); ap.add_argument('--lost', action='store_true'); ap.add_argument('--cel'); ap.add_argument('--mimo', action='store_true')
    a = ap.parse_args()
    p, d, stan = wczytaj(a.kody)
    dec = jl(stan.get('storage', {}).get('moje_v1_odclaude', '{}'), {})
    if a.co == 'lista':
        print(f"od_claude.json: {len(d['propozycje'])} · stan.json z {stan.get('zapisano', '?')}")
        for x in d['propozycje']:
            z = dec.get(x['id'])
            print(f"  {x['id']} | {opis(x)} | {('telefon: ' + z['d'] + ' ' + datetime.fromtimestamp(z['t'] / 1000).strftime('%d.%m %H:%M')) if z else 'czeka na decyzję'}{' | ' + x['uwaga'] if x.get('uwaga') else ''}")
        return
    if a.co in ('usun', 'wyczysc'):
        n = len(d['propozycje'])
        d['propozycje'] = [x for x in d['propozycje'] if (x['id'] not in a.arg if a.co == 'usun' else x['id'] not in dec)]
        print(f"usunięto {n - len(d['propozycje'])}"); zapisz(p, d); return
    if a.co == 'zeszyt':
        t, w = a.arg[0], sorted(int(x) for x in a.arg[1].replace('·', ',').split(','))
        if t == 't50':
            assert len(w) == 3 and len(set(w)) == 3 and all(1 <= r <= 28 for r in w), 'ZESZYT T50: 3 różne wiersze 1–28'
            x = {'gdzie': 'ZESZYT', 'tabela': t, 'w': w, 'poz': a.poz, 'czekaj': a.czekaj, 'war': 'boki' if a.bok else '', 'limit': a.limit or 9}
        else:
            assert t == 't60' and 1 <= len(w) <= 3 and len(set(w)) == len(w) and all(1 <= r <= 30 for r in w), 'ZESZYT T60: 1–3 różne wiersze 1–30'
            assert a.cel in CEL60, 'ZESZYT T60: --cel 2/3xx | 1xx | 1-3xx | x1x | xx1'
            x = {'gdzie': 'ZESZYT', 'tabela': t, 'w': w, 'cel': CEL60[a.cel], 'cz': a.czekaj, 'limit': a.limit or 9}
        if a.lost:
            x['lista'] = 'lost'
    else:
        app, t, cel, nr = a.arg[0], a.arg[1], a.arg[2], int(str(a.arg[3]).lstrip('P'))
        assert app in NF and t in ('t50', 't60') and cel in ('x1x', 'xx1') and not (t == 't50' and cel != 'x1x'), 'app S / S+ / L, tabela t50 / t60, cel x1x / xx1'
        x = {'gdzie': 'MOJE' if a.co == 'moje' else 'BANK', 'tabela': t, 'app': app, 'cel': cel, 'model': f'P{nr}', 'm': S.model(app, t, cel, nr)[:NF[app]]}
    if a.uwaga:
        x['uwaga'] = a.uwaga[:300]
    if w_telefonie(x, stan) and not a.mimo:
        sys.exit(f"{opis(x)} już jest w telefonie (stan.json) — nic nie dodaję (--mimo, żeby i tak zaproponować)")
    klucz = lambda y: {k: v for k, v in y.items() if k not in ('id', 'uwaga')}
    if any(klucz(y) == klucz(x) and y['id'] not in dec for y in d['propozycje']):
        sys.exit(f"{opis(x)} już czeka w od_claude.json")
    x = {'id': 'c' + format(int(time.time() * 1000), 'x'), **x}
    d['propozycje'].append(x); print('dodano:', x['id'], opis(x)); zapisz(p, d)


if __name__ == '__main__':
    main()
