const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({
  viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const v4Password='Migration-test-V4-2026!';
 const legacyPassword='Migration-test-V37-2026!';
 const date='2026-11-17';
 const fixture={
  version:1,
  plans:[
   {id:'salary',name:'Salaire',cat:'Revenus',amount:2500},
   {id:'rent',name:'Logement',cat:'Fixes',amount:950},
   {id:'food',name:'Courses',cat:'Variables',amount:320},
   {id:'travel',name:'Vacances',cat:'Provisions',amount:350},
   {id:'invest',name:'PEA',cat:'Investissements',amount:700}
  ],
  monthBudgets:{
   '2026-12':[
    {id:'salary-dec',name:'Salaire',cat:'Revenus',amount:2600},
    {id:'rent-dec',name:'Logement',cat:'Fixes',amount:950},
    {id:'travel-dec',name:'Vacances',cat:'Provisions',amount:350},
    {id:'invest-dec',name:'PEA',cat:'Investissements',amount:700}
   ]
  },
  transactions:[
   {id:'t-salary',type:'income',name:'Salaire',cat:'Revenus',amount:2500,date:'2026-11-05'},
   {id:'t-rent',type:'expense',name:'Logement',cat:'Fixes',amount:950,planId:'rent',date:'2026-11-07'},
   {id:'t-shopping',type:'expense',name:'Courses',cat:'Variables',amount:82.45,planId:'food',date},
   {id:'t-legacy',type:'expense',name:'Dépense ancienne sans budget',cat:'Variables',amount:24.8,date},
   {id:'t-vac',type:'expense',name:'Cotisation vacances',cat:'Provisions',amount:100,planId:'travel',date},
   {id:'t-dec',type:'expense',name:'Courses Noël',cat:'Variables',amount:47.3,date:'2026-12-11'}
  ],
  assets:[
   {id:'asset-bank',name:'Compte courant',type:'Livrets',amount:2500,invested:2500},
   {id:'asset-pea',name:'PEA',type:'PEA',amount:20550.75,invested:20000},
   {id:'asset-btc',name:'Bitcoin',type:'Crypto',amount:1100,invested:900}
  ],
  snapshots:[
   {date:'2026-10-31',total:19000,assets:[{id:'asset-pea',amount:19000}]},
   {date:'2026-11-17',total:24150.75,assets:[{id:'asset-pea',amount:20550.75}]}
  ],
  recurring:[
   {id:'rec-rent',name:'Logement',amount:950,cat:'Fixes',day:7},
   {id:'rec-netflix',name:'Abonnement',amount:22.99,cat:'Fixes',day:31}
  ],
  envelopeMoves:[
   {id:'move-vac',date,fromPlanId:'travel',toPlanId:'invest',amount:40}
  ],
  quickLabels:['Essence','Courses'],
  v31Shortcuts:{Essence:{type:'expense',visible:true,icon:'fuel'}},
  taxRate:14,
  customFuturePreference:{keep:'no-loss',enabled:true}
 };
 try {
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  await page.locator('#newpass').fill(v4Password);
  await page.locator('#confpass').fill(v4Password);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const before=await page.evaluate(async()=>{
   data.transactions.push({id:'original-v4',type:'expense',name:'Bêta séparée',cat:'Variables',amount:12,date:'2026-11-15'});
   await save();
   return localStorage.getItem(KEY);
  });
  // Simulate the exact V3.7 backup envelope: PBKDF2-SHA256 / 310000 / AES-GCM.
  const legacyFile=await page.evaluate(async({fixture,legacyPassword})=>
   JSON.stringify(await seal(fixture,legacyPassword)),{fixture,legacyPassword});
  const envelope=JSON.parse(legacyFile);
  assert.equal(envelope.format,'mon-budget-prive');
  assert.equal(envelope.version,1);
  assert.equal(envelope.kdf,'PBKDF2-SHA256');
  assert.equal(envelope.iterations,310000);
  assert(!legacyFile.includes('Compte courant'),'Legacy export must remain encrypted');
  const setImport=async()=>page.locator('#importfile').setInputFiles({
   name:'v37-test-sauvegarde.json',mimeType:'application/json',buffer:Buffer.from(legacyFile)
  });
  await page.evaluate(()=>{window.__migrationConfirm=0;mbpPrompt=async()=> 'wrong-password';mbpConfirm=async()=>{window.__migrationConfirm++;return true};mbpAlert=async()=>{}});
  await setImport();
  await page.waitForFunction(()=>document.getElementById('importfile').value==='');
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),before,'Wrong password must preserve beta vault');
  assert.equal(await page.evaluate(()=>window.__migrationConfirm),0,'Wrong password should not reach replace confirmation');
  await page.evaluate(()=>{mbpPrompt=async()=> 'Migration-test-V37-2026!';mbpConfirm=async()=>false;});
  await setImport();
  await page.waitForFunction(()=>document.getElementById('importfile').value==='');
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),before,'Cancelled import must preserve beta vault');
  await page.evaluate(()=>{mbpConfirm=async()=>true});
  await setImport();
  await page.waitForFunction(()=>document.getElementById('importfile').value==='');
  await page.waitForFunction(()=>data.transactions.some(t=>t.id==='t-salary'));
  const after=await page.evaluate(async legacyPassword=>{
   const original=await unseal(JSON.parse(localStorage.getItem(KEY)),legacyPassword);
   return {schemaVersion:data.schemaVersion,stored:JSON.stringify(original)===JSON.stringify(data),
    restored:JSON.parse(JSON.stringify(data)),activeKey:KEY,
    legacyKey:localStorage.getItem('mbp-encrypted-v1'),
    betaPrevious:localStorage.getItem(KEY+'-previous-v4'),
    vaultIsEncrypted:!localStorage.getItem(KEY).includes('Compte courant')};
  },legacyPassword);
  assert.equal(after.stored,true);
  assert.equal(after.schemaVersion,2);
  assert.equal(after.activeKey,'mbp-encrypted-v4-beta1');
  assert.equal(after.legacyKey,null);
  assert.equal(after.betaPrevious,null);
  assert.equal(after.vaultIsEncrypted,true);
  for(const field of Object.keys(fixture)){
   if(field==='plans'||field==='monthBudgets')continue;
   assert.deepEqual(after.restored[field],fixture[field],'Field lost or modified: '+field);
  }
  for(const p of after.restored.plans.filter(p=>['Provisions','Investissements'].includes(p.cat)))
   assert(p.goalId?.startsWith('goal:'),'Missing migrated goal identity for '+p.name);
  assert.equal(after.restored.monthBudgets['2026-12'].length,4);
  assert.equal(after.restored.transactions.length,6);
  assert.equal(after.restored.assets.length,3);
  assert.equal(after.restored.snapshots.length,2);
  assert.equal(after.restored.recurring.length,2);
  assert.equal(after.restored.envelopeMoves.length,1);
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(legacyPassword);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const roundtrip=await page.evaluate(()=>({
   savedTransactions:data.transactions.length,
   assets:data.assets.length,
   periods:Object.keys(data.monthBudgets||{}),
   schema:data.schemaVersion,
   customField:data.customFuturePreference
  }));
  assert.equal(roundtrip.savedTransactions,6);
  assert.equal(roundtrip.assets,3);
  assert.deepEqual(roundtrip.periods,['2026-12']);
  assert.equal(roundtrip.schema,2);
  assert.deepEqual(roundtrip.customField,fixture.customFuturePreference);
  assert.deepEqual(errors,[]);
  console.log('V4_V37_FULL_MIGRATION_PASS '+JSON.stringify({
   encryptedV37Compatible:true,wrongPasswordProtected:true,cancelProtected:true,
   transactions:6,plans:5,monthlyBudgets:1,assets:3,snapshots:2,recurring:2,
   transfers:1,customPropertiesPreserved:true,unlocksAfterReload:true,
   separateProductionKey:true
  }));
 }finally{await context.close();await browser.close()}
})().catch(e=>{console.error('V4_V37_FULL_MIGRATION_FAIL '+String(e.stack||e));process.exitCode=1});
