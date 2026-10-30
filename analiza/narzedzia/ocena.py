"""Ocena jednego modelu (prośba użytkownika: przy każdej analizie modelu na życzenie te same kroki, a wynik trafia do MOJE → OCENY).
  1. Stan teraz — krok, stawka, najbliższy zakład.
  2. Historia (kryterium użytkownika) — wygrana do k8 (ZESZYT: do limitu) od obecnego kroku i w 3 krokach, obie połowy historii.
  3. Uczciwa szansa — kalibracja.json (czy historia przewidywała na kodach, których wybór nie znał) + jak łatwo o taki wynik przypadkiem.
  4. Symulacja — Monte Carlo przyszłych kodów (SZUKAJ) / plan wierszy (ZESZYT): wygrana, LOST, koszt, czas.
  5. Nakładanie — czy model gra na tych samych wierszach co modele w MOJE (podwójna stawka na jeden mecz).
  6. Werdykt (GRAĆ / OBSERWUJ / NIE GRAĆ) i czym się kierowałem.
Rodzaj (prośba użytkownika): model, którego telefon nie ma = propozycja Claude (w MOJE: „＋ Dodaj do MOJE” / „Usuń analizę”); model, który
użytkownik sam dodał do MOJE / ZESZYTU = ocena jego modelu („Zostaw w MOJE” / „Usuń z MOJE”). Rozpoznaje stan.json, --rodzaj wymusza.
Użycie:  python3 ocena.py S+ t60 xx1 2496 [--stan ../px5060/kody/stan.json] [--zapisz]
         python3 ocena.py zeszyt t50 19,20,28 --limit 10 [--poz 1] [--czekaj 1] [--bok] [--zapisz]
         python3 ocena.py zeszyt t60 6,11,18 --cel x1x --limit 10 [--czekaj 1] [--zapisz]
         python3 ocena.py lista            oceny w oceny.json i decyzje z telefonu
         python3 ocena.py wyczysc [--dni 14]  usuwa z oceny.json oceny załatwione na telefonie dawniej niż N dni
--zapisz: dopisuje / podmienia ocenę w oceny.json w repo z kodami (MOJE → OCENY); potem commit i push (git pull --rebase przed)."""
import argparse, json, math, os, random, subprocess, sys, tempfile
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S

TU = os.path.dirname(os.path.abspath(__file__))
NF = {'S': 5, 'S+': 7, 'L': 5}
PFX = {'S': '_szukaj_v1_', 'S+': '_szukajp_v1_', 'L': '_szbust_v1_'}
CEL60 = {'2/3xx': ['2', '3'], '1xx': ['1'], '1-3xx': ['1', '2', '3'], 'x1x': ['x1x'], 'xx1': ['xx1']}
ILE_UKLADOW = {'t50': 3276 * 4, 't60': (435 + 4060) * 4}   # ZESZYT: przeszukiwane układy (do „szansy przypadku”)


def jl(s, d):
    try:
        v = json.loads(s)
        return v if v is not None else d
    except Exception:
        return d


def ogon(w, r, q):
    """P(co najmniej w wygranych z r | szansa q) — jak łatwo o taki wynik przypadkiem"""
    return sum(math.comb(r, i) * q ** i * (1 - q) ** (r - i) for i in range(w, r + 1)) if r else 1.0


def pct(a, b):
    return f'{a}/{b} ({100 * a / b:.0f}%)' if b else '—'


def kalibracja():
    p = os.path.join(TU, '..', 'kalibracja.json')
    return json.load(open(p)) if os.path.exists(p) else {}


def moje_modele(stan, tabela):
    """modele z list MOJE GRY (S / S+ / L) i BANK z telefonu: (app, cel, id, m)"""
    St = stan.get('storage', {}); out = []
    for app, pf in PFX.items():
        for cel in ('x1x', 'xx1'):
            for g in jl(St.get(f'{tabela}{pf}moje_{cel}', '[]'), []):
                if isinstance(g, dict) and isinstance(g.get('m'), list):
                    out.append((app, cel, g.get('id', '?'), g['m'][:NF[app]]))
    for b in jl(St.get('moje_v1_bank', '[]'), []):
        if isinstance(b, dict) and b.get('t') == tabela and isinstance(b.get('m'), list) and b.get('a') in NF:
            out.append((b['a'], b['tg'], (b.get('id') or '?') + ' BANK', b['m'][:NF[b['a']]]))
    seen = set(); res = []
    for x in out:
        key = (x[0], x[1], json.dumps(x[3]))
        if key not in seen:
            seen.add(key); res.append(x)
    return res


