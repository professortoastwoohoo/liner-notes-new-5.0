'use strict';
// ===== Ledger: every cash movement is a dated transaction =====
// s.ledger holds transactions that have not yet been folded into a monthly statement: {d: day number, c: category, t: label, a: amount}.
// A monthly statement is built from the transactions dated inside that calendar month, once the month has fully passed.
// A week that spans two months therefore has its transactions allocated to the right month by their real dates.
// Nothing here changes how much money anything earns or costs; it only records, dates and reports it.
const LEDGER_CATEGORIES={royalties:'Royalties',support:'Supporter memberships',soundtrack:'Soundtrack commissions',sponsor:'Sponsorships',living:'Living costs',education:'Education',tours:'Touring',actions:'Gigs, jobs and daily activities',purchases:'Investments and lifestyle',recording:'Recording and releases',label:'Label deals and funding',press:'Press and media',personal:'Relationships and family',writing:'Songwriting for others',events:'Life events',other:'Other'};
// The categories shown as the "settlement" in earlier statements; everything else is listed as other cash movements.
const SETTLEMENT_CATEGORIES=['royalties','support','soundtrack','sponsor','living','education'];
// Functions that move money, with the category their cash movements are filed under.
const LEDGER_SOURCES={
action:'actions',doFanAction:'actions',
bookTour:'tours',advanceTours:'tours',settleLiveTour:'tours',
buyInvestment:'purchases',confirmHousing:'purchases',confirmRelocation:'purchases',starInvest:'purchases',
release:'recording',releaseEarlySingle:'recording',releaseAnniversary:'recording',releaseCompilation:'recording',releaseDeluxe:'recording',releaseRerecording:'recording',releaseRemix:'recording',releaseLiveRecording:'recording',makeVideo:'recording',workshopSong:'recording',bookCreativeSession:'recording',supportAlbum:'recording',requestRemixCollaboration:'recording',requestCollaboration:'recording',
labelFunding:'label',signLabelOffer:'label',labelProjectFunding:'label',confirmBuyout:'label',videoFunding:'label',
acceptMedia:'press',bookAwardPerformance:'press',
datePartner:'personal',relationshipMilestone:'personal',socialAction:'personal',finaliseDivorce:'personal',holdWedding:'personal',
advanceEducation:'education',
starMonthly:'sponsor',starResolve:'sponsor',
fileComposition:'writing',answerWritingCommission:'writing',
decide:'events',applyStoryEffect:'events',
runProduction:'recording'};
const round2=n=>Math.round(n*100)/100;
let ledgerScopes=[];

// ---- State ----
function ensureLedger(){
  if(!s)return false;
  if(s.ledger===undefined){
    s.ledger=[];s.ledgerBase=s.cash;s.ledgerBalance=s.cash;
    // A brand-new game records from month 0. An older save already has a statement for its current month, so recording starts next month.
    s.ledgerFirstMonth=(s.month===0&&!(s.statements&&s.statements.length))?0:s.month+1;
    s.ledgerDone=s.ledgerFirstMonth-1}
  if(!s.monthRows)s.monthRows={};
  if(!s.monthMeta)s.monthMeta={};
  if(!s.extraRoyaltyPlan)s.extraRoyaltyPlan=[];
  return true}
function firstDayOfMonthIndex(M){let y=s.startYear+Math.floor(M/12),m=((M%12)+12)%12;return dayNum(y,m,1)}
function lastDayOfMonthIndex(M){let y=s.startYear+Math.floor(M/12),m=((M%12)+12)%12;return dayNum(y,m,daysInMonth(y,m))}
// The date a transaction made right now is filed under. Player actions fall on successive days of the current week.
function ledgerDay(){
  let d;
  if(s.ledgerClock!==null&&s.ledgerClock!==undefined)d=s.ledgerClock;
  else if(s.weekStart===undefined)d=dayNum(s.startYear,s.month%12,1);
  else{let used=Math.max(0,Math.min(ACTIONS_PER_WEEK,ACTIONS_PER_WEEK-s.ap));d=s.weekStart+Math.min(6,Math.floor(used*7/ACTIONS_PER_WEEK))}
  return Math.max(d,dayNum(s.startYear,0,1))}
function ledgerPush(d,c,t,a){
  a=round2(a);if(!a)return;
  s.ledger.push({d,c,t,a});s.ledgerBalance=round2(s.ledgerBalance+a)}
