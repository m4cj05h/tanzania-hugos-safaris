// Editable homepage sections. Saved as content.home; anything missing falls back to these defaults.
export const homeTripGroups=['Safari','Day trip','Zanzibar','Kilimanjaro','Combination','AFCON'];
export const homeGroupLabel=group=>group==='Safari'?'Safaris':group==='Combination'?'Safari + beach':group==='Day trip'?'Day trips':group;
export const sitePages=[['/safaris','Safaris'],['/day-trips','Day trips'],['/zanzibar-tours','Zanzibar'],['/kilimanjaro','Kilimanjaro'],['/combination-packages','Safari + beach'],['/afcon-tanzania','AFCON travel'],['/plan-my-trip','Plan my trip'],['/travel-guide','Travel guide'],['/about-us','About us'],['/contact','Contact']];

export const defaultHome={
  intro:{eyebrow:'WELCOME TO TANZANIA HUGOS SAFARIS',title:'Not just a place to go.',highlight:'A place to feel alive.',text:'The hush before a lion’s roar. The warmth of an Indian Ocean breeze. That first glimpse above the clouds. Tanzania is a collection of moments you never quite leave behind.'},
  experiences:[
    {id:'safari',title:'Safari adventures',text:'Go where the wild things are.',image:'safari.webp',link:'/safaris'},
    {id:'zanzibar',title:'Zanzibar escapes',text:'Find your kind of island time.',image:'zanzibar.webp',link:'/zanzibar-tours'},
    {id:'kilimanjaro',title:'Kilimanjaro climbs',text:'Make the journey your story.',image:'mountain.webp',link:'/kilimanjaro'},
    {id:'tailor-made',title:'Tailor-made journeys',text:'A little of everything you love.',image:'hero.webp',link:'/combination-packages'},
  ],
  afcon:{show:true,eyebrow:'FOOTBALL BRINGS YOU HERE. TANZANIA MAKES YOU STAY.',text:'From match-day transport to a safari after the final whistle. Make more of your trip with a journey planned around you.'},
  journeys:{title:'Find your next',highlight:'great adventure.',groups:homeTripGroups.map(name=>({name,show:true,featured:[]}))},
  escape:{image:'zanzibar.webp',caption:'Zanzibar, at your own pace.',eyebrow:'THE OTHER SIDE OF YOUR ADVENTURE',title:'A little wild.\nA little barefoot.',highlight:'Entirely you.',text:'There’s no need to choose between the bush and the beach. Chase extraordinary wildlife moments, then trade your safari boots for the soft sands of Zanzibar.'},
  story:{image:'company.webp',eyebrow:'THE TANZANIA HUGOS SAFARIS WAY',title:'Our home.',highlight:'Your extraordinary story.',text:'A great journey is about more than the places. It’s the people who welcome you, the details taken care of, and the freedom to enjoy every moment.'},
  faqs:[
    {id:'customise',question:'Can I customise my trip?',answer:'Absolutely. Combine safari, Zanzibar, Kilimanjaro, cultural experiences or AFCON travel. Tell us your dates, interests and budget, and we’ll design your itinerary.'},
    {id:'cost',question:'How much does a safari cost?',answer:'Our packages start at {{USD 650}} per person for the three-day Mikumi safari. Final prices depend on dates, group size, accommodation and inclusions. Request an itemised quotation before booking.'},
    {id:'afcon',question:'Can you arrange my AFCON travel?',answer:'We can help plan airport pickups, private transfers, accommodation and safari or Zanzibar extensions around your match information. Travel is subject to the confirmed schedule. Match tickets are not included.'},
    {id:'booking',question:'How do booking and payments work?',answer:'Send an enquiry, review your personalised itinerary and quote, then receive the available payment instructions from our team. No payment is taken on this website at this stage.'},
    {id:'crypto',question:'Can I pay with cryptocurrency?',answer:'Cryptocurrency payments are not currently active. Availability will depend on an approved payment provider and confirmation of applicable requirements. Contact our team for available payment options.'},
  ],
};

export function getHome(content){
  const saved=content?.home&&typeof content.home==='object'?content.home:{};
  const merged={};
  for(const [key,value] of Object.entries(defaultHome))merged[key]=Array.isArray(value)?(Array.isArray(saved[key])?saved[key]:value):{...value,...saved[key]};
  const groups=Array.isArray(saved.journeys?.groups)?saved.journeys.groups:[];
  merged.journeys.groups=homeTripGroups.map(name=>({name,show:true,featured:[],...groups.find(group=>group?.name===name)}));
  return merged;
}

// Trips shown under a homepage tab: the chosen ones first, then the newest others, three in total.
export function homeTrips(packages,group,limit=3){
  const inGroup=packages.filter(p=>p.published&&p.category===group.name);
  const chosen=group.featured.map(id=>inGroup.find(p=>p.id===id)).filter(Boolean);
  return [...chosen,...inGroup.filter(p=>!chosen.includes(p))].slice(0,limit);
}

const image=/^(?:[a-zA-Z0-9_-]+\.(?:webp|png|jpg|jpeg)|uploads\/[a-f0-9-]+\.webp)$/;
const text=(value,max)=>typeof value==='string'&&value.length<=max;
const block=(value,fields)=>value===undefined||(value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(fields).every(([key,max])=>value[key]===undefined||(max==='image'?typeof value[key]==='string'&&image.test(value[key]):max==='bool'?typeof value[key]==='boolean':text(value[key],max))));
export function validHome(home){
  if(home===undefined)return true;
  if(!home||typeof home!=='object'||Array.isArray(home))return false;
  if(!block(home.intro,{eyebrow:120,title:200,highlight:200,text:1500}))return false;
  if(!block(home.afcon,{show:'bool',eyebrow:200,text:1500}))return false;
  if(!block(home.escape,{image:'image',caption:200,eyebrow:200,title:300,highlight:200,text:1500}))return false;
  if(!block(home.story,{image:'image',eyebrow:200,title:300,highlight:200,text:1500}))return false;
  if(home.experiences!==undefined&&!(Array.isArray(home.experiences)&&home.experiences.length>=1&&home.experiences.length<=8&&home.experiences.every(item=>item&&text(item.id,120)&&item.id&&text(item.title,120)&&item.title.trim()&&text(item.text,300)&&typeof item.image==='string'&&image.test(item.image)&&typeof item.link==='string'&&/^\/[a-z0-9\-/]*$/.test(item.link))))return false;
  if(home.faqs!==undefined&&!(Array.isArray(home.faqs)&&home.faqs.length<=20&&home.faqs.every(item=>item&&text(item.id,120)&&item.id&&text(item.question,300)&&item.question.trim()&&text(item.answer,3000))))return false;
  const journeys=home.journeys;
  if(journeys!==undefined&&!(journeys&&typeof journeys==='object'&&block(journeys,{title:200,highlight:200})&&(journeys.groups===undefined||(Array.isArray(journeys.groups)&&journeys.groups.length<=homeTripGroups.length&&journeys.groups.every(group=>group&&homeTripGroups.includes(group.name)&&typeof group.show==='boolean'&&Array.isArray(group.featured)&&group.featured.length<=3&&group.featured.every(id=>text(id,160)))))))return false;
  return true;
}
