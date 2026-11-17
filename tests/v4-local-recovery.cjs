const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const password='V4-local-recovery-test!';
  await page.locator('#newpass').fill(password);
  await page.locator('#confpass').fill(password);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const before=await page.evaluate(async()=>{
   data.transactions.push({id:'to-lose',type:'expense',name:'Écriture récente',amount:33,date:'2026-11-17'});
   await save();
   return {active:localStorage.getItem(KEY),backup:localStorage.getItem(KEY+'-previous-v4')};
  });
  assert(before.active&&before.backup&&before.active!==before.backup);
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(password);
  await page.locator('#mbpV4Recover').click();
  await page.waitForFunction(()=>document.querySelector('#unlockmsg')?.textContent?.includes('coffre principal est lisible'));
  assert.match(await page.locator('#unlockmsg').innerText(),/coffre principal est lisible/);
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),before.active);
  await page.evaluate(()=>localStorage.setItem(KEY,'{vault-corrupted'));
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(password);
  await page.evaluate(()=>{mbpConfirm=async()=>true});
  await page.locator('#mbpV4Recover').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const after=await page.evaluate(()=>({active:localStorage.getItem(KEY),backup:localStorage.getItem(KEY+'-previous-v4'),tx:data.transactions.length}));
  assert.equal(after.active,before.backup);
  assert.equal(after.backup,before.backup);
  assert.equal(after.tx,0);
  console.log('V4_LOCAL_RECOVERY_PASS '+JSON.stringify({activeRestored:true,backupKept:true,transactionsRolledBack:1}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_LOCAL_RECOVERY_FAIL '+String(e.stack||e));process.exitCode=1});