// Records any change to s.cash that nothing else has recorded yet.
function ledgerSweep(cat,label,day){
  if(!s||s.ledger===undefined)return;
  let diff=round2(s.cash-s.ledgerBalance);if(Math.abs(diff)<.005)return;
  let top=ledgerScopes[ledgerScopes.length-1];
  ledgerPush(day??ledgerDay(),cat||top?.cat||'other',label||top?.label||'Other',diff)}
// Posts a cash movement with an explicit category, label and (optionally) date.
function ledgerCash(amount,cat,label,day){
  if(!s||!amount)return;ensureLedger();ledgerSweep();
  amount=round2(amount);if(!amount)return;
  s.cash=round2(s.cash+amount);ledgerPush(day??ledgerDay(),cat,label,amount)}
function ledgerAudit(){if(!s||s.ledger===undefined)return null;let sum=round2(s.ledger.reduce((n,e)=>n+e.a,0));return {cash:s.cash,base:s.ledgerBase,entries:s.ledger.length,explained:round2(s.ledgerBase+sum),difference:round2(s.cash-(s.ledgerBase+sum))}}

// ---- Label each money-moving function so its transactions are filed under the right heading ----
function ledgerWrap(name,cat){
  const orig=window[name];if(typeof orig!=='function'||orig.__ledger)return;
  const wrapped=function(...args){
    if(!s||!ensureLedger())return orig.apply(this,args);
    ledgerSweep();
    let label=name==='action'?(ACTIONS.find(a=>a[0]===args[0])?.[1]||'Activity'):name==='buyInvestment'?(INVESTMENTS.find(i=>i[0]===args[0])?.[1]||'Investment'):name.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
    ledgerScopes.push({cat,label});
    try{return orig.apply(this,args)}
    finally{let sc=ledgerScopes.pop();ledgerSweep(sc.cat,sc.label)}};
  wrapped.__ledger=true;window[name]=wrapped}
for(let [name,cat] of Object.entries(LEDGER_SOURCES))ledgerWrap(name,cat);

// ---- Weekly royalties ----
// At each month start the game works out how many streams every album earns that month (unchanged). Those streams are then paid week by week,
// together with any streams earned during the week itself (new releases, boosts). Songwriting income for other artists is spread the same way.
function planRoyalties(a,fresh){
  let left=a.weekPlan&&a.weekPlan.done<a.weekPlan.weeks?Math.max(0,a.weekPlan.total-Math.round(a.weekPlan.total*a.weekPlan.done/a.weekPlan.weeks)):0;
  a.weekPlan={total:Math.max(0,Math.round(fresh))+left,weeks:Math.max(1,weeksInGameMonth(s.month)),done:0,month:s.month}}
function planExternalRoyalties(rows){
  ensureLedger();let weeks=Math.max(1,weeksInGameMonth(s.month));
  for(let row of rows)if(row.paid>0||row.streams>0)s.extraRoyaltyPlan.push({row:{...row},weeks,done:0})}
function accumulateRow(M,row){
  let rows=s.monthRows[M]||(s.monthRows[M]={}),key=row.album||row.title,r=rows[key]||(rows[key]={album:row.album,title:row.title,streams:0,gross:0,label:0,share:0,recoup:0,recording:0,writer:0,paid:0,externalWriting:!!row.externalWriting});
  for(let k of ['streams','gross','label','share','recoup','recording','writer','paid'])r[k]+=row[k]||0;
  if(row.formats){r.formats=r.formats||{};for(let [f,v] of Object.entries(row.formats)){let x=r.formats[f]||(r.formats[f]={units:0,revenue:0});x.units+=v.units;x.revenue+=v.revenue}}
  if(row.singles){let x=r.singles||(r.singles={units:0,revenue:0});x.units+=row.singles.units;x.revenue+=row.singles.revenue}}
