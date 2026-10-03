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
- **GRA**: baner „NASTĘPNY WIERSZ = GRA” z sumą stawek i karta dla każdego modelu.
  Tapnięcie karty otwiera tabelę modelu, a przytrzymanie pokazuje wszystkie etykiety.
- Każda zakładka ma ten sam układ co w T60 RAZEM: dolny pasek **GRA · TABELA · STATY**.
  - **TABELA**: Nr · Kod · GRA · Stan/Rola, przełącznik modeli (WSZ + każdy model), „tylko zdarzenia”, legenda,
    tapnięcie wiersza otwiera szczegóły. Wiersze bez zdarzeń mają jasne pole z opisem stanu
    (np. „czekam na STEP”, „STEP otwarty · czekam na TRIGGER”, „SKIP · poza parą”); kolumna GRA
    bez zakładu zostaje ciemna, jak w T60 RAZEM.
  - 2-SLOT: w kolumnie GRA zaznaczone są kroki gry (krok n/8, stawka, pudło / WIN) w oknie po START.
  - Silniki appek nie są zmieniane — nakładki tylko czytają ich wyniki.
- **DANE**: eksport i import JSON, auto-kopia co 10 kodów, test zgodności silników.
  Eksport ma format TRÓJKI (`app: v13_troika`), więc czyta go T50 x1x (import z TRÓJKI) i skrypty PC.
- Wspólny ciąg to seed T50 x1x 2.0.0 (15 227 kodów od Nr 1) plus kody dopisane w RAZEM
  (klucz `t50razem_v1_added`).

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
