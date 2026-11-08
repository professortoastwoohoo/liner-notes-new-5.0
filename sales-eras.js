'use strict';
// ===== Era sales: believable purchase volumes before streaming, one set of sales numbers, and steadier fan growth =====
//
// The game's listening engine produces one "consumption" number per release (it used to be called streams). It is tuned for streaming:
// 1,250 plays are worth one album sale. Before streaming, fans bought records instead, and a fan who buys pays roughly 30-50 times what a
// fan who streams does. Without that, a 50,000-fan artist in 2002 sold a few hundred CDs a month. ERA_SALES_ANCHORS says how many times
// stronger purchasing is than the streaming-era baseline; it fades to 1 by 2020, so modern-era numbers are unchanged.
// The same factor scales the chart market (awards-charts.js), so ranks stay comparable across eras while the numbers become era-sized.
// Set ERA_SALES_STRENGTH between 0 (old numbers) and 1 (full effect) to soften the whole thing.
const ERA_SALES_STRENGTH=1;
const ERA_SALES_ANCHORS=[[1960,32],[2000,32],[2002,29],[2003,25],[2005,18],[2008,10],[2012,4],[2016,1.8],[2020,1]];
function eraPurchaseIntensity(y){
  if(y===undefined)y=s?exactYear():2026;
  let a=ERA_SALES_ANCHORS,v;
  if(y<=a[0][0])v=a[0][1];
  else if(y>=a[a.length-1][0])v=a[a.length-1][1];
  else{let i=a.findIndex(x=>x[0]>y),lo=a[i-1],hi=a[i];v=lo[1]+(hi[1]-lo[1])*(y-lo[0])/(hi[0]-lo[0])}
  return 1+(v-1)*ERA_SALES_STRENGTH}

// Buying is front-loaded: most copies sell in the first weeks, then a long tail. The listening engine instead lets some albums keep growing for
// months (a streaming-style slow burn), so for purchases that ramp is cancelled and a faster fade is applied. It only matters while buying is strong
// (it fades out with eraPurchaseIntensity), so streaming-era numbers are untouched.
const PURCHASE_FLOOR=.35,PURCHASE_MONTHLY_FADE=.62;
function purchaseTiming(a){
  let intensity=eraPurchaseIntensity();if(intensity<=1.001||!a||a.month===undefined)return 1;
  let w=Math.min(1,(intensity-1)/10),mo=Math.max(0,(chartAt()-firstWeekStartOfMonth(a.month))/30.44),p=a.audience,
    ramp=p&&p.peak>0?1+(Math.max(1,p.lift)-1)*Math.pow(Math.min(1,mo/p.peak),1.25):1,
    shape=(PURCHASE_FLOOR+(1-PURCHASE_FLOOR)*Math.pow(PURCHASE_MONTHLY_FADE,mo))/ramp;
  return 1+(shape-1)*w}

// The most plays a release can earn in its opening month. The old 60-million ceiling was set for streaming; where buying is strong each play is worth far more,
// so the ceiling rises with the era (it only ever binds for the very biggest artists).
function playsCap(){return 60000000*Math.max(1,(s?eraPurchaseIntensity():1)/4)}

// ---- One set of numbers: official sales ----
// Sales are measured once a week, by the weekly chart (runWeeklyCharts), and everything else reads that same number:
//  - an ALBUM's copies are album purchases. They are not a sum of song sales;
//  - only SINGLES have sales of their own. A non-single album track is sold as part of the album and has none;
//  - the chart, the album and song pages, the monthly statement and the royalty payment all use the same weekly figures.
// Of everything bought, ERA_SINGLE_SHARE is the share that buys a single (45s and CD singles, then 99-cent downloads) rather than the album.
// Total money is unchanged: a single's sales are carved out of the same pool of purchases, in proportion to that single's plays.
// Streaming eras still count every track's streams toward the album, as before.
const ERA_SINGLE_SHARE=[[1960,.30],[1980,.25],[1990,.12],[2000,.08],[2003,.15],[2005,.35],[2008,.45],[2012,.45],[2016,.30],[2020,.15]];
function eraSingleShare(y){
  if(y===undefined)y=s?exactYear():2026;
  let a=ERA_SINGLE_SHARE;
  if(y<=a[0][0])return a[0][1];
  if(y>=a[a.length-1][0])return a[a.length-1][1];
  let i=a.findIndex(x=>x[0]>y),lo=a[i-1],hi=a[i];
  return lo[1]+(hi[1]-lo[1])*(y-lo[0])/(hi[0]-lo[0])}
