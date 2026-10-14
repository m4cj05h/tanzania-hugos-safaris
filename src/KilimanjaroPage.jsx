import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, CalendarDays, Mountain, Plus, Tent, X, Clock, MapPin} from 'lucide-react';
import {h, Price} from './locale';
import ShowcaseSection from './ShowcaseSection';
import {getAnnouncements} from './announcements';
import DepartureBoard from './DepartureBoard';
import {photo,addPhotoSizes} from './images';

// The terrain and route layers must pick the same width so they stay aligned.
const mapSizes='(max-width: 700px) 92vw, 760px';

import KilimanjaroComments from './KilimanjaroComments';
import {defaultKilimanjaroRoutes} from './data';
import {categoryFAQs} from './seo-content';
import {TrekIcon,featureIcon} from './trekIcons';
import './kilimanjaro.css';

const routes = [
  {name:'Machame', slug:'machame', tag:'The scenic classic', approach:'Southern approach', stay:'Mountain camping', icon:Tent,
    description:'Forest trails, the open Shira Plateau and the dramatic Barranco Valley. A varied journey for those who want to experience the mountain’s changing landscapes.',
    stops:['Machame Camp', 'Shira 2', 'Barranco', 'Barafu', 'Uhuru Peak']},
  {name:'Lemosho', slug:'lemosho', tag:'Room to take it all in', approach:'Western approach', stay:'Mountain camping', icon:Tent,
    description:'A quieter beginning on the western slopes, opening onto the wide Shira Plateau. Ask our team for a longer itinerary shaped around your time and experience.',
    stops:['Shira 1', 'Shira 2', 'Barranco', 'Barafu', 'Uhuru Peak']},
  {name:'Marangu', slug:'marangu', tag:'The hut-based journey', approach:'South-eastern approach', stay:'Mountain huts', icon:Mountain,
    description:'A classic trail through forest and moorland toward Kibo, with hut accommodation along the way. We’ll help you discuss pacing, dates and hut availability.',
    stops:['Mandara', 'Horombo', 'Kibo', 'Uhuru Peak']},
  {name:'Northern Circuit', slug:'northern-circuit', tag:'The grand traverse', approach:'Western approach', stay:'Mountain camping', icon:Tent,
    description:'Kilimanjaro’s longest circuit sweeps across the quieter northern slopes. Its broad arc and unhurried rhythm make it an immersive way to experience the mountain.',
    stops:['Shira 1', 'Moir Hut', 'Buffalo Camp', 'School Hut', 'Uhuru Peak']},
  {name:'Rongai', slug:'rongai', tag:'The remote north', approach:'Northern approach', stay:'Mountain camping', icon:Tent,
    description:'Approach from the mountain’s remote northern side, passing caves and the jagged Mawenzi landscape before joining the final ascent toward Uhuru Peak.',
    stops:['Simba', 'Second Cave', 'Kikelewa', 'Mawenzi Tarn', 'Kibo', 'Uhuru Peak']},
  {name:'Umbwe', slug:'umbwe', tag:'The steep challenge', approach:'Southern approach', stay:'Mountain camping', icon:Tent,
    description:'A direct and demanding southern approach that rises quickly to Barranco. Best discussed with our team if you are experienced and considering careful acclimatisation plans.',
    stops:['Umbwe Camp', 'Barranco', 'Karanga', 'Barafu', 'Uhuru Peak']}
];

