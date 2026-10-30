# SESJA OCEN — tylko ocena i wyszukiwanie modeli

Sesja, w której użytkownik prosi wyłącznie o **ocenę modeli** („oceń moje modele”, „oceń dwa modele w zeszycie”, „oceń ponownie P…”)
albo o **wyszukanie modeli** („wyszukaj modele T60, które grają na następnym wierszu, krok k4”, „daj dwa modele do MOJE 50 i 60 do gry teraz”).
Wynik idzie do telefonu: `oceny.json` w prywatnym repo z kodami → MOJE → 🔍 OCENY. Reszta zasad (kryteria, jak liczą appki, pułapki):
`analiza/PROJEKT.md` — w razie wątpliwości on rozstrzyga.

## Start sesji

1. Repo w sesji: `px5060/all50` (to) i **`px5060/kody`** (prywatne: `add_repo` z dostępem **push** — bez niego nie ma stanu telefonu
   ani wysyłki ocen). Repo z pulami i ZESZYT są publiczne — ściąga je `pobierz.sh`.
2. `bash analiza/narzedzia/pobierz.sh` → `../px5060/` (pule SZUKAJ / S+ / LOST, silniki ZESZYTU, `kody/stan.json`). Jeśli `kody` jest sklonowane
   gdzie indziej: `ln -s <ścieżka>/kody ../px5060/kody` albo `--stan … --kody …` przy narzędziach.
3. `pip install numba numpy` (gdy brak).
4. `python3 analiza/narzedzia/moje_stan.py ../px5060/kody/stan.json` — Nr T50 / T60 i poprawki kodów (⚠ → nie opierać się na starych wynikach).
5. `python3 analiza/narzedzia/ocena.py wyczysc` — sprzątanie ocen; jeśli coś wypadło — commit i push w `kody` (niżej).
6. `python3 analiza/narzedzia/pule.py` — przy „← do odświeżenia” (≥ 200 nowych kodów) jedno zdanie: pule do odświeżenia w sesji głównej (PROJEKT.md).

**Przed każdą prośbą:** `git -C ../px5060/kody pull -q --rebase` — telefon zapisuje `stan.json` na bieżąco (nowe kody, nowe modele, decyzje).

## Prośba → co zrobić

Narzędzia z katalogu repo all50: `python3 analiza/narzedzia/<plik>` (w tabeli skrót — sama nazwa); domyślnie biorą `../px5060/kody/stan.json`.

| Prośba | Kroki |
|---|---|
| „Oceń moje modele”, „oceń nowe”, „oceń dwa modele w zeszycie” | `ocena.py nowe` (które są nieocenione) → `ocena.py nowe --zapisz` → wysyłka. Raz oceniony model nie jest oceniany znowu. |
| „Oceń ponownie P…” / konkretny model | `ocena.py S+ t60 xx1 2496 --zapisz`; ZESZYT: `ocena.py zeszyt t50 19,20,28 --limit 10 [--bok] [--czekaj 2] [--poz 0\|2]`, T60: `ocena.py zeszyt t60 6,11,18 --cel x1x --limit 10` → wysyłka. |
| „Wyszukaj modele T60 / T50, które grają na następnym wierszu, krok k4” | `teraz.py t60 --kroki 4` (`--za 3` = jeden z 3 najbliższych wierszy, `--cel xx1`) → kandydaci → `ocena.py` dla 4–8 → do telefonu **najwyżej 2 z GRAĆ** → wysyłka. |
| „Daj modele do gry teraz” (bez kroku) | `teraz.py t50 --kroki 1-5` i `teraz.py t60 --kroki 1-5` → jak wyżej, osobno T50 i T60. |
| „Zaproponuj modele” (też czekające na start) | `propozycje.py --stan ../px5060/kody/stan.json --kroki 2-5` (SZUKAJ + ZESZYT) → ocena → najwyżej 2 GRAĆ na grupę (MOJE T50, MOJE T60, ZESZYT T50, ZESZYT T60). |
| „Wyszukaj w ZESZYCIE” | `node analiza/narzedzia/zeszyt_skan.js ../px5060/kody/stan.json ../px5060/kody/stan.json 6 20 0 3` (GRA teraz / CZEKA) → `ocena.py zeszyt …` → najwyżej 2 GRAĆ. |
| „Co z ocenami?”, „czy zdecydowałem?” | `ocena.py lista` (stan każdej oceny: decyzja z telefonu albo samo — „nie ma go już” / „dodany poza OCENAMI”). |
| Szczegóły jednego modelu (plan kroków, Nr) | `model.py "<model>" --stan ../px5060/kody/stan.json` (np. `"S+ 2496 t60 x1x"`, `"Z50 XX+ 1·2·14 +bok k10"` — format jak w PROJEKT.md). |

