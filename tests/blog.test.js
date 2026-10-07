import{test}from'node:test';import assert from'node:assert/strict';import{blogError}from'../server/blog.js';import{postId,publishedPosts,readingMinutes}from'../src/blog.js';
const post={id:'summit-day',title:'Summit day on Machame',category:'Trip report',author:'Hugo',date:'2026-09-30',image:'mountain.webp',summary:'A clear night and a sunrise over Mawenzi.',body:'We left Barafu at midnight.',published:true};
test('valid blog posts pass and problems name the post',()=>{
 assert.equal(blogError(undefined),'');assert.equal(blogError([post,{...post,id:'draft',published:false,body:''}]),'');
 assert.match(blogError([post,post]),/same web address/);
 assert.match(blogError([{...post,title:''}]),/needs a title/);
 assert.match(blogError([{...post,date:'30/09/2026'}]),/Summit day on Machame” needs a date/);
 assert.match(blogError([{...post,image:'../secret.png'}]),/photo/);
 assert.match(blogError([{...post,body:'  '}]),/needs some text before it can be published/);
 assert.match(blogError([{...post,id:'Bad Id!'}]),/web address/)});
test('post addresses, ordering and reading time',()=>{
 assert.equal(postId('Summit day on Machame!'),'summit-day-on-machame');assert.equal(postId('Zanzibar café'),'zanzibar-cafe');
 assert.equal(postId('Summit day',[{id:'summit-day'}]),'summit-day-2');assert.equal(postId(''),'post');
 assert.deepEqual(publishedPosts({blogPosts:[{...post,id:'old',date:'2025-01-01'},{...post,id:'hidden',published:false},post]}).map(p=>p.id),['summit-day','old']);
 assert.equal(readingMinutes('word '.repeat(660)),3)});
import{postBlocks,blocksText,inlineParts,bookPages}from'../src/blog.js';
test('book pages: parts are checked and stories split into chapters',()=>{
 const blocks=[{id:'a',type:'paragraph',text:'Intro **bold** and *soft*.'},{id:'b',type:'heading',text:'Chapter'},{id:'c',type:'image',image:'mountain.webp',caption:'Slopes'},{id:'d',type:'quote',text:'Pole pole'}];
 assert.equal(blogError([{...post,blocks,body:blocksText(blocks)}]),'');
 assert.match(blogError([{...post,blocks:[{id:'x',type:'video',text:''}]}]),/unknown type \(part 1\)/);
 assert.match(blogError([{...post,blocks:[{id:'x',type:'image',image:''}]}]),/photo that is not from your photo library \(part 1\)/);
 assert.match(blogError([{...post,blocks:[{id:'x',type:'heading',text:'x'.repeat(201)}]}]),/too long \(part 1\)/);
 assert.equal(blocksText(blocks),'Intro **bold** and *soft*.\n\nChapter\n\nPole pole');
 assert.deepEqual(bookPages(blocks).map(page=>page.map(b=>b.id)),[['a'],['b','c','d']]);
 assert.deepEqual(inlineParts('Intro **bold** and *soft*.'),[{text:'Intro '},{text:'bold',bold:true},{text:' and '},{text:'soft',italic:true},{text:'.'}]);
 assert.deepEqual(postBlocks({body:'One.\n\nTwo.'}).map(b=>b.text),['One.','Two.'])});
