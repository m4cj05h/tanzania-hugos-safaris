// Records the pixel size of every built-in photo so the site can request a well-fitting smaller copy.
import {readdirSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import sharp from 'sharp';

const root='public/images';
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):/\.(?:webp|jpe?g|png)$/i.test(entry.name)?[join(dir,entry.name)]:[]);
const dims={};
for(const file of walk(root).sort()){const {width,height}=await sharp(file).metadata();dims[relative(root,file).split('\\').join('/')]=[width,height];}
writeFileSync('src/image-dims.json',JSON.stringify(dims)+'\n');
console.log(`Recorded ${Object.keys(dims).length} photo sizes`);
