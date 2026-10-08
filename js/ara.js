/* Site search ("Ara"): a magnifier button in the header opens a search box over the whole site.
   Searches publications, theses, projects, research themes, courses, writings, photos and approved
   species cards. Turkish letters are matched loosely (ş = s, ı = i, ...). A result either opens a
   writing, or jumps to the item on the home page, opens it if it is folded away, and marks it briefly. */
(function () {
  var onHome = !/yazilar\.html/.test(location.pathname);
  var HOME = onHome ? '' : 'index.html';
  var KEY = 'mkAra';

  /* ---------- text helpers ---------- */
  function norm(t) {
    return String(t || '').replace(/[*_\\]/g, '').replace(/[İI]/g, 'i').replace(/ı/g, 'i').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plain(t) { return String(t || '').replace(/\\([*_])/g, '$1').replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1').replace(/[#>`]/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); }
  var VAR = { a: 'aâ', c: 'cç', g: 'gğ', i: 'iıİI', o: 'oö', s: 'sş', u: 'uüû' };
  function termRe(terms) {
    var parts = terms.map(function (w) {
      return w.split('').map(function (ch) { return VAR[ch] ? '[' + VAR[ch] + ']' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('');
    });
    return new RegExp('(' + parts.join('|') + ')', 'gi');
  }
  function mark(text, re) { return esc(text).replace(re, '<mark>$1</mark>'); }
  function lang() { return document.documentElement.lang === 'tr' ? 'tr' : 'en'; }
  function L(en, tr) { return lang() === 'tr' ? (tr || en || '') : (en || tr || ''); }
  function snippet(text, terms, n) {
    text = plain(text).replace(/\s+/g, ' ').trim();
    var t = norm(text), at = -1;
    terms.forEach(function (w) { var k = t.indexOf(w); if (k >= 0 && (at < 0 || k < at)) at = k; });
    if (at < 0 || text.length <= n) return text.slice(0, n) + (text.length > n ? '…' : '');
    var s = Math.max(0, at - 50);
    return (s ? '…' : '') + text.slice(s, s + n) + (s + n < text.length ? '…' : '');
  }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.ara-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:36px;min-width:40px;padding:4px 10px;border:1px solid rgba(255,255,255,.45);border-radius:6px;background:transparent;color:#fff;font:600 14px var(--display,system-ui),sans-serif;cursor:pointer}' +
    '.ara-btn:hover{border-color:#fff}.ara-btn:focus-visible{outline:2px solid #E0A12E;outline-offset:2px}' +
    '.ara-btn kbd{font:11px var(--mono,ui-monospace),monospace;opacity:.7;border:1px solid rgba(255,255,255,.35);border-radius:4px;padding:0 5px}' +
    'dialog.ara{width:min(720px,calc(100vw - 32px));max-height:min(82vh,760px);margin:8vh auto auto;padding:0;border:0;border-radius:14px;background:#F7F8F6;color:#132235;box-shadow:0 30px 80px -20px rgba(8,18,32,.6);overflow:hidden}' +
    'dialog.ara::backdrop{background:rgba(8,18,32,.55)}' +
    '.ara-in{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #D6DAE0;background:#fff}' +
    '.ara-in svg{flex:none;color:#5B6676}' +
    '.ara-in input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:500 19px var(--display,system-ui),sans-serif;color:#132235;padding:6px 0}' +
    '.ara-x{flex:none;border:1px solid #D6DAE0;background:#fff;border-radius:6px;min-height:34px;padding:2px 10px;font:12px var(--mono,ui-monospace),monospace;color:#5B6676;cursor:pointer}' +
    '.ara-res{overflow-y:auto;max-height:calc(min(82vh,760px) - 66px);padding:6px 0 14px}' +
    '.ara-g{padding:12px 18px 4px;font:500 11px var(--mono,ui-monospace),monospace;letter-spacing:.1em;text-transform:uppercase;color:#9A5F00}' +
    '.ara-r{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;border:0;background:transparent;padding:10px 18px;cursor:pointer;color:inherit;text-decoration:none;font:inherit}' +
    '.ara-r:hover,.ara-r.on{background:#E8EEF5}.ara-r:focus-visible{outline:2px solid #16304F;outline-offset:-2px}' +
    '.ara-r img{flex:none;width:52px;height:40px;object-fit:cover;border-radius:5px;background:#D6DAE0}' +
    '.ara-r b{display:block;font:600 16px/1.35 var(--body,Georgia),serif;color:#16304F}' +
    '.ara-r small{display:block;margin-top:2px;font-size:14px;line-height:1.45;color:#3A4A5E}' +
    '.ara-r mark{background:#FBE3A6;color:inherit;border-radius:2px;padding:0 1px}' +
    '.ara-empty{padding:22px 18px;color:#5B6676;font-size:15px;line-height:1.5}' +
    '.ara-hit{outline:3px solid #E0A12E!important;outline-offset:4px;border-radius:4px;transition:outline-color 1.2s}' +
    '.ara-hit.fade{outline-color:transparent!important}' +
    '@media (max-width:760px){.ara-btn kbd,.ara-btn .t{display:none}.ara-btn{order:2;margin-left:auto;padding:4px 8px;min-height:40px}header.top .lang{margin-left:0!important}dialog.ara{width:100vw;max-width:100vw;height:100%;max-height:100%;margin:0;border-radius:0}.ara-res{max-height:calc(100% - 66px)}}';
  document.head.appendChild(css);

  /* ---------- button and dialog ---------- */
  var ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
  var hd = document.querySelector('header.top .wrap');
  if (!hd) return;
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ara-btn'; btn.setAttribute('aria-label', 'Ara / Search'); btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = ICON + '<span class="t"><span class="en">Search</span><span class="tr">Ara</span></span><kbd>/</kbd>';
  var langBox = hd.querySelector('.lang');
  hd.insertBefore(btn, langBox);

  var dlg = document.createElement('dialog');
  dlg.className = 'ara'; dlg.setAttribute('aria-label', 'Site içi arama / Site search');
  dlg.innerHTML = '<div class="ara-in">' + ICON + '<input type="search" id="araQ" autocomplete="off" spellcheck="false"><button type="button" class="ara-x"><span class="en">Close</span><span class="tr">Kapat</span></button></div>' +
    '<div class="ara-res" id="araRes" role="listbox"></div>';
  document.body.appendChild(dlg);
  var q = dlg.querySelector('#araQ'), res = dlg.querySelector('#araRes');

  function open() {
    q.placeholder = L('Search publications, species, writings…', 'Yayın, tür, yazı ara…');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    q.focus(); q.select();
    load().then(run);
  }
  function close() { if (dlg.open) dlg.close(); }
  btn.addEventListener('click', open);
  dlg.querySelector('.ara-x').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (!dlg.open && ((e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag)) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) { e.preventDefault(); open(); }
  });

  /* ---------- index ---------- */
  var items = null, loading = null;
  function get(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { return {}; }); }
  function slug(p) {
    var map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
    var t = String(p.title || '').replace(/[çğıİöşüÇĞÖŞÜ]/g, function (c) { return map[c]; }).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return String(p.date || '').slice(0, 10) + '-' + t.slice(0, 60);
  }
  var TOPIC = { tax: 'Taxonomy Taksonomi', niche: 'Niche modeling Niş modelleme', bio: 'Biogeography Biyocoğrafya', eco: 'Ecology Ekoloji', life: 'Life history Yaşam öyküsü iskeletokronoloji', nat: 'Natural history Doğal tarih' };
  function A(x) { return Array.isArray(x) ? x : []; }
  function load() {
    if (items) return Promise.resolve(items);
    if (loading) return loading;
    var D = 'data/';
    loading = Promise.all([get(D + 'yayinlar.json'), get(D + 'ozgecmis.json'), get(D + 'projeler.json'), get(D + 'arastirma.json'), get(D + 'dersler.json'), get('posts.json'), get('photos.json'), get(D + 'turler.json'), get(D + 'turkiye-turleri.json')])
      .then(function (r) {
        var Y = r[0], C = r[1], P = r[2], R = r[3], K = r[4], W = r[5], F = r[6], T = r[7], TL = r[8], out = [];
        function add(o) { o.key = norm(o.key); o.head = norm(o.head); out.push(o); }
        A(T.species).filter(function (c) { return c && c.onay === true; }).forEach(function (c) {
          add({ g: ['Species cards', 'Tür kartları'], t: function () { return L(c.en, c.tr) + ' · ' + c.latin; }, s: function () { return L(c.dist_en, c.dist_tr); },
            head: c.latin + ' ' + c.tr + ' ' + c.en, key: [c.latin, c.tr, c.en, c.family, c.dist_tr, c.dist_en].join(' '), img: thumb((c.photos || [])[0]), go: { sec: 'turler', tur: c.latin } });
        });
        A(TL.species).filter(function (s) { return s && s.latin && !s.gizle; }).forEach(function (s) {
          add({ g: ['Species list of Türkiye', 'Türkiye tür listesi'], t: function () { return s.latin + (s.tr ? ' · ' + s.tr : ''); }, s: function () { return [s.yazar, s.familya, s.endemik ? L('endemic', 'endemik') : ''].filter(Boolean).join(' · '); },
            head: s.latin + ' ' + s.tr + ' ' + s.en, key: [s.latin, s.tr, s.en, s.familya, s.yazar].join(' '), href: 'turler-listesi.html#' + String(s.latin).trim().replace(/\s+/g, '-') });
        });
        A(W.posts).forEach(function (p) {
          add({ g: ['Writings', 'Yazılar'], t: function () { return L(p.title_en, p.title); }, s: function (tm) { return snippet(L(p.summary_en, p.summary) + ' ' + L(p.body_en, p.body), tm, 150); },
            head: p.title + ' ' + p.title_en, key: [p.title, p.title_en, p.summary, p.summary_en, A(p.tags).join(' '), A(p.tags_en).join(' '), p.body, p.body_en].join(' '),
            img: p.cover, href: 'yazilar.html#' + encodeURIComponent(slug(p)) });
        });
        A(Y.articles).forEach(function (p) {
          add({ g: ['Articles', 'Makaleler'], t: function () { return p.title; }, s: function () { return [p.year, p.authors, p.venue].filter(Boolean).join(' · '); },
            head: p.title, key: [p.title, p.authors, p.venue, p.year, p.doi, TOPIC[p.topic] || ''].join(' '), go: { sec: 'publications', text: p.title } });
        });
        A(Y.chapters).forEach(function (p) {
          add({ g: ['Book chapters', 'Kitap bölümleri'], t: function () { return p.title; }, s: function () { return [p.year, p.authors, p.details].filter(Boolean).join(' · '); },
            head: p.title, key: [p.title, p.authors, p.details, p.year].join(' '), go: { sec: 'publications', text: p.title } });
        });
        A(Y.presentations).forEach(function (p) {
          add({ g: ['Conference presentations', 'Kongre bildirileri'], t: function () { return p.title; }, s: function () { return [p.year, p.authors, p.event].filter(Boolean).join(' · '); },
            head: p.title, key: [p.title, p.authors, p.event, p.year, p.type, 'kongre bildiri congress presentation'].join(' '), go: { sec: 'publications', text: p.title } });
        });
        A(C.theses).forEach(function (p) {
          add({ g: ['Theses', 'Tezler'], t: function () { return p.title; }, s: function () { return [p.year, L(p.type_en, p.type_tr), p.supervisor].filter(Boolean).join(' · '); },
            head: p.title, key: [p.title, p.type_tr, p.type_en, p.supervisor, p.year].join(' '), go: { sec: 'cv', text: p.title } });
        });
        A(R.themes).forEach(function (p) {
          add({ g: ['Research', 'Araştırma'], t: function () { return L(p.title_en, p.title_tr); }, s: function (tm) { return snippet(L(p.text_en, p.text_tr), tm, 150); },
            head: p.title_tr + ' ' + p.title_en, key: [p.title_tr, p.title_en, p.text_tr, p.text_en].join(' '), go: { sec: 'research', text: L(p.title_en, p.title_tr) } });
        });
        A(P.ongoing).concat(A(P.completed)).forEach(function (p) {
          var title = function () { return p.title || L(p.title_en, p.title_tr); };
          add({ g: ['Projects', 'Projeler'], t: title, s: function () { return [p.funder || L(p.funder_en, p.funder_tr), L(p.role_en, p.role_tr)].filter(Boolean).join(' · '); },
            head: [p.title, p.title_tr, p.title_en].join(' '), key: [p.title, p.title_tr, p.title_en, p.funder, p.funder_tr, p.funder_en, p.role_tr, p.role_en].join(' '), go: { sec: 'projects', textFn: title } });
        });
        A(K.courses).forEach(function (p) {
          var files = A(p.files).map(function (f) { return f && (f.title || f.name || f.file || ''); }).join(' ');
          add({ g: ['Courses', 'Dersler'], t: function () { return L(p.en, p.tr); }, s: function () { return files; },
            head: p.tr + ' ' + p.en, key: [p.tr, p.en, files].join(' '), go: { sec: 'teaching', textFn: function () { return L(p.en, p.tr); } } });
        });
        var seen = {};
        A(F.photos).filter(function (p) { return p && p.image; }).forEach(function (p, i) {
          var k = norm(p.latin) + '|' + norm(p.tr_name);
          if (seen[k]) { seen[k].n++; return; }
          var o = { g: ['Photos', 'Fotoğraflar'], n: 1, t: function () { return (p.tr_name ? p.tr_name + ' · ' : '') + p.latin; },
            s: function () { return o.n > 1 ? L(o.n + ' photos', o.n + ' fotoğraf') : L('1 photo', '1 fotoğraf'); },
            head: p.latin + ' ' + p.tr_name, key: [p.latin, p.tr_name].join(' '), img: p.thumb || thumb(p.image), go: { sec: 'photos', photo: i } };
          seen[k] = o; add(o);
        });
        items = out; return out;
      });
    return loading;
  }
  function thumb(src) { return src ? String(src).replace(/(-k)?\.(jpe?g|png|webp)$/i, '-k.jpg') : ''; }

  /* ---------- search ---------- */
  var current = [], sel = 0, timer;
  function run() {
    var raw = q.value, terms = norm(raw).split(' ').filter(function (w) { return w.length > 1 || /\d/.test(w); });
    if (!items) return;
    if (!terms.length) {
      res.innerHTML = '<p class="ara-empty">' + L('Type a species name, a word from a title, a journal or a place. Try <b>Darevskia</b>, <b>niche</b> or <b>Artvin</b>.',
        'Bir tür adı, başlıktan bir sözcük, dergi ya da yer adı yazın. Örneğin <b>Darevskia</b>, <b>niş</b> veya <b>Artvin</b>.') + '</p>';
      current = []; return;
    }
    var hits = [];
    items.forEach(function (it) {
      var all = terms.every(function (w) { return it.key.indexOf(w) >= 0; });
      if (!all) return;
      var score = 0;
      terms.forEach(function (w) { if (it.head.indexOf(w) >= 0) score += 10; if ((' ' + it.head).indexOf(' ' + w) >= 0) score += 5; });
      hits.push({ it: it, score: score });
    });
    var order = ['Tür kartları', 'Türkiye tür listesi', 'Yazılar', 'Makaleler', 'Kitap bölümleri', 'Kongre bildirileri', 'Tezler', 'Araştırma', 'Projeler', 'Dersler', 'Fotoğraflar'];
    hits.sort(function (a, b) { return order.indexOf(a.it.g[1]) - order.indexOf(b.it.g[1]) || b.score - a.score; });
    var re = termRe(terms), html = '', last = '', count = {};
    current = [];
    hits.forEach(function (h) {
      var g = h.it.g[1]; count[g] = (count[g] || 0) + 1;
      if (count[g] > 8) return;
      if (g !== last) { html += '<div class="ara-g">' + esc(L(h.it.g[0], h.it.g[1])) + '</div>'; last = g; }
      var i = current.length; current.push(h.it);
      var tag = h.it.href ? 'a href="' + esc(h.it.href) + '"' : 'button type="button"';
      html += '<' + tag + ' class="ara-r" role="option" data-i="' + i + '">' + (h.it.img ? '<img src="' + esc(h.it.img) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' : '') +
        '<span><b>' + mark(plain(h.it.t()), re) + '</b><small>' + mark(plain(h.it.s(terms) || ''), re) + '</small></span></' + (h.it.href ? 'a' : 'button') + '>';
    });
    var total = hits.length;
    res.innerHTML = total ? html : '<p class="ara-empty">' + L('No results for “' + esc(raw) + '”.', '“' + esc(raw) + '” için sonuç bulunamadı.') + '</p>';
    sel = 0; paint();
  }
  function paint() {
    [].forEach.call(res.querySelectorAll('.ara-r'), function (r, i) { r.classList.toggle('on', i === sel); r.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
  }
  q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 80); });
  q.addEventListener('keydown', function (e) {
    var rows = res.querySelectorAll('.ara-r');
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, rows.length - 1); paint(); if (rows[sel]) rows[sel].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); if (rows[sel]) rows[sel].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && rows[sel]) { e.preventDefault(); rows[sel].click(); }
  });
  res.addEventListener('click', function (e) {
    var r = e.target.closest('.ara-r'); if (!r) return;
    var it = current[+r.getAttribute('data-i')]; if (!it) return;
    if (it.href) { close(); return; } /* plain link: let the browser follow it */
    e.preventDefault(); close();
    var go = { sec: it.go.sec, text: it.go.textFn ? it.go.textFn() : it.go.text, tur: it.go.tur, photo: it.go.photo };
    if (onHome) find(go);
    else { try { sessionStorage.setItem(KEY, JSON.stringify(go)); } catch (x) {} location.href = HOME + '#' + go.sec; }
  });

  /* ---------- jump to an item on the home page ---------- */
  function find(go, tries) {
    tries = tries || 0;
    var sec = document.getElementById(go.sec);
    if (!sec) return;
    if (go.tur && window.mkTurGoster) { window.mkTurGoster(go.tur); flash(document.getElementById('tkCard') || sec); return; }
    if (go.photo != null) {
      var btns = document.querySelectorAll('#gallery > button');
      if (btns[go.photo]) { btns[go.photo].click(); return; }
      if (tries < 20) return setTimeout(function () { find(go, tries + 1); }, 250);
      return sec.scrollIntoView({ behavior: 'smooth' });
    }
    var want = norm(go.text), el = null;
    if (want) {
      var cand = sec.querySelectorAll('li, .row, article, .card, .theme, h3, p, summary');
      for (var i = 0; i < cand.length && !el; i++) { if (norm(cand[i].textContent).indexOf(want) >= 0) el = cand[i]; }
    }
    if (!el && want && tries < 20) return setTimeout(function () { find(go, tries + 1); }, 250);
    if (!el) { sec.scrollIntoView({ behavior: 'smooth' }); return; }
    /* make sure it is visible: reset the topic filter, show all articles, open folded lists */
    if (el.hidden || el.offsetParent === null) {
      var all = sec.querySelector('[data-f="all"]'); if (all && all.getAttribute('aria-pressed') !== 'true') all.click();
      var qa = sec.querySelector('#qFilters [data-q="all"]'); if (qa && qa.getAttribute('aria-pressed') !== 'true') qa.click();
      var more = sec.querySelector('.pub-more[aria-expanded="false"]'); if (el.hidden && more && !more.hidden) more.click();
    }
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) { if (p.tagName === 'DETAILS') p.open = true; }
    setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(el); }, 60);
  }
  function flash(el) {
    el.classList.add('ara-hit');
    setTimeout(function () { el.classList.add('fade'); }, 2200);
    setTimeout(function () { el.classList.remove('ara-hit', 'fade'); }, 3600);
  }
  if (onHome) {
    var pending = null;
    try { pending = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (x) {}
    if (pending) {
      var go = function () { setTimeout(function () { find(pending); }, 300); };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    }
  }
})();
