"""Runs on Netlify at every deploy (see netlify.toml), using only the Python standard library.
It never changes the GitHub repository; everything it writes exists only in the published site.

  - yazi/<post>/index.html : one small page per blog post with its own title, summary and cover
    image, so links shared on LinkedIn or Facebook show a proper preview. The page sends the
    visitor straight on to the post in yazilar.html.
  - sitemap.xml and robots.txt : help search engines find the home page, the writings page and
    every post. The admin panel is kept out of search results.
  - rss.xml : a feed of the blog posts for feed readers.
  - data/openalex.json : citation counts from OpenAlex (total, h-index and per article by DOI).
    If OpenAlex cannot be reached, the file is simply not written and the site works as before.
  - data/geo.json : coordinates for the place names typed in the panel's photo "Yer" field
    (OpenStreetMap Nominatim, one request per second), used by the field map.
  - Google Search Console: if a verification code is set in the panel, its meta tag is added
    to index.html.
"""
import datetime
import html
import json
import os
import re
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://muammerkurnaz.com"
OPENALEX_AUTHOR = "A5042961734"
TR = str.maketrans({"ç": "c", "ğ": "g", "ı": "i", "İ": "i", "ö": "o", "ş": "s", "ü": "u",
                    "Ç": "c", "Ğ": "g", "Ö": "o", "Ş": "s", "Ü": "u"})


def slug(p):
    """Same rule as postSlug() in yazilar.html."""
    t = re.sub(r"[^a-z0-9]+", "-", str(p.get("title") or "").translate(TR).lower()).strip("-")
    return str(p.get("date") or "")[:10] + "-" + t[:60]


def plain(t):
    t = re.sub(r"\\([*_])", r"\1", str(t or ""))
    return re.sub(r"[*_]{1,2}([^*_]+)[*_]{1,2}", r"\1", t).strip()


def absurl(u):
    u = str(u or "")
    if not u or re.match(r"https?:", u):
        return u
    return SITE + "/" + u.lstrip("/")


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def post_pages(posts):
    for p in posts:
        s = slug(p)
        title = plain(p.get("title")) or "Yazı"
        desc = plain(p.get("summary") or p.get("summary_en"))
        img = absurl(p.get("cover")) or SITE + "/images/og.jpg"
        url = SITE + "/yazi/" + s + "/"
        target = "/yazilar.html#" + s
        e = html.escape
        write("yazi/%s/index.html" % s, """<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s · Muammer Kurnaz</title>
<meta name="description" content="%s">
<link rel="canonical" href="%s">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Muammer Kurnaz">
<meta property="og:title" content="%s">
<meta property="og:description" content="%s">
<meta property="og:image" content="%s">
<meta property="og:url" content="%s">
<meta property="article:published_time" content="%s">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta http-equiv="refresh" content="0; url=%s">
<script>location.replace(%s);</script>
</head><body style="font-family:system-ui,sans-serif;padding:24px">
<p><a href="%s">%s</a></p>
</body></html>
""" % (e(title), e(desc), e(url), e(title), e(desc), e(img), e(url), e(str(p.get("date") or "")[:10]),
            e(target), json.dumps(target), e(target), e(title)))
    return ["/yazi/%s/" % slug(p) for p in posts]


def sitemap(paths):
    today = datetime.date.today().isoformat()
    urls = "".join("  <url><loc>%s%s</loc><lastmod>%s</lastmod></url>\n" % (SITE, html.escape(u), today) for u in paths)
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n")
    write("robots.txt", "User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: %s/sitemap.xml\n" % SITE)


