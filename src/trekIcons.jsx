import React from 'react';
import {h} from './locale';

// Full-colour trek icons shared by the Kilimanjaro pages, drawn on a 32×32 grid.
export const clockArt=<><circle cx="16" cy="17" r="13" fill="#1e88e5"/><circle cx="16" cy="17" r="10.2" fill="#fff"/><rect x="13.5" y="1.5" width="5" height="3" rx="1" fill="#1565c0"/><path d="M16 10.5V17l4.5 3" fill="none" stroke="#37474f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="17" r="1.8" fill="#e53935"/></>;
export const hutArt=<><rect x="20.5" y="6.5" width="3" height="6" fill="#8d6e63"/><rect x="7" y="15" width="18" height="12.5" fill="#e0b17a"/><path d="M3.5 16.5 16 5.5l12.5 11z" fill="#c62828"/><path d="M3.5 16.5 16 5.5l12.5 11h-3L16 8.3 6.5 16.5z" fill="#e53935"/><rect x="13.5" y="19.5" width="5" height="8" rx="1" fill="#6d4c41"/><rect x="19.8" y="18.6" width="3.2" height="3.2" rx=".5" fill="#90caf9"/><rect x="2" y="27.5" width="28" height="1.8" rx=".9" fill="#a5d6a7"/></>;
const tagArt=<><path d="M3.5 15.6V5.5a2 2 0 0 1 2-2h10.1L29 16.9 16.9 29z" fill="#ffb300"/><path d="M15.6 3.5 29 16.9 16.9 29l-2.2-2.2L26.6 15 13.4 3.5z" fill="#f59f00"/><circle cx="10" cy="10" r="2.6" fill="#fff"/><path d="M17.8 13.2c-1-.7-2.6-.6-3.3.3-.8 1-.2 2.1 1.2 2.6 1.6.6 2.3 1.6 1.4 2.7-.8 1-2.5 1-3.6.2m3.1-7.3-.5.7m-2.9 7.4-.5.7" fill="none" stroke="#8a4b00" strokeWidth="1.6" strokeLinecap="round"/></>;
const compassArt=<><circle cx="16" cy="16" r="13.5" fill="#1e88e5"/><circle cx="16" cy="16" r="10.5" fill="#fff"/><path d="m16 6.8 3 9.2h-6z" fill="#e53935"/><path d="m16 25.2-3-9.2h6z" fill="#90a4ae"/><circle cx="16" cy="16" r="1.9" fill="#37474f"/></>;
const groupArt=<><circle cx="8.5" cy="9" r="3.4" fill="#8d5524"/><path d="M2.5 23c0-4.3 2.7-7.5 6-7.5s6 3.2 6 7.5v1.5h-12z" fill="#1e88e5"/><circle cx="23.5" cy="9" r="3.4" fill="#c68642"/><path d="M17.5 23c0-4.3 2.7-7.5 6-7.5s6 3.2 6 7.5v1.5h-12z" fill="#43a047"/><circle cx="16" cy="12" r="4.1" fill="#e0ac69"/><path d="M8.3 28.2c0-5.2 3.4-8.7 7.7-8.7s7.7 3.5 7.7 8.7v1.3H8.3z" fill="#fb8c00"/></>;
const calendarArt=<><rect x="2.5" y="5" width="23" height="21.5" rx="3" fill="#fff" stroke="#b0bec5" strokeWidth="1.4"/><path d="M2.5 8a3 3 0 0 1 3-3h17a3 3 0 0 1 3 3v3.5h-23z" fill="#e53935"/><rect x="7.5" y="2.5" width="2.2" height="5.5" rx="1.1" fill="#546e7a"/><rect x="18.3" y="2.5" width="2.2" height="5.5" rx="1.1" fill="#546e7a"/><g fill="#cfd8dc"><rect x="6.5" y="14.5" width="3.4" height="3" rx=".6"/><rect x="12.3" y="14.5" width="3.4" height="3" rx=".6"/><rect x="6.5" y="20" width="3.4" height="3" rx=".6"/><rect x="12.3" y="20" width="3.4" height="3" rx=".6"/></g><circle cx="24" cy="23.5" r="6.8" fill="#43a047"/><path d="m21 23.6 2.2 2.2 4-4.2" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/></>;
const checkArt=<><circle cx="16" cy="16" r="13" fill="#43a047"/><path d="m10.5 16.3 3.7 3.7 7.5-7.6" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></>;
const backpackArt=<><path d="M12 7.5a4 4 0 0 1 8 0" fill="none" stroke="#5d4037" strokeWidth="2"/><rect x="6" y="7" width="20" height="22.5" rx="6" fill="#fb8c00"/><path d="M6 13a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1.5H6z" fill="#e65100"/><rect x="10" y="18" width="12" height="8.5" rx="2.5" fill="#ffb74d"/><path d="M10.5 21.2h11" stroke="#f57c00" strokeWidth="1.3"/><rect x="15" y="12" width="2" height="5.5" rx="1" fill="#5d4037"/></>;
const shieldArt=<><path d="M16 2.5 27 6.5v8.3c0 7.2-4.7 12.3-11 14.7C9.7 27.1 5 22 5 14.8V6.5z" fill="#1e88e5"/><path d="M16 2.5 27 6.5v8.3c0 7.2-4.7 12.3-11 14.7z" fill="#1565c0"/><path d="m10.8 15.6 3.6 3.6 7-7.2" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></>;
const binocularsArt=<><rect x="5" y="5.5" width="7.5" height="8.5" rx="2.6" fill="#607d8b"/><rect x="19.5" y="5.5" width="7.5" height="8.5" rx="2.6" fill="#607d8b"/><rect x="2.5" y="11.5" width="12" height="16" rx="6" fill="#455a64"/><rect x="17.5" y="11.5" width="12" height="16" rx="6" fill="#455a64"/><rect x="12.5" y="13" width="7" height="6.5" rx="2" fill="#37474f"/><circle cx="8.5" cy="21.5" r="4" fill="#4fc3f7"/><circle cx="23.5" cy="21.5" r="4" fill="#4fc3f7"/><circle cx="7.2" cy="20.1" r="1.3" fill="#e1f5fe"/><circle cx="22.2" cy="20.1" r="1.3" fill="#e1f5fe"/></>;
const beachArt=<><circle cx="24.5" cy="8" r="4" fill="#fdd835"/><rect x="2" y="20.5" width="28" height="5.5" rx="1" fill="#29b6f6"/><path d="M2 25.3c6-2.6 22-2.6 28 0V29a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" fill="#ffe0a3"/><path d="M12.4 27.5c.4-5.2 1.6-9.6 3.9-13.4" fill="none" stroke="#8d6e63" strokeWidth="2.3" strokeLinecap="round"/><path d="M16.3 14.1c-3-3.3-7.3-3.7-10-1.7 3.4-.2 6.3 1 8 2.7zm0 0c1.2-4 5-6.3 8.4-5.5-3 .9-5.3 3-6.4 5.5zm0 0c3.8-.8 7.4 1 8.6 4.1-2.6-1.6-5.6-2.3-8.2-1.7zm0 0c-1.6-3.7-.4-7.5 2.2-9.1-1 2.9-1.2 6-.6 8.5z" fill="#43a047"/></>;
const jeepArt=<><path d="M7.5 13.5 10 8h11.5l3 5.5z" fill="#8d6e63"/><path d="M10.9 12.7 12.6 9h3.3v3.7zm6.5 0V9h3.3l2 3.7z" fill="#b3e5fc"/><rect x="2.5" y="13" width="27" height="9" rx="2.6" fill="#c9a66b"/><rect x="2.5" y="17" width="27" height="1.6" fill="#a8864f"/><rect x="27" y="14.5" width="2" height="2.4" rx=".6" fill="#fff59d"/><circle cx="9" cy="23.2" r="3.8" fill="#37474f"/><circle cx="23" cy="23.2" r="3.8" fill="#37474f"/><circle cx="9" cy="23.2" r="1.5" fill="#b0bec5"/><circle cx="23" cy="23.2" r="1.5" fill="#b0bec5"/></>;
const crossArt=<><circle cx="16" cy="16" r="13" fill="#e53935"/><path d="m11.3 11.3 9.4 9.4m0-9.4-9.4 9.4" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/></>;
const arts={clock:clockArt,tag:tagArt,compass:compassArt,hut:hutArt,group:groupArt,calendar:calendarArt,check:checkArt,backpack:backpackArt,shield:shieldArt,binoculars:binocularsArt,beach:beachArt,jeep:jeepArt,cross:crossArt};
// Icons supplied as artwork files.
const images={tent:'camp',flight:'flight',mountain:'climb',summit:'summit',forest:'forest'};
// Icons the admin can pick for a departure feature, with friendly names.
export const featureIconChoices=[['group','Group'],['tent','Camping'],['hut','Lodge'],['calendar','Dates'],['clock','Duration'],['check','Included'],['binoculars','Game drive'],['jeep','Vehicle'],['beach','Beach'],['mountain','Mountain'],['summit','Summit'],['forest','Forest'],['flight','Flight'],['compass','Guide'],['backpack','Gear'],['shield','Safety'],['tag','Price'],['cross','Not included']];

