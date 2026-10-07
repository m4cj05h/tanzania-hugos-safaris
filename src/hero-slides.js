const defaultSubtitle='Wild horizons. Island time. Unforgettable moments. Discover the Tanzania you’ve been dreaming of, with people who call it home.';
export function getHeroSlides(content){
  if(Array.isArray(content.heroSlides)&&content.heroSlides.length)return content.heroSlides;
  return [
    {id:'safari',image:'safari.webp',label:'Into the wild',place:'Tanzania’s wild heart',title:content.heroTitle,description:content.heroSubtitle&&content.heroSubtitle!==defaultSubtitle?content.heroSubtitle:'From the Serengeti’s untamed plains to Zanzibar’s barefoot shores. Discover extraordinary Tanzania, with people who call it home.',link:'/safaris',cta:'Discover our safaris'},
    {id:'zanzibar',image:'zanzibar.webp',label:'Island time',place:'Zanzibar · Indian Ocean',title:'Some places\nstay with you.',description:'Barefoot mornings. Ocean-blue afternoons. Slow down and discover your own little corner of Zanzibar.',link:'/zanzibar-tours',cta:'Explore Zanzibar'},
    {id:'mountain',image:'mountain.webp',label:'Above the clouds',place:'Kilimanjaro · Tanzania',title:'An extraordinary view.\nAn even greater journey.',description:'Take the path less ordinary. Plan your Kilimanjaro climb and make room for a story you’ll tell for a lifetime.',link:'/kilimanjaro',cta:'Find your summit'},
    {id:'hero',image:'hero.webp',label:'Your own adventure',place:'Tanzania · Beyond the expected',title:'Follow your curiosity.\nWe’ll lead the way.',description:'Safari, coast, culture or football. Bring the dream, and we’ll create a Tanzania journey that feels entirely yours.',link:'/plan-my-trip',cta:'Create my journey'},
  ];
}
