'use strict';
// Liner Notes 2.4: additive career records; existing streams, finances and relationships remain authoritative.
const CHAPTER_DIRECTIONS={evolution:'Gradual evolution',reinvention:'Major reinvention',roots:'Return to roots',experimental:'Experimental direction'};
function ensureChapters(){
 if(!s.chapters)s.chapters={since:s.month,processed:s.month,hiatus:null,returning:null,history:[],competition:[],resolved:{},lastNarrative:-100,lastPolitics:-100};
 let d=s.chapters;d.history??=[];d.competition??=[];d.resolved??={};d.processed??=s.month;d.lastNarrative??=-100;d.lastPolitics??=-100;d.hiatus??=null;d.returning??=null;return d;
}
function chapterProject(id=draft.id){return [draft,...(s.savedProjects||[])].find(a=>a.id===id)}
function chapterOriginals(){return s.albums.filter(a=>published(a)&&['album','ep','single'].includes(releaseKind(a))).sort((a,b)=>b.month-a.month)}
function chapterLastMusic(exclude=''){let months=s.albums.filter(a=>a.id!==exclude&&['album','ep','single'].includes(releaseKind(a))).flatMap(a=>[...(published(a)?[a.month]:[]),...a.tracks.filter(t=>t.single).map(t=>t.released??a.month)]);return months.length?Math.max(...months):null}
function chapterFit(left,right){
 let words=a=>new Set((a||[]).flatMap(g=>g.toLowerCase().split(/[- /]+/)).filter(w=>w.length>1));let a=words(left),b=words(right);
 return [...a].some(w=>b.has(w))?1:0;
}
function chapterHash(text){let n=2166136261;for(let c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0)/4294967296}
function chapterWindow(a){let work=releaseKind(a)==='single'?a.tracks[0]:a;return (work?.chartHistory||[]).filter(p=>p.month>=a.month&&p.month<=a.month+3).reduce((n,p)=>n+p.streams,0)}
function chapterRecentHit(){return releasedRecordings().some(({t})=>(t.chartHistory||[]).some(p=>p.month>=s.month-3&&p.rank&&p.rank<=20))||collections().some(a=>(a.chartHistory||[]).some(p=>p.month>=s.month-3&&p.rank&&p.rank<=20))}
function chapterCircumstance(){
 let last=chapterLastMusic(),activity=last??s.month;
 for(let t of s.tours)for(let stop of t.stops)if(stop.done)activity=Math.max(activity,stop.played??t.completed??activity);
 for(let e of s.pressDesk?.history||[])activity=Math.max(activity,e.month);
 for(let k of ['gig','busk','social','promote'])if(Number.isInteger(s.lastActions[k]))activity=Math.max(activity,s.lastActions[k]);
 let recent=chapterOriginals().filter(a=>a.careerChapter?.reviewed&&s.month-a.month<=36).slice(0,2),hit=chapterRecentHit(),misses=!hit&&recent.length===2&&recent.every(a=>a.careerChapter.result==='disappointing'&&!((releaseKind(a)==='single'?a.tracks[0]?.chart:a.chart)<=20&&(releaseKind(a)==='single'?a.tracks[0]?.chart:a.chart)));
 let idle=Math.max(0,s.month-activity),quiet=last!==null&&idle>24&&!hit;
 return {hit,misses,idle,quiet,factor:cap(1-(quiet?Math.min(.25,(idle-24)*.003):0)-(misses?.08:0),.65,1),text:hit?'Your current music is finding a strong audience.':misses?'Two recent projects fell below your earlier commercial results.':quiet?'An extended quiet period has reduced current attention.':'Your career is between projects; there is no established pattern of decline.'};
}
function chapterReturnAvailable(){let r=ensureChapters().returning;return r&&!r.usedBy&&r.duration>=6?r:null}
function setChapterDirection(mode,root=''){
 if(s.retired||projectRecord()||mode&&!CHAPTER_DIRECTIONS[mode])return;
 if(mode==='roots'&&!fullAlbums().some(a=>a.id===root))return say('Choose an earlier studio album to revisit.');
 draft.chapterPlan={...(draft.chapterPlan||{}),mode,root:mode==='roots'?root:''};
 if(mode==='roots'){let a=s.albums.find(a=>a.id===root);draft.genres=[...a.genres];}
 if(mode==='experimental')draft.creativeDirection='Experimental';
 studio();scheduleBrowserSave();
}
function markComeback(value){if(s.retired||projectRecord()||value&&!chapterReturnAvailable())return;draft.chapterPlan={...(draft.chapterPlan||{}),comeback:!!value};studio();scheduleBrowserSave()}
function chapterRecord(id,title,text,kind='career'){
 let d=ensureChapters();if(d.history.some(e=>e.id===id))return;
 d.history.unshift({id,month:s.month,title,text});d.history=d.history.slice(0,60);
 log(title,text);industryEvent('chapter-'+id,title,text,kind,s.month,'Alternate history');
}
function chapterStartHiatus(months){
 let d=ensureChapters();if(s.retired||d.hiatus||![6,12,24,36,0].includes(months)||careerDebutMonth()===null)return;
 if(s.tours.some(t=>t.status==='Active')||s.pressDesk.active||(s.awardMedia?.slots||[]).some(x=>x.status==='Booked')||awardPerformanceSlots().some(x=>x.status==='Booked')||(s.superstar?.sponsors||[]).some(x=>x.status==='Active'))return say('Finish your active tour, interview, booked award performance or sponsorship before taking a hiatus.');
 if(!canAct(0,0))return;s.ap--;d.hiatus={id:eraLocalID('break'),start:s.month,until:months?s.month+months:null,priorFans:s.fans,priorAwards:s.awards};
 chapterRecord(d.hiatus.id+'-start','A career hiatus',months?'You stepped back for a planned '+months+' months. Catalogue royalties and personal life continue.':'You stepped back without a fixed return date. Catalogue royalties and personal life continue.');
 say('Your hiatus has begun. Advance months normally. Private preparation and personal activities remain available; return before releasing or performing.');
}
function chapterReturn(){
 let d=ensureChapters(),h=d.hiatus;if(!h||s.retired)return;
 let duration=Math.max(0,s.month-h.start);d.hiatus=null;
 if(duration>=6)d.returning={id:h.id,duration,ended:s.month,priorFans:h.priorFans,priorAwards:h.priorAwards,usedBy:null};
 chapterRecord(h.id+'-end','Returning to music','You returned after '+duration+' month(s) away. '+(duration>=6?'One upcoming original project can be marked as a comeback in Studio.':'This short break does not qualify for a comeback campaign.'));
 say('You are active again. Returning grants no automatic audience or chart bonus.');
}
function chapterResumeRetirement(){if(!s.retired)return;s.retired=false;chapterRecord(eraLocalID('resume'),'Reopening the career','You resumed this saved career. Cancelled concerts remain cancelled. Time did not advance while the career was retired, so no years away or comeback rewards were invented.');say('Your career is active again. Use a hiatus if you want time away while life and royalties continue.');}
function chapterPublicAllowed(){if(ensureChapters().hiatus){say('You are on hiatus. Return through Life or Singer before releasing music or accepting a public performance.');return false}return true}
function chapterBreakHTML(){
 let d=ensureChapters(),h=d.hiatus,r=chapterReturnAvailable(),c=chapterCircumstance();
 return `<details class="card" ${h?'open':''}><summary>Career chapters · breaks & comebacks</summary><p>${esc(c.text)}</p><p>Attention can fade gradually during long inactivity. Your accumulated fans are retained, and released music keeps earning normal royalties. One disappointing release does not define a slump.</p>${s.retired?'<button onclick="chapterResumeRetirement()">Resume this career</button><p>Retirement paused time. Resuming alone does not count as a long absence.</p>':h?`<p><b>On hiatus since ${eraDate(h.start)}</b> · ${s.month-h.start} month(s) away.<br>${h.until===null?'Open-ended break.':s.month>=h.until?'Your planned return date has arrived. Return when you are ready.':'Planned return: '+eraDate(h.until)}</p><button onclick="chapterReturn()">Return to music · no action cost</button><p>Advance months in Life. Private Studio preparation, royalties, education and relationships continue. New releases and public performances wait until your return.</p>`:`<label>Planned break<select id="chapterBreakLength"><option value="6">6 months</option><option value="12">1 year</option><option value="24">2 years</option><option value="36">3 years</option><option value="0">No fixed return date</option></select></label><button onclick="chapterStartHiatus(Number(document.getElementById('chapterBreakLength').value))" ${careerDebutMonth()===null||s.ap<1?'disabled':''}>Take a hiatus · 1 action</button><p class="footnote">Finish active public commitments first. You can return early. A break of at least six months permits one comeback project; it never guarantees success.</p>${r?'<p>A comeback project is available in Studio after your '+r.duration+'-month break.</p>':''}`}<details><summary>Reinventions, returns & industry decisions</summary>${d.history.slice(0,20).map(e=>`<p><b>${eraDate(e.month)} · ${esc(e.title)}</b><br>${esc(e.text)}</p>`).join('')||'<p>Your future career decisions will appear here.</p>'}</details></details>`;
}
function chapterStudioHTML(){
 let record=projectRecord(),p=record?.careerChapter||draft.chapterPlan||{},r=chapterReturnAvailable();
 return `<details class="card"><summary>Reinvention & comeback · optional</summary><p>Choose a career direction for this project, then use the existing genres, creative process and visual aesthetic controls. Choices affect new listening at release, never grant instant fans, and lock when the first single is released.</p><label>Career direction<select onchange="setChapterDirection(this.value,document.getElementById('chapterRoot').value)" ${record||s.retired?'disabled':''}><option value="">Let the project speak for itself</option>${Object.entries(CHAPTER_DIRECTIONS).map(([id,name])=>`<option value="${id}" ${p.mode===id?'selected':''}>${name}</option>`).join('')}</select></label><label>Earlier era to revisit<select id="chapterRoot" onchange="if(document.getElementById('chapterRootsApply'))document.getElementById('chapterRootsApply').disabled=false" ${record||s.retired?'disabled':''}>${fullAlbums().map(a=>`<option value="${a.id}" ${p.root===a.id?'selected':''}>${esc(a.title)} · ${esc(a.genres.join(' / '))}</option>`).join('')||'<option value="">Release a studio album first</option>'}</select></label><button id="chapterRootsApply" onclick="setChapterDirection('roots',document.getElementById('chapterRoot').value)" ${record||s.retired||!fullAlbums().length?'disabled':''}>Use this earlier sound</button><p class="footnote">Gradual evolution offers a small adjustment. A major change or experiment can divide listeners even when critics like the music. Returning to roots starts with the earlier album’s genres. Quality, campaign effort, genre overlap and current trends affect reception. No extra recording stage or guaranteed hit.</p><label class="check"><input type="checkbox" ${p.comeback&&(record||r)?'checked':''} ${record||!r||s.retired?'disabled':''} onchange="markComeback(this.checked)">Identify this as my comeback project</label>${r?`<p>${r.duration} months away. This opportunity is consumed by the first released song from one marked project.</p>`:'<p class="footnote">Available after a recorded hiatus of at least six months. Older saves receive no invented absences.</p>'}${record?'<p>The rollout has begun; its career direction is locked. Previously released songs keep their results.</p>':''}</details>`;
}
let chapterLaunchContext=null;
function chapterLaunchSnapshot(project){
 let old=s.albums.find(a=>a.id===project.id),previous=chapterOriginals().find(a=>a.id!==project.id),p=old?.careerChapter||project.chapterPlan||{},r=chapterReturnAvailable();
 let peers=chapterOriginals().filter(a=>a.id!==project.id&&releaseKind(a)===(project.kind||'album')&&s.month-a.month>=3&&chapterWindow(a)>0).slice(0,3);
 return {agreement:old?.chapterAgreement||project.chapterAgreement||null,mode:p.mode||'',root:p.root||'',comeback:!!(old?.careerChapter?.comeback||p.comeback&&r),returnId:old?.careerChapter?.returnId||r?.id||'',duration:old?.careerChapter?.duration||r?.duration||0,priorFans:old?.careerChapter?.priorFans??r?.priorFans??s.fans,priorAwards:old?.careerChapter?.priorAwards??r?.priorAwards??s.awards,previousGenres:old?.careerChapter?.previousGenres||previous?.genres||project.genres,baseline:old?.careerChapter?.baseline??(peers.length?peers.reduce((n,a)=>n+chapterWindow(a),0)/peers.length:null),created:s.month,project:project.id,quality:null,promotion:s.promo,attention:s.buzz,relevance:chapterCircumstance().factor};
}
function chapterLaunchFactor(snapshot,q,project=draft){
 if(!snapshot)return 1;let fit=chapterFit(project.genres,snapshot.previousGenres),v=chapterHash(project.id+':'+snapshot.created+':direction')-.5,trend=project.genres.includes(s.trend),promo=s.promo;
 let factor=1;
 if(snapshot.mode==='evolution')factor=cap(.97+fit*.04+(q-65)*.001+promo*.0003+v*.08,.9,1.08);
 if(snapshot.mode==='reinvention')factor=cap(.83+fit*.08+(q-65)*.0025+promo*.001+(trend?.06:0)+v*.24,.65,1.18);
 if(snapshot.mode==='roots')factor=cap(.9+chapterFit(project.genres,s.albums.find(a=>a.id===snapshot.root)?.genres)*.1+(q-65)*.001+promo*.0005+v*.12,.8,1.12);
 if(snapshot.mode==='experimental')factor=cap(.82+fit*.05+(q-65)*.002+promo*.0005+v*.3,.65,1.15);
 if(snapshot.comeback)factor*=cap(.78+Math.min(.12,snapshot.priorAwards*.008)+promo*.0015+s.buzz*.0008+(q-65)*.002-Math.min(.08,snapshot.duration*.001)+v*.16,.65,1.2);
 return cap(factor*snapshot.relevance,.65,1.25);
}
const chapterStreamsBase=releaseStreams;
releaseStreams=function(q,scale,deal){let n=chapterStreamsBase(q,scale,deal);if(!chapterLaunchContext)return n;let context=chapterLaunchContext,factor=chapterLaunchFactor(context,q);context.quality=q;context.promotion=s.promo;context.factor=factor;return Math.round(n*factor)};
function chapterAfterLaunch(id,context,beforeTracks,wasPublished){
 let a=s.albums.find(a=>a.id===id);if(!a||a.tracks.length===beforeTracks&&!(!wasPublished&&published(a)))return;
 if(!a.careerChapter){a.careerChapter={...context,first:s.month};if(context.agreement?.contract===a.contract)a.chapterAgreement={...context.agreement};if(context.comeback){let r=ensureChapters().returning;if(r?.id===context.returnId&&!r.usedBy)r.usedBy=a.id;}if(context.mode||context.comeback)chapterRecord(a.id+'-direction',(context.comeback?'Comeback project: ':'A new musical chapter: ')+a.title,(CHAPTER_DIRECTIONS[context.mode]||'A familiar sound')+'. '+a.genres.join(' / ')+'. '+(context.comeback?'Returning after '+context.duration+' months away. ':'')+'Audience results remain uncertain.');}
 if(published(a)&&!wasPublished){a.careerChapter.launch=s.month;a.careerChapter.quality=a.quality;a.careerChapter.promotion=context.promotion;a.careerChapter.factor=context.factor;}
 render();
}
const chapterReleaseBase=release;
release=function(){if(!chapterPublicAllowed())return;ensureChapters();let id=draft.id,a=projectRecord(),count=a?.tracks.length||0,was=!!a&&published(a),context=chapterLaunchSnapshot(draft);chapterLaunchContext=context;try{chapterReleaseBase()}finally{chapterLaunchContext=null}chapterAfterLaunch(id,context,count,was)};
const chapterEarlyBase=releaseEarlySingle;
releaseEarlySingle=function(i,budget){if(!chapterPublicAllowed())return;let id=draft.id,a=projectRecord(),count=a?.tracks.length||0,context=chapterLaunchSnapshot(draft);chapterLaunchContext=context;try{chapterEarlyBase(i,budget)}finally{chapterLaunchContext=null}chapterAfterLaunch(id,context,count,false)};
function chapterReview(a){
 let p=a.careerChapter;if(!p||p.reviewed||!published(a)||p.launch===undefined||s.month-p.launch<3)return;
 let work=releaseKind(a)==='single'?a.tracks[0]:a,ranks=(work.chartHistory||[]).filter(h=>h.month>=a.month&&h.month<=a.month+3&&h.rank).map(h=>h.rank),peak=ranks.length?Math.min(...ranks):null,total=chapterWindow(a),ratio=p.baseline?total/p.baseline:null;
 p.reviewed=s.month;p.windowStreams=total;p.windowPeak=peak;
 p.result=peak&&peak<=10||ratio!==null&&ratio>=1.1&&peak&&peak<=50?'strong':ratio!==null&&ratio<.55&&(!peak||peak>40)?'disappointing':'moderate';
 p.review=`${num(total)} streams over the first four chart months; best position ${peak?'#'+peak:'outside the chart'}. ${p.baseline?'Earlier comparable projects averaged '+num(p.baseline)+' streams over the same window.':'There is not enough comparable release history to infer a commercial slump.'} ${a.quality>=85?'Strong musical quality remains distinct from commercial reach.':''}`;
 if(p.mode||p.comeback||p.result==='disappointing')chapterRecord(a.id+'-review',`${p.comeback?'Comeback':p.mode?'Reinvention':'Release'} review: ${a.title}`,`${p.result==='strong'?'A strong audience response.':p.result==='disappointing'?'A commercial disappointment relative to your earlier work.':'A measured reception; this was not an automatic breakthrough.'} ${p.review}`);
 if(p.mode&&a.quality>=85)change({rep:1});
 if(p.result==='strong'){
  if(p.mode||p.comeback)change({buzz:3});
  if(p.comeback&&p.priorFans>=1000000&&peak&&peak<=10&&total>=Math.max(10000000,p.baseline||0))starMilestone('comeback-'+a.id,'A career-defining comeback',a.title+' earned a top-ten return and substantial listening after a recorded '+p.duration+'-month absence.');
  let collaborators=new Set(a.tracks.flatMap(t=>(t.credits||[]).map(c=>c.artist)));
  for(let artist of activeArtists().filter(x=>collaborators.has(x.id)&&rivalFor(x.id).intensity>0)){artist.bond=cap(artist.bond+2);shiftRival(artist,-3,'A successful shared release helped repair a professional disagreement.');}
 }
}

