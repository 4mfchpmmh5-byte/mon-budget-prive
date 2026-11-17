const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const initial=await page.evaluate(()=>{
    const create=document.getElementById('create');
    const info=document.querySelector('#setup .notice');
    const footer=document.querySelector('.v32-lock-footer');
    return {button:getComputedStyle(create).backgroundImage,notice:getComputedStyle(info).backgroundImage,footer:footer?.textContent||''};
  });
  assert.match(initial.button,/linear-gradient/);
  assert.match(initial.footer,/V4 Bêta 2/);
  assert(!/v3\.7/i.test(initial.footer));
  await page.locator('#newpass').fill('V4-beta2-polish-check!');
  await page.locator('#confpass').fill('V4-beta2-polish-check!');
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  await page.evaluate(async()=>{
   selectedMonth=new Date().toLocaleDateString('sv-SE').slice(0,7);
   data.transactions=[{id:'b2-context',name:'Courses test',type:'expense',cat:'Variables',amount:15.9,date:selectedMonth+'-06'}];
   await save();render();
  });
  const task=page.locator('#v32tasks .v33-status:not(.done)').first();
  if(await task.count()){
   const bg=await task.evaluate(e=>getComputedStyle(e).backgroundColor);
   assert.equal(bg,'rgb(39, 58, 80)','Pending task badge must be navy, not violet');
  }
  await page.locator('#v32recent [data-mb35tx="b2-context"]').click();
  await page.locator('#txdialog[open]').waitFor();
  // Exercise the actual confirmation, including cancel.
  const del=page.locator('#txdialog .v36-delete-tx');
  assert(await del.isVisible());
  await del.click();
  await page.locator('#mbp-ui-dialog[open]').waitFor();
  const modal=await page.evaluate(()=>{
   const dialog=document.getElementById('mbp-ui-dialog');
   const confirm=dialog.querySelector('[data-act="accept"]');
   return {text:dialog.textContent,classes:[...confirm.classList],background:getComputedStyle(confirm).backgroundColor};
  });
  assert.match(modal.text,/Courses test/);
  assert.match(modal.text,/15,90/);
  assert(modal.classes.includes('mbpu-destructive'));
  assert.equal(modal.background,'rgb(139, 51, 67)','Destructive modal button must be red');
  await page.locator('#mbp-ui-dialog [data-act="cancel"]').click();
  assert.equal(await page.evaluate(()=>data.transactions.length),1);
  assert.deepEqual(errors,[]);
  console.log('V4_BETA2_POLISH_PASS '+JSON.stringify({footer:true,contextualDelete:true,redDelete:true,pendingBadgeNavy:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_BETA2_POLISH_FAIL '+String(e.stack||e));process.exitCode=1});
