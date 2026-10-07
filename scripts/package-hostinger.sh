#!/usr/bin/env bash
# Builds deployment/hugos-hostinger.zip: a ready-to-run site with no readable source code.
# It holds the compiled website (dist/), the server bundled into one minified file (server/app.mjs),
# a production-only package.json, and a snapshot of the content and uploads. The editable project
# (src/, server source, tests, scripts, notes) stays on your computer.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p deployment
stage_dir="$(mktemp -d)"
trap 'rm -rf "$stage_dir"' EXIT

npm run build
cp -R dist "$stage_dir/"
node scripts/build-server.mjs "$stage_dir/server"

# Only what runs on the host: Express and Sharp. The site is already built, so "build" does nothing.
node --input-type=module -e '
import {readFileSync, writeFileSync} from "node:fs";
const project = JSON.parse(readFileSync("package.json", "utf8"));
const deps = Object.fromEntries(["express", "sharp"].map(name => [name, project.dependencies[name]]));
writeFileSync(process.argv[1] + "/package.json", JSON.stringify({
  name: project.name, version: project.version, private: true, type: "module",
  license: "UNLICENSED", engines: project.engines,
  scripts: {build: "echo The website is already built.", start: "NODE_ENV=production node server/app.mjs"},
  dependencies: deps,
}, null, 2) + "\n");
' "$stage_dir"
year="$(date +%Y)"
printf 'Copyright (c) %s Tanzania Hugos Safaris. All rights reserved.\n\nThis software and its design are proprietary. No part of it may be copied, modified,\ndistributed or used to build other websites without written permission from\nTanzania Hugos Safaris.\n' "$year" > "$stage_dir/LICENSE"

mkdir -p "$stage_dir/data/uploads"
if [ -d data/uploads ]; then cp -R data/uploads/. "$stage_dir/data/uploads/"; fi
# A SQLite snapshot of the content. Admin accounts are left out: on the host, the first owner
# is created from ADMIN_USERNAME and ADMIN_PASSWORD, so your local password never travels.
DEPLOY_DB="$stage_dir/data/hugos.sqlite" node --input-type=module -e '
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("data/hugos.sqlite");
db.prepare("VACUUM INTO ?").run(process.env.DEPLOY_DB);
db.close();
const copy = new DatabaseSync(process.env.DEPLOY_DB);
copy.exec("DROP TABLE IF EXISTS users; VACUUM;");
copy.close();
' 2>&1 | grep -v -i "experimental\|trace-warnings" || true

archive="$PWD/deployment/hugos-hostinger.zip"
rm -f "$archive"
(cd "$stage_dir" && zip -qr -X "$archive" . -x '.DS_Store' '*/.DS_Store')
echo "Created $archive"
