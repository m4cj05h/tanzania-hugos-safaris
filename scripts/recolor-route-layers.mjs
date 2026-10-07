import sharp from 'sharp';

const routeNames=['machame','lemosho','marangu','northern-circuit','rongai','umbwe'];
const orange=[230,104,0];
const gateBackings={
  machame:[[440,914,196,48],[790,1006,180,48]],
  lemosho:[[166,216,214,48],[790,1006,180,48]],
  marangu:[[1118,1010,190,48]],
  'northern-circuit':[[166,216,214,48],[790,1006,180,48]],
  rongai:[[964,204,194,48],[1118,1010,190,48]],
  umbwe:[[578,914,180,48],[790,1006,180,48]]
};

function findTextMask(data,{width,height,channels}) {
  const expanded=new Uint8Array(width*height);
  const whiteIntegral=new Uint32Array((width+1)*(height+1));
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const offset=(y*width+x)*channels;
    const white=data[offset+3]>35&&data[offset]>175&&data[offset+1]>175&&data[offset+2]>175?1:0;
    const integral=(y+1)*(width+1)+(x+1);
    whiteIntegral[integral]=white+whiteIntegral[integral-1]+whiteIntegral[integral-(width+1)]-whiteIntegral[integral-(width+2)];
    if(data[offset+3]>12&&data[offset]<78&&data[offset+1]<78&&data[offset+2]<78) {
      for(let yy=Math.max(0,y-1);yy<=Math.min(height-1,y+1);yy++) {
        const row=yy*width;
        for(let xx=Math.max(0,x-7);xx<=Math.min(width-1,x+7);xx++) expanded[row+xx]=1;
      }
    }
  }

  const nearbyWhite=(x,y)=>{
    const x1=Math.max(0,x-18),x2=Math.min(width-1,x+18),y1=Math.max(0,y-18),y2=Math.min(height-1,y+18),stride=width+1;
    return whiteIntegral[(y2+1)*stride+x2+1]-whiteIntegral[y1*stride+x2+1]-whiteIntegral[(y2+1)*stride+x1]+whiteIntegral[y1*stride+x1];
  };

  const seen=new Uint8Array(width*height);
  const preserve=new Uint8Array(width*height);
  const queue=new Int32Array(width*height);
  for(let start=0;start<expanded.length;start++) {
    if(!expanded[start]||seen[start]) continue;
    let head=0,tail=0,minX=width,maxX=0,minY=height,maxY=0;
    queue[tail++]=start; seen[start]=1;
    while(head<tail) {
      const point=queue[head++],x=point%width,y=Math.floor(point/width);
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
      const neighbors=[point-1,point+1,point-width,point+width];
      for(const next of neighbors) {
        if(next<0||next>=expanded.length||seen[next]||!expanded[next])continue;
        const nx=next%width;
        if(Math.abs(nx-x)>1)continue;
        seen[next]=1;queue[tail++]=next;
      }
    }
    const boxWidth=maxX-minX+1,boxHeight=maxY-minY+1;
    const looksLikeText=boxWidth>=36&&boxHeight>=9&&boxHeight<=58&&boxWidth/boxHeight>=1.25;
    if(!looksLikeText)continue;
    for(let y=Math.max(0,minY-2);y<=Math.min(height-1,maxY+2);y++) {
      for(let x=Math.max(0,minX-2);x<=Math.min(width-1,maxX+2);x++) preserve[y*width+x]=1;
    }
  }
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const offset=(y*width+x)*channels;
    const dark=data[offset+3]>12&&data[offset]<78&&data[offset+1]<78&&data[offset+2]<78;
    if(dark&&nearbyWhite(x,y)>250) preserve[y*width+x]=1;
  }
  return preserve;
}

for(const name of routeNames) {
  const source=`public/images/kilimanjaro/${name}.webp`;
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const textMask=findTextMask(data,info);
  for(let pixel=0,offset=0;pixel<textMask.length;pixel++,offset+=info.channels) {
    const r=data[offset],g=data[offset+1],b=data[offset+2],a=data[offset+3];
    const dark=a>12&&r<78&&g<78&&b<78&&!textMask[pixel];
    const green=a>12&&g>70&&g>r*1.12&&g>b*1.35;
    if(dark||green) [data[offset],data[offset+1],data[offset+2]]=orange;
  }
  const routeLayer=await sharp(data,{raw:info}).png().toBuffer();
  const backing=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">${gateBackings[name].map(([x,y,width,height])=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" fill="#fff" fill-opacity=".92" stroke="#dfe4e6" stroke-width="2"/>`).join('')}</svg>`);
  await sharp({create:{width:info.width,height:info.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:backing},{input:routeLayer}])
    .webp({quality:94,alphaQuality:100,effort:6})
    .toFile(`public/images/kilimanjaro/${name}-orange.webp`);
}
