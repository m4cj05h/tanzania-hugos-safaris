import {h} from './locale';
import React, {useState} from 'react';
import {ArrowUpRight, Play} from 'lucide-react';
import {getShowcaseLinks,getShowcasePlacement,getYouTubeEmbed,isUploadedVideo} from './showcase-links.js';

// A YouTube preview: just the thumbnail until someone presses play, so the page stays light.
function YouTube({embed,title}){
  const [playing,setPlaying]=useState(false);
  const id=embed.split('/embed/')[1].split('?')[0];
  if(playing)return <iframe src={`https://www.youtube-nocookie.com/embed/${id}?playsinline=1&autoplay=1`} title={title||'YouTube video'} referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>;
  return <button type="button" className="showcase-video-poster" onClick={()=>setPlaying(true)} aria-label={'Play video'+(title?': '+title:'')}>
    <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async"/>
    <span className="showcase-play" aria-hidden="true"><Play size={26} fill="currentColor"/></span>
  </button>;
}

export default function ShowcaseSection({content,placement='homepage',className=''}) {
  const links=getShowcaseLinks(content).filter(item=>getShowcasePlacement(item)===placement);
  if(!links.length)return null;
  const items=links.map(link=>({...link,embed:getYouTubeEmbed(link.url)}));
  const headingId=`showcase-heading-${placement}`;
  return <section className={`showcase-section section ${className}`.trim()} aria-labelledby={headingId}>
    <div className="container">
      <h2 id={headingId}>{placement==='kilimanjaro'?'Experience Kilimanjaro.':'Watch the journey.'}</h2>
      <div className="showcase-grid">{items.map(item=>item.embed||isUploadedVideo(item.url)?<article className="showcase-video" key={item.id}>
        {item.title&&<h3>{item.title}</h3>}
        <div className="showcase-video-frame">{item.embed?<YouTube embed={item.embed} title={item.title}/>:<video src={item.url} controls playsInline preload="metadata" aria-label={item.title||'Travel video'}/>}</div>
      </article>:<a className="showcase-card" key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">
        <span className="showcase-card-icon" aria-hidden="true"><ArrowUpRight size={22}/></span>
        <h3>{item.title.trim()||item.url}</h3>
      </a>)}</div>
    </div>
  </section>;
}
