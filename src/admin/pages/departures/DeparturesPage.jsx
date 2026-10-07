import {useState} from 'react';
import {useAdmin} from '../../context';
import {AlertCircle, ArrowDown, ArrowUp, Plus, Trash2, X} from 'lucide-react';
import {getAnnouncements, departureTrips, departureTrip, departureEndDate} from '../../../announcements';
import {TrekIcon, featureIcon, featureIconChoices} from '../../../trekIcons';
import {h} from '../../../locale';

// What still stops this departure from being published, in plain words.
const departureProblems=item=>[
  !item.route?.trim()&&'Add a trip name.',
  !(Number.isInteger(item.days)&&item.days>=1&&item.days<=30)&&'Number of days must be between 1 and 30.',
  !item.startDate&&'Choose a start date.',
  !item.endDate&&'Choose an end date.',
  item.startDate&&item.endDate&&item.endDate<item.startDate&&'The end date is before the start date.',
  !(item.price>=0)&&'Enter a price.',
  !(item.deposit>=0)&&'Enter a deposit.',
].filter(Boolean);

// One row per feature line, each with its own icon. Lines and icons are saved side by side.
function FeatureList({item,onChange}){
  const [picking,setPicking]=useState(null);
  const lines=item.features?item.features.split('\n'):[];
  const icons=lines.map((_,index)=>item.featureIcons?.[index]||'');
  const save=(nextLines,nextIcons)=>onChange({features:nextLines.join('\n'),featureIcons:nextIcons});
  const choose=(index,icon)=>{save(lines,icons.map((value,i)=>i===index?icon:value));setPicking(null);};
  return <div className="editor-wide departure-features"><span className="departure-features-label">Trip features</span>
    {lines.map((line,index)=><div className="departure-feature" key={index}>
      <button type="button" className={'departure-icon-button'+(icons[index]?'':' is-auto')} aria-label={`Choose icon for feature ${index+1}`} aria-expanded={picking===index} onClick={()=>setPicking(picking===index?null:index)}><TrekIcon name={icons[index]||featureIcon(line)} size={22}/></button>
      <input maxLength={70} value={line} placeholder="Guided group climb" aria-label={`Feature ${index+1}`} onChange={e=>save(lines.map((value,i)=>i===index?e.target.value.replace(/\n/g,' '):value),icons)}/>
      <button type="button" className="departure-feature-remove" aria-label={`Remove feature ${index+1}`} onClick={()=>{save(lines.filter((_,i)=>i!==index),icons.filter((_,i)=>i!==index));setPicking(null);}}><X size={16}/></button>
      {picking===index&&<div className="departure-icon-picker" role="group" aria-label="Feature icons">
        <button type="button" aria-pressed={!icons[index]} onClick={()=>choose(index,'')}><TrekIcon name={featureIcon(line)} size={22}/><span>Automatic</span></button>
        {featureIconChoices.map(([name,label])=><button type="button" key={name} aria-pressed={icons[index]===name} onClick={()=>choose(index,name)}><TrekIcon name={name} size={22}/><span>{label}</span></button>)}
      </div>}
    </div>)}
    <button type="button" className="departure-feature-add" disabled={lines.length>=8} onClick={()=>save([...lines,''],[...icons,''])}><Plus size={15}/>Add feature</button>
    <small>Click an icon to change it. “Automatic” picks one from the words in the feature.</small>
  </div>;
}

