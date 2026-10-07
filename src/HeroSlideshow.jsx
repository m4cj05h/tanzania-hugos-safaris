import {h, useLocale, LocaleProvider, Price, CurrencyNotice} from './locale';
import React, {useEffect, useRef, useState} from 'react';
import {getHeroSlides} from './hero-slides';
import {photo} from './images';
import {MapPin} from 'lucide-react';

export default function HeroSlideshow({content}) {
  const [active,setActive]=useState(0);
  const [paused]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [focused,setFocused]=useState(false);
  const [hidden,setHidden]=useState(document.hidden);
  const touch=useRef(null);
  const hero=useRef(null);
  useEffect(()=>{
    const header=document.querySelector(".site-header-shell");
    const notice=document.querySelector(".currency-notice");
    const resize=()=>hero.current?.style.setProperty("--hero-top",`${(header?.getBoundingClientRect().height||0)+(notice?.getBoundingClientRect().height||0)}px`);
    const observer=new ResizeObserver(resize);
    if(header)observer.observe(header);
    if(notice)observer.observe(notice);
    resize();
    return()=>observer.disconnect();
  },[]);
  const slides=getHeroSlides(content);
  const current=active%slides.length;
  const duration=Number(slides[current].duration);
  const delay=Number.isFinite(duration)&&duration>=1&&duration<=120?duration*1000:6500;
  const running=!paused&&!focused&&!hidden;
  useEffect(()=>{const listener=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',listener);return()=>document.removeEventListener('visibilitychange',listener)},[]);
  useEffect(()=>{if(!running||slides.length<2)return;const t=setTimeout(()=>setActive(a=>(a+1)%slides.length),delay);return()=>clearTimeout(t)},[active,running,slides.length,delay]);
  const go=direction=>setActive(a=>(a+direction+slides.length)%slides.length);
  const slide=slides[current];
  // Only the first photo loads with the page; each later one is fetched just before it is shown.
  const [loadable,setLoadable]=useState(()=>new Set([0]));
  useEffect(()=>{
    const next=(current+1)%slides.length;
    const add=()=>setLoadable(set=>set.has(current)&&set.has(next)?set:new Set([...set,current,next]));
    if(document.readyState==='complete'){const t=setTimeout(add,800);return()=>clearTimeout(t)}
    window.addEventListener('load',add,{once:true});return()=>window.removeEventListener('load',add);
  },[current,slides.length]);
  return <section ref={hero} className="cinema-hero" aria-roledescription="carousel" aria-label="Discover Tanzania" onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();go(1)}if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}}} onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current!==null){const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>55)go(delta<0?1:-1);touch.current=null}}}>
    <div className="cinema-images" aria-hidden="true">{slides.map((s,i)=>loadable.has(i)||i===current?<img key={s.id} className={i===current?'visible':''} {...photo(s.image,'100vw')} ref={undefined} alt="" fetchPriority={i===0?'high':'low'} decoding="async"/>:null)}</div>
    <div className="cinema-overlay"/>
    <div className="cinema-copy container" key={active}>
      <h1>{slide.title.split('\n').map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}{i===1?<em>{line}</em>:line}</React.Fragment>)}</h1>
      <p>{slide.description}</p>
    </div>
    <div className="cinema-location"><MapPin size={14}/>{slide.place}</div>
    <span className="sr-only" aria-live={paused?'polite':'off'}>Slide {current+1} of {slides.length}: {slide.label}</span>
  </section>;
}
