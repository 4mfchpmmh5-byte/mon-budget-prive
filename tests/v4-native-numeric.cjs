const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const password='V4-native-numeric-2026!';
  await page.locator('#newpass').fill(password);
  await page.locator('#confpass').fill(password);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  // A regular transaction amount must remain a native numeric field.
  await page.evaluate(()=>openTx('expense','Essence','Variables'));
  await page.locator('#txdialog[open]').waitFor();
  const txAmount=page.locator('#txamount');
  await txAmount.click();
  const tx=await txAmount.evaluate(el=>({type:el.type,inputMode:el.inputMode,font:parseFloat(getComputedStyle(el).fontSize),focused:document.activeElement===el,customDialog:document.querySelector('#mbp-ui-dialog')?.open||false}));
  assert.deepEqual(tx,{type:'number',inputMode:'decimal',font:16,focused:true,customDialog:false});
  await page.evaluate(()=>document.getElementById('txdialog').close());
  // Contribution uses one sheet for both amount and date; never stacks a second keypad.
  await page.evaluate(()=>{
   const p={id:'goal-p',goalId:'goal:goal-p',name:'Vacances',cat:'Provisions',amount:150};
   data.plans=[p];selectedMonth='2026-11';mbpV4OpenContribution(p);
  });
  await page.locator('#mbpV4ContributionDialog[open]').waitFor();
  const amount=page.locator('#mbpV4ContributionAmount');
  await amount.click();
  const contribution=await page.evaluate(()=>{
   const amount=document.querySelector('#mbpV4ContributionAmount');
   const d=document.querySelector('#mbpV4ContributionDialog');
   const r=d.getBoundingClientRect();
   return {
    native:amount.type==='number'&&amount.inputMode==='decimal'&&document.activeElement===amount,
    font:parseFloat(getComputedStyle(amount).fontSize),
    dateIncluded:!!d.querySelector('input[type="date"]'),
    exactlyOneDialog:[...document.querySelectorAll('dialog[open]')].length===1,
    customDialogOpen:!!document.querySelector('#mbp-ui-dialog')?.open,
    fitsViewport:r.left>=-2&&r.right<=innerWidth+2&&r.top>=-2&&r.bottom<=innerHeight+2
   };
  });
  assert.equal(contribution.native,true);
  assert(contribution.font>=16);
  assert.equal(contribution.dateIncluded,true);
  assert.equal(contribution.exactlyOneDialog,true);
  assert.equal(contribution.customDialogOpen,false);
  assert.equal(contribution.fitsViewport,true);
  await page.locator('#mbpV4ContributionCancel').click();
  await page.waitForFunction(()=>!document.querySelector('#mbpV4ContributionDialog').open);
  assert.deepEqual(errors,[]);
  console.log('V4_NATIVE_NUMERIC_PASS '+JSON.stringify({transaction:tx,contribution}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_NATIVE_NUMERIC_FAIL '+String(e.stack||e));process.exitCode=1});
