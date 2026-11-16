const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const pw='V4-erasure-recovery-2026!';
  await page.locator('#newpass').fill(pw);
  await page.locator('#confpass').fill(pw);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  await page.evaluate(async()=>{
    data.transactions.push({id:'first',type:'expense',name:'Test',amount:4,date:'2026-11-17'});
    await save();
  });
  const backup=await page.evaluate(()=>localStorage.getItem(KEY+'-previous-v4'));
  assert(backup);
  await page.evaluate(()=>localStorage.removeItem(KEY));
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  assert.equal(await page.locator('#mbpV4Recover').isVisible(),true);
  await page.locator('#pass').fill(pw);
  await page.evaluate(()=>{mbpConfirm=async()=>true});
  await page.locator('#mbpV4Recover').click();
  await page.locator('#app:not(.hidden)').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),backup);
  await page.evaluate(async()=>{
    data.transactions.push({id:'second',type:'expense',name:'Autre',amount:8,date:'2026-11-17'});
    await save();
  });
  await page.evaluate(()=>{mbpPrompt=async()=> 'EFFACER';});
  await page.evaluate(()=>tab('settings'));
  await page.locator('#wipe').click();
  await page.locator('#setup:not(.hidden)').waitFor();
  const after=await page.evaluate(()=>({active:localStorage.getItem(KEY),previous:localStorage.getItem(KEY+'-previous-v4')}));
  assert.deepEqual(after,{active:null,previous:null});
  await page.reload();
  await page.locator('#setup:not(.hidden)').waitFor();
  console.log('V4_ERASURE_AND_MISSING_PRIMARY_PASS '+JSON.stringify({recoveredWithoutPrimary:true,deletedBothCopies:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_ERASURE_AND_MISSING_PRIMARY_FAIL '+String(e.stack||e));process.exitCode=1});
