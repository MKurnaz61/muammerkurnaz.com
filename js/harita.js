/* Field map ("Saha haritası") under the photo gallery. Photos that have a latitude and longitude in the
   panel ("7. Fotoğraflar": Enlem / Boylam) appear as points on a map of Türkiye; the section stays
   hidden until at least one photo has coordinates.
   Protecting localities: unless "Kesin konumu göster" is ticked for a photo, its point is rounded to
   0.1 degree (about 10 km), so exact sites of rare species are not published. */
(function () {
  var box = document.getElementById('fieldMap'); if (!box) return;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(v) { v = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(v) ? v : null; }
  function thumb(src) { return String(src || '').replace(/(-k)?\.(jpe?g|png|webp)$/i, '-k.jpg'); }
  function loadJs(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function loadCss(href) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }

  var css = document.createElement('style');
  css.textContent =
    '.fieldmap{margin-top:40px;display:flex;flex-direction:column;gap:12px}' +
    '.fieldmap h3{margin:0;font:700 24px var(--display);color:#fff}.fieldmap p.n{margin:0;font-size:15px;color:#A8B6C8}' +
    '.fieldmap .mapbox{height:440px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:#0B1A2E}' +
    '.fieldmap .leaflet-popup-content{margin:10px 12px;font:14px/1.4 var(--body,Georgia),serif;color:#132235}' +
    '.fieldmap .leaflet-popup-content img{display:block;width:180px;height:120px;object-fit:cover;border-radius:6px;margin-bottom:6px}' +
    '.fieldmap .pin{width:14px;height:14px;border-radius:50%;background:#E0A12E;border:2px solid #0B1A2E;box-shadow:0 0 0 2px rgba(224,161,46,.45)}' +
    '@media (max-width:760px){.fieldmap .mapbox{height:340px}}';
  document.head.appendChild(css);

  fetch('photos.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (d) {
    var pts = (d.photos || []).filter(function (p) { return p && num(p.lat) != null && num(p.lon) != null; }).map(function (p) {
      var lat = num(p.lat), lon = num(p.lon);
      if (!p.exact) { lat = Math.round(lat * 10) / 10; lon = Math.round(lon * 10) / 10; }
      return { lat: lat, lon: lon, p: p };
    });
    if (!pts.length) return;
    var sp = {}; pts.forEach(function (x) { sp[x.p.latin] = 1; });
    box.innerHTML = '<h3><span class="en">Field map</span><span class="tr">Saha haritası</span></h3>' +
      '<p class="n"><span class="en">' + pts.length + ' photos of ' + Object.keys(sp).length + ' species. Points of rare species are shown at about 10 km precision.</span>' +
      '<span class="tr">' + Object.keys(sp).length + ' türe ait ' + pts.length + ' fotoğraf. Nadir türlerin noktaları yaklaşık 10 km hassasiyetle gösterilir.</span></p>' +
      '<div class="mapbox" id="fieldMapBox" role="region" aria-label="Saha haritası / Field map"></div>';
    box.hidden = false;
    var started = false;
    function start() {
      if (started) return; started = true;
      loadCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
      loadJs('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js').then(function () {
        var map = L.map('fieldMapBox', { scrollWheelZoom: false, attributionControl: true }).setView([39.2, 35.3], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 12, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);
        var icon = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });
        var bounds = [];
        pts.forEach(function (x) {
          var p = x.p, lang = document.documentElement.lang;
          L.marker([x.lat, x.lon], { icon: icon, title: p.latin }).addTo(map).bindPopup(
            '<img src="' + esc(p.thumb || thumb(p.image)) + '" onerror="this.src=\'' + esc(p.image) + '\'" alt="">' +
            (p.tr_name ? esc(p.tr_name) + '<br>' : '') + '<i>' + esc(p.latin) + '</i>' + (p.place ? '<br><small>' + esc(p.place) + '</small>' : ''));
          bounds.push([x.lat, x.lon]);
        });
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
      }).catch(function () { box.hidden = true; });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: '300px' });
      io.observe(box);
    } else start();
  });
})();
