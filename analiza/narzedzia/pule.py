"""Pule SZUKAJ / SZUKAJ+ / SZUKAJ LOST a kody z telefonu: na ilu kodach liczona jest każda pula i ile kodów przybyło od tego czasu.
Prośba użytkownika: odświeżać pule co 100 nowych kodów (na starcie sesji sprawdzić i zaproponować; liczy search.py w repo appki).
Użycie:  python3 pule.py [--stan ../px5060/kody/stan.json] [--repo KATALOG] [--prog 100]
         python3 pule.py --przygotuj --repo /home/user   → szukaj/dopisane.txt w każdym repo (kody od końca bazy seed_<t>.txt do Nr z telefonu)
Odświeżenie (stałe numery P — stara pula zostaje na początku, nowe modele na końcu):
  SZUKAJ i LOST:  cd <repo>/szukaj && python3 search.py t50|t60 x1x|xx1 6000000 7 --stale && python3 build_szukaj.py t50|t60
  SZUKAJ+:        cd <repo>/szukaj && python3 search.py t50|t60 x1x|xx1 && python3 build_szukaj.py t50|t60   (zawsze dopisuje na koniec)"""
import argparse, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import szukaj as S

REPO = {'S': 'szukaj{}', 'S+': 'szukaj{}plus', 'L': 'szukajbust{}'}
CELE = {'t50': ['x1x'], 't60': ['x1x', 'xx1']}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stan', default=os.path.join(S.katalog(), 'kody', 'stan.json')); ap.add_argument('--repo', default=S.katalog())
    ap.add_argument('--prog', type=int, default=100); ap.add_argument('--przygotuj', action='store_true')
    a = ap.parse_args()
    st = json.load(open(a.stan)); doz = []
    print(f"kody z telefonu: T50 Nr {st['t50']['n']} · T60 Nr {st['t60']['n']} (stan.json {st.get('zapisano', '?')})")
    for app, wz in REPO.items():
        for t in ('t50', 't60'):
            r = os.path.join(a.repo, wz.format(t[1:]), 'szukaj')
            if not os.path.isdir(r):
                print(f'  {app}{t[1:]}: brak {r}'); continue
            seed = re.sub(r'\D', '', open(os.path.join(r, f'seed_{t}.txt')).read())
            if not st[t]['kody'].startswith(seed):
                print(f'  {app}{t[1:]}: baza seed_{t}.txt NIE zgadza się z kodami z telefonu — sprawdzić przed liczeniem'); continue
            for cel in CELE[t]:
                d = json.load(open(os.path.join(r, f'pool_{t}_{cel}.json'))); ile = st[t]['n'] - d['seedN']
                if ile >= a.prog:
                    doz.append(f'{app}{t[1:]} {cel}')
                print(f"  {app}{t[1:]} {cel}: pula {len(d['pool'])} modeli, liczona do Nr {d['seedN']} · od tego czasu +{ile} kodów{'  ← do odświeżenia' if ile >= a.prog else ''}")
            if a.przygotuj:
                k = st[t]['kody'][len(seed):]
                open(os.path.join(r, 'dopisane.txt'), 'w').write(' '.join(k[i:i + 3] for i in range(0, len(k), 3)) + '\n')
                print(f'     dopisane.txt: {len(k) // 3} kodów (Nr {len(seed) // 3 + 1}–{st[t]["n"]})')
    print(('\nDO ODŚWIEŻENIA (≥ %d nowych kodów): ' % a.prog + ', '.join(doz)) if doz else '\nPule aktualne (< %d nowych kodów).' % a.prog)


if __name__ == '__main__':
    main()
