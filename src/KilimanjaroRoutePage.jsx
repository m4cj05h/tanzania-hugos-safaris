import React,{useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {ArrowLeft,ArrowRight,ArrowUpRight,Clock,Flag,Tent} from 'lucide-react';
import {defaultKilimanjaroRoutes} from './data';
import {clockArt,hutArt} from './trekIcons';
import {h,Price} from './locale';
import './kilimanjaro.css';

const SUMMIT=5895;
const numberWords={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
const toNumber=word=>numberWords[word.toLowerCase()]??Number(word);
const formatMetres=value=>`${value.toLocaleString('en-US')}m`;

// The last altitude mentioned is normally the camp, except on days that return to a camp whose altitude is not repeated
// or summit days whose last figure is a crater-rim point such as Gilman's Point.
function overnight(text,altitudes,summit){
  if(/return to \w+ (Hut|Camp)/i.test(text))return undefined;
  const last=altitudes.filter(value=>value!==SUMMIT).at(-1);
  return summit&&last>5000?undefined:last;
}

// Brochure days read "Title — description (3,000m) ... five to six hours", so pull the structure back out of the text.
function describeDay(text){
  const [title,...rest]=text.split(' — ');
  const altitudes=[...text.matchAll(/\(([\d,]+)m\)/g)].map(match=>Number(match[1].replace(/,/g,'')));
  const hours=text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+) to (one|two|three|four|five|six|seven|eight|nine|ten|\d+) hours\b/i);
  const summit=/Uhuru Peak/i.test(text);
  return {title:title.trim(),first:altitudes[0],detail:rest.join(' — ').trim(),summit,peak:summit?SUMMIT:Math.max(0,...altitudes),sleep:overnight(text,altitudes,summit),hours:hours&&`${toNumber(hours[1])}–${toNumber(hours[2])} hrs`};
}

const profilePoints=days=>days.map((day,index)=>({index,value:day.summit?SUMMIT:day.sleep,summit:day.summit})).filter(point=>point.value);
const hasProfile=days=>profilePoints(days).length>=3;

// Full-colour timeline icons: supplied artwork in /images/kilimanjaro/icons, with drawn fallbacks (32×32 grid) for the rest.
const dayImages=new Set(['flight','forest','climb','camp','summit']);
const dayArt={
  hut:hutArt,
  acclimatise:<><g transform="rotate(-12 10 20)"><ellipse cx="10" cy="17.5" rx="3.6" ry="5.3" fill="#8d6e63"/><ellipse cx="10" cy="26" rx="2.9" ry="2.5" fill="#8d6e63"/></g><g transform="rotate(12 22 10)"><ellipse cx="22" cy="7.8" rx="3.6" ry="5.3" fill="#5d4037"/><ellipse cx="22" cy="16.3" rx="2.9" ry="2.5" fill="#5d4037"/></g></>,
  finish:<><path d="M9.5 2.5h5.5l4 11.5h-5.5z" fill="#1e88e5"/><path d="M22.5 2.5H17l-4 11.5h5.5z" fill="#e53935"/><circle cx="16" cy="21.5" r="8" fill="#fbc02d" stroke="#f9a825" strokeWidth="1.5"/><circle cx="16" cy="21.5" r="5.8" fill="#ffd54f"/><path d="M16 17.1 17.1 20l3.1.1-2.4 2 .8 3-2.6-1.7-2.6 1.7.8-3-2.4-2 3.1-.1z" fill="#fff8e1"/></>
};
const DayArt=({kind})=>dayImages.has(kind)?<img src={`/images/kilimanjaro/icons/${kind}.webp`} alt="" width="32" height="32" loading="lazy"/>:<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">{dayArt[kind]}</svg>;

// Pick a timeline illustration from what happens that day; the first matching rule wins.
const dayKinds=[
  [day=>day.summit,'summit'],
  [day=>/arriv|airport|departure and small tour/i.test(day.title+' '+day.detail)&&!/ to .* Camp| to .* Hut/i.test(day.title),'flight'],
  [day=>/certificate|to Mweka Gate|to Marangu Gate/i.test(day.title+' '+day.detail),'finish'],
  [day=>/acclimati[sz]ation/i.test(day.title),'acclimatise'],
  [day=>/Gate to/i.test(day.title),'forest'],
  [day=>/Hut/i.test(day.title),'hut'],
  [day=>/Lava Tower|Barranco Wall|Mawenzi/i.test(day.title+' '+day.detail),'climb'],
  [()=>true,'camp']
];
const dayKind=day=>dayKinds.find(([test])=>test(day))[1];

