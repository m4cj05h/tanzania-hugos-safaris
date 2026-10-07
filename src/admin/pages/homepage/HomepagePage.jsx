import {h} from '../../../locale';
import React from 'react';
import {ArrowUp, ArrowDown, Plus, Trash2, ChevronDown} from 'lucide-react';
import {useAdmin} from '../../context';
import {Card, Field, Toggle, move} from '../../ui';
import MediaLibrary from '../../components/MediaLibrary';
import SlideshowEditor from './SlideshowEditor';
import {getHome, homeTrips, homeGroupLabel, sitePages} from '../../../home-content';
import './homepage.css';

const blocks=[['slideshow','Slideshow'],['welcome','Welcome'],['explore','Explore tiles'],['afcon','AFCON banner'],['groups','Trip groups'],['beach','Safari + beach'],['story','Our story'],['faqs','Questions']];

// The homepage editor, one card per homepage section, in the order visitors see them.
export default function HomepagePage(){
  const {draft,setDraft}=useAdmin();
  const home=getHome(draft);
  const setHome=transform=>setDraft(current=>({...current,home:transform(getHome(current))}));
  const setPart=(part,key,value)=>setHome(current=>({...current,[part]:{...current[part],[key]:value}}));
  const setList=(part,transform)=>setHome(current=>({...current,[part]:transform(current[part])}));
  const setItem=(part,id,key,value)=>setList(part,items=>items.map(item=>item.id===id?{...item,[key]:value}:item));
  const setGroup=(name,patch)=>setHome(current=>({...current,journeys:{...current.journeys,groups:current.journeys.groups.map(group=>group.name===name?{...group,...patch}:group)}}));
  const text=(part,key,label,props={})=><Field label={label} value={home[part][key]} onChange={e=>setPart(part,key,e.target.value)} {...props}/>;

  return <div className="home-editor">
    <nav className="home-jump" aria-label="Homepage sections">{blocks.map(([id,label],i)=><a key={id} href={'#home-'+id}><span>{i+1}</span>{label}</a>)}</nav>

    <Card id="home-slideshow" title="1. Slideshow" text="The large photos at the very top. Move slides to change their order.">
      <SlideshowEditor/>
    </Card>

    <Card id="home-welcome" title="2. Welcome" text="The words under the slideshow.">
      <div className="admin-form-grid">
        {text('intro','eyebrow','Small heading',{maxLength:120})}
        {text('intro','title','Headline',{maxLength:200})}
        {text('intro','highlight','Highlighted line',{maxLength:200,hint:'Shown in italics under the headline.'})}
        {text('intro','text','Paragraph',{rows:3,maxLength:1500,className:'admin-wide'})}
      </div>
    </Card>

    <Card id="home-explore" title="3. Explore tiles" text="The big photo tiles that send visitors to each group of trips.">
      <div className="tile-editor">{home.experiences.map((tile,index)=><div className="tile-card" key={tile.id}>
        <div className="tile-preview"><img src={'/images/'+tile.image} alt=""/><span>{String(index+1).padStart(2,'0')}</span><strong>{tile.title}</strong></div>
        <div className="tile-fields">
          <Field label="Title" maxLength={120} value={tile.title} onChange={e=>setItem('experiences',tile.id,'title',e.target.value)}/>
          <Field label="Short line" maxLength={300} value={tile.text} onChange={e=>setItem('experiences',tile.id,'text',e.target.value)}/>
          <Field label="Opens page"><select value={tile.link} onChange={e=>setItem('experiences',tile.id,'link',e.target.value)}>{sitePages.map(([path,name])=><option key={path} value={path}>{name}</option>)}{!sitePages.some(([path])=>path===tile.link)&&<option value={tile.link}>{tile.link}</option>}</select></Field>
          <MediaLibrary compact label="Photo" value={tile.image} onSelect={image=>setItem('experiences',tile.id,'image',image)}/>
          <div className="admin-row-actions">
            <button type="button" disabled={index===0} onClick={()=>setList('experiences',items=>move(items,index,-1))} aria-label={'Move '+tile.title+' earlier'}><ArrowUp size={15}/>Earlier</button>
            <button type="button" disabled={index===home.experiences.length-1} onClick={()=>setList('experiences',items=>move(items,index,1))} aria-label={'Move '+tile.title+' later'}><ArrowDown size={15}/>Later</button>
            <button type="button" className="danger" disabled={home.experiences.length===1} onClick={()=>setList('experiences',items=>items.filter(item=>item.id!==tile.id))}><Trash2 size={15}/>Remove</button>
          </div>
        </div>
      </div>)}</div>
      <button type="button" className="admin-add" disabled={home.experiences.length>=8} onClick={()=>setList('experiences',items=>[...items,{id:crypto.randomUUID(),title:'Day trips',text:'One unforgettable day at a time.',image:'trip-materuni.webp',link:'/day-trips'}])}><Plus size={16}/>Add tile</button>
    </Card>

    <Card id="home-afcon" title="4. AFCON banner" text="The football banner. Turn it off when the tournament is over." actions={<Toggle checked={home.afcon.show} onChange={value=>setPart('afcon','show',value)} label="Show on homepage"/>}>
      <div className="admin-form-grid">
        <Field className="admin-wide" label="Headline" value={draft.announcement} onChange={e=>setDraft(current=>({...current,announcement:e.target.value}))}/>
        {text('afcon','eyebrow','Small heading',{maxLength:200})}
        {text('afcon','text','Paragraph',{rows:2,maxLength:1500})}
      </div>
    </Card>

    <Card id="home-groups" title="5. Trip groups" text="The tabs under “Find your next great adventure”. Each tab shows three trips — pick the ones you want first, or leave it on automatic.">
      <div className="admin-form-grid">
        <Field label="Headline" maxLength={200} value={home.journeys.title} onChange={e=>setPart('journeys','title',e.target.value)}/>
        <Field label="Highlighted words" maxLength={200} value={home.journeys.highlight} onChange={e=>setPart('journeys','highlight',e.target.value)}/>
      </div>
      <div className="group-editor">{home.journeys.groups.map(group=>{
        const options=draft.packages.filter(p=>p.published&&p.category===group.name);
        const shown=homeTrips(draft.packages,group);
        return <details className={'admin-row group-row'+(group.show?'':' is-hidden')} key={group.name}>
          <summary><span className="admin-row-title"><strong>{homeGroupLabel(group.name)}</strong><small>{!group.show?'Hidden':options.length?options.length+' trips · '+(group.featured.length?group.featured.length+' chosen':'automatic'):'No published trips yet'}</small></span><span className="group-thumbs">{shown.map(p=><img key={p.id} src={'/images/'+p.image} alt=""/>)}</span><ChevronDown className="admin-row-chevron" size={18}/></summary>
          <div className="admin-row-body">
            <Toggle checked={group.show} onChange={value=>setGroup(group.name,{show:value})} label="Show this tab on the homepage"/>
            <div className="group-picks">{[0,1,2].map(slot=><Field key={slot} label={['First trip','Second trip','Third trip'][slot]}><select value={group.featured[slot]||''} onChange={e=>{const featured=[...group.featured];featured[slot]=e.target.value;setGroup(group.name,{featured:[...new Set(featured.filter(Boolean))]});}}><option value="">Automatic</option>{options.map(p=><option key={p.id} value={p.id} disabled={group.featured.includes(p.id)&&group.featured[slot]!==p.id}>{p.name} · {p.days===1?'1 day':p.days+' days'}</option>)}</select></Field>)}</div>
            <div className="group-preview">{shown.map(p=><div key={p.id}><img src={'/images/'+p.image} alt=""/><strong>{p.name}</strong><small>{p.category} · {p.days===1?'1 day':p.days+' days'}</small></div>)}{!shown.length&&<p>No published trips in this group yet. The tab shows an empty row until you publish one.</p>}</div>
          </div>
        </details>;
      })}</div>
    </Card>

    <Card id="home-story" title="6. Our story" text="The section about your team, with its photo.">
      <div className="admin-form-grid">
        {text('story','eyebrow','Small heading',{maxLength:200})}
        {text('story','title','Headline',{maxLength:300})}
        {text('story','highlight','Highlighted line',{maxLength:200})}
        {text('story','text','Paragraph',{rows:3,maxLength:1500})}
        <MediaLibrary compact label="Photo" value={home.story.image} onSelect={image=>setPart('story','image',image)}/>
      </div>
    </Card>

    <Card id="home-faqs" title="7. Questions" text="The questions near the bottom of the homepage. They also appear on every trip page. Write {{USD 650}} to show a price in the visitor’s currency.">
      {home.faqs.map((faq,index)=><details className="admin-row" key={faq.id}>
        <summary><span className="admin-row-title"><strong>{faq.question||'New question'}</strong></span><ChevronDown className="admin-row-chevron" size={18}/></summary>
        <div className="admin-row-body">
          <div className="admin-form-grid">
            <Field className="admin-wide" label="Question" maxLength={300} value={faq.question} onChange={e=>setItem('faqs',faq.id,'question',e.target.value)}/>
            <Field className="admin-wide" label="Answer" rows={4} maxLength={3000} value={faq.answer} onChange={e=>setItem('faqs',faq.id,'answer',e.target.value)}/>
          </div>
          <div className="admin-row-actions">
            <button type="button" disabled={index===0} onClick={()=>setList('faqs',items=>move(items,index,-1))}><ArrowUp size={15}/>Move up</button>
            <button type="button" disabled={index===home.faqs.length-1} onClick={()=>setList('faqs',items=>move(items,index,1))}><ArrowDown size={15}/>Move down</button>
            <button type="button" className="danger" onClick={()=>setList('faqs',items=>items.filter(item=>item.id!==faq.id))}><Trash2 size={15}/>Remove</button>
          </div>
        </div>
      </details>)}
      <button type="button" className="admin-add" disabled={home.faqs.length>=20} onClick={()=>setList('faqs',items=>[...items,{id:crypto.randomUUID(),question:'',answer:''}])}><Plus size={16}/>Add question</button>
    </Card>
  </div>;
}
