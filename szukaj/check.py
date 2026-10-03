import re, numpy as np
from engine import *
s = open('/home/user/all50/src/apps/t50x1x.html').read()
codes = load('/home/user/analiza/t50.txt'); al = ALPH['t50']; X = np.array([al.index(c) for c in codes]); y = np.array([c[1] == '1' for c in al], np.uint8)
mods = re.findall(r"\{ id: '([^']+)',\s*typ: '[^']+', STEP: '([^']+)',\s*xSTEP: (\d), TRIGGER: '([^']+)',\s*offset: (\d) \}", s)
exp = dict((k, v) for k, v in re.findall(r"'([0-9A-Z_]+)':\s*\[([^\]]+)\]", s))
out = np.zeros(11, np.int64)
for mid, S, x, T, o in mods:
    a, la = table(S, al); b, lb = table(T, al)
    sim(a, la, b, lb, int(x), int(o), X, y, len(X), out)
    e = [float(v) for v in exp[mid].split(',')]
    got = (out[0], out[1] + out[2], out[1], out[2], out[3])
    ok = got == (e[0], e[1], e[2], e[3], e[5])
    print(mid, 'zakł/cykle/W/B/bilans', got, 'wzorzec', (e[0], e[1], e[2], e[3], e[5]), 'OK' if ok else 'RÓŻNICA')
