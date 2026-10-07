import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {catalog} from './locales/catalog';
// French, German and Spanish text is downloaded only for visitors who choose one of those languages.
let catalogLoad=null;
export const loadTranslations=()=>catalogLoad||=Promise.all([import('./locales/interface'),import('./locales/pages'),import('./locales/journeys')]).catch(error=>{catalogLoad=null;throw error});
export const savedLanguage=()=>{try{return localStorage.getItem('hugos-language')||'en'}catch{return 'en'}};
import {languages,currencies} from './regional-options';
export {languages,currencies} from './regional-options';
const context=createContext(null);
const readPreference=(key,options,fallback)=>{try{const saved=localStorage.getItem(key);return options.includes(saved)?saved:fallback}catch{return fallback}};
export function translate(text,language){
 if(language==='en'||typeof text!=='string'||!text.trim())return text;
 const normalized=text.replace(/\s+/g,' ').trim();
 const translated=catalog[normalized.toLowerCase()]?.[language];
 if(translated){const value=normalized===normalized.toUpperCase()&&/[A-Z]/.test(normalized)?translated.toLocaleUpperCase(language):translated;return text.replace(text.trim(),value)}
 // Interpolated labels keep their values separate from translations.
 const patterns=[[/^(Language|Currency): (.+)$/,m=>`${translate(m[1],language)}: ${m[2]}`],[/^Explore (.+) menu$/i,m=>`${translate('Explore',language)} ${translate(m[1],language)}`],[/^Explore (.+)$/i,m=>`${translate('Explore',language)} ${translate(m[1],language)}`],[/^Show slide (\d+): (.+)$/i,m=>`${translate('Show slide',language)} ${m[1]}: ${translate(m[2],language)}`],[/^(.+) · (\d+) DAYS$/,m=>`${translate(m[1],language)} · ${m[2]} ${translate('days',language)}`],[/^From, per person · ([A-Z]{3})$/,m=>`${translate('From, per person',language)} · ${m[1]}`]];
 for(const [pattern,fn]of patterns){const match=normalized.match(pattern);if(match)return fn(match)}
 return text;
}
export function LocaleProvider({children}){
 const[language,setLanguageState]=useState(()=>readPreference('hugos-language',languages.map(l=>l.code),'en'));
 const[currency,setCurrencyState]=useState(()=>readPreference('hugos-currency',currencies.map(c=>c.code),'USD'));
 const[translations,setTranslations]=useState({});
 const[catalogVersion,setCatalogVersion]=useState(0);
 useEffect(()=>{if(language!=='en')loadTranslations().then(()=>setCatalogVersion(1)).catch(()=>{})},[language]);
 const[exchange,setExchange]=useState({rates:{USD:1},status:'loading',updatedAt:null});
 useEffect(()=>{let live=true;fetch('/api/exchange-rates').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{if(live)setExchange(data)}).catch(()=>{if(live)setExchange({rates:{USD:1},status:'unavailable',updatedAt:null})});return()=>{live=false}},[]);
 useEffect(()=>{document.documentElement.lang=language;try{localStorage.setItem('hugos-language',language)}catch{}},[language]);
 useEffect(()=>{try{localStorage.setItem('hugos-currency',currency)}catch{}},[currency]);
 const value=useMemo(()=>{const overrides=Object.fromEntries(Object.entries(translations[language]||{}).map(([k,v])=>[k.replace(/\s+/g,' ').trim().toLowerCase(),v]));const t=text=>{if(language!=='en'&&typeof text==='string'){const key=text.replace(/\s+/g,' ').trim().toLowerCase();if(overrides[key]?.trim())return overrides[key]}return translate(text,language)};const locale=languages.find(l=>l.code===language).locale;const effectiveCurrency=Number.isFinite(exchange.rates?.[currency])?currency:'USD';return {language,currency,effectiveCurrency,setTranslations,exchange,locale,setLanguage:code=>{if(languages.some(l=>l.code===code))setLanguageState(code)},setCurrency:code=>{if(currencies.some(c=>c.code===code))setCurrencyState(code)},t,formatPrice:(usd,{base=false}={})=>new Intl.NumberFormat(locale,{style:'currency',currency:base?'USD':effectiveCurrency,maximumFractionDigits:0}).format(usd*(base?1:exchange.rates[effectiveCurrency]||1))}},[language,currency,exchange,translations,catalogVersion]);
 return React.createElement(context.Provider,{value},children);
}
export const useLocale=()=>useContext(context);
function LocalizedHost({tag,attributes,children}){
 const state=useLocale();const t=state?.t||((s)=>s);
 const props={...attributes};delete props.key;
 for(const key of ['alt','title','placeholder','aria-label'])if(typeof props[key]==='string')props[key]=t(props[key]);
 const localize=value=>Array.isArray(value)?value.map(localize):typeof value==='string'?t(value):value;
 if(tag==='option'&&props.value===undefined&&typeof children[0]==='string')props.value=children[0];
 const translated=['script','style','code','pre','textarea'].includes(tag)||props['data-no-translate']?children:children.map(localize);
 return React.createElement(tag,props,...translated);
}
// Translate React-rendered text and accessible labels, never mutate the DOM or form values.
function LocalizedFragment({children}){const state=useLocale();const localize=value=>Array.isArray(value)?value.map(localize):typeof value==='string'?state?.t(value)||value:value;return React.createElement(React.Fragment,null,localize(children))}
export function h(type,props,...children){if(type===React.Fragment)return React.createElement(LocalizedFragment,props,...children);return typeof type==='string'?React.createElement(LocalizedHost,{key:props?.key,tag:type,attributes:props||{},children}):React.createElement(type,props,...children)}
export function Price({amount}){const{effectiveCurrency,formatPrice,t}=useLocale();return React.createElement('span',{'data-price-usd':amount,title:effectiveCurrency!=='USD'?`${t('Approximate conversion')} · ${formatPrice(amount,{base:true})} USD`:undefined},effectiveCurrency!=='USD'?'≈ ':'',formatPrice(amount))}
export function CurrencyNotice(){const{currency,effectiveCurrency,exchange,t,locale}=useLocale();if(currency==='USD')return null;return React.createElement('div',{className:'currency-notice',role:'status'},effectiveCurrency==='USD'?t('Conversion is temporarily unavailable. Prices are shown in USD.'):React.createElement(React.Fragment,null,t('Converted prices are estimates. Final quotations are in USD.'),' ',exchange.updatedAt&&`${t('Rate date')}: ${new Date(exchange.updatedAt).toLocaleDateString(locale)}. `,React.createElement('a',{href:'https://www.exchangerate-api.com',target:'_blank',rel:'noreferrer'},t('Rates by ExchangeRate-API'))))}
