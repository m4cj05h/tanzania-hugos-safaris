import {h} from './locale';
import React, {useState, useRef} from 'react';
import {ArrowUpRight, ArrowRight, Menu, X, Settings, LayoutDashboard, House, BookOpen, Star, CreditCard, Compass, Globe, Mail, LogOut, Images, Handshake, Video, Megaphone, MessageCircle} from 'lucide-react';
import {Link} from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './admin.css';
import MediaLibrary from './MediaLibrary';
import AnnouncementsEditor from './AnnouncementsEditor';
import CommentsAdmin from './CommentsAdmin';

const sections = [
  ['Enquiries', LayoutDashboard, 'Keep every conversation moving towards an unforgettable journey.'],
  ['Homepage', House, 'Make a memorable first impression on your travellers.'],
  ['Announcements', Megaphone, 'Post important Kilimanjaro news and planning updates.'],
  ['Comments', MessageCircle, 'Review and reply to Kilimanjaro visitor comments.'],
  ['Packages', Compass, 'Curate the journeys that bring Tanzania to life.'],
  ['Travel guide', BookOpen, 'Share local knowledge and inspire the next adventure.'],
  ['Photos', Images, 'Upload your photos once. Choose them for any article or safari package.'],
  ['Partners', Handshake, 'Manage the logos in your homepage partner slideshow.'],
  ['Videos', Video, 'Upload videos or add links, then choose where they appear.'],
  ['Translations', Globe, 'Welcome your travellers in their own language.'],
  ['Reviews', Star, 'Let your travellers tell their stories.'],
  ['Payments', CreditCard, 'Review payment availability for your website.'],
  ['Settings', Settings, 'Manage your website preferences and workspace.'],
];

