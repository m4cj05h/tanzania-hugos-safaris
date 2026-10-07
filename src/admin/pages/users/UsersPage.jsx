import {h} from '../../../locale';
import React, {useEffect, useState} from 'react';
import {UserPlus, Trash2, KeyRound, Check, ShieldCheck, PenLine, Inbox} from 'lucide-react';
import {useAdmin} from '../../context';
import {api} from '../../api';
import {Card, Field, Toggle} from '../../ui';
import './users.css';

// What each role can do, shown when choosing a role.
const roleInfo={
  owner:{icon:ShieldCheck,text:'Everything, including adding people and changing their roles.'},
  editor:{icon:PenLine,text:'Website pages, trips, blog, photos, videos, reviews and comments. No enquiries or users.'},
  sales:{icon:Inbox,text:'Customer enquiries and comments only. Can’t change the website.'},
};
const blank={name:'',username:'',role:'editor',password:''};

function RolePicker({value,onChange,roles,name}){
  return <fieldset className="users-roles"><legend>Role</legend>{Object.entries(roles).map(([id,label])=>{const Info=roleInfo[id];return <label key={id} className={'users-role'+(value===id?' is-on':'')}>
    <input type="radio" name={name} value={id} checked={value===id} onChange={()=>onChange(id)}/>
    {Info&&<Info.icon size={18} aria-hidden="true"/>}<span><strong>{label}</strong>{Info&&<small>{Info.text}</small>}</span>
  </label>})}</fieldset>;
}

export default function UsersPage(){
  const {user:me,setUser,notify}=useAdmin();
  const [list,setList]=useState(null),[roles,setRoles]=useState({}),[form,setForm]=useState(blank),[adding,setAdding]=useState(false);
  const [editing,setEditing]=useState(null),[busy,setBusy]=useState(false);
  const load=()=>api('admin/users').then(r=>{setList(r.users);setRoles(r.roles)}).catch(e=>notify(e.message,'error'));
  useEffect(()=>{load()},[]);

  async function add(e){
    e.preventDefault();setBusy(true);notify(null);
    try{const r=await api('admin/users',{method:'POST',body:JSON.stringify(form)});notify(`${r.user.name} can now sign in as “${r.user.username}”.`);setForm(blank);setAdding(false);load();}
    catch(err){notify(err.message,'error')}finally{setBusy(false)}
  }
  async function save(e){
    e.preventDefault();setBusy(true);notify(null);
    const {id,username,name,role,active,password}=editing;
    try{const r=await api('admin/users/'+id,{method:'PATCH',body:JSON.stringify({username,name,role,active,password:password||undefined})});
      notify(`Saved ${r.user.name}.${password?' Their new password works now and they were signed out elsewhere.':''}`);if(id===me.id)setUser(r.user);setEditing(null);load();}
    catch(err){notify(err.message,'error')}finally{setBusy(false)}
  }
  async function remove(u){
    if(!window.confirm(`Remove ${u.name} (${u.username})? They will be signed out and can no longer sign in.`))return;
    setBusy(true);notify(null);
    try{await api('admin/users/'+u.id,{method:'DELETE'});notify(`${u.name} was removed.`);setEditing(null);load();}
    catch(err){notify(err.message,'error')}finally{setBusy(false)}
  }

  if(!list)return <p className="admin-loading">Loading users…</p>;
  return <div className="users-page">
    <Card title="People who can sign in" text="Everyone signs in with their own username and password. Give each person only the role they need."
      actions={!adding&&<button type="button" className="admin-primary" onClick={()=>{setAdding(true);setEditing(null)}}><UserPlus size={16}/>Add user</button>}>
      {adding&&<form className="users-form" onSubmit={add}>
        <h3>New user</h3>
        <div className="admin-form-grid">
          <Field label="Full name" value={form.name} maxLength={80} required onChange={e=>setForm({...form,name:e.target.value})}/>
          <Field label="Username" value={form.username} maxLength={40} required autoCapitalize="none" spellCheck="false" hint="3–40 letters, numbers, dots, dashes or underscores." onChange={e=>setForm({...form,username:e.target.value})}/>
          <Field label="Password" type="password" autoComplete="new-password" value={form.password} minLength={10} maxLength={200} required hint="At least 10 characters. Share it privately; they can change it in My account." onChange={e=>setForm({...form,password:e.target.value})}/>
        </div>
        <RolePicker value={form.role} roles={roles} name="new-role" onChange={role=>setForm({...form,role})}/>
        <div className="users-actions"><button type="submit" className="admin-primary" disabled={busy}><Check size={16}/>{busy?'Adding…':'Add user'}</button><button type="button" className="admin-ghost" onClick={()=>{setAdding(false);setForm(blank)}}>Cancel</button></div>
      </form>}

      <ul className="users-list">{list.map(u=>{const open=editing?.id===u.id;return <li key={u.id} className={'users-item'+(u.active?'':' is-off')+(open?' is-open':'')}>
        <div className="users-row">
          <span className="users-avatar" aria-hidden="true">{u.name.trim().charAt(0).toUpperCase()}</span>
          <span className="users-who"><strong>{u.name}{u.id===me.id&&<em> (you)</em>}</strong><small>{u.username}</small></span>
          <span className={'admin-pill users-role-pill role-'+u.role}>{u.roleLabel}</span>
          {!u.active&&<span className="admin-pill is-draft">Can’t sign in</span>}
          <button type="button" className="admin-ghost" onClick={()=>{setEditing(open?null:{...u,password:''});setAdding(false)}}>{open?'Close':'Edit'}</button>
        </div>
        {open&&<form className="users-form" onSubmit={save}>
          <div className="admin-form-grid">
            <Field label="Full name" value={editing.name} maxLength={80} required onChange={e=>setEditing({...editing,name:e.target.value})}/>
            <Field label="Username" value={editing.username} maxLength={40} required autoCapitalize="none" spellCheck="false" onChange={e=>setEditing({...editing,username:e.target.value})}/>
            <Field label={<><KeyRound size={14}/> New password</>} type="password" autoComplete="new-password" value={editing.password} minLength={10} maxLength={200} placeholder="Leave empty to keep the current one" hint="Setting one signs them out on other devices." onChange={e=>setEditing({...editing,password:e.target.value})}/>
          </div>
          <RolePicker value={editing.role} roles={roles} name={'role-'+u.id} onChange={role=>setEditing({...editing,role})}/>
          {u.id!==me.id&&<Toggle checked={editing.active} label="Allowed to sign in" onChange={active=>setEditing({...editing,active})}/>}
          <div className="users-actions">
            <button type="submit" className="admin-primary" disabled={busy}><Check size={16}/>{busy?'Saving…':'Save changes'}</button>
            <button type="button" className="admin-ghost" onClick={()=>setEditing(null)}>Cancel</button>
            {u.id!==me.id&&<button type="button" className="admin-ghost users-remove" onClick={()=>remove(u)} disabled={busy}><Trash2 size={15}/>Remove user</button>}
          </div>
        </form>}
      </li>})}</ul>
    </Card>
  </div>;
}
