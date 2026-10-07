import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {initialContent} from '../src/data.js';

const base = process.env.THEME_TEST_URL || 'http://127.0.0.1:3197';
const routes = ['/', '/safaris', '/zanzibar-tours', '/kilimanjaro', '/combination-packages', '/afcon-tanzania', '/plan-my-trip', '/about-us', '/contact', '/travel-guide', '/payment-options', '/privacy-policy', '/terms', '/refund-policy', '/admin', '/missing-page', ...['serengeti','ngorongoro','tarangire','lake-manyara'].map(id=>'/destinations/'+id), ...initialContent.packages.filter(p=>p.published).map(p=>'/packages/'+p.id), ...initialContent.articles.filter(a=>a.published).map(a=>'/travel-guide/'+a.id)];
const browser = await chromium.launch({channel:'chromium',headless:true});
const failures = [];
try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  await page.route('**/api/**', route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(route.request().url().endsWith('/exchange-rates')?{rates:{USD:1},status:'unavailable'}:route.request().url().endsWith('/enquiries')?[]:initialContent)}));
  await page.addInitScript(()=>localStorage.setItem('hugos-theme','dark'));
  const errors=[];
  page.on('pageerror',error=>{errors.push(error.message);console.error(error.message)});
  async function check(label) {
    const lowContrast = await page.evaluate(()=>{
      const rgb=s=>s.match(/[\d.]+/g)?.map(Number);
      const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const issues=[];
      for(const el of document.querySelectorAll('body *')) {
        if(!el.checkVisibility() || ![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()) || el.closest('svg,script,style')) continue;
        // Image overlays need visual inspection; evaluate solid backgrounds here.
        if(el.closest('.cinema-hero,.experience-tile,.page-hero.with-image,.escape-photo,.mega-photo,.mountain-feature')) continue;
        const style=getComputedStyle(el);
        let bg;
        for(let node=el;node;node=node.parentElement){const c=rgb(getComputedStyle(node).backgroundColor);if(c && (c.length===3||c[3]===1)){bg=c;break;}}
        if(!bg)continue;
        const fg=rgb(style.color), a=lum(fg),b=lum(bg), ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        const large=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && Number(style.fontWeight)>=700);
        if(ratio<(large?3:4.5)) issues.push({text:el.textContent.trim().slice(0,65),class:el.className,ratio:ratio.toFixed(2)});
      }
      return issues;
    });
    if(lowContrast.length)failures.push({label,lowContrast});
  }
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:950});
    for(const route of routes){console.log(width,route);await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.locator('.theme-toggle').waitFor();await check(`${width} ${route}`);assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');}
  }
  await page.goto(base+'/admin',{waitUntil:'domcontentloaded'});
  for(const tab of ['Homepage','Packages','Travel guide','Translations','Reviews','Payments']){await page.getByRole('button',{name:tab,exact:true}).click();await check('Admin '+tab);}
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.setViewportSize({width:1440,height:950});
  await page.getByRole('button',{name:'Explore Safaris menu',exact:true}).click();await check('Mega menu');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Search the website',exact:true}).click();await check('Search');
  await page.keyboard.press('Escape');
  await page.screenshot({path:'/tmp/hugos-dark-home.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to light mode',exact:true}).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  assert.deepEqual(errors,[]);
  assert.deepEqual(failures,[]);
  console.log(`PASS: dark text contrast on ${routes.length} routes at desktop/mobile widths, admin tabs, menus, search, and light mode toggle.`);
} finally {await browser.close();}
