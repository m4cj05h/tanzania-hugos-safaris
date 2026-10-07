import {h} from '../../../locale';
import React from 'react';
import {Plus, Trash2, Star} from 'lucide-react';
import {useAdmin} from '../../context';
import {Field, Empty} from '../../ui';
import GoogleReviewsCard from './GoogleReviewsCard';

export default function ReviewsPage(){
  const {draft,setDraft}=useAdmin();
  const update=(index,key,value)=>setDraft(current=>({...current,reviews:current.reviews.map((r,i)=>i===index?{...r,[key]:value}:r)}));
  return <div>
    <GoogleReviewsCard/>
    <div className="admin-toolbar"><p className="admin-lead">Publish only real reviews, with the traveller’s permission. Reviews appear on the homepage.</p><button type="button" className="admin-primary" onClick={()=>setDraft(current=>({...current,reviews:[...current.reviews,{name:'',country:'',trip:'',text:'',rating:5}]}))}><Plus size={16}/>Add review</button></div>
    {!draft.reviews.length&&<Empty icon={Star} title="No reviews yet" text="When travellers share their experience, add it here."/>}
    <div className="review-cards">{draft.reviews.map((r,i)=><div className="review-card" key={i}>
      <div className="review-stars" role="radiogroup" aria-label="Rating">{[1,2,3,4,5].map(n=><button type="button" key={n} role="radio" aria-checked={r.rating===n} aria-label={n+' stars'} className={n<=r.rating?'on':''} onClick={()=>update(i,'rating',n)}>★</button>)}</div>
      <Field label="Review" rows={4} value={r.text} onChange={e=>update(i,'text',e.target.value)}/>
      <div className="admin-form-grid three"><Field label="Name" value={r.name} onChange={e=>update(i,'name',e.target.value)}/><Field label="Country" value={r.country} onChange={e=>update(i,'country',e.target.value)}/><Field label="Trip" value={r.trip} onChange={e=>update(i,'trip',e.target.value)}/></div>
      <div className="admin-row-actions"><button type="button" className="danger" onClick={()=>setDraft(current=>({...current,reviews:current.reviews.filter((_,j)=>j!==i)}))}><Trash2 size={15}/>Remove review</button></div>
    </div>)}</div>
  </div>;
}
