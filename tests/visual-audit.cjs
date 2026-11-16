const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const issues=[],results=[];
 const browserErrors=[];
 for(const width of [320,375,390,430,768]){
  const height=width===768?880:844;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:width<768,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',e=>browserErrors.push(width+': '+e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  if(await page.locator('#setup:not(.hidden)').count()){
   await page.locator('#newpass').fill('Essai-visuel-2026!unique');
   await page.locator('#confpass').fill('Essai-visuel-2026!unique');
   await page.locator('#create').click();
  }
  await page.locator('#app:not(.hidden)').waitFor({timeout:15000});
  await page.evaluate(()=>{
    const month=new Date().toLocaleDateString('sv-SE').slice(0,7);
    data.plans=[
     {id:'f1',name:'Crédit immobilier',cat:'Fixes',amount:938.17},
     {id:'f2',name:'Abonnement transport et assurance habitation',cat:'Fixes',amount:55},
     {id:'v1',name:'Courses alimentaires et produits ménagers',cat:'Variables',amount:320},
     {id:'v2',name:'Repas du midi',cat:'Variables',amount:150},
     {id:'p1',name:'Épargne voyages',cat:'Provisions',amount:700},
     {id:'p2',name:'Festivals et loisirs',cat:'Provisions',amount:150},
     {id:'r1',name:'Salaire net',cat:'Revenus',amount:2600}
    ];
    data.transactions=[
     {id:'t1',type:'expense',name:'Courses alimentaires',amount:72.15,cat:'Variables',planId:'v1',date:month+'-05'},
     {id:'t2',type:'expense',name:'Crédit immobilier',amount:938.17,cat:'Fixes',planId:'f1',date:month+'-05'},
     {id:'t3',type:'income',name:'Salaire',amount:2600,cat:'Revenus',date:month+'-05'},
     {id:'t4',type:'expense',name:'Sortie et restaurant du weekend',amount:48.5,cat:'Variables',date:month+'-06'}
    ];
    data.assets=[
     {id:'a1',name:'Compte courant Crédit Agricole',type:'Livrets',amount:2150,invested:2150},
     {id:'a2',name:'PEA Trade Republic',type:'PEA',amount:20150,invested:20000},
     {id:'a3',name:'Crédit immobilier restant',type:'Autres',amount:0}
    ];
    data.quickLabels=['Essence'];data.v31Shortcuts={...(data.v31Shortcuts||{}),Essence:{type:'expense',visible:true,icon:'fuel'}};
    window.mbpRefreshQuickChoices?.();
  });
  for(const view of ['add','home','transactions','plans','settings','wealth']){
   let error=null;
   try{await page.evaluate(v=>tab(v),view);await page.waitForTimeout(85)}
   catch(e){error=e.message;issues.push({severity:'error',view,width,issue:'Impossible de naviguer',detail:error});continue}
   const report=await page.evaluate(view=>{
    const vw=document.documentElement.clientWidth;
    const rect=el=>{const r=el.getBoundingClientRect();return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),right:+r.right.toFixed(1)}};
    const root=document.getElementById(view);
    const visible=el=>{const r=el.getBoundingClientRect();const st=getComputedStyle(el);return r.width>1&&r.height>1&&st.display!=='none'&&st.visibility!=='hidden'};
    const selectors='button,input,select,textarea,[role="button"],h1,h2,h3,.v32-card,.card,.row,.v24-chip,.v24-switch';
    const outside=[...root.querySelectorAll(selectors)].filter(el=>visible(el)).map(el=>({el,rect:rect(el)})).filter(o=>o.rect.x < -4 || o.rect.right>vw+4).slice(0,15).map(({el,rect})=>({tag:el.tagName,id:el.id||'',className:typeof el.className==='string'?el.className.slice(0,60):'',text:(el.textContent||'').trim().slice(0,45),...rect}));
    const clipped=[...root.querySelectorAll('button, .v24-chip, h2, h3, label, strong, b')].filter(el=>visible(el)).filter(el=>el.scrollWidth>el.clientWidth+4&&['hidden','clip'].includes(getComputedStyle(el).overflowX)).slice(0,12).map(el=>({tag:el.tagName,id:el.id||'',text:(el.textContent||'').trim().slice(0,65),scroll:el.scrollWidth,client:el.clientWidth}));
    const tooSmall=[...root.querySelectorAll('button')].filter(el=>visible(el)).filter(el=>{const b=el.getBoundingClientRect();return b.width<35||b.height<34}).slice(0,12).map(el=>({id:el.id||'',text:(el.textContent||'').trim().slice(0,30),...rect(el)}));
    const nav=document.getElementById('nav'),navRect=nav?rect(nav):null;
    return {view,viewport:vw,documentWidth:document.documentElement.scrollWidth,root:rect(root),outside,clipped,tooSmall,nav:navRect};
   },view);
   results.push({width,...report});
   if(report.documentWidth>width+3)issues.push({severity:'error',view,width,issue:'Débordement horizontal document',actual:report.documentWidth});
   if(report.outside.length)issues.push({severity:'warning',view,width,issue:'Éléments hors viewport',examples:report.outside});
   if(report.clipped.length)issues.push({severity:'warning',view,width,issue:'Texte coupé',examples:report.clipped});
   if(report.tooSmall.length)issues.push({severity:'info',view,width,issue:'Cibles tactiles de petite taille',examples:report.tooSmall});
  }
  for(const selector of ['#txdialog','#plandialog','#assetdialog','#recurringdialog','#mbp37transferdialog','#v32taskdialog']){
   const info=await page.evaluate(sel=>{
    const d=document.querySelector(sel);if(!d)return null;
    if(d.open)return null;
    try{d.showModal()}catch(e){return {error:e.message}}
    const r=d.getBoundingClientRect(),vw=window.innerWidth,vh=window.innerHeight;
    const o={left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,viewport:vw,vheight:vh,scrollHeight:d.scrollHeight,clientHeight:d.clientHeight};
    d.close();return o;
   },selector);
   if(info&&(info.error||info.left< -4||info.right>width+4||info.bottom>height+4||info.top< -4))issues.push({severity:'warning',view:selector,width,issue:'Fenêtre sort de l’écran',info});
  }
  await context.close();
 }
 console.log('AUDIT_VISUEL_RESULTATS '+JSON.stringify(results));
 console.log('AUDIT_VISUEL_ANOMALIES '+JSON.stringify(issues));
 console.log('AUDIT_VISUEL_ERRORS '+JSON.stringify(browserErrors));
 const small=issues.filter(x=>x.issue==='Cibles tactiles de petite taille');
 assert.deepEqual(small,[],'Cibles tactiles restantes trop petites : '+JSON.stringify(small));
 assert.deepEqual(browserErrors,[],'Erreurs JS durant audit');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
