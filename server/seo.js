import {getHeroSlides} from '../src/hero-slides.js';
import {defaultKilimanjaroRoutes} from '../src/data.js';
import {formatPackageName} from '../src/seo-content.js';
import {pageBody,structuredData} from './seo-pages.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shorten=(text,max=154)=>{
  const value=String(text||'').replace(/\s+/g,' ').trim();
  if(value.length<=max)return value;
  return value.slice(0,max-1).replace(/\s\S*$/,'').replace(/[.,;:!?-]+$/,'')+'…';
};
const duration=days=>`${days} ${days===1?'Day':'Days'}`;

export const staticPages={
  '/':['Tanzania Safaris, Kilimanjaro & Zanzibar','Plan a Tanzania safari, Kilimanjaro climb or Zanzibar holiday with Tanzania Hugos Safaris. Explore tours and request a personal quote.'],
  '/safaris':['Tanzania Safari Tours & Packages','Compare Tanzania safari packages for Serengeti, Ngorongoro, Tarangire, Mikumi and more. See trip details and request a personalised quote.'],
  '/day-trips':['Tanzania Day Trips & Excursions','Explore Tanzania day trips including Materuni Waterfall, Chemka Hot Springs, wildlife parks, culture tours and Zanzibar excursions.'],
  '/zanzibar-tours':['Zanzibar Tours & Beach Holidays','Explore Zanzibar beach stays, dhow cruises, Jozani Forest and dolphin tours. Compare published packages and request a personal quote.'],
  '/kilimanjaro':['Kilimanjaro Climb Routes & Packages','Compare Kilimanjaro routes, durations and itineraries with a Tanzania-based team. Ask about route availability and a personalised climb quote.'],
  '/afcon-tanzania':['AFCON Tanzania Travel Packages','Plan AFCON travel in Tanzania with airport pickups, match-day transfers and safari or Zanzibar extensions. Confirm dates and availability with the team.'],
  '/combination-packages':['Tanzania Safari & Zanzibar Packages','Combine a Tanzania safari with island time or a mountain adventure. Review published packages and request a trip plan for your dates.'],
  '/about-us':['About Tanzania Hugos Safaris','Learn about Tanzania Hugos Safaris, a Tanzania-based travel company offering safaris, Zanzibar holidays, Kilimanjaro climbs and custom journeys.'],
  '/contact':['Contact Tanzania Hugos Safaris','Contact Tanzania Hugos Safaris by WhatsApp, phone or email to ask about a trip, dates, availability or a written quotation.'],
  '/travel-guide':['Tanzania Travel Guide','Read Tanzania travel guides and practical planning notes for safaris, Kilimanjaro climbs and Zanzibar holidays.'],
  '/blog':['Tanzania Safari & Travel Blog','Read Tanzania safari stories, Kilimanjaro tips, Zanzibar ideas and travel notes from Tanzania Hugos Safaris.'],
  '/payment-options':['Tanzania Safari Payment Options','Learn how trip quotations, booking enquiries and confirmed payment instructions work before making a Tanzania travel booking.'],
  '/plan-my-trip':['Plan Your Tanzania Safari','Share your dates and interests to request a personalised Tanzania safari, Kilimanjaro or Zanzibar itinerary and quotation.'],
  '/privacy-policy':['Tanzania Hugos Safaris Privacy Notice','Read how Tanzania Hugos Safaris handles website enquiries and the personal details submitted when planning a trip.'],
  '/terms':['Tanzania Safari Booking Information','Review important information about quotations, trip availability, starting prices and confirmed bookings with Tanzania Hugos Safaris.'],
  '/refund-policy':['Tanzania Travel Cancellation & Refunds','Read where to request the cancellation and refund conditions that apply to your confirmed Tanzania travel booking.'],
};

