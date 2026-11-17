const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/dist/v4-beta1/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const config=await page.evaluate(async()=>{
   const manifest=await (await fetch('./manifest.webmanifest')).json();
   const htmlTitle=document.title;
   const appleTitle=document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content;
   const previewScope=new URL('./',location.href).href;
   const prodCache=await caches.open('mon-budget-shell-v3.7-beta9-ui-1');
   await prodCache.put('/sentinel-v37',new Response('PRESERVE_PRODUCTION_CACHE'));
   const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
   await navigator.serviceWorker.ready;
   return {manifest,htmlTitle,appleTitle,previewScope,registrationScope:reg.scope,
    betaKey:KEY};
  });
  assert.equal(config.manifest.name,'Mon Budget Privé — V4 Bêta 1 (essai)');
  assert.equal(config.manifest.short_name,'Budget V4 Test');
  assert.equal(config.manifest.scope,'./');
  assert.equal(config.manifest.start_url,'./');
  assert.equal(config.manifest.id,'./');
  assert.equal(config.appleTitle,'Budget V4 Test');
  assert.equal(config.betaKey,'mbp-encrypted-v4-beta1');
  assert.equal(config.registrationScope,config.previewScope);
  assert.match(config.htmlTitle,/V4 Bêta 1/);
  await page.waitForFunction(async()=>{
   const reg=await navigator.serviceWorker.getRegistration('./');
   return reg?.active?.state==='activated';
  },null,{timeout:20000});
  const protection=await page.evaluate(async()=>{
   const preview=await caches.open('mon-budget-shell-v4-preview-beta1-offline-1');
   const cached=await preview.match(new URL('./index.html',location.href));
   const oldCache=await caches.open('mon-budget-shell-v3.7-beta9-ui-1');
   const sentinel=await oldCache.match('/sentinel-v37');
   const rootRegistration=await navigator.serviceWorker.getRegistration(new URL('/index.html',location.href).href);
   return {previewCached:!!cached,legacyCacheProtected:sentinel?await sentinel.text():null,
    rootControlledByPreview:rootRegistration?.scope===new URL('./',location.href).href};
  });
  assert.deepEqual(protection,{previewCached:true,legacyCacheProtected:'PRESERVE_PRODUCTION_CACHE',rootControlledByPreview:false});
  const pass='V4-preview-isolated-test!';
  await page.locator('#newpass').fill(pass);
  await page.locator('#confpass').fill(pass);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  await page.evaluate(async()=>{
   data.transactions.push({id:'preview-offline',type:'expense',name:'Bêta hors ligne',amount:12.34,cat:'Variables',date:'2026-11-17'});
   await save();
  });
  await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(pass);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  assert.deepEqual(await page.evaluate(()=>data.transactions.map(t=>t.id)),['preview-offline']);
  assert.deepEqual(errors,[]);
  console.log('V4_PREVIEW_SCOPE_PASS '+JSON.stringify({manifestSeparate:true,workerScopeLimited:true,oldCacheProtected:true,offlineLaunch:true}));
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_PREVIEW_SCOPE_FAIL '+String(e.stack||e));process.exitCode=1});
