# Deploy Tanzania Hugos Safaris on Hostinger

## Current VPS preview

The app is currently available for review at **https://<server-ip>:12443/**. The admin page is at `/admin` on the same address. The nonstandard HTTPS port keeps this preview separate from the server's existing websites.

On the VPS, `hugos-safaris.service` runs as the dedicated `hugos-safaris` user from `/opt/hugos-safaris/app`, listens only on `127.0.0.1:8796`, and stores writable content in `/opt/hugos-safaris/data`. Its environment and generated admin password are in the root-readable `/etc/hugos-safaris.env`. A separate Nginx file, `/etc/nginx/conf.d/hugos-safaris-preview.conf`, serves the IP preview on port 12443 using the existing IP certificate. The existing sites on ports 80, 443, 9443, 10443, and 11443 were not reassigned.

The preview Nginx site uses HTTP/2 and gzip for JavaScript, CSS, and JSON. Keep these settings when adding the real-domain server block; the main JavaScript transfers at about 151 KB compressed instead of 455 KB.

When a real domain is ready, point its DNS to the server IP, add a separate Nginx server block and certificate for that domain, update `SITE_URL` in `/etc/hugos-safaris.env`, then restart only `hugos-safaris.service`. Keep the preview until the domain has been checked. Back up `/opt/hugos-safaris/data` before future app updates; the deployment ZIP contains only a snapshot of the local data and must not replace newer server data.

The instructions below describe an alternative hPanel deployment. Do not follow them for this already running VPS instance.

This project needs a Node.js server for the admin area, content, media uploads, exchange rates, and enquiry forms. Uploading `dist/` alone will not run those features.

1. Confirm the hosting plan supports **Node.js Web Apps** (Business or Cloud). Back up the existing WordPress website, database, and email settings in Hostinger before changing its domain assignment.
2. Run `npm test`, then `bash scripts/package-hostinger.sh`. The resulting `deployment/hugos-hostinger.zip` is a ready-to-run site with **no readable source code**: the compiled, minified website in `dist/`, the server bundled into one minified file `server/app.mjs`, a production-only `package.json` (Express and Sharp), a `LICENSE` notice, and a snapshot of the content and uploads. The editable project (`src/`, the server source, tests, scripts and these notes) is never included, and neither are admin accounts or the local admin password. Keep the ZIP private because the database snapshot contains customer enquiries.
3. In hPanel, choose **Websites → Add website → Deploy Web App → Upload your website files**. Upload the ZIP. Choose **Node.js 22 or 24**, **Express** (or **Other**), build command `npm run build` (it does nothing; the site is already built), start command `npm start`, entry file `server/app.mjs`, and output directory `dist` if asked. Keep the full project folder on your own computer: it is the only place the editable source exists, so back it up.
4. Set environment variables in hPanel: `NODE_ENV=production`, `ADMIN_USERNAME=` and `ADMIN_PASSWORD=` (at least 16 characters) for the first owner account — they are used only when the site starts with no admin users; after that, owners add people, set roles and change passwords under Admin → Users & roles (if `ADMIN_USERNAME` is missing, the first owner is `admin`), and `SITE_URL=https://www.tanzaniahugossafaris.com`. Do not upload `data/admin-password.txt`. Leave `HOST` unset; the app listens on all interfaces in production. Hostinger's app proxy should provide `PORT`; the app defaults to 3000.
5. First deploy on Hostinger's temporary domain. Check the home page, a package page, `/api/content`, `/admin` login, and an enquiry submission. Confirm the enquiry appears in the admin area. Enquiries are saved to SQLite; to receive immediate email notifications, configure `ENQUIRY_WEBHOOK_URL` for an email automation endpoint.
6. Confirm with Hostinger that the Node app's writable files in `data/` persist across **redeploys**. The current admin content, enquiries, and uploads depend on this. If they do not persist, use persistent storage or migrate the database before relying on the live admin area. Back up `data/hugos.sqlite` and `data/uploads/` regularly.
7. After the temporary site is verified, connect `tanzaniahugossafaris.com` in the Node app's Hostinger dashboard and follow its DNS instructions. Hostinger says a domain already attached to WordPress may need that website removed first; only do this after a complete WordPress backup. Check both the root and `www` names, HTTPS, and the preferred redirect after the switch.

Do not delete the WordPress site or change DNS until the temporary deployment and data persistence are verified.

## Admin security

The admin page remains at `/admin` so the owner can sign in. Its address may be found by scanners or by inspecting public JavaScript; no website can guarantee that a login URL stays secret. The server excludes it from `robots.txt`, sends `noindex` and `no-store` headers, requires authentication for admin APIs, and throttles failed logins. These controls protect access, while search engine indexing rules only affect cooperative crawlers.

Keep the Hostinger `ADMIN_PASSWORD` private and change it if it was shared or shown in a screenshot. Production will refuse to start with a password shorter than 16 characters. Use HTTPS on the final domain and keep dependency updates and backups current. Hostinger's CDN/firewall may provide another layer of abuse protection; confirm its settings after the app is live.
