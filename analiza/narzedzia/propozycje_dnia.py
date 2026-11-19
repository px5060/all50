"""Propozycje dnia — automat (prośba użytkownika): po każdym nowym zapisie stanu z telefonu (stan.json w repo kody) wybiera z całych pul
SZUKAJ / S+ / LOST i z ZESZYTU modele, które są TERAZ na krokach k1–k3 i w historii najczęściej wygrywały do k3 od kroku, na którym są
(„duży procent trafień w pierwszych trzech krokach”), ocenia je ocena.py i do MOJE → OCENY wysyła najwyżej --na-grupe z werdyktem GRAĆ
w każdej grupie: SZUKAJ T50, SZUKAJ T60, ZESZYT T50, ZESZYT T60.
  SZUKAJ: model po triggerze — zakład już ustawiony na jednym z --za najbliższych wierszy (jak teraz.py);
  ZESZYT: układ gra (GRA teraz), najbliższy wiersz modelu na najbliższej stronie (T50 28, T60 30 wierszy) — jak zeszyt_skan.js.
Nie za dużo (prośba użytkownika): propozycja dnia, która dalej spełnia warunki, zostaje (gdy model zagrał krok — ocena liczona na nowo);
ta, która przestała (wygrana, krok dalej niż k3) — znika sama, jeśli nie ma decyzji. Nie proponuje modelu, który jest w telefonie, ma ocenę
z sesji z Claude albo decyzję z ostatnich --dni dni (np. „Usuń analizę”). Oceny z sesji (bez pola auto) zostają nietknięte.
Oszczędnie (minuty GitHuba): do oceny tylko modele z historią do k8 / limitu ≥ 95% (warunek GRAĆ); model oceniony bez GRAĆ nie jest oceniany
znowu, dopóki nie zmieni się jego krok albo wiersz zakładu (pamięć w oceny.json → propozycje_dnia.odrzucone).
Uruchamia go zadanie GitHuba w prywatnym repo kody (.github/workflows/propozycje.yml); ręcznie:
  python3 propozycje_dnia.py [--stan ../px5060/kody/stan.json] [--kody ../px5060/kody] [--zapisz]
  --czy-liczyc  tylko sprawdza, czy od ostatniego liczenia zmieniło się coś, co wpływa na wybór (kody, modele w telefonie, decyzje, oceny,
                pule, narzędzia) — wypisuje liczyc=tak|nie (zadanie GitHuba: przed instalacją numba)."""
import argparse, glob, hashlib, json, os, subprocess, sys, time
from datetime import datetime

TU = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TU)
GRUPY = ('SZUKAJ T50', 'SZUKAJ T60', 'ZESZYT T50', 'ZESZYT T60')
STRONA = {'t50': 28, 't60': 30}   # ZESZYT: połowa karty T50 / strona T60
AUTO = 'dnia'                     # pole „auto” w ocenie: propozycja dnia (automat), nie z sesji


def katalog():
    return os.environ.get('PX5060') or os.path.join(TU, '..', '..', '..', 'px5060')


def jl(s, d):
    try:
        v = json.loads(s)
        return v if v is not None else d
    except Exception:
        return d


def wczytaj(p):
    return jl(open(p, encoding='utf-8').read(), {}) if os.path.exists(p) else {}


def podpis(stan, oceny):
    """skrót wszystkiego, od czego zależy wybór: kody, modele i decyzje z telefonu, oceny, pule, silniki ZESZYTU, narzędzia"""
    St = stan.get('storage', {})
    h = hashlib.sha1(json.dumps({'t50': stan.get('t50'), 't60': stan.get('t60'),
                                 'st': {k: v for k, v in St.items() if '_moje_' in k or k in ('moje_v1_bank', 'moje_v1_ocdec') or k.startswith(('zeszyt_v1_modele', 'zeszyt_v1_poprawki_'))},
                                 'oceny': [(o.get('id'), o.get('data')) for o in oceny.get('oceny', [])]}, sort_keys=True, ensure_ascii=False).encode())
    D = katalog()
    for f in sorted(glob.glob(os.path.join(D, 'szukaj*', 'szukaj', 'pool_*.json')) + glob.glob(os.path.join(D, 'zeszyt', 'silnik*.js'))
                    + glob.glob(os.path.join(TU, '*.py')) + glob.glob(os.path.join(TU, '*.js')) + [os.path.join(TU, '..', 'kalibracja.json')]):
        if os.path.exists(f):
            h.update(f.encode()); h.update(open(f, 'rb').read())
    return h.hexdigest()[:16]


