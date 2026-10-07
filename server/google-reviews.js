import {readFileSync, writeFileSync} from 'node:fs';

const day=86400000, hour=3600000;

// The rating and reviews copied from the previous website's Google widget, for the same Google listing.
let savedReviews=null;
try{savedReviews=JSON.parse(readFileSync(new URL('./google-reviews-saved.json',import.meta.url),'utf8'))}catch{}
const monthYear=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});

// Fetches the business rating and latest reviews from the Google Places API (New) at most once a day.
// The last good answer is kept on disk, so visitors never wait for Google and an outage changes nothing.
export function createGoogleReviews({file,apiKey=process.env.GOOGLE_PLACES_API_KEY,fetcher=fetch,now=()=>Date.now()}={}){
  let cache=null,pending=null,retryAfter=0,lastError='';
  try{cache=JSON.parse(readFileSync(file,'utf8'))}catch{}
  async function refresh(placeId){
    try{
      const response=await fetcher(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,{headers:{'X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':'rating,userRatingCount,googleMapsUri,reviews'},signal:AbortSignal.timeout(8000)});
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(body?.error?.message||`Google answered ${response.status}`);
      if(!Number.isFinite(body.rating)||!Number.isInteger(body.userRatingCount))throw Error('Google has no rating for this place yet.');
      const httpsUrl=value=>typeof value==='string'&&/^https:\/\//.test(value)?value.slice(0,500):'';
      cache={placeId,fetchedAt:now(),rating:Math.round(body.rating*10)/10,count:body.userRatingCount,url:httpsUrl(body.googleMapsUri),
        reviews:(Array.isArray(body.reviews)?body.reviews:[]).slice(0,5).map(review=>({author:String(review.authorAttribution?.displayName||'Google user').slice(0,80),authorUrl:httpsUrl(review.authorAttribution?.uri),photo:httpsUrl(review.authorAttribution?.photoUri),rating:Math.min(5,Math.max(1,Math.round(Number(review.rating)||5))),text:String(review.text?.text||review.originalText?.text||'').slice(0,700),time:String(review.relativePublishTimeDescription||'').slice(0,40)})).filter(review=>review.text)};
      lastError='';
      if(file)writeFileSync(file,JSON.stringify(cache),{mode:0o600});
    }catch(error){lastError=error.message||'Google could not be reached.';retryAfter=now()+hour}
    finally{pending=null}
  }
  async function get(placeId){
    if(!apiKey||!placeId)return null;
    const stale=!cache||cache.placeId!==placeId||now()-cache.fetchedAt>=day;
    if(stale&&now()>=retryAfter){if(!pending)pending=refresh(placeId);await pending}
    // An old answer is still shown for up to 30 days if Google is unreachable.
    return cache&&cache.placeId===placeId&&now()-cache.fetchedAt<30*day?cache:null;
  }
  const status=()=>({keyConfigured:!!apiKey,lastError,fetchedAt:cache?.fetchedAt?new Date(cache.fetchedAt).toISOString():null});
  return {get,status};
}

// What the public site shows: live Google data when connected, otherwise the numbers typed in the admin,
// otherwise the rating and reviews copied from the previous website.
export async function googleReviewsFor(settings={},service,saved=savedReviews){
  const placeId=(typeof settings.placeId==='string'?settings.placeId.trim():'')||saved?.placeId||'';
  const writeReviewUrl=placeId?`https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`:'';
  const live=await service.get(placeId);
  if(live)return {source:'google',rating:live.rating,count:live.count,url:settings.url||live.url,writeReviewUrl,reviews:live.reviews};
  const copied=saved&&saved.placeId===placeId?saved:null;
  const reviews=copied?copied.reviews.map(({date,...review})=>({...review,time:monthYear(date)})):[];
  if(Number.isFinite(settings.rating)&&settings.rating>0&&Number.isInteger(settings.count)&&settings.count>0)return {source:'manual',rating:settings.rating,count:settings.count,url:settings.url||copied?.url||'',writeReviewUrl,reviews};
  if(copied)return {source:'saved',rating:copied.rating,count:copied.count,url:settings.url||copied.url,writeReviewUrl,reviews};
  return {source:'none'};
}

// Admin input check; returns an error message or ''.
export function googleSettingsError(settings){
  if(settings===undefined)return '';
  if(!settings||typeof settings!=='object')return 'Google review settings are invalid.';
  const {placeId='',url='',rating=null,count=null}=settings;
  if(typeof placeId!=='string'||!/^[A-Za-z0-9_-]{0,200}$/.test(placeId.trim()))return 'The Google Place ID can only contain letters, numbers, dashes and underscores.';
  if(typeof url!=='string'||url.length>500||(url&&!/^https:\/\/[^\s]+$/.test(url)))return 'The Google reviews link must start with https://.';
  if(rating!==null&&!(Number.isFinite(rating)&&rating>=1&&rating<=5))return 'The Google rating must be between 1 and 5.';
  if(count!==null&&!(Number.isInteger(count)&&count>=0&&count<=1000000))return 'The number of Google reviews must be a whole number.';
  return '';
}
