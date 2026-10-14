import{test,before,after}from'node:test';import assert from'node:assert/strict';import{spawn}from'node:child_process';import{mkdtempSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';
const dir=mkdtempSync(join(tmpdir(),'hugos-test-'));const base='http://127.0.0.1:3197';let server;let cookie;
before(async()=>{server=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'production',PORT:'3197',ADMIN_USERNAME:'Integration-Admin',ADMIN_PASSWORD:'integration-test-password',DATA_DIR:dir},stdio:'pipe'});for(let i=0;i<100;i++){try{if((await fetch(base+'/api/content')).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Test server did not start')});
after(async()=>{if(server&&server.exitCode===null&&server.signalCode===null){const exited=new Promise(resolve=>server.once('exit',resolve));server.kill();await exited}rmSync(dir,{recursive:true,force:true})});
const post=(path,data,headers={})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
test('public content is seeded; admin inbox rejects anonymous users',async()=>{assert.equal((await(await fetch(base+'/api/content')).json()).packages.length,37);assert.equal((await fetch(base+'/api/admin/enquiries')).status,401)});
test('invalid and cross-origin submissions are rejected',async()=>{assert.equal((await post('/api/enquiries',{name:'A'})).status,400);assert.equal((await post('/api/login',{password:'bad'})).status,401);assert.equal((await post('/api/enquiries',{}, {Origin:'https://untrusted.example'})).status,403)});
test('admin publishes content and enquiry can be managed',async()=>{const login=await post('/api/login',{username:'integration-admin',password:'integration-test-password'});assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);cookie=login.headers.get('set-cookie').split(';')[0];const c=await(await fetch(base+'/api/content')).json();c.heroTitle='A published headline';const published=await fetch(base+'/api/content',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(c)});assert.equal(published.status,200);assert.equal((await(await fetch(base+'/api/content')).json()).heroTitle,c.heroTitle);const submitted=await post('/api/enquiries',{name:'Integration Traveller',email:'traveller@example.com',arrival:'2027-06-01',departure:'2027-06-08',adults:2,children:0});assert.equal(submitted.status,201);const{id}=await submitted.json();assert.match(id,/^HUG-/);const inbox=await(await fetch(base+'/api/admin/enquiries',{headers:{Cookie:cookie}})).json();assert.equal(inbox[0].id,id);assert.equal(inbox[0].email,'traveller@example.com');const update=await fetch(base+'/api/admin/enquiries/'+id,{method:'PATCH',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({status:'Quoted'})});assert.equal(update.status,200);assert.equal((await(await fetch(base+'/api/admin/enquiries',{headers:{Cookie:cookie}})).json())[0].status,'Quoted');await post('/api/logout',{}, {Cookie:cookie});assert.equal((await fetch(base+'/api/admin/enquiries',{headers:{Cookie:cookie}})).status,401)});
test('production homepage contains title, description, canonical and JSON-LD',async()=>{
 const response=await fetch(base+'/');
 assert.equal(response.status,200);
 const html=await response.text();
 assert.match(html,/<title>[^<]+<\/title>/);
 assert.match(html,/<meta name="description" content="[^"]+"/);
 assert.match(html,/<link rel="canonical" href="https:\/\/tanzaniahugossafaris\.com\/"/);
 const schema=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 assert.ok(schema);
 const graph=JSON.parse(schema[1])['@graph'];
 assert.ok(graph.some(item=>item['@type']==='Organization'));
 assert.ok(graph.some(item=>item['@type']==='WebSite'));
});
test('published pages have unique, length-limited metadata and correct schema',async()=>{
 const sitemap=await(await fetch(base+'/sitemap.xml')).text();
 assert.match(sitemap,/packages\/mikumi-safari/);
 const paths=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([,url])=>new URL(url).pathname);
 const titles=[],descriptions=[];
 for(const path of paths){
  const response=await fetch(base+path);
  assert.equal(response.status,200,path);
  const html=await response.text();
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(title,path);assert.ok(description,path);assert.ok(canonical,path);
  assert.ok(title.length<60,`${path} title exceeds 59 characters`);
  assert.ok(description.length<155,`${path} description exceeds 154 characters`);
  assert.equal(new URL(canonical).pathname,path);
  assert.equal([...html.matchAll(/<h1\b/g)].length,1,`${path} should have exactly one H1`);
  titles.push(title);descriptions.push(description);
  if(path==='/packages/mikumi-safari')assert.match(html,/application\/ld\+json/);
  if(path==='/safaris'){
   const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
   assert.ok(schema['@graph'].some(item=>item['@type']==='FAQPage'));
   assert.match(html,/Frequently asked questions/);
  }
  if(path==='/kilimanjaro'){
   const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
   const faq=schema['@graph'].find(item=>item['@type']==='FAQPage');
   const questions=[...html.matchAll(/<details><summary>(.*?)<\/summary><p>.*?<\/p><\/details>/g)].map(([,question])=>question);
   assert.equal(faq.mainEntity.length,5);
   assert.deepEqual(faq.mainEntity.map(item=>item.name),questions);
  }
 }
 assert.equal(new Set(titles).size,titles.length,'every indexed route should have a unique title');
 assert.equal(new Set(descriptions).size,descriptions.length,'every indexed route should have a unique description');
});
test('named photo uploads and safe deletion',async()=>{
  const sharp=(await import('sharp')).default;
  const login=await post('/api/login',{username:'integration-admin',password:'integration-test-password'});
  const headers={Cookie:login.headers.get('set-cookie').split(';')[0]};
  const image=await sharp({create:{width:20,height:20,channels:3,background:'#dd8800'}}).png().toBuffer();
  const uploaded=await fetch(base+'/api/admin/media',{method:'POST',headers:{...headers,'Content-Type':'image/png','X-File-Name':encodeURIComponent('Serengeti sunset')},body:image});
  assert.equal(uploaded.status,201);
  const photo=await uploaded.json();assert.equal(photo.name,'Serengeti sunset');
  const path='/api/admin/media/'+encodeURIComponent(photo.id);
  assert.equal((await fetch(base+path,{method:'DELETE'})).status,401);
  const content=await(await fetch(base+'/api/admin/content',{headers})).json();
  const original=content.packages[0].image;content.packages[0].image=photo.id;
  const publish=()=>fetch(base+'/api/content',{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(content)});
  assert.equal((await publish()).status,200);
  assert.equal((await fetch(base+path,{method:'DELETE',headers})).status,409);
  content.packages[0].image=original;assert.equal((await publish()).status,200);
  assert.equal((await fetch(base+path,{method:'DELETE',headers})).status,200);
  const photos=await(await fetch(base+'/api/admin/media',{headers})).json();assert.ok(!photos.some(p=>p.id===photo.id));
  const {existsSync}=await import('node:fs');assert.equal(existsSync(join(dir,photo.id)),false);
  assert.equal((await fetch(base+path,{method:'DELETE',headers})).status,404);
  assert.equal((await fetch(base+'/api/admin/media/logo.webp',{method:'DELETE',headers})).status,200);
  const remaining=await(await fetch(base+'/api/admin/media',{headers})).json();assert.ok(!remaining.some(p=>p.id==='logo.webp'));
  assert.equal((await fetch(base+'/images/logo.webp')).status,200);
  assert.equal((await fetch(base+'/api/admin/media/'+encodeURIComponent('uploads/../../secret.webp'),{method:'DELETE',headers})).status,400);
});
test('homepage slides can be published, reordered and validated',async()=>{
 const login=await post('/api/login',{username:'integration-admin',password:'integration-test-password'});
 const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json'};
 const content=await(await fetch(base+'/api/admin/content',{headers})).json();
 const {getHeroSlides}=await import('../src/hero-slides.js');
 const defaults=getHeroSlides(content);assert.equal(defaults.length,4);assert.equal(defaults[1].image,'zanzibar.webp');
 content.heroSlides=[{...defaults[1],title:'Our island escape',description:'Updated introduction'},defaults[0]];
 const publish=()=>fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify(content)});
 assert.equal((await publish()).status,200);
 const saved=await(await fetch(base+'/api/content')).json();assert.deepEqual(getHeroSlides(saved),content.heroSlides);
 content.heroSlides=[];assert.equal((await publish()).status,400);
 content.heroSlides=[{...defaults[0],image:'../secret'}];assert.equal((await publish()).status,400);
 content.heroSlides=[defaults[0],defaults[0]];assert.equal((await publish()).status,400);
 content.heroSlides=[{...defaults[0],title:''}];assert.equal((await publish()).status,400);
 content.heroSlides=[defaults[0]];assert.equal((await publish()).status,200);
});
test('partner logos can be reordered, replaced, and removed through published content',async()=>{
 const login=await post('/api/login',{username:'integration-admin',password:'integration-test-password'});
 const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json'};
 const content=await(await fetch(base+'/api/admin/content',{headers})).json();
 assert.equal(content.partners.length,8);
 content.partners=[content.partners[1],content.partners[0],{id:'new-partner',name:'New partner',image:'partners/yas.webp'}];
 const publish=()=>fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify(content)});
 assert.equal((await publish()).status,200);
 assert.deepEqual((await(await fetch(base+'/api/content')).json()).partners,content.partners);
 content.partners[2].image='../secret';assert.equal((await publish()).status,400);
 content.partners[2].image='partners/yas.webp';content.partners[2].name='';assert.equal((await publish()).status,400);
 content.partners=[];assert.equal((await publish()).status,200);
 assert.deepEqual((await(await fetch(base+'/api/content')).json()).partners,[]);
});
test('admin can publish homepage links without titles and unsafe URLs are rejected',async()=>{
 const login=await post('/api/login',{username:'integration-admin',password:'integration-test-password'});
 const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json'};
 const content=await(await fetch(base+'/api/admin/content',{headers})).json();
 assert.deepEqual(content.showcaseLinks,[]);
 content.showcaseLinks=[{id:'first-link',title:'Explore our travel films',url:'https://example.com/films'}];
 const publish=()=>fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify(content)});
 assert.equal((await publish()).status,200);
 assert.deepEqual((await(await fetch(base+'/api/content')).json()).showcaseLinks,content.showcaseLinks);
 content.showcaseLinks[0].url='javascript:alert(1)';assert.equal((await publish()).status,400);
 content.showcaseLinks[0].url='https://example.com/films';content.showcaseLinks[0].title='';assert.equal((await publish()).status,200);
});
test('YouTube links resolve to safe video embeds',async()=>{
 const {getYouTubeEmbed}=await import('../src/showcase-links.js');
 const embed='https://www.youtube.com/embed/M7lc1UVf-VE?playsinline=1';
 assert.equal(getYouTubeEmbed('https://youtu.be/M7lc1UVf-VE?si=example'),embed);
 assert.equal(getYouTubeEmbed('https://www.youtube.com/watch?v=M7lc1UVf-VE'),embed);
 assert.equal(getYouTubeEmbed('https://www.youtube.com/shorts/M7lc1UVf-VE'),embed);
 assert.equal(getYouTubeEmbed('https://youtube.com.evil.example/watch?v=M7lc1UVf-VE'),null);
 assert.equal(getYouTubeEmbed('javascript:alert(1)'),null);
});
test('group departures accept safari and Zanzibar trip types',async()=>{
 const login=await post('/api/login',{username:'integration-admin',password:'integration-test-password'});
 const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json'};
 const content=await(await fetch(base+'/api/admin/content',{headers})).json();
 const departure={id:'d1',route:'Serengeti group safari',days:4,startDate:'2027-07-01',endDate:'2027-07-04',price:1200,deposit:100,features:'Guided group safari',published:true};
 const publish=announcements=>fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({...content,announcements})});
 assert.equal((await publish([{...departure,trip:'Safari'},{...departure,id:'d2',trip:'Zanzibar'},{...departure,id:'d3'}])).status,200);
 assert.deepEqual((await(await fetch(base+'/api/content')).json()).announcements.map(item=>item.trip),['Safari','Zanzibar',undefined]);
 assert.equal((await publish([{...departure,trip:'Moon'}])).status,400);
 const blogPost={id:'summit-day',title:'Summit day',category:'Trip report',author:'Hugo',date:'2026-09-30',image:'mountain.webp',summary:'Sunrise over Mawenzi.',body:'We left at midnight.',published:true};
 assert.equal((await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({...content,blogPosts:[blogPost,{...blogPost,id:'draft-post',published:false}]})})).status,200);
 assert.deepEqual((await(await fetch(base+'/api/content')).json()).blogPosts.map(p=>p.id),['summit-day']);
 assert.match(await(await fetch(base+'/blog/summit-day')).text(),/<title>Summit day \| Hugos Safaris/);
 assert.match(await(await fetch(base+'/sitemap.xml')).text(),/\/blog\/summit-day/);
 assert.doesNotMatch(await(await fetch(base+'/sitemap.xml')).text(),/draft-post/);
 assert.equal((await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({...content,blogPosts:[{...blogPost,date:'yesterday'}]})})).status,400);
 const putContent=extra=>fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({...content,...extra})});
 assert.equal((await putContent({routeCardImages:{machame:'trip-meru-summit.webp','northern-circuit':''}})).status,200);
 assert.equal((await(await fetch(base+'/api/content')).json()).routeCardImages.machame,'trip-meru-summit.webp');
 assert.equal((await putContent({routeCardImages:{machame:'../secret.webp'}})).status,400);
 assert.equal((await putContent({routeCardImages:{everest:'hero.webp'}})).status,400);
 assert.equal((await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({...content,googleReviews:{placeId:'bad id!'}})})).status,400);
 assert.equal((await fetch(base+'/api/content',{method:'PUT',headers,body:JSON.stringify({...content,googleReviews:{placeId:'',url:'https://maps.app.goo.gl/x',rating:4.9,count:37}})})).status,200);
 const typed=await(await fetch(base+'/api/google-reviews')).json();
 assert.deepEqual({source:typed.source,rating:typed.rating,count:typed.count,url:typed.url},{source:'manual',rating:4.9,count:37,url:'https://maps.app.goo.gl/x'});
 // With no Place ID typed, the reviews copied from the previous website still show, with their write-a-review link.
 assert.ok(typed.reviews.length>0);assert.match(typed.writeReviewUrl,/placeid=/);
 assert.equal((await publish([{...departure,features:'Guided group safari\nLodge stays',featureIcons:['jeep','hut']}])).status,200);
 assert.deepEqual((await(await fetch(base+'/api/content')).json()).announcements[0].featureIcons,['jeep','hut']);
 assert.equal((await publish([{...departure,featureIcons:['<b>']}])).status,400);
 const backwards=await publish([{...departure,startDate:'2026-10-12',endDate:'2026-10-02'}]);
 assert.equal(backwards.status,400);assert.match((await backwards.json()).error,/Serengeti group safari.*end date before its start date/);
});
test('admin sign-in needs the right username as well as the password',async()=>{
 assert.equal((await post('/api/login',{password:'integration-test-password'})).status,401);
 const wrong=await post('/api/login',{username:'someone-else',password:'integration-test-password'});assert.equal(wrong.status,401);assert.match((await wrong.json()).error,/username or password/);
 // The username ignores capitals and spaces; a successful sign-in also clears earlier failures.
 assert.equal((await post('/api/login',{username:' Integration-Admin ',password:'integration-test-password'})).status,200)});
