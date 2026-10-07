// Checks blog posts sent from the admin. Returns a message naming the problem post, or '' when valid.
export function blogError(posts){
  if(posts===undefined)return '';
  if(!Array.isArray(posts)||posts.length>200)return 'You can keep up to 200 blog posts.';
  if(new Set(posts.map(post=>post?.id)).size!==posts.length)return 'Two blog posts share the same web address. Change one title and try again.';
  const image=/^(?:[a-zA-Z0-9_-]+\.(?:webp|png|jpg|jpeg)|uploads\/[a-f0-9-]+\.webp)$/;
  for(const [index,post] of posts.entries()){
    if(!post||typeof post!=='object')return `Blog post ${index+1} is damaged. Delete it and add it again.`;
    const name=typeof post.title==='string'&&post.title.trim()?`“${post.title.trim().slice(0,60)}”`:`Blog post ${index+1}`;
    const text=(key,max)=>typeof post[key]==='string'&&post[key].length<=max;
    const problem=typeof post.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(post.id)?'has an invalid web address'
      :!text('title',160)||!post.title.trim()?'needs a title (up to 160 characters)'
      :!text('category',60)?'has a category that is too long (60 characters at most)'
      :!text('author',80)?'has an author name that is too long (80 characters at most)'
      :typeof post.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(post.date)?'needs a date'
      :typeof post.image!=='string'||!image.test(post.image)?'needs a photo from your photo library'
      :!text('summary',300)?'has a summary that is too long (300 characters at most)'
      :!text('body',60000)?'is too long (60,000 characters at most)'
      :typeof post.published!=='boolean'?'needs a published setting'
      :blocksProblem(post.blocks,image)
      ||(post.published&&!post.body.trim()?'needs some text before it can be published':'');
    if(problem)return `${name} ${problem}.`;
  }
  return '';
}

// The book's pages: paragraphs, chapter headings, quotes and photos with captions.
function blocksProblem(blocks,image){
  if(blocks===undefined)return '';
  if(!Array.isArray(blocks)||blocks.length>300)return 'has too many parts (300 at most)';
  for(const [index,block] of blocks.entries()){
    const where=`(part ${index+1})`;
    if(!block||typeof block!=='object'||!['paragraph','heading','quote','image'].includes(block.type))return `has a part of an unknown type ${where}`;
    if(block.id!==undefined&&(typeof block.id!=='string'||!/^[a-z0-9]{1,40}$/i.test(block.id)))return `has a damaged part ${where}`;
    if(block.type==='image'){
      if(typeof block.image!=='string'||!image.test(block.image))return `has a photo that is not from your photo library ${where}`;
      if(block.caption!==undefined&&(typeof block.caption!=='string'||block.caption.length>300))return `has a photo caption that is too long ${where}`;
    }else if(typeof block.text!=='string'||block.text.length>(block.type==='heading'?200:8000))return `has text that is too long ${where}`;
  }
  return '';
}
