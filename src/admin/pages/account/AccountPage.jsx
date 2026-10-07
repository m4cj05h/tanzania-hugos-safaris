import {h} from '../../../locale';
import React, {useState} from 'react';
import {Check, KeyRound, UserRound} from 'lucide-react';
import {useAdmin} from '../../context';
import {api} from '../../api';
import {Card, Field} from '../../ui';
import '../users/users.css';

// Your own name, username and password. Every change needs your current password.
export default function AccountPage(){
  const {user,setUser,notify}=useAdmin();
  const [details,setDetails]=useState({name:user.name,username:user.username,currentPassword:''});
  const [passwords,setPasswords]=useState({currentPassword:'',newPassword:'',confirm:''});
  const [busy,setBusy]=useState(false);

  async function send(body,done){
    setBusy(true);notify(null);
    try{const r=await api('admin/account',{method:'PATCH',body:JSON.stringify(body)});setUser(r.user);done(r.user);}
    catch(err){notify(err.message,'error')}finally{setBusy(false)}
  }
  function saveDetails(e){
    e.preventDefault();
    send({name:details.name,username:details.username,currentPassword:details.currentPassword},u=>{setDetails({name:u.name,username:u.username,currentPassword:''});notify('Your details were saved. Use your new username next time you sign in.');});
  }
  function savePassword(e){
    e.preventDefault();
    if(passwords.newPassword!==passwords.confirm)return notify('The new passwords don’t match.','error');
    send({currentPassword:passwords.currentPassword,newPassword:passwords.newPassword},()=>{setPasswords({currentPassword:'',newPassword:'',confirm:''});notify('Your password was changed. Other devices were signed out.');});
  }

  return <div className="users-page">
    <div className="account-summary"><span className="users-avatar is-large" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
      <div><strong>{user.name}</strong><small>Signed in as {user.username}</small></div><span className={'admin-pill users-role-pill role-'+user.role}>{user.roleLabel}</span></div>

    <Card title={<><UserRound size={18}/> Name and username</>} text="The username is what you type to sign in.">
      <form className="users-form is-plain" onSubmit={saveDetails}>
        <div className="admin-form-grid">
          <Field label="Full name" value={details.name} maxLength={80} required onChange={e=>setDetails({...details,name:e.target.value})}/>
          <Field label="Username" value={details.username} maxLength={40} required autoCapitalize="none" spellCheck="false" hint="3–40 letters, numbers, dots, dashes or underscores." onChange={e=>setDetails({...details,username:e.target.value})}/>
          <Field label="Current password" type="password" autoComplete="current-password" value={details.currentPassword} required hint="Needed to confirm it’s you." onChange={e=>setDetails({...details,currentPassword:e.target.value})}/>
        </div>
        <div className="users-actions"><button type="submit" className="admin-primary" disabled={busy}><Check size={16}/>Save details</button></div>
      </form>
    </Card>

    <Card title={<><KeyRound size={18}/> Password</>} text="Use at least 10 characters. A few unrelated words make a strong, memorable password.">
      <form className="users-form is-plain" onSubmit={savePassword}>
        <div className="admin-form-grid">
          <Field label="Current password" type="password" autoComplete="current-password" value={passwords.currentPassword} required onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})}/>
          <span/>
          <Field label="New password" type="password" autoComplete="new-password" minLength={10} maxLength={200} value={passwords.newPassword} required onChange={e=>setPasswords({...passwords,newPassword:e.target.value})}/>
          <Field label="Repeat new password" type="password" autoComplete="new-password" minLength={10} maxLength={200} value={passwords.confirm} required onChange={e=>setPasswords({...passwords,confirm:e.target.value})}/>
        </div>
        <div className="users-actions"><button type="submit" className="admin-primary" disabled={busy}><Check size={16}/>Change password</button></div>
      </form>
    </Card>
  </div>;
}
