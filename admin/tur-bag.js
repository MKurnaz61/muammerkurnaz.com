/* Keeps species names linked across the panel when an entry is saved.
   - "11. TR Tür Listesi": every species gets a fixed code ("kod") the first time it is saved.
     Photos point to that code, so later changes to the scientific, Turkish or English name
     show up on every photo, on the field map, in search and in the list.
   - "Saha fotoğrafları": the Turkish and English names of each photo are filled in from the list. */
(function () {
  if (!window.CMS) return;
  var REPO = 'MKurnaz61/muammerkurnaz.com';
  function norm(t) { return String(t == null ? '' : t).replace(/[*_]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }

  /* newest list: GitHub first (it already holds a list saved a moment ago), the published site otherwise */
  function loadList() {
    return fetch('https://api.github.com/repos/' + REPO + '/contents/data/turkiye-turleri.json?ref=main&t=' + Date.now(),
      { headers: { Accept: 'application/vnd.github.raw+json' } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { return fetch('/data/turkiye-turleri.json?t=' + Date.now()).then(function (r) { return r.ok ? r.json() : {}; }); })
      .catch(function () { return {}; });
  }

  CMS.registerEventListener({
    name: 'preSave',
    handler: function (o) {
      var entry = o.entry, data = entry.get('data');
      if (!data || !data.get) return data;

      if (entry.get('slug') === 'turkiye_turleri' && data.get('species')) {
        var used = {};
        data.get('species').forEach(function (s) { var k = s && s.get && s.get('kod'); if (k) used[norm(k)] = 1; });
        return data.set('species', data.get('species').map(function (s) {
          if (!s || !s.get || s.get('kod')) return s;
          var k = String(s.get('latin') || '').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim(), base = k, i = 2;
          while (k && used[norm(k)]) k = base + ' ' + i++;
          used[norm(k)] = 1;
          return s.set('kod', k);
        }));
      }

      if (entry.get('slug') === 'photos' && data.get('photos')) {
        return loadList().then(function (d) {
          var by = {};
          (d.species || []).forEach(function (s) { if (s && s.latin) by[norm(s.latin)] = s; });
          (d.species || []).forEach(function (s) { if (s && s.kod) by[norm(s.kod)] = s; });
          return data.set('photos', data.get('photos').map(function (p) {
            var s = p && p.get && by[norm(p.get('latin'))];
            if (!s) return p;
            return p.set('tr_name', s.tr || '').set('en_name', s.en || '');
          }));
        }).catch(function () { return data; });
      }
      return data;
    }
  });
})();
