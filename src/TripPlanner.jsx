import {h, useLocale, Price} from './locale';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, ArrowUpRight, Baby, Briefcase, CalendarDays, Check, CircleHelp, Clock, Gem, Heart, House, MessageCircle, Minus, Plus, Sparkles, Tent, User, Users, Wallet} from 'lucide-react';
import {whatsapp, defaultKilimanjaroRoutes} from './data';
import {photo} from './images';
import './trip-planner.css';

// "Plan my trip": one question per step, then the tours that match the answers, then contact details.

const tripTypes=[
  {id:'Safari',label:'Safari',text:'Game drives in Tanzania’s great national parks',image:'safari.webp',categories:['Safari']},
  {id:'Kilimanjaro',label:'Kilimanjaro & treks',text:'Climb Kilimanjaro, Mount Meru or Ol Doinyo Lengai',image:'kilimanjaro-panorama.webp',categories:['Kilimanjaro']},
  {id:'Zanzibar',label:'Zanzibar & beach',text:'White sand, Stone Town and the Indian Ocean',image:'zanzibar.webp',categories:['Zanzibar']},
  {id:'Combination',label:'Safari + beach',text:'Wildlife first, then time on the island',image:'trip-elephants-sunset.webp',categories:['Combination']},
  {id:'Day trip',label:'Day trips',text:'Waterfalls, hot springs and one-day safaris',image:'trip-materuni.webp',categories:['Day trip']},
  {id:'AFCON',label:'AFCON 2027',text:'Football travel with time to explore',image:'hero.webp',categories:['AFCON']},
  {id:'Airport transfer',label:'Airport transfers',text:'An easy start, from the airport to your hotel',image:'trip-lake-shore.webp',categories:[]},
];
// counts: which numbers the visitor can adjust for that group, and the lowest each may go.
const travellerTypes=[
  {id:'Solo',text:'Just me',icon:User,adults:1,children:0,counts:{}},
  {id:'Couple',text:'Two of us',icon:Heart,adults:2,children:0,counts:{}},
  {id:'Family',text:'With children',icon:Baby,adults:2,children:2,counts:{adults:1,children:1}},
  {id:'Friends',text:'A group of friends',icon:Users,adults:4,children:0,counts:{adults:2,children:0}},
  {id:'Business group',text:'Colleagues or an organised group',icon:Briefcase,adults:8,children:0,counts:{adults:2}},
];
// Trip length: the range used to match tours, and the nights used for the departure date.
const durations=[
  {id:'1 day',label:'A day trip',range:[1,1],nights:0},
  {id:'2–4 days',label:'2–4 days',range:[2,4],nights:3},
  {id:'5–7 days',label:'5–7 days',range:[5,7],nights:6},
  {id:'8–10 days',label:'8–10 days',range:[8,10],nights:9},
  {id:'11+ days',label:'11 days or more',range:[11,99],nights:13},
  {id:'Not sure yet',label:'Not sure yet',range:null,nights:6},
];
const comforts=[
  {id:'Camping',label:'Classic camping',text:'Tented camps with simple comforts, close to nature',icon:Tent},
  {id:'Comfort lodge',label:'Comfort lodges',text:'Mid-range lodges and tented camps with good food',icon:House},
  {id:'Luxury lodge',label:'Luxury lodges',text:'The finest lodges, private spaces and special touches',icon:Gem},
  {id:'Help me choose',label:'Help me choose',text:'Tell me what suits my trip best',icon:CircleHelp},
];
// Budget values are kept in USD for the team; labels follow the visitor's currency.
const budgets=[
  {id:'Under $1,000 USD',max:1000,label:fp=>['Under',fp(1000)]},
  {id:'$1,000–$2,500 USD',max:2500,label:fp=>[`${fp(1000)} – ${fp(2500)}`]},
  {id:'$2,500–$5,000 USD',max:5000,label:fp=>[`${fp(2500)} – ${fp(5000)}`]},
  {id:'$5,000+ USD',max:Infinity,label:fp=>[`${fp(5000)}+`]},
  {id:'Help me decide',max:Infinity,label:()=>['Help me decide']},
];
const steps=[
  ['What kind of trip are you dreaming of?','Choose one or more.'],
  ['Who is travelling?','Pick the group that fits.'],
  ['When would you like to travel?','Your arrival date in Tanzania. It is fine if it is not fixed yet.'],
  ['How long would you like your trip to be?','Days in Tanzania, including any beach time.'],
  ['What level of comfort would you like?','Where you will sleep along the way.'],
  ['What is your budget per person?','An estimate for the trip itself, without international flights.'],
  ['Tours that match your plans','Select any you like. We will tailor them to you.'],
  ['A few details, and we’ll be in touch','A travel specialist will prepare your personal itinerary and quote.'],
];

