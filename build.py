#!/usr/bin/env python3
"""Buduje index.html (T50 RAZEM) z appek Test50 w src/apps/.

Każda appka trafia do jednej ramki (iframe srcdoc) bez zmian w silniku —
doklejane są tylko: CSS chowający jej własny wpis kodów / dane, nakładka wspólna
(src/overlay_common.js) i nakładka tej appki (API window.T50 dla RAZEM).

Uruchom:  python3 build.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'

# kolejność = kolejność zakładek w RAZEM
APPS = [
    dict(k='t1', eng='t1', short='1T', name='T50 1T · x1x · 8 modeli · pojedynczy trigger · K8', src='t50x1x.html', overlay='overlay_t50x1x.js',
         store='added', key='t50_2t_v1_added', extra=[['t50_2t_v1_autobk', '0']], hintPrefix=False,
         css='header{padding:5px 12px!important}header h1{font-size:14px!important}#entry{display:none!important}main{max-width:none!important}'
             'nav button[data-v=dane]{display:none!important}.toast{display:none!important}.chips button.tb{display:none!important}'),
    dict(k='t200', eng='t200', short='200', name='T50 200 · x1x · 5 modeli 1T/2T · K8', src='t50x1x.html', overlay='overlay_t50x1x.js',
         store='added', key='t50_2t_v1_added', extra=[['t50_2t_v1_autobk', '0']], hintPrefix=False,
         css='header{padding:5px 12px!important}header h1{font-size:14px!important}#entry{display:none!important}main{max-width:none!important}'
             'nav button[data-v=dane]{display:none!important}.toast{display:none!important}.chips button.tb{display:none!important}'),
    dict(k='t2t', eng='t2t', short='2T', name='T50 2T · x1x · 6 modeli · podwójny trigger · K8', src='t50x1x.html', overlay='overlay_t50x1x.js',
         store='added', key='t50_2t_v1_added', extra=[['t50_2t_v1_autobk', '0']], hintPrefix=False,
         css='header{padding:5px 12px!important}header h1{font-size:14px!important}#entry{display:none!important}main{max-width:none!important}'
             'nav button[data-v=dane]{display:none!important}.toast{display:none!important}.chips button.tb{display:none!important}'),
    dict(k='trojka', short='TRÓJKA', name='TRÓJKA V1.3 · x1x · T1/T2 off +7 · K8', src='trojka.html', overlay='overlay_trojka.js',
         store='csv', key='v13_troika_codes_v1', extra=[['v13_troika_autobak', '0']],
         css='.pad{display:none!important}footer .frow{margin-bottom:0!important}#bak,#toast{display:none!important}'
             '#miExp,#miImp,#miTxt,#miClr,.sw{display:none!important}'),
    dict(k='slot2', short='2-SLOT', name='x1x 2-slot · strategie C / A · K8', src='px50x1x.html', overlay='overlay_slot2.js',
         store='json', key='x1x_2slot_codes_v1', extra=[],
         css='.pad{display:none!important}footer .frow{margin-bottom:0!important}#bak,#toast{display:none!important}'
             '#miExp,#miImp,#miClear,.sw{display:none!important}'),
]

VER = {'t50x1x.html': r"const APP_VER = '([^']+)'",
       'trojka.html': r"const APP_VER='([^']+)'", 'px50x1x.html': r"const APP_VER='([^']+)'"}
SEEDS = {'t50x1x.html': r"const SEED = '(\d+)'",
         'trojka.html': r'const SEED="(\d+)"', 'px50x1x.html': r'const SEED_STR="(\d+)"'}

# poprawki seedów starych appek (Nr → kod), żeby wszystkie tabele liczyły ten sam ciąg
SEED_FIX = {'px50x1x.html': {14676: '001'}}

# wzorce selfTest (policzone silnikami oryginalnych appek na ich własnym seedzie)
REFS = {
    '__TROJKA_REF__': 'T1: 68 gier, 67 W, PnL 4712 · T2: 48 gier, 48 W, PnL 3584',
    '__SLOT2_REF__': 'C: 322 W / 10 L · A: 294 W / 2 L',
}


def main():
    common = (SRC / 'overlay_common.js').read_text()
    seeds, out = {}, []
    for a in APPS:
        html = (SRC / 'apps' / a['src']).read_text()
        m = re.search(SEEDS[a['src']], html)
        seed = m.group(1)
        for nr, c in SEED_FIX.get(a['src'], {}).items():
            seed = seed[:3 * (nr - 1)] + c + seed[3 * nr:]
        html = html[:m.start(1)] + seed + html[m.end(1):]
        seeds[a['src']] = seed
        ov = (SRC / a['overlay']).read_text()
        if a.get('eng'):
            ov = f"window.__T50_ENG = '{a['eng']}';\n" + ov
        for k, v in REFS.items():
            ov = ov.replace(k, v)
        html = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', '', html)
        html = html.replace('</head>', f'<style>{a["css"]}</style>\n</head>', 1)
        tail = f'<script>{common}</script>\n<script>{ov}</script>\n</body>'
        i = html.rindex('</body>')
        html = html[:i] + tail + html[i + len('</body>'):]
        out.append(dict(k=a['k'], short=a['short'], name=a['name'], ver=re.search(VER[a['src']], html).group(1),
                        store=a['store'], key=a['key'], extra=a['extra'], hintPrefix=a.get('hintPrefix', True), seedN=len(seed) // 3, html=html))

    master = max(seeds.values(), key=len)
    for a in out:
        if a['store'] == 'added' and a['seedN'] != len(master) // 3:
            raise SystemExit(f"{a['k']}: seed {a['seedN']} ≠ master {len(master) // 3} — tryb 'added' wymaga tego samego seeda")
    m3 = re.findall('...', master)
    for name, s in seeds.items():
        d = [i + 1 for i, c in enumerate(re.findall('...', s)) if m3[i] != c]
        if d:
            print(f'UWAGA: {name}: seed różni się od głównego w Nr {d[:10]} — RAZEM używa głównego ciągu')

    shell = (SRC / 'shell.html').read_text()
    apps_js = json.dumps(out, ensure_ascii=False).replace('</', '<\\/')
    shell = shell.replace('/*__MASTER_SEED__*/', master, 1).replace('/*__APPS__*/', apps_js, 1)
    (ROOT / 'index.html').write_text(shell)
    print(f'index.html: {len(shell):,} B · seed {len(master) // 3} kodów · ' + ', '.join(f"{a['short']} {a['ver']}" for a in out))
    build_pages(shell)


# ---- osobna appka PWA (repo px5060/t50razem → px5060.github.io/t50razem/), na wzór SZUKAJ / BUST ----
PAGES = ROOT / 'pages' / 't50razem'
PWA_ID = 't50razem-v1'
MANIFEST = {
    'id': PWA_ID, 'name': 'T50 RAZEM — wszystkie tabele Test50', 'short_name': 'T50 RAZEM',
    'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#12151c', 'theme_color': '#1b1f2a',
    'icons': [{'src': 't50razem-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
              {'src': 't50razem-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'}],
}
SW = """// T50 RAZEM: nawigacje zawsze z sieci (bez starej wersji z pamięci)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request.url, { cache: 'no-store' }).catch(() => fetch(e.request)));
});
"""


def build_pages(shell):
    import shutil
    PAGES.mkdir(parents=True, exist_ok=True)
    h = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', '', shell, count=2)
    h = h.replace('<title>', '<link rel="manifest" href="t50razem.webmanifest">\n<link rel="icon" href="t50razem-192.png">\n'
                  '<link rel="apple-touch-icon" href="t50razem-192.png">\n<title>', 1)
    i = h.rindex('</body>')
    h = h[:i] + "<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('t50razem-sw.js', { scope: './' }).catch(() => {});</script>\n" + h[i:]
    (PAGES / 'index.html').write_text(h)
    (PAGES / 't50razem.webmanifest').write_text(json.dumps(MANIFEST, ensure_ascii=False, indent=1))
    (PAGES / 't50razem-sw.js').write_text(SW)
    for n in ('192', '512'):
        shutil.copyfile(ROOT / f'icon-{n}.png', PAGES / f't50razem-{n}.png')
    (PAGES / '.nojekyll').write_text('')
    (PAGES / 'README.md').write_text(
        '# T50 RAZEM\n\nWszystkie tabele Test50 (1T · 200 · 2T · TRÓJKA · 2-SLOT) w jednej appce PWA.\n\n'
        'Adres: https://px5060.github.io/t50razem/\n\n'
        'Pliki są generowane w repo `px5060/all50` (`python3 build.py` → `pages/t50razem/`) — nie edytować tutaj ręcznie.\n')
    print(f'pages/t50razem/: index.html {len(h):,} B · manifest id {PWA_ID} · service worker')


if __name__ == '__main__':
    main()
