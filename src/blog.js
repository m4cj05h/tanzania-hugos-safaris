// Blog posts: news, stories and trip reports, kept apart from the practical Travel guide.
// Each post: {id, title, category, author, date (YYYY-MM-DD), image, summary, body, published}.
export const getBlogPosts=content=>Array.isArray(content?.blogPosts)?content.blogPosts:[];

// Published posts, newest first.
export const publishedPosts=content=>getBlogPosts(content).filter(post=>post.published).sort((a,b)=>(b.date||'').localeCompare(a.date||''));

export const formatPostDate=date=>/^\d{4}-\d{2}-\d{2}$/.test(date||'')?new Date(`${date}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'';

// Rough reading time at 220 words a minute.
export const readingMinutes=body=>Math.max(1,Math.round((body||'').trim().split(/\s+/).filter(Boolean).length/220));

// A web-address-friendly id made from the title, kept unique among existing posts.
export function postId(title,posts=[]){
  const base=(title||'post').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'post';
  let id=base,n=2;while(posts.some(post=>post.id===id))id=`${base}-${n++}`;
  return id;
}

// A post's story is a list of blocks: {id, type:'paragraph'|'heading'|'quote'|'image', text, image, caption}.
// Older posts only have plain text in body (paragraphs split by blank lines), so turn that into blocks.
export const blockTypes=['paragraph','heading','quote','image'];
export const newBlockId=()=>Math.random().toString(36).slice(2,10);
export function postBlocks(post){
  if(Array.isArray(post?.blocks)&&post.blocks.length)return post.blocks;
  return (post?.body||'').split(/\n\s*\n/).map(text=>text.trim()).filter(Boolean).map((text,index)=>({id:'p'+index,type:'paragraph',text}));
}
// Plain text of the story, kept in body for search engines, summaries and reading time.
export const blocksText=blocks=>blocks.filter(block=>block.type!=='image').map(block=>(block.text||'').trim()).filter(Boolean).join('\n\n');

// Splits text into plain, **bold** and *italic* pieces. Rendered as React text, so it is always safe.
export function inlineParts(text){
  return (text||'').split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/).filter(Boolean).map(part=>part.startsWith('**')&&part.endsWith('**')&&part.length>4?{text:part.slice(2,-2),bold:true}:part.startsWith('*')&&part.endsWith('*')&&part.length>2?{text:part.slice(1,-1),italic:true}:{text:part});
}

// Each chapter heading starts a new page of the book.
export function bookPages(blocks){
  const pages=[[]];
  for(const block of blocks){if(block.type==='heading'&&pages.at(-1).length)pages.push([]);pages.at(-1).push(block);}
  return pages.filter(page=>page.length);
}
