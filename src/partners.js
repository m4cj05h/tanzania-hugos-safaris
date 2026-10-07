export const defaultPartners = [
  {id:'safari-bookings',name:'SafariBookings',image:'partners/safari-booking.webp'},
  {id:'safari-deal',name:'SafariDeal',image:'partners/safari-deal.jpeg'},
  {id:'your-african-safari',name:'Your African Safari',image:'partners/yas.webp'},
  {id:'tripadvisor',name:'Tripadvisor',image:'partners/tripadvisor.webp'},
  {id:'tanzania-national-parks',name:'Tanzania National Parks',image:'partners/tanapa.jpeg'},
  {id:'tanzania-tourism',name:'Tanzania: The Soul of Africa',image:'partners/tato.jpeg'},
  {id:'tato',name:'Tanzania Association of Tour Operators',image:'partners/tato2.webp'},
  {id:'world-travel-awards',name:'World Travel Awards 2024',image:'partners/wta.jpeg'},
];

export function getPartners(content) {
  return Array.isArray(content?.partners) ? content.partners : defaultPartners;
}
