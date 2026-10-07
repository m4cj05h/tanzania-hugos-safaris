import {h} from '../locale';
import React from 'react';

export function Field({label,hint,className,children,...props}){
  return <label className={className}>{label}{children||(props.rows?<textarea {...props}/>:<input {...props}/>)}{hint&&<small>{hint}</small>}</label>;
}
export function Toggle({checked,onChange,label}){
  return <label className="admin-toggle"><input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)}/><span aria-hidden="true"/>{label}</label>;
}
export function Card({id,title,text,actions,children}){
  return <section className="admin-card" id={id}><div className="admin-card-head"><div><h2>{title}</h2>{text&&<p>{text}</p>}</div>{actions}</div>{children}</section>;
}
export function Empty({icon:Icon,title,text,children}){
  return <div className="admin-empty">{Icon&&<span className="admin-empty-icon"><Icon size={38} strokeWidth={1.6}/></span>}<h3>{title}</h3>{text&&<p>{text}</p>}{children}</div>;
}
// Move an item up (-1) or down (1) in a list.
export const move=(items,index,direction)=>{const next=[...items];[next[index],next[index+direction]]=[next[index+direction],next[index]];return next;};
