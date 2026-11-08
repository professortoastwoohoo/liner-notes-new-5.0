'use strict';
// ===== Production: from idea to master =====
// Every new song moves through five stages before it can be released: write, demo, record, mix, master.
// Each stage is one session (one action) that covers several songs, with a real choice of who does the work.
// Writing and recording are separate activities. Artists who do not write their own songs can bring in outside songwriters,
// who keep the writing royalties. Professional mixing and mastering take about a week to come back.
// Songs already in a draft when this update arrived are treated as finished recordings and are not held up.
const PROD_STAGES=['idea','written','demoed','recorded','mixed','mastered'];
const PROD_BATCH={write:3,demo:4,record:4,mix:4,master:6};
const PROD_ENERGY={write:6,demo:5,record:10,mix:4,master:3};
const SONG_TIERS=[
 {name:'Emerging songwriter',cost:150,q:[48,62],rep:0},
 {name:'Established songwriter',cost:900,q:[60,76],rep:25},
 {name:'Hit songwriter',cost:4000,q:[72,90],rep:50}];
const DEMO_TIERS=[
 {name:'Home demo',cost:0,read:12,bonus:[0,0],weeks:0},
 {name:'Small-studio demo',cost:120,read:5,bonus:[0,2],weeks:0}];
const MIX_TIERS=[
 {name:'Mix it yourself',cost:0,base:-2,self:true,weeks:0},
 {name:'Studio engineer',cost:400,base:2,weeks:1},
 {name:'Top mixer',cost:1800,base:4,weeks:1}];
const MASTER_TIERS=[
 {name:'Master it yourself',cost:0,base:-1,weeks:0},
 {name:'Mastering house',cost:250,base:2,weeks:1},
 {name:'Top mastering engineer',cost:1200,base:3,weeks:1}];
const STAGE_FROM={write:'idea',demo:'written',record:'demoed',mix:'recorded',master:'mixed'};
const STAGE_TO={write:'written',demo:'demoed',record:'recorded',mix:'mixed',master:'mastered'};
const STAGE_LABEL={idea:'Idea',written:'Written',demoed:'Demoed',recorded:'Recorded',mixed:'Mixed',mastered:'Mastered'};

function pipelineTracks(){return draft.tracks.filter(t=>t.stage&&!releasedDraftTrack(t))}
function trackReleaseReady(t){return !t.stage||releasedDraftTrack(t)||(t.stage==='mastered'&&(t.readyWeek||0)<=(s.weekNum||0))}
function prodChoice(){return draft.prod||(draft.prod={write:0,demo:0,mix:1,master:1,mode:s.writesOwn===false?'outside':'self'})}
function setProd(key,value){prodChoice()[key]=value;studio()}
function setWritesOwn(on){s.writesOwn=!!on;if(!on)prodChoice().mode='outside';studio()}
function nextTracks(stage){return pipelineTracks().filter(t=>t.stage===STAGE_FROM[stage]&&(t.readyWeek||0)<=(s.weekNum||0)).slice(0,PROD_BATCH[stage])}
function pipelineQuality(){let list=draft.tracks.filter(t=>t.pq!==undefined&&!releasedDraftTrack(t));return list.length?Math.round(list.reduce((n,t)=>n+t.pq,0)/list.length):null}
function songReadLabel(n){return n>=75?'a standout':n>=62?'strong':n>=48?'solid':n>=35?'needs work':'weak'}
function outsideWriterName(tier){
  try{let pool=creativeRoster('writer').filter(creativeUnlocked);if(pool.length){pool.sort((a,b)=>b.rep-a.rep);let n=pool.length,slice=tier===2?pool.slice(0,Math.ceil(n/3)):tier===1?pool.slice(Math.floor(n/4),Math.ceil(n*.75)):pool.slice(Math.floor(n/2));return pick(slice.length?slice:pool).name}}catch{}
  return 'an outside songwriter'}
function scrapTrack(i){let t=draft.tracks[i];if(!t||releasedDraftTrack(t))return;draft.tracks.splice(i,1);if(draft.lead>=draft.tracks.length)draft.lead=Math.max(0,draft.tracks.length-1);studio()}

