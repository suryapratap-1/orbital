# Grade the AI stills as one set: crop the watermark band, crop to aspect, upscale, shared grade + grain → WebP.
import random
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
SRC, OUT = 'assets-src/gen', 'public/img'
SPECS = {  # src: (out name, size, look)
  'launch': ('arc-launch', (1600, 1000), 'mission'), 'hall': ('arc-hall', (1600, 1000), 'mission'),
  'limb': ('arc-limb', (1600, 1000), 'mission'), 'array': ('arc-array', (960, 1200), 'mission'),
  'testfire': ('arc-testfire', (1600, 1000), 'mission'), 'control': ('arc-control', (1600, 1000), 'mission'),
  'pool': ('arc-pool', (960, 1200), 'mission'), 'cluster': ('arc-cluster', (1600, 1000), 'mission'),
  'crew1': ('crew-varga', (880, 1100), 'dossier'), 'crew2': ('crew-okafor-lund', (880, 1100), 'dossier'),
  'crew3': ('crew-castell', (880, 1100), 'dossier'), 'crew4': ('crew-adeyemi', (880, 1100), 'dossier'),
}
def grain(im, amt):
    random.seed(3)
    n = Image.effect_noise(im.size, 64).convert('L').point(lambda v: 128 + (v - 128) * amt // 64)
    return ImageChops.overlay(im, Image.merge('RGB', [n, n, n]))
def grade(im, look):
    if look == 'dossier':
        im = ImageEnhance.Color(im).enhance(0.28)
        r, g, b = im.split()
        r = r.point(lambda v: int(v * 0.94)); b = b.point(lambda v: min(255, int(v * 1.04 + 4)))
        im = Image.merge('RGB', (r, g, b))
        return ImageEnhance.Contrast(im).enhance(1.08)
    im = ImageEnhance.Color(im).enhance(0.86)
    r, g, b = im.split()
    # cool shadows, warm highlights
    r = r.point(lambda v: min(255, int(v * (0.92 + 0.12 * v / 255))))
    b = b.point(lambda v: min(255, int(v * (1.06 - 0.1 * v / 255) + 3)))
    return ImageEnhance.Contrast(Image.merge('RGB', (r, g, b))).enhance(1.05)
for src, (name, (W, H), look) in SPECS.items():
    im = Image.open(f'{SRC}/{src}.jpg').convert('RGB')
    w, h = im.size
    im = im.crop((0, 0, w, int(h * .93)))
    w, h = im.size; tr = W / H
    if w / h > tr:
        nw = int(h * tr); x0 = (w - nw) // 2
        if look == 'dossier': x0 = int((w - nw) * 0.5)
        im = im.crop((x0, 0, x0 + nw, h))
    else:
        nh = int(w / tr); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=2))
    im = grain(grade(im, look), 9 if look == 'mission' else 12)
    im.save(f'{OUT}/{name}.webp', quality=78, method=6)
    print(name, im.size)
