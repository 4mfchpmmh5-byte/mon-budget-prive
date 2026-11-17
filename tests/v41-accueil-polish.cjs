const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];
 try{
  for(const width of [320,375,390,430,768]){
   const page=await browser.newPage({viewport:{width,height:width===320?700:844},isMobile:width<768,hasTouch:width<768});
   page.on('pageerror',e=>errors.push(width+': '+e.message));
   await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
   await page.locator('#setup:not(.hidden)').waitFor();
   const pw='V41-home-test-safe-2026!';
   await page.locator('#newpass').fill(pw);
   await page.locator('#confpass').fill(pw);
   await page.locator('#create').click();
   await page.locator('#app:not(.hidden)').waitFor();
   await page.evaluate(async()=>{
    data.plans.push({id:'vac-test',cat:'Provisions',name:'Voyages test',amount:100});
    data.transactions.push({id:'tx-accueil-test',type:'expense',name:'Courses test',cat:'Variables',amount:15.9,date:new Date().toLocaleDateString('sv-SE')});
    await save();render();
   });
   const result=await page.evaluate(()=>{
    const ids=['v24quick','v32tasks','v32recent'];
    const cards=ids.map(id=>{
     const e=document.getElementById(id),cs=getComputedStyle(e),r=e.getBoundingClientRect();
     const h=e.querySelector('h2'),hc=h?getComputedStyle(h):null;
     return {id,border:cs.borderTopColor,radius:cs.borderTopLeftRadius,
       padding:cs.paddingTop,headingWeight:hc?.fontWeight||null,
       headingSize:hc?.fontSize||null,left:r.left,right:r.right,width:r.width};
    });
    return {cards,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      recentCount:document.querySelectorAll('#v32recent [data-mb35tx]').length,
      nav:[...document.querySelectorAll('#nav button.active')].map(el=>el.dataset.tab),
      key:KEY,styles:!!document.querySelector('#mbp-v41-home-polish')};
   });
   assert(result.styles,'v4.1 style missing');
   assert.equal(result.key,'mbp-encrypted-v1','V4.1 must keep production vault key');
   assert.equal(result.documentWidth<=width+4,true,'Horizontal overflow: '+JSON.stringify(result));
   assert.deepEqual(new Set(result.cards.map(c=>c.radius)),new Set(['20px']),'Cards need consistent radii: '+JSON.stringify(result.cards));
   assert(result.cards.every(c=>+c.headingWeight>=700),'Headings need consistent weight: '+JSON.stringify(result.cards));
   assert(result.cards.every(c=>c.left>=-4&&c.right<=width+4),'Card overflows viewport: '+JSON.stringify(result.cards));
   assert(result.recentCount>=1,'Recent operations disappeared');
   assert.deepEqual(result.nav,['add'],'Accueil must stay active');
   const seeAll=page.locator('#v32recent .mbp-v41-view-all');
   await seeAll.waitFor({state:'visible'});
   assert.equal(await seeAll.count(),1,'One Tout voir action only');
   assert.equal(await seeAll.getAttribute('aria-label'),'Voir toutes les opérations dans la Synthèse');
   await page.evaluate(()=>render());
   assert.equal(await seeAll.count(),1,'No duplicate action after rerender');
   await seeAll.click();
   assert.equal(await page.locator('#home:not(.hidden)').count(),1,'Tout voir must navigate to Synthèse');
   assert.equal(await page.locator('#nav button[data-tab="home"].active').count(),1);
   const after=await page.evaluate(()=>({total:data.transactions.length,old:data.transactions[0]?.id,key:KEY}));
   assert.equal(after.total,1,'Viewing history never changes transactions');
   assert.equal(after.old,'tx-accueil-test');
   assert.equal(after.key,'mbp-encrypted-v1');
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('V41_ACCUEIL_POLISH_PASS '+JSON.stringify({viewports:5,sections:3,seeAllNavigation:true,sourceDataUntouched:true,productionVaultKeyPreserved:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V41_ACCUEIL_POLISH_FAIL '+String(e.stack||e));process.exitCode=1});
