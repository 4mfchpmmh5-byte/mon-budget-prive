const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const password='V4-operation-flow-2026!';
  await page.locator('#newpass').fill(password);
  await page.locator('#confpass').fill(password);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  await page.evaluate(async()=>{
    selectedMonth=new Date().toLocaleDateString('sv-SE').slice(0,7);
    data.transactions=[{id:'edit-flow',type:'expense',name:'Courses du mois',amount:42.15,cat:'Variables',date:selectedMonth+'-06'}];
    await save();render();
  });
  await page.locator('#v32recent [data-mb35tx="edit-flow"]').click();
  await page.locator('#txdialog[open]').waitFor();
  assert.equal(await page.locator('#txname').inputValue(),'Courses du mois');
  assert.equal(await page.locator('#txamount').inputValue(),'42.15');
  assert.equal(await page.locator('#txdialog h2').innerText(),'Modifier une opération');
  assert.equal(await page.locator('#mb35txsheet[open]').count(),0,'Redundant action sheet must remain closed');
  const del=page.locator('#txdialog .v36-delete-tx');
  assert(await del.isVisible(),'Delete action missing from editor');
  await page.evaluate(()=>{mbpConfirm=async()=>false});
  await del.click();
  assert.equal(await page.evaluate(()=>data.transactions.length),1,'Cancel must retain transaction');
  assert.equal(await page.locator('#txdialog[open]').count(),1);
  await page.evaluate(()=>{
    const proto=Object.getPrototypeOf(localStorage),native=proto.setItem;
    window.__v4OriginalSetItem=native;
    proto.setItem=function(k,v){if(k===KEY)throw new DOMException('Storage full','QuotaExceededError');return native.call(this,k,v)};
    mbpConfirm=async()=>true;
  });
  await del.click();
  await page.waitForFunction(()=>document.querySelector('#msg')?.textContent?.includes('Suppression impossible'));
  assert.equal(await page.evaluate(()=>data.transactions.length),1,'Failed encrypted write must roll back deletion');
  await page.evaluate(()=>{Object.getPrototypeOf(localStorage).setItem=window.__v4OriginalSetItem});
  await del.click();
  await page.waitForFunction(()=>data.transactions.length===0);
  await page.waitForFunction(()=>!document.querySelector('#txdialog')?.open);
  assert.equal(await page.locator('#txdialog[open]').count(),0,'Editor must close after successful deletion');
  const persisted=await page.evaluate(async password=>{
    const restored=await unseal(JSON.parse(localStorage.getItem(KEY)),password);
    return restored.transactions.length;
  },password);
  assert.equal(persisted,0);
  assert.deepEqual(errors,[]);
  console.log('V4_OPERATION_EDITOR_PASS '+JSON.stringify({openedDirectly:true,deleteCancelSafe:true,failedWriteRollback:true,encryptedDeleteVerified:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_OPERATION_EDITOR_FAIL '+String(e.stack||e));process.exitCode=1});