const routeAnimationPaths = {
  machame:'M 430 970 C 440 860 480 770 485 695 C 490 620 550 545 570 490 C 610 520 650 530 705 540 C 705 575 690 595 670 610 C 700 620 720 650 760 680 C 805 700 845 670 860 638 C 840 605 800 585 780 550 C 820 575 855 600 860 638 C 835 700 865 735 855 780 C 855 890 820 980 790 1060',
  lemosho:'M 155 277 C 250 270 335 280 390 315 C 390 385 450 455 565 490 C 620 520 660 530 705 540 C 705 575 690 595 670 610 C 700 620 720 650 760 680 C 805 700 845 670 860 638 C 840 605 800 585 780 550 C 820 575 855 600 860 638 C 835 700 865 735 855 780 C 855 890 820 980 790 1060',
  marangu:'M 1110 1090 C 1080 1010 1160 955 1145 885 C 1110 845 1045 825 995 792 C 955 750 945 700 945 650 C 935 610 920 590 910 578 C 860 590 805 590 780 550',
  'northern-circuit':'M 155 277 C 250 270 335 280 390 315 C 390 385 450 455 565 490 C 620 520 660 530 705 540 C 700 500 670 475 670 454 C 710 420 760 410 812 416 C 890 420 940 460 965 514 C 960 545 935 570 905 575 C 860 590 820 575 780 550 C 820 575 855 600 860 638 C 835 700 865 735 855 780 C 855 890 820 980 790 1060',
  rongai:'M 1172 260 C 1140 290 1110 315 1080 335 C 1055 365 1025 385 1003 402 C 1010 440 1045 465 1055 505 C 1060 550 1055 580 1050 610 C 1000 635 950 620 910 580 C 865 585 815 580 780 550 C 830 585 900 640 940 700 C 950 760 975 780 993 795 C 1025 900 1065 1010 1110 1070',
  umbwe:'M 570 970 C 575 870 625 800 617 710 C 620 665 650 635 673 610 C 710 620 725 650 759 680 C 805 700 845 670 860 638 C 840 605 800 585 780 550 C 820 575 855 600 860 638 C 835 700 865 735 860 780 C 855 890 820 980 790 1060'
};

function RouteMap({selected}) {
  const figureRef=useRef(null);
  const [animate,setAnimate]=useState(false);
  const maskId=`kili-route-mask-${selected.slug}`;
  useEffect(()=>{
    const figure=figureRef.current;
    if(!figure||!('IntersectionObserver' in window)){setAnimate(true);return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){setAnimate(true);observer.disconnect();}
    },{threshold:.18});
    observer.observe(figure);
    return ()=>observer.disconnect();
  },[]);
  return <figure ref={figureRef} className={`kili-map-art ${animate?'is-animating':'is-waiting'}`} role="img" aria-label={`${selected.name} route across Mount Kilimanjaro, showing its main camps and the approach to Uhuru Peak.`}>
    <img className="kili-map-terrain" {...photo('kilimanjaro/terrain-transparent.webp',mapSizes)} alt="" width="1536" height="1024" aria-hidden="true"/>
    <img key={selected.slug} className="kili-map-route" {...photo(`kilimanjaro/${selected.slug}-orange.webp`,mapSizes)} alt="" width="1536" height="1024" aria-hidden="true"/>
    <svg key={`${selected.slug}-animation`} className="kili-map-route-animation" viewBox="0 0 1604 1232" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1604" height="1232"><path className="kili-route-trace-reveal" d={routeAnimationPaths[selected.slug]} pathLength="1"/></mask></defs>
      <path className="kili-route-trace-line" d={routeAnimationPaths[selected.slug]} mask={`url(#${maskId})`}/>
    </svg>
  </figure>;
}

