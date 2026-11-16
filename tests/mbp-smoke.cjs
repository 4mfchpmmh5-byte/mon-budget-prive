const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert(html.includes("const text2='Mon Budget Privé · v3.7 bêta 9'"));
  assert(!html.includes('p.amount=938.17'));
  assert(html.includes('planId:p.id'));
  assert(html.includes('day=Math.max(1,Math.min(daysInMonth'));
  assert(html.includes('const previousPayload=localStorage.getItem(KEY)'));
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  for(const [i,script] of scripts.entries()){
    if(script[1].trim())new vm.Script(script[1],{filename:'inline-script-'+i+'.js'});
  }
  console.log('Syntaxe valide de '+scripts.length+' blocs JavaScript');

  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push('HTTP '+response.status()+' '+response.url())});
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor({timeout:12000});
  const pass='Essai-test-2026!uniquement';
  await page.locator('#newpass').fill(pass);
  await page.locator('#confpass').fill(pass);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor({timeout:15000});
  // Les icônes ne doivent jamais être recréées ou modifiées lors de la sélection.
  await page.locator('#v24cats [data-v24cat="courses"] svg').waitFor();
  const iconBefore=await page.locator('#v24cats [data-v24cat="courses"] svg').evaluate(el=>({markup:el.outerHTML,stroke:getComputedStyle(el).strokeWidth}));
  await page.locator('#v24cats [data-v24cat="courses"]').click();
  const iconAfter=await page.locator('#v24cats [data-v24cat="courses"] svg').evaluate(el=>({markup:el.outerHTML,stroke:getComputedStyle(el).strokeWidth}));
  assert.deepEqual(iconAfter,iconBefore,'SVG Courses différent après sélection');
  const identity=await page.locator('#v24cats [data-v24cat="courses"]').evaluate(async el=>{
    const original=el.querySelector('svg');
    el.click();
    await new Promise(resolve=>setTimeout(resolve,50));
    return original===el.querySelector('svg');
  });
  assert(identity,'SVG remplacé au second clic');
  // Une catégorie personnalisée doit avoir son nom exact dans le budget contextuel.
  await page.evaluate(()=>{
    data.quickLabels=['Essence'];
    data.v31Shortcuts={...(data.v31Shortcuts||{}),Essence:{type:'expense',visible:true,icon:'fuel'}};
    window.mbpRefreshQuickChoices();
  });
  await page.locator('#v24cats [data-v24cat="custom:Essence"] svg').waitFor();
  const essenceSvgBefore=await page.locator('#v24cats [data-v24cat="custom:Essence"] svg').evaluate(el=>el.outerHTML);
  await page.locator('#v24cats [data-v24cat="custom:Essence"]').click();
  assert.equal(await page.locator('#v264catlabel').innerText(),'Essence');
  assert.equal(await page.locator('#v24cats [data-v24cat="custom:Essence"] svg').evaluate(el=>el.outerHTML),essenceSvgBefore);
  await page.waitForTimeout(120);
  assert.equal(await page.locator('#v24cats [data-v24cat="custom:Essence"] svg').evaluate(el=>el.outerHTML),essenceSvgBefore,'L’icône Essence change après la stabilisation DOM');
  await page.locator('#v24income').click();
  await page.locator('#v24expense').click();
  await page.locator('#v24cats [data-v24cat="courses"] svg').waitFor();
  const svgUnselected=await page.locator('#v24cats [data-v24cat="courses"] svg').evaluate(el=>el.outerHTML);
  await page.locator('#v24cats [data-v24cat="courses"]').click();
  await page.waitForTimeout(120);
  assert.equal(await page.locator('#v24cats [data-v24cat="courses"] svg').evaluate(el=>el.outerHTML),svgUnselected,'Courses change de dessin après changement de type');
  const allExpense=await page.locator('#v24cats button[data-v24cat]').count();
  assert(allExpense>=10,'Catégories dépenses manquantes');
  await page.locator('#v24cats [data-v24cat="courses"]').click();
  assert.equal(await page.locator('#v24cats [data-v24cat="courses"] .mbp375-icon svg').count(),1);
  await page.locator('#v24income').click();
  await page.locator('#v24cats [data-v24cat="remboursement"]').waitFor();
  const label=await page.locator('#v24cats [data-v24cat="remboursement"]').innerText();
  assert(label.includes('Rembours.'));
  // Sur un téléphone, les quatre écrans et les boutons doivent rester dans le viewport.
  for(const width of [320,375,390,430]){
    await page.setViewportSize({width,height:844});
    for(const view of ['add','home','settings','wealth']){
      await page.evaluate(view=>tab(view),view);
      await page.waitForTimeout(35);
      const metrics=await page.evaluate(()=>({
        viewport:document.documentElement.clientWidth,
        document:document.documentElement.scrollWidth,
        body:document.body.scrollWidth,
        selectedView:[...document.querySelectorAll('.view')].filter(x=>!x.classList.contains('hidden')).map(x=>x.id)
      }));
      assert(metrics.document<=metrics.viewport+3,'Débordement horizontal écran '+view+' à '+width+'px : '+JSON.stringify(metrics));
    }
    for(const selector of ['#txdialog','#assetdialog','#recurringdialog']){
      const geo=await page.evaluate(selector=>{
        const d=document.querySelector(selector);
        if(!d)return null;
        d.showModal();
        const rect=d.getBoundingClientRect(),v=window.innerWidth;
        const out={left:rect.left,right:rect.right,viewport:v,height:rect.height};
        d.close();
        return out;
      },selector);
      if(geo)assert(geo.left>=-3&&geo.right<=geo.viewport+3,'Dialog déborde à '+width+'px : '+selector+' '+JSON.stringify(geo));
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>tab('add'));
  console.log('UI audit OK — SVG stable au toucher, catégorie personnalisée, 4 écrans et largeurs 320–430px.');
  await page.reload({waitUntil:'load'});
  await page.locator('#unlock:not(.hidden)').waitFor({timeout:15000});
  await page.locator('#pass').fill(pass);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor({timeout:15000});
  assert.equal(await page.locator('.v32-lock-footer').isVisible(),false);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=2,'Horizontal overflow: '+overflow);
  const finance=await page.evaluate(()=>{
    const originalData=data,originalMonth=selectedMonth;
    try{
      const credit={id:'credit',name:'Crédit immobilier',cat:'Fixes',amount:1200};
      const tax={id:'tax',name:'Impôt',cat:'Impôts',amount:1576};
      data={...data,plans:[credit,tax],monthBudgets:{},recurring:[],transactions:[]};
      selectedMonth='2026-12';
      const december=monthPlans().map(x=>({name:x.name,amount:x.amount}));
      selectedMonth='2027-01';
      const january=monthPlans().map(x=>({name:x.name,amount:x.amount}));
      data.monthBudgets={'2027-01':[credit,tax]};
      const januaryExplicit=monthPlans().map(x=>({name:x.name,amount:x.amount}));
      const p1={id:'p1',name:'EDF',cat:'Fixes',amount:50};
      const p2={id:'p2',name:'EDF',cat:'Fixes',amount:50};
      data={...data,plans:[p1,p2],monthBudgets:{},recurring:[],transactions:[{id:'t',type:'expense',name:'EDF',cat:'Fixes',amount:50,date:'2027-01-10'}]};
      const initiallyPaid=paymentItems().filter(x=>x.match).length;
      data.transactions[0].planId='p1';
      const afterPaid=paymentItems().filter(x=>x.match).map(x=>x.p.id);
      return {december,january,januaryExplicit,initiallyPaid,afterPaid};
    }finally{data=originalData;selectedMonth=originalMonth}
  });
  assert.deepEqual(finance.december,[{name:'Crédit immobilier',amount:1200},{name:'Impôt',amount:1576}]);
  assert(finance.january.some(x=>x.name==='Salaire prévisionnel · 2027'));
  assert(finance.january.some(x=>x.name==='Impôt prévisionnel · 2027'));
  console.log('Diagnostic des prévisions 2027 : '+JSON.stringify(finance));
  assert.deepEqual(finance.januaryExplicit,[{name:'Crédit immobilier',amount:1200},{name:'Impôt',amount:1576}]);
  assert.equal(finance.initiallyPaid,0);
  assert.deepEqual(finance.afterPaid,['p1']);
  console.log('Tests financiers OK — prévisions futures intactes, rapprochement par identifiant et homonymes distincts.');
  assert.deepEqual(errors,[],'Browser errors: '+errors.join('; '));
  console.log('Smoke test navigateur mobile OK — création, déverrouillage, sélection, icônes, pied de page et débordement.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