function chapterLateResponse(a){
 let p=a.careerChapter;if(!p?.reviewed||p.result==='strong'||p.lateRecognition||s.month-a.month>18)return;
 let work=releaseKind(a)==='single'?a.tracks[0]:a,point=work?.chartHistory?.find(h=>h.month===s.month);if(!point?.rank||point.rank>10)return;
 p.lateRecognition=s.month;p.result='strong';p.review+=' Later response: #'+point.rank+' in '+eraDate(s.month)+'.';
 chapterRecord(a.id+'-late','A release finds its second wind',a.title+' reached #'+point.rank+' after its initial review. The career assessment now reflects the stronger audience response.');
 if(p.comeback&&p.priorFans>=1000000&&a.total>=Math.max(10000000,p.baseline||0))starMilestone('comeback-'+a.id,'A career-defining comeback',a.title+' earned a top-ten return and substantial listening after a recorded '+p.duration+'-month absence.');
}

function chapterMonthly(){let d=ensureChapters();if(d.processed===s.month)return;d.processed=s.month;for(let a of s.albums){chapterReview(a);chapterLateResponse(a);}let c=chapterCircumstance();if(c.quiet||c.misses){change({buzz:-1});if(s.month%6===0)chapterRecord('attention-'+s.month,'A quieter career season',c.text+' Attention eased slightly; accumulated fans and recording income were not removed.');}if(d.hiatus?.until===s.month)chapterRecord(d.hiatus.id+'-due','Your planned break is complete','Return when you are ready through Life or Singer. Your hiatus continues until you choose to end it.');d.competition=d.competition.filter(c=>c.month>=s.month-24);}
const chapterNextBase=next;next=function(){ensureChapters();let month=s.month;chapterNextBase();if(month!==s.month){chapterMonthly();render();}};
// A single bounded, explicitly simulated competing release window; no NPC discography.
function chapterCompetition(month){
 let d=ensureChapters(),old=d.competition.find(c=>c.month===month);if(old)return old;
 if(!Number.isInteger(month)||month<s.month||month>s.month+12||chapterHash(s.startYear+':'+month+':market')>.32)return null;
 let artists=activeArtists().filter(a=>a.popularity>=70).sort((a,b)=>b.popularity-a.popularity||a.id.localeCompare(b.id));if(!artists.length)return null;
 let artist=artists[Math.floor(chapterHash(s.startYear+':'+month+':artist')*Math.min(6,artists.length))],c={id:'competition-'+month,month,artist:artist.id,name:artist.name,popularity:artist.popularity};d.competition.push(c);d.competition=d.competition.slice(-36);return c;
}
function chapterChartCompetition(type){let c=s.chapters?.competition?.find(c=>c.month===s.month);if(!c)return [];return [{key:'chapter-market-'+c.id,score:chartField(type).top*(1+.14*Math.sin(s.month*.71))*(.7+(c.popularity-70)/60)}]}
function chapterCompetitionHTML(){let month=draft.plannedMonth,c=ensureChapters().competition.find(c=>c.month===month);if(!c)return '';return `<div class="notice"><b>A competitive release window · ${eraDate(month)}</b><p>${esc(c.name)} has a simulated release campaign in the same month. One additional competitor joins the existing chart calculation; strong music can still outperform them. This is alternate-history gameplay, not a real release announcement.</p><div class="actions"><button onclick="chapterCompetitionChoice('keep')">Keep my date</button><button onclick="chapterCompetitionChoice('delay')">Delay one month</button><button onclick="chapterCompetitionChoice('promote')">Build campaign · $250, 1 action</button></div>${draft.chapterCompetitionChoice?'<p>'+esc(draft.chapterCompetitionChoice)+'</p>':''}</div>`}
function chapterCompetitionChoice(choice){if(s.retired||!['keep','delay','promote'].includes(choice)||!ensureChapters().competition.some(c=>c.month===draft.plannedMonth))return;if(choice==='delay'){if(draft.plannedMonth>=s.month+12)return say('The planner supports dates up to 12 months ahead.');draft.plannedMonth++;chapterCompetition(draft.plannedMonth);draft.chapterCompetitionChoice='Target delayed; release remains manual.';}else if(choice==='promote'){let before=s.ap;action('promote');if(s.ap===before)return;draft.chapterCompetitionChoice='Campaign preparation increased through your normal promotion action.';}else draft.chapterCompetitionChoice='Keeping the planned release date.';studio();scheduleBrowserSave()}
const chapterPlanBase=setReleasePlan;setReleasePlan=function(value){chapterPlanBase(value);if(Number.isInteger(draft.plannedMonth))chapterCompetition(draft.plannedMonth);studio();scheduleBrowserSave()};
const chapterPlanningBase=releasePlanningPanel;releasePlanningPanel=function(){return chapterPlanningBase()+chapterCompetitionHTML()};
const chapterCalendarBase=industryCalendarEntries;industryCalendarEntries=function(from=s.month-3,to=s.month+12){return [...chapterCalendarBase(from,to),...(s.chapters?.competition||[]).filter(c=>c.month>=from&&c.month<=to).map(c=>({id:c.id,month:c.month,title:c.name+' · simulated release window',detail:'Projected competing campaign in your alternate history. It adds one competitor to the normal charts; it does not determine a winner.',origin:'Alternate history'}))].sort((a,b)=>a.month-b.month)};
const chapterInviteBase=invitePress;invitePress=function(...args){let h=s.chapters?.hiatus;if(h&&(s.month-h.start)%6!==0)return;return chapterInviteBase(...args)};
const chapterStarOfferBase=starOffer;starOffer=function(kind){if(s.chapters?.hiatus)return;chapterStarOfferBase(kind)};
const chapterStudioBase=studio;studio=function(){chapterStudioBase();$('view').innerHTML+=chapterStudioHTML()};
const chapterLifeBase=life;life=function(){chapterLifeBase();$('view').innerHTML=chapterBreakHTML()+$('view').innerHTML};
const chapterSingerBase=singer;singer=function(){chapterSingerBase();$('view').innerHTML+=chapterBreakHTML()};
const chapterEditionBase=associatedEditionsHTML;associatedEditionsHTML=function(a){let p=a.careerChapter;return chapterEditionBase(a)+(p&&(p.mode||p.comeback)?`<p><b>${esc(CHAPTER_DIRECTIONS[p.mode]||'Comeback project')}${p.comeback?' · Comeback':''}</b><br>${p.reviewed?esc(p.review):'Reception will be reviewed after three months of the full release.'}</p>`:'')};
// Public releases/performances wait for an explicit return; existing engines are untouched.
const chapterSingleBase=releaseSingle;releaseSingle=function(...args){if(chapterPublicAllowed())return chapterSingleBase(...args)};
const chapterDeluxeBase=releaseDeluxe;releaseDeluxe=function(...args){if(chapterPublicAllowed())return chapterDeluxeBase(...args)};
const chapterAnniversaryBase=releaseAnniversary;releaseAnniversary=function(...args){if(chapterPublicAllowed())return chapterAnniversaryBase(...args)};
const chapterCompilationBase=releaseCompilation;releaseCompilation=function(...args){if(chapterPublicAllowed())return chapterCompilationBase(...args)};
const chapterRerecordBase=releaseRerecording;releaseRerecording=function(...args){if(chapterPublicAllowed())return chapterRerecordBase(...args)};
const chapterBookTourBase=bookTour;bookTour=function(...args){if(chapterPublicAllowed())return chapterBookTourBase(...args)};
const chapterInterviewBase=startInterview;startInterview=function(...args){if(chapterPublicAllowed())return chapterInterviewBase(...args)};
const chapterMediaBase=acceptMedia;acceptMedia=function(...args){if(chapterPublicAllowed())return chapterMediaBase(...args)};
const chapterAwardStageBase=bookAwardPerformance;bookAwardPerformance=function(...args){if(chapterPublicAllowed())return chapterAwardStageBase(...args)};
const chapterStarStageBase=starResolve;starResolve=function(...args){if(chapterPublicAllowed())return chapterStarStageBase(...args)};
const chapterSponsorBase=starAcceptSponsor;starAcceptSponsor=function(...args){if(chapterPublicAllowed())return chapterSponsorBase(...args)};
const chapterActionBase=action;action=function(k){if(['gig','busk','interview'].includes(k)&&!chapterPublicAllowed())return;return chapterActionBase(k)};

