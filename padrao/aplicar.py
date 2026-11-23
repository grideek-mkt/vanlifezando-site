import re,sys
P='/tmp/claude-0/-home-claude/6344f15e-4e1e-5e43-ac0a-3b0b502f3398/scratchpad/artifact-files/c03cd219-c812-44cf-a76e-7511f3f51109/project/'
INI='/* ===== PADRAO LEITURA (inicio) ===== */'
FIM='/* ===== PADRAO LEITURA (fim) ===== */'
D='[style*="background: rgb(33, 43, 29)"]'
DX=':not([style*="background: rgb(42, 31, 22)"] *):not([style*="background: rgb(33, 43, 29)"] *):not([style*="background: rgb(27, 36, 24)"] *):not([style*="background: rgb(20, 27, 18)"] *)'

def comum(M):
    return f'''
/* Títulos dos quadros escuros em laranja */
{M} {D} div[style*="font-size: 10px; font-weight: 700"][style*="text-transform: uppercase"],
{M} {D} > div[style^="font-size: 16px; font-weight: 700"],{M} {D} > div[style^="font-size: 15px; font-weight: 700"],
{M} details > summary{{color:#DDA15E !important}}
/* Cards dentro de cartões escuros: contorno fino */
{M} {D} {D}{{border:1px solid rgba(221, 161, 94, 0.55) !important;box-shadow:none !important}}
/* Texto maior */
@container (min-width: 601px){{
{M} [style*="font-size: 13px"]{{font-size:15.5px !important}}
{M} [style*="font-size: 14px"]{{font-size:17px !important}}
{M} [style*="font-size: 15px"]{{font-size:17px !important}}
{M} [style*="font-size: 16px"]{{font-size:18px !important}}
{M} [style*="font-size: 11px"]{{font-size:12px !important}}
{M} p,{M} li{{line-height:1.7 !important}}
}}
@container (max-width: 600px){{
{M} [style*="font-size: 13px"]{{font-size:15px !important}}
{M} [style*="font-size: 14px"]{{font-size:16px !important}}
{M} [style*="font-size: 15px"]{{font-size:16px !important}}
{M} [style*="font-size: 16px"]{{font-size:17px !important}}
{M} p,{M} li{{line-height:1.65 !important}}
}}
'''

def claro(L):
    # regras para conteúdo em fundo claro dentro do seletor L (exclui cartões escuros)
    return f'''
{L}{{color:#1B2418}}
{L} [style*="color: rgb(242, 240, 232)"]{DX}:not({D}):not([style*="background: rgb(42, 31, 22)"]):not([style*="background: rgb(27, 36, 24)"]):not([style*="background: rgb(20, 27, 18)"]):not([style*="background: rgb(38, 48, 31)"]):not([style*="background: rgb(188, 108, 37)"]):not([style*="background: rgb(221, 161, 94)"]){{color:#1B2418 !important}}
{L} [style*="color: rgba(242, 240, 232"]{DX}{{color:#2E3529 !important}}
{L} [style*="color: rgb(189, 185, 168)"]{DX}{{color:#474D3F !important}}
{L} [style*="color: rgb(90, 97, 80)"]{DX}{{color:#474D3F !important}}
{L} [style*="color: rgb(221, 161, 94)"]{DX}:not([style*="background:"]){{color:#8A4B12 !important}}
{L} [style*="color: rgb(240, 179, 126)"]{DX}{{color:#8A4B12 !important}}
{L} {D}{{background:#1B2418 !important;color:#F2F0E8;border-color:#1B2418;box-shadow:0 6px 18px rgba(27, 36, 24, 0.18)}}
{L} [style*="rgba(242, 240, 232"]{DX}{{border-color:rgba(27, 36, 24, 0.25) !important}}
{L} [style*="solid rgb(242, 240, 232)"]{DX}:not(img):not([style*="overflow: hidden"]):not([style*="background: rgb(42, 31, 22)"]){{border-color:#1B2418 !important}}
{L} button[style*="background: transparent"]{DX}{{color:#1B2418 !important}}
{L} a{DX}:not([style*="background:"]){{color:#8A4B12}}
{L} [aria-hidden="true"][style*="rgba(242, 240, 232, 0.08)"]{{color:rgba(27, 36, 24, 0.16) !important}}
{L} [style*="background: rgba(242, 240, 232"]{DX}{{background:rgba(27, 36, 24, 0.18) !important}}
{L} {D} [style*="color: rgb(189, 185, 168)"]{{color:#D6D2C3 !important}}
'''

