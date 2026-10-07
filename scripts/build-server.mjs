// Bundles the server (and the shared site data it imports) into one minified file for hosting,
// so the hosting package carries no readable source code. Usage: node scripts/build-server.mjs <out-dir>
import {build} from 'esbuild';
import {copyFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const out=process.argv[2];
if(!out)throw Error('Give an output folder, e.g. node scripts/build-server.mjs stage/server');
mkdirSync(out,{recursive:true});
const notice='/*! Tanzania Hugos Safaris — © '+new Date().getFullYear()+' Tanzania Hugos Safaris. All rights reserved. Copying, modifying or redistributing this software without written permission is prohibited. */';

await build({
  entryPoints:['server/index.js'],
  outfile:join(out,'app.mjs'),
  bundle:true,
  minify:true,
  legalComments:'none',
  banner:{js:notice},
  platform:'node',
  format:'esm',
  target:'node22',
  // Installed on the host by npm; vite is only used in development and is never loaded in production.
  external:['express','sharp','vite'],
  loader:{'.js':'jsx'},
  jsxFactory:'h',
  jsxFragment:'React.Fragment',
  logLevel:'warning',
});
// Data files the server reads next to itself at run time.
for(const file of ['legacy-packages.json','google-reviews-saved.json'])copyFileSync(join('server',file),join(out,file));
console.log('Server bundled into '+join(out,'app.mjs'));
