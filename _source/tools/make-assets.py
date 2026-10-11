"""Builds the logo files, favicon, social image and hero pattern from the original logo.

Needs Pillow (pip install pillow). Run from the project root:
    python3 _source/tools/make-assets.py
Reads  _source/brand/logo-original.png
Writes assets/logo.png, logo-mark.png, favicon-32.png, apple-touch-icon.png, og.png, maze.svg
"""
import os
import random
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(ROOT, '_source', 'brand', 'logo-original.png')
OUT = os.path.join(ROOT, 'assets')

BG = (0, 17, 25)        # #001119, the logo's own background
CYAN = '#08FBFA'
GREEN = '#00BF63'

src = Image.open(SRC).convert('RGB')


def colour_to_alpha(img, bg, inks):
    """Turn the flat background transparent. Each pixel is matched to the logo ink it lies
    closest to (cyan, green or white) and keeps that exact ink colour, so soft edges stay
    clean over any background."""
    out = Image.new('RGBA', img.size)
    sp, op = img.load(), out.load()
    vecs = [tuple(i[c] - bg[c] for c in range(3)) for i in inks]
    norms = [sum(v[c] * v[c] for c in range(3)) for v in vecs]
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            p = sp[x, y]
            d = tuple(p[c] - bg[c] for c in range(3))
            best = None
            for k, v in enumerate(vecs):
                t = sum(d[c] * v[c] for c in range(3)) / norms[k]
                res = sum((d[c] - t * v[c]) ** 2 for c in range(3))
                if best is None or res < best[0]:
                    best = (res, t, k)
            _, t, k = best
            a = max(0.0, min(1.0, t))
            if a <= 0.01:
                op[x, y] = (0, 0, 0, 0)
            else:
                op[x, y] = tuple(inks[k]) + (round(a * 255),)
    return out


INKS = [(8, 251, 250), (0, 191, 99), (255, 255, 255)]   # cyan, green, white
clear = colour_to_alpha(src, BG, INKS)


def crop(img, box, pad):
    l, t, r, b = box
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.size[0], r + pad), min(img.size[1], b + pad)))


# Content boxes measured from the original: mark, and the whole lockup (mark + wordmark + subtitle).
mark = crop(clear, (145, 67, 355, 307), 8)


def build_lockup(name='Sheerwater', sub='Consulting'):
    """Mark above a drawn wordmark, so the business name can change without the original artwork."""
    from PIL import ImageDraw, ImageFont
    fonts = '/usr/share/fonts/truetype/google-fonts/'
    f_name = ImageFont.truetype(fonts + 'Poppins-Medium.ttf', 58)
    f_sub = ImageFont.truetype(fonts + 'Poppins-Light.ttf', 24)
    spacing = 9
    sub_w = sum(f_sub.getlength(c) for c in sub) + spacing * (len(sub) - 1)
    name_w = f_name.getlength(name)
    W = int(max(mark.size[0], name_w, sub_w)) + 40
    H = mark.size[1] + 24 + 74 + 22 + 34 + 12
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(mark, ((W - mark.size[0]) // 2, 6))
    d = ImageDraw.Draw(canvas)
    y = mark.size[1] + 24
    d.text(((W - name_w) / 2, y), name, font=f_name, fill=(255, 255, 255, 255))
    x = (W - sub_w) / 2
    y2 = y + 84
    for c in sub:
        d.text((x, y2), c, font=f_sub, fill=(8, 251, 250, 255))
        x += f_sub.getlength(c) + spacing
    return canvas


lockup = build_lockup()
mark.save(os.path.join(OUT, 'logo-mark.png'), optimize=True)
lockup.save(os.path.join(OUT, 'logo.png'), optimize=True)


def on_square(size, fill_ratio):
    canvas = Image.new('RGBA', (size, size), BG + (255,))
    m = mark.copy()
    scale = size * fill_ratio / max(m.size)
    m = m.resize((max(1, round(m.size[0] * scale)), max(1, round(m.size[1] * scale))), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.size[0]) // 2, (size - m.size[1]) // 2))
    return canvas


on_square(32, 0.92).save(os.path.join(OUT, 'favicon-32.png'), optimize=True)
on_square(180, 0.70).save(os.path.join(OUT, 'apple-touch-icon.png'), optimize=True)

# Social sharing image, 1200 x 630
og = Image.new('RGBA', (1200, 630), BG + (255,))
lk = lockup.copy()
scale = 470 / lk.size[1]
lk = lk.resize((round(lk.size[0] * scale), 470), Image.LANCZOS)
og.alpha_composite(lk, ((1200 - lk.size[0]) // 2, (630 - lk.size[1]) // 2))
og.convert('RGB').save(os.path.join(OUT, 'og.png'), optimize=True)

# Hero pattern: rounded, right-angled line runs in the style of the logo's maze.
# Runs never touch each other, so the texture reads as separate lines, not a tangle.
random.seed(23)
STEP, W, H = 36, 1200, 760
cols, rows = W // STEP, H // STEP
owner = {}
paths = []


def free(pt, pid):
    x, y = pt
    if not (1 <= x < cols - 1 and 1 <= y < rows - 1) or pt in owner:
        return False
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
        o = owner.get((x + dx, y + dy))
        if o is not None and o != pid:
            return False
    return True


for attempt in range(1800):
    if len(paths) >= 70:
        break
    pid = len(paths)
    start = (random.randrange(1, cols - 1), random.randrange(1, rows - 1))
    if not free(start, pid):
        continue
    pts = [start]
    mine = [start]
    owner[start] = pid
    horizontal = random.random() < 0.5
    for _seg in range(random.randint(3, 6)):
        length = random.randint(1, 3)
        dx, dy = ((random.choice((1, -1)), 0) if horizontal else (0, random.choice((1, -1))))
        cx, cy = pts[-1]
        run = []
        for _ in range(length):
            cx, cy = cx + dx, cy + dy
            if not free((cx, cy), pid):
                break
            owner[(cx, cy)] = pid
            run.append((cx, cy))
        if not run:
            break
        mine.extend(run)
        pts.append(run[-1])
        horizontal = not horizontal
    if len(pts) >= 3:
        paths.append(pts)
    else:
        for pt in mine:
            owner.pop(pt, None)

lines = []
for pts in paths:
    colour = CYAN if random.random() < 0.7 else GREEN
    d = 'M' + ' L'.join(f'{px * STEP} {py * STEP}' for px, py in pts)
    lines.append(f'<path d="{d}" stroke="{colour}"/>')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke-width="9" '
       f'stroke-linecap="round" stroke-linejoin="round">\n' + '\n'.join(lines) + '\n</svg>\n')
with open(os.path.join(OUT, 'maze.svg'), 'w') as f:
    f.write(svg)

for name in ('logo.png', 'logo-mark.png'):
    print(name, Image.open(os.path.join(OUT, name)).size)
print('maze paths:', len(paths))