export function metadata(path,content){
  const packages=content.packages||[];
  const p=packages.find(item=>item.published&&path==='/packages/'+item.id);
  const article=(content.articles||[]).find(item=>item.published&&path==='/travel-guide/'+item.id);
  const post=(content.blogPosts||[]).find(item=>item.published&&path==='/blog/'+item.id);
  if(p){
    const name=formatPackageName(p.name);
    const title=p.category==='Kilimanjaro'&&/machame/i.test(name)
      ?`Machame Route ${p.days} Days Kilimanjaro Climb`
      :`${name}${/, \d+ Days$/i.test(name)?'':`, ${duration(p.days)}`}`;
    return[title,shorten(p.description||`${name} in Tanzania. View trip details and request a personalised quotation.`),p.image];
  }
  if(post)return[post.title,shorten(post.summary||post.body||`Read ${post.title}, a Tanzania travel story from Tanzania Hugos Safaris.`),post.image];
  if(article)return[article.title,shorten(article.body||`Read this Tanzania travel guide from Tanzania Hugos Safaris: ${article.title}.`),article.image];
  if(path.startsWith('/destinations/')){
    const name=path.split('/').pop().split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
    return[`${name} Safari Tours`,shorten(`Explore ${name} in Tanzania. Compare related safari packages, itineraries and travel details from Tanzania Hugos Safaris.`),'safari.webp'];
  }
  const route=path.match(/^\/kilimanjaro\/routes\/([a-z-]+)$/);
  if(route){
    const item=[...(content.kilimanjaroRoutes||[]),...defaultKilimanjaroRoutes].find(value=>value.slug===route[1]);
    if(item)return[`${item.name} Route ${item.days}-Day Kilimanjaro Guide`,shorten(item.overview||`Compare the ${item.name} route, duration and itinerary for a Kilimanjaro climb.`),'kilimanjaro-panorama.webp'];
  }
  return staticPages[path]||['Tanzania Hugos Safaris','Explore Tanzania with Tanzania Hugos Safaris. Request a trip quotation.','hero.webp'];
}

export function titleTag(title){
  const suffix=' | Hugos Safaris';
  let text=String(title||'Tanzania Safaris').replace(/\s+/g,' ').trim();
  while(escape(`${text}${suffix}`).length>59){
    const shortened=text.slice(0,-1).replace(/\s+\S*$/,'').trim();
    text=shortened&&shortened!==text?shortened:text.slice(0,-1);
  }
  return `${text}${suffix}`;
}

function preloadImage(image,size){
  const src='/images/'+image;
  const width=size?.[0];
  const widths=width?[480,800,1200].filter(value=>value<width*0.9):[];
  return widths.length
    ?`<link rel="preload" as="image" href="${escape(src)}" imagesrcset="${escape([...widths.map(value=>`${src}?w=${value} ${value}w`),`${src} ${width}w`].join(', '))}" imagesizes="100vw" fetchpriority="high"/>`
    :`<link rel="preload" as="image" href="${escape(src)}" fetchpriority="high"/>`;
}

export function renderPage(html,path,content,photoSizes={},found=true){
  const[title,description,image='hero.webp']=metadata(path,content);
  const base=(process.env.SITE_URL||'https://tanzaniahugossafaris.com').replace(/\/$/,'');
  const canonical=base+(path==='/'?'/':path);
  const admin=/^\/admin(\/|$)/.test(path);
  const schema=found&&!admin?structuredData(path,content,base,[title,description,image]):null;
  const firstImage=path==='/'?getHeroSlides(content)[0]?.image:null;
  const preload=firstImage&&/^(?:[a-zA-Z0-9_-]+\.(?:webp|png|jpg)|uploads\/[a-f0-9-]+\.webp)$/.test(firstImage)
    ?preloadImage(firstImage,photoSizes[firstImage]):'';
  const brandedTitle=titleTag(title);
  const ogImage=base+'/images/'+image;
  const ogType=path.startsWith('/blog/')||path.startsWith('/travel-guide/')?'article':'website';
  const tags=`${preload}<link rel="canonical" href="${escape(canonical)}"/><meta property="og:title" content="${escape(brandedTitle)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:type" content="${ogType}"/><meta property="og:site_name" content="Tanzania Hugos Safaris"/><meta property="og:url" content="${escape(canonical)}"/><meta property="og:image" content="${escape(ogImage)}"/><meta property="og:image:alt" content="${escape(title)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escape(brandedTitle)}"/><meta name="twitter:description" content="${escape(description)}"/><meta name="twitter:image" content="${escape(ogImage)}"/><meta name="robots" content="${!found||admin?'noindex,nofollow':'index,follow,max-image-preview:large'}"/>${schema?`<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`:''}`;
  return html.replace(/<title>.*?<\/title>/,`<title>${escape(brandedTitle)}</title>`)
    .replace(/<meta name="description"[^>]*\/?>/,`<meta name="description" content="${escape(description)}"/>`)
    .replace('</head>',`${tags}</head>`)
    .replace('<div id="root"></div>',`<div id="root">${found&&!/^\/admin(\/|$)/.test(path)?pageBody(path,content,[title,description]):''}</div>`);
}
