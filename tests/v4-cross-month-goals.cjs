const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  await page.locator('#newpass').fill('V4-cross-month-test-2026!');
  await page.locator('#confpass').fill('V4-cross-month-test-2026!');
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const actual=await page.evaluate(()=>{
   const original=data,originalMonth=selectedMonth;
   const nov={id:'old-travel',goalId:'goal:travel',name:'Voyages',cat:'Provisions',amount:300};
   const dec={id:'new-travel',goalId:'goal:travel',name:'Voyages',cat:'Provisions',amount:450};
   const other={id:'other-travel',goalId:'goal:other',name:'Voyages',cat:'Provisions',amount:100};
   try{
    data={version:1,schemaVersion:2,plans:[nov,{...other}],
      monthBudgets:{'2026-12':[dec,{...other}]},
      transactions:[
       {id:'hotel',type:'expense',name:'Hôtel',cat:'Provisions',planId:'new-travel',amount:80,date:'2026-12-12'},
       {id:'other-expense',type:'expense',name:'Voyages',cat:'Provisions',goalId:'goal:other',amount:10,date:'2026-12-14'},
       {id:'unassigned',type:'expense',name:'Voyages',cat:'Provisions',amount:9,date:'2026-12-15'}
      ],assets:[],snapshots:[],recurring:[],envelopeStart:'2026-11',
      envelopeMoves:[
       {id:'nov-fund',goalId:'goal:travel',planId:'old-travel',kind:'fund',amount:200,date:'2026-11-05'},
       {id:'dec-fund',goalId:'goal:travel',planId:'new-travel',kind:'fund',amount:150,date:'2026-12-05'},
       {id:'other-fund',goalId:'goal:other',planId:'other-travel',kind:'fund',amount:70,date:'2026-11-10'},
       {id:'travel-out',transferId:'transfer1',goalId:'goal:travel',planId:'old-travel',kind:'transfer-out',amount:30,date:'2026-11-20'},
       {id:'other-in',transferId:'transfer1',goalId:'goal:other',planId:'other-travel',kind:'transfer-in',amount:30,date:'2026-11-20'}
      ]};
    selectedMonth='2026-11';
    const november=mbpV4GoalLedger(nov,'2026-11');
    selectedMonth='2026-12';
    const december=mbpV4GoalLedger(dec,'2026-12');
    const otherBalance=mbpV4GoalLedger(other,'2026-12');
    const byId=mbpV4ResolvePlan(data.transactions[0],monthPlans());
    const legacy=mbpV4ResolvePlan(data.transactions[2],monthPlans());
    return {november:{remaining:november.remaining,spent:november.spent,funds:november.funds.length},
     december:{remaining:december.remaining,spent:december.spent,funds:december.funds.length,transfers:december.transfers.length},
     other:{remaining:otherBalance.remaining,spent:otherBalance.spent},
     resolvedId:byId?.id||null,ambiguousLegacy:legacy?.id||null};
   }finally{data=original;selectedMonth=originalMonth;}
  });
  assert.deepEqual(actual.november,{remaining:170,spent:0,funds:1});
  assert.deepEqual(actual.december,{remaining:240,spent:80,funds:2,transfers:1});
  assert.deepEqual(actual.other,{remaining:90,spent:10});
  assert.equal(actual.resolvedId,'new-travel');
  assert.equal(actual.ambiguousLegacy,null);
  console.log('V4_CROSS_MONTH_PASS '+JSON.stringify(actual));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_CROSS_MONTH_FAIL '+String(e.stack||e));process.exitCode=1});