function postWeeklyRoyalties(weekStart){
  ensureLedger();let day=weekStart+6,M=gameMonthOfWeek(weekStart);
  for(let a of s.albums){
    let plan=a.weekPlan,share=0;
    if(plan&&plan.done<plan.weeks){let k=plan.done+1;share=wobbleShare(plan.total,plan.weeks,k,a.id);plan.done=k}
    if(a.pendingStreams>0){(a.payFlows||(a.payFlows=[])).push({total:a.pendingStreams,weeks:Math.max(1,weeksInGameMonth(M)-weekOfMonth(weekStart)+1),done:0});a.pendingStreams=0}
    for(let f of a.payFlows||[]){f.done++;share+=frontLoadedShare(f.total,f.weeks,f.done)}
    if(a.payFlows)a.payFlows=a.payFlows.filter(f=>f.done<f.weeks);
    let wk=weeklyAlbumRevenue(a,share,weekStart);
    if(!wk)continue;
    let fm=wk.fm,row=paymentFor(a,Math.round(fm.effective),true);row.paid=round2(row.paid);row.streams=Math.round(fm.streams);row.formats=wk.formats;row.singles=wk.singles;
    ledgerCash(row.paid,'royalties',a.title,day);accumulateRow(M,row)}
  for(let p of s.extraRoyaltyPlan){
    let k=p.done+1,total=p.row.paid,pay=round2(total*k/p.weeks)-round2(total*p.done/p.weeks),f=total>0?pay/total:1/p.weeks;
    p.done=k;if(pay<=0&&total>0)continue;
    let row={...p.row};for(let key of ['streams','gross','label','share','recoup','recording','writer','paid'])row[key]=(p.row[key]||0)*f;row.paid=pay;
    ledgerCash(pay,'royalties',p.row.title,day);accumulateRow(M,row)}
  s.extraRoyaltyPlan=s.extraRoyaltyPlan.filter(p=>p.done<p.weeks)}

// ---- Weekly living costs ----
// Charged day by day, so a week that spans two months bills each month for its own days. Unaffordable costs become a shortfall; no debt is added.
function chargeLivingCosts(weekStart){
  ensureLedger();let L=livingCost(),startDay=dayNum(s.startYear,0,1),parts=[];
  for(let d=weekStart;d<=weekStart+6;d++){
    if(d<startDay)continue;let p=dayParts(d),M=(p.y-s.startYear)*12+p.m,last=parts[parts.length-1];
    if(last&&last.M===M){last.days++;last.through=p.d;last.day=d}else parts.push({M,days:1,through:p.d,day:d,y:p.y,m:p.m})}
  for(let part of parts){
    let meta=s.monthMeta[part.M]||(s.monthMeta[part.M]={}),dim=daysInMonth(part.y,part.m),dueTotal=round2(L*part.through/dim),due=round2(dueTotal-(meta.livingDue||0));
    meta.livingDue=dueTotal;meta.scheduled=L;meta.lifestyle=typeof lifestyleExtraCost==='function'?lifestyleExtraCost():0;
    if(due<=0)continue;
    let charge=Math.min(due,Math.max(0,s.cash));
    ledgerCash(-charge,'living','Living costs',part.day);meta.shortfall=round2((meta.shortfall||0)+due-charge)}}

// ---- Monthly statements built from the ledger ----
function buildStatement(M){
  let start=firstDayOfMonthIndex(M),end=lastDayOfMonthIndex(M);
  let stale=s.ledger.filter(e=>e.d<start);
  if(stale.length){s.ledgerBase=round2(s.ledgerBase+stale.reduce((n,e)=>n+e.a,0));s.ledger=s.ledger.filter(e=>e.d>=start)}
  let entries=s.ledger.filter(e=>e.d<=end),by={};
  for(let e of entries)by[e.c]=round2((by[e.c]||0)+e.a);
  let meta=s.monthMeta[M]||{},opening=s.ledgerBase,costs=-(by.living||0),education=-(by.education||0);
  let st={month:M,ledger:true,opening,rows:Object.values(s.monthRows[M]||{}),royalties:by.royalties||0,support:by.support||0,soundtrackIncome:by.soundtrack||0,sponsorIncome:by.sponsor||0,costs,scheduledCosts:meta.scheduled??costs,lifestyleCosts:meta.lifestyle,shortfall:meta.shortfall||0,education};
  st.net=round2(st.royalties+st.support+st.soundtrackIncome+st.sponsorIncome-costs-education);
  st.other={};for(let [c,v] of Object.entries(by))if(!SETTLEMENT_CATEGORIES.includes(c)&&v)st.other[c]=v;
  st.otherNet=round2(Object.values(st.other).reduce((n,v)=>n+v,0));
  st.closing=round2(opening+st.net+st.otherNet);
  s.ledgerBase=st.closing;s.ledger=s.ledger.filter(e=>e.d>end);
  delete s.monthRows[M];delete s.monthMeta[M];
  return st}
function finalizeStatements(){
  ensureLedger();let made=[];
  while(lastDayOfMonthIndex(s.ledgerDone+1)<s.weekStart){
    let M=s.ledgerDone+1,st=buildStatement(M);s.ledgerDone=M;s.statements.unshift(st);made.push(st);
    if(st.shortfall>0){change({happiness:-3});log('A tight month',`You were ${cashExact(st.shortfall)} short on living costs in ${MONTHS[M%12]}. No debt added. Check your Singer statement and label video allowance.`)}
    let recoup=st.rows.reduce((n,r)=>n+r.recoup,0),msg=`${MONTHS[M%12]} ${year(M)} is complete: ${cashExact(st.royalties)} royalties paid to you; ${cashExact(recoup)} repaid the advance; ${cashExact(st.support)} supporter income; ${cashExact(st.costs)} living costs.`;
    log('Monthly statement',msg)}
  return made}
