import {h} from '../../../locale';
import React from 'react';
import {ChevronDown} from 'lucide-react';
import {useAdmin} from '../../context';
import {Field, Card} from '../../ui';
import MediaLibrary from '../../components/MediaLibrary';

// Every card in “Find your Kilimanjaro route”, including Northern Circuit (which has no itinerary yet).
const cardRoutes=[['machame','Machame'],['lemosho','Lemosho'],['marangu','Marangu'],['northern-circuit','Northern Circuit'],['rongai','Rongai'],['umbwe','Umbwe']];

// The route cards and route detail pages on /kilimanjaro.
export default function KilimanjaroRoutesPage(){
  const {draft,setDraft}=useAdmin();
  const update=(slug,key,value)=>setDraft(current=>({...current,kilimanjaroRoutes:current.kilimanjaroRoutes.map(route=>route.slug===slug?{...route,[key]:value}:route)}));
  const setPhoto=(slug,image)=>setDraft(current=>({...current,routeCardImages:{...current.routeCardImages,[slug]:image}}));
  return <div>
    <Card title="Route card photos" text="The photo on each card in “Find your Kilimanjaro route”. Routes without a photo show their map.">
      <div className="route-photo-grid">{cardRoutes.map(([slug,name])=><div key={slug}><MediaLibrary compact label={`${name} route photo`} value={draft.routeCardImages?.[slug]||''} onSelect={image=>setPhoto(slug,image)}/>{draft.routeCardImages?.[slug]&&<button type="button" className="route-photo-clear" onClick={()=>setPhoto(slug,'')}>Show the map instead</button>}</div>)}</div>
    </Card>
    <p className="admin-lead">Edit what visitors see after choosing “More about this trip”. Prices are starting prices per person in USD; enter 0 to show “Price on request”.</p>
    {(draft.kilimanjaroRoutes||[]).map(route=><details className="admin-row" key={route.slug}>
      <summary><span className="admin-row-icon"><img src="/images/kilimanjaro/icons/climb.webp" alt=""/></span><span className="admin-row-title"><strong>{route.name}</strong><small>{route.days} days · {route.price?'From $'+route.price.toLocaleString():'Price on request'}</small></span><ChevronDown className="admin-row-chevron" size={18}/></summary>
      <div className="admin-row-body"><div className="admin-form-grid three">
        <Field label="Route name" value={route.name} onChange={e=>update(route.slug,'name',e.target.value)}/>
        <Field label="Days" type="number" min={1} value={route.days} onChange={e=>update(route.slug,'days',Number(e.target.value))}/>
        <Field label="Starting price (USD)" hint="0 shows “Price on request”." type="number" min={0} value={route.price} onChange={e=>update(route.slug,'price',Number(e.target.value))}/>
        <Field className="admin-wide" label="Introduction" rows={5} value={route.overview} onChange={e=>update(route.slug,'overview',e.target.value)}/>
        <Field className="admin-wide" label="Day-by-day plan" hint="One day per line." rows={9} value={route.itinerary.join('\n')} onChange={e=>update(route.slug,'itinerary',e.target.value.split('\n').filter(Boolean))}/>
      </div></div>
    </details>)}
  </div>;
}
