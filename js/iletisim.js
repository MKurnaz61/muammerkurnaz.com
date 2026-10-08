/* Contact page ("İletişim") opened inside the site: the Contact link in the menu opens a page over the
   current one with the e-mail addresses, affiliation and profiles, all read from data/genel.json
   (panel: "1. Ana sayfa ve iletişim"). Closes with the button, Esc, the browser's back button, or a
   click outside. Direct link: muammerkurnaz.com/#iletisim */
(function () {
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bi(en, tr) { en = en || tr || ''; tr = tr || en || ''; return '<span class="en">' + esc(en) + '</span><span class="tr">' + esc(tr) + '</span>'; }

  var css = document.createElement('style');
  css.textContent =
    'dialog.ilt{width:min(760px,calc(100vw - 32px));max-height:calc(100vh - 48px);margin:auto;padding:0;border:0;border-radius:18px;background:#F4F6F3;color:#132235;box-shadow:0 40px 90px -25px rgba(8,18,32,.7);overflow:auto}' +
    'dialog.ilt::backdrop{background:rgba(8,18,32,.6)}' +
    '.ilt-top{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;background:#16304F;color:#fff}' +
    '.ilt-top>span{font:500 12px var(--mono,ui-monospace),monospace;letter-spacing:.12em;text-transform:uppercase;color:#E0A12E}' +
    '.ilt-x{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:6px 14px;border:1px solid rgba(255,255,255,.45);border-radius:8px;background:transparent;color:#fff;font:600 14px var(--display,system-ui),sans-serif;cursor:pointer}' +
    '.ilt-x:hover{border-color:#fff}.ilt-x:focus-visible,.ilt-copy:focus-visible,.ilt a:focus-visible{outline:2px solid #E0A12E;outline-offset:2px}' +
    '.ilt-body{display:flex;flex-direction:column;gap:26px;padding:28px 28px 32px}' +
    '.ilt h2{margin:0;font:800 34px/1.08 var(--display,system-ui),sans-serif;letter-spacing:-.02em;color:#16304F}' +
    '.ilt .role{margin:8px 0 0;font:500 16px/1.5 var(--body,Georgia),serif;color:#3A4A5E}' +
    '.ilt h3{margin:0 0 10px;font:500 12px var(--mono,ui-monospace),monospace;letter-spacing:.1em;text-transform:uppercase;color:#9A5F00}' +
    '.ilt-mails{display:flex;flex-direction:column;gap:10px}' +
    '.ilt-mail{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border:1px solid #D6DAE0;border-radius:12px;background:#fff}' +
    '.ilt-mail a{flex:1 1 220px;min-width:0;font:600 17px var(--mono,ui-monospace),monospace;color:#16304F;text-decoration:none;overflow-wrap:anywhere}' +
    '.ilt-mail a:hover{text-decoration:underline}' +
    '.ilt-mail small{display:block;font:400 12px var(--display,system-ui),sans-serif;color:#5B6676;margin-bottom:2px}' +
    '.ilt-copy{min-height:36px;padding:4px 12px;border:1px solid #16304F;border-radius:8px;background:transparent;color:#16304F;font:600 13px var(--display,system-ui),sans-serif;cursor:pointer}' +
    '.ilt-copy.ok{background:#2F7A3E;border-color:#2F7A3E;color:#fff}' +
    '.ilt-aff{padding:16px 18px;border-left:4px solid #E0A12E;background:#fff;border-radius:0 12px 12px 0;font:400 17px/1.55 var(--body,Georgia),serif;color:#132235}' +
    '.ilt-links{display:flex;flex-wrap:wrap;gap:8px}' +
    '.ilt-links a{display:inline-flex;align-items:center;min-height:38px;padding:6px 14px;border-radius:20px;border:1px solid #B9C3D0;background:#fff;color:#16304F;font:600 14px var(--display,system-ui),sans-serif;text-decoration:none}' +
    '.ilt-links a:hover{border-color:#16304F}' +
    '@media (max-width:600px){dialog.ilt{width:100vw;max-width:100vw;height:100%;max-height:100%;border-radius:0}.ilt-body{padding:22px 16px 28px}.ilt h2{font-size:28px}.ilt-top{padding:12px 16px}.ilt-mail a{flex-basis:100%;font-size:16px}}';
  document.head.appendChild(css);

  var dlg = null, data = null, pushed = false;
  function load() {
    if (data) return Promise.resolve(data);
    return fetch('data/genel.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () {
        var el = document.getElementById('site-data') || document.getElementById('genel-data');
        try { var j = JSON.parse(el.textContent); return j.genel || j; } catch (e) { return {}; }
      })
      .then(function (g) { data = g || {}; return data; });
  }
  function strip(t) { return String(t || '').replace(/^\s*(Doç\. Dr\.|Assoc\. Prof\.( Dr\.)?|Associate Professor)\s*·\s*/i, ''); }
  function build(g) {
    var L = g.links || {}, orcid = L.orcid ? (/^https?:/.test(L.orcid) ? L.orcid : 'https://orcid.org/' + L.orcid) : '';
    var prof = [['Google Scholar', L.scholar], ['ORCID', orcid], ['ResearchGate', L.researchgate], ['YÖK Akademik', L.yok], ['OpenAlex', L.openalex]].filter(function (x) { return x[1]; });
    var soc = [['LinkedIn', L.linkedin], ['Instagram', L.instagram], ['Facebook', L.facebook]].filter(function (x) { return x[1]; });
    var mails = (g.emails || []).filter(function (m) { return m && m.email; });
    function link(x) { return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + esc(x[0]) + '</a>'; }
    return '<div class="ilt-top"><span>' + bi('Contact', 'İletişim') + '</span><button type="button" class="ilt-x">' + bi('Close', 'Kapat') +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="ilt-body">' +
      '<div><h2>' + bi('Assoc. Prof. Muammer Kurnaz', 'Doç. Dr. Muammer Kurnaz') + '</h2>' + (g.role_tr || g.role_en ? '<p class="role">' + bi(strip(g.role_en), strip(g.role_tr)) + '</p>' : '') + '</div>' +
      (mails.length ? '<section><h3>' + bi('E-mail', 'E-posta') + '</h3><div class="ilt-mails">' + mails.map(function (m, i) {
        var inst = /\.edu(\.|$)/.test(m.email);
        return '<div class="ilt-mail"><a href="mailto:' + esc(m.email) + '"><small>' + (inst ? bi('Institutional', 'Kurumsal') : bi('Personal', 'Kişisel')) + '</small>' + esc(m.email) + '</a>' +
          '<button type="button" class="ilt-copy" data-mail="' + esc(m.email) + '">' + bi('Copy', 'Kopyala') + '</button></div>';
      }).join('') + '</div></section>' : '') +
      (g.address_tr || g.address_en ? '<section><h3>' + bi('Affiliation and address', 'Kurum ve adres') + '</h3><div class="ilt-aff">' + bi(g.address_en, g.address_tr) + '</div></section>' : '') +
      (prof.length ? '<section><h3>' + bi('Academic profiles', 'Akademik profiller') + '</h3><div class="ilt-links">' + prof.map(link).join('') + '</div></section>' : '') +
      (soc.length ? '<section><h3>' + bi('Social media', 'Sosyal medya') + '</h3><div class="ilt-links">' + soc.map(link).join('') + '</div></section>' : '') +
      '</div>';
  }
  function open(fromLink) {
    load().then(function (g) {
      if (!dlg) {
        dlg = document.createElement('dialog'); dlg.className = 'ilt'; dlg.setAttribute('aria-label', 'İletişim / Contact');
        document.body.appendChild(dlg);
        dlg.addEventListener('click', function (e) {
          if (e.target === dlg || e.target.closest('.ilt-x')) { close(); return; }
          var c = e.target.closest('.ilt-copy'); if (!c) return;
          var done = function () { c.classList.add('ok'); c.innerHTML = bi('Copied', 'Kopyalandı'); setTimeout(function () { c.classList.remove('ok'); c.innerHTML = bi('Copy', 'Kopyala'); }, 1800); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c.dataset.mail).then(done, function () {});
        });
        dlg.addEventListener('close', function () { if (pushed) { pushed = false; history.back(); } });
      }
      dlg.innerHTML = build(g);
      if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
      if (fromLink && !/yazilar\.html/.test(location.pathname) && location.hash !== '#iletisim') { history.pushState({ ilt: 1 }, '', '#iletisim'); pushed = true; }
      var x = dlg.querySelector('.ilt-x'); if (x) x.focus();
    });
  }
  function close() { if (dlg && dlg.open) dlg.close(); }
  window.addEventListener('popstate', function () { if (dlg && dlg.open && location.hash !== '#iletisim') { pushed = false; dlg.close(); } });

  /* the Contact link in the menu opens this page instead of jumping */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('header.top nav.links a');
    if (!a || !/#contact$/.test(a.getAttribute('href') || '')) return;
    e.preventDefault(); open(true);
  });
  if (location.hash === '#iletisim') open(false);
})();
