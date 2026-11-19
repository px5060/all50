"""🔎 Wyszukaj najlepsze — tylko na prośbę użytkownika (przycisk w MOJE → OCENY; nic nie liczy się samo).
MOJE zapisuje prośbę (szukaj.json) w prywatnym repo z kodami; zadanie GitHuba (.github/workflows/najlepsze.yml w tym repo) uruchamia:
  python3 najlepsze.py --prosba ../px5060/kody/szukaj.json --zapisz
Szuka w całych pulach SZUKAJ / S+ / LOST i we wszystkich układach ZESZYTU modeli, które grają teraz, w dwóch zakresach (prośba użytkownika):
  k1–k3 — ułożone wg wygranej do k3 od obecnego kroku w historii,
  k4–k6 — (modele po przekroczeniu k3) wg wygranej do k6 od obecnego kroku; k7–k8 pomijam.
  SZUKAJ: zakład już ustawiony na jednym z --za najbliższych wierszy (po triggerze, jak teraz.py); ZESZYT: układ gra (GRA teraz), najbliższy
  wiersz modelu na najbliższej stronie (T50 28, T60 30 wierszy). ≥ --min przypadków od kroku; do oceny tylko historia do k8 / limitu ≥ 95%.
Każdy kandydat przez ocena.py (cała gra do k8 / limitu: historia, uczciwa szansa, symulacja, nakładanie, skala 9 pkt → werdykt); do telefonu
najwyżej --na-grupe z werdyktem GRAĆ na grupę (SZUKAJ T50, SZUKAJ T60, ZESZYT T50, ZESZYT T60) w każdym zakresie — pole auto: "najlepsze".
Nowa prośba podmienia poprzednie propozycje bez decyzji; nie proponuje modelu z telefonu, z oceną z sesji ani z decyzją z ostatnich --dni dni.
Pamięć „bez GRAĆ przy tym samym stanie” (krok + wiersz) w oceny.json → najlepsze.odrzucone — ten sam model nie jest oceniany znowu.
Ręcznie (sesja): python3 najlepsze.py [--zapisz]   (bez --prosba: liczy od razu)"""
import argparse, json, os, subprocess, sys, time
from datetime import datetime

TU = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TU)
GRUPY = ('SZUKAJ T50', 'SZUKAJ T60', 'ZESZYT T50', 'ZESZYT T60')
ZAKRESY = (('k1–k3', 1, 3), ('k4–k6', 4, 6))   # (nazwa, od kroku, do kroku = krok, do którego liczę wygraną)
STRONA = {'t50': 28, 't60': 30}               # ZESZYT: połowa karty T50 / strona T60
AUTO = 'najlepsze'                            # pole „auto” oceny: wynik przycisku „Wyszukaj najlepsze”


def katalog():
    return os.environ.get('PX5060') or os.path.join(TU, '..', '..', '..', 'px5060')


def jl(s, d):
    try:
        v = json.loads(s)
        return v if v is not None else d
    except Exception:
        return d


def wczytaj(p):
    return jl(open(p, encoding='utf-8').read(), {}) if p and os.path.exists(p) else {}


def kandydaci_szukaj(S, kandydaci, stan_path, za, minimum):
    out = {}
    for t in ('t50', 't60'):
        X = S.kody(stan_path, t); L = []
        K, _ = kandydaci(t, X, 1, 6, za, ['x1x'] if t == 't50' else ['x1x', 'xx1'], minimum)
        for r in K:
            k = r['k']
            L.append(dict(id=f"{r['app']}|{t}|{r['cel']}|P{r['nr']}", nazwa=f"{r['app']}{t[1:]} {r['cel']} P{r['nr']}", k=k, nr=r['bet'],
                          do=lambda n, c=r['cnt'], k=k: sum(c[k - 1:n]), r=r['reach'], w=r['w'], lim=8,
                          kw=dict(app=r['app'], tabela=t, cel_lub_wiersze=r['cel'], nr=str(r['nr']))))
        out['SZUKAJ ' + t.upper()] = L
    return out