export default function DeparturesPage(){const{draft,setDraft}=useAdmin();
  const announcements=getAnnouncements(draft);
  const change=transform=>setDraft(current=>({...current,announcements:transform(getAnnouncements(current))}));
  const patch=(id,fields)=>change(items=>items.map(item=>item.id===id?{...item,...fields}:item));
  const update=(id,key,value)=>patch(id,{[key]:value});
  const move=(index,direction)=>change(items=>{const next=[...items];[next[index],next[index+direction]]=[next[index+direction],next[index]];return next;});
  return <div className="announcement-editor"><div className="section-heading"><div><h2>Group departure announcements</h2><p>Add scheduled Kilimanjaro climbs, safaris and Zanzibar trips. Each one appears on its own page, where travellers can filter by year and month, then send a pre-filled joining request.</p></div></div>
    {announcements.map((item,index)=>{const problems=departureProblems(item);return <details className="editor-item" key={item.id} open={problems.length&&item.published?true:undefined}><summary><span>{index+1}. {departureTrip(item)} · {item.route||'New departure'} · {item.startDate||'Choose date'}</span><span>{problems.length?<span className="departure-attention">Needs attention</span>:item.published?'Published':'Draft'}</span></summary><div className="editor-form form-grid">
      {problems.length>0&&<div className="admin-message is-error editor-wide departure-problems" role="alert"><AlertCircle size={17}/><div><strong>This departure can’t be published yet</strong><ul>{problems.map(problem=><li key={problem}>{problem}</li>)}</ul></div></div>}
      <div className="slide-actions"><button type="button" disabled={index===0} onClick={()=>move(index,-1)}><ArrowUp size={16}/>Move up</button><button type="button" disabled={index===announcements.length-1} onClick={()=>move(index,1)}><ArrowDown size={16}/>Move down</button><button type="button" onClick={()=>{if(window.confirm('Remove this departure? Publish changes to update the website.'))change(items=>items.filter(entry=>entry.id!==item.id));}}><Trash2 size={16}/>Remove</button></div>
      <label>Trip type<select value={departureTrip(item)} onChange={e=>update(item.id,'trip',e.target.value)}>{departureTrips.map(trip=><option key={trip} value={trip}>{trip==='Safari'?'Safari':trip==='Zanzibar'?'Zanzibar trip':'Kilimanjaro climb'}</option>)}</select><small>Shown on the {departureTrip(item)==='Safari'?'Safaris':departureTrip(item)==='Zanzibar'?'Zanzibar':'Kilimanjaro'} page.</small></label><label>Trip name<input maxLength={140} value={item.route||''} placeholder={departureTrip(item)==='Safari'?'Serengeti & Ngorongoro group safari':departureTrip(item)==='Zanzibar'?'Stone Town & beach escape':'Kilimanjaro via Lemosho route'} onChange={e=>update(item.id,'route',e.target.value)}/></label><label>Number of days<input type="number" min="1" max="30" value={item.days||''} onChange={e=>{const days=Number(e.target.value);patch(item.id,{days,endDate:departureEndDate(item.startDate,days)||item.endDate});}}/></label>
      <label>Start date<input type="date" value={item.startDate||''} onChange={e=>patch(item.id,{startDate:e.target.value,endDate:departureEndDate(e.target.value,item.days)||item.endDate})}/></label><label>End date<input type="date" min={item.startDate||undefined} value={item.endDate||''} aria-invalid={!!(item.endDate&&item.startDate&&item.endDate<item.startDate)} onChange={e=>update(item.id,'endDate',e.target.value)}/><small>Filled in from the start date and number of days. Change it if needed.</small></label>
      <label>Price per person (USD)<input type="number" min="0" step="1" value={item.price??''} onChange={e=>update(item.id,'price',Number(e.target.value))}/></label><label>Deposit (USD)<input type="number" min="0" step="1" value={item.deposit??100} onChange={e=>update(item.id,'deposit',Number(e.target.value))}/></label>
      <FeatureList item={item} onChange={fields=>patch(item.id,fields)}/>
      <label className="consent editor-wide"><input type="checkbox" checked={!!item.published} onChange={e=>update(item.id,'published',e.target.checked)}/>Published on website</label>
    </div></details>})}
    {!announcements.length&&<div className="empty-state"><h3>No departures yet</h3><p>Add your first scheduled climb, complete its details, then publish the changes.</p></div>}
    <button type="button" className="button secondary" disabled={announcements.length>=40} onClick={()=>change(items=>[...items,{id:crypto.randomUUID(),trip:'Kilimanjaro',route:'Kilimanjaro via Lemosho route',days:7,startDate:'',endDate:'',price:0,deposit:100,features:'High-Altitude Drop-Off',featureIcons:[''],published:false}])}><Plus size={16}/>Add departure</button>
  </div>;
}
