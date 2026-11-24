# Gera versões médias (lado maior 1000px) das fotos para exibir na página; a original fica para a foto ampliada.
import os, sys
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'out', 'assets', 'img')
M = os.path.join(D, 'm'); os.makedirs(M, exist_ok=True)
n = 0
for f in os.listdir(D):
    if not f.endswith('.webp'): continue
    im = Image.open(os.path.join(D, f))
    if max(im.size) <= 1000: continue
    dst = os.path.join(M, f)
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(os.path.join(D, f)): continue
    im = im.copy(); im.thumbnail((1000, 1000), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=80, method=6); n += 1
print('medias geradas:', n)
