/* Yazım stilleri (writing styles), managed in the panel under "10. Yazım stilleri" (data/stiller.json).
   Applies across the whole site:
   - text written between single asterisks, *Like this*, becomes italic; **like this** becomes bold;
   - every term in the italic list becomes italic wherever it appears, with optional genus-only and
     abbreviated forms (Darevskia rudis also matches "Darevskia" and "D. rudis").
   Text in scripts, form fields, code, SVG and existing <i>/<em> elements is left alone. */
(function () {
  var cfg = { italik: [], kalin: [], cins: true, kisaltma: true };
  var termRe = null, boldRe = null;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, CODE: 1, PRE: 1, I: 1, EM: 1, B: 1, STRONG: 1, svg: 1, SVG: 1, CANVAS: 1 };
  var L = 'A-Za-zÀ-ÖØ-öø-ſ';

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function build(list) {
    var set = {};
    (list || []).forEach(function (t) {
      t = String(t || '').replace(/\*/g, '').trim(); if (!t) return;
      set[t] = 1;
      var w = t.split(/\s+/);
      if (w.length >= 2 && /^[A-Z]/.test(w[0])) {
        if (cfg.cins) set[w[0]] = 1;
        if (cfg.kisaltma) set[w[0][0] + '. ' + w.slice(1).join(' ')] = 1;
      }
    });
    var terms = Object.keys(set).sort(function (a, b) { return b.length - a.length; });
    if (!terms.length) return null;
    return new RegExp('(^|[^' + L + '])(' + terms.map(function (t) { return escRe(t).replace(/\\\. /g, '\\.\\s?').replace(/ /g, '\\s+'); }).join('|') + ')(?![' + L + '])', 'g');
  }

  /* for canvas drawing: wraps listed terms in *asterisks* unless the text already marks them */
  function stars(text) {
    text = String(text || '');
    if (!termRe) return text;
    return text.split(/(\*[^*]+\*)/).map(function (part) {
      if (/^\*[^*]+\*$/.test(part)) return part;
      return part.replace(termRe, function (m, pre, term) { return pre + '*' + term + '*'; });
    }).join('');
  }

  function skip(el) {
    for (; el && el.nodeType === 1; el = el.parentNode) {
      if (SKIP[el.nodeName] || el.isContentEditable || (el.classList && el.classList.contains('no-stil'))) return true;
      if (el.namespaceURI === 'http://www.w3.org/2000/svg') return true;
    }
    return false;
  }

  /* turns one text node into a fragment with <i>/<b> where needed; returns true if it changed */
  function doNode(n) {
    var t = n.nodeValue;
    if (!t || !/\S/.test(t)) return false;
    var hasMark = t.indexOf('*') >= 0;
    if (!hasMark && !(termRe && (termRe.lastIndex = 0, termRe.test(t))) && !(boldRe && (boldRe.lastIndex = 0, boldRe.test(t)))) return false;
    if (skip(n.parentNode)) return false;
    var frag = document.createDocumentFragment(), changed = false;
    /* tokens: **bold**, *italic*, plain */
    t.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/).forEach(function (part) {
      if (!part) return;
      var m;
      if ((m = /^\*\*([^*]+)\*\*$/.exec(part))) { var b = document.createElement('b'); b.textContent = m[1]; frag.appendChild(b); changed = true; return; }
      if ((m = /^\*([^*]+)\*$/.exec(part))) { var i = document.createElement('i'); i.textContent = m[1]; frag.appendChild(i); changed = true; return; }
      changed = addTerms(frag, part) || changed;
    });
    if (changed) n.parentNode.replaceChild(frag, n);
    return changed;
  }
  function addTerms(frag, text) {
    var spans = [];
    [[termRe, 'i'], [boldRe, 'b']].forEach(function (p) {
      if (!p[0]) return; p[0].lastIndex = 0; var m;
      while ((m = p[0].exec(text))) {
        var s = m.index + m[1].length, e = s + m[2].length;
        if (!spans.some(function (x) { return s < x.e && e > x.s; })) spans.push({ s: s, e: e, tag: p[1] });
        if (p[0].lastIndex === m.index) p[0].lastIndex++;
      }
    });
    if (!spans.length) { frag.appendChild(document.createTextNode(text)); return false; }
    spans.sort(function (a, b) { return a.s - b.s; });
    var pos = 0;
    spans.forEach(function (x) {
      if (x.s > pos) frag.appendChild(document.createTextNode(text.slice(pos, x.s)));
      var el = document.createElement(x.tag); el.textContent = text.slice(x.s, x.e); frag.appendChild(el); pos = x.e;
    });
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    return true;
  }
  function apply(root) {
    root = root || document.body; if (!root) return;
    if (root.nodeType === 3) { doNode(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(doNode);
  }

  var pending = [], timer = null;
  function flush() { timer = null; var p = pending; pending = []; p.forEach(function (n) { if (n.isConnected) apply(n); }); }
  function watch() {
    if (!window.MutationObserver || !document.body) return;
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') pending.push(m.target);
        else for (var i = 0; i < m.addedNodes.length; i++) pending.push(m.addedNodes[i]);
      });
      if (!timer) timer = setTimeout(flush, 30);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function lines(v) { return Array.isArray(v) ? v : String(v || '').split(/\r?\n|;/); }
  function setConfig(d) {
    d = d || {};
    cfg.italik = lines(d.italik); cfg.kalin = lines(d.kalin);
    cfg.cins = d.cins !== false; cfg.kisaltma = d.kisaltma !== false;
    termRe = build(cfg.italik);
    var kc = cfg.cins, kk = cfg.kisaltma; cfg.cins = false; cfg.kisaltma = false;
    boldRe = build(cfg.kalin); cfg.cins = kc; cfg.kisaltma = kk;
  }

  var ready = (typeof fetch === 'function' ? fetch('/data/stiller.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }) : Promise.reject())
    .catch(function () { var el = document.getElementById('stil-data'); try { return el ? JSON.parse(el.textContent) : {}; } catch (e) { return {}; } })
    .then(function (d) { setConfig(d); return cfg; });

  window.MKStil = { ready: ready, apply: apply, stars: stars, setConfig: setConfig };

  if (!window.MKStilNoAuto) {
    var go = function () { ready.then(function () { apply(document.body); watch(); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
})();
