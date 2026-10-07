import {readFileSync,writeFileSync} from 'node:fs';
export function createRateService({file,fetcher=fetch,now=()=>Date.now()}={}){
 let cache=null,pending=null,retryAfter=0;
 try{cache=JSON.parse(readFileSync(file,'utf8'))}catch{}
 const valid=c=>c&&Number.isFinite(c.updatedAt)&&c.updatedAt<=now()+86400000&&['USD','EUR','GBP','TZS'].every(k=>Number.isFinite(c.rates?.[k])&&c.rates[k]>0)&&c.rates.USD===1;
 if(!valid(cache))cache=null;
 let needsExpansion=cache&&Object.keys(cache.rates).length<=4;
 async function refresh(){try{const response=await fetcher('https://open.er-api.com/v6/latest/USD',{signal:AbortSignal.timeout(7000)});if(!response.ok)throw Error('Exchange rates unavailable');const body=await response.json();if(body.result!=='success'||body.base_code!=='USD')throw Error('Invalid rate response');if(!valid({updatedAt:body.time_last_update_unix*1000,rates:body.rates}))throw Error('Invalid exchange rates');const next={updatedAt:body.time_last_update_unix*1000,fetchedAt:now(),rates:Object.fromEntries(Object.entries(body.rates||{}).filter(([code,rate])=>/^[A-Z]{3}$/.test(code)&&Number.isFinite(rate)&&rate>0))};if(!valid(next))throw Error('Invalid exchange rates');cache=next;needsExpansion=false;if(file)writeFileSync(file,JSON.stringify(next),{mode:0o600})}catch{retryAfter=now()+3600000}finally{pending=null}}
 return async()=>{if((!cache||now()-cache.fetchedAt>=86400000||needsExpansion)&&now()>=retryAfter){if(!pending)pending=refresh();await pending}const usable=valid(cache)&&now()-cache.updatedAt<259200000;return {base:'USD',rates:usable?cache.rates:{USD:1},updatedAt:usable?new Date(cache.updatedAt).toISOString():null,status:usable?(now()-cache.updatedAt>86400000?'cached':'current'):'unavailable',source:'ExchangeRate-API'}};
}