def grupa(o):
    return ('ZESZYT ' if o.get('gdzie') == 'ZESZYT' else 'SZUKAJ ') + o.get('tabela', '').upper()


def kandydaci_szukaj(S, kandydaci, stan_path, k0, k1, za, minimum):
    out = {}
    for t in ('t50', 't60'):
        X = S.kody(stan_path, t); L = []
        K, _ = kandydaci(t, X, k0, k1, za, ['x1x'] if t == 't50' else ['x1x', 'xx1'], minimum)
        for r in K:
            L.append(dict(id=f"{r['app']}|{t}|{r['cel']}|P{r['nr']}", nazwa=f"{r['app']}{t[1:]} {r['cel']} P{r['nr']}", k=r['k'], nr=r['bet'],
                          do3=r['do3'], r=r['reach'], w=r['w'], do='k8', kw=dict(app=r['app'], tabela=t, cel_lub_wiersze=r['cel'], nr=str(r['nr']))))
        out['SZUKAJ ' + t.upper()] = L
    return out


def kandydaci_zeszyt(zid, CELN, stan_path, k0, k1, minimum):
    wyn = subprocess.run(['node', os.path.join(TU, 'zeszyt_skan.js'), stan_path, stan_path, '6', str(minimum), '0', '3'],
                         capture_output=True, text=True, env={**os.environ, 'JSON_OUT': '1', 'PX5060': katalog()}, check=True)
    out = {}
    for linia in wyn.stdout.splitlines():
        if not linia.startswith('{'):
            continue
        d = json.loads(linia); t = 't50' if 'T50' in d['tabela'] else 't60'; N = d['n']; L = []; bylo = set()
        for x in d['gra']:
            df = x['def']; w = sorted(df['w'])
            if not (k0 <= x['k'] <= k1) or x['nr'] - N > STRONA[t]:
                continue
            if t == 't50':
                md = {'w': w, 'poz': df.get('poz', 1), 'czekaj': df.get('czekaj', 1), 'war': df.get('war') or '', 'limit': df['limit']}
                kw = dict(app='zeszyt', tabela=t, cel_lub_wiersze=','.join(map(str, w)), poz=md['poz'], czekaj=md['czekaj'], bok=md['war'] == 'boki', limit=md['limit'])
                klucz = (t, tuple(w), '')
            else:
                cn = CELN.get(','.join(df['cel']))
                if not cn:
                    continue
                md = {'w': w, 'cel': cn, 'czekaj': df.get('cz', 1), 'limit': df['limit']}
                kw = dict(app='zeszyt', tabela=t, cel_lub_wiersze=','.join(map(str, w)), cel=cn, czekaj=md['czekaj'], limit=md['limit'])
                klucz = (t, tuple(w), cn)
            if klucz in bylo:   # te same wiersze z innym limitem / „+ z boku” — raz (lista już ułożona od najlepszego)
                continue
            bylo.add(klucz)
            L.append(dict(id=zid(t, md), nazwa=f"ZESZYT {t.upper()} {x['nazwa']}", k=x['k'], nr=x['nr'], do3=x['do3'], r=x['r'], w=x['w'],
                          do=f"k{x['LL']}", kw=kw))
        out['ZESZYT ' + t.upper()] = L
    return out


