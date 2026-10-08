/* Publications add-ons, all drawn from data/yayinlar.json (panel: "4. Yayınlar"):
   1. a stacked bar chart of articles per year by quartile, following the Scopus / WoS choice;
   2. a "Cite" button on every article with APA text and BibTeX to copy;
   3. OpenAlex citation counts per article and in the metrics line (data/openalex.json, written
      at publish time by tools/build_extra.py; nothing is shown if that file is missing). */
(function () {
  var Y = null, OA = null;
  var CATS = [['Q1', 'Q1', 'Q1'], ['Q2', 'Q2', 'Q2'], ['Q3', 'Q3', 'Q3'], ['Q4', 'Q4', 'Q4'], ['TR', 'TR Dizin', 'TR Dizin'], ['other', 'Other', 'Diğer']];
  var COL = { Q1: '#E6F2FC', Q2: '#9ECDEE', Q3: '#5C9BD1', Q4: '#2E6299', TR: '#E0A12E', other: '#7D8BA0' };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bi(en, tr) { return '<span class="en">' + en + '</span><span class="tr">' + tr + '</span>'; }
  function L(en, tr) { return document.documentElement.lang === 'tr' ? tr : en; }
  function cat(v) { v = String(v || ''); return /^Q[1-4]$/.test(v) ? v : (v === 'TR Dizin' ? 'TR' : 'other'); }
  function plain(t) { return String(t || '').replace(/\\([*_])/g, '$1').replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1').replace(/\s+/g, ' ').trim(); }
  function ix() { var s = document.getElementById('publications'); return s && s.classList.contains('ix-wos') ? 'wos' : 'scopus'; }

  var css = document.createElement('style');
  css.textContent =
    '.pchart{margin:18px 0 6px;padding:16px 16px 10px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.03);position:relative}' +
    '.pchart .ph{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px}' +
    '.pchart .ph b{font:600 15px var(--display);color:#DCE6F2}.pchart .ph small{font:12px var(--mono);color:#A8B6C8}' +
    '.pchart .lg{display:flex;flex-wrap:wrap;gap:6px 14px;font:12px var(--mono);color:#C3CEDC;margin:4px 0 8px}' +
    '.pchart .lg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}' +
    '.pchart svg{display:block;width:100%;height:auto;overflow:visible}' +
    '.pchart .tt{position:absolute;pointer-events:none;background:#0B1A2E;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:8px 10px;font:12px/1.5 var(--mono);color:#DCE6F2;white-space:nowrap;z-index:2;box-shadow:0 10px 24px -10px rgba(0,0,0,.6)}' +
    '.pchart .tt b{font-family:var(--display);font-size:13px;color:#fff}.pchart .tt i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px}' +
    '.cite-btn{margin-left:8px;padding:0;border:0;background:none;color:var(--ochre);font:12px var(--mono);text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;cursor:pointer}' +
    '.cite-btn:hover{color:#F0B547}.cite-btn:focus-visible{outline:2px solid var(--ochre);outline-offset:2px}' +
    '.oa{margin-left:8px;font:12px var(--mono);color:#A8B6C8;white-space:nowrap}' +
    '.cite{margin-top:10px;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);display:flex;flex-direction:column;gap:10px}' +
    '.cite h5{margin:0 0 4px;font:500 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#A8B6C8}' +
    '.cite p,.cite pre{margin:0;font-size:14px;line-height:1.5;color:#E8EEF6;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.cite pre{font:12px/1.5 var(--mono);color:#C3CEDC}' +
    '.cite .cp{margin-top:6px;min-height:32px;padding:3px 12px;border-radius:6px;border:1px solid #4E6A8F;background:transparent;color:#DCE6F2;font:600 12px var(--display);cursor:pointer}' +
    '.cite .cp.ok{background:#2F7A3E;border-color:#2F7A3E;color:#fff}';
  document.head.appendChild(css);

  /* ---------- chart ---------- */
  var tip = null;
  function chart() {
    var box = document.getElementById('pubChart'); if (!box || !Y) return;
    var arts = (Y.articles || []).filter(function (a) { return a && a.year; }), key = ix();
    var years = {}, maxT = 0;
    arts.forEach(function (a) { var y = +a.year; (years[y] = years[y] || { t: 0 }); var c = cat(a[key]); years[y][c] = (years[y][c] || 0) + 1; years[y].t++; });
    var ys = Object.keys(years).map(Number).sort(); if (!ys.length) { box.hidden = true; return; }
    var y0 = ys[0], y1 = ys[ys.length - 1], list = [];
    for (var y = y0; y <= y1; y++) { list.push(y); if (years[y]) maxT = Math.max(maxT, years[y].t); }
    var W = 760, H = 210, padL = 30, padB = 26, padT = 18, cw = (W - padL) / list.length, bw = Math.min(34, cw * 0.62);
    var step = maxT > 10 ? 5 : 2, top = Math.ceil(maxT / step) * step, sy = (H - padB - padT) / top;
    var g = '';
    for (var v = 0; v <= top; v += step) {
      var yy = H - padB - v * sy;
      g += '<line x1="' + padL + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '" stroke="rgba(255,255,255,' + (v ? .08 : .3) + ')" stroke-width="1"/>' +
        '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" fill="#A8B6C8" font-size="11" font-family="IBM Plex Mono,monospace">' + v + '</text>';
    }
    list.forEach(function (yr, i) {
      var x = padL + i * cw + (cw - bw) / 2, base = H - padB, d = years[yr] || { t: 0 };
      var segs = CATS.filter(function (c) { return d[c[0]]; });
      segs.forEach(function (c, k) {
        var h = d[c[0]] * sy, last = k === segs.length - 1;
        var yTop = base - h;
        g += '<path d="' + (last ? 'M' + x + ',' + base + 'V' + (yTop + 4) + 'Q' + x + ',' + yTop + ' ' + (x + 4) + ',' + yTop + 'H' + (x + bw - 4) + 'Q' + (x + bw) + ',' + yTop + ' ' + (x + bw) + ',' + (yTop + 4) + 'V' + base + 'Z' : 'M' + x + ',' + base + 'V' + yTop + 'H' + (x + bw) + 'V' + base + 'Z') +
          '" fill="' + COL[c[0]] + '" stroke="#16304F" stroke-width="2"/>';
        base = yTop;
      });
      if (d.t) g += '<text x="' + (x + bw / 2) + '" y="' + (base - 6) + '" text-anchor="middle" fill="#DCE6F2" font-size="11" font-weight="600" font-family="IBM Plex Mono,monospace">' + d.t + '</text>';
      g += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="#A8B6C8" font-size="11" font-family="IBM Plex Mono,monospace">' + (list.length > 8 ? "'" + String(yr).slice(2) : yr) + '</text>' +
        '<rect class="hit" data-y="' + yr + '" x="' + (padL + i * cw) + '" y="' + padT + '" width="' + cw + '" height="' + (H - padT - padB) + '" fill="transparent"/>';
    });
    var used = CATS.filter(function (c) { return arts.some(function (a) { return cat(a[key]) === c[0]; }); });
    box.innerHTML = '<div class="ph"><b>' + bi('Articles per year by ' + (key === 'wos' ? 'WoS' : 'Scopus') + ' quartile', 'Yıllara göre makaleler · ' + (key === 'wos' ? 'WoS' : 'Scopus') + ' çeyreklik dilimi') + '</b><small>' +
      bi(arts.length + ' articles, ' + y0 + '–' + y1, y0 + '–' + y1 + ' arası ' + arts.length + ' makale') + '</small></div>' +
      '<div class="lg">' + used.map(function (c) { return '<span><i style="background:' + COL[c[0]] + '"></i>' + bi(c[1], c[2]) + '</span>'; }).join('') + '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(L('Articles per year', 'Yıllara göre makale sayısı')) + '">' + g + '</svg>';
    box.hidden = false;
    tip = document.createElement('div'); tip.className = 'tt'; tip.hidden = true; box.appendChild(tip);
    var svg = box.querySelector('svg');
    function show(ev) {
      var r = ev.target.closest && ev.target.closest('.hit'); if (!r) { tip.hidden = true; return; }
      var yr = +r.getAttribute('data-y'), d = years[yr] || { t: 0 };
      tip.innerHTML = '<b>' + yr + '</b> · ' + d.t + ' ' + L(d.t === 1 ? 'article' : 'articles', 'makale') + '<br>' +
        CATS.filter(function (c) { return d[c[0]]; }).map(function (c) { return '<i style="background:' + COL[c[0]] + '"></i>' + L(c[1], c[2]) + ': ' + d[c[0]]; }).join('<br>');
      tip.hidden = false;
      var bb = box.getBoundingClientRect(), rr = r.getBoundingClientRect();
      var x = rr.left - bb.left + rr.width / 2 - tip.offsetWidth / 2;
      tip.style.left = Math.max(6, Math.min(bb.width - tip.offsetWidth - 6, x)) + 'px';
      tip.style.top = Math.max(4, rr.top - bb.top - tip.offsetHeight + 30) + 'px';
    }
    svg.addEventListener('mousemove', show); svg.addEventListener('click', show);
    svg.addEventListener('mouseleave', function () { tip.hidden = true; });
  }

  /* ---------- citation ---------- */
  function people(s) {
    return String(s || '').split(/\s*,\s*(?=[A-ZÇĞİÖŞÜ])/).map(function (p) {
      p = p.trim(); var m = /^(.+?)\s+([A-ZÇĞİÖŞÜ]{1,3})$/.exec(p);
      if (!m) return { last: p, ini: '' };
      return { last: m[1], ini: m[2].split('').map(function (c) { return c + '.'; }).join(' ') };
    }).filter(function (x) { return x.last; });
  }
  function venueParts(v) {
    v = plain(v); var m = /^(.*?),\s*(\d+)\s*(?:\(([^)]+)\))?\s*[:,]\s*(.+)$/.exec(v);
    return m ? { j: m[1], vol: m[2], no: m[3] || '', pg: m[4].replace(/\s*[-–]\s*/, '–') } : { j: v.replace(/[,.]\s*$/, ''), vol: '', no: '', pg: '' };
  }
  function apa(a) {
    var ps = people(a.authors).map(function (p) { return p.last + (p.ini ? ', ' + p.ini : ''); });
    var au = ps.length > 1 ? ps.slice(0, -1).join(', ') + ', & ' + ps[ps.length - 1] : (ps[0] || '');
    var v = venueParts(a.venue), doi = a.doi ? (/^https?:/.test(a.doi) ? a.doi : 'https://doi.org/' + a.doi) : '';
    return au + ' (' + a.year + '). ' + plain(a.title).replace(/\.$/, '') + '. ' + v.j + (v.vol ? ', ' + v.vol + (v.no ? '(' + v.no + ')' : '') : '') + (v.pg ? ', ' + v.pg : '') + '.' + (doi ? ' ' + doi : '');
  }
  function bib(a) {
    var ps = people(a.authors), v = venueParts(a.venue);
    var key = (ps[0] ? ps[0].last : 'kurnaz').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + a.year + (plain(a.title).toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').split(' ').filter(function (w) { return w.length > 3; })[0] || '');
    var f = [['author', ps.map(function (p) { return p.last + (p.ini ? ', ' + p.ini : ''); }).join(' and ')], ['title', '{' + plain(a.title) + '}'], ['journal', v.j], ['year', a.year], ['volume', v.vol], ['number', v.no], ['pages', v.pg.replace('–', '--')], ['doi', String(a.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//, '')]];
    return '@article{' + key + ',\n' + f.filter(function (x) { return x[1]; }).map(function (x) { return '  ' + x[0] + ' = {' + x[1] + '}'; }).join(',\n') + '\n}';
  }
  function copy(btn, text) {
    function ok() { btn.classList.add('ok'); var o = btn.innerHTML; btn.innerHTML = bi('Copied', 'Kopyalandı'); setTimeout(function () { btn.classList.remove('ok'); btn.innerHTML = o; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () {});
  }
  function decorate() {
    document.querySelectorAll('#articleList li[data-i]').forEach(function (li) {
      var a = (Y.articles || [])[+li.getAttribute('data-i')]; if (!a) return;
      var au = li.querySelector('.au'); if (!au) return;
      if (!au.querySelector('.cite-btn')) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'cite-btn'; b.setAttribute('aria-expanded', 'false');
        b.innerHTML = bi('Cite', 'Kaynak göster'); au.appendChild(b);
      }
      var n = OA && a.doi ? OA.works[String(a.doi).toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '')] : 0;
      var old = au.querySelector('.oa'); if (old) old.remove();
      if (n) { var s = document.createElement('span'); s.className = 'oa'; s.title = 'OpenAlex'; s.innerHTML = bi(n + (n === 1 ? ' citation' : ' citations'), n + ' atıf'); au.insertBefore(s, au.querySelector('.cite-btn')); }
    });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.cite-btn');
    if (b) {
      var li = b.closest('li'), a = (Y.articles || [])[+li.getAttribute('data-i')], open = li.querySelector('.cite');
      if (open) { open.remove(); b.setAttribute('aria-expanded', 'false'); return; }
      var t1 = apa(a), t2 = bib(a), d = document.createElement('div'); d.className = 'cite';
      d.innerHTML = '<div><h5>APA</h5><p>' + esc(t1) + '</p><button type="button" class="cp" data-k="apa">' + bi('Copy', 'Kopyala') + '</button></div>' +
        '<div><h5>BibTeX</h5><pre>' + esc(t2) + '</pre><button type="button" class="cp" data-k="bib">' + bi('Copy', 'Kopyala') + '</button></div>';
      d._t = { apa: t1, bib: t2 };
      li.querySelector('.au').parentNode.appendChild(d); b.setAttribute('aria-expanded', 'true');
      return;
    }
    var c = ev.target.closest && ev.target.closest('.cite .cp');
    if (c) copy(c, c.closest('.cite')._t[c.getAttribute('data-k')]);
  });

  /* ---------- OpenAlex totals in the metrics line ---------- */
  function metrics() {
    if (!OA || OA.citations == null) return;
    document.querySelectorAll('p.metrics').forEach(function (p) {
      if (p.querySelector('.oa-m')) return;
      var s = document.createElement('span'); s.className = 'oa-m';
      s.innerHTML = bi(' · OpenAlex: ' + OA.citations + ' citations' + (OA.h_index != null ? ', h-index ' + OA.h_index : ''), ' · OpenAlex: ' + OA.citations + ' atıf' + (OA.h_index != null ? ', h-indeksi ' + OA.h_index : ''));
      p.appendChild(s);
    });
  }

  fetch('data/openalex.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    .then(function (o) { OA = o && o.works ? o : null; if (Y) { decorate(); metrics(); } });
  document.addEventListener('mk:pubs', function () { Y = window.MKY; setTimeout(function () { chart(); decorate(); metrics(); }, 0); });
  var sec = document.getElementById('publications');
  if (sec && window.MutationObserver) new MutationObserver(function () { chart(); }).observe(sec, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(function () { if (Y) chart(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
