# Vanlifezando: ferramentas do site (branch `ferramentas`)

Este branch NÃO é publicado (a Hostinger publica só o `main`). Aqui ficam os scripts que geram o site.

## O que é cada arquivo
- `src/vlz.js` — runtime do site (template, eventos, efeitos de rolagem com fallback para Safari). Vai para `assets/js/vlz.js`.
- `build/build.js` — lê as páginas `.dc.html` do protótipo (artifact Design), troca `/_blob/<id>` por imagens WebP, gera `index.html` de cada página com SEO (canonical, OG, JSON-LD), `sitemap.xml` e pré-renderiza com Playwright.
- `build/imgs.py` — baixa/converte as imagens do protótipo em WebP (≤300KB) com nomes descritivos e grava `imgmap.json`.
- `build/serve.sh` — servidor local na porta 8765 para testar `out/`.
- `padrao/aplicar.py` — injeta o bloco CSS "PADRAO LEITURA" (entre `/* ===== PADRAO LEITURA (inicio) ===== */` e `(fim)`) em Vida, Sobre, Contato, Privacidade e Cookies.
- `dados/imgmap.json` — mapa id do blob → nome do arquivo WebP. `dados/ids.txt` — lista de blobs usados.
- `test/` — testes de interação (`i.js`), fallback Safari (`fx.js`) e geral (`t.js`).

## Como refazer o site numa sessão nova
1. Baixar os arquivos do artifact Design (https://claude.ai/artifact/QjphKWt6rhRSmbuPcuism2) com Artifact `read` (paths `*.dc.html` + blobs usados).
2. Ajustar no topo de `build/build.js` as constantes `S`, `P` (pasta das `.dc.html`) e `OUT` para os caminhos da sessão nova; idem em `imgs.py` e `aplicar.py`.
3. `python3 build/imgs.py` (se houver imagens novas) → `node build/build.js`.
4. Testar com `build/serve.sh` + `node test/i.js`.
5. Copiar `out/.` para o branch `main` do repo, commit e push → a Hostinger publica sozinha.

Páginas oficiais: Main (início), PostCores (Dolomitas), VidaNaEstradaB, Sobre, Contato, Privacidade, Cookies.
