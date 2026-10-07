import {h} from '../../../locale';
import React, {useState} from 'react';
import {AlertCircle, ArrowRight, Eye, EyeOff, Lock, User} from 'lucide-react';
import {api} from '../../api';
import './login.css';

export default function LoginPage({onLogin}){
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[show,setShow]=useState(false);
  async function login(e){
    e.preventDefault();setMessage('');setBusy(true);
    const form=new FormData(e.target);
    try{await api('login',{method:'POST',body:JSON.stringify({username:form.get('username'),password:form.get('password')})});onLogin();}
    catch(err){setMessage(err.message);}
    finally{setBusy(false);}
  }
  return <section className="admin-login">
    <div className="admin-login-side">
      <form className="admin-login-card" onSubmit={login}>
        <img className="admin-login-logo" src="/images/logo.webp" alt="Tanzania Hugos Safaris"/>
        <h1 className="admin-login-title">Welcome back.</h1>
        <label className="admin-login-field"><span>Username</span>
          <span className="admin-login-input"><User size={17} aria-hidden="true"/><input name="username" autoComplete="username" autoCapitalize="none" spellCheck="false" maxLength="200" required autoFocus/></span>
        </label>
        <label className="admin-login-field"><span>Password</span>
          <span className="admin-login-input"><Lock size={17} aria-hidden="true"/><input name="password" type={show?'text':'password'} autoComplete="current-password" maxLength="200" required/>
            <button type="button" className="admin-login-eye" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'} aria-pressed={show}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>
          </span>
        </label>
        {message&&<p role="alert" className="admin-login-error"><AlertCircle size={16}/>{message}</p>}
        <button className="admin-login-submit" type="submit" disabled={busy}>{busy?'Signing in…':<>Sign in <ArrowRight size={17}/></>}</button>
      </form>
    </div>
  </section>;
}
