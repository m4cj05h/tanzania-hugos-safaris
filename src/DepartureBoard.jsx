import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {h, Price} from './locale';
import {departureMonths, departureTrip, departureFeatures} from './announcements';
import {TrekIcon,featureIcon} from './trekIcons';
import './kilimanjaro.css';

const kickers={Kilimanjaro:'Upcoming group climbs',Safari:'Upcoming group safaris',Zanzibar:'Upcoming group trips'};

// Published group departures for one trip type, filterable by year and month.
export default function DepartureBoard({items,trip='Kilimanjaro',enquiry=`/plan-my-trip?interest=${trip}`}) {
  const departures=items.filter(item=>item.published&&departureTrip(item)===trip&&/^\d{4}-\d{2}-\d{2}$/.test(item.startDate||'')).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const years=[...new Set(departures.map(item=>Number(item.startDate.slice(0,4))))];
  const [year,setYear]=useState(years[0]||new Date().getFullYear());
  const yearItems=departures.filter(item=>Number(item.startDate.slice(0,4))===year);
  const availableMonths=[...new Set(yearItems.map(item=>Number(item.startDate.slice(5,7))-1))];
  const [month,setMonth]=useState(availableMonths[0]??new Date().getMonth());
  useEffect(()=>{if(years.length&&!years.includes(year))setYear(years[0]);},[departures.length]);
  useEffect(()=>{if(availableMonths.length&&!availableMonths.includes(month))setMonth(availableMonths[0]);},[year,departures.length]);
  if(!departures.length)return null;
  const visible=yearItems.filter(item=>Number(item.startDate.slice(5,7))-1===month);
  const dateParts=value=>{const date=new Date(`${value}T12:00:00`);return {day:String(date.getDate()).padStart(2,'0'),month:departureMonths[date.getMonth()],long:date.toLocaleDateString('en-GB',{day:'2-digit',month:'long'})}};
  return <section className="kili-departures kili-section" id="updates" tabIndex="-1"><div className="container">
    <div className="kili-departure-heading"><span className="kili-section-kicker">{kickers[trip]}</span><h2>Departure dates</h2></div>
    <div className="kili-year-tabs" role="tablist" aria-label="Departure year">{years.map(value=><button type="button" role="tab" aria-selected={year===value} key={value} onClick={()=>setYear(value)}>{value}</button>)}</div>
    <div className="kili-month-tabs" aria-label="Departure month">{departureMonths.map((name,index)=><button type="button" className={month===index?'active':''} disabled={!availableMonths.includes(index)} aria-pressed={month===index} key={name} onClick={()=>setMonth(index)}>{name}</button>)}</div>
    <div className="kili-departure-list">{visible.map(item=>{const start=dateParts(item.startDate),end=dateParts(item.endDate);const params=new URLSearchParams(enquiry.split('?')[1]);params.set('requests',`I would like to join the ${item.route} group departure from ${item.startDate} to ${item.endDate}.`);const request=`/plan-my-trip?${params}`;return <article className="kili-departure-row" key={item.id}>
      <time className="kili-date-badge" dateTime={item.startDate}><strong>{start.day}</strong><span>{start.month}</span></time>
      <div className="kili-departure-name"><h3>{item.route} <span>– {item.days} days</span></h3><p>From {start.long} – {end.long}</p></div>
      <strong className="kili-departure-price"><Price amount={item.price}/></strong>
      <ul className="kili-departure-features">{departureFeatures(item).map(([feature,icon],index)=><li key={index}><TrekIcon name={icon||featureIcon(feature)} size={20}/>{feature}</li>)}</ul>
      <Link className="kili-join" to={request}><strong>JOIN GROUP</strong><span>Deposit <Price amount={item.deposit}/></span></Link>
    </article>})}</div>
  </div></section>;
}
