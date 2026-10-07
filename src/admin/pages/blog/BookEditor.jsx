import {h} from '../../../locale';
import React, {useLayoutEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowUp, Bold, Heading2, Image as ImageIcon, Italic, Pilcrow, Plus, Quote, Trash2} from 'lucide-react';
import MediaLibrary from '../../components/MediaLibrary';
import {newBlockId} from '../../../blog';

const kinds=[['paragraph','Paragraph',Pilcrow],['heading','Chapter heading',Heading2],['quote','Quote',Quote],['image','Photo',ImageIcon]];
const placeholders={paragraph:'Write your story…',heading:'Chapter title',quote:'A line worth remembering…'};

// A textarea that grows with its text, so the page reads like a document.
function AutoText({value,onChange,onFocus,className,placeholder,maxLength,label}){
  const ref=useRef(null);
  useLayoutEffect(()=>{const el=ref.current;if(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';}},[value]);
  return <textarea ref={ref} rows={1} className={className} value={value} placeholder={placeholder} maxLength={maxLength} aria-label={label} onFocus={onFocus} onChange={e=>onChange(e.target.value)}/>;
}

// Buttons for adding a new part at a given place.
function Inserter({onAdd,always=false}){
  const [open,setOpen]=useState(always);
  if(!open)return <div className="doc-insert"><button type="button" className="doc-insert-toggle" aria-label="Add a part here" onClick={()=>setOpen(true)}><Plus size={14}/></button></div>;
  return <div className="doc-insert is-open">{kinds.map(([type,label,Icon])=><button type="button" key={type} onClick={()=>{onAdd(type);if(!always)setOpen(false);}}><Icon size={15}/>{label}</button>)}{!always&&<button type="button" className="doc-insert-cancel" onClick={()=>setOpen(false)}>Cancel</button>}</div>;
}

// The story editor: a paper page made of parts (paragraphs, chapter headings, quotes, photos).
export default function BookEditor({blocks,onChange}){
  const focused=useRef(null);
  const set=next=>onChange(next);
  const update=(id,patch)=>set(blocks.map(block=>block.id===id?{...block,...patch}:block));
  const add=(index,type)=>set([...blocks.slice(0,index),type==='image'?{id:newBlockId(),type,image:'',caption:''}:{id:newBlockId(),type,text:''},...blocks.slice(index)]);
  const move=(index,step)=>{const next=[...blocks];[next[index],next[index+step]]=[next[index+step],next[index]];set(next);};
  // Wrap the selected words in the focused paragraph with ** (bold) or * (italic).
  const format=marker=>{
    const target=focused.current;if(!target)return;
    const {id,el}=target;const block=blocks.find(item=>item.id===id);if(!block||!el)return;
    const start=el.selectionStart,end=el.selectionEnd;if(start===end)return;
    const text=block.text;update(id,{text:text.slice(0,start)+marker+text.slice(start,end)+marker+text.slice(end)});
    requestAnimationFrame(()=>{el.focus();el.setSelectionRange(start+marker.length,end+marker.length);});
  };
  return <div className="doc">
    <div className="doc-toolbar" role="toolbar" aria-label="Text style">
      <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>format('**')} title="Bold: select words, then click"><Bold size={16}/>Bold</button>
      <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>format('*')} title="Italic: select words, then click"><Italic size={16}/>Italic</button>
      <span>Select words in a paragraph, then choose a style. Each chapter heading starts a new page of the book.</span>
    </div>
    <div className="doc-paper">
      {blocks.map((block,index)=><React.Fragment key={block.id}>
        <Inserter onAdd={type=>add(index,type)}/>
        <div className={'doc-block doc-'+block.type}>
          <div className="doc-block-tools">
            <span>{kinds.find(([type])=>type===block.type)?.[1]}</span>
            <button type="button" disabled={index===0} aria-label="Move up" onClick={()=>move(index,-1)}><ArrowUp size={14}/></button>
            <button type="button" disabled={index===blocks.length-1} aria-label="Move down" onClick={()=>move(index,1)}><ArrowDown size={14}/></button>
            <button type="button" aria-label="Remove this part" onClick={()=>{const empty=block.type==='image'?!block.image:!(block.text||'').trim();if(empty||window.confirm('Remove this part?'))set(blocks.filter(item=>item.id!==block.id));}}><Trash2 size={14}/></button>
          </div>
          {block.type==='image'?<div className="doc-image">
            {block.image?<img src={'/images/'+block.image} alt=""/>:<p className="doc-image-empty">Choose a photo below, or remove this part.</p>}
            <MediaLibrary compact label="Photo" value={block.image} onSelect={image=>update(block.id,{image})}/>
            <input className="doc-caption" value={block.caption||''} maxLength={300} placeholder="Caption (optional)" aria-label="Photo caption" onChange={e=>update(block.id,{caption:e.target.value})}/>
          </div>:<AutoText className="doc-text" value={block.text||''} label={kinds.find(([type])=>type===block.type)?.[1]} placeholder={placeholders[block.type]} maxLength={block.type==='heading'?200:8000} onFocus={e=>{focused.current={id:block.id,el:e.target};}} onChange={text=>update(block.id,{text})}/>}
        </div>
      </React.Fragment>)}
      {!blocks.length&&<p className="doc-empty">This book has no pages yet. Add your first paragraph below.</p>}
      <Inserter always onAdd={type=>add(blocks.length,type)}/>
    </div>
  </div>;
}
