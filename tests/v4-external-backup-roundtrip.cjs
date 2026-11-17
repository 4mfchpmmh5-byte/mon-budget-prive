const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const password='V4-external-export-test-2026!';
  await page.locator('#newpass').fill(password);
  await page.locator('#confpass').fill(password);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const before=await page.evaluate(async()=>{
   data.transactions.push({id:'export-t1',type:'expense',name:'Courses prêtes à exporter',amount:28.3,cat:'Variables',date:'2026-11-16'});
   data.plans.push({id:'export-p1',cat:'Provisions',name:'Vacances',amount:550});
   data.assets.push({id:'export-a1',name:'PEA',type:'PEA',amount:1000,invested:900});
   await save();
   return {primary:localStorage.getItem(KEY),snapshot:JSON.stringify(data)};
  });
  const pending=page.waitForEvent('download',{timeout:15000});
  await page.evaluate(()=>document.getElementById('export').click());
  const download=await pending;
  assert.match(download.suggestedFilename(),/^mon-budget-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
  const fs=require('node:fs/promises');
  const exported=await fs.readFile(await download.path(),'utf8');
  assert(!exported.includes('Courses prêtes à exporter'),'Export contains plaintext data');
  const envelope=JSON.parse(exported);
  assert.equal(envelope.format,'mon-budget-prive');
  const opened=await page.evaluate(async({envelope,password})=>{
   return await unseal(envelope,password);
  },{envelope,password});
  assert.equal(opened.transactions[0].id,'export-t1');
  assert.equal(opened.plans[0].id,'export-p1');
  assert.equal(opened.assets[0].id,'export-a1');
  // A broken file must not alter the active vault.
  await page.evaluate(()=>{mbpPrompt=async()=> 'bad password';mbpConfirm=async()=>true;mbpAlert=async()=>{};});
  await page.locator('#importfile').setInputFiles({name:'corrupt.json',mimeType:'application/json',buffer:Buffer.from('{"invalid":true}')});
  await page.waitForFunction(()=>document.getElementById('importfile').value==='');
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),before.primary);
  // Valid encrypted file with incorrect password is also rejected.
  await page.locator('#importfile').setInputFiles({name:'external.json',mimeType:'application/json',buffer:Buffer.from(exported)});
  await page.waitForFunction(()=>document.getElementById('importfile').value==='');
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),before.primary);
  // Modify the active vault, then restore the downloaded file with the right password.
  await page.evaluate(async()=>{
   data.transactions.push({id:'after-export',type:'income',name:'Temporaire',amount:50,cat:'Revenus',date:'2026-11-16'});
   await save();
   mbpPrompt=async()=> 'V4-external-export-test-2026!';
   mbpConfirm=async()=>true;
  });
  await page.locator('#importfile').setInputFiles({name:'external.json',mimeType:'application/json',buffer:Buffer.from(exported)});
  await page.waitForFunction(()=>document.getElementById('importfile').value==='');
  const restored=await page.evaluate(async password=>{
   const active=await unseal(JSON.parse(localStorage.getItem(KEY)),password);
   return {saved:JSON.stringify(active)===JSON.stringify(data),transactions:active.transactions.map(x=>x.id),
    plans:active.plans.map(x=>x.id),assets:active.assets.map(x=>x.id),
    priorBackupGone:localStorage.getItem(KEY+'-previous-v4')===null};
  },password);
  assert.equal(restored.saved,true);
  assert.deepEqual(restored.transactions,['export-t1']);
  assert.deepEqual(restored.plans,['export-p1']);
  assert.deepEqual(restored.assets,['export-a1']);
  assert.equal(restored.priorBackupGone,true);
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(password);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  assert.deepEqual(await page.evaluate(()=>data.transactions.map(x=>x.id)),['export-t1']);
  assert.deepEqual(errors,[]);
  console.log('V4_EXTERNAL_BACKUP_ROUNDTRIP_PASS '+JSON.stringify({
   actualDownloadedFile:true,noPlaintext:true,wrongPasswordRejected:true,
   malformedRejected:true,restoredEncrypted:true,unlockedAfterReload:true
  }));
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_EXTERNAL_BACKUP_ROUNDTRIP_FAIL '+String(e.stack||e));process.exitCode=1});
