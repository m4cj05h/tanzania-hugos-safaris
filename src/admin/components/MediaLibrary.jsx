import {h} from '../../locale';
import React, {useEffect, useId, useRef, useState} from 'react';
import {Upload, Image, Check, ChevronDown, Trash2, MoreHorizontal} from 'lucide-react';
import './media.css';

export default function MediaLibrary({value, onSelect, compact=false, label="Article or journey photo"}) {
  const [photos,setPhotos]=useState([]), [open,setOpen]=useState(!compact), [query,setQuery]=useState('');
  const [loading,setLoading]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState(''), [status,setStatus]=useState('');
  const [pending,setPending]=useState([]), [deleting,setDeleting]=useState(''), [actionPhoto,setActionPhoto]=useState('');
  const input=useRef(null), id=useId();
  async function load() {
    setLoading(true);setError('');
    try {const response=await fetch('/api/admin/media');const data=await response.json();if(!response.ok)throw Error(data.error);setPhotos(data);}
    catch(e){setError(e.message||'Unable to load photos. Please try again.');}
    finally{setLoading(false);}
  }
  useEffect(()=>{if(open)load();},[open]);
  useEffect(()=>{
    if(!actionPhoto)return;
    function dismiss(event){if(!event.target.closest('.media-actions'))setActionPhoto('');}
    function escape(event){if(event.key==='Escape'){document.getElementById(id+'-actions-'+actionPhoto)?.focus();setActionPhoto('');}}
    document.addEventListener('pointerdown',dismiss);
    document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};
  },[actionPhoto,id]);
  async function upload(files) {
    if(!files.length)return;
    setBusy(true);setError('');setStatus('');
    let count=0;
    try {
      for(const item of files){
        const {file,name}=item;
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error(file.name+': choose a JPG, PNG or WebP photo up to 10 MB.');
        setStatus('Uploading '+(count+1)+' of '+files.length+'…');
        const response=await fetch('/api/admin/media',{method:'POST',headers:{'Content-Type':file.type,'X-File-Name':encodeURIComponent(name.trim()||file.name)},body:file});
        const data=await response.json();if(!response.ok)throw Error(data.error);
        setPhotos(items=>[data,...items]);count++;setPending(items=>items.filter(entry=>entry!==item));
        if(onSelect&&files.length===1)onSelect(data.id);
      }
      setQuery('');setStatus(count===1?'Photo uploaded.':count+' photos uploaded.');
    } catch(e){setError(e.message||'Upload failed. Please try again.');setStatus(count?count+' photos uploaded before this error.':'');}
    finally{setBusy(false);if(input.current)input.current.value='';}
  }
  async function remove(photo) {
    if(!window.confirm('Delete “'+photo.name+'” from the photo library?'+(photo.builtin?' Existing website images will stay visible.':'')))return;
    setActionPhoto('');
    setDeleting(photo.id);setError('');setStatus('');
    try {
      const response=await fetch('/api/admin/media/'+encodeURIComponent(photo.id),{method:'DELETE'});
      const data=await response.json();if(!response.ok)throw Error(data.error);
      setPhotos(items=>items.filter(item=>item.id!==photo.id));setStatus('Photo removed from the library.');
    }catch(e){setError(e.message||'Unable to delete photo. Please try again.');}
    finally{setDeleting('');}
  }
  const selected=photos.find(photo=>photo.id===value);
  return <div className={'media-library '+(compact?'media-picker':'')}>
    {compact&&<><span className="media-field-label">{label}</span><button type="button" className="media-current" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{value?<img src={'/images/'+value} alt="Selected photo"/>:<span className="media-current-empty" aria-hidden="true"><Image size={20}/></span>}<span><strong>{value?selected?.name||'Selected photo':'No photo yet'}</strong><small>Choose or upload a photo</small></span><ChevronDown size={17}/></button></>}
    {open&&<div id={id} className="media-browser">
      <div className="media-heading"><div><h2><Image size={20}/> Photo library</h2><p>{onSelect?'Select a photo below, then publish your changes.':'Your photos, ready for the next story.'}</p></div><button type="button" className="button" disabled={busy||loading||!!deleting} onClick={()=>input.current?.click()}><Upload size={16}/>Choose photos</button><input ref={input} className="media-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Upload photos" onChange={e=>{setPending(Array.from(e.target.files||[]).map(file=>({file,name:file.name.replace(/\.[^.]+$/,'')})));e.target.value='';}}/></div>
      <p className="media-help">JPG, PNG or WebP · Up to 10 MB per photo. Photos are automatically optimized for your website.</p>
      {!!pending.length&&<div className="media-upload-queue">
        {pending.map((item,index)=><label key={index}>Photo name<input value={item.name} maxLength={160} disabled={busy} onChange={e=>setPending(items=>items.map((entry,i)=>i===index?{...entry,name:e.target.value}:entry))}/><small>{item.file.name}</small></label>)}
        <button type="button" className="button" disabled={busy||!!deleting||pending.some(item=>!item.name.trim())} onClick={()=>upload(pending)}>{busy?'Uploading…':'Upload photos'}</button>
        <button type="button" disabled={busy} onClick={()=>setPending([])}>Cancel</button>
      </div>}
      <label className="media-search">Find a photo<input type="search" placeholder="Search by name…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      {error&&<div role="alert" className="error">{error} <button type="button" disabled={loading||busy} onClick={load}>Reload library</button></div>}
      {status&&<p role="status">{status}</p>}
      {loading?<p role="status">Loading photos…</p>:<div className="media-grid">{photos.filter(photo=>photo.name.toLowerCase().includes(query.toLowerCase())).map(photo=>{
        const contents=<><div className="media-photo"><img src={'/images/'+photo.id} alt={photo.name} loading="lazy"/>{value===photo.id&&<span><Check size={14}/> Selected</span>}</div><strong title={photo.name}>{photo.name}</strong><small>{photo.builtin?'Website photo':photo.width+' × '+photo.height}</small></>;
        return <div className="media-card" key={photo.id}>{onSelect?<button type="button" className={'media-tile '+(value===photo.id?'selected':'')} aria-pressed={value===photo.id} aria-label={'Select '+photo.name} onClick={()=>{onSelect(photo.id);setStatus('Photo selected. Publish changes to update your website.');}}>{contents}</button>:<div className="media-tile">{contents}</div>}
          <div className="media-actions">
            <button type="button" id={id+'-actions-'+photo.id} className="media-actions-toggle" aria-label={'Actions for '+photo.name} aria-expanded={actionPhoto===photo.id} aria-controls={id+'-menu-'+photo.id} onClick={()=>setActionPhoto(current=>current===photo.id?'':photo.id)}><MoreHorizontal size={20}/></button>
            {actionPhoto===photo.id&&<div className="media-actions-popover" id={id+'-menu-'+photo.id}>
              <button type="button" className="media-delete" disabled={busy||!!deleting||(!photo.builtin&&value===photo.id)} onClick={()=>remove(photo)}><Trash2 size={15}/>{deleting===photo.id?'Deleting…':'Delete photo'}</button>
              {!photo.builtin&&value===photo.id&&<small>Choose another photo before deleting this one.</small>}
            </div>}
          </div>
        </div>;
      })}</div>}
      {!loading&&!photos.filter(photo=>photo.name.toLowerCase().includes(query.toLowerCase())).length&&<p>No photos match your search.</p>}
    </div>}
  </div>;
}
