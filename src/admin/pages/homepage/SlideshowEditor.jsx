import {useAdmin} from '../../context';
import {h} from '../../../locale';
import {ArrowUp, ArrowDown, Plus, Trash2, ChevronDown} from 'lucide-react';
import MediaLibrary from '../../components/MediaLibrary';
import {getHeroSlides} from '../../../hero-slides';
import {Field, move} from '../../ui';

export default function SlideshowEditor() {
  const {draft,setDraft}=useAdmin();
  const slides=getHeroSlides(draft);
  function change(transform){setDraft(current=>{
    const next=transform(getHeroSlides(current));
    return {...current,heroSlides:next,heroTitle:next[0].title,heroSubtitle:next[0].description};
  });}
  function update(id,key,value){change(items=>items.map(item=>item.id===id?{...item,[key]:value}:item));}
  return <div className="slide-editor">
    {slides.map((slide,index)=><details className="admin-row" key={slide.id}>
      <summary><img src={'/images/'+slide.image} alt=""/><span className="admin-row-title"><strong>{slide.label||'Untitled slide'}</strong><small>{index===0?'First slide':'Slide '+(index+1)} · {slide.duration??6.5}s</small></span><ChevronDown className="admin-row-chevron" size={18}/></summary>
      <div className="admin-row-body">
        <div className="admin-form-grid">
          <Field label="Slide name" maxLength={120} value={slide.label} onChange={e=>update(slide.id,'label',e.target.value)}/>
          <Field label="Display time (seconds)" hint="1–120 seconds before the next slide." type="number" min={1} max={120} step={0.5} value={slide.duration??6.5} onChange={e=>update(slide.id,'duration',e.target.value===''?'':Number(e.target.value))}/>
          <Field className="admin-wide" label="Headline" hint="Start a new line for the highlighted second line." rows={2} maxLength={500} value={slide.title} onChange={e=>update(slide.id,'title',e.target.value)}/>
          <Field className="admin-wide" label="Introduction" rows={3} maxLength={2000} value={slide.description} onChange={e=>update(slide.id,'description',e.target.value)}/>
          <Field label="Location caption" maxLength={200} value={slide.place} onChange={e=>update(slide.id,'place',e.target.value)}/>
          <MediaLibrary compact label="Slide photo" value={slide.image} onSelect={image=>update(slide.id,'image',image)}/>
        </div>
        <div className="admin-row-actions">
          <button type="button" disabled={index===0} onClick={()=>change(items=>move(items,index,-1))}><ArrowUp size={15}/>Move up</button>
          <button type="button" disabled={index===slides.length-1} onClick={()=>change(items=>move(items,index,1))}><ArrowDown size={15}/>Move down</button>
          <button type="button" className="danger" disabled={slides.length===1} onClick={()=>{if(window.confirm('Remove this slide? Publish changes to update the website.'))change(items=>items.filter(item=>item.id!==slide.id));}}><Trash2 size={15}/>Remove</button>
        </div>
      </div>
    </details>)}
    <button type="button" className="admin-add" disabled={slides.length>=12} onClick={()=>change(items=>[...items,{id:crypto.randomUUID(),label:'New slide',title:'Your next adventure',description:'Discover Tanzania with us.',place:'Tanzania',image:'safari.webp'}])}><Plus size={16}/>Add slide</button>
  </div>;
}
