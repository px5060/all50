# PROJEKT: analiza modeli do gry (MOJE · SZUKAJ · RAZEM · ZESZYT)

Ten folder działa jak „projekt” w czacie: nowa sesja Claude Code czyta ten plik i od razu wie, co robimy, jak liczyć i jak odpowiadać.
Repo jest **publiczne**, więc nie zapisujemy tu zakładów ani kwot użytkownika (podaje je w rozmowie albo screenem ZAKŁADY).

## Start sesji (zawsze)

1. `bash analiza/narzedzia/pobierz.sh` — pobiera (tylko do odczytu) repo z pulami i silnikami: szukaj50/60, szukaj50plus/60plus,
   szukajbust50/60, zeszyt (do `../px5060/`).
2. **Stan telefonu bez eksportów (MOJE 1.33.0+, KODY → „☁ Kopia w GitHub”)**: MOJE samo wysyła `stan.json` (kody T50/T60, modele w MOJE,
   BANK, ZAKŁADY, RAZEM, ZESZYT) do **prywatnego** repo użytkownika (domyślnie `px5060/kody`). Dodać to repo do sesji (add_repo), wtedy
   `pobierz.sh` ściąga `../px5060/kody/stan.json`, a narzędzia biorą `--stan ../px5060/kody/stan.json` zamiast `--t50/--t60`.
   `python3 analiza/narzedzia/moje_stan.py ../px5060/kody/stan.json` — co jest w telefonie (modele z krokiem, BANK, ZESZYT, ostatnie
   zakłady); `--modele-json PLIK` odtwarza listy do formatu `MODELE.json`. Zakładów z `stan.json` **nie** przenosić do tego (publicznego) repo.
   Poprawki kodów (cofnięty i wpisany na nowo kod, zmiana w ZESZYCIE) MOJE wysyła sama: `moje_stan.py` pokazuje je na górze
   („⚠ W TYM ZAPISIE …”, dziennik `moje_v1_kodzm`, kody z bazy poprawione w ZESZYCIE) — wtedy przelicz modele, które grały na tym Nr,
   i nie opieraj się na wcześniejszych wynikach z tamtym kodem. Historia zapisów: `git -C ../px5060/kody log --oneline` („poprawka T50 Nr …”).
   Bez tego repo — jak dotąd:
   Użytkownik dołącza najnowsze eksporty kodów: **T50** z RAZEM (`v13_…kod.json`, `"app": "v13_troika"`, pole `codes`) i **T60**
   z RAZEM (`xx1_pikoff_…_n…json`, `"kind": "xx1_pikoff"`, pole `codes`). Zawsze sprawdzić, że stare kody są początkiem nowych.
3. `python3 analiza/narzedzia/stan.py --t50 <T50.json> --t60 <T60.json> [--tylko-wybor] [--grupa "ZESZYT T50"]`
   → dla każdego modelu z `MODELE.json`: krok i stawka teraz, najbliższy zakład (Nr albo warunek), historia zamknięcia od obecnego
   kroku (i obie połowy historii), realna szansa do limitu, LOST-y, po LOST, ile do limitu.
