import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'hugos-admin-'));
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'production',PORT:'3197',ADMIN_PASSWORD:'admin-layout-test',DATA_DIR:dir},stdio:'ignore'});
let browser;
const base='http://127.0.0.1:3197';
try {
  let ready=false;
  for(let i=0;i<100;i++){try{if((await fetch(base+'/api/content')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
  assert(ready,'Test server started');
  browser=await chromium.launch({headless:true,channel:'chromium'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/admin');
  await page.getByLabel('Administrator password').fill('admin-layout-test');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  const nav=page.getByRole('navigation',{name:'Admin navigation'});
  await nav.waitFor();
  await page.screenshot({path:'/tmp/hugos-admin-desktop.png',fullPage:true});
  for(const name of ['Homepage','Announcements','Partners','Videos','Packages','Travel guide','Translations','Reviews','Payments','Settings']){
    await nav.getByRole('button',{name,exact:true}).click();
    await page.getByRole('heading',{name,exact:true,level:1}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' desktop overflow');
  }
  await nav.getByRole('button',{name:'Videos',exact:true}).click();
  await page.getByRole('button',{name:'Add video or link'}).click();
  await page.getByLabel('Title',{exact:true}).fill('Our travel films');
  await page.getByLabel('YouTube or website link',{exact:true}).fill('https://youtu.be/M7lc1UVf-VE');
  await page.getByRole('button',{name:'Publish changes'}).click();
  await page.getByText('Changes published successfully.').waitFor();
  await page.goto(base+'/');
  const showcase=page.getByRole('region',{name:'Watch the journey.'});
  await showcase.getByRole('heading',{name:'Our travel films'}).waitFor();
  assert.equal(await showcase.locator('iframe[title="Our travel films"]').getAttribute('src'),'https://www.youtube.com/embed/M7lc1UVf-VE?playsinline=1');
  const videoBox=await showcase.locator('iframe').boundingBox();
  assert(videoBox.width>=480&&videoBox.height>=270,'Video player has a usable size');
  await showcase.screenshot({path:'/tmp/hugos-home-video.png'});
  await page.goto(base+'/admin');
  await nav.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByLabel('Announcement text').fill('An unforgettable Tanzania adventure awaits.');
  await page.getByRole('button',{name:'Publish changes'}).click();
  await page.getByText('Changes published successfully.').waitFor();
  await page.reload();
  await nav.getByRole('button',{name:'Settings',exact:true}).click();
  assert.equal(await page.getByLabel('Announcement text').inputValue(),'An unforgettable Tanzania adventure awaits.');
  await page.getByRole('button',{name:'Switch to dark mode'}).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.screenshot({path:'/tmp/hugos-admin-settings-dark.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to light mode'}).click();
  await page.getByRole('button',{name:'Manage translations'}).click();
  await page.getByRole('heading',{name:'Translations',exact:true,level:1}).waitFor();
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});
    for(const name of ['Enquiries','Homepage','Announcements','Partners','Videos','Packages','Travel guide','Translations','Reviews','Payments','Settings']){
      await page.getByRole('button',{name:'Toggle admin navigation'}).click();
      await nav.getByRole('button',{name,exact:true}).click();
      assert.equal(await nav.isVisible(),false,'Mobile navigation closes');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow at '+width);
    }
  }
  await page.screenshot({path:'/tmp/hugos-admin-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Toggle admin navigation'}).click();
  await page.keyboard.press('Escape');
  assert.equal(await nav.isVisible(),false);
  await page.getByRole('button',{name:'Toggle admin navigation'}).click();
  await page.getByRole('button',{name:'Sign out'}).click();
  await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: all admin sections, settings persistence, appearance, desktop and mobile layouts, keyboard menu dismissal, sign out.');
}finally{await browser?.close();server.kill();rmSync(dir,{recursive:true,force:true})}
