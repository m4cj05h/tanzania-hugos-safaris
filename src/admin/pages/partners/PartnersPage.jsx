import {useAdmin} from '../../context';
import {h} from '../../../locale';
import React from 'react';
import {ArrowDown, ArrowUp, Plus, Trash2} from 'lucide-react';
import MediaLibrary from '../../components/MediaLibrary';
import {getPartners} from '../../../partners.js';

export default function PartnersPage(){const{draft,setDraft}=useAdmin();
  const partners=getPartners(draft);
  const change=transform=>setDraft(current=>({...current,partners:transform(getPartners(current))}));
  const update=(id,key,value)=>change(items=>items.map(item=>item.id===id?{...item,[key]:value}:item));
  const move=(index,direction)=>change(items=>{const next=[...items];[next[index],next[index+direction]]=[next[index+direction],next[index]];return next;});
  return <div className="partners-editor">
    <h2>Homepage partner slideshow</h2>
    <p>Up to four logos appear at a time in the order below. Upload or choose a logo, then publish your changes.</p>
    {partners.map((partner,index)=><div className="partner-editor-row" key={partner.id}>
      <img src={'/images/'+partner.image} alt=""/>
      <div className="partner-editor-fields"><label>Partner name<input maxLength={120} value={partner.name} onChange={e=>update(partner.id,'name',e.target.value)}/></label><MediaLibrary compact label="Partner logo" value={partner.image} onSelect={image=>update(partner.id,'image',image)}/></div>
      <div className="partner-editor-actions"><button type="button" disabled={index===0} onClick={()=>move(index,-1)} aria-label={'Move '+partner.name+' up'}><ArrowUp size={16}/>Up</button><button type="button" disabled={index===partners.length-1} onClick={()=>move(index,1)} aria-label={'Move '+partner.name+' down'}><ArrowDown size={16}/>Down</button><button type="button" onClick={()=>change(items=>items.filter(item=>item.id!==partner.id))} aria-label={'Remove '+partner.name}><Trash2 size={16}/>Remove</button></div>
    </div>)}
    <button type="button" className="button secondary" disabled={partners.length>=24} onClick={()=>change(items=>[...items,{id:crypto.randomUUID(),name:'New partner',image:'partners/safari-booking.webp'}])}><Plus size={16}/>Add partner</button>
  </div>;
}
