# T50 RAZEM — wszystkie tabele Test50 w jednej appce

Odpowiednik **T60 RAZEM** (repo `all60`) dla ciągu **Test50**. Jedno pole na kod, jeden ciąg
i wspólny ekran **GRA** dla wszystkich modeli z appek Test50:

| Zakładka | Appka źródłowa (repo) | Modele |
|---|---|---|
| **1T** | T50 x1x 2.0.0, silnik 1T | 8 modeli, pojedynczy trigger, K8 |
| **200** | T50 x1x 2.0.0, silnik 200 | 5 modeli (1T/2T), K8 |
| **2T** | T50 x1x 2.0.0, silnik 2T | 6 modeli, podwójny trigger, K8 |
| **TRÓJKA** | `trojka`: V1.3 TRÓJKA Test50 x1x | T1, T2 · off +7 · K8 |
| **2-SLOT** | `px50x1x`: x1x 2-slot Test50 | C: 3 modele · A: 7 modeli · K8 |

## Jak działa

- Kod wpisujesz raz, u góry. Trafia do wszystkich tabel naraz. ⟲ cofa go we wszystkich tabelach.
- **GRA**: baner „NASTĘPNY WIERSZ = GRA” z sumą stawek. Na górze tylko okna **po START**
  (gra na następnym wierszu, gra w toku; w 1T/200/2T trigger od razu ustala wiersz zakładu, więc „gra za n” też jest na górze).
  Okna przed START (przygotowanie, „★ START za 1”) i modele bez triggera są zwinięte
  pod przyciskiem **„Modele oczekujące”**. Tapnięcie karty otwiera tabelę modelu, przytrzymanie — wszystkie etykiety.
- **TABELA**: model grający na następnym wierszu ma ▼ i pomarańczową ramkę na przycisku, pasek
  „▼ GRA na następnym wierszu …” oraz pomarańczowy nagłówek swojej kolumny w widoku WSZ.
- Każda zakładka ma ten sam układ co w T60 RAZEM: dolny pasek **GRA · TABELA · STATY**.
  - **TABELA**: Nr · Kod · GRA · Stan/Rola, przełącznik modeli (WSZ + każdy model), „tylko zdarzenia”, legenda,
    tapnięcie wiersza otwiera szczegóły. Wiersze bez zdarzeń mają jasne pole z opisem stanu
    (np. „czekam na STEP”, „STEP otwarty · czekam na TRIGGER”, „SKIP · poza parą”); kolumna GRA
    bez zakładu zostaje ciemna, jak w T60 RAZEM.
  - **Prognoza po START** (wiersze przerywane „nast.” / „…” na końcu tabeli modelu) tylko tam, gdzie wiersz jest pewny:
    1T/200/2T — odliczanie do zakładu; 2-SLOT — sloty 1 i 2 po BUILDUP; TRÓJKA — wiersz decyzji po SPRAWDŹ (i SPRAWDŹ po 1. trafieniu).
    Gdy trzeba czekać na kod (szukanie pary, BUILDUP), w opisie ostatniego wiersza (Stan/Rola) jest „DALEJ: …” — co musi się wydarzyć.
  - 2-SLOT: w kolumnie GRA zaznaczone są kroki gry (krok n/8, stawka, pudło / WIN) w oknie po START.
  - **Dotknięcie wiersza zakładu** (albo wiersza TRIGGER / czekania) w widoku modelu podświetla cały łańcuch, jak w SZUKAJ / BUST:
    STEP (żółty), TRIGGER (niebieski), czekanie (przerywany), następny / START (pomarańczowy), kroki gry (przerywany pomarańczowy),
    WIN (zielony) / przegrana (czerwony), z opisem nad tabelą. Ponowne dotknięcie zamyka.
  - **Ocena** na górze statystyk modelu (okno po przytrzymaniu): **GRAĆ** (≥ 7 pkt), **REZERWA** (5–6), **ODRZUĆ** (≤ 4) — punkty z 9
    jak w T50 x1x (bootstrap, permutacja, okresy, BUST K7, część 40%, 0 BUST K8; Monte-Carlo 5000 losowań).
  - **Przytrzymanie wiersza** w TABELI → wszystkie etykiety tego wiersza (komórka ze znaczkiem „+N” ma ich więcej) i statystyki modelu;
    **przytrzymanie karty** na GRA → statystyki i wszystkie etykiety karty.
  - **STATY** we wszystkich zakładkach mają ten sam układ: tabela „zestawienie — N kodów” (M · Zakł/WIN · WR% · maxL · Bust ·
    Bilans · WF, wiersz Σ, Monte-Carlo) i karta każdego modelu (zakłady / cykle / WIN / BUST, trafienie, bilans, max seria,
    max wyłożone, WIN k1…k8, BUST przy K6/K7, okresy + z 5, część 40%, bootstrap, permutacja, pkt z 9, obrót, ostatni zakład, stan),
    w zwartym układzie, białą czcionką.
    TRÓJKA: cykl = okno po triggerze, zakłady 8 · 16 · … · 1024 zł (BUST −2 040). 2-SLOT: cykl = okno po START, stawki Pikoff
    8 · 8 · 16 · … · 512 zł (BUST −1 024). Bilans zgodny z wynikiem silnika.
  - Silniki appek nie są zmieniane — nakładki tylko czytają ich wyniki.
