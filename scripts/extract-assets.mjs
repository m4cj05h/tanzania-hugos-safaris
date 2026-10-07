import {getDocument,OPS} from 'pdfjs-dist/legacy/build/pdf.mjs';
import sharp from 'sharp';
import fs from 'node:fs';
const files=['DAY TRIPS TOUR SAFARIS PACKAGE 2.pdf','TREKKING SAFARIS PACKAGE.pdf','HUGOS SAFARI2-Recovered.pdf'].map(name=>'brochures/'+name);
let items=[];
for(let f=0;f<files.length;f++){
 const doc=await getDocument({data:new Uint8Array(fs.readFileSync(files[f])),useSystemFonts:true}).promise;
 for(const p of (f===0?[1,2,7,13,20,26,32,40,49,53,57,61,65]:f===1?[1,2,10,20,30]:[1,2,4,7,10,14,20,25,30])){
 if(p>doc.numPages)continue;const page=await doc.getPage(p);const ops=await page.getOperatorList();
 for(let i=0;i<ops.fnArray.length;i++)if([OPS.paintImageXObject,OPS.paintInlineImageXObject].includes(ops.fnArray[i])){try{
 const arg=ops.argsArray[i][0];const im=typeof arg==='string'?await new Promise(r=>(arg.startsWith('g_')?page.commonObjs:page.objs).get(arg,r)):arg;
 if(im.width<500||im.height<300)continue;
 const channels=im.data.length/(im.width*im.height);if(![1,3,4].includes(channels))continue;
 const name=`asset-${f}-${p}-${i}.webp`;await sharp(im.data,{raw:{width:im.width,height:im.height,channels}}).resize({width:1800,withoutEnlargement:true}).webp({quality:83}).toFile('public/images/'+name);items.push({name,width:im.width,height:im.height});
 }catch(e){console.log(e.message)}}
 }
}
await sharp('design-source/logo.JPG').resize(220).webp().toFile('public/images/logo.webp');
await sharp('design-source/IMG_3605.JPG').rotate().resize(1600).webp({quality:85}).toFile('public/images/company.webp');
fs.writeFileSync('/tmp/hugos-assets.json',JSON.stringify(items));
const thumbs=await Promise.all(items.map(async(x,i)=>({input:await sharp('public/images/'+x.name).resize(180,120,{fit:'cover'}).extend({bottom:24,background:'white'}).composite([{input:Buffer.from(`<svg width="180" height="24"><text x="6" y="17" font-size="13">${i}: ${x.name}</text></svg>`),top:120,left:0}]).png().toBuffer(),left:(i%5)*180,top:Math.floor(i/5)*144})));
await sharp({create:{width:900,height:Math.ceil(items.length/5)*144,channels:3,background:'white'}}).composite(thumbs).png().toFile('/tmp/hugos-contact-sheet.png');
console.log(items.length+' images extracted');
