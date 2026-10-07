import {h} from '../../../locale';
import React, {useState} from 'react';
import {Mail, Search, ChevronDown, MessageCircle, ArrowUpRight} from 'lucide-react';
import {useAdmin} from '../../context';
import {api} from '../../api';
import {Empty} from '../../ui';
import './enquiries.css';

export const statuses=['New','Contacted','Quoted','Confirmed','Closed'];
const labels={email:'Email',whatsapp:'WhatsApp',country:'Country',arrival:'Arrival',departure:'Departure',travellers:'Travelling as',adults:'Adults',children:'Children',duration:'Trip length',flexible:'Flexible dates',interests:'Interests',selectedTrips:'Chosen tours',package:'Trip',route:'Kilimanjaro route',accommodation:'Comfort level',budget:'Budget',match:'Match details',payment:'Payment preference',requests:'Requests'};
export const statusClass=status=>'status-'+String(status).toLowerCase();
// Enquiries store the trip id; show its name when we know it.
export const tripLabel=(e,packages)=>packages.find(p=>p.id===e.package)?.name||e.package||e.interests;
export const formatDate=value=>value?new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';

export default function EnquiriesPage(){
  const {draft,enquiries,setEnquiries,notify}=useAdmin();
  const [filter,setFilter]=useState('All'),[query,setQuery]=useState('');
  const visible=enquiries.filter(e=>(filter==='All'||e.status===filter)&&[e.name,e.email,e.package,e.interests].join(' ').toLowerCase().includes(query.toLowerCase()));
  async function setStatus(e,status){try{await api('admin/enquiries/'+e.id,{method:'PATCH',body:JSON.stringify({status})});setEnquiries(items=>items.map(x=>x.id===e.id?{...x,status}:x));}catch(err){notify(err.message,'error');}}
  return <div className="enquiries-admin">
    <div className="trips-toolbar"><label className="admin-search"><Search size={17}/><input type="search" aria-label="Search enquiries" placeholder="Search by name, email or trip…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <div className="trips-chips" role="group" aria-label="Filter by status">{['All',...statuses].map(s=><button type="button" key={s} aria-pressed={filter===s} onClick={()=>setFilter(s)}>{s==='All'?'Everything':s}<span>{enquiries.filter(e=>s==='All'||e.status===s).length}</span></button>)}</div>
    {!enquiries.length?<Empty icon={Mail} title="Your next adventure starts here." text="New traveller enquiries appear here as soon as they are sent."/>:!visible.length?<Empty icon={Search} title="No enquiries match" text="Try another status or search."/>:visible.map(e=><details className="admin-row enquiry-row" key={e.id}>
      <summary><span className="enquiry-avatar" aria-hidden="true">{(e.name||'?').trim().charAt(0).toUpperCase()}</span><span className="admin-row-title"><strong>{e.name}</strong><small>{[tripLabel(e,draft.packages),formatDate(e.created)].filter(Boolean).join(' · ')}</small></span><span className={'admin-pill '+statusClass(e.status)}>{e.status}</span><ChevronDown className="admin-row-chevron" size={18}/></summary>
      <div className="admin-row-body">
        <dl className="enquiry-facts">{Object.entries(labels).filter(([key])=>e[key]!==undefined&&e[key]!==''&&!(Array.isArray(e[key])&&!e[key].length)).map(([key,label])=><div key={key} className={['requests','interests'].includes(key)?'wide':''}><dt>{label}</dt><dd>{Array.isArray(e[key])?e[key].join(', '):key==='arrival'||key==='departure'?formatDate(e[key]):key==='package'?tripLabel(e,draft.packages):String(e[key])}</dd></div>)}</dl>
        <div className="enquiry-actions">
          <label>Status<select value={e.status} onChange={ev=>setStatus(e,ev.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
          <a className="admin-ghost" href={'mailto:'+e.email}><Mail size={15}/>Reply by email</a>
          {e.whatsapp&&<a className="admin-ghost" href={'https://wa.me/'+String(e.whatsapp).replace(/\D/g,'')} target="_blank" rel="noreferrer"><MessageCircle size={15}/>WhatsApp <ArrowUpRight size={13}/></a>}
          <small>Reference {e.id}</small>
        </div>
      </div>
    </details>)}
  </div>;
}
