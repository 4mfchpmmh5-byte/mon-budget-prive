const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const pw='V4-dialog-geometry-2026!';
  await page.locator('#newpass').fill(pw);
  await page.locator('#confpass').fill(pw);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const report=[];
  for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[768,880]]){
   await page.setViewportSize({width,height});
   await page.waitForTimeout(70);
   for(const selector of ['#txdialog','#plandialog','#assetdialog','#recurringdialog','#v32taskdialog','#mbpV4ContributionDialog','#mbp37transferdialog']){
    const metrics=await page.evaluate(async selector=>{
     const d=document.querySelector(selector);if(!d)return {skipped:true};
     if(d.open)d.close();
     window.scrollTo(0,document.body.scrollHeight);
     d.showModal();
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     const r=d.getBoundingClientRect(),v=window.visualViewport;
     const top=v?.offsetTop||0,visualHeight=v?.height||innerHeight;
     const field=d.querySelector('input[type=number],input[inputmode=decimal],input[type=text]');
     if(field){
      field.focus({preventScroll:true});
      await new Promise(resolve=>requestAnimationFrame(resolve));
     }
     const r2=d.getBoundingClientRect();
     const result={left:r2.left,right:r2.right,top:r2.top,bottom:r2.bottom,
      viewportWidth:innerWidth,visibleTop:top,visibleBottom:top+visualHeight,
      scrollable:d.scrollHeight>d.clientHeight+1,focusedField:!!field,
      horizontalOverflow:d.scrollWidth>d.clientWidth+4};
     d.close();return result;
    },selector);
    if(metrics.skipped)continue;
    const tolerance=5;
    assert(metrics.left>=-tolerance&&metrics.right<=width+tolerance,'Modal horizontal overflow '+selector+' '+width+': '+JSON.stringify(metrics));
    assert(metrics.top>=metrics.visibleTop-tolerance&&metrics.bottom<=metrics.visibleBottom+tolerance,'Modal vertical overflow '+selector+' '+width+'x'+height+': '+JSON.stringify(metrics));
    assert(!metrics.horizontalOverflow,'Modal content overflow '+selector+' '+width);
    report.push({selector,width,height,scrollable:metrics.scrollable});
   }
  }
  assert.deepEqual(errors,[]);
  console.log('V4_DIALOG_GEOMETRY_PASS '+JSON.stringify({scenarios:report.length,sizes:5,dialogs:7}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_DIALOG_GEOMETRY_FAIL '+String(e.stack||e));process.exitCode=1});
