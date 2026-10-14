import express from 'express';
import {registerMedia,uploadedPhotoSizes} from './media.js';
import {registerImageSizes} from './image-sizes.js';
import {randomBytes,randomUUID} from 'node:crypto';
import {existsSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import builtInSizes from '../src/image-dims.json' with {type:'json'};
import {resolve} from 'node:path';
import {db,getContent,saveContent} from './store.js';
import {createRateService} from './exchange-rates.js';
import {blogError} from './blog.js';
import {createUsers,roles} from './users.js';
import {createGoogleReviews,googleReviewsFor,googleSettingsError} from './google-reviews.js';
import {categories,defaultKilimanjaroRoutes,initialContent} from '../src/data.js';
import {renderPage,staticPages} from './seo.js';
import {redirectFor,knownPaths} from './seo-pages.js';
import {validHome} from '../src/home-content.js';
function validPartners(partners){
  return Array.isArray(partners)&&partners.length<=24&&new Set(partners.map(partner=>partner?.id)).size===partners.length&&partners.every(partner=>partner&&typeof partner.id==='string'&&partner.id.length>0&&partner.id.length<=120&&typeof partner.name==='string'&&partner.name.trim().length>0&&partner.name.length<=120&&typeof partner.image==='string'&&/^(?:[a-zA-Z0-9_-]+\.(?:webp|png|jpg|jpeg)|partners\/[a-z0-9-]+\.(?:webp|png|jpg|jpeg)|uploads\/[a-f0-9-]+\.webp)$/.test(partner.image));
}
function validShowcaseLinks(links){
  return Array.isArray(links)&&links.length<=12&&new Set(links.map(link=>link?.id)).size===links.length&&links.every(link=>{
    if(!link||typeof link.id!=='string'||!link.id||link.id.length>120||typeof link.title!=='string'||link.title.length>120||typeof link.url!=='string'||link.url.length>2048)return false;
    if(link.placement!==undefined&&!['homepage','kilimanjaro'].includes(link.placement))return false;
    if(/^\/videos\/uploads\/[a-f0-9-]+\.(?:mp4|webm)$/.test(link.url))return true;
    try{const url=new URL(link.url);return ['http:','https:'].includes(url.protocol)&&!!url.hostname&&!url.username&&!url.password;}catch{return false;}
  });
}
// Returns why the departures can't be saved (naming the departure), or '' when they are valid.
function announcementError(items){
  if(!Array.isArray(items)||items.length>40)return 'You can publish up to 40 group departures.';
  if(new Set(items.map(item=>item?.id)).size!==items.length)return 'Two departures share the same id. Remove one and add it again.';
  const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value);
  for(const [index,item] of items.entries()){
    if(!item||typeof item.id!=='string'||!item.id||item.id.length>120)return `Departure ${index+1} is damaged. Remove it and add it again.`;
    const name=typeof item.route==='string'&&item.route.trim()?`“${item.route.trim().slice(0,60)}”`:`Departure ${index+1}`;
    const problem=typeof item.route!=='string'||!item.route.trim()||item.route.length>140?'needs a trip name (up to 140 characters)'
      :!Number.isInteger(item.days)||item.days<1||item.days>30?'needs a number of days between 1 and 30'
      :!date(item.startDate)?'needs a start date'
      :!date(item.endDate)?'needs an end date'
      :item.endDate<item.startDate?'has an end date before its start date'
      :!Number.isFinite(item.price)||item.price<0?'needs a valid price'
      :!Number.isFinite(item.deposit)||item.deposit<0?'needs a valid deposit'
      :typeof item.features!=='string'||item.features.length>600?'has too much feature text (600 characters at most)'
      :item.featureIcons!==undefined&&(!Array.isArray(item.featureIcons)||item.featureIcons.length>20||item.featureIcons.some(icon=>typeof icon!=='string'||!/^[a-z]{0,20}$/.test(icon)))?'has an invalid feature icon'
      :typeof item.published!=='boolean'?'needs a published setting'
      :item.trip!==undefined&&!['Kilimanjaro','Safari','Zanzibar'].includes(item.trip)?'needs a trip type of Kilimanjaro, Safari or Zanzibar':'';
    if(problem)return `${name} ${problem}.`;
  }
  return '';
}
if(!getContent())saveContent(initialContent);
else if(getContent().kilimanjaroBrochureVersion!==2){const current=getContent();saveContent({...current,kilimanjaroRoutes:defaultKilimanjaroRoutes.map(route=>({...route,price:current.kilimanjaroRoutes?.find(saved=>saved.slug===route.slug)?.price??route.price})),kilimanjaroBrochureVersion:2});}
// Brochure catalogue (v1): add trips that are missing and refresh shipped trips the admin never edited.
if(getContent().packagesBrochureVersion!==1){const current=getContent();const legacy=JSON.parse(readFileSync(new URL('./legacy-packages.json',import.meta.url),'utf8'));
  const untouched=p=>{const original=legacy.find(l=>l.id===p.id);return original&&JSON.stringify(original)===JSON.stringify(p)};
  const packages=current.packages.map(p=>untouched(p)?initialContent.packages.find(n=>n.id===p.id)||p:p);
  for(const p of initialContent.packages)if(!packages.some(saved=>saved.id===p.id))packages.push(p);
  saveContent({...current,packages,packagesBrochureVersion:1});}
