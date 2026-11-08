'use strict';
// ===== Calendar engine (save version 3): real dates and Sunday–Saturday weeks =====
// One turn is one week. Every week belongs to the month that contains its Saturday, so the week holding
// 1 January is always the first week of January, even when it starts in the previous December.
// The older monthly systems (royalties, statements, awards, relationships, events) still run once per game-month:
// they fire when the first week of a new month begins. s.month stays the month index since January of the start year.
const ACTIONS_PER_WEEK=5,ENERGY_PER_UNUSED_ACTION=14,WEEKLY_FLAT_ENERGY=5,WEEK_BREAK_ACTIONS=3,REST_COST=50;
const MS_PER_DAY=86400000,PRE_WEEKLY_BACKUP_KEY='liner-notes.pre-weekly-backup';

// ---- Weekly pacing ----
// Players now get about 4.3 times as many actions per month as before, so each session's progress, pay and price is scaled down.
// Progress per session is 0.25x, pay 0.33x and fan gains 0.2x. Energy and happiness effects and the personal-life prices are left exactly as designed.
const ONLINE_POST_PACE=0.12,ONLINE_WEEKLY_FAN_CAP=240,ONLINE_WEEKLY_BOOST_CAP=.02,ONLINE_POST_BOOST=.00625;// online posting: same pacing as career actions, caps per week
const ACTION_PACE=0.25,ACTION_PAY_PACE=0.33,ACTION_FAN_PACE=0.2,PACED_STATS=['craft','voice','prep','promo','rep','buzz'];
const STAT_LABELS={craft:'Craft',voice:'Performance',prep:'Preparation',promo:'Campaign',rep:'Reputation',buzz:'Attention',energy:'Energy',happiness:'Happiness'};
function fmtEffect(n){let r=Math.round(n*10)/10;return Number.isInteger(r)?String(r):r.toFixed(1)}
(function rebalanceActions(){
  for(let a of ACTIONS){
    let personal=a[3]==='Personal life';
    if(!personal&&a[4]>0)a[4]=Math.max(5,Math.round(a[4]*ACTION_PACE/5)*5);
    if(a[6]){
      let eff={};for(let [k,v] of Object.entries(a[6]))eff[k]=PACED_STATS.includes(k)?v*ACTION_PACE:v;a[6]=eff;
      if(a[0]!=='interview')a[2]=(a[4]>0?'$'+a[4]+' · ':'')+Object.entries(eff).map(([k,v])=>`${STAT_LABELS[k]} ${v<0?'−':'+'}${fmtEffect(Math.abs(v))}`).join(' · ')}}
  let by=k=>ACTIONS.find(a=>a[0]===k);
  by('work')[2]=`Earn $${Math.round(450*ACTION_PAY_PACE)} (under 16: $${Math.round(100*ACTION_PAY_PACE)}) · Energy −14 · Happiness −3`;
  by('busk')[2]=`Earn $${Math.round(60*ACTION_PAY_PACE)}–$${Math.round(140*ACTION_PAY_PACE)} · Performance +${fmtEffect(ACTION_PACE)} · Energy −12`;
  by('social')[2]=`Small audience growth · Attention +${fmtEffect(4*ACTION_PACE)} · Energy −6`})();
// ---- Front-loaded spreading of launch streams across the remaining weeks of a month ----
// A release or campaign boost lands hardest in its first week and tapers: week k of n gets (r^(k-1) - r^k)/(1 - r^n) of the total.
const LAUNCH_TAPER=.55;
function frontLoadedShare(total,n,k){
  if(n<=1)return k===1?total:0;
  let c=j=>(1-Math.pow(LAUNCH_TAPER,j))/(1-Math.pow(LAUNCH_TAPER,n));
  return Math.round(total*c(k))-Math.round(total*c(k-1))}
// Plain month-start streams are spread across the weeks with a small steady wobble, so weeks differ a little instead of being identical.
function wobbleShare(total,n,k,seed){
  if(n<=1)return k===1?total:0;
  let h=0;for(let ch of String(seed))h=(h*31+ch.charCodeAt(0))%9973;
  let w=Array.from({length:n},(_,i)=>1+.07*Math.sin((i+1)*2.1+h)),sum=w.reduce((a,b)=>a+b,0),cum=j=>w.slice(0,j).reduce((a,b)=>a+b,0)/sum;
  return Math.round(total*cum(k))-Math.round(total*cum(k-1))}
