const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert(html.includes("const text2='Mon Budget Privé · v3.7 bêta 8'"));
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
  await page.locator('#v24cats [data-v24cat="courses"]').click();
  assert.equal(await page.locator('#v24cats [data-v24cat="courses"] .mbp375-icon svg').count(),1);
  await page.locator('#v24income').click();
  await page.locator('#v24cats [data-v24cat="remboursement"]').waitFor();
  const label=await page.locator('#v24cats [data-v24cat="remboursement"]').innerText();
  assert(label.includes('Rembours.'));
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
      const p1={id:'p1',name:'EDF',cat:'Fixes',amount:50};
      const p2={id:'p2',name:'EDF',cat:'Fixes',amount:50};
      data={...data,plans:[p1,p2],recurring:[],transactions:[{id:'t',type:'expense',name:'EDF',cat:'Fixes',amount:50,date:'2027-01-10'}]};
      const initiallyPaid=paymentItems().filter(x=>x.match).length;
      data.transactions[0].planId='p1';
      const afterPaid=paymentItems().filter(x=>x.match).map(x=>x.p.id);
      return {december,january,initiallyPaid,afterPaid};
    }finally{data=originalData;selectedMonth=originalMonth}
  });
  assert.deepEqual(finance.december,[{name:'Crédit immobilier',amount:1200},{name:'Impôt',amount:1576}]);
  assert.deepEqual(finance.january,[{name:'Crédit immobilier',amount:1200},{name:'Impôt',amount:1576}]);
  assert.equal(finance.initiallyPaid,0);
  assert.deepEqual(finance.afterPaid,['p1']);
  console.log('Tests financiers OK — prévisions futures intactes, rapprochement par identifiant et homonymes distincts.');
  assert.deepEqual(errors,[],'Browser errors: '+errors.join('; '));
  console.log('Smoke test navigateur mobile OK — création, déverrouillage, sélection, icônes, pied de page et débordement.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
