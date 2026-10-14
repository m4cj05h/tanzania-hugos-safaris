// Search-engine support: readable page content in the HTML (before JavaScript runs),
// permanent redirects from the old WordPress addresses, and which addresses really exist.
import {defaultKilimanjaroRoutes} from '../src/data.js';
import {getHome} from '../src/home-content.js';
import {categoryFAQs,formatPackageName,relatedTripLinks} from '../src/seo-content.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>String(s??'').replace(/\*\*?([^*]+)\*\*?/g,'$1');

export const categoryPaths={Safari:'/safaris','Day trip':'/day-trips',Zanzibar:'/zanzibar-tours',Kilimanjaro:'/kilimanjaro',Combination:'/combination-packages',AFCON:'/afcon-tanzania'};
const categoryNames={Safari:'Tanzania safaris','Day trip':'Day trips',Zanzibar:'Zanzibar holidays',Kilimanjaro:'Mountain climbs and treks',Combination:'Safari and beach combinations',AFCON:'AFCON 2027 travel'};
const destinations=['serengeti','ngorongoro','tarangire','lake-manyara'];
const routes=content=>defaultKilimanjaroRoutes.map(route=>({...route,...(content.kilimanjaroRoutes||[]).find(saved=>saved.slug===route.slug)}));
const published=content=>({
  packages:content.packages.filter(p=>p.published),
  articles:content.articles.filter(a=>a.published),
  posts:(content.blogPosts||[]).filter(p=>p.published).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),
});