// One session: spends an action and the energy, pays any fees (a label may fund them), and moves up to a batch of songs on a stage.
function runProduction(stage){
  if(!s||s.retired||age()<14)return;
  let tracks=nextTracks(stage);
  if(!tracks.length)return say(`No songs are ready for ${stage==='write'?'writing':stage}. Songs come back from professional mixing and mastering about a week after you book them.`);
  let p=prodChoice(),tier,perSong=0,self=false;
  if(stage==='write'){
    if(p.mode==='self'&&s.writesOwn===false)p.mode='outside';
    self=p.mode==='self';tier=SONG_TIERS[Math.min(p.write,SONG_TIERS.length-1)];
    if(!self&&s.rep<tier.rep)return say(`${tier.name}s only work with artists who have ${tier.rep}+ reputation.`);
    perSong=self?0:tier.cost}
  else if(stage==='demo'){tier=DEMO_TIERS[Math.min(p.demo,DEMO_TIERS.length-1)];perSong=tier.cost}
  else if(stage==='mix'){tier=MIX_TIERS[Math.min(p.mix,MIX_TIERS.length-1)];perSong=tier.cost}
  else if(stage==='master'){tier=MASTER_TIERS[Math.min(p.master,MASTER_TIERS.length-1)];perSong=tier.cost}
  let cost=perSong*tracks.length,funding=labelProjectFunding(cost),energy=PROD_ENERGY[stage]-(stage==='write'&&!self?4:0);
  if(!canAct(funding.cash,energy))return;
  let results=[];
  for(let t of tracks){
    if(stage==='write'){
      if(self){t.source='self';t.songQ=Math.round(cap(s.craft*.5+Math.min(30,s.prep*.3)+rnd(5,18),20,95))}
      else{t.source='outside';t.writer=outsideWriterName(Math.min(p.write,2));t.songQ=Math.round(cap(rnd(tier.q[0],tier.q[1])+(s.rep>60?2:0),20,95))}}
    else if(stage==='demo'){t.readQ=Math.round(t.songQ+rnd(-tier.read,tier.read));t.demoB=rnd(tier.bonus[0],tier.bonus[1]);results.push(`${t.title}: ${songReadLabel(t.readQ)}`)}
    else if(stage==='record'){t.recQ=Math.round(cap(recordingQuality(draft.budget)+rnd(-3,3),20,98))}
    else if(stage==='mix'){
      let b=tier.base+(tier.self?Math.round((s.craft-30)/35):0)+rnd(-1,2);
      if(tier.self&&Math.random()<.12){b-=3;results.push(`${t.title}: the mix did not come together`)}
      t.mixB=b;t.readyWeek=(s.weekNum||0)+tier.weeks}
    else if(stage==='master'){
      t.masterB=tier.base+rnd(tier.weeks?-1:0,tier.weeks?1:2);t.readyWeek=(s.weekNum||0)+tier.weeks;
      t.pq=Math.round(cap(.35*t.songQ+.65*t.recQ+(t.demoB||0)+(t.mixB||0)+t.masterB,15,99))}
    t.stage=STAGE_TO[stage]}
  useLabelFunding(funding,draft.title||'Current project');
  s.ap--;change({cash:-funding.cash,energy:-energy});
  let names=tracks.map(t=>t.title).join(', '),wait=(tier?.weeks&&(stage==='mix'||stage==='master'))?` ${tracks.length>1?'They are':'It is'} back in ${tier.weeks} week.`:'';
  let verb={write:self?'Wrote':'Brought in',demo:'Demoed',record:'Recorded',mix:'Mixed',master:'Mastered'}[stage];
  log('Studio session',`${verb} ${names}${perSong?` (${cashExact(cost)}${funding.credit?`, ${cashExact(funding.credit)} from label funds`:''})`:''}.${results.length?' '+results.join('. ')+'.':''}${wait}`);
  say(`${verb} ${tracks.length} song${tracks.length>1?'s':''}.${results.length?' '+results.join('. ')+'.':''}${wait}`);
  studio()}

