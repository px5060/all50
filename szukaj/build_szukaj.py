#!/usr/bin/env python3
"""Buduje ../szukaj.html z szukaj_template.html + seed z ../index.html + pule pool_<t50|t60>_<cel>.json.
Uruchom w katalogu szukaj/:  python3 build_szukaj.py t50|t60"""
import json, re, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
APPS = {
    't50': dict(title='T50 SZUKAJ', app='t50', seedKey='t50razem_v1_added', razem='T50 RAZEM', targets=['x1x'],
                alph=[a + b + c for a in '01' for b in '01' for c in '01'], first='01x', maxUnion=3, seedFix={14676: '000'}),
    't60': dict(title='T60 SZUKAJ', app='t60', seedKey='t60razem_v1_added', razem='T60 RAZEM', targets=['x1x', 'xx1'],
                alph=[a + b + c for a in '0123' for b in '01' for c in '01'], first='0123x', maxUnion=2, seedFix={}),
}


def main():
    name = sys.argv[1]
    a = APPS[name]
    seed = re.search(r"const MASTER_SEED = '(\d+)'", (HERE.parent / 'index.html').read_text()).group(1)
    pools = {}
    for t in a['targets']:
        p = json.loads((HERE / f'pool_{name}_{t}.json').read_text())
        assert p['seedN'] <= len(seed) // 3
        pools[t] = {'seedN': p['seedN'], 'pool': p['pool']}
        rules, minc = p['rules'], p['minCyc']
    cfg = {k: a[k] for k in ('app', 'seedKey', 'razem', 'targets', 'alph', 'first', 'maxUnion', 'seedFix')}
    cfg.update(defRules=rules, minCyc=minc)
    html = (HERE / 'szukaj_template.html').read_text()
    html = (html.replace('__TITLE__', a['title']).replace('__SEED__', seed)
                .replace('__CFG__', json.dumps(cfg, ensure_ascii=False))
                .replace('__POOLS__', json.dumps(pools, ensure_ascii=False, separators=(',', ':'))))
    (HERE.parent / 'szukaj.html').write_text(html)
    print('zapisano ../szukaj.html', len(html) // 1024, 'KB;', {t: len(p['pool']) for t, p in pools.items()})


if __name__ == '__main__':
    main()