// Pick an icon for a safari/beach itinerary day from its text; the first matching rule wins.
export const tripDayIcon=text=>[
  [/airport|arriv|flight|fly|departure day/i,'flight'],
  [/beach|zanzibar|island|snorkel|ocean|kendwa|nungwi|dhow|spice|stone town|sunset cruise/i,'beach'],
  [/crater|ngorongoro|olduvai|kilimanjaro|summit|climb|hike/i,'mountain'],
  [/journey to|transfer|drive to|return to|travel to/i,'jeep'],
  [/game drive|safari|serengeti|tarangire|manyara|mikumi|migration|wildlife|national park|ruaha|selous|nyerere/i,'binoculars'],
  [/village|culture|cultural|market|maasai|town/i,'hut'],
  [/forest|walk|trek/i,'forest']
].find(([test])=>test.test(text))?.[1]||'compass';

// Pick an icon from what a free-text feature line says (e.g. a departure's "Guided group climb").
export const featureIcon=text=>/guide|group|team|porter/i.test(text)?'group':/camp|tent/i.test(text)?'tent':/hut|lodge|hotel/i.test(text)?'hut':/place|confirm|date|availab|seat|space/i.test(text)?'calendar':/day|hour|duration/i.test(text)?'clock':'check';

export function TrekIcon({name,size=22}){
  if(images[name])return <img src={`/images/kilimanjaro/icons/${images[name]}.webp`} alt="" width={size} height={size} aria-hidden="true"/>;
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">{arts[name]}</svg>;
}
