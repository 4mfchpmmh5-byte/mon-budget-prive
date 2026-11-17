const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});const errors=[];
 try{
  for(const width of [320,375,390,430,768]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<768,hasTouch:width<768});
   page.on('pageerror',e=>errors.push(width+': '+e.message));
   await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
   await page.locator('#setup:not(.hidden)').waitFor();
   await page.locator('#newpass').fill('V41-shortcuts-safe-2026!');
   await page.locator('#confpass').fill('V41-shortcuts-safe-2026!');
   await page.locator('#create').click();
   await page.locator('#app:not(.hidden)').waitFor();
   await page.evaluate(async()=>{
    data.quickLabels=['Essence','Santé','Cadeaux'];
    data.v31Shortcuts={Essence:{type:'expense',visible:true},'Santé':{type:'expense',visible:false},Cadeaux:{type:'expense',visible:true}};
    await save();render();
   });
   const before=await page.evaluate(()=>({key:KEY,transactions:data.transactions.length,labels:[...data.quickLabels],body:document.documentElement.scrollWidth}));
   assert.equal(before.key,'mbp-encrypted-v1');
   assert(before.body<=width+4,'Horizontal overflow before navigation: '+width);
   assert.equal(await page.locator('#v24quick .mbp-v41-shortcut-organize').count(),1);
   assert.match(await page.locator('#v24quick .mbp-v41-shortcut-count').innerText(),/2 raccourcis personnalisés affichés · 3 enregistrés/);
   await page.locator('#v24quick .mbp-v41-shortcut-organize').click();
   assert.equal(await page.locator('#settings:not(.hidden)').count(),1,'Organiser must open Settings');
   assert.equal(await page.locator('#v26custombox').count(),1);
   const down=page.locator('#v26customlist [data-v31down="0"]');
   await down.click();
   const after=await page.evaluate(()=>({labels:[...data.quickLabels],transactions:data.transactions.length,key:KEY}));
   assert.deepEqual(after.labels,['Santé','Essence','Cadeaux'],'Reorder must persist in encrypted state');
   assert.equal(after.transactions,before.transactions,'Shortcut management must not change operations');
   assert.equal(after.key,before.key);
   await page.evaluate(()=>tab('add'));
   assert.equal(await page.locator('#v24quick .mbp-v41-shortcut-organize').count(),1,'Only one Organiser button');
   const afterWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert(afterWidth<=width+4,'Horizontal overflow after navigation: '+width);
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('V41_BETA3_SHORTCUTS_PASS '+JSON.stringify({viewports:5,organizeNavigation:true,encryptedReorder:true,transactionsUntouched:true,keyPreserved:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V41_BETA3_SHORTCUTS_FAIL '+String(e.stack||e));process.exitCode=1});