// The route list at the top of the page, styled like the safari package cards.
function RouteCards({tripFor,images={},loaded=true}) {
  return <section className="container kili-section kili-route-list" id="route-list" tabIndex="-1">
    <div className="kili-section-head"><div><span className="kili-section-kicker">Choose your route</span><h2>Find your Kilimanjaro route</h2></div><p>Six ways to Uhuru Peak. Compare days and prices, then open a route for its full day-by-day itinerary.</p></div>
    <div className="package-grid">{routes.map(route=>{const trip=tripFor(route.slug);const ask=`/plan-my-trip?${new URLSearchParams({interest:'Kilimanjaro',requests:`I am interested in the ${route.name} route. Please advise on an itinerary and price.`})}`;return <article className="package-card kili-route-card" key={route.slug}>
      {!loaded?<div className="card-image kili-card-pending" aria-hidden="true"><span className="image-label">{route.tag.toUpperCase()}</span></div>:images[route.slug]?<div className="card-image"><img {...photo(images[route.slug],'(max-width: 700px) 92vw, 420px')} alt={`${route.name} route on Mount Kilimanjaro`} loading="lazy"/><span className="image-label">{route.tag.toUpperCase()}</span></div>:<div className="card-image kili-card-map"><div className="kili-card-map-art"><img className="kili-map-terrain" {...photo('kilimanjaro/terrain-transparent.webp','(max-width: 700px) 92vw, 420px')} alt="" loading="lazy"/><img className="kili-card-route" {...photo(`kilimanjaro/${route.slug}-orange.webp`,'(max-width: 700px) 92vw, 420px')} alt={`Map of the ${route.name} route on Mount Kilimanjaro`} loading="lazy"/></div><span className="image-label">{route.tag.toUpperCase()}</span></div>}
      <div className="card-info"><span className="muted card-meta"><Clock size={13}/>{trip?`${trip.days} days`:'Days planned with you'} <span>·</span> {route.stay}</span><h3>{route.name} Route</h3><p><MapPin size={13}/>{route.approach}</p>
        <div className="card-bottom"><span className="card-price">{trip?.price>0&&<span className="card-price-label">From</span>}<span className="card-price-value"><strong>{!loaded?<span className="kili-price-pending" aria-hidden="true">$0,000</span>:trip?.price>0?<Price amount={trip.price}/>:'On request'}</strong>{trip?.price>0&&<small>/ person</small>}</span></span><Link to={trip?`/kilimanjaro/routes/${route.slug}`:ask} className="card-view">{trip?'View':'Ask us'}</Link></div></div>
    </article>})}</div>
  </section>;
}

function RouteTripDialog({trip,enquiry,onClose}) {
  const closeButton=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;
    const onKeyDown=event=>{if(event.key==='Escape')onClose();};
    document.addEventListener('keydown',onKeyDown);
    document.body.classList.add('kili-dialog-open');
    closeButton.current?.focus();
    return ()=>{document.removeEventListener('keydown',onKeyDown);document.body.classList.remove('kili-dialog-open');previous?.focus?.();};
  },[onClose]);
  return <div className="kili-trip-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section className="kili-trip-dialog" role="dialog" aria-modal="true" aria-labelledby="kili-trip-title">
    <header className="kili-trip-header"><div><span className="kili-section-kicker">Kilimanjaro route guide</span><h2 id="kili-trip-title">{trip.name}</h2><p>{trip.days}-day mountain journey</p></div><button ref={closeButton} type="button" className="kili-trip-close" onClick={onClose} aria-label="Close route details"><X size={22}/></button></header>
    <div className="kili-trip-body"><div className="kili-trip-overview"><span className="kili-micro">Introduction & overview</span><p>{trip.overview}</p><div className="kili-trip-price"><span>Starting price per person</span>{trip.price>0?<strong><Price amount={trip.price}/></strong>:<strong>Price on request</strong>}<small>The final price depends on dates, group size and chosen services.</small></div><Link className="button" to={enquiry}>Request this trip <ArrowUpRight size={17}/></Link></div><div className="kili-trip-days"><span className="kili-micro">Your day-by-day route</span><ol>{trip.itinerary.map((day,index)=><li key={`${index}-${day}`}><span>{String(index+1).padStart(2,'0')}</span><div><small>DAY {index+1}</small><p>{day}</p></div></li>)}</ol></div></div>
  </section></div>;
}

