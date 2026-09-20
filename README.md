# Book of Wisdom — Study Guide

Interactive study guide for Harry B. Joseph’s *Book of Wisdom* (Volume 1 map), from **public YouTube** content.

**Not a reprint.** Buy the book: https://revivalofwisdom.com/

## Local open

```bash
open index.html   # or xdg-open index.html
```

Uses embedded `data.js` — no server required.

## Repo

https://github.com/mrmichaeljstew/book-of-wisdom-guide

## Finish deploy (run on your machine as mrmichaeljstew)

```bash
cd book-of-wisdom-site
gh auth login
git remote add origin https://github.com/mrmichaeljstew/book-of-wisdom-guide.git 2>/dev/null || true
git push -u origin main --force
gh api -X POST repos/mrmichaeljstew/book-of-wisdom-guide/pages -f build_type=legacy -f source='{"branch":"main","path":"/"}' || true
```

Live URL (after Pages): https://mrmichaeljstew.github.io/book-of-wisdom-guide/

## Counts

- **119** chapters · **19** themes · **55** videos inventoried
