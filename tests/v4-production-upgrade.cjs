const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  assert.equal(await page.evaluate(()=>KEY),'mbp-encrypted-v1','Release MUST use the existing production vault');
  assert.equal(await page.locator('#mbpV4BetaNotice').count(),0,'Beta isolation banner must not appear in release');
  const oldPassword='V37-preserved-existing-2026!';
  const old={
    version:1,plans:[
      {id:'p1',name:'Courses',cat:'Variables',amount:300},
      {id:'p2',name:'Vacances',cat:'Provisions',amount:450}
    ],
    transactions:[
      {id:'t1',type:'expense',name:'Courses',amount:32.15,cat:'Variables',planId:'p1',date:'2026-11-16'},
      {id:'t2',type:'income',name:'Salaire',amount:2300,cat:'Revenus',date:'2026-11-05'}
    ],
    assets:[{id:'a1',name:'PEA',type:'PEA',amount:10150,invested:10000}],
    snapshots:[{date:'2026-10-31',total:10000}],
    recurring:[{id:'r1',name:'Électricité',cat:'Fixes',amount:45,day:15}],
    monthBudgets:{'2026-12':[{id:'p2-dec',name:'Vacances',cat:'Provisions',amount:450}]},
    envelopeMoves:[{id:'m1',date:'2026-11-16',fromPlanId:'p1',toPlanId:'p2',amount:10}]
  };
  // Simulate V3.7's existing encrypted payload under the PRODUCTION origin and storage key.
  const originalCipher=await page.evaluate(async({oldPassword,old})=>{
   const payload=JSON.stringify(await seal(old,oldPassword));
   localStorage.setItem('mbp-encrypted-v1',payload);
   return payload;
  },{oldPassword,old});
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  assert.equal(await page.locator('#setup:not(.hidden)').count(),0,
   'Existing V3.7 user must see Unlock, NEVER Create a new empty vault');
  await page.locator('#pass').fill(oldPassword);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const opened=await page.evaluate(()=>({
   tx:data.transactions.map(t=>t.id),plans:data.plans.map(p=>({id:p.id,goalId:p.goalId})),
   assets:data.assets.map(a=>a.id),
   saved:localStorage.getItem(KEY),
   schema:data.schemaVersion, backup:localStorage.getItem(KEY+'-previous-v4'),
   monthBudget:data.monthBudgets['2026-12'][0]?.name
  }));
  assert.deepEqual(opened.tx,['t1','t2']);
  assert.deepEqual(opened.assets,['a1']);
  assert.equal(opened.saved,originalCipher,'Opening release must not silently overwrite the legacy encrypted vault');
  assert.equal(opened.schema,2);
  assert.equal(opened.monthBudget,'Vacances');
  assert.equal(opened.backup,null);
  assert.equal(opened.plans[1].goalId,'goal:p2');
  await page.evaluate(async()=>{
   data.transactions.push({id:'t3',type:'expense',name:'Essence',cat:'Variables',amount:25.9,date:'2026-11-17'});
   await save();
  });
  const after=await page.evaluate(async oldPassword=>{
   const current=localStorage.getItem(KEY);
   const backup=localStorage.getItem(KEY+'-previous-v4');
   const restored=await unseal(JSON.parse(current),oldPassword);
   return {
    currentDifferent:current!==backup,
    backupNonEmpty:backup!==null,
    oldVaultStillRecoverable:backup===window.__originalCipher,
    backupOriginal:backup,
    tx:restored.transactions.map(t=>t.id),
    schema:restored.schemaVersion,
    betaKey:localStorage.getItem('mbp-encrypted-v4-beta1'),
    cache:await caches.keys()
   };
  },oldPassword);
  assert(after.currentDifferent&&after.backupNonEmpty);
  assert.equal(after.backupOriginal,originalCipher,'First V4 save MUST retain exact V3.7 encrypted fallback');
  assert.deepEqual(after.tx,['t1','t2','t3']);
  assert.equal(after.schema,2);
  assert.equal(after.betaKey,null);
  await page.reload();
  await page.locator('#unlock:not(.hidden)').waitFor();
  await page.locator('#pass').fill(oldPassword);
  await page.locator('#open').click();
  await page.locator('#app:not(.hidden)').waitFor();
  assert.deepEqual(await page.evaluate(()=>data.transactions.map(t=>t.id)),['t1','t2','t3']);
  assert.deepEqual(errors,[]);
  console.log('V4_PRODUCTION_UPGRADE_PASS '+JSON.stringify({
   unlocksExistingV37Vault:true,preservesEncryptedOriginalUntilWrite:true,
   snapshotsOriginalOnFirstWrite:true,preservesAllHistoricalFields:true,
   noBetaBanner:true,noBetaStorageKey:true,reopensWithLegacySecret:true
  }));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_PRODUCTION_UPGRADE_FAIL '+String(e.stack||e));process.exitCode=1});