def kandydaci_zeszyt(zid, CELN, stan_path, minimum):
    wyn = subprocess.run(['node', os.path.join(TU, 'zeszyt_skan.js'), stan_path, stan_path, '6', str(minimum), '0', '3'],
                         capture_output=True, text=True, env={**os.environ, 'JSON_OUT': '1', 'PX5060': katalog()}, check=True)
    out = {}
    for linia in wyn.stdout.splitlines():
        if not linia.startswith('{'):
            continue
        d = json.loads(linia); t = 't50' if 'T50' in d['tabela'] else 't60'; N = d['n']; L = []
        for x in d['gra']:
            df = x['def']; w = sorted(df['w'])
            if not 1 <= x['k'] <= 6 or x['nr'] - N > STRONA[t]:
                continue
            if t == 't50':
                md = {'w': w, 'poz': df.get('poz', 1), 'czekaj': df.get('czekaj', 1), 'war': df.get('war') or '', 'limit': df['limit']}
                kw = dict(app='zeszyt', tabela=t, cel_lub_wiersze=','.join(map(str, w)), poz=md['poz'], czekaj=md['czekaj'], bok=md['war'] == 'boki', limit=md['limit'])
                klucz = (tuple(w), '')
            else:
                cn = CELN.get(','.join(df['cel']))
                if not cn:
                    continue
                md = {'w': w, 'cel': cn, 'czekaj': df.get('cz', 1), 'limit': df['limit']}
                kw = dict(app='zeszyt', tabela=t, cel_lub_wiersze=','.join(map(str, w)), cel=cn, czekaj=md['czekaj'], limit=md['limit'])
                klucz = (tuple(w), cn)
            L.append(dict(id=zid(t, md), nazwa=f"ZESZYT {t.upper()} {x['nazwa']}", k=x['k'], nr=x['nr'], r=x['r'], w=x['w'], lim=x['LL'], klucz=klucz,
                          do=lambda n, kon=x['kon'], k=x['k']: sum(kon[:max(0, n - k + 1)]), kw=kw))   # wygrane do kroku n: kon[0 … n − k]
        out['ZESZYT ' + t.upper()] = L
    return out


