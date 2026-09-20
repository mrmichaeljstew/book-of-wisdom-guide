# Book of Wisdom — Study Guide (static site)

Interactive study guide for Harry B. Joseph’s *Book of Wisdom* (Volume 1 map), built from **public YouTube** narration and page-display videos.

**This is not a reprint of the book.** Summaries identify chapters and themes only. Buy the full book:

→ https://revivalofwisdom.com/

## What’s included

| Area | Content |
|------|---------|
| Essence | Worldview overview, chapter clusters, author/channel chrome |
| Chapters | Searchable explorer for **119** mapped sections |
| Themes | **19** theme hubs with related-chapter links |
| Videos | Official samples + Positive Vortex 45-part series; filter `shows_book_pages` |
| Symbols | Quick lexicon of recurring emblems |
| Seed deep-dive | Embedded video `Gnf5ZGXl_g4` + Ch. 115–116 |

## Open locally (recommended)

Data is embedded in `data.js`, so **no server is required**:

```bash
# macOS
open index.html

# Linux
xdg-open index.html
```

Or with a local server:

```bash
python3 -m http.server 8080
# http://localhost:8080/
```

## Files

- `index.html` — UI shell
- `styles.css` — dark esoteric theme
- `app.js` — search, filters, modals, routing
- `data.js` — embedded `window.SITE_DATA` (file:// friendly)
- `data/*.json` — source corpus (+ packs/manifests for Pages fetch)

## GitHub repo

https://github.com/mrmichaeljstew/book-of-wisdom-guide

### Finish push + enable Pages

`gh` on this build machine was not logged in; the public repo was created via MCP and partially populated. From a machine where you are authenticated as **mrmichaeljstew**:

```bash
cd /path/to/book-of-wisdom-site   # this folder

git remote add origin https://github.com/mrmichaeljstew/book-of-wisdom-guide.git 2>/dev/null || true
git fetch origin
git pull origin main --allow-unrelated-histories   # if needed
# Prefer a clean force of this site tree onto main:
git push -u origin main

# Enable Pages (root of main):
gh api -X POST repos/mrmichaeljstew/book-of-wisdom-guide/pages \\
  -f build_type=legacy \\
  -f source='{"branch":"main","path":"/"}' \\
  || true

# Or: GitHub → Settings → Pages → Deploy from branch → main → / (root)
```

**Expected live URL:** https://mrmichaeljstew.github.io/book-of-wisdom-guide/

### Pages note

For GitHub Pages, either keep `data.js` + `app.js` (simplest), or use `app-loader.js` + `app.b64.*` + JSON packs/manifests (fetch-based). This folder includes both.

## Copyright

Study guide from public video content only — not a transcription or OCR of the book. Support the author for full text and art.
