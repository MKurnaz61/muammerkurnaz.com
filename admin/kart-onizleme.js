/* Preview for "9. Tür kartları" in the admin panel.
   Shows every card the way it will look, with filters for drafts and approved cards.
   Drafts are visible only here; the site shows approved cards only (onay = true). */
(function () {
  if (!window.CMS || !window.createClass || !window.h) return;
  var h = window.h;
  var GR = { kertenkele: 'Sürüngen · Kertenkele', yilan: 'Sürüngen · Yılan', kaplumbaga: 'Sürüngen · Kaplumbağa', kurbaga: 'Amfibi · Kurbağa', semender: 'Amfibi · Semender' };
  var CATS = ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'], CATS_TR = ['LC', 'NT', 'VU', 'EN', 'CR', 'RE'];
  var CCOL = { LC: '#3E9B4F', NT: '#8DB33A', VU: '#E3A21A', EN: '#E2412A', CR: '#C0172B', EW: '#5B2A6E', EX: '#222', RE: '#5B2A6E' };
  /* light Markdown as on the site: \* escapes, **bold** / __bold__, *italic* / _italic_ */
  function italic(t) {
    t = window.MKStil ? MKStil.stars(t) : String(t || '');
    t = t.replace(/\\([\\*_])/g, function (m, c) { return '\u0001' + c.charCodeAt(0) + '\u0002'; });
    function un(s) { return s.replace(/\u0001(\d+)\u0002/g, function (m, n) { return String.fromCharCode(+n); }); }
    return t.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|(?:^|\b)_[^_]+_(?=\b|$))/).map(function (p, i) {
      if (/^\*\*[^*]+\*\*$/.test(p) || /^__[^_]+__$/.test(p)) return h('b', { key: i }, un(p.slice(2, -2)));
      if (/^\*[^*]+\*$/.test(p) || /^_[^_]+_$/.test(p)) return h('i', { key: i }, un(p.slice(1, -1)));
      return un(p);
    });
  }
  function src(p) { p = String(p || ''); return /^https?:/.test(p) ? p : '/' + p.replace(/^\/+/, ''); }

  var Preview = createClass({
    getInitialState: function () { return { show: 'taslak', q: '' }; },
    render: function () {
      var self = this, raw = this.props.entry.getIn(['data', 'species']);
      var list = raw && raw.toJS ? raw.toJS() : [];
      var ok = list.filter(function (c) { return c && c.onay; }).length;
      var shown = list.map(function (c, i) { return { c: c || {}, n: i + 1 }; }).filter(function (x) {
        var c = x.c, q = self.state.q.toLowerCase();
        if (self.state.show === 'taslak' && c.onay) return false;
        if (self.state.show === 'onay' && !c.onay) return false;
        return !q || (String(c.latin) + ' ' + String(c.tr)).toLowerCase().indexOf(q) >= 0;
      });
      function btn(k, label) {
        return h('button', { key: k, type: 'button', onClick: function () { self.setState({ show: k }); }, className: 'f' + (self.state.show === k ? ' on' : '') }, label);
      }
      return h('div', { className: 'pv' },
        h('div', { className: 'pv-head' },
          h('h1', {}, 'Tür kartları'),
          h('p', {}, ok + ' / ' + list.length + ' kart onaylı ve sitede yayında. Bir kartı onaylamak için soldaki listede kartı açıp "ONAYLANDI" düğmesini aç. Birkaç kartı onayladıktan sonra tek seferde Publish de.'),
          h('div', { className: 'pv-tools' }, btn('taslak', 'Taslaklar'), btn('onay', 'Onaylılar'), btn('tumu', 'Tümü'),
            h('input', { type: 'search', placeholder: 'Tür ara', value: self.state.q, onChange: function (e) { self.setState({ q: e.target.value }); } }))),
        shown.map(function (x) {
          var c = x.c, ph = (c.photos || []).filter(Boolean), cat = String(c.iucn || 'NE').toUpperCase(), catTr = String(c.iucn_tr || 'NE').toUpperCase();
          return h('article', { key: x.n, className: 'card' + (c.onay ? ' ok' : '') },
            h('div', { className: 'ph' },
              h('div', { className: 'top' },
                h('span', { className: 'b cls' }, GR[c.group] || ''),
                c.region_tr ? h('span', { className: 'b reg' }, c.region_tr) : null,
                c.endemic ? h('span', { className: 'b end' }, 'Türkiye endemiği') : null,
                h('span', { className: 'st' }, c.onay ? 'Yayında' : 'Taslak, sitede görünmüyor')),
              ph.length ? h('img', { src: src(ph[0]), alt: '' }) : h('div', { className: 'nophoto' }, 'Fotoğraf yok'),
              ph.length > 1 ? h('div', { className: 'thumbs' }, ph.slice(1).map(function (p, i) { return h('img', { key: i, src: src(p), alt: '' }); })) : null),
            h('div', { className: 'bd' },
              h('div', { className: 'num' }, 'KART ' + x.n),
              h('h2', {}, c.tr || '(Türkçe ad yok)'),
              h('p', { className: 'lat' }, h('i', {}, c.latin), ' ', h('span', {}, c.author || '')),
              h('p', { className: 'tax' }, [c.order, c.family].filter(Boolean).join(' · ')),
              h('div', { className: 'lbl' }, 'IUCN küresel'),
              h('div', { className: 'scale' }, CATS.map(function (k) { return h('span', { key: k, className: k === cat ? 'on' : '', style: k === cat ? { background: CCOL[k] } : null }, k); })),
              CATS.indexOf(cat) < 0 ? h('p', { className: 'ne' }, 'IUCN: ' + cat) : null,
              h('div', { className: 'lbl' }, 'IUCN Türkiye (Türkiye Kırmızı Listesi)'),
              h('div', { className: 'scale tr' }, CATS_TR.map(function (k) { return h('span', { key: k, className: k === catTr ? 'on' : '', style: k === catTr ? { background: CCOL[k] } : null }, k); })),
              CATS_TR.indexOf(catTr) < 0 ? h('p', { className: 'ne' }, catTr === 'NE' ? 'Türkiye Kırmızı Listesi henüz yayımlanmadı' : 'IUCN Türkiye: ' + catTr) : null,
              h('dl', {}, h('dt', {}, 'Yayılış'), h('dd', {}, italic(c.dist_tr)), h('dt', {}, 'Distribution (EN)'), h('dd', { className: 'en' }, italic(c.dist_en))),
              h('details', { className: 'book' }, h('summary', {}, 'Kitap için saklanan metinler (sitede görünmez)'),
                h('dl', {},
                  h('dt', {}, 'Tanı'), h('dd', {}, italic(c.id_tr)),
                  h('dt', {}, 'Yaşam alanı'), h('dd', {}, italic(c.hab_tr)),
                  h('dt', {}, 'Biliyor muydunuz?'), h('dd', {}, italic(c.fact_tr)))),
              c.not ? h('p', { className: 'note' }, h('b', {}, 'Kontrol notu: '), c.not) : null));
        }),
        shown.length ? null : h('p', { className: 'empty' }, 'Bu filtrede kart yok.'));
    }
  });

  CMS.registerPreviewTemplate('turler', Preview);
  /* preview for "10. Yazım stilleri": shows the italic list and a sample sentence as the site will show them */
  function rich(t) {
    t = window.MKStil ? MKStil.stars(t) : String(t || '');
    return t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map(function (p, i) {
      if (/^\*\*[^*]+\*\*$/.test(p)) return h('b', { key: i }, p.slice(2, -2));
      if (/^\*[^*]+\*$/.test(p)) return h('i', { key: i }, p.slice(1, -1));
      return p;
    });
  }
  var StilPreview = createClass({
    render: function () {
      var d = this.props.entry.get('data'), js = d && d.toJS ? d.toJS() : {};
      if (window.MKStil) MKStil.setConfig(js);
      var names = String(js.italik || '').split(/\r?\n|;/).map(function (s) { return s.trim(); }).filter(Boolean);
      return h('div', { className: 'pv' },
        h('div', { className: 'pv-head' }, h('h1', {}, 'Yazım stilleri'),
          h('p', {}, 'Bu listedeki ' + names.length + ' ad sitenin her yerinde kendiliğinden italik görünür. Bir metinde tek seferlik italik için sözcüğü *yıldızlar* arasına, kalın için **çift yıldız** arasına yazın.')),
        h('div', { className: 'card' }, h('div', { className: 'bd' },
          h('div', { className: 'num' }, 'DENEME CÜMLESİ'),
          h('p', { style: { fontSize: '18px', lineHeight: 1.6, margin: '6px 0 0' } }, rich(js.deneme || '')))),
        h('div', { className: 'card' }, h('div', { className: 'bd' },
          h('div', { className: 'num' }, 'İTALİK LİSTE'),
          h('div', { style: { columns: '220px', fontSize: '15px', lineHeight: 1.7, marginTop: '6px' } }, names.map(function (n, i) { return h('div', { key: i }, h('i', {}, n)); })))));
    }
  });
  CMS.registerPreviewTemplate('stiller', StilPreview);

  CMS.registerPreviewStyle(
    "body{margin:0;background:#0B1A2E;color:#E8EEF6;font-family:Georgia,serif}" +
    ".pv{padding:20px;display:flex;flex-direction:column;gap:18px}" +
    ".pv-head h1{margin:0;font-family:system-ui,sans-serif;font-size:24px;color:#fff}.pv-head p{margin:6px 0 10px;color:#C3CEDC;font-size:15px;line-height:1.5}" +
    ".pv-tools{display:flex;gap:8px;flex-wrap:wrap}.f{font:600 13px system-ui,sans-serif;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:999px;padding:7px 14px;cursor:pointer}.f.on{background:#E0A12E;color:#1B1300;border-color:#E0A12E}" +
    ".pv-tools input{font:14px system-ui,sans-serif;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:#16233A;color:#fff}" +
    ".card{border-radius:16px;overflow:hidden;border:2px solid #E0A12E;background:#16304F}.card.ok{border-color:#6FBF73}" +
    ".ph{padding:14px;background:#0E1F35;display:flex;flex-direction:column;gap:10px}.ph>img{width:100%;border-radius:10px;display:block}" +
    ".top{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.b{font:700 12px system-ui,sans-serif;padding:4px 10px;border-radius:999px}.cls{background:#E0A12E;color:#1B1300}.reg{border:1px solid rgba(255,255,255,.4);color:#fff}.end{background:#A6D65A;color:#16240A}" +
    ".st{margin-left:auto;font:600 12px ui-monospace,monospace;color:#E0A12E}.card.ok .st{color:#6FBF73}" +
    ".thumbs{display:flex;gap:6px}.thumbs img{width:80px;height:54px;object-fit:cover;border-radius:6px}.nophoto{padding:40px;text-align:center;color:#A8B6C8}" +
    ".bd{padding:16px 18px 18px}.num{font:12px ui-monospace,monospace;color:#A8B6C8}.bd h2{margin:2px 0 0;font-family:system-ui,sans-serif;font-size:24px;color:#fff}" +
    ".lat{margin:4px 0;color:#9CCBEA;font-size:17px}.lat span{color:#A8B6C8;font-size:14px}.tax{margin:0 0 10px;font:12px ui-monospace,monospace;color:#A8B6C8}" +
    ".scale{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px}.scale span{font:700 11px system-ui,sans-serif;text-align:center;padding:5px 0;border-radius:5px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.45)}.scale .on{color:#fff}" +
    ".lbl{font:11px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#A8B6C8;margin:10px 0 4px}.scale.tr{grid-template-columns:repeat(6,1fr)}dd.en{color:#C3CEDC;font-size:14px}.book{margin-top:12px;border-top:1px solid rgba(255,255,255,.15);padding-top:8px}.book summary{cursor:pointer;font:12px ui-monospace,monospace;color:#A8B6C8}.ph>img{max-height:340px;object-fit:contain}" +
    ".ne{font:12px ui-monospace,monospace;color:#A8B6C8;margin:0 0 6px}" +
    "dl{margin:0;font-size:15px;line-height:1.45}dt{font:11px ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:#A8B6C8;margin-top:8px}dd{margin:2px 0 0}" +
    ".note{margin:12px 0 0;font-size:13px;line-height:1.45;color:#F6E7C8;background:rgba(224,161,46,.14);border:1px solid rgba(224,161,46,.4);border-radius:8px;padding:8px 10px}" +
    ".empty{color:#A8B6C8}", { raw: true });
})();
