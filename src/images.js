import builtInSizes from './image-dims.json';

// Responsive photos. The server makes 480/800/1200px copies on request (server/image-sizes.js).
// Each photo's real size is known (built-in list + uploads from /api/content), so once a lazy
// photo is laid out we ask for the width its box really needs, including cropping by object-fit: cover.
const known={...builtInSizes};
export const addPhotoSizes=sizes=>{if(sizes&&typeof sizes==='object')Object.assign(known,sizes);};

function fitToBox(img,aspect){
  if(!img||img.loading!=='lazy')return;
  const box=img.getBoundingClientRect();
  if(!box.width)return;
  const cover=box.height>0&&getComputedStyle(img).objectFit==='cover';
  img.sizes=Math.ceil(cover?Math.max(box.width,box.height*aspect):box.width)+'px';
}

// Width divided by height, when the photo's size is known.
export const photoAspect=image=>{const [width,height]=known[image]||[];return width&&height?width/height:0;};

export function photo(image,sizes){
  const src='/images/'+image;
  const [width,height]=known[image]||[];
  const widths=width?[480,800,1200].filter(size=>size<width*0.9):[];
  if(!widths.length)return {src,...(width&&height?{width,height}:{})};
  return {src,width,height,srcSet:[...widths.map(size=>`${src}?w=${size} ${size}w`),`${src} ${width}w`].join(', '),sizes,ref:img=>fitToBox(img,width/height)};
}
