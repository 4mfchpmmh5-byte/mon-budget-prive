const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const password='Vault-failure-tests-2026!';
  await page.locator('#newpass').fill(password);
  await page.locator('#confpass').fill(password);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const checks=await page.evaluate(async password=>{
   const prevData=data,prevSecret=secret;
   const previousStored=localStorage.getItem(KEY);
   const backupKey=KEY+'-previous-v4';
   const proto=Object.getPrototypeOf(localStorage);
   const nativeSet=proto.setItem;
   try{
    data={...data,transactions:[{id:'persist',name:'Écriture validée',date:'2026-11-17',type:'expense',amount:18}]};
    await save();
    const committed=localStorage.getItem(KEY);
    const backup=localStorage.getItem(backupKey);
    const recovered=await unseal(JSON.parse(backup),password);
    const normal={backupExact:backup===previousStored,backupReadable:Array.isArray(recovered.transactions),committedChanged:committed!==previousStored};
    const inject=(key)=>{
      proto.setItem=function(k,v){if(k===key)throw new DOMException('Storage full','QuotaExceededError');return nativeSet.call(this,k,v)};
    };
    let backupFailure=false,primaryUnchangedAfterBackupFailure=false;
    data={...data,transactions:[...data.transactions,{id:'error',name:'Non persistée',date:'2026-11-17',type:'expense',amount:1}]};
    inject(backupKey);
    try{await save()}catch(e){backupFailure=e.name==='QuotaExceededError'}
    finally{proto.setItem=nativeSet}
    primaryUnchangedAfterBackupFailure=localStorage.getItem(KEY)===committed;
    let mainFailure=false,primaryUnchangedAfterMainFailure=false;
    inject(KEY);
    try{await save()}catch(e){mainFailure=e.name==='QuotaExceededError'}
    finally{proto.setItem=nativeSet}
    primaryUnchangedAfterMainFailure=localStorage.getItem(KEY)===committed;
    const backupStillReadable=!!(await unseal(JSON.parse(localStorage.getItem(backupKey)),password));
    return {normal,backupFailure,primaryUnchangedAfterBackupFailure,mainFailure,primaryUnchangedAfterMainFailure,backupStillReadable};
   }finally{proto.setItem=nativeSet;data=prevData;secret=prevSecret;}
  },password);
  assert.deepEqual(checks.normal,{backupExact:true,backupReadable:true,committedChanged:true});
  assert.equal(checks.backupFailure,true);
  assert.equal(checks.primaryUnchangedAfterBackupFailure,true);
  assert.equal(checks.mainFailure,true);
  assert.equal(checks.primaryUnchangedAfterMainFailure,true);
  assert.equal(checks.backupStillReadable,true);
  console.log('V4_VAULT_FAILURE_PASS '+JSON.stringify(checks));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_VAULT_FAILURE_FAIL '+String(e.stack||e));process.exitCode=1});