test('owners add users with roles, and each role only reaches its own areas',async()=>{
 const json={'Content-Type':'application/json'};
 const signIn=async(username,password)=>{const r=await post('/api/login',{username,password});assert.equal(r.status,200,username);return {Cookie:r.headers.get('set-cookie').split(';')[0],...json}};
 const call=(method,path,headers,body)=>fetch(base+path,{method,headers,body:body&&JSON.stringify(body)});
 const owner=await signIn('integration-admin','integration-test-password');
 assert.equal((await(await call('GET','/api/admin/session',owner)).json()).user.role,'owner');
 // Adding users
 assert.equal((await call('POST','/api/admin/users',owner,{username:'Bad Name!',name:'X',role:'editor',password:'long-enough-pass'})).status,400);
 assert.equal((await call('POST','/api/admin/users',owner,{username:'amina',name:'Amina',role:'editor',password:'short'})).status,400);
 const editorUser=(await(await call('POST','/api/admin/users',owner,{username:'Amina',name:'Amina',role:'editor',password:'editor-password-1'})).json()).user;
 assert.equal(editorUser.username,'amina');
 assert.equal((await call('POST','/api/admin/users',owner,{username:'amina',name:'Twin',role:'sales',password:'another-password'})).status,400);
 const salesUser=(await(await call('POST','/api/admin/users',owner,{username:'baraka',name:'Baraka',role:'sales',password:'sales-password-1'})).json()).user;
 // A content editor edits the website but can't see enquiries or users
 const editor=await signIn('amina','editor-password-1');
 assert.equal((await call('GET','/api/admin/enquiries',editor)).status,403);
 assert.equal((await call('GET','/api/admin/users',editor)).status,403);
 assert.equal((await call('GET','/api/admin/comments',editor)).status,200);
 assert.equal((await call('GET','/api/admin/media',editor)).status,200);
 // Sales sees enquiries and comments, but can't change website content or photos
 const sales=await signIn('baraka','sales-password-1');
 assert.equal((await call('GET','/api/admin/enquiries',sales)).status,200);
 const content=await(await call('GET','/api/admin/content',sales)).json();
 assert.equal((await call('PUT','/api/content',sales,content)).status,403);
 assert.equal((await call('GET','/api/admin/media',sales)).status,403);
 // Changing your own password needs the current one, and keeps you signed in
 assert.equal((await call('PATCH','/api/admin/account',sales,{currentPassword:'wrong',newPassword:'new-sales-password'})).status,400);
 assert.equal((await call('PATCH','/api/admin/account',sales,{currentPassword:'sales-password-1',newPassword:'new-sales-password'})).status,200);
 assert.equal((await call('GET','/api/admin/session',sales)).status,200);
 await signIn('baraka','new-sales-password');
 // An owner resetting a password or deactivating someone signs them out
 assert.equal((await call('PATCH','/api/admin/users/'+editorUser.id,owner,{active:false})).status,200);
 assert.equal((await call('GET','/api/admin/session',editor)).status,401);
 assert.equal((await post('/api/login',{username:'amina',password:'editor-password-1'})).status,401);
 // There is always at least one active owner, and you can't delete yourself
 const me=(await(await call('GET','/api/admin/session',owner)).json()).user;
 assert.equal((await call('PATCH','/api/admin/users/'+me.id,owner,{role:'editor'})).status,400);
 assert.equal((await call('DELETE','/api/admin/users/'+me.id,owner)).status,400);
 assert.equal((await call('DELETE','/api/admin/users/'+salesUser.id,owner)).status,200);
 assert.equal((await call('GET','/api/admin/session',sales)).status,401);
 // A successful sign-in clears the failed attempts above before the lockout test.
 await signIn('integration-admin','integration-test-password')});
test('admin indexing hints are absent and repeated login failures are throttled',async()=>{
 const robots=await(await fetch(base+'/robots.txt')).text();
 assert.doesNotMatch(robots,/\/admin|\/api/);
 const admin=await fetch(base+'/admin');
 assert.match(admin.headers.get('x-robots-tag'),/noindex/);
 assert.match(admin.headers.get('cache-control'),/no-store/);
 assert.match(admin.headers.get('content-security-policy'),/script-src 'self'/);
 assert.match((await fetch(base+'/api/admin/content')).headers.get('x-robots-tag'),/noindex/);
 for(let i=0;i<5;i++)assert.equal((await post('/api/login',{password:'wrong-password'})).status,401);
 const blocked=await post('/api/login',{username:'integration-admin',password:'integration-test-password'});
 assert.equal(blocked.status,429);
 assert.ok(Number(blocked.headers.get('retry-after'))>0);
});
