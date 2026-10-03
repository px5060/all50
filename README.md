# T50 RAZEM — wszystkie tabele Test50 w jednej appce

Odpowiednik **T60 RAZEM** (repo `all60`) dla ciągu **Test50**. Jedno pole na kod, jeden ciąg
i wspólny ekran **GRA** dla wszystkich modeli z appek Test50:

| Zakładka | Appka źródłowa (repo) | Modele |
|---|---|---|
| **1T** | `t1t50`: T50 1T x1x | 8 modeli, pojedynczy trigger, K8 |
| **200** | `test200`: T50 200 x1x | 5 modeli (3 × 2T, 2 × 1T), K8 |
| **TRÓJKA** | `trojka`: V1.3 TRÓJKA Test50 x1x | T1, T2 · off +7 · K8 |
| **2-SLOT** | `px50x1x`: x1x 2-slot Test50 | C: 3 modele · A: 7 modeli · K8 |

## Jak działa

- Kod wpisujesz raz, u góry. Trafia do wszystkich tabel naraz. ⟲ cofa go we wszystkich tabelach.
- **GRA**: baner „NASTĘPNY WIERSZ = GRA” z sumą stawek i karta dla każdego modelu.
  Tapnięcie karty otwiera tabelę modelu, a przytrzymanie pokazuje wszystkie etykiety.
- Zakładki **1T / 200 / TRÓJKA / 2-SLOT** pokazują oryginalne widoki appek. Silniki nie są zmieniane.
- **DANE**: eksport i import JSON, auto-kopia co 10 kodów, test zgodności silników.
  Eksport ma format TRÓJKI (`app: v13_troika`), więc czytają go T50 1T, T50 200 i skrypty PC.
- Wspólny ciąg to seed T50 1T / T50 200 (15 227 kodów od Nr 1) plus kody dopisane w RAZEM
  (klucz `t50razem_v1_added`).

## Uwagi

- Seed starej appki x1x 2-slot różni się od pozostałych w **Nr 14676** (tam `000`, w 1T, 200 i TRÓJCE `001`).
  RAZEM liczy 2-SLOT na wspólnym ciągu (`001`).
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