// Month-to-date view of the current calendar month for the Singer screen.
function monthToDate(){
  ensureLedger();let M=s.month,start=firstDayOfMonthIndex(M),end=lastDayOfMonthIndex(M),by={};
  for(let e of s.ledger)if(e.d>=start&&e.d<=end)by[e.c]=round2((by[e.c]||0)+e.a);
  return by}
function formatBreakdownHTML(st){
  let by={};for(let r of st.rows||[])for(let [f,v] of Object.entries(r.formats||{})){let x=by[f]||(by[f]={units:0,revenue:0});x.units+=v.units;x.revenue+=v.revenue}
  let rows=Object.entries(by).filter(([,v])=>v.units>0.01||v.revenue>0.01).sort((a,b)=>b[1].revenue-a[1].revenue),sg={units:0,revenue:0};
  for(let r of st.rows||[])if(r.singles){sg.units+=r.singles.units;sg.revenue+=r.singles.revenue}
  if(!rows.length&&sg.units<.01)return '';
  return `<div class="scroll"><table><tr><th>Album sales by format</th><th>Copies sold (streams as album-equivalents)</th><th>Gross revenue</th></tr>${rows.map(([f,v])=>`<tr><td>${formatName(f)}</td><td>${num(Math.round(v.units))}</td><td>${cashExact(v.revenue)}</td></tr>`).join('')}${sg.units>=.01||sg.revenue>=.01?`<tr><td>Singles and downloads of single tracks</td><td>${num(Math.round(sg.units))}</td><td>${cashExact(sg.revenue)}</td></tr>`:''}</table></div><p class="footnote">Album copies are the album’s own sales, the same figures as the chart. Gross revenue is before your label’s share and any advance repayment.</p>`}
function recentTransactionsHTML(){
  if(!s||s.ledger===undefined)return '';
  let by=monthToDate(),rows=Object.entries(by).filter(([,v])=>v).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])),recent=[...s.ledger].sort((a,b)=>b.d-a.d).slice(0,25),total=round2(Object.values(by).reduce((n,v)=>n+v,0));
  return `<div class="card"><h3>Money this month so far</h3><p class="footnote">Every payment is dated. Royalties and living costs arrive weekly; monthly statements add up the transactions by their real dates.</p>${rows.length?`<div class="scroll"><table><tr><th>${MONTHS[s.month%12]} ${year()}</th><th>Amount</th></tr>${rows.map(([c,v])=>`<tr><td>${LEDGER_CATEGORIES[c]||c}</td><td>${v<0?'−':''}${cashExact(Math.abs(v))}</td></tr>`).join('')}<tr><td><b>Net so far</b></td><td><b>${total<0?'−':''}${cashExact(Math.abs(total))}</b></td></tr></table></div>`:'<p class="muted">No money has moved this month yet.</p>'}${recent.length?`<details><summary>Recent transactions</summary><div class="scroll"><table><tr><th>Date</th><th>Item</th><th>Category</th><th>Amount</th></tr>${recent.map(e=>`<tr><td>${fmtDay(e.d)}</td><td>${esc(e.t)}</td><td>${LEDGER_CATEGORIES[e.c]||e.c}</td><td>${e.a<0?'−':''}${cashExact(Math.abs(e.a))}</td></tr>`).join('')}</table></div></details>`:''}</div>`}
(function(){
  let base=statementHTML;
  statementHTML=function(st){
    let html=base(st);
    if(!st.ledger)return html;
    let other=Object.entries(st.other||{}).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
    return html+`<p class="footnote">Statement built from dated transactions inside the month.</p>${formatBreakdownHTML(st)}${other.length?`<div class="scroll"><table><tr><th>Other cash movements</th><th>Amount</th></tr>${other.map(([c,v])=>`<tr><td>${LEDGER_CATEGORIES[c]||c}</td><td>${v<0?'−':''}${cashExact(Math.abs(v))}</td></tr>`).join('')}</table></div>`:''}<p>Opening balance ${cashExact(st.opening)} · settlement ${st.net<0?'−':''}${cashExact(Math.abs(st.net))} · other movements ${st.otherNet<0?'−':''}${cashExact(Math.abs(st.otherNet))} · <b>closing balance ${cashExact(st.closing)}</b></p>`}})();
