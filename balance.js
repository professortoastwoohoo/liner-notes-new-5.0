'use strict';
// ===== Balance pass: whole-number action effects, and life events paced like actions =====
// Loaded after calendar.js (which paces the actions) and before ledger.js (which wraps money functions), so wrapping makeEvent/ensureCareer here is safe.
//
// 1) Actions: the weekly pacing multiplied action effects by 0.25, which left things like "Craft +0.8" on the buttons. Each of those is now
//    a whole number. Effects that would round to +1 from only +0.5 were dropped instead of doubled, so weekly progress stays about the same.
// 2) Events: the weekly pacing never touched life events, so one event could be worth dozens of actions (e.g. +80 fans against about 10 for a show).
//    Event stat rewards and penalties now scale by EVENT_STAT_PACE, fan rewards by EVENT_FAN_PACE and cash windfalls by EVENT_CASH_PACE.
//    Energy, happiness and money costs are left exactly as designed, like the action pacing. Tune the three numbers below to taste.
const EVENT_STAT_PACE=.4,EVENT_FAN_PACE=.3,EVENT_CASH_PACE=1/3;
const EVENT_PACED_STATS=['craft','voice','prep','promo','rep','buzz'];
// Story and business systems keep their own balance (their real payouts run through effect hooks).
const EVENT_UNPACED_ID=/^(chapter-|writing-|world-|rollout-|major-)/;

(function wholeNumberActions(){
  const fix={write:{craft:1},lesson:{craft:1,voice:1},produce:{craft:null},cowrite:{prep:3,craft:1},listen:{craft:null,prep:1},network:{rep:1},journal:{prep:1}};// null = drop
  for(let [id,changes] of Object.entries(fix)){
    let a=ACTIONS.find(x=>x[0]===id);if(!a||!a[6])continue;
    for(let [k,v] of Object.entries(changes)){if(v===null)delete a[6][k];else a[6][k]=v}
    a[2]=(a[4]>0?'$'+a[4]+' · ':'')+Object.entries(a[6]).map(([k,v])=>`${STAT_LABELS[k]} ${v<0?'−':'+'}${fmtEffect(Math.abs(v))}`).join(' · ')}
  // Busking still gives a small hidden performance bump; it is no longer advertised as a decimal.
  let busk=ACTIONS.find(x=>x[0]==='busk');if(busk)busk[2]=`Earn $${Math.round(60*ACTION_PAY_PACE)}–$${Math.round(140*ACTION_PAY_PACE)} · Energy −12`})();

function pacedEventValue(key,n){
  if(!Number.isFinite(n)||n===0)return n;
  if(EVENT_PACED_STATS.includes(key))return Math.sign(n)*Math.max(1,Math.round(Math.abs(n)*EVENT_STAT_PACE));
  if(key==='fans')return Math.sign(n)*Math.max(1,Math.round(Math.abs(n)*EVENT_FAN_PACE));
  if(key==='cash'&&n>0)return Math.max(5,Math.round(n*EVENT_CASH_PACE/5)*5);// windfalls only; costs and fees are left alone
  return n}
const EVENT_HINT_KEYS={craft:'craft',performance:'voice',voice:'voice',preparation:'prep',prep:'prep',campaign:'promo',promo:'promo',reputation:'rep',rep:'rep',attention:'buzz',buzz:'buzz',fans:'fans'};
// Rewrites the numbers in an option's hint text ("Craft +3 · Fans +25") so they match the paced values.
function pacedEventHint(hint,before,after){
  return String(hint).split(' · ').map(seg=>{
    let m=seg.match(/^(Craft|Performance|Preparation|Campaign|Reputation|Attention|Fans|craft|voice|prep|rep|buzz|promo)( [+−-])(\d+)(.*)$/i);
    if(m){let key=EVENT_HINT_KEYS[m[1].toLowerCase()];return key&&before[key]!==undefined&&after[key]!==undefined?`${m[1]}${m[2]}${Math.abs(after[key])}${m[4]}`:seg}
    m=seg.match(/^(Money|Cash) \+\$(\d+)(.*)$/);
    if(m&&before.cash>0&&after.cash>0)return `${m[1]} +$${after.cash}${m[3]}`;
    return seg}).join(' · ')}
function rebalanceEvent(e){
  if(!e||e.paced||!Array.isArray(e.options))return;
  e.paced=true;
  if(e.major||e.chapterContext||e.chapterGate||e.rolloutAlbum||EVENT_UNPACED_ID.test(String(e.id)))return;
  for(let o of e.options){
    if(!o.v)continue;
    let before={...o.v},after={};
    for(let [k,n] of Object.entries(before))after[k]=pacedEventValue(k,n);
    o.v=after;
    if(typeof o.hint==='string')o.hint=pacedEventHint(o.hint,before,after)}}
// Every event passes through makeEvent; ensureCareer also catches an event already open in an older save.
const balanceEnsureBase=ensureCareer;ensureCareer=function(){let r=balanceEnsureBase.apply(this,arguments);if(s)rebalanceEvent(s.event);return r};
const balanceMakeEventBase=makeEvent;makeEvent=function(){let r=balanceMakeEventBase.apply(this,arguments);if(s)rebalanceEvent(s.event);return r};
