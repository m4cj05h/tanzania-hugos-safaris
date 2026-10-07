import {inlineParts} from './blog';
import {photo, photoAspect} from './images';

// Lays a story out on fixed-size book pages. Blocks are measured in a hidden page body:
// paragraphs and quotes that run past the bottom continue on the next page, photos shrink a little
// to fit, and headings or anything too short to split move to the next page whole.

const escape=text=>String(text).replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[char]);

// Words and spaces, each keeping its **bold** or *italic* style, so a paragraph can break between any two words.
function words(text){
  const out=[];
  for(const part of inlineParts(text))for(const piece of part.text.split(/(\s+)/))if(piece)out.push(/^\s+$/.test(piece)?{space:true}:{text:piece,bold:part.bold,italic:part.italic});
  return out;
}
const wordsHTML=tokens=>tokens.map(token=>token.space?' ':token.bold?`<strong>${escape(token.text)}</strong>`:token.italic?`<em>${escape(token.text)}</em>`:escape(token.text)).join('');
const trimSpaces=tokens=>{let start=0,end=tokens.length;while(start<end&&tokens[start].space)start++;while(end>start&&tokens[end-1].space)end--;return tokens.slice(start,end);};

// The same HTML is used to measure a page and to show it, so what fits while measuring fits on screen.
export function itemHTML(item){
  if(item.type==='heading')return `<h2>${escape(item.text)}</h2>`;
  if(item.type==='image'){
    const image=photo(item.image,'(max-width: 700px) 90vw, 520px');
    return `<figure><img src="${escape(image.src)}"${image.srcSet?` srcset="${escape(image.srcSet)}" sizes="${escape(image.sizes)}"`:''} alt="${escape(item.caption||'')}" style="height:${item.height}px">${item.caption?`<figcaption>${escape(item.caption)}</figcaption>`:''}</figure>`;
  }
  const classes=[item.lead&&'lead',item.cont&&'cont',item.split&&'split'].filter(Boolean).join(' ');
  const tag=item.type==='quote'?'blockquote':'p';
  return `<${tag}${classes?` class="${classes}"`:''}>${wordsHTML(item.tokens)}</${tag}>`;
}

// Returns an array of pages, each an array of items for itemHTML. `body` is an empty page body of the real size.
export function paginate(blocks,body){
  const pages=[];
  let page=[];
  const width=body.clientWidth,height=body.clientHeight;
  const render=()=>{body.innerHTML=page.map(itemHTML).join('');};
  const fits=()=>body.scrollHeight<=body.clientHeight+1;
  // A heading never ends a page: it moves over with the text it introduces.
  const newPage=()=>{
    const heading=page.length>1&&page.at(-1).type==='heading'?page.pop():null;
    pages.push(page);
    page=heading?[heading]:[];
  };
  const place=item=>{
    page.push(item);render();
    if(!fits()&&page.length>1){page.pop();newPage();page.push(item);}
  };
  let lead=true;
  for(const block of blocks){
    if(block.type==='image'){
      if(!block.image)continue;
      const aspect=photoAspect(block.image)||1.5;
      const item={type:'image',image:block.image,caption:block.caption,height:Math.round(Math.min(width/aspect,height*.55))};
      page.push(item);render();
      // Rather than leave a big gap, a photo may shrink (down to about a fifth of the page) to fill what is left.
      if(!fits()&&page.length>1){
        const full=item.height;
        let low=Math.round(height*.2),high=full;
        item.height=low;render();
        if(fits()){while(high-low>4){const mid=Math.round((low+high)/2);item.height=mid;render();if(fits())low=mid;else high=mid;}item.height=low;}
        else{page.pop();newPage();item.height=full;page.push(item);}
      }
      continue;
    }
    if(block.type==='heading'){if((block.text||'').trim())place({type:'heading',text:block.text.trim()});continue;}
    let tokens=trimSpaces(words(block.text));
    if(!tokens.length)continue;
    const type=block.type==='quote'?'quote':'paragraph';
    const isLead=lead&&type==='paragraph';
    if(type==='paragraph')lead=false;
    let cont=false;
    while(tokens.length){
      const item={type,tokens,cont,lead:isLead&&!cont};
      page.push(item);render();
      if(fits())break;
      // The most words that still fit on this page.
      item.split=true;
      let low=0,high=tokens.length-1;
      while(low<high){const mid=Math.ceil((low+high)/2);item.tokens=tokens.slice(0,mid);render();if(fits())low=mid;else high=mid-1;}
      const kept=trimSpaces(tokens.slice(0,low));
      // Fewer than a few words: start the whole paragraph on the next page instead.
      if(kept.length<7&&page.length>1){page.pop();newPage();continue;}
      const count=Math.max(1,kept.length);
      item.tokens=tokens.slice(0,count);
      tokens=trimSpaces(tokens.slice(count));
      newPage();
      cont=true;
    }
  }
  if(page.length)pages.push(page);
  body.innerHTML='';
  return pages;
}