def oznacz(wpis, c, g, zakres, dk):
    wpis['auto'] = AUTO; wpis['zakres'] = zakres
    wpis['krotko'] = f'🔎 Najlepsze {zakres} · ' + wpis.get('krotko', '')
    wd = c['do'](dk)
    wpis['sekcje'].insert(0, {'tytul': f'🔎 Wyszukaj najlepsze — {zakres} (Twoja prośba z MOJE)', 'wiersze': [
        f"teraz k{c['k']}, najbliższy zakład Nr {c['nr']} · wygrana do k{dk} od tego kroku w historii: {wd}/{c['r']} ({100 * wd / c['r']:.0f}%)"
        f" · do k{c['lim']}: {c['w']}/{c['r']} ({100 * c['w'] / c['r']:.0f}%)",
        f"najwyższa wygrana do k{dk} w grupie {g} wśród modeli, które grają teraz na {zakres} (z werdyktem GRAĆ); k7–k8 pomijam",
        f"ocena obejmuje całą grę do k{c['lim']}; nowe „Wyszukaj najlepsze” podmienia propozycje, o których jeszcze nie zdecydowałeś"]})
    return wpis


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stan', default=os.path.join(katalog(), 'kody', 'stan.json')); ap.add_argument('--kody', default=os.path.join(katalog(), 'kody'))
    ap.add_argument('--prosba', help='szukaj.json z MOJE (pole t) — liczy tylko nową prośbę'); ap.add_argument('--za', type=int, default=5)
    ap.add_argument('--na-grupe', type=int, default=1, help='najwyżej tyle propozycji GRAĆ na grupę w każdym zakresie')
    ap.add_argument('--ocen', type=int, default=25, help='najwyżej tyle nowych ocen na grupę i zakres'); ap.add_argument('--min', type=int, default=20)
    ap.add_argument('--dni', type=int, default=14); ap.add_argument('--zapisz', action='store_true')
    a = ap.parse_args()
    stan = json.load(open(a.stan, encoding='utf-8')); po = os.path.join(a.kody, 'oceny.json'); d = wczytaj(po)
    meta = d.get('najlepsze') or {}; pr = wczytaj(a.prosba); t_pr = pr.get('t') or int(time.time() * 1000)
    if a.prosba and meta.get('zlecono', 0) >= t_pr:
        print(f"prośba z {pr.get('zlecono', t_pr)} już obsłużona ({meta.get('zrobiono')}) — nic do liczenia"); return

    import szukaj as S
    from teraz import kandydaci
    from ocena import CELN, kalibracja, modele_telefonu, ocen, stan_oceny, zid
    t0 = time.time(); K = kalibracja(); St = stan.get('storage', {}); dec = jl(St.get('moje_v1_ocdec', '{}'), {})
    gr = time.time() * 1000 - a.dni * 86400000; decyzja = {}
    for klucz, v in dec.items():
        if isinstance(v, dict):
            i = klucz.rsplit('|', 1)[0]; decyzja[i] = max(decyzja.get(i, 0), v.get('t', 0))
    L = d.get('oceny', []); reczne = {o['id'] for o in L if not o.get('auto')}; tel = {x[0] for x in modele_telefonu(stan)}
    kody_do = {'t50': stan['t50']['n'], 't60': stan['t60']['n']}
    stare = [o for o in L if o.get('auto') and not any(stan_oceny(o, stan, dec)[:2])]   # poprzednie propozycje bez decyzji — podmieniam
    odrz = meta.get('odrzucone') or {}; odrz2 = {}
    kand = {**kandydaci_szukaj(S, kandydaci, a.stan, a.za, a.min), **kandydaci_zeszyt(zid, CELN, a.stan, a.min)}
    baza = dict(stan=a.stan, kody=a.kody, limit=None, poz=1, czekaj=1, bok=False, cel=None, zapisz=False, rodzaj=None, dni=a.dni, werdykt=None, powod=None, m=None, nr=None)
    nowe, raport, wybrane, podsum = [], [], set(), {}
    for g in GRUPY:
        for zakres, k0, dk in ZAKRESY:
            C = [c for c in kand.get(g, []) if k0 <= c['k'] <= dk]
            for c in C:
                c['st'] = f"k{c['k']}@{c['nr']}"
                if odrz.get(c['id'], '').split('|')[0] == c['st']:
                    odrz2[c['id']] = odrz[c['id']]
            C.sort(key=lambda c: (-round(c['do'](dk) / c['r'], 2), -c['w'] / c['r'], -c['r']))   # 75% = 75% (zaokrąglone), potem do k8 / limitu
            wyb, n_ocen, bylo = [], 0, set()
            for c in C:
                if len(wyb) >= a.na_grupe or n_ocen >= a.ocen:
                    break
                if (c['id'] in wybrane or c['id'] in reczne or c['id'] in tel or decyzja.get(c['id'], 0) > gr or c['w'] < 0.95 * c['r']
                        or c.get('klucz') in bylo or odrz2.get(c['id'], '').split('|')[0] == c['st']):
                    continue
                wpis = ocen(argparse.Namespace(**{**baza, **c['kw']}), stan, K, cicho=True); n_ocen += 1
                if wpis['rodzaj'] == 'propozycja' and wpis['werdykt'] == 'GRAĆ':
                    nowe.append(oznacz(wpis, c, g, zakres, dk)); wyb.append(c['nazwa']); wybrane.add(c['id'])
                    if c.get('klucz'):
                        bylo.add(c['klucz'])   # ZESZYT: te same wiersze z innym limitem / „+ z boku” — raz
                    wd = c['do'](dk)
                    raport.append(f"  + {g} {zakres}: {c['nazwa']} · k{c['k']} Nr {c['nr']} · do k{dk} {wd}/{c['r']} ({100 * wd / c['r']:.0f}%) · do k{c['lim']} {c['w']}/{c['r']} — GRAĆ")
                else:
                    odrz2[c['id']] = f"{c['st']}|{wpis['werdykt']}"
            if not wyb:
                raport.append(f"  · {g} {zakres}: brak modelu z GRAĆ (grają teraz: {len(C)}, z historią ≥ 95%: {sum(c['w'] >= 0.95 * c['r'] for c in C)}, ocenionych: {n_ocen})")
            podsum[f'{g} {zakres}'] = ', '.join(wyb) or 'brak GRAĆ'
    print(f"🔎 Wyszukaj najlepsze (kody do Nr T50 {kody_do['t50']} / T60 {kody_do['t60']}; k1–k3 wg wygranej do k3, k4–k6 wg wygranej do k6; "
          f"najwyżej {a.na_grupe} na grupę i zakres; {time.time() - t0:.0f} s):")
    print('\n'.join(raport))
    ids_nowe = {w['id'] for w in nowe}; stare_id = {id(o) for o in stare}
    L2 = [o for o in L if id(o) not in stare_id and not (o.get('auto') and o['id'] in ids_nowe)] + nowe
    print(f"oceny.json: nowych propozycji {len(nowe)}, usuniętych poprzednich bez decyzji {len(stare)}")
    if a.zapisz:
        teraz = datetime.now().astimezone()
        d['oceny'] = L2[-200:]; d.setdefault('opis', 'Oceny modeli od Claude (ocena.py) — MOJE → OCENY.'); d['zapisano'] = teraz.isoformat(timespec='minutes')
        d['najlepsze'] = {'opis': '🔎 Wyszukaj najlepsze (najlepsze.py, zadanie GitHuba w tym repo) — na prośbę z MOJE', 'zlecono': t_pr,
                          'zrobiono': teraz.isoformat(timespec='seconds'), 'zrobiono_t': int(teraz.timestamp() * 1000), 'kody_do': kody_do,
                          'znaleziono': len(nowe), 'grupy': podsum, 'odrzucone': odrz2}
        json.dump(d, open(po, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
