/* Vanlifezando — pequeno motor das páginas (menu, sliders, abas, formulário). */
(function () {
  'use strict';
  var EV = { onClick: 'click', onChange: 'input', onSubmit: 'submit', onScroll: 'scroll', onWheel: 'wheel', onInput: 'input', onKeyDown: 'keydown' };

  function get(obj, path) {
    var p = path.split('.'), v = obj;
    for (var i = 0; i < p.length; i++) { if (v == null) return undefined; v = v[p[i]]; }
    return v;
  }
  function esc(s, attr) {
    s = String(s);
    s = s.replace(/&(?![#a-zA-Z0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return attr ? s.replace(/"/g, '&quot;') : s;
  }
  function truthy(v) { return !!v && v !== 'false' && v !== '0'; }

  /* Expande o modelo em HTML (string). Eventos viram data-vlz="click:caminho;..." */
  function expand(tpl, vals) {
    var h = tpl;
    // listas (sc-for) — de dentro para fora
    var forRe = /<sc-for list="\{\{([\w.]+)\}\}" as="(\w+)"[^>]*>((?:(?!<sc-for)[\s\S])*?)<\/sc-for>/;
    var m, guard = 0;
    while ((m = forRe.exec(h)) && guard++ < 200) {
      var lista = get(vals, m[1]) || [], nome = m[2], corpo = m[3], saida = '';
      for (var i = 0; i < lista.length; i++) {
        saida += corpo.replace(new RegExp('\\{\\{' + nome + '(\\.[\\w.]+)?\\}\\}', 'g'), function (mm, k, off, str) {
          var antes = str.slice(Math.max(0, off - 40), off);
          if (/\son[A-Z]\w*="$/.test(antes) || /<sc-if value="$/.test(antes)) return '{{' + m[1] + '.' + i + (k || '') + '}}';
          var v = k ? get(lista[i], k.slice(1)) : lista[i];
          return '\u0001' + (v == null ? '' : String(v)) + '\u0002';
        });
      }
      h = h.slice(0, m.index) + saida + h.slice(m.index + m[0].length);
    }
    // condicionais (sc-if) — de dentro para fora
    var ifRe = /<sc-if value="([^"]*)"[^>]*>((?:(?!<sc-if)[\s\S])*?)<\/sc-if>/;
    guard = 0;
    while ((m = ifRe.exec(h)) && guard++ < 500) {
      var raw = m[1], mm2 = /^\{\{([\w.]+)\}\}$/.exec(raw);
      var ok = mm2 ? truthy(get(vals, mm2[1])) : truthy(raw.replace(/[\u0001\u0002]/g, ''));
      h = h.slice(0, m.index) + (ok ? m[2] : '') + h.slice(m.index + m[0].length);
    }
    // eventos
    h = h.replace(/<([a-zA-Z][\w-]*)((?:\s+[^\s>=]+(?:="[^"]*")?)*)\s*(\/?)>/g, function (tag, nomeTag, attrs, fecha) {
      if (attrs.indexOf(' on') < 0) return tag;
      var evs = [];
      attrs = attrs.replace(/\s(on[A-Z]\w*)="\{\{([\w.]+)\}\}"/g, function (x, a, p) { if (EV[a]) evs.push(EV[a] + ':' + p); return ''; });
      if (!evs.length) return tag;
      return '<' + nomeTag + attrs + ' data-vlz="' + evs.join(';') + '"' + (fecha ? ' /' : '') + '>';
    });
    h = h.replace(/\shint-placeholder-[\w-]+="[^"]*"/g, '');
    // buracos {{x}} — em atributo escapa aspas
    h = h.replace(/\{\{([\w.]+)\}\}/g, function (x, k) {
      var v = get(vals, k);
      v = (v == null || typeof v === 'function') ? '' : String(v);
      return esc(v, true);
    });
    // cores em hex viram rgb(), como o navegador grava no protótipo (as regras de CSS dependem disso)
    h = h.replace(/\sstyle="([^"]*)"/g, function (m, v) {
      return ' style="' + v.replace(/(^|[\s:,(])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g, function (x, pre, hx) {
        if (hx.length <= 4) hx = hx.split('').map(function (c) { return c + c; }).join('');
        var r = parseInt(hx.slice(0, 2), 16), g = parseInt(hx.slice(2, 4), 16), b = parseInt(hx.slice(4, 6), 16);
        if (hx.length === 8) { var al = Math.round(parseInt(hx.slice(6, 8), 16) / 255 * 100) / 100; return pre + 'rgba(' + r + ', ' + g + ', ' + b + ', ' + al + ')'; }
        return pre + 'rgb(' + r + ', ' + g + ', ' + b + ')';
      }) + '"';
    });
    // valores vindos de listas
    h = h.replace(/\u0001([\s\S]*?)\u0002/g, function (x, v) { return esc(v, true); });
    return h;
  }

  /* Atualiza o DOM existente para ficar igual ao novo HTML (mantém foco, rolagem e campos). */
  function syncAttrs(a, b) {
    var i, at;
    for (i = a.attributes.length - 1; i >= 0; i--) { at = a.attributes[i]; if (!b.hasAttribute(at.name) && at.name !== 'style') a.removeAttribute(at.name); }
    for (i = 0; i < b.attributes.length; i++) {
      at = b.attributes[i];
      if (a.getAttribute(at.name) !== at.value) {
        if (at.name === 'style' && a.__vlzStyle === at.value) continue;
        a.setAttribute(at.name, at.value);
      }
    }
    if (b.hasAttribute('style')) a.__vlzStyle = b.getAttribute('style');
    if (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') {
      var nv = b.hasAttribute('value') ? b.getAttribute('value') : (a.tagName === 'TEXTAREA' ? b.textContent : null);
      if (nv != null && nv !== a.__vlzVal) {
        a.__vlzVal = nv;
        if (document.activeElement !== a && a.value !== nv && a.type !== 'checkbox' && a.type !== 'radio') a.value = nv;
      }
    }
  }

  // Foto ampliada no celular: toque numa foto do conteúdo abre maior, com X para fechar
  function fotoGrande() {
    if (window.__vlzLb) return; window.__vlzLb = 1;
    var mq = { matches: true };
    var st = document.createElement('style');
    st.textContent = '#vlz main img{cursor:zoom-in}#vlz main a img,#vlz main button img{cursor:pointer}' +
      '.vlz-lb{position:fixed;inset:0;z-index:200;background:rgba(10,13,9,0.92);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s ease}' +
      '.vlz-lb.on{opacity:1}@media (min-width: 901px){.vlz-lb{padding:40px;cursor:zoom-out}.vlz-lb img{max-height:85vh !important}}' +
      '.vlz-lb img{display:block;max-width:min(100%, 1400px);max-height:70vh;width:auto;height:auto;object-fit:contain;box-shadow:0 12px 40px rgba(0,0,0,0.5)}' +
      '.vlz-lb button{position:absolute;top:calc(env(safe-area-inset-top, 0px) + 14px);right:14px;width:48px;height:48px;border:0;border-radius:50%;background:rgba(242,240,232,0.14);color:#F2F0E8;font:300 32px/48px Arial,sans-serif;text-align:center;cursor:pointer;padding:0}';
    document.head.appendChild(st);
    function visivel(el) {
      for (var n = el; n && n.nodeType === 1 && n.id !== 'vlz'; n = n.parentElement) {
        var cs = getComputedStyle(n);
        if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.2) return false;
      }
      return true;
    }
    var aberto = null;
    function fechar() {
      if (!aberto) return; var el = aberto; aberto = null;
      el.classList.remove('on'); setTimeout(function () { el.remove(); }, 200);
      document.removeEventListener('keydown', tecla);
    }
    function tecla(e) { if (e.key === 'Escape') fechar(); }
    document.addEventListener('click', function (e) {
      if (!mq.matches || aberto) return;
      var img = e.target && e.target.closest ? e.target.closest('img') : null;
      // várias fotos empilhadas (ex.: Antes/Depois): usa a que está visível
      if (img && !visivel(img) && document.elementsFromPoint) {
        var achada = document.elementsFromPoint(e.clientX, e.clientY).filter(function (el) { return el.tagName === 'IMG' && visivel(el); })[0];
        if (achada) img = achada;
      }
      if (!img || !img.closest('#vlz main')) return;
      if (img.closest('a, button, summary, .capa2, header, nav')) return;
      if (img.getBoundingClientRect().width < 80) return;
      e.preventDefault();
      var lb = document.createElement('div');
      lb.className = 'vlz-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Foto ampliada');
      var g = document.createElement('img'); g.decoding = 'async'; g.src = (img.currentSrc || img.src).replace('/assets/img/m/', '/assets/img/'); g.alt = img.alt || '';
      var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Fechar foto'); x.textContent = '×';
      lb.appendChild(g); lb.appendChild(x);
      lb.addEventListener('click', function (ev) { ev.stopPropagation(); fechar(); });
      document.body.appendChild(lb); aberto = lb;
      requestAnimationFrame(function () { lb.classList.add('on'); });
      document.addEventListener('keydown', tecla);
      x.focus({ preventScroll: true });
    }, true);
  }

  // Linha de nomes que rola de lado (celular): mantém o nome selecionado à vista
  function chipsVisiveis() {
    if (window.__vlzChips) return; window.__vlzChips = 1;
    function ajusta() {
      document.querySelectorAll('.dl-chips').forEach(function (c) {
        var a = c.querySelector('[aria-selected="true"]');
        if (!a || c.scrollWidth <= c.clientWidth + 1) return;
        var cr = c.getBoundingClientRect(), ar = a.getBoundingClientRect();
        if (ar.left < cr.left + 4 || ar.right > cr.right - 40) c.scrollTo({ left: Math.max(0, c.scrollLeft + ar.left - cr.left - 4), behavior: 'smooth' });
      });
    }
    new MutationObserver(function () { requestAnimationFrame(ajusta); }).observe(document.getElementById('vlz') || document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected'] });
  }
  function sig(n) {
    if (n.nodeType !== 1) return '#' + n.nodeType;
    return n.nodeName + '|' + (n.getAttribute('class') || '') + '|' + (n.getAttribute('aria-label') || '') + '|' + (n.getAttribute('style') || '').slice(0, 40);
  }
  function morph(a, b) {
    var ac = a.childNodes, bc = b.childNodes, i;
    for (i = 0; i < bc.length; i++) {
      var x = ac[i], y = bc[i];
      if (!x) { a.appendChild(y.cloneNode(true)); continue; }
      if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) {
        // bloco que apareceu (ex.: menu aberto): insere sem recriar o resto da página
        var k, sx = sig(x), sy = sig(y), achou = false;
        for (k = i + 1; k < Math.min(bc.length, i + 6); k++) if (sig(bc[k]) === sx) { achou = true; break; }
        if (achou) { for (var m = i; m < k; m++) a.insertBefore(bc[m].cloneNode(true), x); i = k - 1; continue; }
        // bloco que sumiu (ex.: menu fechado): remove só ele
        for (k = i + 1; k < Math.min(ac.length, i + 6); k++) if (sig(ac[k]) === sy) { achou = true; break; }
        if (achou) { for (var r = i; r < k; r++) a.removeChild(ac[i]); i--; continue; }
        a.replaceChild(y.cloneNode(true), x); continue;
      }
      if (x.nodeType === 3 || x.nodeType === 8) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; continue; }
      if (x.nodeType === 1) {
        syncAttrs(x, y);
        if (x.tagName === 'TEXTAREA') continue;
        morph(x, y);
      }
    }
    while (ac.length > bc.length) a.removeChild(a.lastChild);
  }

  function Pagina(raiz, tpl, Classe, props) {
    var self = this;
    this.raiz = raiz; this.tpl = tpl;
    this.c = new Classe(); this.c.props = props || {}; this.c.state = {};
    this.c.setState = function (o) {
      var s = typeof o === 'function' ? o(self.c.state) : o;
      self.c.state = Object.assign({}, self.c.state, s);
      self.pedir();
    };
    this.vals = {};
  }
  Pagina.prototype.pedir = function () {
    var self = this;
    if (this.agendado) return; this.agendado = true;
    Promise.resolve().then(function () { self.agendado = false; self.render(); });
  };
  Pagina.prototype.render = function (primeira) {
    this.vals = this.c.renderVals() || {};
    var html = expand(this.tpl, this.vals);
    if (primeira) window.__vlzPrimeiro = html;
    if (primeira && this.raiz.getAttribute('data-pre') === '1') {
      var t = document.createElement('template'); t.innerHTML = html;
      morph(this.raiz, t.content);
    } else if (primeira || !this.raiz.firstChild) {
      this.raiz.innerHTML = html;
    } else {
      var t2 = document.createElement('template'); t2.innerHTML = html;
      morph(this.raiz, t2.content);
    }
    this.ligar();
  };
  Pagina.prototype.ligar = function () {
    var self = this, els = this.raiz.querySelectorAll('[data-vlz]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], spec = el.getAttribute('data-vlz');
      if (el.__vlzSpec === spec) continue;
      el.__vlzSpec = spec;
      el.__vlzMap = {};
      spec.split(';').forEach(function (par) { var k = par.split(':'); el.__vlzMap[k[0]] = k[1]; });
      Object.keys(el.__vlzMap).forEach(function (tipo) {
        el.__vlzTipos = el.__vlzTipos || {};
        if (el.__vlzTipos[tipo]) return;
        el.__vlzTipos[tipo] = true;
        el.addEventListener(tipo, function (e) {
          var cam = this.__vlzMap && this.__vlzMap[tipo];
          var fn = cam && get(self.vals, cam);
          if (tipo === 'submit' && e.preventDefault) e.preventDefault();
          if (typeof fn === 'function') fn.call(self.c, e);
        }, tipo === 'wheel' ? { passive: false } : false);
      });
    }
  };

  /* Barra de leitura e entrada dos blocos ao rolar, para navegadores sem
     animação por rolagem no CSS (Safari, Firefox). No Chrome o CSS já faz. */
  function efeitos() {
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()')) return;
    var bar = document.querySelector('.vlz-progresso');
    if (bar) {
      var s = bar.style;
      s.display = 'block'; s.position = 'fixed'; s.left = '0'; s.top = '0'; s.height = '3px'; s.width = '100%';
      s.zIndex = '60'; s.background = 'linear-gradient(90deg,#BC6C25,#DDA15E)'; s.boxShadow = '0 0 10px rgba(221,161,94,.6)';
      s.transformOrigin = '0 50%'; s.pointerEvents = 'none'; s.willChange = 'transform';
      var pedido = false;
      var atualiza = function () {
        pedido = false;
        var h = document.documentElement.scrollHeight - window.innerHeight;
        s.transform = 'scaleX(' + (h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0) + ')';
      };
      var agenda = function () { if (!pedido) { pedido = true; requestAnimationFrame(atualiza); } };
      window.addEventListener('scroll', agenda, { passive: true });
      window.addEventListener('resize', agenda);
      atualiza();
    }
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = document.querySelectorAll('main > section > *, main > div > section > *');
    var altura = window.innerHeight;
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; io.unobserve(el);
        el.style.opacity = '1'; el.style.translate = '0 0';
        setTimeout(function () { el.style.opacity = ''; el.style.translate = ''; el.style.transition = ''; }, 900);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.getBoundingClientRect().top < altura * 0.92) continue; // já visível: não esconde
      el.style.opacity = '0'; el.style.translate = '0 32px';
      el.style.transition = 'opacity .8s cubic-bezier(.2,.8,.2,1), translate .8s cubic-bezier(.2,.8,.2,1)';
      io.observe(el);
    }
  }

  window.DCLogic = function DCLogic() { this.props = {}; this.state = {}; };
  window.VLZ = {
    expand: expand,
    montar: function () {
      var raiz = document.getElementById('vlz');
      var d = JSON.parse(document.getElementById('vlz-dados').textContent);
      var tpl = d.tpl, cod = d.code, props = d.props || {};
      var Classe = (new Function('DCLogic', cod.replace(/class\s+Component\s+extends/, 'return class Component extends')))(window.DCLogic);
      var pg = new Pagina(raiz, tpl, Classe, props);
      pg.render(true);
      window.__vlzPagina = pg;
      try { efeitos(); } catch (e) {}
      try { fotoGrande(); } catch (e) {}
      try { chipsVisiveis(); } catch (e) {}
      try { var H = document.documentElement, rol = function () { H.classList.toggle('vlz-rolou', (window.scrollY || H.scrollTop) > 30); }; window.addEventListener('scroll', rol, { passive: true }); rol(); } catch (e) {}
      return pg;
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { window.VLZ.montar(); });
  else window.VLZ.montar();
})();