// Contextual decisions use the existing story/option/effect pipeline.
function chapterLeverage(d=s.deal,project=draft){return !!d&&(d.control==='Artist final say'||project?.chapterAgreement?.contract===d.id&&project.chapterAgreement.finalSay||playerStanding()>=70&&d.confidence>=60)}
function chapterNarratives(){
 let d=ensureChapters();if(s.retired||d.hiatus||s.month-d.lastNarrative<6)return [];
 let c=chapterCircumstance(),latest=chapterOriginals()[0],p=latest?.careerChapter,root=fullAlbums().at(-1),out=[];
 function add(id,title,text,condition){if(!condition||d.resolved['narrative-'+id]!==undefined)return;let key='narrative-'+id,e=story('chapter-'+key,'Career perspective',title,text,[option('Explain what you are trying to make','Reputation +1 · no instant audience bonus',{rep:1},'You explained the musical decisions without promising a hit.',{kind:'chapterNarrative',key}),option('Let the next songs answer','Preparation +3 · Energy −2',{prep:3,energy:-2},'You kept the focus on the work ahead.',{kind:'chapterNarrative',key})]);e.chapterGate=id.split(':')[0];out.push(e);}
 add('relevance:'+Math.floor(s.month/24),'A different place in the conversation','An interviewer asks how you approach a quieter period after years in music. Your recent commercial record supports the question; this is not an assumption based on age.',age()>=40&&(c.misses||c.quiet)&&!c.hit);
 add('roots:'+(latest?.id||''),'Listeners ask for an earlier sound',`Longtime listeners mention ${root?.title||'your earlier music'} when discussing the new direction. You can acknowledge that attachment without remaking the old record.`,p?.mode==='reinvention'&&root&&latest.id!==root.id&&!chapterFit(latest.genres,root.genres)&&s.month-latest.month<=6);
 add('critics:'+(latest?.id||''),'The change is the question',`Discussion of ${latest?.title||'your new project'} keeps returning to its musical shift. A critic asks which part of the old sound you deliberately left behind.`,p?.mode==='reinvention'&&s.month-latest.month<=3);
 add('reinvented:'+(latest?.id||''),'New listeners find their way in',`${latest?.title||'Your new project'} has earned a strong audience response. An interviewer asks how you made the unfamiliar sound feel personal.`,p?.mode&&p.result==='strong'&&s.month-latest.month<=9);
 let returning=s.albums.find(a=>a.careerChapter?.comeback&&a.tracks.some(t=>t.single&&(t.chartHistory||[]).some(h=>h.month>=s.month-1&&h.rank&&h.rank<=20)));
 add('return-single:'+(returning?.id||''),'The return single connects','A top-twenty return single has brought real attention to the new chapter. The next release still has to earn its own audience.',!!returning);
 add('experiment:'+(latest?.id||''),'An experiment divides the room',`The early commercial response to ${latest?.title||'your project'} is ${p?.result||'still developing'}, while its quality score is ${latest?.quality||0}/100. A conversation about ambition need not become a claim that everyone loved it.`,p?.mode==='experimental'&&p.reviewed&&p.result!=='strong'&&s.month-latest.month<=9);
 add('resurgence:'+(latest?.id||''),'A former headline act returns to the conversation',`${latest?.title||'Your comeback'} has earned a strong response after a documented career break. You are asked what feels different about succeeding this time.`,p?.comeback&&p.priorFans>=1000000&&p.result==='strong'&&s.month-latest.month<=9);
 return out.filter(e=>!s.usedEvents.includes(e.id));
}
function chapterPoliticsScenarios(){
 let state=ensureChapters();if(s.retired||state.hiatus||age()<14||s.month-state.lastPolitics<6)return [];
 let d=s.deal,project=draft,unreleased=!projectRecord()&&!!project.title.trim()&&project.tracks.length>0,leverage=chapterLeverage(d),penalty=leverage?0:playerStanding()>=45?2:4,pool=[],bucket=Math.floor(s.month/6),label=d?.name||'Your label';
 function add(topic,title,text,choices,context={}){
  if(state.resolved['topic-'+topic]!==undefined&&s.month-state.resolved['topic-'+topic]<18)return;
  let key='politics-'+bucket+'-'+topic,e=story('chapter-'+key,'Industry politics · alternate history',title,text+(age()<18?' Your guardian joins any contract discussion.':''),choices.map(c=>option(c[0],c[1],c[2]||{},c[3],{kind:'chapterPolitics',key,topic,...context,...c[4]},null,c[5]||0)));
  e.chapterContext=context;pool.push(e);
 }
 if(d&&unreleased){
  let context={project:project.id,contract:d.id},other=project.tracks.find((t,i)=>i!==project.lead);
  if(other)add('lead','A different first impression',`${label} thinks “${other.title}” would be a clearer lead single for ${project.title}. The existing lead is still your choice.`,[
   ['Try their lead','Changes the draft lead · Confidence +2',{},'You agreed to launch with the suggested song.',{action:'lead',song:other.id,confidence:2}],
   ['Keep the lead; prepare a wider campaign','Campaign +3 · Confidence +1',{promo:3},'You agreed to explain the whole project more clearly.',{confidence:1}],
   ['Defend the original lead',`Confidence ${penalty?'-'+penalty:'unchanged; your leverage protects this choice'}`,{},'You kept the original lead and explained its role.',{confidence:-penalty}]
  ],context);
  if(s.prep<40)add('schedule','The calendar is moving faster than the music',`${label} asks whether ${project.title} can arrive next month. You have ${s.prep}/100 preparation; the normal release requirements still apply.`,[
   ['Set next month as a target','Planning reminder only; no forced release',{},'You chose a near-term target without bypassing recording requirements.',{action:'date',offset:1,confidence:1}],
   ['Negotiate two more months','Target in two months · Preparation +2',{prep:2},'You made room for another pass through the demos.',{action:'date',offset:2}],
   ['Keep the current schedule',`Confidence −${penalty}`,{},'You defended the time needed to finish the record.',{confidence:-penalty}]
  ],context);
  if(s.promo<30)add('funding','How much support follows the new record?',`${label} wants a focused campaign plan before contributing more staff time. ${leverage?'Your career standing supports a stronger request.':'Your current agreement calls for shared decisions.'}`, [
   ['Negotiate a focused label campaign',`Campaign +${leverage?8:4}; no cash grant`,{promo:leverage?8:4},'A&R committed promotional staff time; no cash or new debt was created.',{confidence:1}],
   ['Fund your own campaign preparation','$250 · Campaign +8',{promo:8},'You paid for additional campaign preparation.',{},250],
   ['Keep the existing campaign','No cost or penalty',{},'You kept the campaign within the existing plan.',{}]
  ],context);
  if(['reinvention','experimental'].includes(project.chapterPlan?.mode))add('direction','The label questions the new sound',`${label} hears a commercial risk in your ${CHAPTER_DIRECTIONS[project.chapterPlan.mode].toLowerCase()} for ${project.title}. No one can guarantee how the audience will respond.`,[
   ['Build a bridge to the previous sound','Gradual evolution; add an earlier genre where space permits',{},'You agreed on a more gradual musical transition.',{action:'bridge',confidence:2}],
   ['Defend the planned direction',`Confidence −${penalty}; no changes to your songs`,{},'You kept your direction; the music will have to earn its reception.',{confidence:-penalty}],
   ['Pay for an independent test session','$120 · Preparation +3',{prep:3},'You funded an extra demo session while retaining your direction.',{},120]
  ],context);
  if(!project.genres.includes(s.trend))add('trend','A familiar argument about the market',`${label} points to the current ${s.trend} trend. They suggest making room for it in ${project.title}; trend alignment is only one part of the existing release calculation.`,[
   ['Try the trending genre','Changes one draft genre · Confidence +2',{},'You added the current trend to the draft’s musical palette.',{action:'trend',genre:s.trend,confidence:2}],
   ['Use the idea as a private exercise','Preparation +2; genre unchanged',{prep:2},'You tested the idea without committing the release to it.',{}],
   ['Keep the current sound',`Confidence −${penalty}`,{},'You kept the project’s existing genre choices.',{confidence:-penalty}]
  ],context);
  if(playerStanding()>=55&&d.control!=='Artist final say'&&!project.chapterAgreement?.finalSay)add('control','Who makes the final creative call?',`Your recent career standing gives you a reason to revisit decision-making on ${project.title}. ${leverage?'The label is ready to give you final say for this project.':'The label offers a project consultation, but is not ready to concede final say.'}`, [
   ['Request final say for this project',leverage?'Project creative protection · Confidence −1':'Confidence −1; no guaranteed concession',{},leverage?'You secured final say for this project; financial terms remain unchanged.':'You made the request. The label retained shared decisions under your current terms.',{action:'control',granted:leverage,confidence:-1}],
   ['Agree regular creative consultations','Preparation +3 · Confidence +2',{prep:3},'You agreed on consultations without changing royalty or ownership terms.',{confidence:2}],
   ['Keep the existing agreement','No change or penalty',{},'You left the existing agreement in place.',{}]
  ],context);
  let suggested=activeArtists().filter(a=>a.bond>=20&&a.popularity>playerStanding()&&collabAssessment(a,'feature').eligible).sort((a,b)=>b.bond-a.bond)[0];
  if(suggested&&project.tracks.some(t=>!t.credits?.length))add('suggested-collab','A name on the A&R shortlist',`${label} suggests ${suggested.name} for a song. The existing friendship, fee and recording rules still decide whether the collaboration can happen.`,[
   ['Discuss a collaboration','Opens the normal proposal and fee screen',{},'You opened a conversation; no collaboration has been promised.',{action:'collaboration',artist:suggested.id}],
   ['Develop the song alone first','Preparation +2',{prep:2},'You chose to develop the song before adding another voice.',{}],
   ['Pass politely','No penalty',{},'You declined the suggestion without turning it into a dispute.',{}]
  ],context);
 }
 let video=s.albums.find(a=>a.contract===d?.id&&a.tracks.some(t=>t.single&&!t.video));
 if(d&&video&&d.videoCredit<1500){let transfer=Math.min(250,d.recordingCredit);add('video','An ambitious video meets a limited allowance',`${label} points to the remaining ${cashExact(d.videoCredit)} video grant. You can reassign existing recording funds or keep the production within its budget.`,[
  ['Move recording funds into the video allowance',`Moves ${cashExact(transfer)} between existing grants; no cash paid out`,{},'You reassigned existing support toward a video.',{action:'video-transfer',amount:transfer}],
  ['Keep the current allowance','No change; choose an affordable concept in the video planner',{},'You kept the existing allowance and planned within it.',{}],
  ['Use my own cash when the video is ready','No charge now; existing video costs still apply',{},'You kept personal funding as an option for the normal video planner.',{confidence:1}]
 ],{contract:d.id,album:video.id});}
 let credited=chapterOriginals().find(a=>s.month-a.month<=12&&a.tracks.some(t=>t.credits?.length)),artist=credited&&activeArtists().find(a=>credited.tracks.some(t=>t.credits?.some(c=>c.artist===a.id)));
 if(artist)add('recognition','The credit is there, but the campaign is not',`${artist.name} is already credited on ${credited.title}. They ask for more visible acknowledgement during promotion.`,[
  ['Acknowledge the contribution publicly','Friendship +4 · Reputation +1',{rep:1},'You recognised the existing contribution without inventing new credits.',{bond:4}],
  ['Agree on a private thank-you and clearer future billing','Friendship +2',{},'You agreed on a respectful way to recognise the work.',{bond:2}],
  ['Dismiss the concern','Friendship −3 · Tension +3',{},'The professional disagreement stayed small, but trust suffered.',{bond:-3,rival:3}]
 ],{artist:artist.id});
 let producer=unreleased&&creativeRoster().find(p=>project.tracks.some(t=>t.creativeSession?.producer?.id===p.id));
 if(producer)add('producer','Two versions of the arrangement',`${producer.name} hears a different production direction for ${project.title}. Your already booked recordings cannot be rerolled for another quality bonus.`,[
  ['Test a short alternate demo','Preparation +3 · Energy −3 · Working relationship +2',{prep:3,energy:-3},'You tested the idea without replacing the saved recording result.',{staffBond:2}],
  ['Explain why the current version matters','Working relationship +1',{},'A clear creative boundary kept the conversation professional.',{staffBond:1}],
  ['Dismiss the suggestion without discussion','Working relationship −3',{},'The session continued, but the response strained the working relationship.',{staffBond:-3}]
 ],{project:project.id,staff:producer.id});
 let strained=activeArtists().find(a=>rivalFor(a.id).intensity>0&&rivalFor(a.id).intensity<40);
 if(strained)add('reconcile','A professional conversation becomes possible',`${strained.name} is open to discussing your earlier disagreement. Reconciliation does not require agreeing on every artistic choice.`,[
  ['Acknowledge your part privately','Friendship +3 · Tension −6',{},'You made space to work together again.',{bond:3,rival:-6}],
  ['Set respectful professional boundaries','Tension −2',{},'You agreed on boundaries without pretending to be close friends.',{rival:-2}],
  ['Leave the conversation for another time','No penalty',{},'You left the door open without forcing a reconciliation.',{}]
 ],{artist:strained.id});
 let competition=state.competition.find(c=>c.month===project.plannedMonth),rival=competition&&activeArtists().find(a=>a.id===competition.artist);
 if(rival&&unreleased)add('clash','Two campaigns, one release window',`${rival.name} is preparing a simulated campaign during your target month. You can compete professionally without turning the chart into a personal feud.`,[
  ['Keep the date and acknowledge their work','Reputation +1; normal chart competition applies',{rep:1},'You kept the date and the comparison professional.',{}],
  ['Move the target back one month','Changes your planning reminder only',{},'You gave the release another month of space.',{action:'delay'}],
  ['Turn the comparison into a personal challenge','Attention +2 · Friendship −3 · Tension +4',{buzz:2},'The public challenge created mild professional tension, not a guaranteed chart advantage.',{bond:-3,rival:4}]
 ],{project:project.id,artist:rival.id});
 return pool.filter(e=>!s.usedEvents.includes(e.id));
}
function chapterContextValid(context){
 if(!context)return true;
 if(context.project){let p=chapterProject(context.project);if(!p||s.albums.some(a=>a.id===p.id))return false;}
 if(context.contract&&s.deal?.id!==context.contract)return false;
 if(context.album&&!s.albums.some(a=>a.id===context.album))return false;
 if(context.artist&&!activeArtists().some(a=>a.id===context.artist))return false;
 if(context.staff&&!creativeRoster().some(p=>p.id===context.staff))return false;
 return true;
}
const chapterEffectBase=applyStoryEffect;
applyStoryEffect=function(e){
 if(e?.kind==='chapterNarrative'){let d=ensureChapters();if(d.resolved[e.key]!==undefined)return;d.resolved[e.key]=s.month;d.lastNarrative=s.month;return;}
 if(e?.kind!=='chapterPolitics')return chapterEffectBase(e);
 let state=ensureChapters();if(state.resolved[e.key]!==undefined||!chapterContextValid(e))return;
 state.resolved[e.key]=s.month;state.resolved['topic-'+e.topic]=s.month;state.lastPolitics=s.month;
 // Topic cooldowns are bounded; the shared event log holds the detailed history.
 let keys=Object.keys(state.resolved).filter(k=>!k.startsWith('topic-'));if(keys.length>100)for(let k of keys.slice(0,keys.length-100))delete state.resolved[k];
 let p=e.project?chapterProject(e.project):null,d=e.contract?s.contracts.find(d=>d.id===e.contract):null,a=e.artist?activeArtists().find(a=>a.id===e.artist):null;
 let hadLeverage=chapterLeverage(d,p);if(d&&e.confidence)d.confidence=cap(d.confidence+e.confidence);
 if(a){if(e.bond)a.bond=cap(a.bond+e.bond);if(e.rival)shiftRival(a,e.rival,'A simulated professional decision: '+e.topic+'.');}
 if(e.staff&&s.creativePartners[e.staff]&&e.staffBond)s.creativePartners[e.staff].bond=cap(s.creativePartners[e.staff].bond+e.staffBond);
 if(p&&e.action==='lead'){let i=p.tracks.findIndex(t=>t.id===e.song);if(i>=0){p.lead=i;p.tracks[i].single=true;}}
 if(p&&e.action==='date')p.plannedMonth=s.month+e.offset;
 if(p&&e.action==='delay')p.plannedMonth=Math.min(s.month+12,Math.max(s.month,p.plannedMonth||s.month)+1);
 if(p&&['date','delay'].includes(e.action))chapterCompetition(p.plannedMonth);
 if(p&&e.action==='bridge'){let previous=chapterOriginals()[0],g=previous?.genres[0];p.chapterPlan={...(p.chapterPlan||{}),mode:'evolution'};if(g&&!p.genres.includes(g)&&p.genres.length<3)p.genres.push(g);}
 if(p&&e.action==='trend'&&GENRES.includes(e.genre))p.genres=p.genres.includes(e.genre)?p.genres:[e.genre,...p.genres].slice(0,3);
 if(p&&e.action==='control'&&e.granted&&hadLeverage)p.chapterAgreement={contract:d.id,finalSay:true};
 if(d&&e.action==='video-transfer'){let amount=Math.min(e.amount||0,d.recordingCredit);d.recordingCredit-=amount;d.videoCredit+=amount;}
 if(d)d.supportLog.unshift({month:s.month,type:'Creative discussion',text:e.topic+': decision recorded. Existing royalties, ownership and album obligations are unchanged.'});
 if(e.action==='collaboration'&&a)collaborationDialog(a.id);
};
const chapterFreshBase=freshScenarios;freshScenarios=function(){return [...chapterFreshBase(),...chapterNarratives(),...chapterPoliticsScenarios()]};
const chapterMakeEventBase=makeEvent;
makeEvent=function(){
 if(!s.chapters?.hiatus){chapterMakeEventBase();if(s.event?.chapterContext)ensureChapters().lastPolitics=s.month;else if(s.event?.chapterGate)ensureChapters().lastNarrative=s.month;return;}
 ensureCareer();s.event=null;let due=s.storyQueue.findIndex(e=>e.due<=s.month&&/personal|family|relationship|education|home/i.test(e.type));
 if(due>=0){s.event=s.storyQueue.splice(due,1)[0];s.usedEvents.push(s.event.id);return;}
 let pool=[...lifeScenarios().filter(e=>!['life-extra-releaseclash','life-extra-campus','life-extra-laundry'].includes(e.id)),...lifestyleScenarios()].filter(e=>!s.usedEvents.includes(e.id));
 if(pool.length&&Math.random()<.6){s.event=JSON.parse(JSON.stringify(pick(pool)));s.usedEvents.push(s.event.id);}
};
const chapterDecideBase=decide;
decide=function(i){
 let e=s.event;if(!e||!e.options[i])return;
 if(e.chapterContext&&!chapterContextValid(e.chapterContext)){s.event=null;return say('The project, contract or working relationship changed. This discussion closed without a fee or penalty.');}
 if(e.chapterGate==='relevance'&&!chapterCircumstance().misses&&!chapterCircumstance().quiet){s.event=null;return say('Your current career results no longer fit that question. No penalty.');}
 let isChapter=e.id.startsWith('chapter-'),before=s.event;chapterDecideBase(i);
 if(isChapter&&before&&!s.event){let d=ensureChapters();if(!d.history.some(h=>h.id===e.id)){let out=e.options[i].out;d.history.unshift({id:e.id,month:s.month,title:e.title,text:out});d.history=d.history.slice(0,60);industryEvent(e.id,e.title,out,'career',s.month,'Alternate history');}render();}
};
function chapterPoliticsPanel(){let e=s.event,context=e?.chapterContext;return `<details class="card"><summary>Creative control & professional decisions</summary><p>Occasional discussions use your existing contract, A&R confidence and career standing. An artist-final-say clause protects creative choices; established artists with strong label confidence have more room to negotiate. Ordinary disagreements never cancel a contract by themselves.</p>${s.deal?`<p>${esc(s.deal.name)} · ${esc(s.deal.control)} · A&R confidence ${s.deal.confidence}/100<br>${chapterLeverage()?'You currently have a strong negotiating position.':'Build trust and career results for a stronger negotiating position.'}</p>`:'<p>You are independent. Producer and collaborator discussions can still occur.</p>'}${context?`<p><b>Decision waiting: ${esc(e.title)}</b></p><button onclick="show('life')">Review the discussion</button>`:'<p>New politics scenarios are limited to one per six months, with an eighteen-month gap before the same topic can recur.</p>'}</details>`}
const chapterBusinessBase=business;business=function(){chapterBusinessBase();$('view').innerHTML+=chapterPoliticsPanel()};
const chapterRelationshipsBase=relationships;relationships=function(){chapterRelationshipsBase();if(s.event?.chapterContext?.artist||s.event?.chapterContext?.staff)$('view').innerHTML+=chapterPoliticsPanel()};
const CHAPTER_INTERVIEW_QUESTIONS=[
 ['How do you respond when a quieter commercial period becomes the whole story?','Discuss what the recent results actually show','Explain what you are learning from the work','Keep the focus on the next song','chapter-slump'],
 ['What changed during your time away from releasing music?','Describe a specific creative habit that changed','Discuss the ordinary life you made room for','Keep private experiences private','chapter-return'],
 ['Which part of your earlier sound did you want to keep through this change?','Describe the thread connecting both eras','Talk about what you deliberately left behind','Explain why listeners can disagree about the shift','chapter-reinvention'],
 ['How do you disagree with a label without making every meeting a public feud?','Explain how clear proposals help the conversation','Discuss compromise without sharing confidential terms','Set a boundary around ongoing negotiations','chapter-label']
];
for(let h of PRESS_SHOWS)if(!mediaIsStage(h.id))PRESS_QUESTIONS[h.id].push(...CHAPTER_INTERVIEW_QUESTIONS.map(q=>[...q]));
const chapterQuestionBase=pressQuestionAllowed;pressQuestionAllowed=function(q){let gate=q[4];if(gate==='chapter-slump'){let c=chapterCircumstance();return !c.hit&&(c.misses||c.quiet);}if(gate==='chapter-return')return !!(s.chapters?.returning||chapterOriginals().some(a=>a.careerChapter?.comeback&&s.month-a.month<=12));if(gate==='chapter-reinvention')return chapterOriginals().some(a=>a.careerChapter?.mode&&s.month-a.month<=12);if(gate==='chapter-label')return !!s.deal&&s.chapters?.history?.some(h=>h.id.startsWith('chapter-politics-')&&s.month-h.month<=12);return chapterQuestionBase(q)};

// A negotiated project clause follows the recording into later single discussions.
const chapterLabelSingleBase=labelSingleDecision;
labelSingleDecision=function(id,accept){
 let a=s.albums.find(a=>a.id===id),d=s.contracts.find(d=>d.id===a?.contract),pending=a?.labelRequest?.status==='Pending',confidence=d?.confidence;
 chapterLabelSingleBase(id,accept);
 if(!accept&&pending&&a?.labelRequest?.status==='Artist declined'&&d&&a.chapterAgreement?.contract===d.id&&a.chapterAgreement.finalSay){
  d.confidence=confidence;let entry=d.supportLog[0];if(entry?.type==='Single discussion')entry.text=a.title+': artist declined. Your project-specific final-say agreement protects this choice; confidence is unchanged.';render();
 }
};