function tierSelect(key,list,current,note=t=>''){return `<select onchange="setProd('${key}',Number(this.value))">${list.map((t,i)=>`<option value="${i}" ${current===i?'selected':''}>${t.name}${t.cost?' · '+cashExact(t.cost)+' a song':' · free'}${note(t)}</option>`).join('')}</select>`}
function productionStudioHTML(){
  let tracks=pipelineTracks();
  if(!tracks.length&&!draft.tracks.some(t=>t.stage))return `<div class="card"><h3>Production</h3><p class="footnote">New songs you add to this project go through writing, a demo, recording, mixing and mastering before release. Existing recordings are not held up.</p></div>`;
  let p=prodChoice(),by=st=>nextTracks(st).length,wait=tracks.filter(t=>(t.readyWeek||0)>(s.weekNum||0)).length,
    btn=(stage,label)=>`<button ${by(stage)?'':'disabled'} onclick="runProduction('${stage}')">${label}${by(stage)?` · ${by(stage)} song${by(stage)>1?'s':''} · 1 action`:' · nothing ready'}</button>`;
  return `<div class="card"><h3>Production</h3><p class="footnote">Writing and recording are separate. Each session is one action and covers several songs. Professional mixing and mastering take about a week to come back. Songs already in a draft before this update are treated as finished recordings.</p>
  <div class="row wrap"><label class="check"><input type="checkbox" ${s.writesOwn===false?'':'checked'} onchange="setWritesOwn(this.checked)"> I write my own songs</label></div>
  <div class="scroll"><table><tr><th>#</th><th>Song</th><th>Stage</th><th>Notes</th><th></th></tr>${draft.tracks.map((t,i)=>{if(!t.stage||releasedDraftTrack(t))return '';let note=[t.source==='outside'?'by '+esc(t.writer||'an outside songwriter'):t.source==='self'?'written by you':'',t.readQ!==undefined&&t.stage!=='mastered'?'demo: '+songReadLabel(t.readQ):'',t.stage==='mastered'?(trackReleaseReady(t)?'ready · quality about '+t.pq:'mastering back in '+Math.max(1,(t.readyWeek||0)-(s.weekNum||0))+' wk'):(t.readyWeek||0)>(s.weekNum||0)?'back in '+Math.max(1,t.readyWeek-(s.weekNum||0))+' wk':''].filter(Boolean).join(' · ');return `<tr><td>${i+1}</td><td>${esc(t.title)}</td><td><span class="pill">${STAGE_LABEL[t.stage]}</span></td><td>${note}</td><td><button class="ghost compact" onclick="scrapTrack(${i})">Scrap</button></td></tr>`}).join('')}</table></div>
  <div class="grid">
   <div><b>1 · Songwriting</b><p class="footnote">Write them yourself or bring in an outside songwriter, who keeps the writing royalties.</p>${s.writesOwn===false?'':`<label class="check"><input type="radio" name="wmode" ${p.mode==='self'?'checked':''} onchange="setProd('mode','self')"> Write them myself · free</label>`}<label class="check"><input type="radio" name="wmode" ${p.mode==='outside'||s.writesOwn===false?'checked':''} onchange="setProd('mode','outside')"> Outside songwriter</label>${p.mode==='outside'||s.writesOwn===false?tierSelect('write',SONG_TIERS,p.write,t=>t.rep?` · ${t.rep}+ rep`:''):''}${btn('write','Write')}</div>
   <div><b>2 · Demo</b><p class="footnote">Hear a song before you commit. You can scrap weak ones.</p>${tierSelect('demo',DEMO_TIERS,p.demo)}${btn('demo','Record demos')}</div>
   <div><b>3 · Recording</b><p class="footnote">Uses the recording budget above and your craft, voice and energy.</p>${btn('record','Record')}</div>
   <div><b>4 · Mixing</b><p class="footnote">${wait?wait+' song(s) waiting on professionals.':'Self-mixing is free but risky.'}</p>${tierSelect('mix',MIX_TIERS,p.mix)}${btn('mix','Mix')}</div>
   <div><b>5 · Mastering</b><p class="footnote">The final polish before release.</p>${tierSelect('master',MASTER_TIERS,p.master)}${btn('master','Master')}</div>
  </div></div>`}
