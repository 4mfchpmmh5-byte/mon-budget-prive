const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({
   viewport:{width:390,height:844},isMobile:true,hasTouch:true,
   serviceWorkers:'allow'
  });
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const pass='V4-offline-vault-2026!';
  await page.locator('#newpass').fill(pass);
  await page.locator('#confpass').fill(pass);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const initial=await page.evaluate(async()=>{
   const stamp=new Date().toLocaleDateString('sv-SE');
   data.transactions.push({id:'online-entry',type:'expense',name:'Avant hors ligne',amount:21.45,cat:'Variables',date:stamp});
   await save();
   const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
   await navigator.serviceWorker.ready;
   const active=reg.active||reg.waiting||reg.installing;
   if(!active||active.state!=='activated')throw Error('Service worker inactive');
   const names=await caches.keys();
   const cache=await caches.open('mon-budget-shell-v4-beta1-offline-1');
   const entry=await cache.match(new URL('./index.html',location.href));
   if(!entry)throw Error('Offline shell not cached');
   return {registered:true,names,encrypted:!localStorage.getItem(KEY).includes('Avant hors ligne')};
  });
  assert(initial.names.includes('mon-budget-shell-v4-beta1-offline-1'));
  assert(initial.encrypted);
  // SW must control navigation before entering offline mode.
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(pass);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const offline=await page.evaluate(async()=>{
   if(!data.transactions.some(t=>t.id==='online-entry'))throw Error('Online entry missing while offline');
   data.transactions.push({id:'offline-entry',type:'expense',name:'Ajout sans réseau',amount:9.75,cat:'Variables',date:new Date().toLocaleDateString('sv-SE')});
   await save();
   return {count:data.transactions.length,encrypted:!localStorage.getItem(KEY).includes('Ajout sans réseau')};
  });
  assert.equal(offline.count,2);
  assert(offline.encrypted);
  await page.reload({waitUntil:'load'});
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(pass);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const final=await page.evaluate(()=>({
   online:data.transactions.some(t=>t.id==='online-entry'),
   offline:data.transactions.some(t=>t.id==='offline-entry'),
   count:data.transactions.length
  }));
  assert.deepEqual(final,{online:true,offline:true,count:2});
  assert.deepEqual(pageErrors,[]);
  console.log('V4_OFFLINE_VAULT_PASS '+JSON.stringify({cached:true,unlockedOffline:true,offlineWritePersisted:true,returnedEntries:final.count}));
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_OFFLINE_VAULT_FAIL '+String(e.stack||e));process.exitCode=1});
