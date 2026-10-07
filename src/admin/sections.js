import {LayoutDashboard,Mail,House,Handshake,Video,Images,Compass,Mountain,Megaphone,BookOpen,Newspaper,Star,MessageCircle,Globe,CreditCard,Settings,Users,UserCog} from 'lucide-react';

// Every admin page has its own address: /admin/<slug> (the dashboard is /admin).
// publish: the page edits the shared draft, so it shows the publish bar. view: matching public page.
// need: the permission a role must have to open the page (see server/users.js); pages without it are open to everyone signed in.
export const sectionGroups=[
  ['Overview',[
    {slug:'dashboard',label:'Dashboard',icon:LayoutDashboard,title:'Your website, at a glance.',text:'New enquiries, your trips and shortcuts to everything you can change.'},
    {slug:'enquiries',need:'enquiries',label:'Enquiries',icon:Mail,title:'Enquiries',text:'Keep every conversation moving towards an unforgettable journey.'},
  ]],
  ['Website',[
    {slug:'homepage',need:'content',label:'Homepage',icon:House,title:'Homepage',text:'Change the photos, words and trip groups visitors see first.',publish:true,view:'/'},
    {slug:'photos',need:'content',label:'Photos',icon:Images,title:'Photos',text:'Upload your photos once, then choose them for any page, trip or article.'},
    {slug:'partners',need:'content',label:'Partners',icon:Handshake,title:'Partners',text:'Manage the logos in your homepage partner slideshow.',publish:true,view:'/'},
    {slug:'videos',need:'content',label:'Videos',icon:Video,title:'Videos',text:'Upload videos or add links, then choose where they appear.',publish:true,view:'/'},
  ]],
  ['Trips',[
    {slug:'trips',need:'content',label:'Trips & packages',icon:Compass,title:'Trips & packages',text:'Safaris, day trips, Zanzibar, climbs and more — grouped the way visitors see them.',publish:true,view:'/safaris'},
    {slug:'kilimanjaro-routes',need:'content',label:'Kilimanjaro routes',icon:Mountain,title:'Kilimanjaro routes',text:'Route details, itineraries and starting prices for each Kilimanjaro route.',publish:true,view:'/kilimanjaro'},
    {slug:'departures',need:'content',label:'Group departures',icon:Megaphone,title:'Group departures',text:'Post scheduled climbs, safaris and Zanzibar trips that travellers can join.',publish:true,view:'/kilimanjaro'},
  ]],
  ['Stories',[
    {slug:'travel-guide',need:'content',label:'Travel guide',icon:BookOpen,title:'Travel guide',text:'Share local knowledge and inspire the next adventure.',publish:true,view:'/travel-guide'},
    {slug:'blog',need:'content',label:'Blog',icon:Newspaper,title:'Blog',text:'News, trip reports and stories from your team.',publish:true,view:'/blog'},
    {slug:'reviews',need:'content',label:'Reviews',icon:Star,title:'Reviews',text:'Let your travellers tell their stories.',publish:true,view:'/'},
    {slug:'comments',need:'comments',label:'Comments',icon:MessageCircle,title:'Comments',text:'Review and reply to Kilimanjaro visitor comments.',view:'/kilimanjaro'},
  ]],
  ['Settings',[
    {slug:'translations',need:'content',label:'Translations',icon:Globe,title:'Translations',text:'Welcome your travellers in their own language.',publish:true},
    {slug:'payments',need:'content',label:'Payments',icon:CreditCard,title:'Payments',text:'Review payment availability for your website.'},
    {slug:'users',need:'users',label:'Users & roles',icon:Users,title:'Users & roles',text:'Add the people who manage your website and choose what each of them can do.'},
    {slug:'account',label:'My account',icon:UserCog,title:'My account',text:'Change your name, username and password.'},
    {slug:'settings',label:'Settings',icon:Settings,title:'Settings',text:'Manage your workspace preferences.'},
  ]],
];
export const sections=sectionGroups.flatMap(([,items])=>items);
export const canOpen=(section,user)=>!section.need||!!user?.permissions?.includes(section.need);
export const sectionPath=slug=>slug==='dashboard'?'/admin':'/admin/'+slug;
