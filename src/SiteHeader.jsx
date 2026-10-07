import {h, useLocale, LocaleProvider, Price, CurrencyNotice} from './locale';
import React, {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, Compass, Globe, Mail, Menu, MessageCircle, Search, X} from 'lucide-react';
import {whatsapp} from './data';
import './header.css';
import RegionalSettings from './RegionalSettings';
import ThemeToggle from './ThemeToggle';

const navigation = [
  {label:'Safaris',to:'/safaris',image:'safari.webp',items:[
    ['Tanzania safari packages','/safaris','Discover the wild heart of Tanzania','Explore our safari journeys, from a short Mikumi escape to the Serengeti and Ngorongoro. Compare starting prices, explore itineraries and find a journey to make your own.'],
    ['Wildebeest Migration Safari','/packages/migration-safari','Follow the rhythm of the wild','An eight-day journey through Tarangire, the Serengeti and Ngorongoro. Discover the route and ask our team about the best itinerary for your travel dates.'],
    ['Mikumi from Dar es Salaam','/packages/mikumi-safari','A short escape. A big adventure.','Discover a three-day wildlife journey departing from Dar es Salaam, with game drives and time to enjoy the landscapes of Mikumi.'],
    ['Ngorongoro Crater','/destinations/ngorongoro','A world within a crater','Make the Ngorongoro Crater part of your journey through Tanzania. Explore our packages or request a personalised route.'],
    ['Day trips','/day-trips','One day, big memories','Waterfalls, hot springs, culture tours and game drives in Ngorongoro, Tarangire or Lake Manyara — perfect when you have a day to spare.'],
    ['Create a private itinerary','/plan-my-trip?interest=Safari','Your safari, your way','Share your dates, interests, group size and accommodation preferences. Our team will prepare a personal itinerary and quotation.']
  ]},
  {label:'Kilimanjaro',to:'/kilimanjaro',image:'company.webp',items:[
    ['Kilimanjaro climbs','/kilimanjaro','Climb Africa’s highest mountain','Make space for an extraordinary adventure. Explore our Kilimanjaro options and speak with our Tanzania-based team about the route and pace that suit you.'],
    ['Machame route & pricing','/packages/machame-route','Your path through changing landscapes','See the Machame itinerary, published starting price and planning details. Ask us about longer itineraries and accommodation before and after your climb.'],
    ['Lemosho & Marangu enquiries','/plan-my-trip?interest=Kilimanjaro','Find the route that fits your journey','Ask our team about Lemosho and Marangu options, climb duration, preparation and available dates.'],
    ['Mount Meru & Ol Doinyo Lengai','/kilimanjaro#other-climbs','More mountains to conquer','Summit Mount Meru in four or five days, or climb the Maasai “Mountain of God” for sunrise over Lake Natron.'],
    ['Kilimanjaro + safari','/combination-packages','After the summit, discover the plains','Extend your mountain adventure with wildlife experiences or time on Zanzibar. We’ll plan the connections around your climb.'],
    ['Plan a private climb','/plan-my-trip?interest=Kilimanjaro','An adventure shaped around you','Tell us about your group and preferred dates to start planning your climb. Your final itinerary and inclusions will be confirmed in writing.']
  ]},
  {label:'Zanzibar',to:'/zanzibar-tours',image:'zanzibar.webp',items:[
    ['Zanzibar holidays','/zanzibar-tours','Find your own island rhythm','White-sand beaches, winding Stone Town streets and sunsets over the Indian Ocean. Explore a different side of Tanzania with an island stay made for you.'],
    ['Kendwa Beach Escape','/packages/kendwa-beach','Slow mornings. Barefoot afternoons.','Explore our six-day Kendwa Beach Escape and talk to us about your preferred hotel, transfers and optional island activities.'],
    ['Dhow cruises & dolphin tours','/day-trips','Discover more than the beach','Sail into the sunset on a traditional dhow, or meet Red Colobus monkeys in Jozani Forest and dolphins at Kizimkazi.'],
    ['Safari + beach combinations','/combination-packages','Two sides of an unforgettable journey','Pair game drives with days on the coast. Explore our combination trips or create an itinerary around your wishlist.'],
    ['Airport transfers','/plan-my-trip?interest=Airport%20transfer','An easy start to your island stay','Share your flight information, hotel and group size to request an airport transfer quote.']
  ]},
  {label:'AFCON 2027',to:'/afcon-tanzania',image:'hero.webp',items:[
    ['AFCON Tanzania travel','/afcon-tanzania','Come for the football. Stay for Tanzania.','Plan your Tanzania visit around the matches, with airport pickups, hotel transfers and memorable travel extensions.'],
    ['Match-day & group transport','/plan-my-trip?interest=AFCON','Let us help with the journey','Share your match information, accommodation and number of travellers. We’ll help organise your private and group transport.'],
    ['Football + safari','/packages/afcon-safari','Beyond the final whistle','Add a wildlife adventure to your football trip. Travel arrangements depend on the confirmed schedule; match tickets are not included.'],
    ['Create my AFCON itinerary','/plan-my-trip?interest=AFCON','Make the most of your time here','Tell us your arrival dates, match plans and interests. We’ll design a Tanzania itinerary around your visit.']
  ]},
  {label:'Travel guide',to:'/travel-guide',image:'elephants.webp',items:[
    ['Tanzania travel journal','/travel-guide','A little knowledge. A better adventure.','Find inspiration and practical starting points for your safari, island escape and tailor-made Tanzania journey.'],
    ['Our blog','/blog','Stories from the trail','News, trip reports and moments from the safaris, climbs and island days we share with our travellers.'],
    ['Your first Tanzania safari','/travel-guide/first-tanzania-safari','Start your safari story here','Explore the questions to consider when planning your first safari, from your ideal pace to the places on your wishlist.'],
    ['Safari & Zanzibar inspiration','/travel-guide/safari-and-zanzibar','From the savannah to the sea','Discover how to bring wildlife and island experiences together in one personal itinerary.'],
    ['Payment & booking information','/payment-options','Clear information before you book','Learn how enquiries, personalised quotations and confirmed payment instructions work.']
  ]},
  {label:'About us',to:'/about-us',image:'company.webp',items:[
    ['Our story','/about-us','Our home. Your extraordinary story.','Get to know Tanzania Hugos Safaris, a Tanzania-based travel company planning wildlife adventures, mountain climbs and island escapes.'],
    ['Contact our team','/contact','A real person. A simple hello.','Ask a question, share an idea or start planning. Contact our team directly by phone, email or WhatsApp.'],
    ['Plan a personal journey','/plan-my-trip','Tell us what you’re dreaming of','From your first idea to the finer details, we’ll help you create a Tanzania itinerary that feels like yours.']
  ]}
];

