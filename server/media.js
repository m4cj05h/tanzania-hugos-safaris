import express from 'express';
import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {mkdir, writeFile, unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {db,getContent} from './store.js';
import {defaultPartners} from '../src/partners.js';

// Pixel sizes of uploaded photos, so pages can request a well-fitting smaller copy.
export const uploadedPhotoSizes=()=>Object.fromEntries(db.prepare('SELECT id,width,height FROM media WHERE width>0 AND height>0').all().map(photo=>[photo.id,[photo.width,photo.height]]));

export function registerMedia(app, auth) {
  const directory = resolve(process.env.DATA_DIR || 'data', 'uploads');
  db.exec('CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, width INTEGER, height INTEGER, created TEXT NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS hidden_media (id TEXT PRIMARY KEY)');
  const builtin = [...['hero','safari','elephants','crater','zanzibar','mountain','company','logo'].map(name=>({id:name+'.webp',name:name[0].toUpperCase()+name.slice(1),builtin:true})),...defaultPartners.map(partner=>({id:partner.image,name:partner.name,builtin:true}))];
  app.use('/images/uploads', express.static(directory, {index:false, dotfiles:'deny', immutable:true, maxAge:'1y'}));
  app.use('/videos/uploads', express.static(directory, {index:false, dotfiles:'deny', immutable:true, maxAge:'1y'}));
  app.get('/api/admin/media', auth, (req,res)=>res.json([...db.prepare('SELECT * FROM media ORDER BY created DESC').all(),...builtin.filter(photo=>!db.prepare('SELECT id FROM hidden_media WHERE id=?').get(photo.id))]));
  app.delete('/api/admin/media/:id', auth, async(req,res,next)=>{
    const id=req.params.id;
    if(builtin.some(photo=>photo.id===id)){
      db.prepare('INSERT OR IGNORE INTO hidden_media (id) VALUES (?)').run(id);
      return res.json({ok:true});
    }
    if(!/^uploads\/[a-f0-9-]+\.webp$/.test(id))return res.status(400).json({error:'Only uploaded photos can be deleted.'});
    const photo=db.prepare('SELECT id FROM media WHERE id=?').get(id);
    if(!photo)return res.status(404).json({error:'Photo not found.'});
    function usesPhoto(value){
      if(typeof value==='string')return value.includes(id);
      return value&&typeof value==='object'&&Object.values(value).some(usesPhoto);
    }
    if(usesPhoto(getContent()))return res.status(409).json({error:'This photo is used by website content. Replace it and publish your changes before deleting it.'});
    try{
      await unlink(resolve(directory,id.slice('uploads/'.length))).catch(error=>{if(error.code!=='ENOENT')throw error;});
      db.prepare('DELETE FROM media WHERE id=?').run(id);
      res.json({ok:true});
    }catch(error){next(error);}
  });
  app.post('/api/admin/media', auth, express.raw({type:['image/jpeg','image/png','image/webp'],limit:'10mb'}), async(req,res,next)=>{
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({error:'Choose a JPG, PNG or WebP photo, up to 10 MB.'});
    let output;
    try {
      const image = sharp(req.body,{limitInputPixels:40000000, failOn:'warning'});
      const metadata = await image.metadata();
      if (!['jpeg','png','webp'].includes(metadata.format) || (metadata.pages||1)>1) throw Error('Unsupported image');
      output = await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
    } catch {return res.status(400).json({error:'This photo could not be read. Use a still JPG, PNG or WebP image under 40 megapixels.'});}
    const filename=randomUUID()+'.webp';
    let name='Uploaded photo';
    try {name=decodeURIComponent(req.get('X-File-Name')||name).replace(/[\x00-\x1f\x7f]/g,'').slice(0,160)||name;} catch {}
    const photo={id:'uploads/'+filename,name,width:output.info.width,height:output.info.height,created:new Date().toISOString()};
    try {
      await mkdir(directory,{recursive:true});
      await writeFile(resolve(directory,filename),output.data,{flag:'wx'});
      db.prepare('INSERT INTO media VALUES (?,?,?,?,?)').run(photo.id,photo.name,photo.width,photo.height,photo.created);
      res.status(201).json(photo);
    } catch(error) {await unlink(resolve(directory,filename)).catch(()=>{});next(error);}
  });
  app.post('/api/admin/videos', auth, express.raw({type:['video/mp4','video/webm'],limit:'100mb'}), async(req,res,next)=>{
    if(!Buffer.isBuffer(req.body)||!req.body.length)return res.status(400).json({error:'Choose an MP4 or WebM video up to 100 MB.'});
    const type=req.get('Content-Type')?.split(';')[0];
    const extension=type==='video/webm'?'webm':'mp4';
    const filename=randomUUID()+'.'+extension;
    let name='Uploaded video';
    try{name=decodeURIComponent(req.get('X-File-Name')||name).replace(/\.[^.]+$/,'').replace(/[\x00-\x1f\x7f]/g,'').slice(0,120)||name;}catch{}
    try{
      await mkdir(directory,{recursive:true});
      await writeFile(resolve(directory,filename),req.body,{flag:'wx'});
      res.status(201).json({name,url:'/videos/uploads/'+filename});
    }catch(error){await unlink(resolve(directory,filename)).catch(()=>{});next(error);}
  });
}