def oznacz(wpis, c, g):
    """propozycja dnia: pole auto + sekcja „dlaczego teraz” na początku oceny"""
    wpis['auto'] = AUTO; wpis['stan_dnia'] = c['st']
    wpis['krotko'] = '📅 Propozycja dnia · ' + wpis.get('krotko', '')
    wpis['sekcje'].insert(0, {'tytul': '📅 Propozycja dnia (wybór automatyczny po nowych kodach)', 'wiersze': [
        f"teraz k{c['k']}, najbliższy zakład Nr {c['nr']} · wygrana do k3 od tego kroku w historii: {c['do3']}/{c['r']} ({100 * c['do3'] / c['r']:.0f}%)"
        f" · do {c['do']}: {c['w']}/{c['r']} ({100 * c['w'] / c['r']:.0f}%)",
        f"najwyższa wygrana do k3 w grupie {g} wśród modeli, które grają teraz na k1–k3 (i mają werdykt GRAĆ)",
        'najwyżej jedna propozycja dnia na grupę; gdy model przestanie spełniać warunki (wygrana albo krok dalej niż k3), propozycja bez decyzji znika sama']})
    return wpis


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stan', default=os.path.join(katalog(), 'kody', 'stan.json')); ap.add_argument('--kody', default=os.path.join(katalog(), 'kody'))
    ap.add_argument('--kroki', default='1-3'); ap.add_argument('--za', type=int, default=5); ap.add_argument('--na-grupe', type=int, default=1)
    ap.add_argument('--ocen', type=int, default=25, help='najwyżej tyle nowych ocen na grupę w jednym liczeniu'); ap.add_argument('--min', type=int, default=20)
    ap.add_argument('--dni', type=int, default=14); ap.add_argument('--zapisz', action='store_true'); ap.add_argument('--czy-liczyc', action='store_true')
    a = ap.parse_args(); k0, k1 = map(int, a.kroki.split('-'))
    stan = json.load(open(a.stan, encoding='utf-8')); po = os.path.join(a.kody, 'oceny.json'); d = wczytaj(po)
    if a.czy_liczyc:
        print('liczyc=' + ('nie' if (d.get('propozycje_dnia') or {}).get('podpis') == podpis(stan, d) else 'tak')); return

    import szukaj as S
    from teraz import kandydaci
    from ocena import CELN, kalibracja, modele_telefonu, ocen, stan_oceny, zid
    K = kalibracja(); St = stan.get('storage', {}); dec = jl(St.get('moje_v1_ocdec', '{}'), {})
    gr = time.time() * 1000 - a.dni * 86400000; decyzja = {}
    for klucz, v in dec.items():
        if isinstance(v, dict):
            i = klucz.rsplit('|', 1)[0]; decyzja[i] = max(decyzja.get(i, 0), v.get('t', 0))
    meta = d.get('propozycje_dnia') or {}; odrz = meta.get('odrzucone') or {}; odrz2 = {}
    L = d.get('oceny', []); reczne = {o['id'] for o in L if not o.get('auto')}; tel = {x[0] for x in modele_telefonu(stan)}
    kody_do = {'t50': stan['t50']['n'], 't60': stan['t60']['n']}
    czeka = {}
    for o in L:
        if o.get('auto') == AUTO:
            z, w, _ = stan_oceny(o, stan, dec)
            if not z and not w:
                czeka.setdefault(grupa(o), []).append(o)
    kand = {**kandydaci_szukaj(S, kandydaci, a.stan, k0, k1, a.za, a.min), **kandydaci_zeszyt(zid, CELN, a.stan, k0, k1, a.min)}
    baza = dict(stan=a.stan, kody=a.kody, limit=None, poz=1, czekaj=1, bok=False, cel=None, zapisz=False, rodzaj=None, dni=a.dni, werdykt=None, powod=None, m=None, nr=None)
    nowe, zostaja, usun, raport = [], [], [], []
    for g in GRUPY:
        C = sorted(kand.get(g, []), key=lambda c: (-round(c['do3'] / c['r'], 2), -c['w'] / c['r'], -c['r']))   # 75% = 75% (zaokrąglone), potem do limitu
        po_id = {c['id']: c for c in C}; wyb = []
        for c in C:
            c['st'] = f"k{c['k']}@{c['nr']}"   # stan modelu: krok i wiersz zakładu
            if odrz.get(c['id'], '').split('|')[0] == c['st']:   # pamięć „bez GRAĆ” zostaje, dopóki stan modelu ten sam
                odrz2[c['id']] = odrz[c['id']]
        for o in czeka.get(g, []):   # propozycja dnia bez decyzji: zostaje, dopóki model spełnia warunki i ma GRAĆ
            c = po_id.get(o['id'])
            if not c or len(wyb) >= a.na_grupe:
                usun.append(o); raport.append(f"  − {g}: {o['nazwa']} — {'nie spełnia już warunków' if not c else 'ponad limit na grupę'}"); continue
            if o.get('stan_dnia') == c['st']:   # model nie zagrał od oceny — ocena aktualna („teraz” MOJE liczy na bieżąco)
                zostaja.append(o); wyb.append(o['id']); raport.append(f"  = {g}: {o['nazwa']} — bez zmian ({c['st']})"); continue
            wpis = ocen(argparse.Namespace(**{**baza, **c['kw']}), stan, K, cicho=True)
            if wpis['werdykt'] == 'GRAĆ' and wpis['rodzaj'] == 'propozycja':
                nowe.append(oznacz(wpis, c, g)); wyb.append(c['id']); raport.append(f"  ↻ {g}: {c['nazwa']} — dalej GRAĆ (ocena na nowych kodach)")
            else:
                odrz2[c['id']] = f"{c['st']}|{wpis['werdykt']}"; usun.append(o); raport.append(f"  − {g}: {o['nazwa']} — teraz {wpis['werdykt']}")
        n_ocen = 0
        for c in C:
            if len(wyb) >= a.na_grupe or n_ocen >= a.ocen:
                break
            if c['id'] in wyb or c['id'] in reczne or c['id'] in tel or decyzja.get(c['id'], 0) > gr or c['w'] < 0.95 * c['r']:
                continue
            if odrz2.get(c['id'], '').split('|')[0] == c['st']:   # oceniony przy tym samym stanie — bez GRAĆ
                continue
            wpis = ocen(argparse.Namespace(**{**baza, **c['kw']}), stan, K, cicho=True); n_ocen += 1
            if wpis['rodzaj'] != 'propozycja':
                continue
            if wpis['werdykt'] == 'GRAĆ':
                nowe.append(oznacz(wpis, c, g)); wyb.append(c['id'])
                raport.append(f"  + {g}: {c['nazwa']} · k{c['k']} Nr {c['nr']} · do k3 {c['do3']}/{c['r']} ({100 * c['do3'] / c['r']:.0f}%) · do {c['do']} {c['w']}/{c['r']} — GRAĆ")
            else:
                odrz2[c['id']] = f"{c['st']}|{wpis['werdykt']}"
                raport.append(f"    {g}: {c['nazwa']} · do k3 {c['do3']}/{c['r']} — {wpis['werdykt']} (pominięty)")
        if not wyb:
            raport.append(f"  · {g}: brak modelu z GRAĆ (kandydatów na k{k0}–k{k1}: {len(C)}, z historią ≥ 95%: {sum(c['w'] >= 0.95 * c['r'] for c in C)},"
                          f" ocenionych teraz: {n_ocen}, bez GRAĆ przy tym samym stanie: {sum(1 for c in C if c['id'] in odrz2)})")
    print(f"Propozycje dnia (kody do Nr T50 {kody_do['t50']} / T60 {kody_do['t60']}; k{k0}–k{k1}, najwyżej {a.na_grupe} na grupę):")
    print('\n'.join(raport))
    ids_nowe = {w['id'] for w in nowe}; usun_id = {id(o) for o in usun}
    L2 = [o for o in L if not (o.get('auto') == AUTO and (id(o) in usun_id or o['id'] in ids_nowe))] + nowe
    zmiana = len(L2) != len(L) or any(x is not y for x, y in zip(L2, L))
    print(f"oceny.json: {'zmiana' if zmiana else 'bez zmian'} (propozycji dnia czeka: {len(zostaja) + len(nowe)})")
    if a.zapisz:
        teraz = datetime.now().astimezone().isoformat(timespec='minutes')
        d['oceny'] = L2[-200:]; d.setdefault('opis', 'Oceny modeli od Claude (ocena.py) — MOJE → OCENY.')
        if zmiana:
            d['zapisano'] = teraz
        d['propozycje_dnia'] = {'opis': 'automat propozycje_dnia.py (zadanie GitHuba w tym repo)', 'liczono': teraz, 'kody_do': kody_do,
                                'czeka': sorted(o['id'] for o in zostaja + nowe), 'odrzucone': odrz2}
        d['propozycje_dnia']['podpis'] = podpis(stan, d)
        json.dump(d, open(po, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
