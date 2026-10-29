#!/usr/bin/env bash
# Pobiera (tylko do odczytu) publiczne repo aplikacji, z których liczą narzędzia: pule SZUKAJ / SZUKAJ+ / SZUKAJ LOST
# i silniki ZESZYTU. Domyślnie obok repo all50, np. /home/user/px5060/<repo>. Inny katalog: PX5060=/ścieżka.
set -e
D="${PX5060:-$(cd "$(dirname "$0")/../../.." && pwd)/px5060}"
mkdir -p "$D"
for r in szukaj50 szukaj50plus szukajbust50 szukaj60 szukaj60plus szukajbust60 zeszyt; do
  if [ -d "$D/$r/.git" ]; then git -C "$D/$r" pull -q --ff-only || true
  else GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 "https://github.com/px5060/$r" "$D/$r"; fi
done
# stan telefonu (MOJE → ☁ Kopia w GitHub): prywatne repo z plikiem stan.json — trzeba je dodać do sesji (dostęp prywatny)
K="${KODY_REPO:-px5060/kody}"
if [ -d "$D/kody/.git" ]; then git -C "$D/kody" pull -q --ff-only 2>/dev/null || true
else git clone -q --depth 1 "https://github.com/$K" "$D/kody" 2>/dev/null || true; fi
if [ -f "$D/kody/stan.json" ]; then echo "stan telefonu: $D/kody/stan.json"; else echo "stan telefonu: brak ($K niedostępne w tej sesji) — użyj eksportów"; fi
echo "$D"
