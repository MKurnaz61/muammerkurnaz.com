/* Single source of species names for the whole site.
   Every species in "11. Türkiye tür listesi" (data/turkiye-turleri.json) has a fixed code ("kod").
   Photos store that code (chosen from the list in the panel), so the scientific, Turkish and English
   names shown under a photo, on the field map, in search and in the TR species list always come from
   the list. Renaming a species in the list changes it everywhere at once.
   Older entries that store a plain scientific name are matched by name, so nothing breaks. */
(function () {
  if (window.MKTur) return;
  var byKey = {}, list = [];
  function norm(t) { return String(t == null ? '' : t).replace(/[*_]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  var ready = fetch('/data/turkiye-turleri.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    .then(function (d) {
      list = (d.species || []).filter(function (s) { return s && s.latin; });
      list.forEach(function (s) { byKey[norm(s.latin)] = s; });
      /* codes win over names, so a renamed species is still found by its old code */
      list.forEach(function (s) { if (s.kod) byKey[norm(s.kod)] = s; });
      return list;
    });
  function find(name) { return byKey[norm(name)] || null; }
  /* names for anything that carries a species value (photo, card): list first, own fields as fallback */
  function names(o) {
    o = o || {};
    var s = find(o.latin);
    return {
      sp: s,
      kod: s ? (s.kod || s.latin) : String(o.latin || '').trim(),
      latin: s ? s.latin : String(o.latin || '').replace(/[*_]/g, '').trim(),
      tr: (s && s.tr) || o.tr_name || '',
      en: (s && s.en) || o.en_name || ''
    };
  }
  function key(name) { var s = find(name); return s ? norm(s.kod || s.latin) : norm(name); }
  window.MKTur = { ready: ready, find: find, names: names, key: key, norm: norm, all: function () { return list; } };
})();
