import {h} from '../../../locale';
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus, Search, ChevronDown, Copy, Trash2, ArrowUpRight, Compass} from 'lucide-react';
import {useAdmin} from '../../context';
import {Field, Toggle, Empty} from '../../ui';
import MediaLibrary from '../../components/MediaLibrary';
import {categories} from '../../../data';
import {homeGroupLabel} from '../../../home-content';
import './trips.css';

const groups=categories.slice(1);
const lines=value=>Array.isArray(value)?value.join('\n'):value||'';

// Every trip on the website, grouped like the public pages (Safaris, Day trips, Zanzibar…).
export default function TripsPage(){
  const {draft,setDraft}=useAdmin();
  const [query,setQuery]=useState(''),[group,setGroup]=useState('All'),[status,setStatus]=useState('All'),[open,setOpen]=useState('');
  const update=(id,key,value)=>setDraft(current=>({...current,packages:current.packages.map(p=>p.id===id?{...p,[key]:value}:p)}));
  const add=(trip)=>{setDraft(current=>({...current,packages:[trip,...current.packages]}));setOpen(trip.id);setQuery('');setStatus('All');setGroup(trip.category);};
  const matches=p=>(group==='All'||p.category===group)&&(status==='All'||(status==='Published')===!!p.published)&&(p.name+' '+p.destinations).toLowerCase().includes(query.toLowerCase());
  const visible=draft.packages.filter(matches);
  const shownGroups=(group==='All'?groups:[group]).filter(name=>visible.some(p=>p.category===name));

  return <div className="trips-admin">
    <div className="trips-toolbar">
      <label className="admin-search"><Search size={17}/><input type="search" aria-label="Search trips" placeholder="Search trips or places…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <select aria-label="Show trips" value={status} onChange={e=>setStatus(e.target.value)}><option value="All">All trips</option><option>Published</option><option value="Draft">Drafts</option></select>
      <button type="button" className="admin-primary" onClick={()=>add({id:'trip-'+Date.now(),name:'New trip',category:group==='All'?'Safari':group,days:3,price:0,destinations:'Tanzania',image:'safari.webp',description:'',highlights:[],itinerary:['Day 1: Arrival — Meet your guide and settle in.'],accommodation:'Lodge or camp, confirmed in your quotation',included:'',excluded:'',bestTime:'',published:false})}><Plus size={16}/>Add trip</button>
    </div>
    <div className="trips-chips" role="group" aria-label="Filter by group">{['All',...groups].map(name=><button type="button" key={name} aria-pressed={group===name} onClick={()=>setGroup(name)}>{name==='All'?'Everything':homeGroupLabel(name)}<span>{draft.packages.filter(p=>name==='All'||p.category===name).length}</span></button>)}</div>

    {!visible.length&&<Empty icon={Compass} title="No trips match" text="Try another search or group, or add a new trip."/>}
    {shownGroups.map(name=><section className="trips-group" key={name}>
      <h2>{homeGroupLabel(name)} <span>{visible.filter(p=>p.category===name).length}</span></h2>
      {visible.filter(p=>p.category===name).map(p=><details className="admin-row trip-row" key={p.id} open={open===p.id} onToggle={e=>{if(e.currentTarget.open)setOpen(p.id);else if(open===p.id)setOpen('');}}>
        <summary>
          <img src={'/images/'+p.image} alt=""/>
          <span className="admin-row-title"><strong>{p.name}</strong><small>{p.days===1?'1 day':p.days+' days'} · {p.price?'From $'+Number(p.price).toLocaleString():'Price on request'} · {p.destinations}</small></span>
          <span className={'admin-pill '+(p.published?'is-live':'is-draft')}>{p.published?'Published':'Draft'}</span>
          <ChevronDown className="admin-row-chevron" size={18}/>
        </summary>
        {open===p.id&&<div className="admin-row-body trip-editor">
          <div className="trip-editor-top">
            <Toggle checked={p.published} onChange={value=>update(p.id,'published',value)} label={p.published?'Published on website':'Draft — hidden from visitors'}/>
            <div className="admin-row-actions">
              {p.published&&<Link to={'/packages/'+p.id} target="_blank" rel="noreferrer"><ArrowUpRight size={15}/>View page</Link>}
              <button type="button" onClick={()=>add({...structuredClone(p),id:'trip-'+Date.now(),name:p.name+' (copy)',published:false})}><Copy size={15}/>Duplicate</button>
              <button type="button" className="danger" onClick={()=>{if(window.confirm('Delete “'+p.name+'”? Publish changes to remove it from the website.'))setDraft(current=>({...current,packages:current.packages.filter(x=>x.id!==p.id)}));}}><Trash2 size={15}/>Delete</button>
            </div>
          </div>
          <h3>Basics</h3>
          <div className="admin-form-grid three">
            <Field className="admin-wide" label="Trip name" value={p.name} onChange={e=>update(p.id,'name',e.target.value)}/>
            <Field label="Group"><select value={p.category} onChange={e=>update(p.id,'category',e.target.value)}>{groups.map(c=><option key={c} value={c}>{homeGroupLabel(c)}</option>)}</select></Field>
            <Field label="Days" type="number" min={1} value={p.days} onChange={e=>update(p.id,'days',Number(e.target.value))}/>
            <Field label="Starting price (USD)" hint="0 shows “Price on request”." type="number" min={0} value={p.price} onChange={e=>update(p.id,'price',Number(e.target.value))}/>
            <Field className="admin-wide" label="Places visited" hint="Separate with “·”, e.g. Arusha · Serengeti · Ngorongoro" value={p.destinations} onChange={e=>update(p.id,'destinations',e.target.value)}/>
            <Field label="Accommodation" value={p.accommodation} onChange={e=>update(p.id,'accommodation',e.target.value)}/>
            <Field label="Best time to visit" value={p.bestTime||''} onChange={e=>update(p.id,'bestTime',e.target.value)}/>
          </div>
          <h3>Photo</h3>
          <MediaLibrary compact label="Trip photo" value={p.image} onSelect={image=>update(p.id,'image',image)}/>
          <h3>Story</h3>
          <div className="admin-form-grid">
            <Field className="admin-wide" label="Description" rows={4} value={p.description} onChange={e=>update(p.id,'description',e.target.value)}/>
            <Field className="admin-wide" label="Highlights" hint="One per line." rows={4} value={lines(p.highlights)} onChange={e=>update(p.id,'highlights',e.target.value.split('\n'))}/>
            <Field className="admin-wide" label="Day-by-day plan" hint="One day per line, e.g. “Day 2: Serengeti — Full day of game drives.”" rows={8} value={lines(p.itinerary)} onChange={e=>update(p.id,'itinerary',e.target.value.split('\n'))}/>
          </div>
          <h3>What’s included</h3>
          <div className="admin-form-grid">
            <Field label="Included" hint="One per line." rows={6} value={p.included} onChange={e=>update(p.id,'included',e.target.value)}/>
            <Field label="Not included" hint="One per line." rows={6} value={p.excluded} onChange={e=>update(p.id,'excluded',e.target.value)}/>
          </div>
        </div>}
      </details>)}
    </section>)}
  </div>;
}