export default function SiteHeader({content}) {
  const{t}=useLocale();
  const [mobile,setMobile]=useState(false);
  const [active,setActive]=useState(null);
  const [preview,setPreview]=useState(0);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const root=useRef(null),searchInput=useRef(null),lastTrigger=useRef(null);
  const location=useLocation();
  const close=()=>{setActive(null);setSearchOpen(false);setMobile(false)};
  useEffect(()=>{close();window.scrollTo(0,0)},[location.pathname,location.search]);
  useEffect(()=>{const outside=e=>{if(!root.current?.contains(e.target))close()};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[]);
  useEffect(()=>{if(searchOpen)searchInput.current?.focus()},[searchOpen]);
  useEffect(()=>{const escape=e=>{if(e.key==='Escape'){close();lastTrigger.current?.focus()}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape)},[]);
  useEffect(()=>{const media=window.matchMedia('(max-width: 1050px)');const change=()=>close();media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
  const openMenu=(index,trigger)=>{setActive(index);setPreview(0);setSearchOpen(false);if(trigger)lastTrigger.current=trigger};
  const category=active===null?null:navigation[active];
  const entry=category?.items[preview];
  const searchItems=[...navigation.map(n=>({title:n.label,to:n.to,kind:'Explore'})),...content.packages.filter(p=>p.published).map(p=>({title:p.name,to:'/packages/'+p.id,kind:'Journey'})),...content.articles.filter(a=>a.published).map(a=>({title:a.title,to:'/travel-guide/'+a.id,kind:'Journal'}))];
  const results=searchItems.filter(item=>(t(item.title)+' '+item.title).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0,7);
  return <div className="site-header-shell" ref={root} onMouseLeave={()=>{if(window.matchMedia('(min-width:1051px)').matches)setActive(null)}} onBlurCapture={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))close()}}>
    <div className="header-utility"><div className="header-width"><div className="header-utility-right"><ThemeToggle/><RegionalSettings onOpen={()=>{setActive(null);setSearchOpen(false);setMobile(false)}}/><button aria-label={searchOpen?'Close site search':'Search the website'} aria-expanded={searchOpen} aria-controls="header-search" onClick={e=>{lastTrigger.current=e.currentTarget;setSearchOpen(!searchOpen);setActive(null)}}>{searchOpen?<X size={17}/>:<Search size={17}/>}</button></div></div></div>
    <header className="site-header"><div className="header-width header-main"><Link to="/" className="brand header-brand" aria-label="Tanzania Hugos Safaris home"><img src="/images/logo.webp" alt=""/><span><strong>TANZANIA</strong><small>Hugos Safaris</small></span></Link>
      <nav aria-label="Main navigation" className={'site-nav '+(mobile?'mobile-open':'')} id="main-navigation"><div className="mobile-nav-title">Explore Tanzania<button aria-label="Close navigation" onClick={close}><X size={21}/></button></div>{navigation.map((n,i)=><div className={'nav-category '+(active===i?'menu-active':'')} key={n.label} onMouseEnter={e=>{if(window.matchMedia('(min-width:1051px)').matches)openMenu(i,e.currentTarget.querySelector('button'))}}><div className="nav-category-row"><Link to={n.to} aria-current={location.pathname===n.to?'page':undefined}>{n.label}</Link><button aria-label={`Explore ${n.label} menu`} aria-expanded={active===i} aria-controls={`navigation-panel-${i}`} onClick={e=>{lastTrigger.current=e.currentTarget;if(active===i)setActive(null);else openMenu(i,e.currentTarget)}}><ChevronDown size={12}/></button></div>{mobile&&active===i&&<div className="mobile-submenu" id={`navigation-panel-${i}`}>{n.items.map(([title,to])=><Link key={title} to={to}>{title}<ChevronRight size={15}/></Link>)}</div>}</div>)}<div className="mobile-nav-footer"><Link to="/contact">Contact our team <ArrowUpRight size={17}/></Link><a href={whatsapp()}><MessageCircle size={17}/> +255 680 853 664</a></div></nav>
      <Link className="header-plan" to="/plan-my-trip"><Mail size={17}/><span>Plan my trip</span></Link><button className="header-mobile-toggle" aria-label="Toggle navigation" aria-expanded={mobile} aria-controls="main-navigation" onClick={()=>{setMobile(!mobile);setActive(null);setSearchOpen(false)}}>{mobile?<X size={24}/>:<Menu size={24}/>}</button>
    </div></header>
    {category&&!mobile&&<div className="mega-menu" id={`navigation-panel-${active}`} onMouseLeave={()=>setActive(null)}><div className="mega-links"><span className="mega-overline">EXPLORE {category.label.toUpperCase()}</span>{category.items.map(([title,to],i)=><Link className={preview===i?'preview-active':''} to={to} key={title} onMouseEnter={()=>setPreview(i)} onFocus={()=>setPreview(i)}>{title}<ChevronRight size={16}/></Link>)}</div><div className="mega-description"><span className="mega-overline">TANZANIA HUGOS SAFARIS</span><h2>{entry[2]}</h2><p>{entry[3]}</p><Link className="mega-cta" to={entry[1]}>Explore {preview===0?category.label.toLowerCase():'this experience'}<ArrowRight size={17}/></Link><Link className="mega-personal" to="/plan-my-trip">Prefer something tailor-made? <ArrowUpRight size={14}/></Link></div><Link className="mega-photo" to={entry[1]} tabIndex={-1} aria-hidden="true"><img src={'/images/'+category.image} alt=""/><span>Explore Tanzania.<br/><em>Experience Africa.</em></span></Link></div>}
    {searchOpen&&<section className="header-search" id="header-search" aria-label="Search journeys and travel guides"><label htmlFor="site-search">Where would you like to go?</label><div className="header-search-input"><Search size={19}/><input ref={searchInput} id="site-search" value={query} placeholder="Search safaris, Zanzibar, Kilimanjaro…" onChange={e=>setQuery(e.target.value)}/></div><div className="header-search-results">{results.map(item=><Link to={item.to} key={item.to}><span><small>{item.kind}</small>{item.title}</span><ArrowUpRight size={18}/></Link>)}{results.length===0&&<p>No matching journeys. Try “safari” or <Link to="/plan-my-trip">ask us to plan your trip</Link>.</p>}</div></section>}
  </div>;
}
