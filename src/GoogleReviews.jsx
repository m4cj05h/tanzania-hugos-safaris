import React, {useEffect, useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {h} from './locale';
import './google-reviews.css';

// One shared request, started once the page is idle so it never competes with the first paint.
let request=null;
const loadGoogleReviews=()=>request||=new Promise(resolve=>(window.requestIdleCallback||(callback=>setTimeout(callback,1200)))(resolve))
  .then(()=>fetch('/api/google-reviews')).then(response=>response.ok?response.json():{source:'none'}).catch(()=>{request=null;return {source:'none'}});

function useGoogleReviews(){
  const [data,setData]=useState(null);
  useEffect(()=>{let live=true;loadGoogleReviews().then(value=>{if(live)setData(value)});return()=>{live=false}},[]);
  return data&&data.source!=='none'?data:null;
}

// Google's "G" mark, shown as attribution next to Google ratings.
const GoogleMark=({size=18})=><svg className="google-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>;

// Stars filled to the exact rating (e.g. 4.8 fills 96%).
function Stars({rating,label=true}){
  return <span className="google-stars" role={label?'img':undefined} aria-label={label?`${rating} out of 5 stars`:undefined} aria-hidden={label?undefined:'true'}><span className="google-stars-empty">★★★★★</span><span className="google-stars-full" style={{width:`${Math.max(0,Math.min(5,rating))/5*100}%`}}>★★★★★</span></span>;
}

const external={target:'_blank',rel:'noopener noreferrer'};

// Small rating link for the footer of every page.
export function GoogleRatingBadge(){
  const data=useGoogleReviews();
  if(!data)return null;
  const content=<><GoogleMark size={16}/><strong>{data.rating.toFixed(1)}</strong><Stars rating={data.rating}/><span>{data.count} Google reviews</span></>;
  return data.url?<a className="google-badge" href={data.url} {...external}>{content}</a>:<span className="google-badge">{content}</span>;
}

// Homepage section: overall rating plus the four latest reviews.
export function GoogleReviewsSection(){
  const data=useGoogleReviews();
  if(!data)return null;
  return <section className="container section google-reviews" aria-labelledby="google-reviews-title">
    <div className="section-heading"><div><span className="eyebrow">REVIEWED ON GOOGLE</span><h2 id="google-reviews-title">Loved by travellers.</h2></div>
      {data.url&&<a className="text-link" href={data.url} {...external}>Read all reviews on Google <ArrowUpRight size={18}/></a>}</div>
    <div className="google-summary"><GoogleMark size={34}/><div><div className="google-summary-score"><strong>{data.rating.toFixed(1)}</strong><Stars rating={data.rating}/></div><p>Based on {data.count} Google reviews</p></div>
      {data.writeReviewUrl&&<a className="google-write" href={data.writeReviewUrl} {...external}>Write a review</a>}</div>
    {data.reviews.length>0&&<div className="google-review-grid">{data.reviews.slice(0,4).map((review,index)=><blockquote key={index}>
      <div className="google-review-author">{review.photo?<img src={review.photo} alt="" width="36" height="36" loading="lazy" referrerPolicy="no-referrer" onError={event=>{event.currentTarget.style.visibility='hidden'}}/>:<span className="google-avatar" aria-hidden="true">{review.author.slice(0,1)}</span>}
        <div>{review.authorUrl?<a href={review.authorUrl} {...external} data-no-translate>{review.author}</a>:<strong data-no-translate>{review.author}</strong>}<small>{review.time}</small></div></div>
      <Stars rating={review.rating}/><p data-no-translate>{review.text}</p>
    </blockquote>)}</div>}
    <p className="google-attribution"><GoogleMark size={14}/>Ratings and reviews from Google</p>
  </section>;
}