4. Screeny użytkownika: nowe modele dopisać do `MODELE.json` (i sprawdzić, że WIN / LOST / „ostatnie” / krok zgadzają się z kartą).
5. Do propozycji z pul: `pip install numba numpy` (raz na sesję), potem `propozycje.py` (niżej).
6. **Pule SZUKAJ co 200 nowych kodów (prośba użytkownika).** `python3 analiza/narzedzia/pule.py --stan ../px5060/kody/stan.json` —
   na ilu kodach liczona jest każda pula (S / S+ / LOST, T50 / T60, x1x / xx1) i ile przybyło. Przy „← do odświeżenia” (≥ 200) **zaproponować**
   odświeżenie (jedno zdanie); po zgodzie: repo SZUKAJ do sesji z prawem zapisu, `pule.py --przygotuj --repo <katalog z klonami>`
   (`szukaj/dopisane.txt` = kody od końca `seed_<t>.txt` do Nr z telefonu), w każdym repo `search.py … 6000000 7 --stale` (S, LOST) albo
   `search.py …` (S+, zawsze dopisuje), `build_szukaj.py`, podbić wersję appki, PR-y — scalane po „scal”. **Stałe numery P**: stara pula
   zostaje na początku w tej samej kolejności, nowe modele dostają kolejne numery (P… w MOJE, MODELE.json i analizie się nie zmieniają).
   Sprawdzić przed PR: stara pula = początek nowej. **Co 200 kodów** (zmiana: ok. raz w miesiącu; nie co 100). Po liczeniu **przyciąć**:
   `przytnij.py --repo <repo> --cel x1x|xx1 --stan … [--kryteria domyslne|moje] --zapisz` — model, który na całym ciągu nie spełnia kryteriów
   SZUKAJ, wypada (zostaje dziura w numeracji, lista `nr`); **model z MOJE (listy, BANK, zakłady) nie wypada bez pytania** — narzędzie go
   zostawia i wypisuje „? P… w MOJE …”: zapytać użytkownika, po zgodzie `--usun P…`. Przytnij zapisuje w puli `zmiana` (dodano / usunięto względem puli
   sprzed odświeżenia) — appki SZUKAJ / S+ / LOST pokazują raz pasek „📦 Nowa pula modeli …” (prośba użytkownika). `search.py` przenosi listę `nr`.

## Ocena modelu (prośba użytkownika — zawsze te same kroki)

Gdy użytkownik prosi o ocenę / analizę modelu (swojego z MOJE, z puli albo ZESZYTU), **zawsze** `ocena.py` — i przy każdej propozycji Claude
(wyżej). Model, który użytkownik sam dodał do MOJE / ZESZYTU (`rodzaj: moj`, rozpoznaje stan.json; `--rodzaj` wymusza) — w telefonie
**Zostaw w MOJE** albo **Usuń z MOJE**; użytkownik czyta ocenę i decyduje, czy jego model zostaje.
`python3 analiza/narzedzia/ocena.py lista` — oceny w oceny.json i decyzje z telefonu; `ocena.py wyczysc` — usuwa załatwione starsze niż 14 dni.
`python3 analiza/narzedzia/ocena.py S+ t60 xx1 2496 --stan ../px5060/kody/stan.json` (ZESZYT: `ocena.py zeszyt t50 19,20,28 --limit 10`,
T60: `--cel x1x`). Kroki: 1. stan teraz, 2. historia (Twoje kryterium: do k8 / limitu i w 3 krokach, połowy), 3. **uczciwa szansa**
(`analiza/kalibracja.json`: trafialność zakładu ściągnięta do zwykłej częstości + jak łatwo o taki wynik przypadkiem), 4. **symulacja**
(Monte Carlo przyszłych kodów — wygrana, LOST, koszt, czas; ZESZYT: plan wierszy), 5. **nakładanie** z modelami w MOJE, 6. werdykt
GRAĆ / OBSERWUJ / NIE GRAĆ + czym się kierowałem. W rozmowie krótko (werdykt + 2–3 liczby); całość z `--zapisz` do `oceny.json` w repo
z kodami (commit i push, `git pull --rebase` przed) → MOJE 1.36.0+ zakładka **OCENY** (pełna ocena przy modelu, decyzja, licznik czekających).
Werdykt: GRAĆ = historia do k8 / limitu ≥ 95% (≥ 20 przypadków) i w 3 krokach nie gorzej niż zwykła szansa na 3 krokach od tego kroku
(np. od k1 ok. 64%) i bez nakładania (< 30% wspólnych wierszy / kolizji najbliższych Nr); OBSERWUJ = historia ≥ 85% (≥ 10); inaczej NIE GRAĆ.
**„Oceń moje modele” = tylko nieocenione** (prośba użytkownika): `ocena.py nowe` (lista) / `ocena.py nowe --zapisz` — wszystkie modele
z telefonu (MOJE GRY, BANK, ZESZYT), których id nie ma w `oceny.json` (ten sam id: P… dla SZUKAJ, układ + ustawienia dla ZESZYTU; model
dodany z propozycji też się liczy jako oceniony). Ponowna ocena tylko na wyraźną prośbę („oceń ponownie P…”) — `ocena.py … --zapisz`
podmienia ocenę i w telefonie znowu czeka na decyzję.
**Kalibracja** (`kalibracja.py`, ZESZYT `kalibracja_zeszyt.js`): odświeżać przy odświeżaniu pul (stare pule = `przed`; SZUKAJ: wynik każdego
zakładu po T0, nie cykli — patrz Pułapki), `--zapisz` → `kalibracja.json`.

