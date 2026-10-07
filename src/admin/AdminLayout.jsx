import {h} from '../locale';
import React, {useEffect, useRef, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router-dom';
import {ArrowUpRight, Menu, X, LogOut, Check, CircleAlert, RotateCcw} from 'lucide-react';
import {sectionGroups, sectionPath, canOpen} from './sections';
import './admin.css';

export default function AdminLayout({section, user, enquiries, dirty, busy, message, onPublish, onDiscard, onLogout, children}) {
  const [navOpen,setNavOpen]=useState(false);
  const menuButton=useRef(null);
  const location=useLocation();
  const fresh=enquiries.filter(e=>e.status==='New').length;
  const Icon=section.icon;
  useEffect(()=>setNavOpen(false),[location.pathname]);
  const publishButton=<button type="button" className="admin-primary" disabled={!dirty||busy} onClick={onPublish}>{busy?'Publishing…':'Publish changes'}<Check size={16}/></button>;
  return <section className={'admin admin-shell admin-page-'+section.slug} onKeyDown={e=>{if(e.key==='Escape'&&navOpen){setNavOpen(false);menuButton.current?.focus();}}}>
    <aside className={'admin-sidebar '+(navOpen?'is-open':'')} id="admin-sidebar">
      <Link to="/" className="admin-brand"><img src="/images/logo.webp" alt=""/><span><strong>TANZANIA</strong><small>Hugos Safaris</small></span></Link>
      <nav aria-label="Admin navigation">
        {sectionGroups.map(([group,all])=>[group,all.filter(item=>canOpen(item,user))]).filter(([,items])=>items.length).map(([group,items])=><div className="admin-nav-group" key={group}>
          <span className="admin-nav-label">{group}</span>
          {items.map(({slug,label,icon:ItemIcon})=><NavLink key={slug} to={sectionPath(slug)} end><ItemIcon size={18}/><span>{label}</span>{slug==='enquiries'&&fresh>0&&<small aria-label={fresh+' new'}>{fresh}</small>}</NavLink>)}
        </div>)}
      </nav>
      <div className="admin-sidebar-bottom"><Link to="/" target="_blank" rel="noreferrer"><ArrowUpRight size={17}/>View website</Link><button type="button" onClick={onLogout}><LogOut size={17}/>Sign out</button></div>
    </aside>
    {navOpen&&<button type="button" className="admin-scrim" aria-label="Close navigation" onClick={()=>setNavOpen(false)}/>}
    <div className="admin-main">
      <header className="admin-topbar">
        <button ref={menuButton} type="button" className="admin-menu-toggle" aria-label="Toggle admin navigation" aria-expanded={navOpen} aria-controls="admin-sidebar" onClick={()=>setNavOpen(!navOpen)}>{navOpen?<X size={20}/>:<Menu size={20}/>}</button>
        <span className="admin-crumbs"><Link to="/admin">Admin</Link><span aria-hidden="true">/</span><strong>{section.label}</strong></span>
        <div className="admin-topbar-actions">
          {dirty?<span className="admin-save-state is-dirty"><CircleAlert size={15}/>Unpublished changes</span>:<span className="admin-save-state"><Check size={15}/>Everything is published</span>}
          {dirty&&publishButton}
          <Link to="/admin/account" className="admin-user" title="My account"><span className="admin-avatar" aria-hidden="true">{(user.name||user.username).trim().charAt(0).toUpperCase()}</span><span className="admin-user-text"><strong>{user.name}</strong><small>{user.roleLabel}</small></span></Link>
        </div>
      </header>
      <main className="admin-content">
        <div className="admin-page-heading">
          <span className="admin-page-icon"><Icon size={30} strokeWidth={1.8}/></span>
          <div><h1>{section.title}</h1><p>{section.text}</p></div>
          {section.view&&<Link className="admin-ghost" to={section.view} target="_blank" rel="noreferrer">View on website <ArrowUpRight size={15}/></Link>}
        </div>
        {message&&<p role={message.type==='error'?'alert':'status'} className={'admin-message is-'+message.type}>{message.type==='error'?<CircleAlert size={17}/>:<Check size={17}/>}{message.text}</p>}
        {children}
        {section.publish&&<div className={'admin-publish-bar'+(dirty?' is-dirty':'')}>
          <span>{dirty?'You have changes that visitors can’t see yet.':'Changes go live after publishing.'}</span>
          <div>{dirty&&<button type="button" className="admin-ghost" onClick={onDiscard} disabled={busy}><RotateCcw size={15}/>Discard</button>}{publishButton}</div>
        </div>}
      </main>
    </div>
  </section>;
}
