import {h} from '../../../locale';
import React, {useRef} from 'react';
import {Link} from 'react-router-dom';
import {Plus, ChevronDown, Trash2, ArrowUpRight, Newspaper} from 'lucide-react';
import {useAdmin} from '../../context';
import {Field, Toggle, Empty} from '../../ui';
import MediaLibrary from '../../components/MediaLibrary';
import {getBlogPosts, formatPostDate, postId, postBlocks, blocksText} from '../../../blog';
import BookEditor from './BookEditor';
import {BookCover} from '../../../BlogBook';

// Blog posts appear on /blog (newest first) and the latest three on the homepage.
export default function BlogPage(){
  const {draft,setDraft,content}=useAdmin();
  const posts=getBlogPosts(draft);
  // A post's web address follows its title until it is live, then stays fixed so shared links keep working.
  const live=new Set(getBlogPosts(content).filter(post=>post.published).map(post=>post.id));
  const keys=useRef(new Map());
  const keyFor=id=>keys.current.get(id)||id;
  const rename=(id,title)=>change(items=>items.map(post=>{if(post.id!==id)return post;if(live.has(id))return {...post,title};const next=postId(title,items.filter(other=>other.id!==id));if(next!==id)keys.current.set(next,keyFor(id));return {...post,id:next,title};}));
  const change=transform=>setDraft(current=>({...current,blogPosts:transform(getBlogPosts(current))}));
  const update=(id,key,value)=>change(items=>items.map(post=>post.id===id?{...post,[key]:value}:post));
  const add=()=>change(items=>[{id:postId('New book',items),title:'New book',category:'Trip report',author:'',date:new Date().toISOString().slice(0,10),image:'safari.webp',summary:'',body:'',blocks:[{id:'intro',type:'paragraph',text:''}],published:false},...items]);
  const sorted=[...posts].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return <div>
    <div className="admin-toolbar"><p className="admin-lead">Each blog post is a book: design its cover, then write its pages with text, chapter headings, quotes and photos. Published books appear in the library on the Blog page, newest first, and the latest four on the homepage.</p><button type="button" className="admin-primary" disabled={posts.length>=200} onClick={add}><Plus size={16}/>Add book</button></div>
    {!posts.length&&<Empty icon={Newspaper} title="No books yet" text="Write your first story: a recent safari, a summit day or news from the team."/>}
    {sorted.map(post=><details className="admin-row" key={keyFor(post.id)}>
      <summary><img src={'/images/'+post.image} alt=""/><span className="admin-row-title"><strong>{post.title||'Untitled post'}</strong><small>{[formatPostDate(post.date),post.category,post.author].filter(Boolean).join(' · ')}</small></span><span className={'admin-pill '+(post.published?'is-live':'is-draft')}>{post.published?'Published':'Draft'}</span><ChevronDown className="admin-row-chevron" size={18}/></summary>
      <div className="admin-row-body">
        <div className="trip-editor-top"><Toggle checked={post.published} onChange={value=>update(post.id,'published',value)} label={post.published?'Published on website':'Draft — hidden from visitors'}/><div className="admin-row-actions">{post.published&&<Link to={'/blog/'+post.id} target="_blank" rel="noreferrer"><ArrowUpRight size={15}/>View post</Link>}<button type="button" className="danger" onClick={()=>{if(window.confirm('Delete “'+post.title+'”? Publish changes to update the website.'))change(items=>items.filter(x=>x.id!==post.id));}}><Trash2 size={15}/>Delete</button></div></div>
        <section className="book-admin-cover">
          <div className="book-admin-fields">
            <h3>Book cover</h3>
            <div className="admin-form-grid">
              <Field className="admin-wide" label="Title" maxLength={160} value={post.title} onChange={e=>rename(post.id,e.target.value)}/>
              <Field className="admin-wide" label="Subtitle" hint="One or two sentences under the title, also shown on the shelf." rows={2} maxLength={300} value={post.summary} onChange={e=>update(post.id,'summary',e.target.value)}/>
              <Field label="Author" maxLength={80} placeholder="e.g. Hugo, our lead guide" value={post.author} onChange={e=>update(post.id,'author',e.target.value)}/>
              <Field label="Category" maxLength={60} placeholder="Trip report, Wildlife, News…" value={post.category} onChange={e=>update(post.id,'category',e.target.value)}/>
              <Field label="Date" type="date" value={post.date} onChange={e=>update(post.id,'date',e.target.value)}/>
              <MediaLibrary compact label="Cover photo" value={post.image} onSelect={image=>update(post.id,'image',image)}/>
            </div>
          </div>
          <div className="book-admin-preview" aria-label="Cover preview">
            <BookCover post={{...post,title:post.title||'Untitled book'}} img={post.image&&<img src={'/images/'+post.image} alt=""/>}/>
            <small>Cover preview</small>
          </div>
        </section>
        <h3 className="book-admin-pages-title">Pages</h3>
        <BookEditor blocks={postBlocks(post)} onChange={blocks=>change(items=>items.map(item=>item.id===post.id?{...item,blocks,body:blocksText(blocks)}:item))}/>
        <p className="admin-lead blog-admin-address">Web address: <code>/blog/{post.id}</code>{live.has(post.id)?' (fixed now the post is live)':' (follows the title until you publish)'}</p>
      </div>
    </details>)}
  </div>;
}
