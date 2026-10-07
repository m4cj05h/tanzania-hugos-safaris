// Keeps open tabs on the latest website version. The site loads its code once per tab, so a tab
// opened before an update would otherwise keep showing the old pages. We compare the main script
// this tab runs with the one the server now publishes, and when they differ the next page change
// does a full load instead of an in-app switch. Admin pages are skipped so unsaved edits are never lost.
const running=document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src');
let checkedAt=0,pending=null,stale=false;

function check(){
  if(!running||stale)return Promise.resolve(stale);
  if(pending)return pending;
  if(Date.now()-checkedAt<60000)return Promise.resolve(false);
  checkedAt=Date.now();
  pending=fetch('/',{cache:'no-store'}).then(response=>response.ok?response.text():'')
    .then(html=>{const published=html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];stale=!!published&&published!==running;return stale})
    .catch(()=>false).finally(()=>{pending=null});
  return pending;
}

if(running){
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
  setInterval(check,10*60000);
}

// Call after every in-app page change.
export function reloadIfOutdated(path){
  if(!running||/^\/admin(\/|$)/.test(path))return;
  const startedAt=Date.now();
  check().then(isStale=>{
    // Only reload if the visitor arrived here moments ago, so nothing they've started is interrupted.
    if(isStale&&Date.now()-startedAt<4000&&location.pathname===path)location.reload();
  });
}