function weeksLeftInGameMonth(){return Math.max(1,weeksInGameMonth(s.month)-weekOfMonth(s.weekStart)+1)}
// ---- Pure date helpers (months are 0–11; day numbers count days since 1 January 1970, in UTC so no DST drift) ----
function dayNum(y,m,d){return Math.floor(Date.UTC(y,m,d)/MS_PER_DAY)}
function dayParts(n){let d=new Date(n*MS_PER_DAY);return {y:d.getUTCFullYear(),m:d.getUTCMonth(),d:d.getUTCDate(),dow:d.getUTCDay()}}
function daysInMonth(y,m){return new Date(Date.UTC(y,m+1,0)).getUTCDate()}
function isLeapYear(y){return y%4===0&&(y%100!==0||y%400===0)}
function weekStartOf(n){return n-dayParts(n).dow}
function initialWeekStartFor(startYear){return weekStartOf(dayNum(startYear,0,1))}
function firstWeekStartOfMonthFor(startYear,monthIndex){let y=startYear+Math.floor(monthIndex/12),m=((monthIndex%12)+12)%12;return weekStartOf(dayNum(y,m,1))}
function gameMonthOfWeekFor(startYear,weekStart){let p=dayParts(weekStart+6);return (p.y-startYear)*12+p.m}
// Birthdays on 29 February are observed on 28 February in non-leap years.
function birthdayDayIn(y,m,d){return Math.min(d,daysInMonth(y,m))}
function ageOnDayFor(state,n){
  let by=state.birthYear??(state.startYear-state.startAge),bm=state.birthMonth??0,bd=state.birthDay??1,p=dayParts(n),a=p.y-by;
  if(p.m<bm||(p.m===bm&&p.d<birthdayDayIn(p.y,bm,bd)))a--;
  return a}
// ---- Helpers that read the current game ----
function firstWeekStartOfMonth(m){return firstWeekStartOfMonthFor(s.startYear,m)}
function gameMonthOfWeek(ws){return gameMonthOfWeekFor(s.startYear,ws)}
function weekOfMonth(ws=s.weekStart){return Math.round((ws-firstWeekStartOfMonth(gameMonthOfWeek(ws)))/7)+1}
function weeksInGameMonth(m=s.month){return Math.round((firstWeekStartOfMonth(m+1)-firstWeekStartOfMonth(m))/7)}
function fmtDay(n,withYear=true){let p=dayParts(n);return p.d+' '+MONTHS[p.m].slice(0,3)+(withYear?' '+p.y:'')}
function weekRangeLabel(ws=s.weekStart){let a=dayParts(ws),b=dayParts(ws+6);return fmtDay(ws,a.y!==b.y)+' – '+fmtDay(ws+6)}
function weekDateLabel(){return `${weekRangeLabel()} · Age ${age()}`}
function birthdayLabel(){return `${s.birthDay??1} ${MONTHS[s.birthMonth??0]}`}

// ---- The weekly turn ----
// Order: pay the week that just ended (royalties, living costs), restore energy, move to the next week, run month-start systems when
// a new game-month begins, then close any calendar month that has fully passed into a statement.
function nextWeek(){
  if(!s||s.event||s.retired)return;
  if(s.pressDesk?.active)return say('Finish your current interview in Press & interviews before advancing.');
  if(s.weekStart===undefined)Object.assign(s,calendarFieldsFor(s));
  ensureLedger();
  let before={weekStart:s.weekStart,weekNum:s.weekNum||0,ap:s.ap,energy:s.energy,month:s.month,age:age()};
  let unused=Math.max(0,Math.min(ACTIONS_PER_WEEK,s.ap)),gain=unused*ENERGY_PER_UNUSED_ACTION+WEEKLY_FLAT_ENERGY;
  if(s.lastPaidWeek!==before.weekStart){
    ledgerSweep('actions','This week’s activities');
    runWeeklyCharts(before.weekStart);postWeeklyRoyalties(before.weekStart);chargeLivingCosts(before.weekStart);s.lastPaidWeek=before.weekStart}
  s.energy=Math.min(100,s.energy+gain);
  s.weekStart+=7;s.weekNum=(s.weekNum||0)+1;s.ap=ACTIONS_PER_WEEK;
  processWeeklyFanCampaigns();dripFanFlows();
  let newMonth=gameMonthOfWeek(s.weekStart)>s.month;
  if(newMonth){
    s.ledgerClock=s.weekStart+6;
    try{next()}finally{s.ledgerClock=null}
    ledgerSweep('other','Month-start items',s.weekStart+6);
    if(s.month<gameMonthOfWeek(s.weekStart)){
      Object.assign(s,{weekStart:before.weekStart,weekNum:before.weekNum,ap:before.ap,energy:before.energy});
      return}}
  finalizeStatements();
  weeklyAgeEvents(before.age);
  if(!newMonth)say(`${weekRangeLabel()}: a new week begins. Unused actions restored ${gain} energy.`)}
