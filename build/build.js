const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const S = '/tmp/claude-0/-home-claude/6344f15e-4e1e-5e43-ac0a-3b0b502f3398/scratchpad';
const P = S + '/artifact-files/c03cd219-c812-44cf-a76e-7511f3f51109/project';
const OUT = S + '/site/out';
const SITE = 'https://vanlifezando.com';
const SAME = ['https://www.instagram.com/vanlifezando/', 'https://www.youtube.com/@vanlifezando', 'https://www.tiktok.com/@vanlifezando'];
const VER = require('crypto').createHash('md5').update(fs.readFileSync(S + '/site/src/vlz.js')).digest('hex').slice(0, 8);
const IMG = JSON.parse(fs.readFileSync(S + '/site/imgmap.json', 'utf8'));

const PAGES = {
  Main: { dir: '', desc: 'Nica e Bruno moram num motorhome que construíram sozinhos. Roteiros reais, custos de verdade e guias para você viajar ou construir o seu.' },
  PostCores: { dir: 'dolomitas-de-motorhome', type: 'article', desc: '30 dias nas Dolomitas de motorhome: Tre Cime, Braies, Seceda, onde dormir, reservas e custos reais. O que a gente queria saber antes de ir.' },
  VidaNaEstradaB: { dir: 'vida-na-estrada', type: 'article', autor: 'Nica e Bruno', desc: 'Construímos nossa casa sobre rodas sozinhos em 6 meses. Custos reais, erros, elétrica, água e gás, e quanto custa viver na estrada.' },
  Sobre: { dir: 'sobre-nos', title: 'Sobre nós: o casal brasileiro por trás do Vanlifezando', desc: 'Da festa de Dia dos Namorados à vida num motorhome pela Europa. Conheça a história da Nica e do Bruno.' },
  Contato: { dir: 'contato', title: 'Contato · Vanlifezando', desc: 'Parcerias, publicidade ou dúvidas sobre motorhome e viagens. Fale com a Nica e o Bruno.' },
  Privacidade: { dir: 'politica-de-privacidade', title: 'Política de privacidade · Vanlifezando', noindex: true, desc: 'Como o Vanlifezando trata os seus dados, conforme a LGPD e o GDPR.' },
  Cookies: { dir: 'politica-de-cookies', title: 'Política de cookies · Vanlifezando', noindex: true, desc: 'Quais cookies usamos e como aceitar ou recusar.' },
};

function between(s, a, b) { const i = s.indexOf(a); if (i < 0) return ''; const j = s.indexOf(b, i + a.length); return s.slice(i + a.length, j); }
function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function jsonSafe(o) { return JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }

function rewrite(txt, depth) {
  const up = depth ? '../' : '';
  txt = txt.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => { if (!IMG[id]) throw new Error('img ' + id); return up + 'assets/img/' + IMG[id]; });
  txt = txt.replace(/\b(Main|PostCores|VidaNaEstradaB|Sobre|Contato|Privacidade|Cookies)\.dc\.html/g, (m, k) => {
    const d = PAGES[k].dir; return d ? up + d + '/' : (depth ? '../' : './');
  });
  return txt;
}

