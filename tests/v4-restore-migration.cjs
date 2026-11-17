const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const activePass='V4-existing-vault-2026!',importPass='V4-imported-backup-2026!';
  await page.locator('#newpass').fill(activePass);
  await page.locator('#confpass').fill(activePass);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const results=await page.evaluate(async({activePass,importPass})=>{
   const old={
    id:'existing',type:'expense',name:'Dépense existante',cat:'Variables',
    amount:27.35,date:'2026-11-12'
   };
   data.transactions.push(old);
   await save();
   const before=localStorage.getItem(KEY);
   const oldData=data;
   const backupKey=KEY+'-previous-v4';
   localStorage.setItem(backupKey,before);
   const previousBackup=localStorage.getItem(backupKey);
   const incoming={
    version:1,plans:[{id:'holiday',cat:'Provisions',name:'Voyages',amount:250}],
    transactions:[{id:'imported',type:'expense',name:'Dépense importée',cat:'Variables',amount:41.12,date:'2026-11-15'}],
    assets:[],snapshots:[],recurring:[],envelopeMoves:[]
   };
   const encrypted=await seal(incoming,importPass);
   const run=async()=>document.getElementById('importfile').onchange({
    target:{files:[{text:async()=>JSON.stringify(encrypted)}],value:'sample.json'}
   });
   const notices=[];
   mbpAlert=async message=>{notices.push(message)};
   mbpPrompt=async()=>importPass;
   mbpConfirm=async()=>false;
   await run();
   const cancelled={
    active:localStorage.getItem(KEY)===before,
    recovery:localStorage.getItem(backupKey)===previousBackup,
    data:data===oldData
   };
   mbpConfirm=async()=>true;
   const proto=Object.getPrototypeOf(localStorage);
   const originalRemove=proto.removeItem;
   let once=true;
   proto.removeItem=function(key){
    if(key===backupKey&&once){once=false;throw new DOMException('Blocked once','QuotaExceededError')}
    return originalRemove.call(this,key);
   };
   try{await run()}finally{proto.removeItem=originalRemove}
   const failed={
    active:localStorage.getItem(KEY)===before,
    recovery:localStorage.getItem(backupKey)===previousBackup,
    data:data===oldData,
    secret:secret===activePass
   };
   await run();
   const after=await unseal(JSON.parse(localStorage.getItem(KEY)),importPass);
   return {
    cancelled,failed,
    imported:{
     activeDifferent:localStorage.getItem(KEY)!==before,
     oldBackupErased:localStorage.getItem(backupKey)===null,
     newData:data.transactions.length===1&&data.transactions[0].id==='imported',
     migrated:after.schemaVersion===2&&after.plans[0].goalId==='goal:holiday',
     oldDataGone:!after.transactions.some(t=>t.id==='existing'),
     passwordChanged:secret===importPass
    },notices
   };
  },{activePass,importPass});
  assert.deepEqual(results.cancelled,{active:true,recovery:true,data:true});
  assert.deepEqual(results.failed,{active:true,recovery:true,data:true,secret:true});
  assert.deepEqual(results.imported,{
   activeDifferent:true,oldBackupErased:true,newData:true,migrated:true,oldDataGone:true,passwordChanged:true
  });
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(importPass);
  await page.locator('#unlockform button[type="submit"]').click();
  await page.locator('#app:not(.hidden)').waitFor();
  assert.deepEqual(await page.evaluate(()=>data.transactions.map(t=>t.id)),['imported']);
  assert.deepEqual(errors,[]);
  console.log('V4_RESTORE_MIGRATION_PASS '+JSON.stringify({
   cancelPreserved:true,failedWriteRollback:true,legacyGoalMigrated:true,
   oldBackupPurged:true,unlockedAfterReload:true
  }));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_RESTORE_MIGRATION_FAIL '+String(e.stack||e));process.exitCode=1});
