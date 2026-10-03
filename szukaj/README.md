# SZUKAJ — wyszukiwarka modeli STEP → TRIGGER → zakład

Strona `../szukaj.html` (otwierasz ją obok appki RAZEM, np. `…/szukaj.html`).

- **Kody** są wspólne z RAZEM: ten sam klucz pamięci (`t50razem_v1_added` / `t60razem_v1_added`).
  Kod wpisany tu widać w RAZEM i odwrotnie. ⟲ cofa ostatni kod w obu miejscach.
- **Silnik** = FSM 1:1 z silnikiem 1T z RAZEM: STEP (SERIA ×x albo UKŁAD) → TRIGGER → zakład na TRIGGER+offset,
  progresja trwała K8 (8, 8, 16, 32, 64, 128, 256, 512), kurs 3,0. Zgodność sprawdzona (`check.py`: 8 modeli 1T
  z wzorcem z appki, `xcheck.py`: silnik JS ze strony = engine.py).
- **Kryteria** (domyślne, zmieniane na stronie): do 200 cykli max 5 BUST, do 300 max 9, do 400 max 11,
  ponad 400 max 11 (te pokazywane zawsze najwyżej, ★), min. 100 cykli.
  Sprawdzane po każdym kodzie na całym ciągu (baza + dopisane).
- **GRA** pokazuje modele spełniające kryteria, które są na kroku 5 / 6 / 7 (64 / 128 / 256 zł):
  GRA na następnym wierszu, zakład ustawiony, STEP otwarty (z kodami, które dadzą TRIGGER).
- **TABELA**: wybierz model (albo dotknij karty na GRA) — na ciąg kodów nanoszone są jego etykiety
  (STEP, TRIGGER, przed grą, krok i stawka, WIN / przegrana / BUST), najnowsze u góry.
- **DZIENNIK** rozlicza każdy pokazany zakład k5–k7 na nowych kodach (od końca bazy), żeby było widać
  rzeczywistą trafność podpowiedzi wobec progu 33,3%.
- **SZUKAJ** losuje kolejne 20 000 konfiguracji w telefonie i dopisuje te, które spełniają kryteria.

## Pula z chmury (duże przeszukanie)

```
pip install numba numpy
python3 search.py t50 x1x            # T60: python3 search.py t60 x1x ; python3 search.py t60 xx1
python3 build_szukaj.py t50          # T60: python3 build_szukaj.py t60   → ../szukaj.html
```

`search.py` liczy kilka milionów konfiguracji na seedzie z `../index.html` (+ kody z `dopisane.txt`, jeśli jest)
i zapisuje pulę warstwową: najlepsze wg BUST/cykl w przedziałach 401+ / 100–200 / 201–300 / 301–400 cykli.
Kolejne uruchomienia z innym ziarnem i `--dolacz` dokładają modele do istniejącej puli:
`python3 search.py t50 x1x 6000000 21 --dolacz`.