// A song's own purchases are only ERA_SINGLE_SHARE of what is bought, so its chart units are lower than when every purchase counted toward it.
// The song chart's market is scaled by the same ratio, so singles compete exactly as before. In streaming eras (where streams dominate) it is close to 1.
function songUnitScale(){
  let ss=streamShareNow(),i=eraPurchaseIntensity(),q=eraSingleShare();
  return (ss+(1-ss)*i*q)/(ss+(1-ss)*i)}
const physicalUnitsOf=sales=>Object.entries(sales||{}).filter(([k])=>k!=='streaming').reduce((n,[,v])=>n+(v.units||0),0);
const noStreamingYet=()=>typeof streamShareNow==='function'&&streamShareNow()===0;
const physicalCons=split=>Object.fromEntries(Object.entries(split.sales).filter(([k])=>k!=='streaming').map(([k,v])=>[k,v.consumption]));
const sumVals=o=>Object.values(o).reduce((n,v)=>n+v,0);
// What the album itself bought in a week, by format (in play-equivalents): all purchases, less the share its charted singles sold on their own.
function albumPurchases(a,streams,ws){
  let by=physicalCons(formatSplit(a,streams));
  for(let t of a.tracks){let c=t.weekChart;if(c&&c.ws===ws)for(let [f,v] of Object.entries(trackPurchases(a,t,c.raw)))by[f]=Math.max(0,(by[f]||0)-v)}
  return by}
// What a song sold on its own, by format. A single sells in every format; an album track can only be bought one at a time as a download.
function trackPurchases(a,t,streams){
  let q=eraSingleShare(),out={};
  for(let [f,v] of Object.entries(physicalCons(formatSplit(a,streams))))if(t.single||f==='download')out[f]=v*q;
  return out}
// Splits the whole number shown on the chart across formats so the formats always add up to it (largest remainder).
function shownFormats(cons,ratio,m,total){
  let ents=Object.entries(cons).map(([k,v])=>[k,v/ratio*m]),sum=ents.reduce((n,[,v])=>n+v,0),out={};
  if(!ents.length)return out;
  let parts=ents.map(([k,v])=>{let x=sum>0?v*total/sum:0;return [k,Math.floor(x),x-Math.floor(x)]}),left=total-parts.reduce((n,p)=>n+p[1],0);
  [...parts].sort((a,b)=>b[2]-a[2]).slice(0,Math.max(0,left)).forEach(p=>p[1]++);
  for(let [k,n] of parts)out[k]=n;
  return out}
// What a copy is typically worth in plays at the current era, used only for estimates (a release's first month, saves from before this ledger).
function copiesPerPlay(a){try{return a?physicalUnitsOf(formatSplit(a,1000).sales)/1000:0}catch{return 0}}
function ensureSales(work,type,album){
  if(work.sales)return work.sales;
  if(s.salesSince===undefined)s.salesSince=s.month;
  let rel=type==='album'?album.month:(work.released??album.month),old=rel<s.salesSince,est=0;
  if(old){// a work from before the ledger existed: start from an estimate of what it has sold
    let cpp=copiesPerPlay(album),q=eraSingleShare(rel);
    est=type==='album'?(album.total||0)*cpp*(1-q*.8):(work.total||0)*cpp*q*FORMAT_ALBUM_UNIT/STREAMS_PER_SONG_SALE}
  return work.sales={copies:Math.round(est),fmt:{},months:{},weeks:0,estimated:old}}
function recordOfficialSales(work,type,album,gm,e){
  let S=ensureSales(work,type,album);
  S.copies+=e.sales;S.weeks++;S.months[gm]=(S.months[gm]||0)+e.sales;
  for(let [f,u] of Object.entries(e.fmt||{}))S.fmt[f]=(S.fmt[f]||0)+u}
