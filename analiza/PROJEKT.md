# PROJEKT: analiza modeli do gry (MOJE · SZUKAJ · RAZEM · ZESZYT)

Ten folder działa jak „projekt” w czacie: nowa sesja Claude Code czyta ten plik i od razu wie, co robimy, jak liczyć i jak odpowiadać.
Repo jest **publiczne**, więc nie zapisujemy tu zakładów ani kwot użytkownika (podaje je w rozmowie albo screenem ZAKŁADY).

## Start sesji (zawsze)

1. `bash analiza/narzedzia/pobierz.sh` — pobiera (tylko do odczytu) repo z pulami i silnikami: szukaj50/60, szukaj50plus/60plus,
   szukajbust50/60, zeszyt (do `../px5060/`).
2. Użytkownik dołącza najnowsze eksporty kodów: **T50** z RAZEM (`v13_…kod.json`, `"app": "v13_troika"`, pole `codes`) i **T60**
   z RAZEM (`xx1_pikoff_…_n…json`, `"kind": "xx1_pikoff"`, pole `codes`). Zawsze sprawdzić, że stare kody są początkiem nowych.
3. `python3 analiza/narzedzia/stan.py --t50 <T50.json> --t60 <T60.json> [--tylko-wybor] [--grupa "ZESZYT T50"]`
   → dla każdego modelu z `MODELE.json`: krok i stawka teraz, najbliższy zakład (Nr albo warunek), historia zamknięcia od obecnego
   kroku (i obie połowy historii), realna szansa do limitu, LOST-y, po LOST, ile do limitu.
4. Screeny użytkownika: nowe modele dopisać do `MODELE.json` (i sprawdzić, że WIN / LOST / „ostatnie” / krok zgadzają się z kartą).

## Jak odpowiadać (prośby użytkownika)

- Po polsku, **krótko**: „daj modele, analizę zachowaj dla siebie”. Długie wyliczenia tylko na prośbę.
- Wybór: **po 4 modele osobno** dla MOJE T50, MOJE T60, ZESZYT T50, ZESZYT T60 (+ T60 ZESZYT, jeśli są screeny).
- Przy każdym modelu: krok · stawka · **dokładny Nr** albo warunek („Nr 15 420, jeśli na 15 419 padnie 100/101”) · limit.
- Na prośbę „jak screen”: obraz z kartami wyciętymi ze screenów użytkownika + 1 linia pod kartą (`narzedzia/karty.py`) + stopka
  „Czym się kierowałem” (3–4 punkty). Wysyłać plikiem (SendUserFile), nie opisywać długo.
- Nie wybierać „po najniższej stracie” (użytkownik wyraźnie nie chce) — koszt do limitu podawać tylko jako fakt.
- Głos rozsądku: jedno zdanie, bez wykładu (użytkownik wie, że kurs 3,0 i ~29% na zakład dają stratę na dłuższą metę).

## Kryteria wyboru (ustalone)

1. Najwyższy **% zamknięcia gry w historii modelu od kroku, na którym jest teraz** (np. 99 z 99), przy ≥ ok. 20–30 przypadkach.
2. **Realna szansa** = 1 − (1 − p)^(kroki do limitu), p = zwykła częstość celu. Sprawdzenie na późniejszych kodach pokazało, że liczy się
   liczba kroków do limitu, a nie historia — więc przy równej historii wyżej model z większą liczbą kroków przed sobą.
3. Odpadają: słaba historia od obecnego kroku (k7–k8: 25–88%), cele rzadkie (2/3xx), XX+ w T50 (25%).
4. „Po LOST” liczyć jak inne (sprawdzenie: bez różnicy). Jeden model = jedna kopia; dwa modele na tym samym wierszu = podwójna stawka
   na jeden mecz (mówić o tym).

## Jak liczą aplikacje (skrót)

- **SZUKAJ / SZUKAJ+ / SZUKAJ LOST** (`narzedzia/szukaj.py`, 1:1 z `szukaj*/szukaj/engine.py`): model `[typ, STEP, x, TRIGGER, off, tn, STEP2]`,
  STEP ×x pod rząd → [STEP2 raz] → TRIGGER ×tn → zakład na ostatnim TRIGGER + off. Wzorzec `p → q` = dwa kolejne kody, `∪` = lub,
  `x` = dowolna cyfra. Progresja K8 trwała 8 · 8 · 16 · 32 · 64 · 128 · 256 · 512 zł, kurs 3,0, przegrany k8 = LOST („BUST” w kodzie).
  Nazwa **P{n} = pula[n − 1]**; T60 ma osobne pule dla x1x i xx1. Literki na karcie MOJE: S = SZUKAJ, S+ = SZUKAJ+, L = SZUKAJ LOST, R = RAZEM.
