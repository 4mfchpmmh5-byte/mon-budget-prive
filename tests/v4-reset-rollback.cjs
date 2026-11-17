const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const pw='V4-reset-rollback-2026!';
  await page.locator('#newpass').fill(pw);
  await page.locator('#confpass').fill(pw);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const observed=await page.evaluate(async pw=>{
   data.transactions.push({id:'historical',type:'expense',name:'Historique',amount:35,date:'2026-11-17'});
   await save();
   const before=localStorage.getItem(KEY),backup=localStorage.getItem(KEY+'-previous-v4');
   const proto=Object.getPrototypeOf(localStorage),nativeRemove=proto.removeItem;
   mbpPrompt=async msg=>msg.includes('RÉINITIALISER')?'RÉINITIALISER':pw;
   proto.removeItem=function(k){if(k===KEY+'-previous-v4')throw new DOMException('Storage failure','QuotaExceededError');return nativeRemove.call(this,k)};
   try{await document.getElementById('resetdata').onclick()}
   finally{proto.removeItem=nativeRemove}
   const failed={active:localStorage.getItem(KEY)===before,backup:localStorage.getItem(KEY+'-previous-v4')===backup,inMemory:data.transactions.length===1};
   await document.getElementById('resetdata').onclick();
   const resetData=await unseal(JSON.parse(localStorage.getItem(KEY)),pw);
   return {failed,success:{activeEmpty:resetData.transactions.length===0,backupGone:localStorage.getItem(KEY+'-previous-v4')===null}};
  },pw);
  assert.deepEqual(observed.failed,{active:true,backup:true,inMemory:true});
  assert.deepEqual(observed.success,{activeEmpty:true,backupGone:true});
  console.log('V4_RESET_ROLLBACK_PASS '+JSON.stringify(observed));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_RESET_ROLLBACK_FAIL '+String(e.stack||e));process.exitCode=1});
