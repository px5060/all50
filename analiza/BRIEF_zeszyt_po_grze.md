# BRIEF: ZESZYT T50 — „pierwsza połówka po grze” (szukania z 21–22.11.2026)

Brief do nowej sesji. Kontynuacja szukań układów ZESZYTU T50, w których zamiast grać model (start po pustej trójce) gramy
**trafienie środka na pierwszej połówce po zakończonej grze modelu** — progresją po wierszach. Najpierw przeczytaj `analiza/PROJEKT.md`
(start sesji, jak liczą appki, kody T50, sposób odpowiadania). Repo `all50` jest publiczne — bez zakładów i kwot użytkownika.

## Start sesji

1. Repo w sesji: `px5060/all50` i `px5060/kody` (prywatne — stan telefonu `stan.json`).
2. `bash analiza/narzedzia/pobierz.sh` (silniki ZESZYTU → `../px5060/zeszyt`, `../px5060/kody/stan.json`).
3. Narzędzie do wszystkich szukań poniżej: `node analiza/narzedzia/zeszyt_po_grze.js <tryb> [opcje] [--stan ../px5060/kody/stan.json]`
   (opis trybów na górze pliku). Liczy silnikiem ZESZYTU (`buildBook`, wiersze kart z `pre` / `dop`), z poprawkami kodów z ZESZYTU.

## Pojęcia (ustalone z użytkownikiem)

- **Kod T50**: 1. cyfra gol 41'–koniec 1. połowy, **2. cyfra gol 51'–60' („środek”, x1x)**, 3. cyfra gol 88'–koniec; doliczony czas się liczy,
  samobójczy liczymy, nieuznany nie (PROJEKT.md).
- **ZESZYT T50**: karta = 2 połówki (L / P) × 28 wierszy; Nr kodu ↔ wiersz połówki z silnika (`B.cards[k].parts[p][r-1]`).
  Np. karta 276 P = Nr 15 545–15 572, karta 277 L = Nr 15 573–15 600 (wiersz r ≈ Nr 15 572 + r).
- **Model (układ)** = 3 wiersze połówki (1–28). Użytkownika interesuje **tylko środek X+X (poz 1), bez „+ z boku”**, po 1 pustej trójce, limit k9 / k10.
- **Gra modelu** kończy się trafieniem środka na wierszu modelu (WIN do limitu, dalej = LOST).
- **Pierwsza połówka po grze** (pierwsza próba): następna połówka z wierszami modelu po tej, na której gra się skończyła.
  **Trafienie** środka na którymś z 3 wierszy = brak triggera (model czeka dalej). **Wszystkie 3 puste = trigger** (gra od kolejnej połówki).
- **Pomysł użytkownika**: na pierwszej połówce po grze grać środek na wierszach modelu (albo zestawu modeli — **suma wierszy**) progresją
  ZESZYTU 8 · 8 · 16 · 32 · 64 · 128 · 256 · 512 · 1024 zł, kurs 3,0, do pierwszego trafienia. „Zestaw zamyka się”, gdy którykolwiek wiersz trafi.

## Co policzyliśmy (dane: kody T50 do Nr 15 571, 22.11; środek w 28,8% kodów)

1. **Po LOST-cie, zawsze trafienie na pierwszej połówce po LOST-cie** (21.11, wiersze 12–28, karta 276 P) — tryb `polost`:
   4 układy: 13·20·24 k10 (6 LOST), 1·20·24 k9 (5), 6·20·27 k9 (4), 13·17·20 k10 (3); suma wierszy Nr 15 557 · 15 561 · 15 564 · 15 568 · 15 571.
   Wynik: środek na 15 557 (w.13) i 15 568 (w.24) → 3 z 4 powtórzyły wzór, 6·20·27 nie (trigger). Progresja po sumie wierszy weszłaby na kroku 1.
2. **Jak grać „piątkami”** — tryb `progresja --kroki 5` (cała historia T50):
   5 kolejnych kodów od trafienia: 81,7% wygranych serii, bilans −13,7%; sztywno w połówkach (1–5, 6–10 …): 81,8%, −13,6%; teoria 81,7%, −13,6%.
   **Bez różnicy, skąd startować** — kody bez pamięci; 82% wygranych serii przy kursie 3,0 to nadal strata ok. 13,6% postawionego.
3. **22.11, po LOST-cie, następna połówka 277 L**: wiersze 18–28 — **brak**; 12–28 — 13·24·27 k9 (7 LOST, po 6 wcześniejszych zawsze trafienie:
   w.13, 24, 27, 27, 13, 13; Nr 15 585 · 15 596 · 15 599); 1–18 — 1·9·13 k9 (Nr 15 573 · 15 581 · 15 585) i 6·9·13 k10 (Nr 15 578 · 15 581 · 15 585),
   po 2 wcześniejsze LOST-y (mało).
4. **Po każdej grze (WIN albo LOST), pierwsza próba na 277 L** — tryb `teraz --karta 277L`: 460 układów; najmniej triggerów od razu po grze
   (zwykle ~36%): 11·12·27 (25%), 6·21·27 (25%; równo 15/15 w obu połowach historii), 12·18·27 (27%), 3·18·24, 6·12·19 (17/17), 3·12·18, 6·19·21 (28%).
   Trafienie najczęściej na pierwszym wierszu układu.
