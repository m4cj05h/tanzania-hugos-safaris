import {h} from '../../../locale';
import React from 'react';
import {Link} from 'react-router-dom';
import {Plus, ChevronDown, Trash2, ArrowUpRight, BookOpen} from 'lucide-react';
import {useAdmin} from '../../context';
import {Field, Toggle, Empty} from '../../ui';
import MediaLibrary from '../../components/MediaLibrary';

export default function TravelGuidePage(){
  const {draft,setDraft}=useAdmin();
  const update=(id,key,value)=>setDraft(current=>({...current,articles:current.articles.map(a=>a.id===id?{...a,[key]:value}:a)}));
  return <div>
    <div className="admin-toolbar"><p className="admin-lead">Stories appear on the Travel guide page once published.</p><button type="button" className="admin-primary" onClick={()=>setDraft(current=>({...current,articles:[{id:'story-'+Date.now(),title:'New travel story',category:'Travel inspiration',image:'safari.webp',body:'',published:false},...current.articles]}))}><Plus size={16}/>Add article</button></div>
    {!draft.articles.length&&<Empty icon={BookOpen} title="No articles yet" text="Write your first story about Tanzania."/>}
    {draft.articles.map(a=><details className="admin-row" key={a.id}>
      <summary><img src={'/images/'+a.image} alt=""/><span className="admin-row-title"><strong>{a.title}</strong><small>{a.category}</small></span><span className={'admin-pill '+(a.published?'is-live':'is-draft')}>{a.published?'Published':'Draft'}</span><ChevronDown className="admin-row-chevron" size={18}/></summary>
      <div className="admin-row-body">
        <div className="trip-editor-top"><Toggle checked={a.published} onChange={value=>update(a.id,'published',value)} label={a.published?'Published on website':'Draft — hidden from visitors'}/><div className="admin-row-actions">{a.published&&<Link to={'/travel-guide/'+a.id} target="_blank" rel="noreferrer"><ArrowUpRight size={15}/>View article</Link>}<button type="button" className="danger" onClick={()=>{if(window.confirm('Delete “'+a.title+'”?'))setDraft(current=>({...current,articles:current.articles.filter(x=>x.id!==a.id)}));}}><Trash2 size={15}/>Delete</button></div></div>
        <div className="admin-form-grid">
          <Field label="Title" value={a.title} onChange={e=>update(a.id,'title',e.target.value)}/>
          <Field label="Category" value={a.category} onChange={e=>update(a.id,'category',e.target.value)}/>
          <MediaLibrary compact label="Article photo" value={a.image} onSelect={image=>update(a.id,'image',image)}/>
          <Field className="admin-wide" label="Article" hint="Leave a blank line between paragraphs." rows={12} value={a.body} onChange={e=>update(a.id,'body',e.target.value)}/>
        </div>
      </div>
    </details>)}
  </div>;
}
