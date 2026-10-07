export const defaultAnnouncements = [];
export function getAnnouncements(content) { return Array.isArray(content?.announcements) ? content.announcements.filter(item=>item&&'startDate' in item) : defaultAnnouncements; }
// Departures saved before trip types existed are Kilimanjaro climbs.
export const departureTrips=['Kilimanjaro','Safari','Zanzibar'];
export const departureTrip=item=>item?.trip||'Kilimanjaro';
// Feature lines paired with the icon the admin chose for each ('' means pick automatically).
export const departureFeatures=item=>(item?.features||'').split('\n').map((text,index)=>[text.trim(),item.featureIcons?.[index]||'']).filter(([text])=>text);
// Last day of a trip that starts on startDate and lasts days days (inclusive), as YYYY-MM-DD.
export function departureEndDate(startDate,days){if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate||'')||!(days>=1))return '';const date=new Date(`${startDate}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days-1);return date.toISOString().slice(0,10);}
export const departureMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
