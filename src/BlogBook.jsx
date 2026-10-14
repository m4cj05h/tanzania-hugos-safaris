import React, {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowUpRight, BookOpen} from 'lucide-react';
import {h} from './locale';
import {photo} from './images';
import {relatedTripLinks} from './seo-content';
import {publishedPosts, formatPostDate, readingMinutes, postBlocks, inlineParts} from './blog';
import OpenBook from './OpenBook';
import './blog.css';

// Paragraph text with **bold** and *italic* markers.
const Inline=({text})=>inlineParts(text).map((part,index)=>part.bold?<strong key={index}>{part.text}</strong>:part.italic?<em key={index}>{part.text}</em>:<React.Fragment key={index}>{part.text}</React.Fragment>);

// A hardcover book in 3D: back board, page block and the photo cover on the front.
export function BookCover({post,img,size='small'}){
  return <span className={'book3d book3d-'+size}>
    <span className="book3d-body">
      <span className="book3d-back" aria-hidden="true"/>
      <span className="book3d-pages" aria-hidden="true"/>
      <span className="book-cover">
        {img}
        <span className="book-cover-category">{post.category||'Story'}</span>
        <span className="book-cover-text"><strong>{post.title}</strong>{post.author&&<span className="book-cover-author">{post.author}</span>}</span>
      </span>
    </span>
  </span>;
}

// A post shown as a book on the shelf.
export function BookCard({post}){
  return <Link to={'/blog/'+post.id} className="book-card">
    <BookCover post={post} img={<img {...photo(post.image,'(max-width: 700px) 70vw, 300px')} alt={post.title} loading="lazy" decoding="async"/>}/>
    <span className="book-card-meta"><time dateTime={post.date}>{formatPostDate(post.date)}</time> · {readingMinutes(post.body)} min read</span>
  </Link>;
}

// The newest books, for the homepage.
export function LatestBooks({content}){
  const posts=publishedPosts(content).slice(0,3);
  if(!posts.length)return null;
  return <section className="container section book-latest"><div className="section-heading"><div><span className="eyebrow">FROM OUR BLOG</span><h2>Stories from Tanzania.</h2></div></div><div className="book-shelf">{posts.map(post=><BookCard post={post} key={post.id}/>)}</div><div className="book-latest-more"><Link className="book-latest-button" to="/blog"><BookOpen size={17}/><span>Visit the library</span></Link></div></section>;
}

// /blog: every published post as a book on a shelf.
export function BookShelf({content}){
  const posts=publishedPosts(content);
  return <main className="book-library">
    <div className="container book-library-head"><span className="eyebrow">THE HUGOS LIBRARY</span><h1>Stories from Tanzania.</h1><p>Guides, trip reports and moments from the safaris, climbs and island days we share with our travellers. Pick a book and start reading.</p></div>
    <section className="container book-shelf-wrap">{posts.length?<div className="book-shelf">{posts.map(post=><BookCard post={post} key={post.id}/>)}</div>:content.photoSizes&&<p className="book-empty"><BookOpen size={20}/>Our first books are on their way. In the meantime, explore our <Link to="/travel-guide">travel guide</Link>.</p>}</section>
  </main>;
}

// /blog/:id: the cover, and "Open the book" opens the story as a real book that turns page by page.
export function BookReader({content,notFound}){
  const {id}=useParams();
  const posts=publishedPosts(content);
  const post=posts.find(item=>item.id===id);
  const [open,setOpen]=useState(false);
  const close=useCallback(()=>setOpen(false),[]);
  useEffect(()=>{setOpen(false);},[post?.id]);
  useEffect(()=>{if(post)document.title=`${post.title} | Tanzania Hugos Safaris`;},[post?.title]);
  if(!post)return content.photoSizes?notFound:<main className="book-reader" aria-busy="true"/>;
  const more=posts.filter(item=>item.id!==post.id).slice(0,4);
  const related=relatedTripLinks(`${post.title} ${post.summary||''} ${post.body}`,content,`/blog/${post.id}`);
  return <main className="book-reader">
    <section className="book-cover-stage">
      <button type="button" className="book-cover-button" onClick={()=>setOpen(true)} aria-label={'Open the book: '+post.title}>
        <BookCover post={post} size="large" img={<img {...photo(post.image,'(max-width: 700px) 80vw, 460px')} alt={post.title} fetchPriority="high" decoding="async"/>}/>
      </button>
      <div className="book-cover-info">
        <span className="eyebrow">{post.category||'STORY'}</span>
        <h1>{post.title}</h1>
        {post.summary&&<p>{post.summary}</p>}
        <p className="book-cover-details"><time dateTime={post.date}>{formatPostDate(post.date)}</time>{post.author&&<> · {post.author}</>} · {readingMinutes(post.body)} min read</p>
        <button type="button" className="button book-open" onClick={()=>setOpen(true)}><BookOpen size={18}/>Open the book</button>
      </div>
    </section>
    {/* The full story as plain text, for search engines and screen readers. */}
    <article className="book-text-hidden">
      {postBlocks(post).map(block=>block.type==='heading'?<h2 key={block.id}>{block.text}</h2>:block.type==='quote'?<blockquote key={block.id}><Inline text={block.text}/></blockquote>:block.type==='image'?(block.caption?<p key={block.id}>{block.caption}</p>:null):<p key={block.id}><Inline text={block.text}/></p>)}
    </article>
    {related.length>0&&<section className="container section"><h2>Related Tanzania trips and guides</h2><ul>{related.map(({href,label})=><li key={href}><Link to={href}>{label}</Link></li>)}</ul></section>}
    {open&&<OpenBook post={post} onClose={close}/>}
    {more.length>0&&<section className="container section"><div className="section-heading"><div><span className="eyebrow">KEEP READING</span><h2>More from the library.</h2></div><Link className="text-link" to="/blog">All books <ArrowUpRight size={18}/></Link></div><div className="book-shelf">{more.map(item=><BookCard post={item} key={item.id}/>)}</div></section>}
  </main>;
}