- **MOJE** (jak MOJE GRY w SZUKAJ / BUST): w oknie statystyk (przytrzymanie karty na GRA albo wiersza w TABELI) przycisk
  **„▶ Gram / obserwuję — dodaj do MOJE GRY”**. Zakładka MOJE pokazuje wybrane modele ze wszystkich tabel: bieżący stan karty
  i pierwsze rozstrzygnięcie od chwili dodania (✔ WIN albo ✖ BUST / LOSS; przegrany pojedynczy krok progresji się nie liczy).
  Usuwanie tym samym przyciskiem („■ W MOJE GRY — usuń z listy”). Lista zapisana w telefonie (klucz `t50razem_v1_moje`).
- **MOJE ZAKŁADY** (w oknie statystyk modelu): zapis zakładu zagranego naprawdę — Nr wiersza, krok, postawiona kwota
  (domyślnie następny wiersz i krok / stawka z linii „GRA na następnym wierszu”). Wynik z tabeli modelu: ✔ WIN (+2 × stawka, kurs 3),
  ✗ przegrany, „czeka” (wiersz jeszcze nie padł), „model nie grał” (w tym wierszu model nie miał zakładu). Suma: postawione i wynik;
  podsumowanie także na karcie w MOJE. Wpisy usuwa ✕. Zapis w telefonie (klucz `t50razem_v1_bets`).
- **DANE**: eksport i import JSON, auto-kopia co 10 kodów, test zgodności silników.
  Eksport ma format TRÓJKI (`app: v13_troika`), więc czyta go T50 x1x (import z TRÓJKI) i skrypty PC.
- Wspólny ciąg to seed T50 x1x 2.0.0 (15 227 kodów od Nr 1) plus kody dopisane w RAZEM
  (klucz `t50razem_v1_added`).

## Instalacja na telefonie (osobny adres)

Pod `/all50/` telefon pokazywał „już zainstalowana”, bo pod tym adresem były wcześniej inne appki (stary SZUKAJ).
Dlatego T50 RAZEM ma też własny adres, na wzór SZUKAJ / BUST: **https://px5060.github.io/t50razem/**
(repo `px5060/t50razem`, pliki z `pages/t50razem/` — własny manifest `t50razem-v1`, `start_url ./`, service worker).
`python3 build.py` buduje oba warianty naraz. Dane (dopisane kody) są wspólne — ta sama domena `px5060.github.io`.

## Uwagi

- **Nr 14676 = `001` we wszystkich tabelach.** Stara appka x1x 2-slot miała tam `000`; build.py poprawia jej seed
  (`SEED_FIX`), więc 2-SLOT liczy ten sam ciąg co reszta.
- Zakładki 1T / 200 / 2T to ta sama appka T50 x1x 2.0.0 osadzona trzy razy, każda z jednym silnikiem.
- Silnik 2-slot nie ma stawek. Na ekranie GRA użyta jest progresja K8 z Pikoff 2-slot (8, 8, 16, 32, 64, 128, 256, 512 zł).
- TRÓJKA: karta pokazuje fazę okna (przygotowanie, START, gra w bieżącym cyklu T+7) bez stawki, tak samo jak TRÓJKA w T60 RAZEM.

## Pliki

```
index.html            gotowa appka (generowana, nie edytować ręcznie)
manifest.json         PWA
icon-192/512.png      ikony
build.py              buduje index.html z src/
src/shell.html        wspólna powłoka (pole kodu, GRA, DANE)
src/apps/*.html       kopie appek Test50 (bez zmian)
src/overlay_*.js      nakładki: API window.T50 dla każdej appki
```

Aktualizacja jednej z appek: podmień plik w `src/apps/` i uruchom `python3 build.py`.