function weeklyAgeEvents(previousAge){
  let a=age();if(a<=previousAge)return;
  log('Happy birthday',`You turned ${a} on ${birthdayLabel()}.`);
  if(a===14&&previousAge===13)log('A new door opens','You can now release albums and plan tours with guardian support.');
  if(a===18&&previousAge===17)log('A more independent life','Monthly living costs are now $180.')}

// ---- New games and migration from monthly saves (v2) ----
function calendarFieldsFor(state){
  let ws=firstWeekStartOfMonthFor(state.startYear,state.month||0);
  return {weekStart:ws,weekNum:Math.round((ws-initialWeekStartFor(state.startYear))/7),birthDay:state.birthDay??1}}
function migrateToWeekly(x){
  let old=x.s;if(old.v!==2)return x;
  try{let k=localStorage;if(!k.getItem(PRE_WEEKLY_BACKUP_KEY))k.setItem(PRE_WEEKLY_BACKUP_KEY,JSON.stringify({savedAt:Date.now(),snapshot:x}))}catch{}
  Object.assign(old,calendarFieldsFor(old));
  old.birthDayPrompt=true;old.v=3;
  old.log.unshift({month:old.month,title:'A new rhythm',text:'Your save moved from monthly to weekly play. Each week has 5 actions. Monthly statements, royalties and charts still update when a new month begins. Your birthday was assumed to fall on the 1st until you confirm the day.'});
  return x}
function restorePreWeeklyBackup(){
  try{let raw=localStorage.getItem(PRE_WEEKLY_BACKUP_KEY);if(!raw)return modal('<h2>No pre-weekly backup found</h2><p>This browser has no saved copy from before the weekly update.</p><button onclick="closeModal()">Close</button>');
    let x=JSON.parse(raw).snapshot;validateSave(x);s=x.s;ensureCareer();draft=x.draft;tourDraft=x.tourDraft||{title:'',album:'',cities:[],venue:0,ticket:25};tab='life';
    s.v=2;delete s.weekStart;delete s.weekNum;delete s.birthDay;delete s.birthDayPrompt;
    notice='Restored your save from before the weekly update (monthly play).';render()}
  catch{modal('<h2>Could not restore</h2><p>The backup could not be read. Your current game has not been changed.</p><button onclick="closeModal()">Close</button>')}}

// ---- One-time birthday-day question for upgraded saves ----
function promptBirthDay(){
  s.birthDayPrompt=false;
  modal(`<h2>Weekly play</h2><p>Your game now runs week by week on real dates. Which day of the month is your birthday? Your birth month is ${MONTHS[s.birthMonth??0]}.</p><label>Birth day<input type="number" id="birthDayInput" min="1" max="31" value="${s.birthDay??1}"></label><div class="actions"><button class="primary" onclick="confirmBirthDay()">Confirm</button><button onclick="closeModal()">Keep the 1st</button></div>`)}
function confirmBirthDay(){
  let d=Number($('birthDayInput').value),by=s.birthYear??(s.startYear-s.startAge),bm=s.birthMonth??0;
  if(!Number.isInteger(d)||d<1||d>daysInMonth(by,bm)){$('birthDayInput').value=1;return}
  s.birthDay=d;closeModal();say(`Birthday set to ${birthdayLabel()}.`)}
(function(){
  let baseRender=render;
  render=function(){if(s&&typeof ensureLedger==='function')ensureLedger();baseRender.apply(this,arguments);if(s&&s.birthDayPrompt&&!$('modal').open)promptBirthDay()}})();
