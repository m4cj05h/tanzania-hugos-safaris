import {h} from './locale';
import React, {useEffect, useState} from 'react';
import {getPartners} from './partners.js';
import {photo} from './images.js';

export default function PartnerSlideshow({content}) {
  const partners=getPartners(content);
  const pageCount=Math.ceil(partners.length/4);
  const [page,setPage]=useState(0);
  const current=pageCount ? page%pageCount : 0;

  useEffect(()=>{
    if(pageCount<2||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setPage(value=>(value+1)%pageCount),4500);
    return ()=>window.clearInterval(timer);
  },[pageCount]);

  if(!partners.length)return null;
  const visible=Array.from({length:Math.min(4,partners.length)},(_,index)=>partners[(current*4+index)%partners.length]);
  return <section className="partner-section" aria-labelledby="partners-heading">
    <svg className="partner-filter-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="partner-logo-dark" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 3" result="cutout"/>
          <feComponentTransfer in="SourceGraphic" result="inverted"><feFuncR type="linear" slope="-1" intercept="1"/><feFuncG type="linear" slope="-1" intercept="1"/><feFuncB type="linear" slope="-1" intercept="1"/></feComponentTransfer>
          <feColorMatrix in="inverted" type="hueRotate" values="180" result="restored"/>
          <feComposite in="restored" in2="cutout" operator="in"/>
        </filter>
      </defs>
    </svg>
    <div className="container">
      <div className="partner-heading"><h2 id="partners-heading">Our partners.</h2></div>
      <div className="partner-pair" key={current}>{visible.map(partner=><div className="partner-logo" key={partner.id}><img {...photo(partner.image,'(max-width: 700px) 35vw, 180px')} alt={partner.name} loading="lazy" decoding="async"/></div>)}</div>
    </div>
  </section>;
}
