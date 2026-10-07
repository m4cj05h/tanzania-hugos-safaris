import {h} from '../../../locale';
import React, {useEffect, useState} from 'react';
import {CheckCircle2, AlertCircle, Info} from 'lucide-react';
import {useAdmin} from '../../context';
import {api} from '../../api';
import {Card, Field} from '../../ui';

// Connects the website to the business's Google rating. Live data needs GOOGLE_PLACES_API_KEY on the server.
export default function GoogleReviewsCard(){
  const {draft,setDraft}=useAdmin();
  const settings=draft.googleReviews||{};
  const [status,setStatus]=useState(null);
  useEffect(()=>{api('admin/google-reviews').then(setStatus).catch(()=>setStatus({error:true}))},[]);
  const update=(key,value)=>setDraft(current=>({...current,googleReviews:{placeId:'',url:'',rating:null,count:null,...current.googleReviews,[key]:value}}));
  const number=(value,parse)=>value===''?null:parse(value);
  const preview=status?.preview;
  const state=!status?null:status.error?['warn','The connection status could not be loaded.']
    :preview?.source==='google'?['ok',`Live from Google: ★ ${preview.rating.toFixed(1)} from ${preview.count} reviews${preview.reviews.length?`, showing the latest ${preview.reviews.length}`:''}. Updates once a day.`]
    :preview?.source==='saved'?['ok',`Showing the ★ ${preview.rating.toFixed(1)} rating and ${preview.reviews.length} reviews copied from your previous website. Connect Google to keep them up to date automatically.`]
    :!status.keyConfigured?['info','Not connected to Google yet. Your server needs a Google Places API key (GOOGLE_PLACES_API_KEY). Until then the website shows the rating you type below.']
    :!settings.placeId?['info','Add your Google Place ID and publish to show your live Google rating.']
    :status.lastError?['warn',`Google did not return your rating: ${status.lastError}`]
    :['info','Publish your changes, then reload this page to check the connection.'];
  const Icon=state&&{ok:CheckCircle2,warn:AlertCircle,info:Info}[state[0]];
  return <Card title="Google rating" text="Show your Google star rating in the website footer and your latest Google reviews on the homepage.">
    {state&&<p className={'google-admin-status is-'+state[0]} role="status"><Icon size={17}/>{state[1]}</p>}
    <div className="admin-form-grid">
      <Field label="Google Place ID" value={settings.placeId||''} maxLength={200} placeholder="ChIJ…" onChange={e=>update('placeId',e.target.value.trim())} hint={<>Find it by searching your business name in <a href="https://developers.google.com/maps/documentation/places/web-service/place-id#find-id" target="_blank" rel="noopener noreferrer">Google’s Place ID Finder</a>.</>}/>
      <Field label="Link to your Google reviews" type="url" value={settings.url||''} maxLength={500} placeholder="https://maps.app.goo.gl/…" onChange={e=>update('url',e.target.value.trim())} hint="Optional. Visitors open this when they click your rating."/>
      <Field label="Rating to show until Google is connected" type="number" min="1" max="5" step="0.1" value={settings.rating??''} onChange={e=>update('rating',number(e.target.value,Number))} hint="Copy it exactly from your Google profile, e.g. 4.9."/>
      <Field label="Number of Google reviews" type="number" min="0" step="1" value={settings.count??''} onChange={e=>update('count',number(e.target.value,value=>Math.round(Number(value))))} hint="Leave both empty to hide the rating until Google is connected."/>
    </div>
  </Card>;
}
