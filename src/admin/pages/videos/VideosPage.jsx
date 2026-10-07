import {useAdmin} from '../../context';
import {h} from '../../../locale';
import React, {useRef,useState} from 'react';
import {ArrowDown, ArrowUp, Plus, Trash2, Upload} from 'lucide-react';
import {getShowcaseLinks,isUploadedVideo} from '../../../showcase-links.js';

export default function VideosPage(){const{draft,setDraft}=useAdmin();
  const input=useRef(null);
  const [uploading,setUploading]=useState(false),[message,setMessage]=useState('');
  const links=getShowcaseLinks(draft);
  const change=transform=>setDraft(current=>({...current,showcaseLinks:transform(getShowcaseLinks(current))}));
  const update=(id,key,value)=>change(items=>items.map(item=>item.id===id?{...item,[key]:value}:item));
  const move=(index,direction)=>change(items=>{const next=[...items];[next[index],next[index+direction]]=[next[index+direction],next[index]];return next;});
  async function upload(file){
    if(!file)return;
    if(!['video/mp4','video/webm'].includes(file.type)||file.size>100*1024*1024){setMessage('Choose an MP4 or WebM video up to 100 MB.');return;}
    setUploading(true);setMessage('Uploading video…');
    try{
      const response=await fetch('/api/admin/videos',{method:'POST',headers:{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)},body:file});
      const data=await response.json();if(!response.ok)throw Error(data.error);
      change(items=>[...items,{id:crypto.randomUUID(),title:data.name,url:data.url,placement:'homepage'}]);
      setMessage('Video uploaded. Choose where it should appear, then publish changes.');
    }catch(error){setMessage(error.message||'Video upload failed.');}
    finally{setUploading(false);if(input.current)input.current.value='';}
  }
  return <div className="showcase-editor">
    <h2>Website videos & links</h2>
    <p>Upload a video or paste a YouTube/web link, then choose exactly where it appears. Selecting “Kilimanjaro video section” places it where the old climb calculator was.</p>
    <div className="showcase-upload"><button type="button" className="button" disabled={uploading||links.length>=12} onClick={()=>input.current?.click()}><Upload size={16}/>{uploading?'Uploading…':'Upload video'}</button><input ref={input} className="media-file-input" type="file" accept="video/mp4,video/webm" onChange={event=>upload(event.target.files?.[0])}/><small>MP4 or WebM · up to 100 MB</small></div>
    {message&&<p role="status" className="notice">{message}</p>}
    {links.map((link,index)=><div className="showcase-editor-item" key={link.id}>
      <div className="showcase-editor-fields">
        <label>Title (optional)<input maxLength={120} value={link.title} placeholder="Leave blank to show only the video" onChange={event=>update(link.id,'title',event.target.value)}/></label>
        <label>YouTube or website link<input type="url" maxLength={2048} value={link.url} placeholder="https://youtu.be/…" onChange={event=>update(link.id,'url',event.target.value)}/></label>
        <label>Show this on<select value={link.placement||'homepage'} onChange={event=>update(link.id,'placement',event.target.value)}><option value="homepage">Homepage video section</option><option value="kilimanjaro">Kilimanjaro video section</option></select></label>
        {isUploadedVideo(link.url)&&<small>Uploaded video</small>}
      </div>
      <div className="showcase-editor-actions">
        <button type="button" disabled={index===0} onClick={()=>move(index,-1)}><ArrowUp size={16}/>Move up</button>
        <button type="button" disabled={index===links.length-1} onClick={()=>move(index,1)}><ArrowDown size={16}/>Move down</button>
        <button type="button" onClick={()=>change(items=>items.filter(item=>item.id!==link.id))}><Trash2 size={16}/>Remove</button>
      </div>
    </div>)}
    <button type="button" className="button secondary" disabled={links.length>=12} onClick={()=>change(items=>[...items,{id:crypto.randomUUID(),title:'',url:'',placement:'homepage'}])}><Plus size={16}/>Add YouTube or web link</button>
  </div>;
}