def vida():
    M='main.vb-main'
    X=f'{M} > section:not(#intro):not(:last-of-type)'
    return f'''
{M} > section:nth-of-type(even){{background:#FFFFFF !important;box-shadow:0 0 0 100vmax #FFFFFF,0 -2px 0 100vmax #FFFFFF !important}}
{M} > section:nth-of-type(odd):not(#intro):not(:last-of-type){{background:#F2EDE3;box-shadow:0 0 0 100vmax #F2EDE3,0 -2px 0 100vmax #F2EDE3;color:#1B2418}}
{M} > section + section{{margin-top:-1px !important}}
{X} {D}{{border:1px solid #1B2418 !important}}
{X} [style*="border-left: 3px solid"]{DX}{{border-right-color:rgba(27, 36, 24, 0.18) !important;border-top-color:rgba(27, 36, 24, 0.18) !important;border-bottom-color:rgba(27, 36, 24, 0.18) !important}}
'''+claro(X)+comum(M)

def escura(M,topo,intro=None):
    # página toda escura -> conteúdo em branco, faixa escura do topo (cabeçalho) mantida
    s=f'''
{M}{{position:relative;z-index:0}}
{M}::before{{content:"";position:absolute;z-index:-1;left:0;right:0;top:{topo};bottom:0;background:#FFFFFF;box-shadow:0 0 0 100vmax #FFFFFF;clip-path:inset(0 -100vmax)}}
'''
    if topo!='0px':
        s+=f'''{M}{{padding-top:168px !important}}
{M}{{color:#1B2418 !important}}
@container (min-width: 601px){{{M}[style*="font-size: 15px"]{{font-size:17px !important}}}}
@container (max-width: 600px){{{M}[style*="font-size: 15px"]{{font-size:16px !important}}}}
'''
    if intro:
        s+=f'''{M} > {intro}{{background:#141B12;box-shadow:0 0 0 100vmax #141B12;clip-path:inset(-400px -100vmax -48px -100vmax)}}
'''
        L=f'{M} > :not({intro})'
    else:
        L=M
    return s+claro(L)+comum(M)

def sobre():
    # Fundo escuro (como antes) e caixas de texto da linha do tempo em bege, com texto escuro
    M='main.st-main'
    C=f'{M} .st-text'
    return f'''
{C}{{background:#F2EDE3 !important;color:#1B2418 !important;box-shadow:0 14px 34px rgba(0, 0, 0, 0.35)}}
{C} [style*="color: rgb(242, 240, 232)"],{C} [style*="color: rgba(242, 240, 232"]{{color:#1B2418 !important}}
{C} [style*="color: rgb(189, 185, 168)"]{{color:#474D3F !important}}
{C} [style*="color: rgb(221, 161, 94)"]{{color:#8A4B12 !important}}
{C} a{{color:#8A4B12 !important}}
'''+comum(M)

def aplica(f,css):
    p=P+f+'.dc.html';s=open(p).read()
    if INI in s:
        a=s.index(INI);b=s.index(FIM)+len(FIM)
        if s[b:b+1]=='\n': b+=1
        s=s[:a]+s[b:]
    k=s.index('</style>')
    s=s[:k]+INI+css+FIM+'\n'+s[k:]
    open(p,'w').write(s)

aplica('VidaNaEstradaB',vida())
aplica('Sobre',sobre())
aplica('Contato',escura('main.ct-main','96px'))
aplica('Privacidade',escura('main.leg','96px'))
aplica('Cookies',escura('main.leg','96px'))
print('ok')
