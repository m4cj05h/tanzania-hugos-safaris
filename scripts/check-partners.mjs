import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const dir=mkdtempSync(join(tmpdir(),'hugos-partners-'));
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'production',PORT:'3199',ADMIN_PASSWORD:'partner-browser-test',DATA_DIR:dir},stdio:'pipe'});
let browser;
try{
  const base='http://127.0.0.1:3199';
  let ready=false;
  for(let i=0;i<100;i++){try{if((await fetch(base+'/api/content')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  assert(ready,'Test server started');
  browser=await chromium.launch({headless:true,channel:'chromium'});
  const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  const section=page.getByRole('region',{name:'Our partners.'});
  await section.waitFor();
  await page.waitForTimeout(600);
  assert.equal(await section.locator('img').count(),2);
  assert.equal(await section.getByRole('heading',{name:'Our partners.'}).count(),1);
  assert.equal(await section.getByText('TRAVEL CONNECTIONS').count(),0);
  assert.equal(await section.locator('button').count(),0);
  await section.screenshot({path:'/tmp/hugos-partners-light.png'});
  await page.waitForTimeout(5000);
  assert.equal(await section.locator('img').count(),2);
  assert.equal(await section.locator('img').first().getAttribute('alt'),'Your African Safari');
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  await section.screenshot({path:'/tmp/hugos-partners-dark.png'});
  await page.waitForTimeout(9000);
  assert.equal(await section.locator('img').first().getAttribute('alt'),'Tanzania Association of Tour Operators');
  await section.screenshot({path:'/tmp/hugos-partners-dark-last.png'});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile partner section fits viewport');
  await section.screenshot({path:'/tmp/hugos-partners-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: partner heading and pair render, slides advance, and there are no page errors.');
}finally{await browser?.close();server.kill();rmSync(dir,{recursive:true,force:true});}