const albumCopies=a=>ensureSales(a,'album',a).copies;
const singleCopies=(a,t)=>ensureSales(t,'song',a).copies;
const copiesThisMonth=w=>(w.sales&&w.sales.months&&w.sales.months[s.month])||0;
// Rough share of a release's first-month plays that turn into album copies (only for the estimate shown at release).
const LAUNCH_COLLECTION_SHARE=.92;
function albumLifetimeHTML(a){
  let copies=albumCopies(a);
  if(noStreamingYet())return `<b>${num(copies)}</b> copies sold`;
  return `<b>${num(a.total)}</b> lifetime streams${copies>0?` · ${num(copies)} copies sold`:''}`}
function trackLineText(a,t){
  let peak=t.chart?'#'+t.chart:'uncharted';
  if(noStreamingYet()){
    if(t.single){let n=singleCopies(a,t);return `${MONTHS[t.released%12]} ${year(t.released)} · ${num(copiesThisMonth(t))} this month · ${num(n)} copies sold · Song peak ${peak}`}
    let n=t.sales?t.sales.copies:0;return `Album / EP track · ${n>0?num(n)+' downloads sold':'sold as part of the album'}${t.chart?' · Song peak #'+t.chart:''}`}
  return t.single?`${MONTHS[t.released%12]} ${year(t.released)} · ${num(currentTrackStreams(t))} this month · ${num(t.total)} lifetime streams · Song peak ${peak}`:`Album / EP track · ${num(currentTrackStreams(t))} this month · ${num(t.total||0)} lifetime streams · Song peak ${peak}`}
// Used by the highlights lists: an album's or a single's lifetime figure in the way the era measures it.
function lifetimeText(raw,work,album){
  if(!noStreamingYet())return `${num(raw)} lifetime streams`;
  return `${num(work.tracks?albumCopies(work):singleCopies(album,work))} copies sold`}
function catalogueTotalText(rawTotal){
  if(!noStreamingYet())return `<b>${num(rawTotal)}</b> total catalogue streams`;
  return `<b>${num(s.albums.reduce((n,a)=>n+albumCopies(a),0))}</b> album copies sold`}
function launchText(first,a){
  if(!noStreamingYet())return `${num(first)} newly earned launch streams`;
  return `about ${num(Math.round(first*LAUNCH_COLLECTION_SHARE*copiesPerPlay(a)))} album copies expected in its first month`}
function pendingSalesText(pending){
  if(!noStreamingYet())return `${num(pending)} released streams will be paid in your next weekly royalty. They will not be counted twice.`;
  let copies=s.albums.reduce((n,a)=>n+(a.pendingStreams||0)*LAUNCH_COLLECTION_SHARE*copiesPerPlay(a),0);
  return `About ${num(Math.round(copies))} copies' worth of sales will be paid in your next weekly royalty. They will not be counted twice.`}
// The week's royalty for one album, built from the same official numbers the chart published. The chart's weekly plays and luck/loyalty
// multipliers decide what was sold; the royalty plan only tops it up if it holds more than the chart counted.
function weeklyAlbumRevenue(a,share,weekStart){
  let wc=a.weekChart&&a.weekChart.ws===weekStart?a.weekChart:null,T=wc?wc.raw:share,extra=wc?Math.max(0,share-wc.raw):0;
  if(T+extra<=0)return null;
  let mA=wc?wc.m:1,pool=formatSplit(a,T),top=extra>0?formatSplit(a,extra):null,formats={},
    cons=physicalCons(pool),rate=f=>pool.sales[f].revenue/(pool.sales[f].consumption||1),single={units:0,revenue:0},singleStreams=0;
  for(let t of a.tracks){let c=t.weekChart;if(c&&c.ws===weekStart)
    for(let [f,v] of Object.entries(trackPurchases(a,t,c.raw))){cons[f]=Math.max(0,(cons[f]||0)-v);single.units+=v/STREAMS_PER_SONG_SALE*c.m;single.revenue+=v*rate(f)*c.m}}
  for(let [f,v] of Object.entries(cons))formats[f]={units:v/FORMAT_ALBUM_UNIT*mA,revenue:v*rate(f)*mA};
  if(top)for(let [f,v] of Object.entries(top.sales)){if(f==='streaming')continue;let x=formats[f]||(formats[f]={units:0,revenue:0});x.units+=v.units;x.revenue+=v.revenue}
  let streams=pool.streams*mA+(top?top.streams:0);
  if(streams>0)formats.streaming={units:streams/FORMAT_ALBUM_UNIT,revenue:streams*RATE_MASTER};
  if(wc&&wc.fmt)for(let f of Object.keys(formats))if(f!=='streaming'&&wc.fmt[f]!==undefined)formats[f].units=wc.fmt[f];// whole copies, exactly as charted
  let revenue=Object.values(formats).reduce((n,v)=>n+v.revenue,0)+single.revenue;
  return {fm:{effective:revenue/RATE_MASTER,streams},formats,singles:single}}
