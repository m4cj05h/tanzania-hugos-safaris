import {mkdirSync, statSync, existsSync, renameSync} from 'node:fs';
import {join, resolve, sep} from 'node:path';
import sharp from 'sharp';

// Widths the site asks for in srcset. Anything else is refused so the cache can't be flooded.
export const imageWidths=[480,800,1200];

// Serves smaller copies of site photos (/images/<file>?w=800), made once with sharp and kept on disk.
export function registerImageSizes(app,{imagesDir,uploadsDir,cacheDir}){
  mkdirSync(cacheDir,{recursive:true});
  const pending=new Map();
  app.get('/images/{*path}',async(req,res,next)=>{
    const width=Number(req.query.w);
    if(!req.query.w||!imageWidths.includes(width))return next();
    const path=req.params.path.join('/');
    if(!/^(?:uploads\/)?(?:[a-z0-9_-]+\/)?[a-zA-Z0-9_-]+\.(?:webp|jpg|jpeg|png)$/.test(path))return next();
    const root=path.startsWith('uploads/')?uploadsDir:imagesDir;
    const source=resolve(root,path.replace(/^uploads\//,''));
    if(!source.startsWith(resolve(root)+sep)||!existsSync(source))return next();
    try{
      const {mtimeMs}=statSync(source);
      const target=join(cacheDir,`${encodeURIComponent(path)}-${width}-${Math.round(mtimeMs)}.webp`);
      if(!existsSync(target)){
        if(!pending.has(target))pending.set(target,sharp(source,{limitInputPixels:40000000}).resize({width,withoutEnlargement:true}).webp({quality:80}).toFile(target+'.tmp').then(()=>renameSync(target+'.tmp',target)).finally(()=>pending.delete(target)));
        await pending.get(target);
      }
      res.set('Cache-Control','public, max-age=604800, stale-while-revalidate=86400').type('image/webp').sendFile(target);
    }catch(error){next(error)}
  });
}
