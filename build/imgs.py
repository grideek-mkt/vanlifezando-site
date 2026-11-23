import re,os,json,unicodedata,sys
from PIL import Image
S=sys.argv[1];P=sys.argv[2]
pages=['Main','PostCores','VidaNaEstradaB','Sobre','Contato','Privacidade','Cookies']
src=''.join(open(f'{P}/{p}.dc.html',encoding='utf8').read() for p in pages)
ids=open(f'{S}/site/ids.txt').read().split()
def slug(t):
    t=unicodedata.normalize('NFKD',t).encode('ascii','ignore').decode().lower()
    t=re.sub(r'[^a-z0-9]+','-',t).strip('-')
    w=[x for x in t.split('-') if x not in('de','da','do','e','a','o','no','na','nas','nos','com','um','uma','ao','em','dos','das','os','as')]
    return '-'.join(w[:7]) or 'foto'
out=f'{S}/site/out/assets/img';os.makedirs(out,exist_ok=True)
mp={};used=set()
for i in ids:
    alt=None
    for m in re.finditer('/_blob/'+i,src):
        seg=src[m.end():m.end()+500]
        a=re.search(r'^[^<>]*?alt="([^"]+)"',seg) or re.search(r'^"\s*,\s*"alt"\s*:\s*"([^"]+)"',seg) or re.search(r'^"\s*,\s*"([^"]+)"\]',seg) or re.search(r'^[^\n]{0,200}?"alt"\s*:\s*"([^"]+)"',seg)
        if a: alt=a.group(1);break
        seg=src[max(0,m.start()-400):m.start()]
        a=re.search(r'alt="([^"]+)"[^<>]*$',seg)
        if a: alt=a.group(1);break
    base=slug(alt) if alt else 'vanlifezando-'+i[:6]
    n=base;k=2
    while n in used: n=f'{base}-{k}';k+=1
    used.add(n)
    f=[x for x in os.listdir(f'{S}/site/blobs') if x.startswith(i)][0]
    if f.endswith('.svg'):
        open(f'{out}/{n}.svg','wb').write(open(f'{S}/site/blobs/{f}','rb').read());mp[i]=n+'.svg';continue
    im=Image.open(f'{S}/site/blobs/{f}');im=im.convert('RGBA' if im.mode in('RGBA','LA','P') else 'RGB')
    W=1920
    for W in (1920,1600,1400,1200,1000,900):
        img=im.copy()
        if img.width>W: img=img.resize((W,round(img.height*W/img.width)),Image.LANCZOS)
        for q in (80,74,68,62,56):
            img.save(f'{out}/{n}.webp','WEBP',quality=q,method=6)
            if os.path.getsize(f'{out}/{n}.webp')<=300_000: break
        if os.path.getsize(f'{out}/{n}.webp')<=300_000: break
    mp[i]=n+'.webp'
    print(n, alt is not None, im.size, os.path.getsize(f'{out}/{n}.webp')//1024,'KB')
json.dump(mp,open(f'{S}/site/imgmap.json','w'),indent=1)
