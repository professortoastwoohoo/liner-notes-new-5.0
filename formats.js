'use strict';
// ===== Release formats =====
// Physical and download formats appear when they historically did. Streaming is not a format you pick: it is automatic where services exist.
// All consumption the game already generates is split between streaming and the formats you released on. Each format pays its own
// revenue per unit, so one framework covers vinyl, cassette, CD, downloads and streams. The buying mix is a simplified picture of industry history.
// Money values are in game dollars; scaling them by era comes with the economy update.
const RELEASE_FORMATS=[
 {id:'vinyl',name:'Vinyl',from:1960,cost:1800,rate:.0072},
 {id:'cassette',name:'Cassette',from:1965,cost:900,rate:.0040},
 {id:'cd',name:'CD',from:1983,cost:1400,rate:.0064},
 {id:'download',name:'Digital download',from:2003,cost:0,rate:.0056}];
// Share of non-streaming buying by year: [vinyl, cassette, CD, download].
const FORMAT_ANCHORS=[
 [1960,[1,0,0,0]],[1968,[.98,.02,0,0]],[1975,[.80,.20,0,0]],[1982,[.62,.38,0,0]],[1986,[.30,.45,.25,0]],[1990,[.07,.53,.40,0]],
 [1995,[.03,.27,.70,0]],[2000,[.02,.07,.91,0]],[2004,[.025,.01,.93,.035]],[2008,[.035,.005,.66,.30]],[2012,[.06,.003,.44,.50]],
 [2016,[.12,.005,.34,.535]],[2020,[.28,.02,.30,.40]],[2026,[.36,.03,.28,.33]]];
const UNSELECTED_REACH=.45,FORMAT_ALBUM_UNIT=1250;
const KIND_PRESSING_FACTOR={album:1,ep:.7,single:.4};

function formatAvailable(f,y){return y>=f.from}
function availableFormats(y=year()){return RELEASE_FORMATS.filter(f=>formatAvailable(f,y))}
// Buying mix among formats that exist in year y (sums to 1, or all zero if none exist).
function formatMix(y=year()){
  let a=FORMAT_ANCHORS,i=a.findIndex(x=>x[0]>y),lo,hi;
  if(i===-1){lo=hi=a[a.length-1]}else if(i===0){lo=hi=a[0]}else{lo=a[i-1];hi=a[i]}
  let t=lo===hi?0:(y-lo[0])/(hi[0]-lo[0]),mix={},sum=0;
  RELEASE_FORMATS.forEach((f,k)=>{let v=formatAvailable(f,y)?lo[1][k]+(hi[1][k]-lo[1][k])*t:0;mix[f.id]=v;sum+=v});
  if(sum>0)for(let f of RELEASE_FORMATS)mix[f.id]/=sum;
  return mix}
function exactYear(){return year()+((s&&s.month!==undefined?s.month%12:0)/12)}
// Formats worth pressing by default: those that still carry a meaningful share of buying.
function defaultFormats(y=exactYear()){let mix=formatMix(y);return RELEASE_FORMATS.filter(f=>mix[f.id]>=.15).map(f=>f.id)}
function draftFormats(){
  if(!Array.isArray(draft.formats)||draft.formatsYear!==year()){draft.formats=defaultFormats();draft.formatsYear=year()}
  draft.formats=draft.formats.filter(id=>availableFormats().some(f=>f.id===id));
  return draft.formats}
function toggleFormat(id,on){let list=new Set(draftFormats());on?list.add(id):list.delete(id);draft.formats=[...list];studio()}
function formatRunCost(d=draft){return Math.round(draftFormats().reduce((n,id)=>n+(RELEASE_FORMATS.find(f=>f.id===id)?.cost||0),0)*(KIND_PRESSING_FACTOR[d.kind]??1))}
// The formats a released record is sold in. Records from before this update, and reissues, use the formats that were standard when they came out.
function releaseFormatsOf(a){
  let y=a.month!==undefined&&s?year(a.month):year(),list=Array.isArray(a.formats)?a.formats:defaultFormats(y+((a.month||0)%12)/12);
  return list.filter(id=>RELEASE_FORMATS.some(f=>f.id===id))}
function streamShareNow(){
  if(typeof digitalListeningShares!=='function')return 0;
  return Math.min(1,Object.values(digitalListeningShares()).reduce((n,v)=>n+v,0))}
// Splits this week's (or month's) consumption of a release between streaming and the formats it was released on.
// Formats you did not release on still reach some of their buyers (UNSELECTED_REACH); the rest of that buying is lost.
// Buying is scaled by the era (eraPurchaseIntensity in sales-eras.js): before streaming a fan who buys is worth far more than one who streams.
function formatSplit(a,consumption){
  let ss=streamShareNow(),mix=formatMix(exactYear()),chosen=new Set(releaseFormatsOf(a)),chosenShare=0;
  for(let f of RELEASE_FORMATS)if(chosen.has(f.id)&&mix[f.id])chosenShare+=mix[f.id];
  let physicalReach=chosenShare+UNSELECTED_REACH*(1-chosenShare),
    streams=consumption*ss,physical=consumption*(1-ss)*physicalReach*eraPurchaseIntensity()*purchaseTiming(a),sales={},revenue=consumption*ss*RATE_MASTER,units=0;
  if(ss>0)sales.streaming={units:streams/FORMAT_ALBUM_UNIT,revenue:streams*RATE_MASTER,consumption:streams};
  if(chosenShare>0){
    for(let f of RELEASE_FORMATS)if(chosen.has(f.id)&&mix[f.id]){
      let cons=physical*mix[f.id]/chosenShare,u=cons/FORMAT_ALBUM_UNIT,r=cons*f.rate;
      sales[f.id]={units:u,revenue:r,consumption:cons};units+=u;revenue+=r}}
  else physical=0;
  let soldConsumption=Object.entries(sales).filter(([k])=>k!=='streaming').reduce((n,[,v])=>n+v.consumption,0);
  return {streams,sales,units,revenue,physicalConsumption:soldConsumption,effective:revenue/RATE_MASTER,streamShare:ss}}
function formatName(id){return id==='streaming'?'Streaming':RELEASE_FORMATS.find(f=>f.id===id)?.name||id}
function formatsOkToRelease(){return draftFormats().length>0||streamShareNow()>0}
