import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {h} from './locale';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';
import {photo} from './images';
import {formatPostDate, postBlocks} from './blog';
import {paginate, itemHTML} from './bookLayout';

// Page size from the window: two pages side by side on wide screens, one page on phones.
function geometry(){
  const vw=innerWidth,vh=innerHeight;
  const spread=vw>=900&&vh>=560;
  const room=vh-(spread?160:150);
  if(spread){
    let height=Math.min(room,860),width=height*.7;
    const most=(vw-120)/2;
    if(width>most){width=most;height=width/.7;}
    return {spread,width:Math.round(width),height:Math.round(height)};
  }
  const width=Math.min(vw-28,480);
  return {spread,width:Math.round(width),height:Math.round(Math.min(room,width/.62))};
}

// The story as a book that opens from its cover and turns page by page.
export default function OpenBook({post,onClose}){
  const [size,setSize]=useState(geometry);
  const [pages,setPages]=useState(null);
  // Which spread (or single page) is open. -1 is the closed front cover.
  const [at,setAt]=useState(-1);
  const [turning,setTurning]=useState(null);
  const measureRef=useRef(null),leafRef=useRef(null),closeRef=useRef(null);
  const busy=useRef(false),swipe=useRef(null);
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  useLayoutEffect(()=>{if(measureRef.current)setPages(paginate(postBlocks(post),measureRef.current));},[post,size.width,size.height]);

  // Title page, the story, then the end page.
  const all=pages?[{kind:'title'},...pages.map((items,index)=>({kind:'text',items,number:index+1})),{kind:'end'}]:[];
  const last=size.spread?Math.floor(all.length/2):all.length-1;
  const view=index=>{
    if(index<0)return {right:{kind:'cover'}};
    if(!size.spread)return {right:all[index]};
    return {left:index===0?{kind:'endpaper'}:all[2*index-1],right:all[2*index]||{kind:'endpaper'}};
  };

  const turn=dir=>{
    const to=at+dir;
    if(busy.current||!pages||to<-1||to>last)return;
    if(reduced){setAt(to);return;}
    busy.current=true;
    setTurning({from:at,to,dir});
  };
  const turnRef=useRef(turn);turnRef.current=turn;

  // The turning leaf swings around the spine; the next pages are already waiting underneath.
  useLayoutEffect(()=>{
    if(!turning||!leafRef.current)return;
    const frames=[{transform:'rotateY(0deg)'},{transform:'rotateY(-180deg)'}];
    const motion=leafRef.current.animate(turning.dir>0?frames:frames.reverse(),{duration:850,easing:'cubic-bezier(.45,.05,.25,1)',fill:'forwards'});
    motion.onfinish=()=>{setAt(turning.to);setTurning(null);busy.current=false;};
    return()=>motion.cancel();
  },[turning]);

  // Open the cover by itself a moment after the book appears.
  useEffect(()=>{if(pages&&at===-1&&!turning){const timer=setTimeout(()=>turnRef.current(1),450);return()=>clearTimeout(timer);}},[!!pages]);

  // Keep the place when the window changes between one and two pages.
  useEffect(()=>{
    let timer;
    const resize=()=>{clearTimeout(timer);timer=setTimeout(()=>{
      const next=geometry();
      setSize(prev=>{
        if(prev.spread!==next.spread)setAt(current=>current<0?current:next.spread?Math.floor((current+1)/2):Math.max(0,2*current-1));
        return prev.width===next.width&&prev.height===next.height&&prev.spread===next.spread?prev:next;
      });
    },150);};
    addEventListener('resize',resize);
    return()=>{removeEventListener('resize',resize);clearTimeout(timer);};
  },[]);
  useEffect(()=>{if(pages&&at>last)setAt(last);},[pages,last]);

  useEffect(()=>{
    const key=event=>{
      if(event.key==='Escape')onClose();
      else if(event.key==='ArrowRight')turnRef.current(1);
      else if(event.key==='ArrowLeft')turnRef.current(-1);
    };
    const overflow=document.body.style.overflow,focused=document.activeElement;
    document.body.style.overflow='hidden';
    closeRef.current?.focus();
    addEventListener('keydown',key);
    return()=>{removeEventListener('keydown',key);document.body.style.overflow=overflow;focused?.focus?.();};
  },[onClose]);

  const category=post.category||'Story';
  const face=(page,side)=>{
    if(!page)return null;
    if(page.kind==='cover')return <div className="ob-face ob-cover">
      <span className="book-cover"><img {...photo(post.image,'(max-width: 700px) 90vw, 600px')} alt=""/><span className="book-cover-category">{category}</span><span className="book-cover-text"><strong>{post.title}</strong>{post.author&&<span className="book-cover-author">{post.author}</span>}</span></span>
    </div>;
    if(page.kind==='endpaper')return <div className={'ob-face ob-endpaper ob-side-'+side}><div className="ob-exlibris"><span>Ex libris</span><strong>Tanzania Hugos Safaris</strong><span>The Hugos Library</span></div></div>;
    if(page.kind==='blank')return <div className={'ob-face ob-paper ob-side-'+side}/>;
    if(page.kind==='title')return <div className={'ob-face ob-paper ob-title-page ob-side-'+side}>
      <span className="ob-eyebrow">{category}</span>
      <h2>{post.title}</h2>
      <span className="ob-ornament" aria-hidden="true">❦</span>
      {post.author&&<p>{post.author}</p>}
      <p>{formatPostDate(post.date)}</p>
      <span className="ob-imprint">Tanzania Hugos Safaris</span>
    </div>;
    if(page.kind==='end')return <div className={'ob-face ob-paper ob-end-page ob-side-'+side}>
      <span className="ob-ornament" aria-hidden="true">❦</span>
      <h2>The end</h2>
      <p>Inspired to write your own Tanzania story? Tell us what you would love to experience and we will plan it with you.</p>
      <Link className="book-latest-button" to="/plan-my-trip" onClick={event=>event.stopPropagation()}>Plan your trip</Link>
      <button type="button" className="ob-text-button" onClick={event=>{event.stopPropagation();onClose();}}>Close the book</button>
    </div>;
    return <div className={'ob-face ob-paper ob-side-'+side}>
      <div className="ob-head">{post.title}</div>
      <div className="ob-body" dangerouslySetInnerHTML={{__html:page.items.map(itemHTML).join('')}}/>
      <div className="ob-foot">{page.number}</div>
    </div>;
  };

  // While a page turns: the pages underneath belong to where the turn ends, the leaf carries the turning page.
  let left,right,front,back;
  if(turning){
    const from=view(turning.from),to=view(turning.to);
    const [before,after]=turning.dir>0?[from,to]:[to,from];
    left=before.left;right=after.right;front=before.right;
    back=size.spread?after.left:turning.dir>0&&turning.from===-1?{kind:'endpaper'}:{kind:'blank'};
  }else({left,right}=view(at));
  const closed=size.spread&&(turning?turning.to:at)===-1;

  const shown=at<0?[]:size.spread?[view(at).left,view(at).right]:[view(at).right];
  const numbers=shown.filter(page=>page?.kind==='text').map(page=>page.number);
  const status=!pages?'Opening…':at<0?'Cover':numbers.length?`${numbers.length>1?'Pages':'Page'} ${numbers.join('–')} of ${pages.length}`:shown.some(page=>page?.kind==='end')?'The end':'Title page';

  const pointerDown=event=>{swipe.current=event.clientX;};
  const pointerUp=event=>{
    if(swipe.current==null)return;
    const moved=event.clientX-swipe.current;swipe.current=null;
    if(Math.abs(moved)>50){turn(moved<0?1:-1);swipe.moved=true;}
  };
  const tap=dir=>()=>{if(swipe.moved){swipe.moved=false;return;}turn(dir);};

  return <div className="ob-overlay" role="dialog" aria-modal="true" aria-label={post.title} style={{'--pw':size.width+'px','--ph':size.height+'px'}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="ob-top">
      <span className="ob-top-title">{post.title}</span>
      <button ref={closeRef} type="button" className="ob-round" onClick={onClose} aria-label="Close the book"><X size={20}/></button>
    </div>
    <div className="ob-stage" onPointerDown={pointerDown} onPointerUp={pointerUp} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
      <div className={'ob-book '+(size.spread?'is-spread':'is-single')+(closed?' is-closed':'')} style={{width:(size.spread?2:1)*size.width,height:size.height}}>
        {size.spread&&<div className="ob-half ob-half-left" onClick={tap(-1)}>{face(left,'left')}</div>}
        <div className="ob-half ob-half-right" onClick={tap(1)}>{face(right,'right')}</div>
        {turning&&<div className="ob-leaf" ref={leafRef} style={turning.dir<0?{transform:'rotateY(-180deg)'}:undefined}>
          <div className="ob-leaf-front">{face(front,'right')}</div>
          <div className="ob-leaf-back">{face(back,size.spread?'left':'right')}</div>
        </div>}
      </div>
    </div>
    <div className="ob-bottom">
      <button type="button" className="ob-round" onClick={()=>turn(-1)} disabled={!pages||at<=-1} aria-label="Previous page"><ChevronLeft size={22}/></button>
      <span aria-live="polite">{status}</span>
      <button type="button" className="ob-round" onClick={()=>turn(1)} disabled={!pages||at>=last} aria-label="Next page"><ChevronRight size={22}/></button>
    </div>
    <div className="ob-measure" aria-hidden="true" style={{width:size.width,height:size.height}}>
      <div className="ob-face ob-paper"><div className="ob-head">{post.title}</div><div className="ob-body" ref={measureRef}/><div className="ob-foot">1</div></div>
    </div>
  </div>;
}
