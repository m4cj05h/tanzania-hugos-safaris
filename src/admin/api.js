export async function api(path,options={}){
  const response=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json',...options.headers}});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Something went wrong. Please try again.');
  return data;
}