## Sesja jednego modelu (prośba użytkownika)

Użytkownik sam wyszukuje modele; dla każdego nowego modelu zakłada **osobną sesję** i prowadzimy go **do WIN albo do LOST**.

- Start: `python3 analiza/narzedzia/model.py "<model>" --t50 … --t60 …`, np. `"L 3911 t50 x1x"`, `"S+ 4539 t60 x1x"`, `"R MIX3 T1+5"`,
  `"Z50 6·11·27 k10"`, `"Z50 XX+ 1·2·14 +bok k10"`, `"Z60 xx1 16·27 k10"` (`×2` = po 2 pustych, `×0` = od razu).
  Sprawdzić zgodność z kartą ze screena (WIN / LOST / ostatnie / krok). Podać krótko: jak gra, historia (WIN / LOST, ostatnie cykle),
  od obecnego kroku zamykał X z Y, realnie %, po LOST, **ta seria** (przegrane kroki z Nr), **najbliższy zakład** (Nr albo warunek, krok,
  stawka), ile najwyżej do limitu. ZESZYT: cały plan kroków z Nr i stawkami.
- Po każdych nowych kodach: co padło na wierszu zakładu, WIN / pudło, następny krok, Nr (albo warunek), stawka. Zakłady użytkownika
  (podane w rozmowie) liczyć osobno od kroków modelu — mogą się różnić.
- Koniec: WIN albo LOST modelu, wynik serii (z zakładów użytkownika), zamknięcie sesji. Model po WIN może wrócić w nowej sesji.

## Propozycje modeli (z własnej inicjatywy)

Użytkownik prosi, żeby **samemu proponować modele, które właśnie się pojawiły i mają potencjał**. Przy nowych kodach (a w sesji jednego
modelu — krótko na końcu, jeśli coś mocnego) uruchomić:
`python3 analiza/narzedzia/propozycje.py --t50 … --t60 … [--kroki 2-4] [--do-kroku N] [--po-lost] [--top 6]`
— całe pule SZUKAJ / SZUKAJ+ / SZUKAJ LOST (kryteria aplikacji: min. cykli, max LOST wg przedziałów) na krokach `--kroki`, ułożone wg
historycznej wygranej od obecnego kroku do zakładanego (`--do-kroku`; ≥ 20 przypadków), z najbliższym zakładem; ZESZYT T50 / T60 (min. 100 gier, ≤ 2 LOST): GRA teraz i CZEKA.
Pokazać **2–4 na grupę, po jednej linii** (model · krok · stawka · Nr/warunek · historia od kroku · realnie), bez wykładu. Szczegóły
wybranego: `model.py`.

**Propozycje do telefonu (prośba użytkownika — kolejność stała):** 1. wybór wg kryteriów (`propozycje.py`, 2–4 kandydatów na grupę:
MOJE T50, MOJE T60, ZESZYT T50, ZESZYT T60) → 2. **każdy kandydat przez `ocena.py`** (6 kroków, niżej) → 3. do telefonu tylko najlepsi
z werdyktem GRAĆ (najwyżej 2 na grupę): `ocena.py … --zapisz` (model, którego telefon nie ma = `rodzaj: propozycja`), commit i push
`oceny.json` do `../px5060/kody` (`git pull --rebase` przed — MOJE pisze tam `stan.json`). Telefon: zakładka OCENY + pasek na TERAZ —
**＋ Dodaj do MOJE** albo **Usuń analizę**. Wysyłać, gdy użytkownik prosi o propozycje albo się zgodzi; zakładów się tak nie ustawia.

## Jak odpowiadać (prośby użytkownika)

- Po polsku, **krótko**: „daj modele, analizę zachowaj dla siebie”. Długie wyliczenia tylko na prośbę.
- Wybór: **po 4 modele osobno** dla MOJE T50, MOJE T60, ZESZYT T50, ZESZYT T60 (+ T60 ZESZYT, jeśli są screeny).
- Przy każdym modelu: krok · stawka · **dokładny Nr** albo warunek („Nr 15 420, jeśli na 15 419 padnie 100/101”) · limit.
- Na prośbę „jak screen”: obraz z kartami wyciętymi ze screenów użytkownika + 1 linia pod kartą (`narzedzia/karty.py`) + stopka
  „Czym się kierowałem” (3–4 punkty). Wysyłać plikiem (SendUserFile), nie opisywać długo.