def zaklady(m, X, tabela, cel):
    ev = []; res = S.run(m, X, S.TPOS[cel], S.ALPH[tabela], ev=ev)
    return ev, res


def mc_szukaj(m, X, tabela, cel, k, n=2000, seed=7):
    """Monte Carlo: przyszłe kody losowane z częstości kodów w historii (kody bez pamięci), model gra dalej od obecnego stanu do końca cyklu"""
    alph, tp = S.ALPH[tabela], S.TPOS[cel]; rnd = random.Random(seed)
    freq = [sum(1 for c in X if c == a) for a in alph]
    _, res = zaklady(m, X, tabela, cel); N = len(X)
    wyn = []
    for _ in range(n):
        F = rnd.choices(alph, weights=freq, k=600); XS = X + F; bs = k - 1; koszt = 0; koniec = None
        if res[0] == 'PEND':
            bp = res[2]; koszt += S.ST[bs]; w = XS[bp][tp] == '1'
            if w:
                koniec = (bs + 1, bp - N + 1)
            elif bs == 7:
                koniec = (9, bp - N + 1)
            else:
                state = (0, 0, 0, bs + 1, bp + 1)
        else:
            state = res[1]
        if koniec is None:
            ev = []; S.run(m, XS, tp, alph, state=state, ev=ev)
            for bp, w, krok in ev:
                koszt += S.ST[krok - 1]
                if w:
                    koniec = (krok, bp - N + 1); break
                if krok == 8:
                    koniec = (9, bp - N + 1); break
        wyn.append((koniec or (0, None), koszt))
    return wyn


def w_telefonie(wpis, stan):
    """czy model z oceny jest w telefonie (listy MOJE GRY, BANK, ZESZYT) — wtedy to ocena modelu użytkownika"""
    St = stan.get('storage', {})
    if wpis['gdzie'] == 'ZESZYT':
        L = jl(St.get('zeszyt_v1_modele' if wpis['tabela'] == 't50' else 'zeszyt_v1_modele60', '[]'), [])
        if wpis['tabela'] == 't50':
            return any(m.get('w') == wpis['w'] and m.get('limit') == wpis['limit'] and m.get('poz', 1) == wpis['poz'] and m.get('czekaj', 1) == wpis['czekaj'] and (m.get('war') or '') == wpis['war'] for m in L if isinstance(m, dict))
        return any(m.get('w') == wpis['w'] and m.get('limit') == wpis['limit'] and m.get('cel') == wpis['cel'] and m.get('cz', 1) == wpis['cz'] for m in L if isinstance(m, dict))
    sp = json.dumps(wpis['m'][:NF[wpis['app']]])
    return any(x[0] == wpis['app'] and x[1] == wpis['cel'] and json.dumps(x[3]) == sp for x in moje_modele(stan, wpis['tabela']))


