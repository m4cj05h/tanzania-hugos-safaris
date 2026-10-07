# Tanzania Hugos Safaris website

The website at https://tanzaniahugossafaris.com: public pages, trip packages, blog, enquiry forms and the admin area.

## Folders

| Folder | What it holds |
|---|---|
| `src/` | The website pages and design (React). |
| `server/` | The Node.js server: content, admin, uploads, enquiries and the search-engine version of each page. |
| `public/` | Files served as they are: photos, fonts, icons. |
| `tests/` | Automated checks (`npm test`). |
| `scripts/` | Helper scripts: browser tests, image tools, packaging. |
| `data/` | Local database, uploaded photos and caches. Private: it contains customer enquiries. |
| `brochures/` | The three package brochures (PDF). They are the source of truth for trips, itineraries and prices. |
| `design-source/` | Original photos, logo, icons and Kilimanjaro route maps that the website images were made from. |
| `docs/` | Notes: server deployment, and drafts of trip descriptions for the admin. |
| `dist/` | The built website (`npm run build`). Generated; do not edit. |
| `deployment/` | Packaged ZIP for hosting. Generated; contains a data snapshot, so keep it private. |

## Common commands

```
npm install          # once, to install dependencies
npm run dev          # run the site locally
npm test             # run the automated checks
npm run build        # build the website into dist/
```

## Live setup

- The server is a Namecheap VPS (its IP address is kept out of this public repository; Cloudflare hides it). The app runs as the `hugos-safaris` service from `/opt/hugos-safaris/app`, and its data lives in `/opt/hugos-safaris/data`. See `docs/HOSTINGER_DEPLOY.md`.
- The domain is registered with Hostinger, but its DNS is managed in **Cloudflare**, which also caches photos and serves the site over HTTPS (Full strict). Make DNS changes in Cloudflare, not Hostinger.
- Back up `/opt/hugos-safaris/data` on the server before every update.