5. **Zestaw tych 7 układów** — tryb `razem 11.12.27 6.21.27 12.18.27 3.18.24 6.12.19 3.12.18 6.19.21`:
   - suma wierszy na 277 L: w.3 15 575 · w.6 15 578 · w.11 15 583 · w.12 15 584 · w.18 15 590 · w.19 15 591 · w.21 15 593 · w.24 15 596 · w.27 15 599
     (9 kroków, pełna strata 2 048 zł; wersja 5 kroków do 15 590 — każdy układ ma tam wiersz, strata najwyżej 128 zł);
   - **wszystkie 9 wierszy bez środka**: teoria 4,7%, historia 28/554 połówek (5,1%); ostatnio karta 276 L (Nr 15 519–15 543),
     odstępy średnio 20,3 połówki (najdłuższy 70, najkrótszy 1);
   - **wszystkie 7 naraz na pierwszej próbie po grze** (jak na 277 L): w historii 6 razy (karty 3 P, 99 L, 109 L, 117 P, 120 P, 155 P), nigdy
     wszystkie trigger (trafienie 3–7 z 7); progresja wygrałaby na krokach 3, 4, 1, 5, 6, 8 (wersja 5 kroków: 4 z 6). ≥ 5 z 7 naraz: 25 razy,
     ≥ 6 z 7: 12 razy — nigdy wszystkie trigger (oczekiwane z przypadku ok. 1–2 przy 25; słaby znak, nie pewność).
6. **Wszystkie 3 276 układów** — tryb `ranking`: trigger od razu po grze średnio 35,8%, **najmniej 20,3% (7·13·23)**, **< 20% — żaden**,
   < 25% — 15. To tyle, ile daje sam przypadek przy ~120 grach na układ (najlepszy z 3 276 ≈ 3,5 odchylenia od 36%); u najlepszych wynik
   lepszy zwykle tylko w jednej połowie historii. „1x%” dla 3 wierszy nie istnieje.

7. **„8 kroków na stronie” jako zestaw dający 8 wierszy** (22.11, druga sesja; interpretacja do potwierdzenia) — tryb `zestawy --karta 277L`:
   460 układów na pierwszej próbie po grze na 277 L → 5,8 mln zestawów 2–3 układów z sumą dokładnie 8 wierszy (≥ 5 razy naraz w historii);
   **bez przegranej progresji, gdy wszystkie były naraz na pierwszej próbie: 2,47 mln — z przypadku oczekiwane 2,74 mln** (2–4 układy: 92,6 mln
   z 209 mln, oczekiwane 102 mln) → brak przewagi. Najlepsze (najwięcej razy naraz, 0 przegranych): 6·11·21 + 5·12·19 + 11·24·27 (26×; wiersze
   5,6,11,12,19,21,24,27 = Nr 15 577 · 15 578 · 15 583 · 15 584 · 15 591 · 15 593 · 15 596 · 15 599), 6·11·21 + 6·19·24 + 5·12·18 (25×; wiersze
   5,6,11,12,18,19,21,24 = Nr 15 577 … 15 596). U najlepszych wszystkie 8 wierszy puste w całej historii 7–10% połówek (teoria 6,6%).
   Zestaw 7 układów z p. 5 przycięty do 8 kroków (bez w.27): Nr 15 575 · 15 578 · 15 583 · 15 584 · 15 590 · 15 591 · 15 593 · 15 596,
   wszystkie puste 40/555 (7,2%); w 6 połówkach „wszystkie 7 naraz” wygrałby zawsze (najpóźniej krok 8).

## Otwarte (następna sesja)

- **Wynik karty 277 L** (Nr 15 573–15 600) dla zestawu 7 układów i dla 13·24·27 / 1·9·13 / 6·9·13 — sprawdzić, gdy w `stan.json` będą kody.
- **„8 kroków na stronie”** — policzone jako zestaw układów z sumą 8 wierszy (p. 7); użytkownik ma potwierdzić, czy o to chodziło
  (zapytany 22.11). Dla 8 wierszy: wszystkie puste ≈ 0,712⁸ ≈ 6,6%.
- Ewentualnie: zestawy układów, które **teraz** razem są na pierwszej próbie po grze, z sumą wierszy ≤ 5–8 i historią „nigdy wszystkie trigger”.
- Automat wyników (mecze → kody) — odłożony; zasady kodów T50 / T60 są w PROJEKT.md.

## Uczciwie (mówić krótko, jednym zdaniem)

Kody nie mają pamięci (sprawdzone): szansa na środek na każdym wierszu ≈ 28,8%, niezależnie od historii układu. Wzory „zawsze trafienie po
LOST-cie / po grze” przy kilku–kilkunastu przypadkach i tysiącach przeszukanych układów łatwo wychodzą przypadkiem (kalibracja w PROJEKT.md:
historia nic nie przewiduje). Progresja nie zmienia wartości oczekiwanej (−13,6% przy kursie 3,0) — zamienia częste małe wygrane na rzadkie duże straty.

## Jak odpowiadać

Po polsku, krótko; przy układzie: wiersze → **Nr** do gry (pogrubione), krok, stawka; przy zestawie — tabela kroków (Nr, wiersz, stawka, razem,
wynik przy trafieniu, które układy zamyka). Tylko **T50** (T60 użytkownik gra inaczej). Zmiany w repo przez PR, scalane po „scal”.