def rss(posts):
    items = []
    for p in sorted(posts, key=lambda x: str(x.get("date") or ""), reverse=True):
        try:
            d = datetime.datetime.strptime(str(p.get("date"))[:10], "%Y-%m-%d")
            pub = d.strftime("%a, %d %b %Y 00:00:00 +0300")
        except ValueError:
            pub = ""
        link = SITE + "/yazi/" + slug(p) + "/"
        items.append("<item><title>%s</title><link>%s</link><guid>%s</guid>%s<description>%s</description></item>" % (
            html.escape(plain(p.get("title"))), link, link, "<pubDate>%s</pubDate>" % pub if pub else "",
            html.escape(plain(p.get("summary")))))
    write("rss.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>'
          "<title>Muammer Kurnaz · Yazılar</title><link>%s/yazilar.html</link>"
          "<description>Herpetoloji, biyocoğrafya ve doğa üzerine yazılar</description><language>tr</language>%s"
          "</channel></rss>\n" % (SITE, "".join(items)))


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "muammerkurnaz.com build (mailto:muammerkurnazz@gmail.com)"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def openalex():
    a = get("https://api.openalex.org/authors/%s?select=cited_by_count,summary_stats,works_count" % OPENALEX_AUTHOR)
    works, cursor = {}, "*"
    while cursor:
        r = get("https://api.openalex.org/works?filter=authorships.author.id:%s&per-page=200&cursor=%s&select=doi,cited_by_count"
                % (OPENALEX_AUTHOR, cursor))
        for w in r.get("results", []):
            d = (w.get("doi") or "").lower().replace("https://doi.org/", "")
            if d:
                works[d] = max(works.get(d, 0), w.get("cited_by_count") or 0)
        cursor = (r.get("meta") or {}).get("next_cursor")
    out = {"updated": datetime.date.today().isoformat(), "citations": a.get("cited_by_count"),
           "h_index": (a.get("summary_stats") or {}).get("h_index"), "works": works}
    write("data/openalex.json", json.dumps(out, ensure_ascii=False))
    return out


def geocode():
    with open(os.path.join(ROOT, "photos.json"), encoding="utf-8") as f:
        photos = json.load(f).get("photos", [])
    places = sorted({str(p.get("place") or "").strip() for p in photos
                     if p and str(p.get("place") or "").strip() and not (str(p.get("lat") or "").strip() and str(p.get("lon") or "").strip())})
    out, import_time = {}, __import__("time")
    for name in places[:200]:
        for extra in ("&countrycodes=tr", ""):
            try:
                r = get("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=tr%s&q=%s"
                        % (extra, urllib.parse.quote(name)))
            except Exception:
                r = []
            import_time.sleep(1.1)
            if r:
                out[name] = [round(float(r[0]["lat"]), 4), round(float(r[0]["lon"]), 4)]
                break
    write("data/geo.json", json.dumps(out, ensure_ascii=False))
    return len(places), len(out)


def search_console():
    with open(os.path.join(ROOT, "data/genel.json"), encoding="utf-8") as f:
        code = str(json.load(f).get("gsc") or "").strip()
    m = re.search(r'content="([^"]+)"', code)
    code = m.group(1) if m else code
    if not re.fullmatch(r"[A-Za-z0-9_\-]{10,100}", code or ""):
        return False
    path = os.path.join(ROOT, "index.html")
    with open(path, encoding="utf-8") as f:
        page = f.read()
    tag = '<meta name="google-site-verification" content="%s">' % code
    if tag not in page:
        page = page.replace("<meta charset=\"utf-8\">", "<meta charset=\"utf-8\">\n" + tag, 1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(page)
    return True


def main():
    try:
        with open(os.path.join(ROOT, "posts.json"), encoding="utf-8") as f:
            posts = [p for p in json.load(f).get("posts", []) if p and p.get("title")]
    except Exception as err:
        print("build_extra: posts.json unreadable (%s)" % err)
        posts = []
    try:
        paths = ["/", "/yazilar.html", "/turler-listesi.html"] + post_pages(posts)
        sitemap(paths)
        rss(posts)
        print("build_extra: %d post pages, sitemap, robots, rss" % len(posts))
    except Exception as err:
        print("build_extra: pages skipped (%s)" % err)
    try:
        o = openalex()
        print("build_extra: OpenAlex %s citations, %d works" % (o["citations"], len(o["works"])))
    except Exception as err:
        print("build_extra: OpenAlex skipped (%s)" % err)
    try:
        n, ok = geocode()
        print("build_extra: field map places %d, located %d" % (n, ok))
    except Exception as err:
        print("build_extra: geocoding skipped (%s)" % err)
    try:
        print("build_extra: Search Console tag %s" % ("added" if search_console() else "not set"))
    except Exception as err:
        print("build_extra: Search Console skipped (%s)" % err)


if __name__ == "__main__":
    main()