const app=express(), production=process.env.NODE_ENV==='production';
if(production)app.set('trust proxy',process.env.TRUST_PROXY||'loopback');
app.disable('x-powered-by'); app.use(express.json({limit:'2mb'}));
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');if(production)res.setHeader('Content-Security-Policy',"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://lh3.googleusercontent.com https://i.ytimg.com; connect-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com");if(/^\/admin(?:\/|$)/i.test(req.path)||req.path.startsWith('/api/')){res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('Cache-Control','no-store')}next()});
// Admin users live in the database. The first owner is created from ADMIN_USERNAME / ADMIN_PASSWORD;
// after that, owners add people, give them roles and change passwords in the admin.
const localPasswordFile=resolve(process.env.DATA_DIR||'data','admin-password.txt');
// The local file holds either just the password, or the username on the first line and the password on the second.
const savedLines=!production&&!process.env.ADMIN_PASSWORD&&existsSync(localPasswordFile)?readFileSync(localPasswordFile,'utf8').split(/\r?\n/).map(line=>line.trim()).filter(Boolean):[];
const savedPassword=savedLines.at(-1)||null,savedUsername=savedLines.length>1?savedLines[0]:null;
const seedPassword=process.env.ADMIN_PASSWORD||(!production?savedPassword||randomBytes(15).toString('base64url'):null);
if(production&&seedPassword&&seedPassword.length<16)throw Error('ADMIN_PASSWORD must be at least 16 characters');
const users=createUsers(db,{seedUsername:process.env.ADMIN_USERNAME||savedUsername||'admin',seedPassword});
if(!users.count())throw Error('Set ADMIN_PASSWORD before the first production start');
if(!production&&!process.env.ADMIN_PASSWORD&&!savedPassword){writeFileSync(localPasswordFile,seedPassword,{mode:0o600});console.log('Local admin password saved to '+localPasswordFile)}
const sessions=new Map(),limits=new Map(),loginFailures=new Map();
let activeLogins=0;
// Signs a user out everywhere (except, optionally, the session they are using now).
const endSessions=(userId,keep)=>{for(const [token,session] of sessions)if(session.userId===userId&&token!==keep)sessions.delete(token)};
const limited=(req,res,next)=>{const key=req.ip+req.path;const now=Date.now();const hit=limits.get(key);if(hit&&now-hit.at<900000&&hit.count>=20)return res.status(429).json({error:'Too many attempts. Please try again in 15 minutes.'});limits.set(key,{at:hit&&now-hit.at<900000?hit.at:now,count:hit&&now-hit.at<900000?hit.count+1:1});next()};
setInterval(()=>{for(const [k,v]of limits)if(Date.now()-v.at>900000)limits.delete(k);for(const [k,v]of loginFailures)if(Date.now()-v.at>900000)loginFailures.delete(k);for(const[k,v]of sessions)if(v.expires<Date.now())sessions.delete(k)},60000).unref();
app.use('/api',(req,res,next)=>{if(!['GET','HEAD'].includes(req.method)&&req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Invalid origin'});next()});
const auth=(req,res,next)=>{const token=req.headers.cookie?.split('; ').find(x=>x.startsWith('hugos_session='))?.slice(14);const session=token&&sessions.get(token);const user=session&&session.expires>Date.now()&&users.get(session.userId);if(!user||!user.active){if(token)sessions.delete(token);return res.status(401).json({error:'Please sign in'})}req.token=token;req.user=user;next()};
// Lets a request through only when the signed-in user's role allows it.
const can=permission=>(req,res,next)=>req.user.permissions.includes(permission)?next():res.status(403).json({error:'Your role does not allow this. Ask an owner for access.'});
registerImageSizes(app,{imagesDir:resolve(production?'dist/images':'public/images'),uploadsDir:resolve(process.env.DATA_DIR||'data','uploads'),cacheDir:resolve(process.env.DATA_DIR||'data','image-cache')});
registerMedia(app,[auth,can('content')]);
app.get('/robots.txt',(req,res)=>res.type('text/plain').send('User-agent: *\nAllow: /\nSitemap: '+(process.env.SITE_URL||'https://www.tanzaniahugossafaris.com')+'/sitemap.xml'));
app.get('/sitemap.xml',(req,res)=>{const c=getContent();const paths=knownPaths(c,staticPages).filter(p=>!['/privacy-policy','/terms','/refund-policy'].includes(p));res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>'+(process.env.SITE_URL||'https://www.tanzaniahugossafaris.com')+p+'</loc></url>').join('')+'</urlset>')});
const getRates=createRateService({file:`${process.env.DATA_DIR||'data'}/exchange-rates.json`});
app.get('/api/exchange-rates',async(req,res)=>{res.set('Cache-Control','public, max-age=3600');res.json(await getRates())});
const googleReviews=createGoogleReviews({file:`${process.env.DATA_DIR||'data'}/google-reviews.json`});
app.get('/api/google-reviews',async(req,res)=>{const data=await googleReviewsFor(getContent().googleReviews,googleReviews);res.set('Cache-Control',data.source==='none'?'no-store':'public, max-age=600');res.json(data)});
app.get('/api/admin/google-reviews',auth,can('content'),async(req,res)=>{const preview=await googleReviewsFor(getContent().googleReviews,googleReviews);res.json({...googleReviews.status(),preview})});
app.get('/api/kilimanjaro/comments',(req,res)=>{const rows=db.prepare('SELECT id,created,reply,value FROM comments WHERE published=1 ORDER BY created ASC LIMIT 100').all();res.json(rows.map(row=>{const value=JSON.parse(row.value);return{id:row.id,created:row.created,name:value.name,text:value.text,parentId:value.parentId||null,reply:row.reply}}))});
app.post('/api/kilimanjaro/comments',limited,(req,res)=>{const b=req.body;if(b.website)return res.status(400).json({error:'Invalid submission'});if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>100||typeof b.email!=='string'||b.email.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)||typeof b.text!=='string'||b.text.trim().length<3||b.text.trim().length>1500)return res.status(400).json({error:'Please enter your name, a valid email address and a comment.'});let parentId=null;if(b.parentId){const parent=db.prepare('SELECT id FROM comments WHERE id=? AND published=1').get(b.parentId);if(!parent)return res.status(400).json({error:'The comment you are replying to is no longer available.'});parentId=parent.id}const id='CMT-'+randomUUID().slice(0,8).toUpperCase();const created=new Date().toISOString();const value={name:b.name.trim(),email:b.email.trim().toLowerCase(),text:b.text.trim(),parentId};db.prepare('INSERT INTO comments(id,created,status,published,reply,value) VALUES(?,?,?,?,?,?)').run(id,created,'New',1,'',JSON.stringify(value));res.status(201).json({id,message:'Thank you! Your comment is now live.',comment:{id,created,name:value.name,text:value.text,parentId,reply:''}})});
app.get('/api/admin/comments',auth,can('comments'),(req,res)=>{const rows=db.prepare('SELECT * FROM comments ORDER BY created DESC').all();res.json(rows.map(row=>({...JSON.parse(row.value),id:row.id,created:row.created,status:row.status,published:!!row.published,reply:row.reply})))});
app.patch('/api/admin/comments/:id',auth,can('comments'),(req,res)=>{const current=db.prepare('SELECT id FROM comments WHERE id=?').get(req.params.id);if(!current)return res.status(404).json({error:'Comment not found'});const reply=typeof req.body.reply==='string'?req.body.reply.trim():'';const published=req.body.published===true?1:0;if(reply.length>2000)return res.status(400).json({error:'Reply is too long'});db.prepare('UPDATE comments SET status=?,published=?,reply=? WHERE id=?').run(published?'Published':'Reviewed',published,reply,req.params.id);res.json({ok:true})});
app.get('/api/content',(req,res)=>{const c=getContent();res.json({...c,packages:c.packages.filter(p=>p.published),articles:c.articles.filter(a=>a.published),blogPosts:(c.blogPosts||[]).filter(post=>post.published),photoSizes:uploadedPhotoSizes()})});
app.get('/api/admin/content',auth,(req,res)=>res.json(getContent()));
app.post('/api/login',async(req,res,next)=>{const now=Date.now(),key=req.ip,hit=loginFailures.get(key);if(hit&&now-hit.at<900000&&hit.count>=5){res.set('Retry-After',String(Math.ceil((900000-(now-hit.at))/1000)));return res.status(429).json({error:'Too many attempts. Please try again later.'})}if(activeLogins>=4)return res.status(429).json({error:'Too many attempts. Please try again later.'});activeLogins++;try{const submitted=typeof req.body?.password==='string'&&req.body.password.length<=200?req.body.password:'';const name=typeof req.body?.username==='string'&&req.body.username.length<=200?req.body.username:'';const user=await users.verify(name,submitted);if(!submitted||!name||!user){loginFailures.set(key,{at:hit&&now-hit.at<900000?hit.at:now,count:hit&&now-hit.at<900000?hit.count+1:1});return res.status(401).json({error:'Incorrect username or password.'})}loginFailures.delete(key);const token=randomBytes(32).toString('hex');sessions.set(token,{userId:user.id,expires:Date.now()+28800000});res.setHeader('Set-Cookie',`hugos_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${production?'; Secure':''}`);res.json({ok:true,user})}catch(error){next(error)}finally{activeLogins--}});
app.get('/api/admin/session',auth,(req,res)=>res.json({ok:true,user:req.user}));
// Your own account: change your name, username or password (your current password is always required).
app.patch('/api/admin/account',auth,async(req,res,next)=>{try{const b=req.body||{};if(!(await users.verify(req.user.username,b.currentPassword)))return res.status(400).json({error:'Your current password is not correct.'});const changes={};if(b.name!==undefined)changes.name=b.name;if(b.username!==undefined)changes.username=b.username;if(b.newPassword)changes.password=b.newPassword;const result=await users.update(req.user.id,changes);if(result.error)return res.status(400).json({error:result.error});if(changes.password)endSessions(req.user.id,req.token);res.json({user:result.user})}catch(error){next(error)}});
// Owners manage the people who can sign in, and their roles.
app.get('/api/admin/users',auth,can('users'),(req,res)=>res.json({users:users.list(),roles:Object.fromEntries(Object.entries(roles).map(([id,role])=>[id,role.label]))}));
app.post('/api/admin/users',auth,can('users'),async(req,res,next)=>{try{const result=await users.create(req.body||{});if(result.error)return res.status(400).json({error:result.error});res.status(201).json({user:result.user})}catch(error){next(error)}});
app.patch('/api/admin/users/:id',auth,can('users'),async(req,res,next)=>{try{const b=req.body||{};const changes={};for(const key of ['username','name','role','active','password'])if(b[key]!==undefined&&b[key]!=='')changes[key]=b[key];const result=await users.update(req.params.id,changes);if(result.error)return res.status(result.status||400).json({error:result.error});if(changes.password||changes.role||changes.active===false)endSessions(req.params.id,req.params.id===req.user.id?req.token:undefined);res.json({user:result.user})}catch(error){next(error)}});
app.delete('/api/admin/users/:id',auth,can('users'),(req,res)=>{if(req.params.id===req.user.id)return res.status(400).json({error:'You can’t delete your own account.'});const result=users.remove(req.params.id);if(result.error)return res.status(result.status||400).json({error:result.error});endSessions(req.params.id);res.json({ok:true})});
app.post('/api/logout',auth,(req,res)=>{sessions.delete(req.token);res.setHeader('Set-Cookie',`hugos_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production?'; Secure':''}`);res.json({ok:true})});
app.use('/api/content',(req,res,next)=>{if(req.method==='PUT'){const error=(req.body.announcements!==undefined&&announcementError(req.body.announcements))||googleSettingsError(req.body.googleReviews)||blogError(req.body.blogPosts);if(error)return res.status(400).json({error});}next()});
app.use('/api/content',(req,res,next)=>{if(req.method==='PUT'){const routes=req.body.kilimanjaroRoutes;if(!Array.isArray(routes)||routes.length!==5||new Set(routes.map(route=>route?.slug)).size!==5||routes.some(route=>!route||typeof route.name!=='string'||!route.name.trim()||typeof route.overview!=='string'||!route.overview.trim()||!Number.isInteger(route.days)||route.days<1||route.days>30||!Number.isFinite(route.price)||route.price<0||!Array.isArray(route.itinerary)||!route.itinerary.length||route.itinerary.some(day=>typeof day!=='string'||!day.trim()||day.length>1000)))return res.status(400).json({error:'Each Kilimanjaro route needs an overview, duration, valid price and day-by-day itinerary.'});}next()});
app.put('/api/content',auth,can('content'),(req,res)=>{const c=req.body;if(c.routeCardImages!==undefined&&(!c.routeCardImages||typeof c.routeCardImages!=='object'||Array.isArray(c.routeCardImages)||Object.entries(c.routeCardImages).some(([slug,image])=>!['machame','lemosho','marangu','northern-circuit','rongai','umbwe'].includes(slug)||typeof image!=='string'||(image&&!/^(?:[a-zA-Z0-9_-]+\.(?:webp|png|jpg|jpeg)|uploads\/[a-f0-9-]+\.webp)$/.test(image)))))return res.status(400).json({error:'Each Kilimanjaro route card photo must be chosen from your photo library.'});if(!validPartners(c.partners))return res.status(400).json({error:'Partners need a name and a valid logo (up to 24).'});if(!validShowcaseLinks(c.showcaseLinks))return res.status(400).json({error:'Add up to 12 links, each with a valid website URL.'});if(c.heroSlides!==undefined&&(!Array.isArray(c.heroSlides)||c.heroSlides.length<1||c.heroSlides.length>12||new Set(c.heroSlides.map(s=>s?.id)).size!==c.heroSlides.length||c.heroSlides.some(s=>!s||typeof s.id!=='string'||!s.id||s.id.length>120||[['label',120],['title',500],['description',2000],['place',200]].some(([key,max])=>typeof s[key]!=='string'||s[key].length>max)||(s.duration!==undefined&&(typeof s.duration!=="number"||!Number.isFinite(s.duration)||s.duration<1||s.duration>120))||!s.title.trim()||typeof s.image!=='string'||! /^(?:[a-zA-Z0-9_-]+\.(?:webp|png|jpg)|uploads\/[a-f0-9-]+\.webp)$/.test(s.image))))return res.status(400).json({error:'Each slideshow needs 1–12 slides with a headline, a valid photo, and a display time between 1 and 120 seconds.'});if(c.translations&&(typeof c.translations!=='object'||Array.isArray(c.translations)||Object.entries(c.translations).some(([lang,entries])=>!['fr','de','es'].includes(lang)||!entries||typeof entries!=='object'||Array.isArray(entries)||Object.values(entries).some(value=>typeof value!=='string'||value.length>10000))))return res.status(400).json({error:'Invalid translations'});if(!validHome(c.home))return res.status(400).json({error:'Homepage: every tile needs a title and photo, every question needs text, and each trip group can feature up to 3 trips.'});if(!Array.isArray(c.packages)||!Array.isArray(c.articles)||!Array.isArray(c.reviews)||typeof c.heroTitle!=='string')return res.status(400).json({error:'Invalid content'});if(c.packages.some(p=>!p.id||!p.name||!categories.slice(1).includes(p.category)||!Number.isFinite(Number(p.price))||Number(p.price)<0||!Array.isArray(p.itinerary)))return res.status(400).json({error:'Invalid package details'});saveContent(c);res.json({ok:true})});
app.post('/api/enquiries',limited,(req,res)=>{const b=req.body;if(b.website)return res.status(400).json({error:'Invalid submission'});if(typeof b.name!=='string'||!b.name.trim()||typeof b.email!=='string'||typeof b.arrival!=='string'||typeof b.departure!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.arrival)||!/^\d{4}-\d{2}-\d{2}$/.test(b.departure)||!Number.isInteger(Number(b.adults))||!Number.isInteger(Number(b.children))||!/^\S+@\S+\.\S+$/.test(b.email||'')||!b.arrival||!b.departure||b.departure<b.arrival||Number(b.adults)<1||Number(b.children)<0||Object.values(b).some(v=>typeof v==='string'&&v.length>5000))return res.status(400).json({error:'Please check your name, email, dates and traveller details.'});const id='HUG-'+randomUUID().slice(0,8).toUpperCase();db.prepare('INSERT INTO enquiries VALUES (?,?,?,?)').run(id,new Date().toISOString(),'New',JSON.stringify(b));res.status(201).json({id});if(process.env.ENQUIRY_WEBHOOK_URL)fetch(process.env.ENQUIRY_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.ENQUIRY_WEBHOOK_SECRET?{Authorization:`Bearer ${process.env.ENQUIRY_WEBHOOK_SECRET}`}:{})},body:JSON.stringify({id,...b}),signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)console.error('Enquiry notification failed:',id,r.status)}).catch(()=>console.error('Enquiry notification failed:',id))});
app.get('/api/admin/enquiries',auth,can('enquiries'),(req,res)=>res.json(db.prepare('SELECT * FROM enquiries ORDER BY created DESC').all().map(r=>({...r,...JSON.parse(r.value),value:undefined}))));
app.patch('/api/admin/enquiries/:id',auth,can('enquiries'),(req,res)=>{if(!['New','Contacted','Quoted','Confirmed','Closed'].includes(req.body.status))return res.status(400).json({error:'Invalid status'});db.prepare('UPDATE enquiries SET status=? WHERE id=?').run(req.body.status,req.params.id);res.json({ok:true})});
app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found'}));
app.use((err,req,res,next)=>{if(req.path.startsWith('/api/')){console.error('API request failed:',req.path,err.message);return res.status(err.status||500).json({error:'Unable to process this request. Please check your details or try again.'})}next(err)});
// The built page shell, read once (and again only if the file changes).
let shell={mtime:0,html:''};
const indexTemplate=()=>{
  const candidates=[resolve('dist/index.html'),resolve('index.html')];
  const file=candidates.find(existsSync);
  if(!file)throw Error('No HTML entry point found in dist/ or the project root.');
  const mtime=statSync(file).mtimeMs;
  if(mtime!==shell.mtime)shell={mtime,html:readFileSync(file,'utf8')};
  return shell.html;
};
async function startServer(){
  if(production){
    for(const root of [resolve('dist'),resolve('public')].filter(existsSync)){
      app.use(express.static(root,{index:false,setHeaders(res,filePath){if(/\/assets\/.+-[a-zA-Z0-9_-]{8,}\.(?:js|css)$/.test(filePath))res.setHeader('Cache-Control','public, max-age=31536000, immutable');else if(/\/images\//.test(filePath))res.setHeader('Cache-Control','public, max-age=604800, stale-while-revalidate=86400');else if(/\/fonts\/[a-z]+-[A-Za-z0-9_-]{16,}\.woff2$/.test(filePath))res.setHeader('Cache-Control','public, max-age=31536000, immutable')}}));
    }
    if(existsSync(resolve('src')))app.use('/src',express.static(resolve('src')));
    app.get('/{*path}',(req,res)=>{const moved=redirectFor(req.path);if(moved)return res.redirect(301,moved+(req.url.includes('?')?req.url.slice(req.url.indexOf('?')):''));const content=getContent();const admin=/^\/admin(?:\/|$)/i.test(req.path);const found=admin||knownPaths(content,staticPages).includes(req.path);res.status(found?200:404).set('Cache-Control',admin?'no-store':'no-cache').type('html').send(renderPage(indexTemplate(),req.path,content,{...builtInSizes,...uploadedPhotoSizes()},found))})
  }else{const{createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares)}
  app.listen(process.env.PORT||3000,process.env.HOST||(production?'0.0.0.0':'127.0.0.1'),()=>console.log('Tanzania Hugos Safaris listening on port '+(process.env.PORT||3000)));
}
startServer().catch(error=>{console.error('Failed to start server:',error);process.exitCode=1});
