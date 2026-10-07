import {h} from '../../../locale';
import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, LogOut} from 'lucide-react';
import {useAdmin} from '../../context';
import ThemeToggle from '../../../ThemeToggle';

export default function SettingsPage(){
  const {logout,user}=useAdmin();
  const may=permission=>user.permissions.includes(permission);
  const rows=[
    ['Appearance','Choose a light or dark display. Your choice is saved on this browser.',<ThemeToggle/>],
    ...(!may('content')?[]:[['Homepage','Photos, headlines, trip groups and questions on the homepage.',<Link className="admin-ghost" to="/admin/homepage">Edit homepage <ArrowRight size={15}/></Link>]]),
    ...(!may('content')?[]:[['Languages','Translated text for French, German and Spanish visitors.',<Link className="admin-ghost" to="/admin/translations">Manage translations <ArrowRight size={15}/></Link>]]),
    ...(!may('content')?[]:[['Payments','The payment options available on your website.',<Link className="admin-ghost" to="/admin/payments">View payments <ArrowRight size={15}/></Link>]]),
    ['Your account','Change your name, username and password.',<Link className="admin-ghost" to="/admin/account">My account <ArrowRight size={15}/></Link>],
    ...(user.permissions.includes('users')?[['Users & roles','Add the people who manage the website and choose what each can do.',<Link className="admin-ghost" to="/admin/users">Manage users <ArrowRight size={15}/></Link>]]:[]),
    ['Sign out','Sign out of the dashboard on this browser.',<button type="button" className="admin-ghost" onClick={logout}><LogOut size={15}/>Sign out</button>],
  ];
  return <div className="admin-settings">{rows.map(([title,text,control])=><div className="admin-setting-row" key={title}><div><h3>{title}</h3><p>{text}</p></div>{control}</div>)}</div>;
}
