import {useAdmin} from '../../context';
import React,{useState}from'react';
import{h,translate}from '../../../locale';
import{getHome}from '../../../home-content';
// Every piece of homepage text, so it can be translated too.
const homeText=home=>[home.intro,home.afcon,home.escape,home.story].flatMap(part=>Object.values(part).filter(v=>typeof v==='string'&&!/\.(webp|png|jpe?g)$/.test(v)).flatMap(v=>v.split('\n'))).concat(home.journeys.title,home.journeys.highlight,home.experiences.flatMap(x=>[x.title,x.text]),home.faqs.flatMap(f=>[f.question,f.answer]));
export default function TranslationsPage(){const{draft,setDraft}=useAdmin();
 const sources=[...new Set([...(draft.heroTitle||'').split('\n'),draft.heroSubtitle,draft.announcement,...homeText(getHome(draft)),...draft.packages.flatMap(p=>[p.name,p.description,p.accommodation,p.included,p.excluded,...p.itinerary]),...draft.articles.flatMap(a=>[a.title,a.category,...a.body.split('\n\n')])].filter(Boolean))];
 const[source,setSource]=useState(sources[0]||'');
 return <div className="editor-form"><h2>Content translations</h2><p>Choose an English source and enter its translations. Publish changes to update every page using this text. New content without a translation stays in English.</p><label>English source<select value={source} onChange={e=>setSource(e.target.value)}>{sources.map(s=><option key={s} value={s}>{s.length>100?s.slice(0,100)+'…':s}</option>)}</select></label><textarea aria-label="English source text" value={source} readOnly rows="3"/>{[['fr','Français'],['de','Deutsch'],['es','Español']].map(([code,name])=>{const fallback=translate(source,code);return <label key={code}>{name}<textarea lang={code} rows="4" value={draft.translations?.[code]?.[source]??(fallback===source?'':fallback)} onChange={e=>setDraft({...draft,translations:{...draft.translations,[code]:{...draft.translations?.[code],[source]:e.target.value}}})}/></label>})}</div>;
}
