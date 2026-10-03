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
    dict(k='t1t', short='1T', name='T50 1T · x1x · 8 modeli · K8', src='t1t50.html', overlay='overlay_fsm.js',
         store='added', key='t50_1t_v1_added', extra=[['t50_1t_v1_autobk', '0']],
         css='header{padding:5px 12px!important}header h1{font-size:14px!important}#entry{display:none!important}'
             'nav button[data-v=dane]{display:none!important}.toast{display:none!important}'),
    dict(k='p200', short='200', name='T50 200 · x1x · 5 modeli (1T/2T) · K8', src='test200.html', overlay='overlay_fsm.js',
         store='added', key='t50_200_v1_added', extra=[['t50_200_v1_autobk', '0']],
         css='header{padding:5px 12px!important}header h1{font-size:14px!important}#entry{display:none!important}'
             'nav button[data-v=dane]{display:none!important}.toast{display:none!important}'),
    dict(k='trojka', short='TRÓJKA', name='TRÓJKA V1.3 · x1x · T1/T2 off +7 · K8', src='trojka.html', overlay='overlay_trojka.js',
         store='csv', key='v13_troika_codes_v1', extra=[['v13_troika_autobak', '0']],
         css='.pad{display:none!important}footer .frow{margin-bottom:0!important}#bak,#toast{display:none!important}'
             '#miExp,#miImp,#miTxt,#miClr,.sw{display:none!important}'),
    dict(k='slot2', short='2-SLOT', name='x1x 2-slot · strategie C / A · K8', src='px50x1x.html', overlay='overlay_slot2.js',
         store='json', key='x1x_2slot_codes_v1', extra=[],
         css='.pad{display:none!important}footer .frow{margin-bottom:0!important}#bak,#toast{display:none!important}'
             '#miExp,#miImp,#miClear,.sw{display:none!important}'),
]

VER = {'t1t50.html': r"const APP_VER = '([^']+)'", 'test200.html': r"const APP_VER = '([^']+)'",
       'trojka.html': r"const APP_VER='([^']+)'", 'px50x1x.html': r"const APP_VER='([^']+)'"}
SEEDS = {'t1t50.html': r"const SEED = '(\d+)'", 'test200.html': r"const SEED = '(\d+)'",
         'trojka.html': r'const SEED="(\d+)"', 'px50x1x.html': r'const SEED_STR="(\d+)"'}

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
        seed = re.search(SEEDS[a['src']], html).group(1)
        seeds[a['src']] = seed
        ov = (SRC / a['overlay']).read_text()
        for k, v in REFS.items():
            ov = ov.replace(k, v)
        html = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', '', html)
        html = html.replace('</head>', f'<style>{a["css"]}</style>\n</head>', 1)
        tail = f'<script>{common}</script>\n<script>{ov}</script>\n</body>'
        i = html.rindex('</body>')
        html = html[:i] + tail + html[i + len('</body>'):]
        out.append(dict(k=a['k'], short=a['short'], name=a['name'], ver=re.search(VER[a['src']], html).group(1),
                        store=a['store'], key=a['key'], extra=a['extra'], seedN=len(seed) // 3, html=html))

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


if __name__ == '__main__':
    main()
