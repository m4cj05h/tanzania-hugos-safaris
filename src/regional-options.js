// Offer only languages with a website translation catalog.
export const languages=[
 {code:'en',name:'English',englishName:'English',locale:'en',flag:'🇬🇧'},
 {code:'fr',name:'Français',englishName:'French',locale:'fr',flag:'🇫🇷'},
 {code:'de',name:'Deutsch',englishName:'German',locale:'de',flag:'🇩🇪'},
 {code:'es',name:'Español',englishName:'Spanish',locale:'es',flag:'🇪🇸'}
];
export const translatedLanguages=languages.map(language=>language.code);
const currencyNames=new Intl.DisplayNames(['en'],{type:'currency'});
// Offer a focused selection of travel currencies, including the local currency.
const currencyFlags={USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',TZS:'🇹🇿',CAD:'🇨🇦',AUD:'🇦🇺',CHF:'🇨🇭',JPY:'🇯🇵',CNY:'🇨🇳',INR:'🇮🇳',AED:'🇦🇪',ZAR:'🇿🇦',KES:'🇰🇪'};
const preferredCurrencies=['USD','EUR','GBP','TZS','CAD','AUD','CHF','JPY','CNY','INR','AED','ZAR','KES'];
export const currencies=preferredCurrencies.map(code=>({code,name:currencyNames.of(code),flag:currencyFlags[code],symbol:new Intl.NumberFormat('en',{style:'currency',currency:code,currencyDisplay:'narrowSymbol'}).formatToParts(0).find(part=>part.type==='currency').value}));
