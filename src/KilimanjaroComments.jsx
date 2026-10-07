import React,{useEffect,useRef,useState} from 'react';
import {MessageCircle,Send,CornerDownRight,BadgeCheck} from 'lucide-react';
import {h} from './locale';

// Visitor comments go live as soon as they are posted; the team replies from the admin.

const avatarColours=['#f58a20','#2f8f83','#7a5cc7','#c2553f','#3a7bd5','#8a9a2b'];
const colourFor=name=>avatarColours[[...name].reduce((sum,char)=>sum+char.charCodeAt(0),0)%avatarColours.length];
const formatDate=date=>new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});

function Author({name,date,team,small}){
  return <div className={'kc-author'+(small?' is-small':'')}>
    {team?<span className="kc-avatar is-team"><img src="/images/logo.webp" alt=""/></span>
      :<span className="kc-avatar" style={{background:colourFor(name)}} aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>}
    <div className="kc-meta">
      <strong data-no-translate={team?undefined:true}>{team?'Tanzania Hugos Safaris':name}</strong>
      {team?<span className="kc-badge"><BadgeCheck size={13}/>Team reply</span>:<time dateTime={date}>{formatDate(date)}</time>}
    </div>
  </div>;
}

function CommentForm({parentId,busy,onSubmit,onCancel,compact}){
  return <form className={'kc-form'+(compact?' is-compact':'')} onSubmit={event=>onSubmit(event,parentId)}>
    <div className="kc-fields">
      <label>Your name<input name="name" maxLength="100" autoComplete="name" required/></label>
      <label>Email address <small>(never shown)</small><input name="email" type="email" maxLength="200" autoComplete="email" required/></label>
    </div>
    <label>{parentId?'Your reply':'Your comment or question'}<textarea name="text" rows={compact?3:5} minLength="3" maxLength="1500" required/></label>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off"/></label>
    <div className="kc-form-actions">
      <button type="submit" className="kc-submit" disabled={busy}>{busy?'Posting…':<>{parentId?'Post reply':'Post comment'}<Send size={15}/></>}</button>
      {onCancel&&<button type="button" className="kc-cancel" onClick={onCancel}>Cancel</button>}
    </div>
  </form>;
}

export default function KilimanjaroComments(){
  const [comments,setComments]=useState([]),[status,setStatus]=useState(null),[busy,setBusy]=useState(false),[replyTo,setReplyTo]=useState(null),[fresh,setFresh]=useState(null);
  const freshRef=useRef(null);
  useEffect(()=>{fetch('/api/kilimanjaro/comments').then(response=>response.ok?response.json():Promise.reject()).then(setComments).catch(()=>{})},[]);
  // Bring a just-posted comment into view.
  useEffect(()=>{if(fresh)freshRef.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})},[fresh]);

  async function submit(event,parentId){
    event.preventDefault();setBusy(true);setStatus(null);
    const form=event.currentTarget;const data={...Object.fromEntries(new FormData(form)),parentId:parentId||undefined};
    try{
      const response=await fetch('/api/kilimanjaro/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const result=await response.json();
      if(!response.ok)throw Error(result.error);
      if(result.comment){setComments(items=>[...items,result.comment]);setFresh(result.comment.id);}
      setStatus({ok:true,text:result.message,parentId:parentId||null});form.reset();setReplyTo(null);
    }catch(error){setStatus({ok:false,text:error.message&&error.message!=='API endpoint not found'?error.message:'Unable to post your comment right now. Please try again.',parentId:parentId||null})}
    finally{setBusy(false)}
  }

  const roots=comments.filter(comment=>!comment.parentId);
  const statusFor=parentId=>status&&status.parentId===parentId&&<p className={'kc-status'+(status.ok?' is-ok':' is-error')} role="status">{status.text}</p>;
  const mark=id=>id===fresh?{ref:freshRef,className:' is-fresh'}:{className:''};

  return <section className="kili-comments kili-section" aria-labelledby="kili-comments-title"><div className="container kc-wrap">
    <div className="kc-head">
      <span className="kili-section-kicker">Questions & stories</span>
      <h2 id="kili-comments-title">{comments.length?`${comments.length} ${comments.length===1?'comment':'comments'}`:'Start the conversation'}</h2>
      <p>Ask our team about the climb or share your own Kilimanjaro story. Your comment appears straight away.</p>
    </div>

    {roots.length>0?<ol className="kc-list">{roots.map(comment=>{const replies=comments.filter(child=>child.parentId===comment.id);const m=mark(comment.id);return <li className={'kc-thread'+m.className} key={comment.id} ref={m.ref}>
      <Author name={comment.name} date={comment.created}/>
      <p className="kc-text" data-no-translate>{comment.text}</p>
      <button className="kc-reply-link" type="button" aria-expanded={replyTo===comment.id} onClick={()=>setReplyTo(replyTo===comment.id?null:comment.id)}><CornerDownRight size={14}/>Reply</button>
      {(comment.reply||replies.length>0)&&<ol className="kc-replies">
        {comment.reply&&<li className="kc-reply is-team"><Author team small/><p className="kc-text" data-no-translate>{comment.reply}</p></li>}
        {replies.map(child=>{const c=mark(child.id);return <li className={'kc-reply'+c.className} key={child.id} ref={c.ref}>
          <Author name={child.name} date={child.created} small/><p className="kc-text" data-no-translate>{child.text}</p>
          {child.reply&&<div className="kc-reply is-team is-nested"><Author team small/><p className="kc-text" data-no-translate>{child.reply}</p></div>}
        </li>})}
      </ol>}
      {replyTo===comment.id&&<div className="kc-reply-form"><CommentForm parentId={comment.id} busy={busy} onSubmit={submit} onCancel={()=>setReplyTo(null)} compact/></div>}
      {statusFor(comment.id)}
    </li>})}</ol>
    :<div className="kc-empty"><MessageCircle size={26}/><p>No comments yet. Be the first to ask a question.</p></div>}

    <div className="kc-leave">
      <h3>Leave a comment or question</h3>
      <CommentForm busy={busy} onSubmit={submit}/>
      {statusFor(null)}
    </div>
  </div></section>;
}