// What a sale is worth, per format, so weekly royalties can be checked by hand.
function royaltyRulesHTML(){
  let mix=formatMix(exactYear()),live=availableFormats().filter(f=>mix[f.id]>0),top=live.sort((a,b)=>mix[b.id]-mix[a.id])[0],
    rows=live.map(f=>`${f.name} $${(f.rate*FORMAT_ALBUM_UNIT).toFixed(2)}`).join(' · '),
    writer=top?RATE_WRITER*FORMAT_ALBUM_UNIT*(top.rate/RATE_MASTER):0;
  let sales=`Sales pay by format for each album-equivalent copy (${rows}), plus songwriting income of about $${writer.toFixed(2)} on a ${top?top.name:'copy'}.`,
    lead=streamShareNow()>0?`each payable stream generates $${RATE_MASTER} in recording revenue, split by your contract, plus $${RATE_WRITER} in songwriting income for you. ${sales}`:`each album-equivalent sale earns recording revenue by format (${rows}), split by your contract, plus songwriting income of about $${writer.toFixed(2)} on a ${top?top.name:'copy'}.`;
  return `<div class="notice">Game rules: ${lead} While an advance remains, <b>50% of your recording share is paid to you</b> and up to 50% repays it. These are fixed simulation rates.</div>`}

// ---- Fan growth that arrives week by week ----
// Listening and releases used to hand over their fans in one lump (a jump at release, then almost nothing). They are now planned as flows and
// dripped out weekly: releases land hardest in their first weeks and taper, month-start listening is spread evenly with a small wobble.
const FAN_LISTEN_RATE=.0011,FAN_RELEASE_RATE={album:.0105,ep:.0075,single:.0075},FAN_RELEASE_CAP={album:60000,ep:25000,single:10000};
function planFanFlow(total,weeks,front=false){
  total=Math.round(total);if(!s||!(total>0))return 0;
  (s.fanFlows||(s.fanFlows=[])).push({total,weeks:Math.max(1,weeks),done:0,front:!!front,key:uid('flow')});
  return total}
function dripFanFlows(){
  if(!s||!Array.isArray(s.fanFlows)||!s.fanFlows.length)return 0;
  let gained=0;
  for(let f of s.fanFlows){f.done++;gained+=grow(f.front?frontLoadedShare(f.total,f.weeks,f.done):wobbleShare(f.total,f.weeks,f.done,f.key))}
  s.fanFlows=s.fanFlows.filter(f=>f.done<f.weeks);
  return gained}
function planListeningGrowth(streams){return planFanFlow(Math.min(15000,streams*FAN_LISTEN_RATE),weeksInGameMonth(s.month))}
// A release brings fans in proportion to how much it is heard and how good it is (quality 70 is par).
function planReleaseGrowth(first,quality,kind='album'){
  let k=FAN_RELEASE_RATE[kind]??FAN_RELEASE_RATE.album,cap_=FAN_RELEASE_CAP[kind]??FAN_RELEASE_CAP.album;
  return planFanFlow(Math.min(cap_,first*k*Math.pow(Math.max(20,quality||70)/70,1.3)),kind==='single'?4:6,true)}
