const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const pw='V4-navigation-state-2026!';
  await page.locator('#newpass').fill(pw);
  await page.locator('#confpass').fill(pw);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  assert.equal(await page.locator('#nav').getAttribute('aria-label'),'Navigation principale');
  const ids=['add','home','v30profile','wealth'];
  for(const id of ids){
   await page.locator('#nav button[data-tab="'+id+'"]').click();
   await page.waitForFunction(id=>{
    const buttons=[...document.querySelectorAll('#nav button[data-tab]')];
    return buttons.filter(x=>x.getAttribute('aria-current')==='page').length===1
     &&buttons.find(x=>x.getAttribute('aria-current')==='page')?.dataset.tab===id;
   },id);
   const state=await page.evaluate(id=>{
    const active=[...document.querySelectorAll('#nav button.active')].map(x=>x.dataset.tab);
    const button=document.querySelector('#nav button[data-tab="'+id+'"]');
    const computed=getComputedStyle(button);
    return {active,hidden:document.getElementById(id).classList.contains('hidden'),
      label:button.getAttribute('aria-label'),bg:computed.backgroundColor,border:computed.borderTopColor};
   },id);
   assert.deepEqual(state.active,[id]);
   assert.equal(state.hidden,false);
   assert(state.label.length>0);
   assert.notEqual(state.bg,'rgba(0, 0, 0, 0)','Active tab needs visible ice background');
  }
  await page.locator('#nav button[data-tab="v30profile"]').click();
  await page.locator('#v30security').click();
  await page.waitForFunction(()=>document.getElementById('v30security').getAttribute('aria-pressed')==='true');
  assert.equal(await page.locator('#v30finance').getAttribute('aria-pressed'),'false');
  await page.locator('#v30finance').click();
  await page.waitForFunction(()=>document.getElementById('v30finance').getAttribute('aria-pressed')==='true');
  assert.equal(await page.locator('#v30security').getAttribute('aria-pressed'),'false');
  assert.deepEqual(errors,[]);
  console.log('V4_NAVIGATION_STATE_PASS '+JSON.stringify({tabs:4,profileSubtabs:2,exclusiveCurrentPage:true,iceSelection:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_NAVIGATION_STATE_FAIL '+String(e.stack||e));process.exitCode=1});