export default function AdminLayout({tab, setTab, enquiries, content, draft, setDraft, onLogout, children}) {
  const [navOpen, setNavOpen] = useState(false);
  const menuButton = useRef(null);
  function navigate(name) {
    setTab(name);
    setNavOpen(false);
    if (navOpen) menuButton.current?.focus();
  }
  return <section className={`admin admin-shell admin-tab-${tab.toLowerCase().replace(/\s+/g,'-')}`} onKeyDown={e=>{
    if (e.key==='Escape' && navOpen) {setNavOpen(false);menuButton.current?.focus();}
  }}>
    <aside className={'admin-sidebar '+(navOpen?'is-open':'')} id="admin-sidebar">
      <Link to="/" className="admin-brand"><img src="/images/logo.webp" alt=""/><span><strong>TANZANIA</strong><small>Hugos Safaris</small></span></Link>
      <nav aria-label="Admin navigation">
        <span className="admin-nav-label">WORKSPACE</span>
        {sections.map(([name, Icon], i)=><React.Fragment key={name}>
          {i===11&&<span className="admin-nav-label admin-nav-divider">MANAGEMENT</span>}
          <button className={tab===name?'active':''} aria-current={tab===name?'page':undefined} onClick={()=>navigate(name)}><Icon size={18}/><span>{name}</span>{name==='Enquiries'&&<small aria-hidden="true">{enquiries.length}</small>}</button>
        </React.Fragment>)}
      </nav>
      <div className="admin-sidebar-bottom"><Link to="/" target="_blank" rel="noreferrer"><ArrowUpRight size={17}/>View website</Link><button onClick={onLogout}><LogOut size={17}/>Sign out</button><small>TANZANIA HUGOS SAFARIS</small></div>
    </aside>
    <div className="admin-main">
      <div className="admin-topbar"><button ref={menuButton} className="admin-menu-toggle" aria-label="Toggle admin navigation" aria-expanded={navOpen} aria-controls="admin-sidebar" onClick={()=>setNavOpen(!navOpen)}>{navOpen?<X size={20}/>:<Menu size={20}/>}</button><span>Workspace <span className="admin-breadcrumb">/</span> <strong>{tab}</strong></span><div className="admin-account"><span>Administrator</span><span className="admin-avatar">A</span></div></div>
      <main className="admin-content">
        <div className="admin-page-heading"><div><h1>{tab==='Enquiries'?'Your website, at a glance.':tab}</h1><p>{sections.find(([name])=>name===tab)?.[2]}</p></div><Link className="admin-preview" to="/" target="_blank" rel="noreferrer">View website <ArrowUpRight size={16}/></Link></div>
        {tab==='Enquiries'&&<div className="admin-stats">{[[Mail,enquiries.length,'Trip enquiries','All traveller conversations'],[Compass,content.packages.filter(p=>p.published).length,'Published journeys','Ready for the next adventure'],[BookOpen,content.articles.filter(a=>a.published).length,'Published articles','Stories from Tanzania']].map(([Icon,count,label,note])=><div key={label}><span className="admin-stat-label">{label}<Icon size={18}/></span><strong>{count}</strong><small>{note}</small></div>)}</div>}
        <div className="admin-panel">
          {tab==='Announcements'&&<AnnouncementsEditor draft={draft} setDraft={setDraft}/>}
          {tab==='Comments'&&<CommentsAdmin/>}
          {tab==='Photos'&&<MediaLibrary/>}
          {tab==='Packages'&&<section className="route-admin-editor"><span className="eyebrow">KILIMANJARO ROUTES</span><h2>Route details & prices</h2><p>Edit what visitors see after selecting “More about this trip”. Prices are starting prices per person in USD; enter 0 to show “Price on request”.</p>{(draft.kilimanjaroRoutes||[]).map((route,index)=><details className="editor-item" key={route.slug}><summary>{route.name}<span>{route.days} days · {route.price?`$${route.price}`:'Price on request'}</span></summary><div className="editor-form form-grid"><label>Route name<input value={route.name} onChange={event=>setDraft({...draft,kilimanjaroRoutes:draft.kilimanjaroRoutes.map((item,i)=>i===index?{...item,name:event.target.value}:item)})}/></label><label>Days<input type="number" min="1" value={route.days} onChange={event=>setDraft({...draft,kilimanjaroRoutes:draft.kilimanjaroRoutes.map((item,i)=>i===index?{...item,days:Number(event.target.value)}:item)})}/></label><label>Starting price USD (0 = price on request)<input type="number" min="0" value={route.price} onChange={event=>setDraft({...draft,kilimanjaroRoutes:draft.kilimanjaroRoutes.map((item,i)=>i===index?{...item,price:Number(event.target.value)}:item)})}/></label><label className="route-admin-wide">Introduction / overview<textarea rows="5" value={route.overview} onChange={event=>setDraft({...draft,kilimanjaroRoutes:draft.kilimanjaroRoutes.map((item,i)=>i===index?{...item,overview:event.target.value}:item)})}/></label><label className="route-admin-wide">Day-by-day itinerary (one day per line)<textarea rows="9" value={route.itinerary.join('\n')} onChange={event=>setDraft({...draft,kilimanjaroRoutes:draft.kilimanjaroRoutes.map((item,i)=>i===index?{...item,itinerary:event.target.value.split('\n').filter(Boolean)}:item)})}/></label></div></details>)}</section>}
          {tab==='Settings'&&<div className="admin-settings">
            <div className="admin-settings-title"><Settings size={22}/><div><h2>Website settings</h2><p>A few details that make your workspace yours.</p></div></div>
            <div className="admin-setting-row"><div><h3>Website announcement</h3><p>Update the AFCON announcement on your homepage. Publish to make it live.</p></div><label>Announcement text<textarea rows={3} value={draft.announcement} onChange={e=>setDraft({...draft,announcement:e.target.value})}/></label></div>
            <div className="admin-setting-row"><div><h3>Appearance</h3><p>Choose a light or dark display. Your preference is saved on this browser.</p></div><ThemeToggle/></div>
            <div className="admin-setting-row"><div><h3>Languages & translations</h3><p>Manage translated content for international travellers.</p></div><button onClick={()=>navigate('Translations')}>Manage translations <ArrowRight size={16}/></button></div>
            <div className="admin-setting-row"><div><h3>Payments</h3><p>Review the current payment options for your website.</p></div><button onClick={()=>navigate('Payments')}>View payments <ArrowRight size={16}/></button></div>
          </div>}
          {children}
        </div>
        <div className="admin-footnote">Locally rooted journeys. Thoughtfully managed.</div>
      </main>
    </div>
  </section>;
}