// Old WordPress addresses, sent permanently to the matching new pages so their Google ranking carries over.
const oldPages={
  '/destination':'/safaris','/beach-excursions':'/zanzibar-tours','/zanzibar':'/zanzibar-tours','/trekking':'/kilimanjaro','/contact-us':'/contact','/tour':'/safaris','/review-rating':'/',
  '/destination/beach-excursions':'/zanzibar-tours','/destination/cultural-tours':'/packages/culture-tour','/destination/tanzania-day-trips':'/day-trips',
  '/destination/tanzania-wildlife-safaris':'/safaris','/destination/tours-and-safaris':'/safaris','/destination/trekking-safaris':'/kilimanjaro',
  '/tour/selous-game-reserve-safari':'/packages/selous-safari','/tour/climb-mount-meru-tanzania-4-day':'/packages/meru-climb-4-days',
  '/tour/climb-mount-meru-tanzania-3-days':'/packages/meru-climb-4-days','/tour/climb-mount-oldoinyo-lengai-trekking':'/packages/oldoinyo-lengai-trek',
  '/tour/zanzibar-tour-fukuchani-adventure-5-days-4-nights':'/packages/fukuchani-adventure','/tour/zanzibar-tour-kendwa-beach-escape-6-days-5-nights':'/packages/kendwa-beach',
  '/tour/zanzibar-tour-nungwi':'/packages/nungwi-beach','/tour/ngorongoro-crater-day-trip':'/packages/ngorongoro-day','/tour/lake-manyara-national-park-day-tour':'/packages/lake-manyara-day',
  '/tour/marangu-waterfall-day-trip':'/packages/marangu-waterfall-day','/tour/chemka-hot-spring-day-trip':'/packages/chemka-day','/tour/tarangire-national-park-day-tour':'/packages/tarangire-day',
  '/tour/tanzania-culture-tour-day-trip':'/packages/culture-tour','/tour/jozani-forest-and-dolphin-tour':'/packages/jozani-dolphin-tour','/tour/zanzibar-sunset-dhow-cruise':'/packages/zanzibar-dhow-cruise',
  '/tour/ngorongoro-crater-safari':'/packages/ngorongoro-crater','/tour/tanzania-classic-safari':'/packages/tanzania-classic','/tour/big-five-serengeti-luxury-safari':'/packages/big-five-luxury',
  '/tour/materuni-waterfall-day-trip':'/packages/materuni-day','/tour/ngorongoro-wild-camp-safari':'/packages/ngorongoro-wild-camp','/tour/wildebeest-migration-safari':'/packages/migration-safari',
  '/tour/day-elephant-safari-experience':'/packages/elephant-safari','/tour/lake-victoria-and-serengeti-safari':'/packages/lake-victoria-serengeti',
};
export function redirectFor(path){
  const clean=path.length>1?path.replace(/\/+$/,''):path;
  if(oldPages[clean.toLowerCase()])return oldPages[clean.toLowerCase()];
  const tour=clean.match(/^\/tour\/.*\b(lemosho|machame|rongai|marangu|umbwe)\b/i);
  if(tour)return '/kilimanjaro/routes/'+tour[1].toLowerCase();
  if(/^\/(tour|tour-type|destination)\//i.test(clean))return '/safaris';
  if(/^\/review-rating\//i.test(clean))return '/';
  if(/^\/enquiries\//i.test(clean))return '/plan-my-trip';
  if(/^\/elementor-hf\//i.test(clean))return '/';
  if(clean!==path&&clean)return clean;// drop a trailing slash
  return null;
}

// Every public address the site really serves (anything else is a 404).
export function knownPaths(content,staticPages){
  const {packages,articles,posts}=published(content);
  return [...Object.keys(staticPages),...packages.map(p=>'/packages/'+p.id),...articles.map(a=>'/travel-guide/'+a.id),
    ...posts.map(p=>'/blog/'+p.id),...destinations.map(d=>'/destinations/'+d),...routes(content).map(r=>'/kilimanjaro/routes/'+r.slug)];
}

const money=n=>n>0?'From US$'+Number(n).toLocaleString('en-US'):'Price on request';
const days=n=>n===1?'1 day':n+' days';
const tripList=list=>list.length?`<ul class="ssr-trips">${list.map(p=>`<li><a href="/packages/${escape(p.id)}"><small>${escape(days(p.days))}</small><strong>${escape(formatPackageName(p.name))}</strong><span>${escape(p.destinations||'Tanzania')}</span><b>${escape(money(p.price))}</b></a></li>`).join('')}</ul>`:'';
// A heading and list from an array or from one-item-per-line text (how the admin stores inclusions).
const bullets=(heading,items)=>{const list=(Array.isArray(items)?items:String(items||'').split('\n')).map(t=>String(t).trim()).filter(Boolean);return list.length?`<h2>${heading}</h2><ul>${list.map(t=>`<li>${escape(plain(t))}</li>`).join('')}</ul>`:''};
const paragraphs=text=>String(text||'').split(/\n\s*\n/).map(t=>t.trim()).filter(Boolean).map(t=>`<p>${escape(plain(t))}</p>`).join('');
const faqBlock=items=>items.length?`<section class="ssr-faq"><h2>Frequently asked questions</h2>${items.map(item=>`<details><summary>${escape(item.question)}</summary><p>${escape(item.answer)}</p></details>`).join('')}</section>`:'';
function relatedLinks(path,text,content){
  const links=relatedTripLinks(text,content,path);
  return links.length?`<h2>Related Tanzania trips and guides</h2><ul>${links.map(({href,label})=>`<li><a href="${escape(href)}">${escape(label)}</a></li>`).join('')}</ul>`:'';
}

// The main content of a page as simple HTML. The full design replaces it as soon as the app loads.
export function pageBody(path,content,[title,description]){
  const {packages,articles,posts}=published(content);
  const category=Object.entries(categoryPaths).find(([,p])=>p===path)?.[0];
  let main;
  if(path==='/'){
    const home=getHome(content);
    main=`<h1>Tanzania Safaris, Kilimanjaro Climbs &amp; Zanzibar Holidays</h1><p>${escape(home.intro?.text||description)}</p>`
      +Object.entries(categoryPaths).map(([name,href])=>{const list=packages.filter(p=>p.category===name).slice(0,8);return list.length?`<h2><a href="${href}">${escape(categoryNames[name])}</a></h2>${tripList(list)}`:''}).join('')
      +(posts.length?`<h2><a href="/blog">Stories from Tanzania</a></h2><ul>${posts.slice(0,6).map(p=>`<li><a href="/blog/${escape(p.id)}">${escape(p.title)}</a></li>`).join('')}</ul>`:'')
      +faqBlock(home.faqs||[]);
  }else if(category){
    main=`<h1>${escape(title)}</h1><p>${escape(description)}</p>${tripList(packages.filter(p=>p.category===category))}`;
    if(category==='Kilimanjaro')main+=`<h2>Kilimanjaro routes</h2><ul>${routes(content).map(r=>`<li><a href="/kilimanjaro/routes/${escape(r.slug)}">${escape(r.name)}</a> <span>${escape(days(r.days))} · ${escape(money(r.price))}</span></li>`).join('')}</ul>`;
    main+=faqBlock(categoryFAQs(category,content));
  }else if(path.startsWith('/packages/')){
    const p=packages.find(item=>'/packages/'+item.id===path);
    main=`<p class="ssr-crumbs"><a href="/">Home</a> › <a href="${categoryPaths[p.category]||'/safaris'}">${escape(categoryNames[p.category]||'Safaris')}</a></p><h1>${escape(formatPackageName(p.name))}</h1>`
      +`<p><strong>${escape(days(p.days))}</strong> · ${escape(p.destinations||'Tanzania')} · ${escape(money(p.price))} per person</p>${paragraphs(p.description)}`
      +bullets('Highlights',p.highlights)
      +(p.itinerary?.length?`<h2>Itinerary</h2><ol>${p.itinerary.map(d=>`<li>${escape(typeof d==='string'?d:d.title||'')}</li>`).join('')}</ol>`:'')
      +(p.accommodation?`<h2>Accommodation</h2><p>${escape(p.accommodation)}</p>`:'')
      +bullets('What’s included',p.included)+bullets('What’s excluded',p.excluded)
      +(p.bestTime?`<h2>Best time to visit</h2><p>${escape(p.bestTime)}</p>`:'')
      +(()=>{const destinations=String(p.destinations||'').toLowerCase();const more=packages.filter(o=>o.id!==p.id).map(o=>({item:o,score:(o.category===p.category?1:0)+String(o.destinations||'').split(/\s*[·,]\s*/).filter(place=>place&&destinations.includes(place.toLowerCase())).length})).filter(entry=>entry.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(entry=>entry.item);return more.length?`<h2>You might also love</h2>${tripList(more)}`:''})()
      +faqBlock(getHome(content).faqs||[])
      +relatedLinks(path,`${p.name} ${p.destinations||''}`,content)
      +`<p><a href="/plan-my-trip?package=${escape(p.id)}">Request a free quote for this trip</a></p>`;
  }else if(path.startsWith('/kilimanjaro/routes/')){
    const r=routes(content).find(item=>'/kilimanjaro/routes/'+item.slug===path);
    main=`<p class="ssr-crumbs"><a href="/">Home</a> › <a href="/kilimanjaro">Kilimanjaro</a></p><h1>${escape(r.name)} – Kilimanjaro climb</h1><p><strong>${escape(days(r.days))}</strong> · ${escape(money(r.price))} per person</p>${paragraphs(r.overview)}`
      +(r.itinerary?.length?`<h2>Day by day</h2><ol>${r.itinerary.map(d=>`<li>${escape(d)}</li>`).join('')}</ol>`:'')
      +`<p><a href="/plan-my-trip?route=${escape(r.slug)}">Request a free quote for this climb</a></p>`;
  }else if(path==='/blog'){
    main=`<h1>Tanzania Travel Blog</h1><p>${escape(description)}</p><ul>${posts.map(p=>`<li><a href="/blog/${escape(p.id)}"><strong>${escape(p.title)}</strong></a>${p.summary?` <span>${escape(p.summary)}</span>`:''}</li>`).join('')}</ul>`;
  }else if(path.startsWith('/blog/')){
    const post=posts.find(item=>'/blog/'+item.id===path);
    const blocks=Array.isArray(post.blocks)&&post.blocks.length?post.blocks:String(post.body||'').split(/\n\s*\n/).map(text=>({type:'paragraph',text}));
    main=`<p class="ssr-crumbs"><a href="/">Home</a> › <a href="/blog">Blog</a></p><h1>${escape(post.title)}</h1>${post.summary?`<p><em>${escape(post.summary)}</em></p>`:''}`
      +blocks.map(b=>b.type==='heading'?`<h2>${escape(b.text)}</h2>`:b.type==='quote'?`<blockquote>${escape(plain(b.text))}</blockquote>`:b.type==='image'?(b.caption?`<p><em>${escape(b.caption)}</em></p>`:''):`<p>${escape(plain(b.text))}</p>`).join('')
      +relatedLinks(path,`${post.title} ${post.summary||''} ${post.body||''}`,content);
  }else if(path==='/travel-guide'){
    main=`<h1>${escape(title)}</h1><p>${escape(description)}</p><ul>${articles.map(a=>`<li><a href="/travel-guide/${escape(a.id)}">${escape(a.title)}</a></li>`).join('')}</ul>`;
  }else if(path.startsWith('/travel-guide/')){
    const a=articles.find(item=>'/travel-guide/'+item.id===path);
    main=`<p class="ssr-crumbs"><a href="/">Home</a> › <a href="/travel-guide">Travel guide</a></p><h1>${escape(a.title)}</h1>${paragraphs(a.body)}${relatedLinks(path,`${a.title} ${a.body}`,content)}`;
  }else{
    main=`<h1>${escape(title)}</h1><p>${escape(description)}</p>`;
  }
  const nav=[['/safaris','Safaris'],['/kilimanjaro','Kilimanjaro'],['/zanzibar-tours','Zanzibar'],['/day-trips','Day trips'],['/blog','Blog'],['/about-us','About us'],['/contact','Contact'],['/plan-my-trip','Plan my trip']];
  return `<div class="ssr"><header class="ssr-head"><a href="/" class="ssr-brand"><img src="/images/logo.webp" alt="Tanzania Hugos Safaris" width="52" height="52"/><span><strong>TANZANIA</strong><small>Hugos Safaris</small></span></a><nav>${nav.slice(0,-1).map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}</nav><a href="/plan-my-trip" class="ssr-cta">Plan my trip</a></header>`
    +`<main class="ssr-main">${main}</main><footer class="ssr-foot"><p>Tanzania Hugos Safaris · Tanzania, East Africa · <a href="tel:+255680853664">+255 680 853 664</a> · <a href="mailto:tanzaniahugossafaris@gmail.com">tanzaniahugossafaris@gmail.com</a></p></footer></div>`;
}

// Structured data so search engines understand the business, trips, articles and page position.
export function structuredData(path,content,base,[title,description,image]){
  const {packages,articles,posts}=published(content);
  const organization={'@type':'Organization','@id':base+'/#organization',name:'Tanzania Hugos Safaris',url:base+'/',logo:base+'/images/logo.webp',
    email:'tanzaniahugossafaris@gmail.com',telephone:'+255680853664',areaServed:'Tanzania',
    sameAs:['https://www.instagram.com/tanzaniahugossafaris','https://www.facebook.com/tanzaniahugossafaris/','https://www.youtube.com/@TanzaniaHugosSafaris']};
  const graph=[organization];
  const makeBreadcrumbs=items=>({'@type':'BreadcrumbList',itemListElement:items.map(([name,url],index)=>({'@type':'ListItem',position:index+1,name,item:base+url}))});
  const category=Object.entries(categoryPaths).find(([,routePath])=>routePath===path)?.[0];
  const p=packages.find(item=>'/packages/'+item.id===path);
  const post=posts.find(item=>'/blog/'+item.id===path);
  const article=articles.find(item=>'/travel-guide/'+item.id===path);
  const route=path.match(/^\/kilimanjaro\/routes\/([a-z-]+)$/);
  const destination=path.match(/^\/destinations\/([a-z-]+)$/);
  if(path==='/')graph.push({'@type':'WebSite','@id':base+'/#website',url:base+'/',name:'Tanzania Hugos Safaris',publisher:{'@id':base+'/#organization'}});
  if(p){
    const trip={'@type':'TouristTrip',name:formatPackageName(p.name),description:plain(p.description),image:base+'/images/'+p.image,url:base+path,
      provider:{'@id':base+'/#organization'},touristType:p.category};
    if(p.itinerary?.length)trip.itinerary={'@type':'ItemList',numberOfItems:p.itinerary.length,itemListElement:p.itinerary.map((day,index)=>({'@type':'ListItem',position:index+1,name:typeof day==='string'?day:day.title||''}))};
    if(p.price>0)trip.offers={'@type':'Offer',price:p.price,priceCurrency:'USD',url:base+path};
    graph.push(trip);
  }
  if(post)graph.push({'@type':'BlogPosting',headline:post.title,description:plain(post.summary||post.body||''),image:base+'/images/'+post.image,
    ...(post.date?{datePublished:post.date}:{}),url:base+path,author:{'@type':'Organization',name:post.author||'Tanzania Hugos Safaris'},publisher:{'@id':base+'/#organization'}});
  if(article)graph.push({'@type':'Article',headline:article.title,description:plain(article.body||''),image:base+'/images/'+article.image,url:base+path,
    author:{'@type':'Organization',name:'Tanzania Hugos Safaris'},publisher:{'@id':base+'/#organization'}});
  if(route){
    const item=routes(content).find(value=>value.slug===route[1]);
    if(item)graph.push({'@type':'TouristTrip',name:`${item.name} ${item.days} Days Kilimanjaro Climb`,description:plain(item.overview),image:base+'/images/kilimanjaro-panorama.webp',url:base+path,
      provider:{'@id':base+'/#organization'},touristType:'Kilimanjaro climb',
      itinerary:{'@type':'ItemList',numberOfItems:item.itinerary.length,itemListElement:item.itinerary.map((day,index)=>({'@type':'ListItem',position:index+1,name:day}))},
      ...(item.price>0?{offers:{'@type':'Offer',price:item.price,priceCurrency:'USD',url:base+path}}:{})});
  }
  const crumbs=[['Home','/']];
  if(path!=='/'){
    if(p)crumbs.push([categoryNames[p.category]||'Safaris',categoryPaths[p.category]||'/safaris'],[formatPackageName(p.name),path]);
    else if(post)crumbs.push(['Blog','/blog'],[post.title,path]);
    else if(article)crumbs.push(['Travel guide','/travel-guide'],[article.title,path]);
    else if(route){const item=routes(content).find(value=>value.slug===route[1]);crumbs.push(['Kilimanjaro','/kilimanjaro'],[item?.name||title,path]);}
    else if(destination)crumbs.push(['Safaris','/safaris'],[title,path]);
    else if(category)crumbs.push([categoryNames[category]||title,path]);
    else crumbs.push([title,path]);
    graph.push(makeBreadcrumbs(crumbs));
  }
  const faqs=category?categoryFAQs(category,content):p||path==='/'?getHome(content).faqs||[]:[];
  if(faqs.length)graph.push({'@type':'FAQPage',mainEntity:faqs.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))});
  return {'@context':'https://schema.org','@graph':graph};
}