- **MOJE BANK +3 / +5**: bank gra pierwsze 3 (5) zakłady cyklu modelu, bez limitu (k9 1024, k10 2048 …). Karta BANK pokazuje stawkę
  banku, nie modelu — przy grze krokiem modelu przenieść model do TERAZ.
- **RAZEM T60**: MIX3 T1+5 (HIT = 101/201/301, STEP = 100/200/300, inne kody się nie liczą; po cyklu M = 1 gramy cykl o 5 dalej);
  TOP7 M3 = silnik 1T (`['S', '001∪010∪200', 3, '000∪101', 4]`, x1x).
- **ZESZYT T50** (`zeszyt/silnik.js`): karta = 2 połowy × 28 wierszy (karta 0 i 1 inaczej). Model = 3 wiersze połowy; krok = wiersz modelu.
  **Pusta trójka** = na 3 wierszach modelu x0x (dla XX+: xx0). Po `czekaj` pustych trójkach gra od następnej połowy do WIN; `limit` = krok
  maks. Nazwy: `16·18·27`, `+bok` (warunek „+ z boku”), `XX+` (gra na końcu), `×2` (po 2 pustych), `k10` (limit ≠ 9).
- **ZESZYT T60** (`zeszyt/silnik60.js`): strony po 30 wierszy od Nr 1. Kod T60: 1. cyfra 0 brak gola 40–50', 1 gol 40–45', 2 gol 46–50',
  3 oba; 2. cyfra gol 50–60' (x1x); 3. cyfra gol 60–70' (xx1). Cele 1xx, 2/3xx, x1x, xx1.

## Ustalenia z analiz (fakty, nie powtarzać użytkownikowi bez potrzeby)

- Częstość: T50 x1x 28,8%, T50 „XX+” (xx1) 25,0%; T60 x1x 28,5%, xx1 28,4% (na Nr 12 838–13 027 aż 39,5% — seria), 1xx 17,7%, 2/3xx 13,4%.
  Ciąg bez pamięci (test po poprzednim kodzie: bez zależności).
- Pule SZUKAJ na nowych kodach trafiały tyle, ile zwykła częstość; historyczne „0 LOST” to efekt wyboru z milionów modeli.
- ZESZYT, sprawdzenie (wybór na 65% kodów → potem): modele zamykające od k5 w 100% zamykały potem 81% — tyle co pozostałe; zamknięcie
  zależy od liczby kroków do limitu. Gra zaraz po LOST-cie przegrywała 4,4% (zwykle 4,2–4,6%).
- ZESZYT 11·13·14 / 11·15·17 / 6·11·27: „po 1 pustej” 0 BUST (do k10), bo LOST wymaga 4 pustych połów z rzędu; „od razu po WIN” do k9 —
  12–15 LOST-ów w historii (3 puste połowy). 7 × 000 na wspólnych wierszach (6, 11, 13, 14, 15, 17, 27) nigdy; wspólna przegrana połowa
  (x0x na wszystkich 7) 51 razy na 548. W grach po pustej trójce nigdy 9 × 000.

## Pułapki zauważone

- MOJE: TOP7 M3 pokazywał k1, a tabela TOP7 liczy k5. MIX3 T1+5: karta „x1x” i „WIN 247”, z kodów 69 gier / 0 LOST, krok się zgadza.
- ZESZYT T60: 1xx 3·8·21 jest dwa razy (k10 i k12) — to ta sama gra.
- Zakład zapisany na inny Nr niż wiersz modelu → MOJE pokazuje „model nie grał” (np. P6003 Nr 15 400 zamiast 15 398).

## Pliki

```
analiza/PROJEKT.md          ten opis (czytać na starcie)
analiza/MODELE.json         modele ze screenów (wybor = aktualnie polecany), bez zakładów
analiza/narzedzia/pobierz.sh  pobranie repo z pulami / silnikami
analiza/narzedzia/stan.py     raport stanu wszystkich modeli (MOJE: szukaj.py, ZESZYT: zeszyt.js)
analiza/narzedzia/szukaj.py   silnik SZUKAJ (1:1) + MIX3 v14 + statystyki od kroku, najbliższy zakład
analiza/narzedzia/zeszyt.js   ZESZYT T50 / T60 silnikami aplikacji: stan, plan kroków z Nr i stawkami
analiza/narzedzia/karty.py    obraz „jak screen” z kart użytkownika (spec JSON)
```
