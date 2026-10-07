import{test}from'node:test';import assert from'node:assert/strict';import{createGoogleReviews,googleReviewsFor,googleSettingsError}from'../server/google-reviews.js';
const place={rating:4.86,userRatingCount:37,googleMapsUri:'https://maps.google.com/?cid=1',reviews:[{rating:5,text:{text:'Wonderful safari'},relativePublishTimeDescription:'2 weeks ago',authorAttribution:{displayName:'Amina',uri:'https://www.google.com/maps/contrib/1',photoUri:'https://lh3.googleusercontent.com/a/1'}},{rating:4,text:{text:''},authorAttribution:{displayName:'Empty'}}]};
const google=(body,ok=true)=>{const calls=[];return{calls,fetcher:async(url,options)=>{calls.push([url,options]);return{ok,status:ok?200:403,json:async()=>body}}}};
test('live Google rating is fetched once a day and cleaned for display',async()=>{let time=0;const {calls,fetcher}=google(place);const service=createGoogleReviews({apiKey:'key',fetcher,now:()=>time});
 const data=await googleReviewsFor({placeId:'ChIJabc'},service);
 assert.equal(data.source,'google');assert.equal(data.rating,4.9);assert.equal(data.count,37);assert.equal(data.reviews.length,1);assert.equal(data.reviews[0].author,'Amina');
 assert.match(data.writeReviewUrl,/placeid=ChIJabc/);assert.equal(calls[0][1].headers['X-Goog-Api-Key'],'key');
 await googleReviewsFor({placeId:'ChIJabc'},service);assert.equal(calls.length,1);
 time=86400000;await googleReviewsFor({placeId:'ChIJabc'},service);assert.equal(calls.length,2)});
test('without a key or when Google fails, the admin numbers are shown',async()=>{
 const noKey=createGoogleReviews({apiKey:'',fetcher:async()=>{throw Error('should not call')}});
 assert.deepEqual(await googleReviewsFor({placeId:'ChIJabc',rating:4.8,count:12,url:'https://g.page/r/x'},noKey),{source:'manual',rating:4.8,count:12,url:'https://g.page/r/x',writeReviewUrl:'https://search.google.com/local/writereview?placeid=ChIJabc',reviews:[]});
 assert.deepEqual(await googleReviewsFor({},noKey,null),{source:'none'});
 const {fetcher}=google({error:{message:'API key not valid'}},false);const failing=createGoogleReviews({apiKey:'bad',fetcher});
 assert.equal((await googleReviewsFor({placeId:'ChIJabc',rating:4.5,count:3},failing)).source,'manual');assert.equal(failing.status().lastError,'API key not valid')});
test('Google settings are validated',()=>{
 assert.equal(googleSettingsError(undefined),'');assert.equal(googleSettingsError({placeId:'ChIJ-abc_1',url:'https://maps.app.goo.gl/x',rating:4.9,count:37}),'');
 assert.match(googleSettingsError({placeId:'bad id!'}),/Place ID/);assert.match(googleSettingsError({url:'javascript:alert(1)'}),/https/);
 assert.match(googleSettingsError({rating:6}),/between 1 and 5/);assert.match(googleSettingsError({count:2.5}),/whole number/)});
test('the reviews copied from the previous website show until Google is connected',async()=>{
 const noKey=createGoogleReviews({apiKey:'',fetcher:async()=>{throw Error('should not call')}});
 const saved={placeId:'ChIJold',rating:4.9,count:8,url:'https://search.google.com/local/reviews?placeid=ChIJold',reviews:[{author:'Norah',authorUrl:'',photo:'',rating:5,text:'Super amazing',date:'2025-07-07'}]};
 const data=await googleReviewsFor({},noKey,saved);
 assert.equal(data.source,'saved');assert.equal(data.rating,4.9);assert.equal(data.count,8);assert.equal(data.reviews[0].time,'July 2025');assert.match(data.writeReviewUrl,/placeid=ChIJold/);
 const typed=await googleReviewsFor({rating:5,count:10},noKey,saved);
 assert.equal(typed.source,'manual');assert.equal(typed.count,10);assert.equal(typed.reviews.length,1);
 assert.equal((await googleReviewsFor({placeId:'ChIJother'},noKey,saved)).source,'none')});