def ocena_szukaj(a, stan, K):
    tabela, cel, nr, app = a.tabela, a.cel, int(str(a.nr).lstrip('Pp')), a.app
    X = S.kody(a.stan, tabela); m = S.model(app, tabela, cel, nr); tp = S.TPOS[cel]
    p = sum(c[tp] == '1' for c in X) / len(X); p500 = sum(c[tp] == '1' for c in X[-500:]) / 500
    r = S.analiza(m, X, tabela, cel, do_k=8, okno=3); k = r['k']
    ev, _ = zaklady(m, X, tabela, cel); hh = sum(1 for e in ev if e[1]); bh = len(ev)
    w8, r8 = r['od_kroku']; w3, _ = r['w_oknie']
    n0 = (K.get('SZUKAJ') or {}).get('n0', 1e9); h = (hh + n0 * p) / (bh + n0)
    s8, s3 = 1 - (1 - h) ** max(0, 9 - k), 1 - (1 - h) ** max(0, min(3, 9 - k)); q8 = 1 - (1 - p) ** max(0, 9 - k)
    tail = ogon(w8, r8, q8)
    MC = mc_szukaj(m, X, tabela, cel, k); n = len(MC)
    win8 = sum(1 for (st, _), _ in MC if 1 <= st <= 8) / n; win3 = sum(1 for (st, _), _ in MC if 1 <= st <= min(k + 2, 8)) / n
    lost = sum(1 for (st, _), _ in MC if st == 9) / n
    koszty = sorted(c for _, c in MC); wiersze = sorted(rw for (st, rw), _ in MC if rw)
    # nakładanie z modelami w MOJE (ta sama tabela i cel): ile zakładów tego modelu wypadało na tych samych wierszach
    A = {e[0] for e in ev}; nakl = []
    for app2, cel2, id2, m2 in moje_modele(stan, tabela):
        if cel2 != cel or (app2 == app and json.dumps(m2) == json.dumps(m[:NF[app]])):
            continue
        ev2, res2 = zaklady(m2, X, tabela, cel)
        B = {e[0] for e in ev2}; wsp = len(A & B) / len(A) if A else 0
        teraz = res2[0] == 'PEND' and r.get('zaklad', '').startswith('zakład ustawiony') and f'Nr {res2[2] + 1}' in r.get('zaklad', '')
        nakl.append((wsp, f'{app2}{tabela[1:]} {id2}', teraz))
    nakl.sort(reverse=True)
    naz = f'{app}{tabela[1:]} {cel} P{nr}'
    hist_ok = r8 >= 20 and w8 / r8 >= 0.95; max_n = nakl[0][0] if nakl else 0
    if k > 8:
        werdykt = 'NIE GRAĆ'
    elif hist_ok and (w3 / r8 if r8 else 0) >= 0.75 and max_n < 0.3:
        werdykt = 'GRAĆ'
    elif r8 >= 10 and w8 / r8 >= 0.85:
        werdykt = 'OBSERWUJ'
    else:
        werdykt = 'NIE GRAĆ'
    sek = [
        ('Stan teraz', [f'k{k} {r["stawka"]} zł · {r.get("zaklad", "")}', f'cykli {r["cykle"]}, WIN {r["win"]}, LOST {len(r["lost_nr"])}' + (f' (ost. Nr {r["lost_nr"][-1]})' if r['lost_nr'] else ''),
                        f'ostatnie cykle: {" ".join(r["ost10"][-6:])}' + (' · teraz po LOST-cie' if r['po_lost_teraz'] else '')]),
        ('Historia (Twoje kryterium)', [f'wygrana k{k}→k8: {pct(w8, r8)}', f'w 3 krokach (k{r["okno"][0]}–k{r["okno"][1]}): {pct(w3, r8)}',
                                       f'połowy historii: {pct(*r["polowy"][0])} · {pct(*r["polowy"][1])}']),
        ('Uczciwa szansa', [f'zwykła częstość celu {cel}: {p:.1%} (ostatnie 500 kodów {p500:.1%})',
                            f'szansa do k8 ≈ {s8:.0%}, w 3 krokach ≈ {s3:.0%} — trafialność zakładu modelu {hh}/{bh} ({hh / bh:.1%}) ściągnięta do zwykłej (n0 = {n0:g})',
                            f'taki wynik historii przypadkiem: ok. 1 na {1 / tail:,.0f} modeli — pula SZUKAJ to miliony sprawdzonych układów'.replace(',', ' ') if tail > 0 else 'taki wynik przypadkiem: bardzo rzadko',
                            'sprawdzenie (kalibracja): modele z historią 100% trafiały potem tak jak zwykła częstość (× ' + str(next((g['wzgledem_zwyklej'] for g in (K.get('SZUKAJ') or {}).get('grupy', []) if g['historia'] == '100%'), '?')) + ')']),
        ('Symulacja (2000 losowań przyszłych kodów)', [f'wygrana do k8: {win8:.0%}, w 3 krokach: {win3:.0%}, LOST: {lost:.0%}',
                                                       f'koszt do rozstrzygnięcia: mediana {koszty[n // 2]} zł, w 90% przypadków ≤ {koszty[int(n * 0.9)]} zł' + (f', najwyżej {koszty[-1]} zł' if koszty else ''),
                                                       f'czas: mediana {wiersze[len(wiersze) // 2]} wierszy, w 90% ≤ {wiersze[int(len(wiersze) * 0.9)]} wierszy' if wiersze else 'czas: —']),
        ('Nakładanie z MOJE', [f'{x[1]}: {x[0]:.0%} zakładów na tych samych wierszach' + (' · ten sam najbliższy Nr!' if x[2] else '') for x in nakl[:3]] or ['brak modeli w MOJE na tym celu']),
        ('Czym się kierowałem', [f'historia do k8 {"≥" if hist_ok else "<"} 95% przy ≥ 20 przypadkach' + (', w 3 krokach ≥ 75%' if r8 and w3 / r8 >= 0.75 else ', w 3 krokach < 75%'),
                                 'nakładanie z MOJE ' + (f'{max_n:.0%}' if nakl else 'brak') + (' (≥ 30% = podwójna stawka)' if max_n >= 0.3 else ''),
                                 'uczciwie: historia nie przewiduje przyszłości (kalibracja) — szansa realna ≈ jak każdego modelu na tym kroku']),
    ]
    krotko = f'{naz}: k{k} {r["stawka"]} zł · historia do k8 {pct(w8, r8)} · w 3 krokach {pct(w3, r8)} · uczciwie ≈ {s8:.0%} · LOST w symulacji {lost:.0%}'
    wpis = {'id': f'{app}|{tabela}|{cel}|P{nr}', 'gdzie': 'MOJE', 'tabela': tabela, 'app': app, 'cel': cel, 'model': f'P{nr}', 'm': m[:NF[app]],
            'nazwa': naz, 'krok': k, 'stawka': r['stawka'], 'zaklad': r.get('zaklad', ''), 'werdykt': werdykt, 'krotko': krotko,
            'liczby': {'w8': w8, 'r8': r8, 'w3': w3, 'szansa8': round(s8, 3), 'szansa3': round(s3, 3), 'mc_win8': round(win8, 3), 'mc_lost': round(lost, 3), 'nakladanie': round(max_n, 3)}}
    return wpis, sek


