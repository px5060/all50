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

8. **Wynik 277 L** (kody do Nr 15 601, 26.11): zestaw 7 układów — środek na w.3 (Nr 15 575) = krok 1; z 7 układów 5 trafiło, trigger 12·18·27
   i 6·12·19. 13·24·27 (po LOST-cie „zawsze trafienie”) — **trigger** (wzór się urwał); 1·9·13 trafienie w.1, 6·9·13 w.9. Zestawy 8 wierszy z p. 7 — krok 1.
9. **Tabele „teraz pierwsza próba po grze”, T50 i T60** (26.11) — `teraz` (T50, karta 277 P, w.1 = Nr 15 601 już rozegrany) i `teraz --t60 --cel x1x|xx1
   --min 60` (strony 441 / 442). Narzędzie liczy też ZESZYT T60 (`--t60`, strony po 30 wierszy, układy 3 wierszy, po 1 pustej stronie).
   T50 (849 układów, zwykle bez triggera od razu 63,6%): najlepsze 3·16·18 (76%), 10·20·25, 6·10·25, 3·18·19 (75%). T60 x1x (390, zwykle 64,6%):
   11·15·29 (80%), 5·11·15 (78%), 9·15·17, 20·23·29, 3·17·29 (76%); xx1 (580, zwykle 61,3%): 3·17·26 (78%), 15·18·24 (75%).

10. **Zestawy na 277 P** (kody do Nr 15 602, 26.11; w.1–2 już rozegrane) — `zestawy --karta 277P --wierszy 9|8`:
    9 wierszy: 4·5·19 + 3·16·27 + 9·25·28 (razem 22×, nigdy wszystkie trigger; Nr 15 603 · 15 604 · 15 605 · 15 609 · 15 616 · 15 619 · 15 625 · 15 627 · 15 628);
    14,9 mln zestawów, bez wspólnego triggera 10,6 mln (z przypadku 10,2 mln); `--max-ukl 4` przy 849 układach nie mieści się w 15 min.
    8 wierszy: 17·19·25 + 16·19·20 + 4·6·14 (29×; Nr 15 604 · 15 606 · 15 614 · 15 616 · 15 617 · 15 619 · 15 620 · 15 625) i 3·16·27 + 3·19·28 + 4·5·9
    (29×; = zestaw 9 wierszy bez w.25); 42 mln zestawów, bez wspólnego triggera 20,6 mln (z przypadku 19,3 mln). W 8 wierszach mieści się 46–55 układów
    na pierwszej próbie po grze (narzędzie wypisuje je pod zestawem).
    **Najwięcej układów naraz** (`zestawy --wierszy 8 --grupa`, zachłannie): ≥ 5× — 54 układy, ≥ 10× — 46, ≥ 15× — 34, **≥ 20× — 24 układy** (wiersze
    3,4,5,9,14,19,20,25 = Nr 15 603 · 15 604 · 15 605 · 15 609 · 15 614 · 15 619 · 15 620 · 15 625; naraz 20×, wygrana najpóźniej k7), ≥ 25× — 19 układów
    (wiersze B 3,4,5,9,16,19,27,28; wszystkie z w.3, naraz 26×). Wszystkie 8 wierszy puste w historii ok. 9,3% połówek (teoria 6,6%).

11. **T60 x1x, strona 441, wiersze 18–30** (kody do Nr 13 217, 26.11) — `zestawy --t60 --cel x1x --karta 441 --min 60 --wierszy 8 --grupa`
    (przy małej liczbie wierszy sprawdza wszystkie zestawy wierszy; xx1: na 441 brak układów na pierwszej próbie). Wiersze 18,20,22,23,25,27,29,30 =
    Nr 13 218 · 13 220 · 13 222 · 13 223 · 13 225 · 13 227 · 13 229 · 13 230: 18 układów naraz 15× (wszystkie z w.20), 22 — 12×, 25 — 10×, 31 — 8×;
    nigdy wszystkie trigger. Wszystkie 8 wierszy puste w historii 8,2% stron (teoria 6,8%).

12. **Rozszerzenie grupy 24 (T50, 277 P) o układy z w.1–2** — tryb `rozszerz <24 układy> --tylko-rozegrane --min-razem 8`: z w.2 żaden nie jest po grze
    (trafienie na 15 574 w 277 L → czekają); z w.1 i resztą w wierszach grupy 28 układów, z całą grupą naraz najwyżej 8×. Grupa 33 (24 + 1·3·14, 1·4·14,
    1·5·14, 1·9·14, 1·9·19, 1·9·25, 1·14·19, 1·14·20, 1·14·25 — każdemu zostają 2 kroki): naraz 8×, nigdy wszystkie 8 wierszy puste, w 7 z 8 w.1 też był pusty.

13. **Same układy z w.1 (T50, 277 P)** — `rozszerz --kroki 7|6`: po grze jest teraz 171 układów z w.1 (gra skończyła się środkiem na 15 573 = w.1
    karty 277 L, stąd wszystkie naraz), w.1 na 277 P (15 601) pusty → każdemu zostają 2 kroki. 9 układów z p. 12 samych: naraz 11×, ale nadal 8 wierszy.
    7 kroków: 21 układów (wszystkie pary z w.3,5,6,8,9,16,17 + w.1), naraz 21×, nigdy wszystkie puste, wygrana najpóźniej k4 (w.1 też pusty 18×).
    6 kroków: 15 układów (pary z w.3,6,8,9,16,17), naraz 26×, nigdy wszystkie puste (w.1 też pusty 20×).

## Otwarte (następna sesja)

- Wynik tabel z p. 9 (karta 277 P, strony 441 / 442 T60).
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
