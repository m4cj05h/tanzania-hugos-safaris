import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Check,ChevronDown,Globe,Search,Wallet,X} from 'lucide-react';
import {h,useLocale,languages,currencies} from './locale';
import './regional-settings.css';

const normalize=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase();
export default function RegionalSettings({onOpen}){
 const {language,currency,setLanguage,setCurrency,t}=useLocale();
 const [section,setSection]=useState(null),[keyboard,setKeyboard]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0),[position,setPosition]=useState({});
 const root=useRef(null),input=useRef(null),trigger=useRef(null),list=useRef(null);
 const isLanguage=section==='language';
 const selected=languages.find(item=>item.code===language);
 const options=(isLanguage?languages:currencies).filter(item=>normalize(`${item.code} ${item.name} ${item.englishName||''}`).includes(normalize(query.trim())));
 const close=(restoreFocus=false)=>{setSection(null);if(restoreFocus)trigger.current?.focus()};
 const open=(next,event)=>{
  if(section===next){close();return}
  onOpen?.();trigger.current=event.currentTarget;setQuery('');setActive(0);setKeyboard(false);setSection(next);
 };
 // Only keyboard picks hand focus back to the trigger, so mouse picks don't leave a focus ring on it.
 const choose=(code,restoreFocus=false)=>{if(isLanguage)setLanguage(code);else setCurrency(code);close(restoreFocus)};
 useEffect(()=>{
  if(!section)return;
  input.current?.focus();
  const outside=event=>{if(!root.current?.contains(event.target))setSection(null)};
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[section]);
 useLayoutEffect(()=>{
  if(!section)return;
  const place=()=>{const rect=root.current.getBoundingClientRect();const width=Math.min(370,window.innerWidth-32);setPosition({width,left:Math.max(16,Math.min(rect.right-width,window.innerWidth-width-16)),top:rect.bottom+10,maxHeight:`calc(100dvh - ${rect.bottom+26}px)`})};
  place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
  return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true)};
 },[section]);
 useEffect(()=>{list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({block:'nearest'})},[active,query]);
 const navigate=event=>{
  if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();setKeyboard(true);setActive(index=>options.length?(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length:0)}
  if(event.key==='Enter'&&options[active]){event.preventDefault();choose(options[active].code,true)}
 };
 return <div className="regional-selectors" ref={root} onBlurCapture={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))close()}} onKeyDown={event=>{if(event.key==='Escape'&&section){event.stopPropagation();event.preventDefault();close(true)}}}>
  <button type="button" className="region-trigger currency-trigger" aria-label={`Currency: ${currency}`} aria-expanded={section==='currency'} aria-haspopup="dialog" aria-controls={section==='currency'?'regional-picker':undefined} onClick={event=>open('currency',event)}><Wallet size={14}/><span data-no-translate>{currency}</span><ChevronDown size={12}/></button>
  <span className="regional-divider" aria-hidden="true"/>
  <button type="button" className="region-trigger language-trigger" aria-label={`Language: ${selected.name}`} aria-expanded={section==='language'} aria-haspopup="dialog" aria-controls={section==='language'?'regional-picker':undefined} onClick={event=>open('language',event)}><Globe size={14}/><span className="region-current-name" data-no-translate>{selected.name}</span><ChevronDown size={12}/></button>
  {section&&<section id="regional-picker" className="regional-picker" role="dialog" aria-label={isLanguage?'Choose your language':'Choose your currency'} style={position}>
   <div className="regional-search"><Search size={17} aria-hidden="true"/><input ref={input} role="combobox" aria-label={isLanguage?'Search languages':'Search currencies'} aria-autocomplete="list" aria-expanded="true" aria-controls="regional-results" aria-activedescendant={options[active]?`regional-option-${options[active].code}`:undefined} placeholder={isLanguage?'Search language or code…':'Search currency or code…'} autoComplete="off" spellCheck={false} value={query} onChange={event=>{setQuery(event.target.value);setActive(0)}} onKeyDown={navigate}/>{query&&<button type="button" aria-label="Clear search" onClick={()=>{setQuery('');setActive(0);input.current?.focus()}}><X size={14}/></button>}<button type="button" aria-label="Close preferences" onClick={()=>close(true)}><X size={17}/></button></div>
   <div className="regional-results-heading"><span className="regional-results-label">{query?<Search size={14} aria-hidden="true"/>:isLanguage?<Globe size={14} aria-hidden="true"/>:<Wallet size={14} aria-hidden="true"/>}{query?'SEARCH RESULTS':isLanguage?'ALL LANGUAGES':'ALL CURRENCIES'}</span><span role="status" data-no-translate>{options.length} {t('available')}</span></div>
   <div className="regional-results" id="regional-results" role="listbox" aria-label={isLanguage?'Languages':'Currencies'} ref={list}>
    {options.map((item,index)=>{const chosen=item.code===(isLanguage?language:currency);return <div key={item.code} id={`regional-option-${item.code}`} role="option" aria-selected={chosen} data-code={item.code} data-index={index} className={`regional-result${chosen?' is-selected':''}${keyboard&&index===active?' is-active':''}`} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(item.code)}><span className="regional-option-badge regional-flag" data-no-translate aria-hidden="true">{item.flag||(isLanguage?<Globe size={18}/>:item.symbol)}</span><span className="regional-option-copy"><strong data-no-translate dir="auto">{item.name}</strong><small data-no-translate>{isLanguage?item.englishName:<>{item.code}{item.symbol!==item.code&&<> · {item.symbol}</>}</>}</small></span>{chosen&&<span className="regional-selected-check" aria-hidden="true"><Check size={13} strokeWidth={3}/></span>}</div>})}
   </div>
   {!options.length&&<div className="regional-empty"><Search size={24}/><strong>No matches found</strong><p>Try another name or a two- or three-letter code.</p><button type="button" onClick={()=>{setQuery('');setActive(0);input.current?.focus()}}>Clear search</button></div>}
  </section>}
 </div>;
}
