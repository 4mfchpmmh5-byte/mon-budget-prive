const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});const errors=[];
 try{for(const width of [320,375,390,430,768]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<768,hasTouch:width<768});
  page.on('pageerror',e=>errors.push(width+': '+e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  await page.locator('#newpass').fill('V41-security-test-safe-2026!');
  await page.locator('#confpass').fill('V41-security-test-safe-2026!');
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  await page.evaluate(()=>tab('settings'));
  const outcome=await page.evaluate(()=>{
   const sections=[...document.querySelectorAll('#mbp41-settings-layout>.mbp41-prefsection')];
   const ids=sections.map(x=>x.id);
   const btn=['export','import','lock','resetdata','wipe'].map(id=>({id,count:document.querySelectorAll('#'+id).length,within:!!document.getElementById(id)?.closest('#mbp41-settings-layout')}));
   const sensitive=document.querySelector('#mbp41-security .mbp41-danger-fold');
   return {ids,btn,closed:!sensitive.open,version:document.querySelector('#settings .v262-version')?.textContent,key:KEY,
    width:document.documentElement.scrollWidth,vw:innerWidth,custom:!!document.querySelector('#mbp41-personalization #v26custombox'),
    tax:!!document.querySelector('#mbp41-fiscal #v312taxdetails'),
    obsolete:!!document.querySelector('#settings>.v24-settings-group:not([aria-hidden])')};
  });
  assert.deepEqual(outcome.ids,['mbp41-backups','mbp41-fiscal','mbp41-personalization','mbp41-security']);
  assert(outcome.btn.every(x=>x.count===1&&x.within),'Original wired actions are not in sections: '+JSON.stringify(outcome.btn));
  assert(outcome.closed,'Destructive controls must be collapsed by default');
  assert(outcome.custom&&outcome.tax,'Existing settings sections lost');
  assert.equal(outcome.key,'mbp-encrypted-v1');
  assert(outcome.width<=width+4,'Horizontal overflow '+JSON.stringify(outcome));
  await page.locator('#mbp41-security .mbp41-danger-fold > summary').click();
  assert.equal(await page.locator('#mbp41-security #wipe').isVisible(),true);
  assert.equal(await page.locator('#mbp41-security #resetdata').isVisible(),true);
  await page.locator('#mbp41-security .mbp41-danger-fold > summary').click();
  assert.equal(await page.locator('#mbp41-security #wipe').isVisible(),false);
  await page.close();
 }
 assert.deepEqual(errors,[]);
 console.log('V41_PROFILE_SECURITY_REORDER_PASS '+JSON.stringify({screens:5,sections:4,existingActionsRetained:true,destructiveFoldClosed:true,vaultUntouched:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V41_PROFILE_SECURITY_REORDER_FAIL '+String(e.stack||e));process.exitCode=1});