(async () => {
  fs.mkdirSync(OUT + '/assets/js', { recursive: true });
  fs.copyFileSync(S + '/site/src/vlz.js', OUT + '/assets/js/vlz.js');
  const built = [], sitemap = [];
  for (const [k, cfg] of Object.entries(PAGES)) {
    const src = fs.readFileSync(`${P}/${k}.dc.html`, 'utf8');
    const depth = cfg.dir ? 1 : 0, up = depth ? '../' : '';
    const xdc = between(src, '<x-dc>', '</x-dc>');
    const helmet = between(xdc, '<helmet>', '</helmet>');
    let tpl = xdc.replace(/<helmet>[\s\S]*?<\/helmet>/, '').trim();
    const scriptTag = src.match(/<script type="text\/x-dc" data-dc-script(?: data-props='([^']*)')?>([\s\S]*?)<\/script>/);
    const rawProps = scriptTag[1] ? JSON.parse(scriptTag[1]) : {};
    const props = {};
    for (const [pk, pv] of Object.entries(rawProps)) if (pk[0] !== '$' && pv && 'default' in pv) props[pk] = pv.default;
    let code = scriptTag[2];
    const title = cfg.title || between(src, '<title>', '</title>').trim();
    tpl = rewrite(tpl, depth); code = rewrite(code, depth);
    if (k === 'Contato') {
      const a = "self.setState({ ct_tentou: true, ct_status: valido ? 'email' : '' });";
      if (!code.includes(a)) throw new Error('contato: envio mudou');
      code = code.replace(a, a + " if (valido) { var assunto = cv('ct_assunto') || 'Contato pelo blog'; var corpo = cv('ct_msg') + '\\n\\n— ' + cv('ct_nome') + '\\n' + cv('ct_email') + (cv('ct_tel') ? '\\n' + cv('ct_tel') : ''); window.location.href = 'mailto:vanlifezando@gmail.com?subject=' + encodeURIComponent(assunto + ' · Vanlifezando') + '&body=' + encodeURIComponent(corpo); }");
      const t = /Tudo certo com o formulário! <strong>Neste protótipo[\s\S]*?continuam preenchidos\./;
      if (!t.test(tpl)) throw new Error('contato: aviso mudou');
      tpl = tpl.replace(t, 'Tudo certo! <strong>Abrimos o seu app de e-mail com a mensagem pronta</strong>, é só clicar em enviar. Se nada abriu, escreva direto para <a href="mailto:vanlifezando@gmail.com" style="color: #DDA15E">vanlifezando@gmail.com</a>.');
    }
    let head = rewrite(helmet, depth);
    const links = (head.match(/<link[^>]*>/g) || []).join('\n');
    const styles = (head.match(/<style>[\s\S]*?<\/style>/g) || []).join('\n');
    const ogRel = (tpl.match(/<img[^>]+src="([^"]+\.webp)"/) || [])[1];
    const ogImg = ogRel ? SITE + '/' + ogRel.replace(/^(\.\.\/)+/, '') : '';
    const url = SITE + '/' + (cfg.dir ? cfg.dir + '/' : '');
    let ld = null;
    if (k === 'Main') ld = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Vanlifezando', url, inLanguage: 'pt-BR', description: cfg.desc,
      publisher: { '@type': 'Organization', name: 'Vanlifezando', url: SITE, sameAs: SAME } };
    else if (cfg.type === 'article') ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description: cfg.desc, image: ogImg || undefined,
      inLanguage: 'pt-BR', mainEntityOfPage: url, url, author: { '@type': 'Person', name: cfg.autor || 'Nica' },
      publisher: { '@type': 'Organization', name: 'Vanlifezando', url: SITE } };
    sitemap.push({ url, noindex: !!cfg.noindex });
    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(cfg.desc)}">
${cfg.noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Vanlifezando">
<meta property="og:locale" content="pt_BR">
<meta property="og:type" content="${cfg.type || 'website'}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(cfg.desc)}">
${ogImg ? `<meta property="og:image" content="${escAttr(ogImg)}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#141B12">
${ld ? `<script type="application/ld+json">${jsonSafe(ld)}</script>\n` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${links}
${styles}
<style>#vlz{container-type:inline-size;width:100%}#vlz header{position:fixed!important;top:0;left:0;right:0;z-index:50!important;transition:background-color .3s,box-shadow .3s}#vlz header>div{transition:padding .3s}html.vlz-rolou #vlz header{background:rgba(15,20,13,0.95)!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 1px 0 rgba(221,161,94,0.25)}html.vlz-rolou #vlz header>div{padding-top:8px!important;padding-bottom:8px!important}#vlz div:has(> nav[aria-label="Menu principal"]){position:fixed!important;inset:0!important;height:auto!important;z-index:70!important}#vlz [id]{scroll-margin-top:84px!important}@media (max-width:600px){#vlz footer>div{flex-wrap:nowrap!important;align-items:center!important;gap:16px!important}#vlz footer>div>a[aria-label^="Vanlifezando"]{font-size:13px!important;letter-spacing:0.14em!important;flex:none}#vlz footer nav[aria-label="Rodapé"]{flex-direction:column!important;gap:6px!important;align-items:flex-end;text-align:right;margin-left:auto}#vlz footer nav[aria-label="Rodapé"]>div{align-items:flex-end;gap:6px!important}#vlz footer nav[aria-label="Rodapé"] a{font-size:10px!important;letter-spacing:0.1em!important}}</style>
</head>
<body>
<div id="vlz" data-pre="1"><!--VLZ-PRE--></div>
<script type="application/json" id="vlz-dados">${jsonSafe({ tpl, code, props })}</script>
<script src="${up}assets/js/vlz.js?v=${VER}" defer></script>
</body>
</html>
`;
    const dir = cfg.dir ? OUT + '/' + cfg.dir : OUT;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dir + '/index.html', html);
    built.push(dir + '/index.html');
  }
  const hoje = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(OUT + '/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemap.filter(x => !x.noindex).map(x => `  <url><loc>${x.url}</loc><lastmod>${hoje}</lastmod></url>`).join('\n') + '\n</urlset>\n');
  // pré-renderiza o conteúdo (Google e quem abre sem JavaScript veem tudo)
  const b = await chromium.launch();
  for (const f of built) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route(/^https?:/, r => r.abort());
    await p.goto('file://' + f);
    await p.waitForFunction(() => window.__vlzPrimeiro);
    const pre = await p.evaluate(() => window.__vlzPrimeiro);
    if (errs.length) console.log('ERR', f, errs);
    const txt = fs.readFileSync(f, 'utf8').replace('<!--VLZ-PRE-->', () => pre);
    fs.writeFileSync(f, txt);
    console.log(path.relative(OUT, f), Math.round(txt.length / 1024) + 'KB');
    await p.close();
  }
  await b.close();
})();