async function sendEnquiry(data){
  const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Something went wrong. Please try again.');
  return result;
}
const addDays=(date,days)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);};
const durationFor=days=>durations.find(d=>d.range&&days>=d.range[0]&&days<=d.range[1]);

export default function TripPlanner({content}){
  const {language,effectiveCurrency,formatPrice,locale}=useLocale();
  const [params]=useSearchParams();
  const packages=content.packages.filter(p=>p.published);

  // Arriving from a trip page (?package=), a Kilimanjaro route (?route=) or a menu link (?interest=).
  const route=defaultKilimanjaroRoutes.find(r=>r.slug===params.get('route'));
  const linked=packages.find(p=>p.id===params.get('package'));
  const interest=params.get('interest');
  const [answers,setAnswers]=useState(()=>({
    types:linked?[tripTypes.find(t=>t.categories.includes(linked.category))?.id].filter(Boolean):route?['Kilimanjaro']:tripTypes.some(t=>t.id===interest)?[interest]:[],
    travellers:'',adults:/^\d+$/.test(params.get('adults')||'')?Math.min(200,Math.max(1,Number(params.get('adults')))):2,children:0,
    arrival:'',flexible:false,
    duration:linked?durationFor(linked.days)?.id||'':route?durationFor(route.days)?.id||'':'',
    comfort:'',budget:'',
    tours:linked?[linked.id]:[],
  }));
  const [step,setStep]=useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState('');
  const headingRef=useRef(null),panelRef=useRef(null),firstRender=useRef(true);
  const set=patch=>setAnswers(a=>({...a,...patch}));
  const today=new Date().toISOString().slice(0,10);

  useEffect(()=>{
    if(firstRender.current){firstRender.current=false;return;}
    if(sent){scrollTo({top:0,behavior:'smooth'});return;}
    headingRef.current?.focus({preventScroll:true});
    const top=panelRef.current?.getBoundingClientRect().top;
    if(top!==undefined&&top<80)scrollTo({top:scrollY+top-110,behavior:'smooth'});
  },[step,sent]);

  const counts=travellerTypes.find(t=>t.id===answers.travellers)?.counts;
  const duration=durations.find(d=>d.id===answers.duration);
  const budget=budgets.find(b=>b.id===answers.budget);
  // Tours of the chosen kinds; length and budget narrow them when an exact match exists.
  const {matches,exact}=useMemo(()=>{
    const categories=tripTypes.filter(t=>answers.types.includes(t.id)).flatMap(t=>t.categories);
    const ofKind=packages.filter(p=>categories.includes(p.category));
    const fits=p=>(p.category==='Day trip'||!duration?.range||(p.days>=duration.range[0]&&p.days<=duration.range[1]))&&(!budget||!p.price||p.price<=budget.max);
    const narrowed=ofKind.filter(fits);
    const middle=duration?.range?(duration.range[0]+Math.min(duration.range[1],16))/2:7;
    const list=(narrowed.length?narrowed:ofKind).slice().sort((a,b)=>Math.abs(a.days-middle)-Math.abs(b.days-middle)||(a.price||1e9)-(b.price||1e9));
    return {matches:list,exact:narrowed.length>0};
  },[answers.types,answers.duration,answers.budget,content.packages]);

  const ready=[
    answers.types.length>0,
    !!answers.travellers,
    !!answers.arrival&&answers.arrival>=today,
    !!answers.duration,
    !!answers.comfort,
    !!answers.budget,
    true,
    true,
  ];
  const next=()=>{if(ready[step])setStep(s=>Math.min(steps.length-1,s+1));};
  const back=()=>setStep(s=>Math.max(0,s-1));
  // Single-choice steps move on by themselves once an option is picked.
  const choose=(patch)=>{set(patch);setTimeout(()=>setStep(s=>Math.min(steps.length-1,s+1)),260);};
  const toggle=(key,id)=>set({[key]:answers[key].includes(id)?answers[key].filter(x=>x!==id):[...answers[key],id]});

  async function submit(event){
    event.preventDefault();
    setError('');setBusy(true);
    const form=Object.fromEntries(new FormData(event.target));
    const chosen=answers.tours.map(id=>packages.find(p=>p.id===id)).filter(Boolean);
    const data={...form,
      interests:tripTypes.filter(t=>answers.types.includes(t.id)).map(t=>t.label),
      travellers:answers.travellers||undefined,adults:answers.adults,children:answers.children,
      arrival:answers.arrival,departure:addDays(answers.arrival,duration?.nights??6),
      flexible:answers.flexible?'Yes':'No',duration:duration?.label,
      accommodation:answers.comfort,budget:answers.budget,budgetCurrency:'USD',
      package:chosen[0]?.id||'',selectedTrips:chosen.map(p=>p.name).join(', ')||'Custom trip',
      route:route?.name,language,displayCurrency:effectiveCurrency};
    try{const result=await sendEnquiry(data);setSent(result.id);}
    catch(e){setError(e.message);}
    finally{setBusy(false);}
  }

  const typeLabels=tripTypes.filter(t=>answers.types.includes(t.id)).map(t=>t.label);
  const dateLabel=answers.arrival&&new Date(answers.arrival+'T12:00:00').toLocaleDateString(locale,{day:'numeric',month:'long',year:'numeric'});
  const summary=[
    [Sparkles,'Trip',typeLabels.join(', ')],
    [Users,'Travellers',answers.travellers||step>1?<>{answers.travellers&&<>{answers.travellers} · </>}{answers.adults} {answers.adults===1?'adult':'adults'}{answers.children>0&&<>, {answers.children} {answers.children===1?'child':'children'}</>}</>:''],
    [CalendarDays,'Arrival',dateLabel?<>{dateLabel}{answers.flexible&&<> · flexible</>}</>:''],
    [Clock,'Length',duration?.label],
    [House,'Comfort',comforts.find(c=>c.id===answers.comfort)?.label],
    [Wallet,'Budget per person',budget?budget.label(formatPrice).join(' '):''],
    [Check,'Tours',step>=6?(answers.tours.length?answers.tours.map(id=>packages.find(p=>p.id===id)?.name).filter(Boolean).join(', '):'Custom trip'):''],
  ];

  if(sent)return <main className="tp">
    <div className="container tp-done" role="status">
      <span className="tp-done-icon"><Check size={34}/></span>
      <span className="eyebrow">ENQUIRY SENT</span>
      <h1>Let the adventure begin.</h1>
      <p>Thank you! A Tanzania Hugos Safaris travel specialist will contact you shortly with your personal itinerary and quote.</p>
      <p className="tp-reference">Your enquiry reference<strong>{sent}</strong></p>
      <div className="tp-done-actions">
        <a className="button" href={whatsapp(`Hello Tanzania Hugos Safaris, I submitted trip enquiry ${sent} and would like to discuss my itinerary.`)} target="_blank" rel="noreferrer"><MessageCircle size={17}/>Chat on WhatsApp</a>
        <Link className="button secondary" to="/">Back to the homepage</Link>
      </div>
    </div>
  </main>;

  const [question,hint]=steps[step];
  const last=step===steps.length-1;
  return <main className="tp">
    <div className="container tp-intro">
      <h1 className="eyebrow">PLAN MY TRIP</h1>
      <p>Answer a few quick questions and we will match you with tours, then tailor your trip together.</p>
    </div>
    <div className="container tp-layout">
      <section className="tp-panel" ref={panelRef} aria-labelledby="tp-question">
        <div className="tp-progress">
          <span>Step {step+1} of {steps.length}</span>
          <div className="tp-bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step+1} aria-label="Progress"><i style={{width:`${(step+1)/steps.length*100}%`}}/></div>
        </div>
        <h2 id="tp-question" ref={headingRef} tabIndex={-1}>{question}</h2>
        <p className="tp-hint">{hint}</p>

        {step===0&&<div className="tp-types">{tripTypes.map(type=>{const on=answers.types.includes(type.id);return <button type="button" key={type.id} className={'tp-type'+(on?' is-on':'')} aria-pressed={on} onClick={()=>toggle('types',type.id)}>
          <span className="tp-type-photo"><img {...photo(type.image,'(max-width: 700px) 45vw, 260px')} alt="" loading="lazy"/><span className="tp-tick" aria-hidden="true"><Check size={15}/></span></span>
          <strong>{type.label}</strong><small>{type.text}</small>
        </button>})}</div>}

        {step===1&&<>
          <div className="tp-options tp-options-5">{travellerTypes.map(t=>{const on=answers.travellers===t.id;return <button type="button" key={t.id} className={'tp-option'+(on?' is-on':'')} aria-pressed={on} onClick={()=>set({travellers:t.id,adults:t.adults,children:t.children})}><t.icon size={24} aria-hidden="true"/><strong>{t.id}</strong><small>{t.text}</small></button>})}</div>
          {counts&&Object.keys(counts).length>0&&<div className="tp-counters">
            {'adults' in counts&&<Counter label="Adults" note="18 years and over" value={answers.adults} min={counts.adults} onChange={adults=>set({adults})}/>}
            {'children' in counts&&<Counter label="Children" note="Under 18" value={answers.children} min={counts.children} onChange={children=>set({children})}/>}
          </div>}
        </>}

        {step===2&&<div className="tp-when">
          <label className="tp-date"><span>Arrival date</span><input type="date" min={today} value={answers.arrival} onChange={e=>set({arrival:e.target.value})}/></label>
          <label className="tp-check"><input type="checkbox" checked={answers.flexible} onChange={e=>set({flexible:e.target.checked})}/><span><strong>My dates are flexible</strong><small>We can suggest the best time for wildlife, weather and prices.</small></span></label>
          {answers.arrival&&answers.arrival<today&&<p className="error" role="alert">Please choose a date from today onwards.</p>}
        </div>}

        {step===3&&<div className="tp-options tp-options-3">{durations.map(d=>{const on=answers.duration===d.id;return <button type="button" key={d.id} className={'tp-option tp-option-row'+(on?' is-on':'')} aria-pressed={on} onClick={()=>choose({duration:d.id})}><Clock size={20} aria-hidden="true"/><strong>{d.label}</strong></button>})}</div>}

        {step===4&&<div className="tp-options tp-options-2">{comforts.map(c=>{const on=answers.comfort===c.id;return <button type="button" key={c.id} className={'tp-option tp-option-wide'+(on?' is-on':'')} aria-pressed={on} onClick={()=>choose({comfort:c.id})}><c.icon size={26} aria-hidden="true"/><span><strong>{c.label}</strong><small>{c.text}</small></span></button>})}</div>}

        {step===5&&<div className="tp-options tp-options-row">{budgets.map(b=>{const on=answers.budget===b.id;return <button type="button" key={b.id} className={'tp-option tp-option-row'+(on?' is-on':'')} aria-pressed={on} onClick={()=>choose({budget:b.id})}><Wallet size={20} aria-hidden="true"/><strong>{b.label(formatPrice).map((part,i)=><React.Fragment key={i}>{i>0&&' '}{part}</React.Fragment>)}</strong></button>})}
          {effectiveCurrency!=='USD'&&<p className="tp-note">Amounts are converted from US dollars and are approximate.</p>}
        </div>}

        {step===6&&<div className="tp-tours-step">
          {route&&<p className="tp-note"><Check size={15}/>Your chosen route: <strong>{route.name}</strong></p>}
          {matches.length>0?<>
            {!exact&&<p className="tp-note">No tour matches every answer exactly, so here are the closest. We will tailor one to you.</p>}
            <div className="tp-tours">{matches.map(p=>{const on=answers.tours.includes(p.id);return <button type="button" key={p.id} className={'tp-tour'+(on?' is-on':'')} aria-pressed={on} onClick={()=>toggle('tours',p.id)}>
              <span className="tp-tour-photo"><img {...photo(p.image,'(max-width: 700px) 45vw, 240px')} alt="" loading="lazy"/><span className="tp-tick" aria-hidden="true"><Check size={15}/></span></span>
              <span className="tp-tour-text"><small>{p.days===1?'1 day':p.days+' days'}</small><strong>{p.name}</strong><span>{p.price?<>From <Price amount={p.price}/></>:'Price on request'}</span></span>
            </button>})}</div>
          </>:<p className="tp-empty">We will plan this part of your trip personally. Continue to share your details.</p>}
          <button type="button" className={'tp-custom'+(answers.tours.length===0?' is-on':'')} aria-pressed={answers.tours.length===0} onClick={()=>set({tours:[]})}><Sparkles size={18} aria-hidden="true"/>None of these. Create a custom trip for me</button>
        </div>}

        {step===7&&<form id="tp-form" className="tp-form" onSubmit={submit}>
          <div className="tp-fields">
            <label>Full name<input name="name" autoComplete="name" required/></label>
            <label>Email address<input name="email" type="email" autoComplete="email" required/></label>
            <label>WhatsApp number<input name="whatsapp" type="tel" autoComplete="tel" placeholder="+255 …" required/></label>
            <label>Country<input name="country" autoComplete="country-name" required/></label>
          </div>
          {answers.types.includes('AFCON')&&<label>Match details<input name="match" placeholder="Teams, match dates or venue, if known"/></label>}
          <label>Anything else we should know?<textarea name="requests" rows="4" defaultValue={(params.get('requests')||'').slice(0,2000)} placeholder="Special occasions, places on your wishlist, dietary or accessibility needs…"/></label>
          <label>Preferred payment method<select name="payment"><option>Discuss available options</option><option>Card (subject to availability)</option><option>Bank transfer (subject to availability)</option><option>Mobile money (subject to availability)</option></select></label>
          <input className="honeypot" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true"/>
          <label className="consent"><input type="checkbox" required/>I agree to be contacted about my enquiry and have read the <Link to="/privacy-policy">privacy notice</Link>.</label>
          {error&&<p className="error" role="alert">{error}</p>}
        </form>}

        <div className="tp-nav">
          {step>0?<button type="button" className="tp-back" onClick={back}><ArrowLeft size={17}/>Back</button>:<span/>}
          {last?<button type="submit" form="tp-form" className="button" disabled={busy}>{busy?'Sending your enquiry…':'Send my trip request'}<ArrowUpRight size={18}/></button>
            :<button type="button" className="button" onClick={next} disabled={!ready[step]}>{step===6?'Continue to your details':'Continue'}<ArrowRight size={18}/></button>}
        </div>
      </section>

      <aside className="tp-summary">
        <h2>Your trip so far</h2>
        <ul>{summary.map(([Icon,label,value])=><li key={label} className={value?'':'is-empty'}><Icon size={17} aria-hidden="true"/><span><small>{label}</small>{value||'—'}</span></li>)}</ul>
      </aside>
    </div>
  </main>;
}

function Counter({label,note,value,min,onChange}){
  return <div className="tp-counter">
    <span><strong>{label}</strong><small>{note}</small></span>
    <div>
      <button type="button" onClick={()=>onChange(Math.max(min,value-1))} disabled={value<=min} aria-label={`Fewer ${label.toLowerCase()}`}><Minus size={16}/></button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={()=>onChange(Math.min(200,value+1))} disabled={value>=200} aria-label={`More ${label.toLowerCase()}`}><Plus size={16}/></button>
    </div>
  </div>;
}
