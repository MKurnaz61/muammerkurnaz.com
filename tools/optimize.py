"""Runs on Netlify at every deploy (see netlify.toml). It never changes the GitHub repository.

Photos uploaded through the admin panel can be 6000 px wide and 5 to 10 MB. Before the site is
published, this script:
  - shrinks every photo wider or taller than the limit (gallery and species-card photos 1600 px,
    article covers 1800 px), keeping the file name, so links in the panel keep working;
  - makes a small copy named <name>-k.jpg (640 px) next to every gallery and species-card photo,
    which the gallery, the species strip and the site search use as thumbnails.
Pictures already small enough are left untouched. Any failure is reported and skipped, so a bad
file can never stop the site from being published.
"""
import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    print("optimize: Pillow not available, photos published unchanged")
    sys.exit(0)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JOBS = [  # folder, longest side, make thumbnails
    ("images/photos", 1600, True),
    ("images/kart", 1600, True),
    ("images/posts", 1800, False),
]
THUMB = 640
EXT = (".jpg", ".jpeg", ".png", ".webp")


def save(im, path, fmt):
    if fmt == "JPEG":
        im.convert("RGB").save(path, "JPEG", quality=82, optimize=True, progressive=True)
    else:
        im.save(path, fmt, optimize=True)


def main():
    shrunk = thumbs = 0
    before = after = 0
    for folder, limit, make_thumbs in JOBS:
        d = os.path.join(ROOT, folder)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            low = name.lower()
            if not low.endswith(EXT):
                continue
            stem, ext = os.path.splitext(name)
            if stem.endswith("-k"):
                continue
            path = os.path.join(d, name)
            try:
                size0 = os.path.getsize(path)
                with Image.open(path) as im0:
                    fmt = im0.format or "JPEG"
                    im = ImageOps.exif_transpose(im0)
                    im.load()
                if max(im.size) > limit:
                    im.thumbnail((limit, limit), Image.LANCZOS)
                    save(im, path, fmt)
                    shrunk += 1
                    before += size0
                    after += os.path.getsize(path)
                if make_thumbs:
                    tpath = os.path.join(d, stem + "-k.jpg")
                    if not os.path.exists(tpath):
                        t = im.copy()
                        t.thumbnail((THUMB, THUMB), Image.LANCZOS)
                        save(t, tpath, "JPEG")
                        thumbs += 1
            except Exception as err:  # never block a deploy
                print("optimize: skipped %s/%s (%s)" % (folder, name, err))
    print("optimize: %d photos shrunk (%.1f MB -> %.1f MB), %d thumbnails made"
          % (shrunk, before / 1048576, after / 1048576, thumbs))


if __name__ == "__main__":
    main()