function AltitudeProfile({days}){
  const points=profilePoints(days);
  if(points.length<3)return null;
  const start=days.find(day=>day.first)?.first;
  const highestCamp=Math.max(...days.filter(day=>!day.summit).map(day=>day.sleep||0));
  // Plot only the days with a known altitude, on a scale that starts just below the lowest camp.
  const width=640,height=300,padLeft=60,padRight=30,padTop=40,padBottom=40;
  const high=6000,low=Math.max(0,Math.floor((Math.min(...points.map(point=>point.value))-300)/1000)*1000);
  const grid=Array.from({length:(high-low)/1000+1},(_,i)=>low+i*1000);
  const x=i=>padLeft+16+i*(width-padLeft-padRight-32)/(points.length-1);
  const y=value=>padTop+(high-value)/(high-low)*(height-padTop-padBottom);
  const base=y(low);
  const line=points.map((point,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ');
  const area=`${line} L${x(points.length-1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const summitDay=points.find(point=>point.summit)?.index+1;
  return <figure className="kili-profile">
    <figcaption><span className="kili-section-kicker">Altitude profile</span><small>Sleeping altitude by day{summitDay?` · summit on day ${summitDay}`:''}</small></figcaption>
    <div className="kili-profile-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Altitude by day: ${points.map(point=>`day ${point.index+1} ${formatMetres(point.value)}`).join(', ')}`}>
      <defs><linearGradient id="kili-profile-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--kili-orange)" stopOpacity=".3"/><stop offset="1" stopColor="var(--kili-orange)" stopOpacity="0"/></linearGradient></defs>
      {grid.map(value=><g key={value} className={`kili-profile-grid${value===low?' is-base':''}`}><line x1={padLeft} x2={width-padRight} y1={y(value)} y2={y(value)}/><text x={padLeft-12} y={y(value)+4} textAnchor="end">{`${value/1000}k m`}</text></g>)}
      <path d={area} fill="url(#kili-profile-fill)"/>
      <path d={line} className="kili-profile-line"/>
      {points.map((point,i)=>{const last=i===points.length-1,first=i===0,anchor=last?'end':first?'start':'middle',dx=last?6:first?-6:0;return <g key={point.index} className={point.summit?'is-summit':undefined}>
        <circle cx={x(i)} cy={y(point.value)} r={point.summit?6.5:4.5}/>
        <text className="kili-profile-value" x={x(i)+dx} y={y(point.value)-14} textAnchor={anchor}>{point.summit?`Uhuru ${formatMetres(point.value)}`:formatMetres(point.value)}</text>
        <text className="kili-profile-day" x={x(i)} y={height-12} textAnchor="middle">Day {point.index+1}</text>
      </g>;})}
    </svg></div>
    <dl className="kili-profile-stats">
      {start&&<div><dt>Start gate</dt><dd>{formatMetres(start)}</dd></div>}
      <div><dt>Highest camp</dt><dd>{formatMetres(highestCamp)}</dd></div>
      <div><dt>Summit</dt><dd>{formatMetres(SUMMIT)}</dd></div>
    </dl>
  </figure>;
}

export default function KilimanjaroRoutePage({content={}}){
  const slug=useLocation().pathname.split('/').filter(Boolean).at(-1);
  // Saved prices come from the site-wide content (only the server's copy has photoSizes).
  const published=content.photoSizes?content.kilimanjaroRoutes||[]:[];
  useEffect(()=>{window.scrollTo(0,0);},[slug]);
  const withPrice=route=>({...route,price:published.find(saved=>saved.slug===route.slug)?.price??route.price});
  const brochureTrip=defaultKilimanjaroRoutes.find(route=>route.slug===slug);
  const trip=brochureTrip&&withPrice(brochureTrip);
  useEffect(()=>{if(trip)document.title=`${trip.name} | Tanzania Hugos Safaris`;},[trip?.name]);
  if(!trip)return <main className="kili-page"><section className="container kili-section" style={{paddingTop:80,paddingBottom:100}}><span className="kili-section-kicker">Route information</span><h1>Itinerary not available</h1><p>This route does not have a day-by-day itinerary in the supplied trekking brochure.</p><Link className="button" to="/kilimanjaro#route-list"><ArrowLeft size={17}/> View brochure routes</Link></section></main>;
  const days=trip.itinerary.map(describeDay);
  const highestCamp=Math.max(0,...days.filter(day=>!day.summit).map(day=>day.sleep||0));
  const otherRoutes=defaultKilimanjaroRoutes.filter(route=>route.slug!==slug).map(withPrice);
  const request=`/plan-my-trip?${new URLSearchParams({interest:'Kilimanjaro',route:trip.slug,requests:`I am interested in the ${trip.name} ${trip.days}-day itinerary. Please send me availability and a personalised quote.`})}`;
    return <main className="kili-page kili-route-page">
    <section className="kili-route-page-hero"><img src="/images/kilimanjaro-panorama.webp" alt={`Mount Kilimanjaro landscape for the ${trip.name}`} fetchPriority="high"/><div className="kili-route-page-shade"/>
      <div className="container kili-route-page-heading">
        <span className="kili-route-page-eyebrow">Kilimanjaro trek · {trip.days}-day itinerary</span>
        <h1>{trip.name}</h1>
      </div>
    </section>
    <section className="container kili-route-booking-wrap">
      <div className="kili-route-booking">
        <div className="kili-booking-price"><span className="kili-section-kicker">Starting from</span><strong>{!content.photoSizes?<span className="kili-price-pending" aria-hidden="true">$0,000</span>:trip.price>0?<Price amount={trip.price}/>:'On request'}</strong><small>{trip.price>0?'Per person · starting price':'Ask us for the current rate'}</small></div>
        <ul>
          <li><Clock size={18}/><span>Duration</span><strong>{trip.days} days</strong></li>
          <li><Flag size={18}/><span>Summit</span><strong>{formatMetres(SUMMIT)}</strong></li>
          {highestCamp>0&&<li><Tent size={18}/><span>Highest camp</span><strong>{formatMetres(highestCamp)}</strong></li>}
        </ul>
        <div className="kili-booking-action"><Link className="button" to={request}>Request this trip <ArrowUpRight size={17}/></Link></div>
      </div>
    </section>
    <section className="container kili-route-page-layout">
      <article>
        <span className="kili-section-kicker">Introduction & overview</span>
        <h2>A closer look at the journey</h2>
        <p className="kili-route-page-lead">{trip.overview}</p>
        <div className={`kili-route-visuals${hasProfile(days)?'':' is-single'}`}>
          <figure className="kili-route-page-map"><div className="kili-map-art"><img className="kili-map-terrain" src="/images/kilimanjaro/terrain-transparent.webp" alt="" aria-hidden="true"/><img className="kili-map-route kili-route-page-line" src={`/images/kilimanjaro/${trip.slug}-orange.webp`} alt={`Map of the ${trip.name} on Mount Kilimanjaro`}/></div></figure>
          <AltitudeProfile days={days}/>
        </div>
        <div className="kili-route-page-days">
          <span className="kili-section-kicker">Day by day</span>
          <h2>Your mountain itinerary</h2>
          <p>The exact pacing, camps and services will be reconfirmed in your written itinerary.</p>
          <ol>{days.map((day,index)=><li key={`${index}-${day.title}`} className={day.summit?'is-summit':undefined}>
            <span className="kili-day-marker" aria-hidden="true"><DayArt kind={dayKind(day)}/></span>
            <div className="kili-day-card">
              <small>Day {index+1}{day.summit&&<em>Summit day</em>}</small>
              <h3>{day.title}</h3>
              {day.detail&&<p>{day.detail}</p>}
              {(day.hours||day.peak>0||day.sleep)&&<div className="kili-day-tags">
                {day.hours&&<span><svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">{clockArt}</svg>{day.hours}</span>}
                {day.peak>0&&day.peak!==day.sleep&&<span><img src="/images/kilimanjaro/icons/climb.webp" alt="" width="20" height="20" loading="lazy"/>High point {formatMetres(day.peak)}</span>}
                {day.sleep>0&&<span><img src="/images/kilimanjaro/icons/camp.webp" alt="" width="20" height="20" loading="lazy"/>Overnight {formatMetres(day.sleep)}</span>}
              </div>}
            </div>
          </li>)}</ol>
        </div>
      </article>
    </section>
    {otherRoutes.length>0&&<section className="kili-route-others"><div className="container">
      <span className="kili-section-kicker">Compare</span>
      <h2>Other Kilimanjaro routes</h2>
      <div className="kili-route-others-grid">{otherRoutes.map(route=><Link key={route.slug} to={`/kilimanjaro/routes/${route.slug}`}>
        <div className="kili-map-art"><img className="kili-map-terrain" src="/images/kilimanjaro/terrain-transparent.webp" alt="" aria-hidden="true" loading="lazy"/><img className="kili-map-route kili-route-page-line" src={`/images/kilimanjaro/${route.slug}-orange.webp`} alt="" aria-hidden="true" loading="lazy"/></div>
        <h3>{route.name}</h3>
        <span>{route.days} days{content.photoSizes&&<> · {route.price>0?<>from <Price amount={route.price}/></>:'price on request'}</>}</span>
        <ArrowRight size={17} aria-hidden="true"/>
      </Link>)}</div>
    </div></section>}
  </main>;
}
