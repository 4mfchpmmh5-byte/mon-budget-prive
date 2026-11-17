const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const reports=[],problems=[],errors=[];
 const pw='V4-complete-visual-review-2026!';
 try{
 for(const [width,height] of [[320,700],[375,812],[390,844],[430,932],[768,900]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:width<768,hasTouch:width<768});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(width+':'+e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const login=await page.evaluate(()=>{
   const names=['#setup','#setup #create','#setup .notice','#setup input'];
   return names.map(selector=>{const e=document.querySelector(selector),c=getComputedStyle(e);return {selector,bg:c.backgroundColor,border:c.borderTopColor,weight:c.fontWeight,font:c.fontSize}});});
  await page.locator('#newpass').fill(pw);await page.locator('#confpass').fill(pw);await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  await page.evaluate(async()=>{
   const m=new Date().toLocaleDateString('sv-SE').slice(0,7);
   data.plans=[{id:'fixe',name:'Loyer',cat:'Fixes',amount:900},{id:'courses',name:'Courses',cat:'Variables',amount:300},{id:'vac',name:'Vacances',cat:'Provisions',amount:500}];
   data.transactions=[{id:'tx-audit',name:'Courses test',type:'expense',cat:'Variables',amount:15.9,planId:'courses',date:m+'-05'}];
   data.assets=[{id:'asset-audit',name:'Compte courant',type:'Livrets',amount:2200,invested:2200}];
   await save();render();
  });
  const viewStates=[];
  for(const [name,id] of [['Accueil','add'],['Synthèse','home'],['Profil','v30profile'],['Patrimoine','wealth']]){
   await page.evaluate(id=>tab(id),id);await page.waitForTimeout(100);
   const state=await page.evaluate(({name,id})=>{
    const root=document.getElementById(id),vw=innerWidth;
    const rect=e=>{const r=e.getBoundingClientRect();return {left:+r.left.toFixed(1),right:+r.right.toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1)}};
    const visible=e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>1&&r.height>1&&c.visibility!=='hidden'&&c.display!=='none'&&c.opacity!=='0'};
    const nodes=[...root.querySelectorAll('button, h1, h2, h3, label, input, select, textarea, .card, .v32-card, .v36-goal, .v33-status, .v30-subnav button, strong, b')].filter(visible);
    const outside=nodes.filter(e=>{const r=e.getBoundingClientRect();return r.left< -4||r.right>vw+4}).slice(0,8).map(e=>({tag:e.tagName,id:e.id,text:(e.textContent||'').trim().slice(0,36),rect:rect(e)}));
    const clipped=nodes.filter(e=>e.scrollWidth>e.clientWidth+5&&['hidden','clip'].includes(getComputedStyle(e).overflowX)).slice(0,8).map(e=>({id:e.id,text:(e.textContent||'').trim().slice(0,30)}));
    const tiny=[...root.querySelectorAll('button')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.width<35||r.height<34}).slice(0,8).map(e=>({id:e.id,text:(e.textContent||'').trim().slice(0,30),rect:rect(e)}));
    const oddWeight=nodes.filter(e=>e.matches('button,h2,h3,strong,b')).filter(e=>+getComputedStyle(e).fontWeight>=900).slice(0,12).map(e=>({id:e.id,text:(e.textContent||'').trim().slice(0,30),weight:getComputedStyle(e).fontWeight}));
    const purple=nodes.filter(e=>{const c=getComputedStyle(e),v=[c.color,c.backgroundColor,c.borderTopColor];return v.some(z=>{const p=z.match(/\d+/g);if(!p||p.length<3)return false;const [r,g,b]=p.map(Number);return b>r*1.18&&r>g*1.13&&b>g*1.3&&r>60})}).slice(0,12).map(e=>({id:e.id,className:String(e.className).slice(0,38),text:(e.textContent||'').trim().slice(0,30),background:getComputedStyle(e).backgroundColor}));
    const nav=[...document.querySelectorAll('#nav button')].filter(visible).map(e=>({name:(e.textContent||'').trim().replace(/\s+/g,' '),active:e.classList.contains('active'),color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderTopColor}));
    const header=root.querySelector('h1,h2');
    return {name,id,width:vw,scrollWidth:document.documentElement.scrollWidth,
      heading:header?.textContent?.trim(),outside,clipped,tiny,oddWeight,purple,nav,
      counts:{buttons:root.querySelectorAll('button').length,inputs:root.querySelectorAll('input').length,cards:root.querySelectorAll('.card,.v32-card').length}
    };
   },{name,id});
   viewStates.push(state);
   if(state.scrollWidth>width+4)problems.push({type:'horizontal-page-overflow',width,name,amount:state.scrollWidth-width});
   if(state.outside.length)problems.push({type:'outside',width,name,items:state.outside});
   if(state.clipped.length)problems.push({type:'clipped',width,name,items:state.clipped});
   if(state.purple.length)problems.push({type:'purple',width,name,items:state.purple});
  }
  await page.locator('#nav button[data-tab="v30profile"]').click();
  const profile=[];
  for(const id of ['v30finance','v30security']){
   await page.locator('#'+id).click();
   const x=await page.locator('#'+id).evaluate(e=>({label:e.textContent.trim(),active:e.classList.contains('active'),bg:getComputedStyle(e).backgroundImage,color:getComputedStyle(e).color,border:getComputedStyle(e).borderTopColor}));
   profile.push({id,...x});
  }
  const dialogs=[];
  for(const id of ['txdialog','plandialog','assetdialog','recurringdialog','v32taskdialog','mbpV4ContributionDialog','mbp37transferdialog','mbp-ui-dialog']){
   const state=await page.evaluate(async id=>{
    const d=document.getElementById(id);
    if(!d)return {id,missing:true};
    if(d.open)d.close();d.showModal();await new Promise(resolve=>requestAnimationFrame(resolve));
    const cs=getComputedStyle(d),r=d.getBoundingClientRect();
    const buttons=[...d.querySelectorAll('button')].filter(e=>{const x=e.getBoundingClientRect();return x.width>1&&x.height>1});
    const controls=buttons.slice(0,8).map(e=>({text:e.textContent.trim().slice(0,30),weight:getComputedStyle(e).fontWeight,bg:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderTopColor}));
    const info={id,border:cs.borderTopColor,borderWidth:cs.borderTopWidth,outline:cs.outlineStyle,shadow:cs.boxShadow,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},buttons:controls,scrollable:d.scrollHeight>d.clientHeight+3,horizontalOverflow:d.scrollWidth>d.clientWidth+4};
    d.close();return info;
   },id);
   dialogs.push(state);
   if(!state.missing&&(state.rect.left< -5||state.rect.right>width+5||state.rect.top< -5||state.rect.bottom>height+5||state.horizontalOverflow))problems.push({type:'dialog-geometry',width,info:state});
  }
  reports.push({width,login,viewStates,profile,dialogs});
  await context.close();
 }
 const simplified=reports.map(r=>({width:r.width,views:r.viewStates.map(v=>({name:v.name,heading:v.heading,counts:v.counts,tiny:v.tiny.length,purple:v.purple,oddWeight:v.oddWeight,nav:v.nav})),profile:r.profile,dialogs:r.dialogs.map(d=>({id:d.id,outline:d.outline,borderWidth:d.borderWidth,scrollable:d.scrollable,geometry:d.rect})),confirmation:r.confirmation}));
 console.log('V4_FULL_UI_AUDIT_SUMMARY '+JSON.stringify(simplified));
 console.log('V4_FULL_UI_AUDIT_FINDINGS '+JSON.stringify(problems));
 console.log('V4_FULL_UI_AUDIT_JS_ERRORS '+JSON.stringify(errors));
 assert.deepEqual(errors,[]);
 console.log('V4_FULL_UI_AUDIT_PASS '+JSON.stringify({viewports:5,mainTabs:4,profileSubmenus:2,dialogs:8,findings:problems.length}));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_FULL_UI_AUDIT_FAIL '+String(e.stack||e));process.exitCode=1});
