/* Keeps species names linked across the panel when an entry is saved.
   - "11. TR Tür Listesi": species are kept in family sections. On save, a family entered twice is merged,
     a species with "Başka familyaya taşı" filled moves to that family, and every species gets a fixed
     code ("kod") the first time it is saved.
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

      if (entry.get('slug') === 'turkiye_turleri' && data.get('familyalar')) {
        /* plain copy, rebuilt into the panel's own data types at the end */
        var IMap = data.constructor, IList = data.get('familyalar').constructor;
        function back(v) {
          if (Array.isArray(v)) return IList(v.map(back));
          if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = back(v[k]); }); return IMap(o); }
          return v;
        }
        var fams = data.get('familyalar').toJS().filter(Boolean), byName = {}, out = [];
        /* 1. a family typed twice becomes one section */
        fams.forEach(function (f) {
          f.turler = (f.turler || []).filter(Boolean);
          var k = norm(f.familya);
          if (k && byName[k]) { byName[k].turler = byName[k].turler.concat(f.turler); return; }
          if (k) byName[k] = f;
          out.push(f);
        });
        /* 2. species with "Başka familyaya taşı" filled move to that family (a new section if needed) */
        out.slice().forEach(function (f) {
          f.turler = f.turler.filter(function (t) {
            var to = String(t.tasi || '').trim(); delete t.tasi;
            if (!to || norm(to) === norm(f.familya)) return true;
            var dest = byName[norm(to)];
            if (!dest) { dest = { familya: to, grup: f.grup, takim: f.takim, turler: [] }; byName[norm(to)] = dest; out.splice(out.indexOf(f) + 1, 0, dest); }
            dest.turler.push(t);
            return false;
          });
        });
        /* 3. every species gets a fixed code the first time it is saved */
        var used = {};
        out.forEach(function (f) { f.turler.forEach(function (t) { if (t.kod) used[norm(t.kod)] = 1; }); });
        out.forEach(function (f) { f.turler.forEach(function (t) {
          if (t.kod) return;
          var k = String(t.latin || '').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim(), base = k, i = 2;
          while (k && used[norm(k)]) k = base + ' ' + i++;
          used[norm(k)] = 1; t.kod = k;
        }); });
        /* a family section left without species is removed */
        out = out.filter(function (f) { return f.turler.length; });
        /* flat index used by the species picker of the photos (a list inside a list is too slow for it) */
        var dizin = [];
        out.forEach(function (f) { f.turler.forEach(function (t) { dizin.push({ kod: t.kod, latin: t.latin || '', tr: t.tr || '', en: t.en || '' }); }); });
        return data.set('familyalar', back(out)).set('dizin', back(dizin));
      }

      if (entry.get('slug') === 'photos' && data.get('photos')) {
        return loadList().then(function (d) {
          var by = {};
          var all = d.species || [];
          (d.familyalar || []).forEach(function (f) { (f && f.turler || []).forEach(function (t) { if (t) all.push(t); }); });
          all.forEach(function (s) { if (s && s.latin) by[norm(s.latin)] = s; });
          all.forEach(function (s) { if (s && s.kod) by[norm(s.kod)] = s; });
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