def ocena_zeszyt(a, stan, K):
    t = a.tabela; w = sorted(int(x) for x in a.nr.replace('·', ',').split(','))
    if t == 't50':
        md = {'w': w, 'poz': a.poz, 'czekaj': a.czekaj, 'war': 'boki' if a.bok else '', 'limit': a.limit or 9}; grupa = 'ZESZYT T50'
    else:
        md = {'w': w, 'cel': a.cel or 'x1x', 'czekaj': a.czekaj, 'limit': a.limit or 9}; grupa = 'ZESZYT T60'
    f = os.path.join(tempfile.gettempdir(), 'ocena_model.json'); json.dump({grupa: [md]}, open(f, 'w'))
    out = subprocess.run(['node', os.path.join(TU, 'zeszyt.js'), f, a.stan, a.stan], capture_output=True, text=True, env={**os.environ, 'JSON_OUT': '1'})
    d = json.loads(out.stdout.strip().splitlines()[-1]); s = d['s']; L = d['Lim']; k = d['k'] if d['gra'] else 1; p = d['p']
    reach = [x for x in s if x >= k]; w8 = sum(1 for x in reach if x <= L); r8 = len(reach); w3 = sum(1 for x in reach if x <= min(k + 2, L))
    h1, h2 = s[:len(s) // 2], s[len(s) // 2:]
    pol = [pct(sum(1 for x in hh if k <= x <= L), sum(1 for x in hh if x >= k)) for hh in (h1, h2)]
    hh, bh = len(s), sum(s); n0 = (K.get('ZESZYT') or {}).get('n0', 3000); hz = (hh + n0 * p) / (bh + n0)
    s8, s3 = 1 - (1 - hz) ** max(0, L - k + 1), 1 - (1 - hz) ** max(0, min(3, L - k + 1)); q = 1 - (1 - p) ** max(0, L - k + 1)
    tail = ogon(w8, r8, q); plan = d['planNr']; koszt = sum(x['stawka'] for x in plan)
    # nakładanie: najbliższe wiersze planu a najbliższe zakłady modeli z MOJE (ta sama tabela)
    X = S.kody(a.stan, t); kolizje = []
    nr_planu = {x['nr'] for x in plan[:3]}
    for app2, cel2, id2, m2 in moje_modele(stan, t):
        r2 = S.analiza(m2, X, t, cel2)
        z = r2.get('zaklad', '')
        if z.startswith('zakład ustawiony'):
            nr2 = int(z.split('Nr ')[1].split()[0].replace('\xa0', '')) if 'Nr ' in z else 0
            if nr2 in nr_planu:
                kolizje.append(f'{app2}{t[1:]} {cel2} {id2}: zakład na Nr {nr2} — ten sam wiersz co krok ZESZYTU')
    naz = d['nazwa']; hist_ok = r8 >= 20 and w8 / r8 >= 0.95
    werdykt = 'NIE GRAĆ' if k > L else 'GRAĆ' if hist_ok and (w3 / r8 if r8 else 0) >= 0.75 and not kolizje else 'OBSERWUJ' if r8 >= 10 and w8 / r8 >= 0.85 else 'NIE GRAĆ'
    sek = [
        ('Stan teraz', [d['teraz'], f'gier {d["gier"]}, LOST {d["lost"]}' + (f' (Nr {", ".join(map(str, d["lostNr"]))})' if d['lostNr'] else ''), f'ostatnie gry: {" ".join(d["ost10"][-6:])}']),
        ('Historia (Twoje kryterium)', [f'wygrana k{k}→k{L}: {pct(w8, r8)}', f'w 3 krokach (k{k}–k{min(k + 2, L)}): {pct(w3, r8)}', f'połowy historii: {pol[0]} · {pol[1]}']),
        ('Uczciwa szansa', [f'zwykła częstość celu: {p:.1%}', f'szansa do k{L} ≈ {s8:.0%}, w 3 krokach ≈ {s3:.0%} — trafialność wiersza {hh}/{bh} ({hh / bh:.1%}) ściągnięta do zwykłej (n0 = {n0:g})',
                            f'taki wynik przypadkiem: ok. 1 na {1 / tail:,.0f} układów (w ZESZYCIE ok. {ILE_UKLADOW[t]:,} układów)'.replace(',', ' ') if tail > 0 else 'taki wynik przypadkiem: bardzo rzadko',
                            'sprawdzenie (kalibracja): układy z historią 100% trafiały potem jak zwykła częstość (× ' + str(next((g['wzgledem_zwyklej'] for g in (K.get('ZESZYT') or {}).get('grupy', []) if g['historia'] == '100%'), '?')) + ')']),
        ('Plan i koszt (zamiast losowania — każdy krok to jeden wiersz)', [', '.join(f'k{x["k"]} Nr {x["nr"]}' for x in plan[:4]) + (f' … k{plan[-1]["k"]} Nr {plan[-1]["nr"]}' if len(plan) > 4 else ''),
                                                                         f'koszt do limitu {koszt} zł; ostatni krok najpóźniej na Nr {plan[-1]["nr"]} (za {plan[-1]["nr"] - d["nKodow"]} wierszy)' if plan else 'plan: czeka na start',
                                                                         f'LOST (pudło na wszystkich krokach do k{L}): ≈ {(1 - hz) ** max(0, L - k + 1):.0%}']),
        ('Nakładanie z MOJE', kolizje or ['najbliższe 3 wiersze planu nie pokrywają się z zakładami modeli w MOJE']),
        ('Czym się kierowałem', [f'historia do k{L} {"≥" if hist_ok else "<"} 95% przy ≥ 20 przypadkach' + (', w 3 krokach ≥ 75%' if r8 and w3 / r8 >= 0.75 else ', w 3 krokach < 75%'),
                                 'kolizje z MOJE: ' + ('są' if kolizje else 'brak'), 'uczciwie: historia nie przewiduje przyszłości (kalibracja) — szansa realna ≈ jak każdego układu na tym kroku']),
    ]
    krotko = f'{naz}: {d["teraz"].split(" — ")[0]} · historia do k{L} {pct(w8, r8)} · w 3 krokach {pct(w3, r8)} · uczciwie ≈ {s8:.0%}'
    idw = '.'.join(map(str, w))
    wpis = {'id': f'Z|{t}|{idw}|{md.get("poz", "")}|{md["czekaj"]}|{md.get("war", "")}|{md.get("cel", "")}|{md["limit"]}', 'gdzie': 'ZESZYT', 'tabela': t, 'w': w,
            **({'poz': md['poz'], 'czekaj': md['czekaj'], 'war': md['war'], 'limit': md['limit']} if t == 't50' else {'cel': CEL60[md['cel']], 'cz': md['czekaj'], 'limit': md['limit']}),
            'nazwa': f'{grupa} {naz}', 'krok': k, 'stawka': plan[0]['stawka'] if plan else 8, 'zaklad': d['teraz'], 'werdykt': werdykt, 'krotko': krotko,
            'liczby': {'w8': w8, 'r8': r8, 'w3': w3, 'szansa8': round(s8, 3), 'szansa3': round(s3, 3), 'koszt': koszt}}
    return wpis, sek


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('app'); ap.add_argument('tabela', nargs='?'); ap.add_argument('cel_lub_wiersze', nargs='?'); ap.add_argument('nr', nargs='?')
    ap.add_argument('--stan', default=os.path.join(S.katalog(), 'kody', 'stan.json')); ap.add_argument('--kody', default=os.path.join(S.katalog(), 'kody'))
    ap.add_argument('--limit', type=int); ap.add_argument('--poz', type=int, default=1); ap.add_argument('--czekaj', type=int, default=1)
    ap.add_argument('--bok', action='store_true'); ap.add_argument('--cel'); ap.add_argument('--zapisz', action='store_true')
    ap.add_argument('--rodzaj', choices=['propozycja', 'moj']); ap.add_argument('--dni', type=int, default=14)
    a = ap.parse_args(); stan = json.load(open(a.stan)); K = kalibracja()
    po = os.path.join(a.kody, 'oceny.json'); dec = jl(stan.get('storage', {}).get('moje_v1_ocdec', '{}'), {})
    if a.app in ('lista', 'wyczysc'):
        d = jl(open(po).read(), {}) if os.path.exists(po) else {}; L = d.get('oceny', [])
        if a.app == 'lista':
            print(f"oceny.json: {len(L)} · decyzje z telefonu (stan.json {stan.get('zapisano', '?')})")
            for o in L:
                z = dec.get(f"{o['id']}|{o['data']}")
                print(f"  {o['data'][:16]} · {o.get('rodzaj', 'propozycja'):10} · {o['nazwa']} · {o['werdykt']} · "
                      + (f"telefon: {z['d']} {datetime.fromtimestamp(z['t'] / 1000).strftime('%d.%m %H:%M')}" if z else 'czeka na decyzję'))
            return
        gr = datetime.now().timestamp() * 1000 - a.dni * 86400000
        L2 = [o for o in L if not (dec.get(f"{o['id']}|{o['data']}") and dec[f"{o['id']}|{o['data']}"]['t'] < gr)]
        d['oceny'] = L2; json.dump(d, open(po, 'w'), ensure_ascii=False, indent=1); print(f'usunięto {len(L) - len(L2)} załatwionych (starszych niż {a.dni} dni)'); return
    if a.app.lower() == 'zeszyt':
        a.nr = a.cel_lub_wiersze; wpis, sek = ocena_zeszyt(a, stan, K)
    else:
        a.cel = a.cel_lub_wiersze; wpis, sek = ocena_szukaj(a, stan, K)
    wpis['rodzaj'] = a.rodzaj or ('moj' if w_telefonie(wpis, stan) else 'propozycja')
    wpis['data'] = datetime.now().astimezone().isoformat(timespec='minutes'); wpis['kody_do'] = {'t50': stan['t50']['n'], 't60': stan['t60']['n']}
    wpis['sekcje'] = [{'tytul': t, 'wiersze': w} for t, w in sek]
    print(f"\n{wpis['nazwa']} — {wpis['werdykt']} · {'Twój model (Zostaw / Usuń z MOJE)' if wpis['rodzaj'] == 'moj' else 'propozycja (Dodaj / Usuń analizę)'} (kody do Nr T50 {wpis['kody_do']['t50']} / T60 {wpis['kody_do']['t60']})")
    for t, w in sek:
        print(f'  {t}:'); [print(f'    {x}') for x in w]
    if a.zapisz:
        p = po; d = jl(open(p).read(), {}) if os.path.exists(p) else {}
        L = [x for x in d.get('oceny', []) if x.get('id') != wpis['id']] + [wpis]
        json.dump({'opis': 'Oceny modeli od Claude (ocena.py) — MOJE → OCENY.', 'zapisano': wpis['data'], 'oceny': L[-200:]}, open(p, 'w'), ensure_ascii=False, indent=1)
        print(f'\nzapisano {p} ({len(L)} ocen) — teraz commit i push do repo z kodami')


if __name__ == '__main__':
    main()