- Nie wybierać „po najniższej stracie” (użytkownik wyraźnie nie chce) — koszt do limitu podawać tylko jako fakt.
- Głos rozsądku: jedno zdanie, bez wykładu (użytkownik wie, że kurs 3,0 i ~29% na zakład dają stratę na dłuższą metę).

## Kryteria wyboru (ustalone)

1. **Główne kryterium — duży nacisk (prośba użytkownika): historyczna szansa wygranej modelu od kroku, na którym jest teraz, do kroku
   zakładanego** — użytkownik: **do k8** (SZUKAJ / S+ / LOST; ZESZYT — do limitu modelu), np. 99 z 99, przy ≥ ok. 20–30 przypadkach.
   Druga miara (też pokazywać, rozstrzyga przy równej): **wygrana w najbliższych 3 krokach od obecnego** (np. k4–k6). Wybór i kolejność
   **przede wszystkim** wg tego; przy każdym modelu: „wygrana kX→k8 w historii: w/r (%) · w 3 krokach (kX–kX+2): w/r (%)”.
   Narzędzia: `--do-kroku N` (inny krok, gdy użytkownik poprosi) i `--okno 3` w `propozycje.py` i `stan.py` (ZESZYT: zeszyt_skan.js / DO_KROKU, OKNO).
2. **Realna szansa** = 1 − (1 − p)^(kroki do zakładanego kroku), p = zwykła częstość celu — drugorzędna: przy równej historii wyżej model
   z większą liczbą kroków przed sobą. (Sprawdzenie na późniejszych kodach: historia słabo się utrzymuje — fakt do jednego zdania, gdy pyta.)
3. Odpadają: słaba historia od obecnego kroku (k7–k8: 25–88%), cele rzadkie (2/3xx), XX+ w T50 (25%).
4. „Po LOST” liczyć jak inne (sprawdzenie: bez różnicy). Jeden model = jedna kopia; dwa modele na tym samym wierszu = podwójna stawka
   na jeden mecz (mówić o tym).

## Jak liczą aplikacje (skrót)

- **SZUKAJ / SZUKAJ+ / SZUKAJ LOST** (`narzedzia/szukaj.py`, 1:1 z `szukaj*/szukaj/engine.py`): model `[typ, STEP, x, TRIGGER, off, tn, STEP2]`,
  STEP ×x pod rząd → [STEP2 raz] → TRIGGER ×tn → zakład na ostatnim TRIGGER + off. Wzorzec `p → q` = dwa kolejne kody, `∪` = lub,
  `x` = dowolna cyfra. Progresja K8 trwała 8 · 8 · 16 · 32 · 64 · 128 · 256 · 512 zł, kurs 3,0, przegrany k8 = LOST („BUST” w kodzie).
  Nazwa **P{n} = pula[n − 1]**, a w puli przyciętej (pole `nr`) — model z numerem n z listy `nr` (numery się nie przesuwają; `szukaj.model()` to obsługuje); T60 ma osobne pule dla x1x i xx1. Literki na karcie MOJE: S = SZUKAJ, S+ = SZUKAJ+, L = SZUKAJ LOST, R = RAZEM.
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

- **Kalibracja (30.10, `kalibracja.json`)**: SZUKAJ / S+ / LOST — pule do Nr 15 227 / 12 837, potem ~200 kodów (311 tys. zakładów):
  trafialność zakładu modeli z historią „100% do k8” × 1,025 zwykłej, 95–99% × 0,93, < 80% × 1,05 → historia nic nie przewiduje (n0 ∞).
  ZESZYT — wszystkie układy, punkty 50 / 65 / 80% kodów (2 mln zakładów): 100% × 1,009, 95–99% × 1,015 (n0 = 3000).

- Częstość: T50 x1x 28,8%, T50 „XX+” (xx1) 25,0%; T60 x1x 28,5%, xx1 28,4% (na Nr 12 838–13 027 aż 39,5% — seria), 1xx 17,7%, 2/3xx 13,4%.
  Ciąg bez pamięci (test po poprzednim kodzie: bez zależności).
