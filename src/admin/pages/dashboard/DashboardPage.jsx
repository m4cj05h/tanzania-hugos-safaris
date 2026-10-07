import {h} from '../../../locale';
import React from 'react';
import {Link} from 'react-router-dom';
import {Mail, Compass, BookOpen, ArrowRight, House, Images, Plus, Megaphone, Star, Inbox} from 'lucide-react';
import {useAdmin} from '../../context';
import {categories} from '../../../data';
import {homeGroupLabel} from '../../../home-content';
import {statusClass, formatDate, tripLabel} from '../enquiries/EnquiriesPage';
import './dashboard.css';

export default function DashboardPage(){
  const {draft,enquiries,user}=useAdmin();
  // Each person only sees the parts of the dashboard their role can open.
  const may=permission=>user.permissions.includes(permission);
  const hour=new Date().getHours();
  const fresh=enquiries.filter(e=>e.status==='New').length;
  const published=draft.packages.filter(p=>p.published);
  const stats=[
    ...(may('enquiries')?[[Inbox,fresh,'New enquiries',fresh?'Waiting for your reply':'You’re all caught up','/admin/enquiries','orange'],
    [Mail,enquiries.length,'All enquiries','Every traveller conversation','/admin/enquiries','blue']]:[]),
    ...(may('content')?[[Compass,published.length,'Published trips',draft.packages.length-published.length+' drafts waiting','/admin/trips','green'],
    [BookOpen,draft.articles.filter(a=>a.published).length,'Travel stories','On the travel guide','/admin/travel-guide','purple']]:[]),
  ];
  const shortcuts=!may('content')?[]:[
    [House,'Edit the homepage','Photos, headlines and trip groups','/admin/homepage'],
    [Plus,'Add or edit trips','Safaris, day trips, Zanzibar, climbs','/admin/trips'],
    [Images,'Upload photos','Use them anywhere on the site','/admin/photos'],
    [Megaphone,'Post a departure','Scheduled group climbs, safaris and Zanzibar trips','/admin/departures'],
    [BookOpen,'Write a story','Share travel tips on the guide','/admin/travel-guide'],
    [Star,'Add a review','Real words from real travellers','/admin/reviews'],
  ];
  const groups=categories.slice(1).map(name=>[name,published.filter(p=>p.category===name).length]);
  const most=Math.max(1,...groups.map(([,n])=>n));
  return <div className="dashboard">
    <p className="dashboard-hello">{hour<12?'Good morning':hour<18?'Good afternoon':'Good evening'}. Here’s what’s happening on your website.</p>
    <div className="dashboard-stats">{stats.map(([Icon,count,label,note,to,tone])=><Link to={to} className={'dashboard-stat tone-'+tone} key={label}><span className="dashboard-stat-icon"><Icon size={26} strokeWidth={1.8}/></span><strong>{count}</strong><span>{label}</span><small>{note}</small></Link>)}</div>
    <div className="dashboard-grid">
      {may('enquiries')&&<section className="admin-card"><div className="admin-card-head"><div><h2>Latest enquiries</h2><p>The five most recent messages from travellers.</p></div><Link className="admin-ghost" to="/admin/enquiries">See all <ArrowRight size={15}/></Link></div>
        {enquiries.length?<ul className="dashboard-enquiries">{enquiries.slice(0,5).map(e=><li key={e.id}><span className="enquiry-avatar" aria-hidden="true">{(e.name||'?').trim().charAt(0).toUpperCase()}</span><span><strong>{e.name}</strong><small>{tripLabel(e,draft.packages)||'Trip enquiry'}</small></span><span className={'admin-pill '+statusClass(e.status)}>{e.status}</span><time>{formatDate(e.created)}</time></li>)}</ul>:<p className="admin-muted">No enquiries yet. They’ll appear here as soon as travellers write to you.</p>}
      </section>}
      {may('content')&&<section className="admin-card"><div className="admin-card-head"><div><h2>Trips by group</h2><p>Published trips in each group.</p></div></div>
        <ul className="dashboard-bars">{groups.map(([name,count])=><li key={name}><span>{homeGroupLabel(name)}</span><span className="bar"><span style={{width:(count/most*100)+'%'}}/></span><strong>{count}</strong></li>)}</ul>
      </section>}
    </div>
    {shortcuts.length>0&&<h2 className="dashboard-subhead">Quick actions</h2>}
    {shortcuts.length>0&&<div className="dashboard-shortcuts">{shortcuts.map(([Icon,title,text,to])=><Link to={to} key={title}><span><Icon size={26} strokeWidth={1.8}/></span><strong>{title}</strong><small>{text}</small><ArrowRight className="go" size={16}/></Link>)}</div>}
  </div>;
}