// content is the site-wide content, already loaded and kept while visitors move between pages.
// Only the server's copy has photoSizes, so until it arrives prices and photos are held back.
export default function KilimanjaroPage({packages=[],content={}}) {
  const loaded=!!content.photoSizes;
  const pageContent=loaded?content:{showcaseLinks:[]};
  const [route, setRoute] = useState(0);
  const [guests, setGuests] = useState(2);
  const [headerHeight, setHeaderHeight] = useState(130);
  const selected = routes[route];
  // Brochure days with the price saved in the admin, for any route slug.
  const tripFor=slug=>{const brochureTrip=defaultKilimanjaroRoutes.find(item=>item.slug===slug);const savedTrip=(pageContent.kilimanjaroRoutes||[]).find(item=>item.slug===slug);return brochureTrip?{...brochureTrip,price:savedTrip?.price??brochureTrip.price}:undefined;};
  const machame = packages.find(p=>p.published && p.category==='Kilimanjaro' && p.id==='machame-route');
  const otherClimbs = packages.filter(p=>p.published && p.category==='Kilimanjaro' && p.id!=='machame-route');
  const publishedSelection = route===0 && !!machame;
  const days = machame?.days || 6;
  const query = new URLSearchParams({interest:'Kilimanjaro', adults:String(guests), requests:`I am interested in the ${selected.name} route for ${guests} ${guests===1?'climber':'climbers'}. ${publishedSelection?`${days}-day published itinerary.`:'Please advise on a tailored itinerary and pacing.'}`});
  if (publishedSelection) query.set('package',machame.id);
  const enquiry = `/plan-my-trip?${query}`;

  useEffect(()=>{
    const header=document.querySelector('.site-header-shell');
    if (!header) return;
    const observer=new ResizeObserver(()=>setHeaderHeight(header.getBoundingClientRect().height));
    observer.observe(header);
    return ()=>observer.disconnect();
  },[]);
  function jump(event,id) {
    event.preventDefault();
    window.history.replaceState(null,'',`#${id}`);
    document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    document.getElementById(id)?.focus({preventScroll:true});
  }


  function changeRoute(index) {setRoute(index);}
  function routeKeys(event,index) {
    const keys={ArrowRight:(index+1)%routes.length,ArrowDown:(index+1)%routes.length,ArrowLeft:(index+routes.length-1)%routes.length,ArrowUp:(index+routes.length-1)%routes.length,Home:0,End:routes.length-1};
    if(keys[event.key]===undefined)return;
    event.preventDefault(); changeRoute(keys[event.key]);
    document.getElementById(`kili-route-${keys[event.key]}`)?.focus();
  }
  return <main className="kili-page" style={{'--kili-header-height':`${headerHeight}px`}}>
    <section className="kili-hero">
      <img src="/images/kilimanjaro-panorama.webp" alt="Sunrise lighting the snow-covered summit of Mount Kilimanjaro" fetchPriority="high" width="1672" height="941"/>
      <div className="kili-hero-shade"/>
    </section>

    <section className="container kili-intro kili-section" id="introduction" tabIndex="-1">
      <div className="kili-intro-copy">
        <div className="kili-intro-heading"><span className="kili-intro-eyebrow">The roof of Africa</span><h1>Your Kilimanjaro climb starts here</h1></div>
        <div className="kili-intro-narrative"><p className="kili-lead">Climb Africa’s highest mountain with a journey planned around your experience, dates and pace.</p><div className="kili-intro-body"><p>Mount Kilimanjaro rises to 5,895 metres in northern Tanzania. The journey takes you from rainforest trails through open moorland to the summit at Uhuru Peak.</p><p>Explore the routes below and speak with our Tanzania-based team. We’ll help you choose an itinerary and confirm the details before you book.</p></div></div>
      </div>
    </section>

    <RouteCards tripFor={tripFor} images={pageContent.routeCardImages} loaded={loaded}/>

    <section className="kili-routes kili-section" id="routes" tabIndex="-1"><div className="container">
      <div className="kili-section-head"><div><span className="kili-section-kicker">Compare the routes</span><h2>Kilimanjaro routes & map</h2></div></div>
      <div className="kili-route-tabs" role="tablist" aria-label="Kilimanjaro routes">{routes.map((r,i)=><button key={r.name} id={`kili-route-${i}`} role="tab" type="button" aria-selected={route===i} aria-controls="kili-route-panel" tabIndex={route===i?0:-1} onClick={()=>changeRoute(i)} onKeyDown={e=>routeKeys(e,i)}><span>{String(i+1).padStart(2,'0')}</span><span><strong>{r.name}</strong><small>{r.tag}</small></span></button>)}</div>
      <div className="kili-route-layout" id="kili-route-panel" role="tabpanel" aria-labelledby={`kili-route-${route}`} tabIndex="0">
        <div className="kili-map-card"><RouteMap selected={selected}/></div>
        <div className="kili-route-detail">
          <span className="kili-route-tag">{selected.tag}</span>
          <h3>{selected.name} Route</h3>
          <p>{selected.description}</p>
          <span className="kili-micro">Route highlights</span>
          <ol className="kili-route-stops">{selected.stops.map((stop,i)=>{const summit=i===selected.stops.length-1;return <li key={stop} className={summit?'is-summit':undefined}>{summit?<img src="/images/kilimanjaro/icons/summit.webp" alt="" width="22" height="22"/>:<span aria-hidden="true"/>}<strong>{stop}</strong>{summit&&<small>5,895m</small>}</li>})}</ol>
        </div>
      </div>
    </div></section>


    <ShowcaseSection content={pageContent} placement="kilimanjaro" className="kili-video-section"/>

    <DepartureBoard items={getAnnouncements(pageContent)} enquiry={enquiry}/>

    {otherClimbs.length>0&&<section className="container kili-section kili-other-climbs" id="other-climbs" tabIndex="-1">
      <span className="kili-section-kicker">More climbs</span><h2>Beyond Kilimanjaro</h2>
      <p>Tanzania’s other great summits: a short climb up Mount Meru or a sunrise ascent of Ol Doinyo Lengai, the Maasai “Mountain of God”.</p>
      <div className="pkg-others-grid">{otherClimbs.map(o=><Link key={o.id} to={'/packages/'+o.id}><div className="pkg-others-img"><img {...photo(o.image,'(max-width: 700px) 92vw, 420px')} alt="" loading="lazy"/></div><small>{o.days} days</small><h3>{o.name}</h3><span><span>{o.price?<>From <Price amount={o.price}/></>:'Price on request'}</span><ArrowRight size={16} aria-hidden="true"/></span></Link>)}</div>
    </section>}
    <section className="container kili-preparation kili-section" id="preparation" tabIndex="-1"><div className="kili-section-head"><div><h2>Prepare for your climb</h2></div><p>Keep these essentials on your planning list. We’ll talk through the details as we build your itinerary.</p></div><div className="kili-prep-grid">{[['clock','01','Make time to prepare','Build familiarity with long walks and hills, and share your experience when choosing your itinerary.'],['backpack','02','Get your kit together','Think layers, well-worn hiking boots and rain protection. Ask for the kit list and available rental options.'],['shield','03','Check the practical details','Discuss altitude with a qualified professional and confirm that your travel insurance covers your planned trek.'],['flight','04','Connect the whole journey','Allow time around the climb for arrival, briefing and onward travel. We’ll confirm your transfers in the quote.']].map(([icon,n,title,copy])=><article key={n}><div><TrekIcon name={icon} size={36}/></div><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section className="kili-faq kili-section" id="questions" tabIndex="-1"><div className="container kili-faq-layout"><div><h2>Frequently asked questions</h2><p>Still curious about something? A conversation with our local team is a good place to start.</p></div><div className="kili-faq-list">
      {categoryFAQs('Kilimanjaro',content).map(item=><details key={item.question}><summary>{item.question}<Plus size={18}/></summary><p>{item.answer}</p></details>)}
    </div></div></section>
    <KilimanjaroComments/>
    <section className="kili-final"><div className="container"><div><h2>Ready to plan your Kilimanjaro climb?</h2><p>Tell us your dates and ideas. We’ll help with the next step.</p></div><Link className="button" to={enquiry}>Request a quote <ArrowRight size={18}/></Link></div></section>
  </main>;
}
