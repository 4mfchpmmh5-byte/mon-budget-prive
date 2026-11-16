const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const results=[];
const record=(section,scenario,pass,detail={})=>{const out={section,scenario,pass,...detail};results.push(out);console.log('AUDIT_CASE '+JSON.stringify(out));};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__auditRemovedHandlers={};
  const orig=Element.prototype.remove;
  Element.prototype.remove=function(){
    const b=this.querySelector?.('#applyrecurring');
    if(b?.onclick)window.__auditRemovedHandlers.applyrecurring=b.onclick;
    return orig.call(this);
  };
 });
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'load'});
 await page.locator('#setup:not(.hidden)').waitFor();
 const password='Fonctionnel-test-2026-Unique!';
 await page.locator('#newpass').fill(password);await page.locator('#confpass').fill(password);await page.locator('#create').click();
 await page.locator('#app:not(.hidden)').waitFor();
 const checks=await page.evaluate(async password=>{
  const result={};
  const initial=data,initialPass=secret,month=selectedMonth;
  const fixture=()=>({version:1,schemaVersion:2,plans:[],transactions:[],assets:[],snapshots:[],recurring:[],envelopeMoves:[],envelopeStart:'2026-11',monthBudgets:{}});
  try{
   const base=fixture();
   base.plans=[{id:'a',name:'EDF',cat:'Fixes',amount:100},{id:'b',name:'EDF',cat:'Fixes',amount:150}];
   base.transactions=[{id:'tx',name:'EDF',type:'expense',amount:100,cat:'Fixes',date:'2026-11-05'}];
   data=base;selectedMonth='2026-11';
   result.sameLabel={
    paid:paymentItems().filter(x=>x.match).map(x=>x.p.id),
    budgetSpentA:v17BudgetSpent(data.plans[0]),budgetSpentB:v17BudgetSpent(data.plans[1]),
    totalTx:data.transactions.reduce((s,t)=>s+Number(t.amount),0)
   };
   data.transactions[0].planId='b';
   result.sameLabelById={paid:paymentItems().filter(x=>x.match).map(x=>x.p.id),a:v17BudgetSpent(data.plans[0]),b:v17BudgetSpent(data.plans[1])};
   data.transactions[0].planId=undefined;
   data.plans.pop();
   result.legacyUnique={paid:paymentItems().filter(x=>x.match).map(x=>x.p.id),spent:v17BudgetSpent(data.plans[0])};

   // Plans historiques ne doivent pas muter lorsque le mois suivant est consulté.
   data=fixture();data.plans=[{id:'p',name:'Crédit immobilier',cat:'Fixes',amount:938.17}];
   selectedMonth='2026-12';const future=monthPlans();future[0].amount=1400;
   selectedMonth='2026-11';result.monthIsolation={november:monthPlans()[0].amount,decemberData:data.monthBudgets['2026-12']||null};
   // Une charge récurrente est créée une seule fois; le 31 est ramené au dernier jour du mois.
   data=fixture();data.recurring=[{id:'r1',name:'EDF',amount:50,cat:'Fixes',day:31}];
   selectedMonth='2027-02';
   const originalConfirm=mbpConfirm;mbpConfirm=async()=>true;
   try{
    await (document.getElementById('applyrecurring')?.onclick||window.__auditRemovedHandlers.applyrecurring)?.();
    const first=data.transactions.map(t=>({id:t.id,date:t.date,recurringId:t.recurringId}));
    await (document.getElementById('applyrecurring')?.onclick||window.__auditRemovedHandlers.applyrecurring)?.();
    result.recurring={first,after:data.transactions.length};
   }finally{mbpConfirm=originalConfirm}
   // Chiffrement AES-GCM : round-trip complet et rejet de phrase erronée.
   const vault={...fixture(),transactions:[{id:'test',type:'expense',name:'Test',amount:12.34,date:'2026-11-01'}]};
   const sealed=await seal(vault,password);
   const restored=await unseal(sealed,password);
   let badPassRejected=false;try{await unseal(sealed,'mot-de-passe-errone')}catch(e){badPassRejected=true}
   let badStructureRejected=false;try{mbpMigrate37({plans:[],transactions:'broken',assets:[]})}catch(e){badStructureRejected=true}
   result.security={roundTrip:JSON.stringify(restored)===JSON.stringify(vault),badPassRejected,badStructureRejected,format:sealed.format,encryptedNoPlain:!JSON.stringify(sealed).includes('12.34')};
   // Une enveloppe garde ses mouvements séparés et les transferts n'impactent pas le compte des transactions.
   const g1={id:'g1',goalId:'goal:g1',name:'Voyages',cat:'Provisions',amount:700};
   const g2={id:'g2',goalId:'goal:g2',name:'Festivals',cat:'Provisions',amount:150};
   data=fixture();data.plans=[g1,g2];data.envelopeMoves=[
    {id:'fund',goalId:g1.goalId,planId:g1.id,kind:'fund',amount:700,date:'2026-11-01'},
    {id:'out',transferId:'pair',goalId:g1.goalId,planId:g1.id,kind:'transfer-out',amount:100,date:'2026-11-04'},
    {id:'in',transferId:'pair',goalId:g2.goalId,planId:g2.id,kind:'transfer-in',amount:100,date:'2026-11-04'}];
   selectedMonth='2026-11';
   result.envelopes={voyages:v17EnvelopeBalance(g1),festivals:v17EnvelopeBalance(g2),transactionCount:data.transactions.length,netTransfer:data.envelopeMoves.filter(x=>x.transferId==='pair').reduce((a,x)=>a+(x.kind==='transfer-in'?x.amount:-x.amount),0)};
   // Compte patrimonial : valeur - capital investi, sur un échantillon.
   data=fixture();data.assets=[{id:'a1',name:'PEA',type:'PEA',amount:2100,invested:2000},{id:'a2',name:'Livret',type:'Livrets',amount:500,invested:500}];
   renderWealthExtras();
   result.wealth={gain:document.getElementById('wealthgain').textContent,invested:document.getElementById('investedtotal').textContent};
   // Sérialisation chiffrée et réouverture sans perte.
   data=fixture();data.transactions=[{id:'x',type:'expense',name:'Test persistance',amount:13.21,cat:'Variables',date:'2026-11-01'}];secret=password;
   await save();const existing=JSON.parse(localStorage.getItem(KEY));const fromDisk=await unseal(existing,password);
   result.persistence={count:fromDisk.transactions.length,amount:fromDisk.transactions[0]?.amount,encrypted:!localStorage.getItem(KEY).includes('Test persistance')};
  }finally{data=initial;secret=initialPass;selectedMonth=month;}
  return result;
 },password);
 record('budgets','Dépenses homonymes non liées : aucun rapprochement fictif',checks.sameLabel.paid.length===0,{observed:checks.sameLabel});
 record('budgets','Une transaction ambiguë reste non affectée et ne gonfle aucun budget homonyme',checks.sameLabel.budgetSpentA+checks.sameLabel.budgetSpentB<=checks.sameLabel.totalTx&&checks.sameLabel.budgetSpentA===0&&checks.sameLabel.budgetSpentB===0,{observed:checks.sameLabel});
 record('budgets','Un identifiant explicite lie une écriture à un seul des deux budgets homonymes',checks.sameLabelById.a===0&&checks.sameLabelById.b===100&&checks.sameLabelById.paid.length===1&&checks.sameLabelById.paid[0]==='b',{observed:checks.sameLabelById});
 record('budgets','Ancienne écriture sans ID rapprochée uniquement si un seul plan du même nom existe',checks.legacyUnique.spent===100&&checks.legacyUnique.paid.length===1&&checks.legacyUnique.paid[0]==='a',{observed:checks.legacyUnique});
 record('budgets','Mois futurs isolés des mois précédents',checks.monthIsolation.november===938.17,{observed:checks.monthIsolation});
 record('recurrences','Jour 31 ajusté au dernier jour de février 2027',checks.recurring.first.length===1&&checks.recurring.first[0].date==='2027-02-28',{observed:checks.recurring});
 record('recurrences','Application répétée ne double pas les écritures',checks.recurring.after===1,{observed:checks.recurring});
 record('chiffrement','AES-GCM réversible avec la phrase exacte et absence de texte clair',checks.security.roundTrip&&checks.security.encryptedNoPlain,{observed:checks.security});
 record('chiffrement','Mauvaise phrase secrète rejetée',checks.security.badPassRejected,{observed:checks.security});
 record('sauvegardes','Structure invalide rejetée',checks.security.badStructureRejected,{observed:checks.security});
 record('provisions','Transfert conserve les 200 € au total sans opération de compte',Math.abs(checks.envelopes.voyages.remaining-600)<.001&&Math.abs(checks.envelopes.festivals.remaining-100)<.001&&checks.envelopes.transactionCount===0&&checks.envelopes.netTransfer===0,{observed:checks.envelopes});
 record('patrimoine','Plus-value calculée sur un capital connu',checks.wealth.gain.includes('100')&&checks.wealth.invested.includes('2'),{observed:checks.wealth});
 record('sauvegardes','Persistance locale chiffrée sans perte',checks.persistence.count===1&&checks.persistence.amount===13.21&&checks.persistence.encrypted,{observed:checks.persistence});
  const duplicateGoal=await page.evaluate(async()=>{
    const old=data,oldMonth=selectedMonth;
    const a={id:'g1',goalId:'goal:g1',name:'Épargne identique',cat:'Provisions',amount:250};
    const b={id:'g2',goalId:'goal:g2',name:'Épargne identique',cat:'Provisions',amount:300};
    try{
      data={...old,plans:[a,b],monthBudgets:{},envelopeMoves:[],transactions:[],assets:[],recurring:[],snapshots:[],envelopeStart:'2026-11'};
      selectedMonth='2026-11';render();
      const btn=document.querySelector('#v32tasks [data-v36detail="g2"]');
      if(!btn)return {error:'second goal button missing'};
      btn.click();
      await new Promise(r=>setTimeout(r,80));
      const goalDialog=document.getElementById('mbp36goaldialog');
      const stored=goalDialog.dataset.mbpV4GoalId;
      const transfer=goalDialog.querySelector('#mbp37transferbutton');
      if(!transfer)return {stored,error:'transfer button missing'};
      transfer.click();
      await new Promise(r=>setTimeout(r,50));
      const source=document.getElementById('mbp37source')?.value;
      document.getElementById('mbp37transferdialog')?.close();
      return {stored,source};
    }finally{document.getElementById('mbp36goaldialog')?.close();data=old;selectedMonth=oldMonth;render()}
  });
  record('provisions','Deux enveloppes homonymes ouvrent le transfert depuis le bon identifiant',duplicateGoal.stored==='g2'&&duplicateGoal.source==='goal:g2',{observed:duplicateGoal});
 const transactionEdit=await page.evaluate(async()=>{
    const previousData=data,previousMonth=selectedMonth;
    try{
      data={...previousData,plans:[{id:'p1',name:'EDF',cat:'Fixes',amount:75}],monthBudgets:{},recurring:[],transactions:[
        {id:'tx-edit',type:'expense',name:'EDF',amount:75,cat:'Fixes',date:'2026-11-05',planId:'p1',recurringId:'r-recurring',goalId:'goal:test'}
      ]};
      selectedMonth='2026-11';
      editingTx='tx-edit';
      v17FillTxBudgets();
      document.getElementById('txtype').value='expense';
      document.getElementById('txname').value='EDF mise à jour';
      document.getElementById('txamount').value='76';
      document.getElementById('txcat').value='Fixes';
      document.getElementById('txdate').value='2026-11-06';
      document.getElementById('txbudget').value='p1';
      await document.getElementById('txform').onsubmit({preventDefault(){}});
      const saved=data.transactions.find(t=>t.id==='tx-edit');
      return {id:saved.id,name:saved.name,amount:saved.amount,planId:saved.planId,recurringId:saved.recurringId,goalId:saved.goalId};
    }finally{data=previousData;selectedMonth=previousMonth;editingTx=null;render()}
  });
  record('operations','Modifier une dépense conserve ses identifiants de récurrence et de provision',transactionEdit.id==='tx-edit'&&transactionEdit.amount===76&&transactionEdit.planId==='p1'&&transactionEdit.recurringId==='r-recurring'&&transactionEdit.goalId==='goal:test',{observed:transactionEdit});
 record('application','Absence d’erreurs JavaScript',errors.length===0,{observed:errors});
 console.log('AUDIT_FUNCTIONAL_SUMMARY '+JSON.stringify({total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length}));
 await browser.close();
})().catch(err=>{console.error('AUDIT_FATAL '+String(err.stack||err));process.exit(1)});