Wybór kandydatów do telefonu (z `teraz.py` / `propozycje.py`):
- **główne kryterium**: wygrana od obecnego kroku do k8 (ZESZYT: do limitu) w historii, ≥ 20 przypadków; przy równym % (zaokrąglonym) — wygrana w 3 krokach;
- **bez duplikatów**: z grupy „≈ P…” (≥ 60% wspólnych zakładów) tylko jeden; bez modeli „W TELEFONIE” i „już oceniony”;
- **„ten sam Nr co …”** (model z MOJE gra na tym samym wierszu) = podwójna stawka na jeden mecz — wybrać innego albo wyraźnie to napisać;
- nie wybierać po najniższej stracie; koszt do limitu tylko jako fakt;
- werdykt liczy `ocena.py` (GRAĆ: historia ≥ 95% przy ≥ 20 i w 3 krokach ≥ zwykłej szansy, bez nakładania / kolizji; OBSERWUJ: ≥ 85% przy ≥ 10).
  Do telefonu tylko GRAĆ; resztę wymienić w jednej linii.

## Wysyłka do telefonu

`--zapisz` dopisuje / podmienia ocenę w `../px5060/kody/oceny.json` (rodzaj sam: model, którego telefon nie ma = propozycja, model z telefonu = Twój model).
```
cd ../px5060/kody && git add oceny.json && git commit -m "oceny.json: …" && git pull --rebase && git push origin main
```
W telefonie: MOJE → 🔍 OCENY (pasek „📥 Od Claude” na TERAZ). Propozycja: **＋ Dodaj do MOJE / ZESZYTU** albo **Usuń analizę**;
Twój model: **Zostaw w MOJE** albo **Usuń z MOJE**. ZESZYT pokazuje ocenę przy modelu tylko do odczytu; znaczek 🔍 przy kartach w MOJE.
Gdy ocen nie widać — MOJE → KODY → „🔍 Sprawdź propozycje i oceny od Claude”.

## Jak odpowiadać

Po polsku, krótko („daj modele, analizę zachowaj dla siebie”), formą neutralną. Przy każdym modelu jedna–trzy linie:

> **S+ P… x1x — GRAĆ** · **Nr … · k4 · 32 zł** · do k8 w/r (%) · w 3 krokach w/r (%) · cykli …, LOST … · nakładanie z MOJE …

ZESZYT: werdykt · krok, stawka, Nr · plan kroków (Nr do limitu) · historia do limitu i w 3 krokach · kolizje z MOJE.
Na końcu: gdzie zdecydować (MOJE → OCENY) i jedno zdanie uczciwie: historia nie przewiduje przyszłości (kalibracja) — realna szansa jak
każdego modelu na tym kroku. Bez wykładu.

## Czego ta sesja nie robi

- Nie zmienia appek (MOJE, SZUKAJ, ZESZYT, RAZEM) ani pul — prośba o zmianę appki: jedno zdanie, że to sesja główna (PROJEKT.md / repo appki).
- Nie przenosi zakładów ani kwot ze `stan.json` do tego (publicznego) repo; w PR-ach publicznych repo — bez numerów modeli użytkownika.
- Tokenu GitHub nie używa ani nie powtarza (jest tylko w telefonie). Zakładów nie ustawia.
- PR (np. poprawka narzędzia) scalany dopiero po słowie „scal”. `oceny.json` w `kody` — commit prosto na `main` (z niego czyta telefon).

## Na start nowej sesji (tekst dla użytkownika)

Sesja z repo `px5060/all50` i `px5060/kody`, pierwsza wiadomość, np.:
„**Sesja ocen** — przeczytaj analiza/SESJA_OCEN.md. Oceń moje nowe modele.” albo „**Sesja ocen** — wyszukaj modele T60 na następny wiersz, k4.”
