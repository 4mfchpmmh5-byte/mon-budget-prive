const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
  await page.locator('#setup:not(.hidden)').waitFor();
  const pw='V4-semantic-color-2026!';
  await page.locator('#newpass').fill(pw);
  await page.locator('#confpass').fill(pw);
  await page.locator('#create').click();
  await page.locator('#app:not(.hidden)').waitFor();
  const outcomes=[];
  const scenarios=[
   {section:'v32tasks',value:30,target:100,goal:true,expected:'mbp363-incomplete'},
   {section:'v32tasks',value:100,target:100,goal:true,expected:'mbp363-complete'},
   {section:'v32summary',value:40,target:100,goal:false,expected:'mbp363-low'},
   {section:'v32summary',value:70,target:100,goal:false,expected:'mbp363-caution'},
   {section:'v32summary',value:90,target:100,goal:false,expected:'mbp363-high'},
   {section:'v32summary',value:100,target:100,goal:false,expected:'mbp363-high'},
   {section:'v32summary',value:120,target:100,goal:false,expected:'mbp363-over'}
  ];
  for(const x of scenarios){
   const actual=await page.evaluate(async x=>{
    const root=document.getElementById(x.section);
    const row=document.createElement('div');
    row.className=x.goal?'v36-goal':'v32-line';
    row.id='v4-audit-bar';
    row.innerHTML=(x.goal?'<div class="v36-goal-main">':'<div class="v32-monthrow">')+
     x.value+' € / '+x.target+' €</div><div class="v32-fill"></div>';
    root.append(row);
    await new Promise(resolve=>setTimeout(resolve,160));
    const fill=row.querySelector('.v32-fill');
    const result={classes:[...fill.classList],background:getComputedStyle(fill).backgroundColor,
      cssToken:fill.style.getPropertyValue('--mbp372-status')};
    row.remove();
    return result;
   },x);
   assert(actual.classes.includes(x.expected),JSON.stringify({x,actual}));
   if(x.goal){
    assert.equal(actual.cssToken,x.value>=x.target?'#4dc69f':'#8294a8');
   }else{
    const expected=x.value>x.target?'#f08e9c':x.value>=x.target*.85?'#e88b55':x.value>=x.target*.6?'#e8ae68':'#4dc69f';
    assert.equal(actual.cssToken,expected,JSON.stringify({x,actual}));
   }
   outcomes.push({goal:x.goal,rate:x.value/x.target,token:actual.cssToken});
  }
  assert.deepEqual(errors,[]);
  console.log('V4_SEMANTIC_COLORS_PASS '+JSON.stringify(outcomes));
 }finally{await browser.close()}
})().catch(e=>{console.error('V4_SEMANTIC_COLORS_FAIL '+String(e.stack||e));process.exitCode=1});
