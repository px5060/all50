"""Obraz „jak screen”: karty wycięte ze screenów użytkownika + pod każdą 1–2 linie (krok, stawka, Nr, limit) + stopka.
Użycie: python3 karty.py spec.json wynik.png
spec = {"tytul": "MOJE · 4 + 4", "pod": "stan po Nr …",
        "sekcje": [{"nazwa": "MOJE T50", "karty": [{"obraz": "screen.png", "wytnij": [x0, y0, x1, y1], "opis": "**k3 · 16 zł** · [[Nr 15 419]]"}]}],
        "stopka": ["Czym się kierowałem:", "1. …"]}
Znaczniki w opisie: **pogrubienie**, [[żółte — Nr]], {{czerwone — uwaga}}. Współrzędne w pikselach oryginału (screen 1080 px szer.)."""
import json, re, sys
from PIL import Image, ImageDraw, ImageFont

F, FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BG, PANEL, OR, WH, GR, RED, YEL = (18, 21, 28), (27, 31, 42), (201, 122, 69), (236, 238, 242), (150, 156, 170), (240, 110, 110), (240, 200, 80)
W, PAD = 1080, 40
font = lambda s, b=False: ImageFont.truetype(FB if b else F, s)


def segs(t, base=WH):
    out = []
    for part in re.split(r'(\*\*.+?\*\*|\[\[.+?\]\]|\{\{.+?\}\})', t):
        if not part:
            continue
        if part.startswith('**'): out.append((part[2:-2], base, True))
        elif part.startswith('[['): out.append((part[2:-2], YEL, True))
        elif part.startswith('{{'): out.append((part[2:-2], RED, True))
        else: out.append((part, base, False))
    return out


def wrap(d, sg, sz, maxw):
    toks, pend = [], ''
    for t, c, b in sg:
        t = re.sub(r'(\d) (\d)', '\\1\u00a0\\2', pend + t).replace('Nr ', 'Nr\u00a0'); pend = ' ' if t.endswith(' ') else ''; t = t.rstrip(' ')
        toks += [(x, c, b) for x in re.findall(r' *[^ ]+', t)]
    lines, cur, cw = [], [], 0
    for tok, c, b in toks:
        piece = tok if cur else tok.lstrip(' '); wl = d.textlength(piece, font=font(sz, b))
        if cur and cw + wl > maxw:
            lines.append(cur); cur, cw = [], 0; piece = tok.lstrip(' '); wl = d.textlength(piece, font=font(sz, b))
        cur.append((piece, c, b)); cw += wl
    return lines + ([cur] if cur else [])


def draw(d, x, y, lines, sz, lh):
    for ln in lines:
        xx = x
        for t, c, b in ln:
            d.text((xx, y), t, fill=c, font=font(sz, b)); xx += d.textlength(t, font=font(sz, b))
        y += lh
    return y


def main(spec_path, out):
    S = json.load(open(spec_path)); tmp = ImageDraw.Draw(Image.new('RGB', (W, 10))); items, H = [], 200
    for s in S['sekcje']:
        H += 70
        for k in s['karty']:
            im = Image.open(k['obraz']).convert('RGB')
            if k.get('wytnij'): im = im.crop(tuple(k['wytnij']))
            if im.width > W - 80: im = im.resize((W - 80, round(im.height * (W - 80) / im.width)))
            ln = wrap(tmp, [('▶ ', OR, True)] + segs(k.get('opis', '')), 30, W - 2 * PAD - 20)
            items.append((s['nazwa'], im, ln)); H += im.height + len(ln) * 42 + 40
    st = []
    for i, t in enumerate(S.get('stopka', [])): st += wrap(tmp, segs(t, OR if i == 0 else WH) if i else [(t, OR, True)], 28, W - 2 * PAD - 20)
    H += len(st) * 40 + 80
    img = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(img); y = 36
    d.text((PAD, y), S.get('tytul', ''), fill=WH, font=font(50, True)); y += 66
    d.text((PAD, y), S.get('pod', ''), fill=GR, font=font(28)); y += 60
    cur = None
    for nazwa, im, ln in items:
        if nazwa != cur:
            cur = nazwa; y += 10; d.text((PAD, y), nazwa, fill=OR, font=font(40, True)); y += 60
        img.paste(im, ((W - im.width) // 2, y)); y += im.height + 8
        y = draw(d, PAD + 10, y, ln, 30, 42) + 24
    if st:
        y += 10; d.rounded_rectangle((PAD - 16, y, W - PAD + 16, y + len(st) * 40 + 36), 20, fill=PANEL, outline=OR, width=3); y += 18
        y = draw(d, PAD + 6, y, st, 28, 40) + 30
    img.crop((0, 0, W, y + 20)).save(out)
    print(out)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
