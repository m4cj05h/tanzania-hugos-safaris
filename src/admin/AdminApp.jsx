import {h} from '../locale';
import React, {useEffect, useState} from 'react';
import {Navigate, useParams} from 'react-router-dom';
import {api} from './api';
import {AdminContext} from './context';
import {sections,canOpen} from './sections';
import AdminLayout from './AdminLayout';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EnquiriesPage from './pages/enquiries/EnquiriesPage';
import HomepagePage from './pages/homepage/HomepagePage';
import PhotosPage from './pages/photos/PhotosPage';
import PartnersPage from './pages/partners/PartnersPage';
import VideosPage from './pages/videos/VideosPage';
import TripsPage from './pages/trips/TripsPage';
import KilimanjaroRoutesPage from './pages/kilimanjaro-routes/KilimanjaroRoutesPage';
import DeparturesPage from './pages/departures/DeparturesPage';
import BlogPage from './pages/blog/BlogPage';
import TravelGuidePage from './pages/travel-guide/TravelGuidePage';
import ReviewsPage from './pages/reviews/ReviewsPage';
import CommentsPage from './pages/comments/CommentsPage';
import TranslationsPage from './pages/translations/TranslationsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import UsersPage from './pages/users/UsersPage';
import AccountPage from './pages/account/AccountPage';

const pages={dashboard:DashboardPage,enquiries:EnquiriesPage,homepage:HomepagePage,photos:PhotosPage,partners:PartnersPage,videos:VideosPage,trips:TripsPage,'kilimanjaro-routes':KilimanjaroRoutesPage,departures:DeparturesPage,'travel-guide':TravelGuidePage,blog:BlogPage,reviews:ReviewsPage,comments:CommentsPage,translations:TranslationsPage,payments:PaymentsPage,settings:SettingsPage,users:UsersPage,account:AccountPage};

// /admin/<page>: signs in, keeps one shared draft of the website and publishes it.
export default function AdminApp({content,setContent}){
  const path=(useParams()['*']||'').replace(/\/+$/,'');
  const slug=path||'dashboard';
  const [user,setUser]=useState(null),[checked,setChecked]=useState(false);
  const logged=!!user;
  const [draft,setDraft]=useState(null),[published,setPublished]=useState('');
  const [enquiries,setEnquiries]=useState([]),[message,setMessage]=useState(null),[busy,setBusy]=useState(false);
  const notify=(text,type='success')=>setMessage(text?{text,type}:null);
  const dirty=!!draft&&JSON.stringify(draft)!==published;

  const loadSession=()=>api('admin/session').then(r=>setUser(r.user)).catch(()=>setUser(null));
  useEffect(()=>{loadSession().finally(()=>setChecked(true));},[]);
  useEffect(()=>{if(logged)api('admin/content').then(c=>{setDraft(c);setPublished(JSON.stringify(c));}).catch(e=>notify(e.message,'error'));},[logged]);
  useEffect(()=>{setMessage(null);window.scrollTo(0,0);},[slug]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=e=>{e.preventDefault();e.returnValue='';};
    window.addEventListener('beforeunload',warn);
    return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  useEffect(()=>{
    if(!logged||!user.permissions.includes('enquiries'))return;
    const controller=new AbortController();
    let pending=false,firstLoad=true;
    async function refreshEnquiries(){
      if(document.hidden||pending)return;
      pending=true;
      try{
        const latest=await api('admin/enquiries',{signal:controller.signal,cache:'no-store'});
        if(!controller.signal.aborted){setEnquiries(latest);firstLoad=false;}
      }catch(e){
        if(!controller.signal.aborted&&firstLoad)notify(e.message,'error');
      }finally{pending=false;}
    }
    refreshEnquiries();
    const timer=window.setInterval(refreshEnquiries,15000);
    window.addEventListener('focus',refreshEnquiries);
    document.addEventListener('visibilitychange',refreshEnquiries);
    return ()=>{
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus',refreshEnquiries);
      document.removeEventListener('visibilitychange',refreshEnquiries);
    };
  },[logged,user?.permissions.join()]);

  async function publish(){
    setBusy(true);notify(null);
    try{await api('content',{method:'PUT',body:JSON.stringify(draft)});setContent(structuredClone(draft));setPublished(JSON.stringify(draft));notify('Changes published successfully.');}
    catch(e){notify(e.message,'error');}
    finally{setBusy(false);}
  }
  function discard(){if(window.confirm('Discard all changes you haven’t published?')){setDraft(JSON.parse(published));notify('Unpublished changes discarded.');}}
  async function logout(){
    if(dirty&&!window.confirm('You have unpublished changes. Sign out anyway?'))return;
    try{await api('logout',{method:'POST'});setUser(null);setEnquiries([]);setDraft(null);setPublished('');notify(null);}catch(e){notify(e.message,'error');}
  }

  if(!checked)return <p className="admin-loading">Loading…</p>;
  if(!logged)return <LoginPage onLogin={loadSession}/>;
  const section=sections.find(s=>s.slug===slug);
  if(!section||path==='dashboard'||!canOpen(section,user))return <Navigate to="/admin" replace/>;
  if(!draft)return <p className="admin-loading">Loading your dashboard…</p>;
  const Page=pages[slug];
  return <AdminContext.Provider value={{draft,setDraft,content,enquiries,setEnquiries,notify,logout,user,setUser}}>
    <AdminLayout section={section} user={user} enquiries={enquiries} dirty={dirty} busy={busy} message={message} onPublish={publish} onDiscard={discard} onLogout={logout}>
      <Page/>
    </AdminLayout>
  </AdminContext.Provider>;
}