- Pule SZUKAJ na nowych kodach trafiały tyle, ile zwykła częstość; historyczne „0 LOST” to efekt wyboru z milionów modeli.
- ZESZYT, sprawdzenie (wybór na 65% kodów → potem): modele zamykające od k5 w 100% zamykały potem 81% — tyle co pozostałe; zamknięcie
  zależy od liczby kroków do limitu. Gra zaraz po LOST-cie przegrywała 4,4% (zwykle 4,2–4,6%).
- ZESZYT 11·13·14 / 11·15·17 / 6·11·27: „po 1 pustej” 0 BUST (do k10), bo LOST wymaga 4 pustych połów z rzędu; „od razu po WIN” do k9 —
  12–15 LOST-ów w historii (3 puste połowy). 7 × 000 na wspólnych wierszach (6, 11, 13, 14, 15, 17, 27) nigdy; wspólna przegrana połowa
  (x0x na wszystkich 7) 51 razy na 548. W grach po pustej trójce nigdy 9 × 000.

## Pułapki zauważone
- **Kalibracja / sprawdzenie „potem”**: nie liczyć tylko cykli, które zdążyły się skończyć (krótkie wygrane kończą się szybko, długie serie pudeł
  nie zdążą → zawyżony wynik, np. 96% zamiast zwykłej). Liczyć każdy zakład po T0 (trafił / nie) i porównywać z częstością celu **w tym samym
  okresie** (T60 xx1 po Nr 12 837: 38% zamiast 28%).

- MOJE: TOP7 M3 pokazywał k1, a tabela TOP7 liczy k5. MIX3 T1+5: karta „x1x” i „WIN 247”, z kodów 69 gier / 0 LOST, krok się zgadza.
- ZESZYT T60: 1xx 3·8·21 jest dwa razy (k10 i k12) — to ta sama gra.
- Zakład zapisany na inny Nr niż wiersz modelu → MOJE pokazuje „model nie grał” (np. P6003 Nr 15 400 zamiast 15 398).

## Pliki

```
analiza/PROJEKT.md          ten opis (czytać na starcie)
analiza/MODELE.json         modele ze screenów (wybor = aktualnie polecany), bez zakładów
analiza/narzedzia/pobierz.sh  pobranie repo z pulami / silnikami
analiza/narzedzia/stan.py     raport stanu wszystkich modeli (MOJE: szukaj.py, ZESZYT: zeszyt.js)
analiza/narzedzia/model.py    jeden model w szczegółach (sesja jednego modelu)
analiza/narzedzia/moje_stan.py   co jest w telefonie: stan.json z MOJE (☁ Kopia w GitHub) → modele, BANK, ZESZYT, zakłady, MODELE.json
analiza/narzedzia/pule.py        pule SZUKAJ / S+ / LOST a kody z telefonu: ile przybyło od przeliczenia (co 200 → odświeżyć), --przygotuj
analiza/narzedzia/przytnij.py    po odświeżeniu: wypadają modele poza kryteriami SZUKAJ (lista nr, stałe numery P); modele z MOJE — pytać
analiza/narzedzia/ocena.py       ocena jednego modelu (6 kroków) → rozmowa + oceny.json w repo z kodami (MOJE → OCENY: propozycja / Twój model)
analiza/narzedzia/kalibracja.py  czy historia przewiduje (SZUKAJ: po T0 puli; + ZESZYT z kalibracja_zeszyt.js) → analiza/kalibracja.json
analiza/narzedzia/propozycje.py  propozycje z całych pul SZUKAJ (numba) + ZESZYT (zeszyt_skan.js)
analiza/narzedzia/zeszyt_skan.js  przegląd wszystkich układów ZESZYTU T50 / T60
analiza/narzedzia/szukaj.py   silnik SZUKAJ (1:1) + MIX3 v14 + statystyki od kroku, najbliższy zakład
analiza/narzedzia/zeszyt.js   ZESZYT T50 / T60 silnikami aplikacji: stan, plan kroków z Nr i stawkami
analiza/narzedzia/karty.py    obraz „jak screen” z kart użytkownika (spec JSON)
```
