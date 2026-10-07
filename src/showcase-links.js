export function getShowcaseLinks(content) {
  return Array.isArray(content?.showcaseLinks) ? content.showcaseLinks : [];
}

export function getShowcasePlacement(item) {
  return item?.placement === 'kilimanjaro' ? 'kilimanjaro' : 'homepage';
}

export function isUploadedVideo(url) {
  return typeof url === 'string' && /^\/videos\/uploads\/[a-f0-9-]+\.(?:mp4|webm)$/.test(url);
}

export function getYouTubeEmbed(url) {
  let parsed;
  try{parsed=new URL(url);}catch{return null;}
  if(!['http:','https:'].includes(parsed.protocol))return null;
  const host=parsed.hostname.toLowerCase();
  let id;
  if(host==='youtu.be'||host==='www.youtu.be')id=parsed.pathname.split('/')[1];
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
    const parts=parsed.pathname.split('/');
    id=parsed.pathname==='/watch'?parsed.searchParams.get('v'):['shorts','live','embed'].includes(parts[1])?parts[2]:null;
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id||'')?`https://www.youtube.com/embed/${id}?playsinline=1`:null;
}
