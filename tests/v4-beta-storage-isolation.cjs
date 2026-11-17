const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
   if(!localStorage.getItem('mbp-encrypted-v1'))localStorage.setItem('mbp-encrypted-v1','V37_LEGACY_PRODUCTION_SENTINEL');
   if(!localStorage.getItem('mbp-encrypted-v1-previous-v4'))localStorage.setItem('mbp-encrypted-v1-previous-v4','V37_LEGACY_BACKUP_SENTINEL');
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  assert.equal(await page.locator('#unlock:not(.hidden)').count(),0,'Old vault must not automatically unlock or migrate');
  assert.match(await page.locator('#mbpV4BetaNotice').innerText(),/coffre de test indépendant/i);
  const pw='V4-isolated-beta-2026!';
  await page.locator('#newpass').fill(pw);
  await page.locator('#confpass').fill(pw);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const first=await page.evaluate(async()=>{
   data.transactions.push({id:'v4-isolated',type:'expense',name:'Écriture bêta uniquement',amount:7.25,cat:'Variables',date:'2026-11-17'});
   await save();
   return {key:KEY,
    production:localStorage.getItem('mbp-encrypted-v1'),
    productionBackup:localStorage.getItem('mbp-encrypted-v1-previous-v4'),
    beta:localStorage.getItem(KEY),betaBackup:localStorage.getItem(KEY+'-previous-v4')};
  });
  assert.equal(first.key,'mbp-encrypted-v4-beta1');
  assert.equal(first.production,'V37_LEGACY_PRODUCTION_SENTINEL');
  assert.equal(first.productionBackup,'V37_LEGACY_BACKUP_SENTINEL');
  assert(first.beta&&!first.beta.includes('Écriture bêta uniquement'));
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  assert.match(await page.locator('#mbpV4BetaNoticeUnlock').innerText(),/coffre de test indépendant/i);
  await page.locator('#pass').fill(pw);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  assert.deepEqual(await page.evaluate(()=>data.transactions.map(t=>t.id)),['v4-isolated']);
  const second=await page.evaluate(()=>({
   legacy:localStorage.getItem('mbp-encrypted-v1'),
   legacyBackup:localStorage.getItem('mbp-encrypted-v1-previous-v4'),
   beta:localStorage.getItem(KEY)}));
  assert.equal(second.legacy,first.production);
  assert.equal(second.legacyBackup,first.productionBackup);
  assert(second.beta);
  assert.deepEqual(errors,[]);
  console.log('V4_BETA_STORAGE_ISOLATION_PASS '+JSON.stringify({legacyUnchanged:true,legacyBackupUnchanged:true,independentVault:true,reopenedAfterReload:true}));
  await context.close();
 }finally{await browser.close()}
})().catch(err=>{console.error('V4_BETA_STORAGE_ISOLATION_FAIL '+String(err.stack||err));process.exitCode=1});
