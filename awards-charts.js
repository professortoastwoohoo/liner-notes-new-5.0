'use strict';
// ===== Chart units: one consistent measure for sales and streams =====
// A chart "unit" is a sale. Streams convert to equivalent sales at fixed ratios
// (based on Luminate/Billboard conventions): 200 streams = 1 song sale,
// 1,250 streams = 1 album unit, 10 track sales = 1 album unit.
// Before streaming, chart units are all sales. Buying volume and the size of the chart market both scale by eraPurchaseIntensity() (sales-eras.js).
const STREAMS_PER_SONG_SALE=200,STREAMS_PER_ALBUM_UNIT=1250,TRACKS_PER_ALBUM_UNIT=10,STREAMING_START=2005;
// Size of the chart market by era: units needed for #1 (song/album). Rows must stay sorted by year.
// The scales set how large a #1 is compared with the old game scale (4M song / 12M album streams a month).
// The values below are per month; chartField() converts them to the weekly size used by the charts.
// Songs 5x and albums 3x: #1 on streams alone needs a very large fanbase; radio airplay (below) is the other route to the top.
// Every row still needs to be replaced with researched, sourced values for its era.
const CHART_SONG_SCALE=8,CHART_ALBUM_SCALE=4,WEEKS_PER_MONTH=52.1775/12;
const CHART_ERAS=[
{from:1960,song:4000000*CHART_SONG_SCALE/STREAMS_PER_SONG_SALE,album:12000000*CHART_ALBUM_SCALE/STREAMS_PER_ALBUM_UNIT}
];
function chartUnits(type,streams,sales=0){
  const per=type==='album'?STREAMS_PER_ALBUM_UNIT:STREAMS_PER_SONG_SALE;
  return Math.round((sales||0)+(streams||0)/per)}
function chartField(type){
  const y=year(),row=CHART_ERAS.filter(r=>r.from<=y).pop()||CHART_ERAS[0];
  return {limit:type==='album'?200:100,top:row[type]/WEEKS_PER_MONTH*eraPurchaseIntensity()*(type==='song'?songUnitScale():1),exponent:type==='album'?1.4:1.65}}
function chartWeekIndex(ws){return Math.round((ws-initialWeekStartFor(s.startYear))/7)}
function rivalWobble(key,week){let h=0;for(let i=0;i<key.length;i++)h=(h*31+key.charCodeAt(i))%9973;return 1+.18*Math.sin(week*.9+h)}
// Some weeks a rival has a blockbuster week (a major release, a viral moment), so even a star is not certain of #1.
function rivalSurge(key,week,type){let h=0,s2=type+key+':'+week;for(let i=0;i<s2.length;i++)h=(h*33+s2.charCodeAt(i))%1009;return h%100<18?1.6:1}
// Competitors for one chart: the unseen market plus the other artists in your world, ranked by popularity.
function chartCompetitors(type,f,week){
  let season=1+.14*Math.sin(week*.163);
  let out=Array.from({length:f.limit},(_,i)=>({score:f.top*season/Math.pow(i+1,f.exponent)*(i<3?rivalSurge('m'+i,week,type):1),key:'market-'+String(i).padStart(3,'0')}));
  for(let a of (s.industry&&s.industry.artists)||[])if(a.entry<=year())out.push({score:f.top*season*Math.pow((a.popularity||0)/100,3)*rivalWobble(String(a.id),week)*((a.popularity||0)>=75?rivalSurge(String(a.id),week,type):1),key:'artist-'+a.id});
  return out.concat(chapterChartCompetition(type))}
// Radio airplay (Hot 100 only; the Billboard 200 has none). A strong campaign can carry a single without a big fanbase.
// Strength = campaign push (label campaign, promo, buzz) x song quality x how far into its run the single is.
const AIRPLAY_LIFE=[.35,.55,.75,.9,1,1,1,1,1,1];// weeks since the single's release month began; then fades by 7% a week
function airplayStrength(a,t,at=chartAt()){
  if(!t.single)return 0;
  let age=Math.round((at-firstWeekStartOfMonth(t.singleSince??t.released??a.month))/7);
  if(age<0||age>=78)return 0;
  let c=a.labelCampaign,campaign=c?(c.remaining>0?Math.min(1,c.points/24):(s.month-a.month<=6?.4*Math.min(1,c.points/24):0)):0,
    push=.65*campaign+.2*Math.min(1,Math.max(0,s.promo||0)/60)+.15*Math.min(1,Math.max(0,s.buzz||0)/100),
    q=Math.max(0,Math.min(1,((t.quality||0)-35)/55)),
    life=AIRPLAY_LIFE[age]??Math.pow(.93,age-9);
  return q*push*life}
const AIRPLAY_WEIGHT=.7;
function airplayUnits(a,t,f,at){return Math.round(f.top*AIRPLAY_WEIGHT*Math.pow(airplayStrength(a,t,at),1.2))}
let chartAtWeek=null;function chartAt(){return chartAtWeek??s.weekStart}
// Real ceremonies inspire the fictional shows. Their calendars and entry rules are simplified for play.
const FAMILY={pop:['Pop','Pop-rock','Synth-pop','Dance-pop','Indie pop','Dream pop','Electropop','Country-pop','Disco'],rock:['Pop-rock','Country rock','Alternative rock','Indie rock','Pop-punk','Soft rock'],alternative:['Alternative rock','Indie rock','Indie pop','Dream pop','Alternative R&B'],country:['Country','Country-pop','Country rock','Americana'],folk:['Folk','Indie folk','Americana','Acoustic'],jazz:['Jazz'],soul:['Soul','R&B','Alternative R&B'],rnb:['R&B','Alternative R&B','Soul'],rap:['Hip-hop'],dance:['Synth-pop','Dance-pop','Electropop','Electronic','Disco']};
const NEW_SHOWS=[
{id:'meridian',name:'Meridian Music Awards',equiv:'GRAMMY-inspired · Craft and performance',month:1,source:'https://www.grammy.com/news/2026-grammys-nominations-full-winners-nominees-list/',sourceName:'Recording Academy',categories:[['Album of the Year','album'],['Song of the Year','song'],['Record of the Year','song'],['Best New Artist','artist',null,'new'],['Best Pop Vocal Album','album','pop'],['Best Pop Solo Performance','song','pop','solo'],['Best Pop Duo/Group Performance','song','pop','collab'],['Best Rock Album','album','rock'],['Best Rock Song','song','rock'],['Best Rock Performance','song','rock'],['Best Alternative Music Album','album','alternative'],['Best Alternative Music Performance','song','alternative'],['Best Country Song','song','country'],['Best Country Solo Performance','song','country','solo'],['Best Country Duo/Group Performance','song','country','collab'],['Best Contemporary Country Album','album','country'],['Best Folk Album','album','folk'],['Best Jazz Vocal Album','album','jazz'],['Best R&B Album','album','rnb'],['Best R&B Song','song','rnb'],['Best R&B Performance','song','rnb'],['Best R&B Duo/Group Performance','song','rnb','collab'],['Best Rap Album','album','rap'],['Best Rap Song','song','rap'],['Best Rap Performance','song','rap'],['Best Melodic Rap Performance','song','rap','melodic'],['Best Dance/Electronic Album','album','dance'],['Best Dance/Electronic Recording','song','dance'],['Best Dance Pop Recording','song','dance'],['Best Music Video','video']]},
{id:'prairie',name:'Prairie Country Awards',equiv:'CMA-inspired · Country music',month:9,family:'country',source:'https://cmaawards.com/about/',sourceName:'CMA Awards',categories:[['Country Album of the Year','album'],['Country Song of the Year','song'],['Single of the Year','song'],['Music Video of the Year','video'],['Entertainer of the Year','artist'],['New Artist of the Year','artist',null,'new']]},
{id:'audience',name:'Audience Choice Music Awards',equiv:'AMA-inspired · Fan popularity',month:10,popularity:true,source:'https://www.theamas.com/winners/2025-winners/',sourceName:'American Music Awards',categories:[['Favourite Album','album'],['Favourite Song','song'],['Artist of the Year','artist'],['New Artist of the Year','artist',null,'new'],['Favourite Pop Album','album','pop'],['Favourite Pop Song','song','pop'],['Favourite Country Album','album','country'],['Favourite Country Song','song','country'],['Favourite Rock Artist','artist','rock'],['Favourite R&B Album','album','rnb'],['Favourite R&B Song','song','rnb'],['Favourite Hip-Hop Album','album','rap'],['Favourite Hip-Hop Song','song','rap'],['Favourite Dance/Electronic Artist','artist','dance']]},
{id:'prism',name:'Prism Video Awards',equiv:'VMA-inspired · Music videos',month:7,source:'https://www.mtv.com/info-page/prnkr6/winners-for-2025-mtv-video-music-awards',sourceName:'MTV VMAs',categories:[['Video of the Year','video'],['Best Direction','video'],['Best Editing','video'],['Best Cinematography','video'],['Best Pop','video','pop'],['Best Rock','video','rock'],['Best Alternative','video','alternative'],['Best Country','video','country'],['Best R&B','video','rnb'],['Best Hip-Hop','video','rap']]},
{id:'hooks',name:'Golden Hook Pop Awards',equiv:'BMI Pop-inspired · Songwriting honours',month:4,family:'pop',popularity:true,source:'https://www.bmi.com/award-show/pop-2026',sourceName:'BMI Pop Awards',categories:[['Pop Song of the Year','song'],['Pop Songwriter of the Year','artist']]},
{id:'amplifier',name:'Amplifier Rock Awards',equiv:'Kerrang!-inspired · Rock and alternative',month:5,family:'rock',source:'https://www.kerrang.com/heres-all-the-winners-from-the-kerrang-awards-2022',sourceName:'Kerrang! Awards (2022 model)',categories:[['Best Album','album'],['Best Song','song'],['Best International Act','artist']]},
{id:'blue-note',name:'Blue Hour Jazz Awards',equiv:'Jazz FM-inspired · Jazz and soul',month:3,family:'jazzsoul',source:'https://www.jazzfmawards.com/terms-and-conditions/',sourceName:'Jazz FM Awards',categories:[['Album of the Year','album'],['International Jazz Act of the Year','artist','jazz'],['Soul Act of the Year','artist','soul'],['Innovation Award','artist']]},
{id:'roots',name:'Roots Folk Music Awards',equiv:'International Folk Music Awards-inspired',month:2,family:'folk',source:'https://www.folk.org/programs/ifmas',sourceName:'Folk Alliance International',categories:[['Album of the Year','album'],['Song of the Year','song'],['Artist of the Year','artist']]}
];
// ---- Home-market shows ----
// Only artists of the show's nation can enter its main categories; its "International" categories (gate 'intl') are open to everyone else.
NEW_SHOWS.push(
 {id:'maple',name:'Maple Leaf Music Awards',equiv:'JUNO-inspired · Canadian music',month:2,nation:'Canada',source:'https://en.wikipedia.org/wiki/Juno_Awards',sourceName:'Reference',categories:[
  ['Album of the Year','album'],['Single of the Year','song'],['Artist of the Year','artist'],['Breakthrough Artist of the Year','artist',null,'new'],['Songwriter of the Year','artist'],['Fan Choice Award','artist'],
  ['Pop Album of the Year','album','pop'],['Rock Album of the Year','album','rock'],['Alternative Album of the Year','album','alternative'],['Country Album of the Year','album','country'],
  ['R&B/Soul Recording of the Year','song','rnb'],['Rap Recording of the Year','song','rap'],['Dance Recording of the Year','song','dance'],['Contemporary Roots Album of the Year','album','folk'],
  ['Jazz Vocal Album of the Year','album','jazz'],['Video of the Year','video'],['International Album of the Year','album',null,'intl']]},
 {id:'southern-cross',name:'Southern Cross Music Awards',equiv:'ARIA-inspired · Australian music',month:10,nation:'Australia',source:'https://en.wikipedia.org/wiki/ARIA_Music_Awards',sourceName:'Reference',categories:[
  ['Album of the Year','album'],['Song of the Year','song'],['Best Artist','artist'],['Breakthrough Artist','artist',null,'new'],['Best Pop Release','song','pop'],['Best Rock Album','album','rock'],
  ['Best Hip Hop Release','song','rap'],['Best Dance Release','song','dance'],['Best Country Album','album','country'],['Best Soul/R&B Release','song','rnb'],['Best Independent Release','album'],
  ['Best Blues & Roots Album','album','folk'],['Best Jazz Album','album','jazz'],['Best Video','video'],['Best International Artist','artist',null,'intl']]},
 {id:'sakura',name:'Sakura Record Awards',equiv:'Japan Record Awards-inspired · Japanese music',month:11,nation:'Japan',source:'https://en.wikipedia.org/wiki/Japan_Record_Awards',sourceName:'Reference',categories:[
  ['Grand Prix','song'],['Best Album Award','album'],['Excellence Work Award','song'],['Best New Artist','artist',null,'new'],['Best Vocalist Award','artist'],['Composition Award','song'],
  ['Best Pop Album','album','pop'],['Special International Music Award','artist',null,'intl']]},
 {id:'hanbit',name:'Hanbit Golden Disc Awards',equiv:'Golden Disc Awards-inspired · Korean music',month:0,nation:'South Korea',popularity:true,source:'https://en.wikipedia.org/wiki/Golden_Disc_Awards',sourceName:'Reference',categories:[
  ['Album Daesang','album'],['Song Daesang','song'],['Best Album (Bonsang)','album'],['Best Digital Song (Bonsang)','song'],['Rookie Artist of the Year','artist',null,'new'],['Popularity Award','artist'],
  ['Best Pop Album','album','pop'],['Best Rock Album','album','rock'],['Best Dance Song','song','dance'],['Global Artist Award','artist',null,'intl']]}
);
// ---- More categories for the existing shows ----
const EXTRA_SHOW_CATEGORIES={
 meridian:[['Best Americana Album','album','folk'],['Best Traditional R&B Performance','song','rnb'],['Best Progressive R&B Album','album','alternative'],['Best Traditional Pop Vocal Album','album','pop'],['Best Folk Song','song','folk']],
 prairie:[['Vocalist of the Year','artist'],['Vocal Event of the Year','song',null,'collab'],['Songwriter of the Year','artist'],['Debut Album of the Year','album',null,'new']],
 audience:[['Favourite Rock Album','album','rock'],['Favourite Alternative Artist','artist','alternative'],['Favourite Soul/R&B Artist','artist','rnb'],['Favourite Country Artist','artist','country'],['Collaboration of the Year','song',null,'collab'],['Favourite Music Video','video']],
 prism:[['Best Collaboration','video',null,'collab'],['Best Dance','video','dance'],['Best Visual Effects','video'],['Best Art Direction','video'],['Best Choreography','video']],
 hooks:[['Most-Performed Song','song'],['Breakthrough Songwriter','artist',null,'new'],['Pop Album of the Year','album']],
 amplifier:[['Best Single','song'],['Best Breakthrough Act','artist',null,'new'],['Best Live Act','artist'],['Best Alternative Act','artist','alternative']],
 'blue-note':[['Best Vocal Jazz Album','album','jazz'],['Best Soul Single','song','soul'],['Rising Star','artist',null,'new']],
 roots:[['Best New Folk Artist','artist',null,'new'],['Contemporary Folk Album','album'],['Songwriter of the Year','artist']]};
for(let h of NEW_SHOWS)if(EXTRA_SHOW_CATEGORIES[h.id])h.categories.push(...EXTRA_SHOW_CATEGORIES[h.id]);
SHOWS.splice(0,SHOWS.length,...NEW_SHOWS);
let awardPage='submit',awardYear='all',awardShow='all',chartPage='album',chartDetail='';
function familyMatch(a,f){if(!f)return true;let set=f==='jazzsoul'?[...FAMILY.jazz,...FAMILY.soul]:FAMILY[f]||[];return a.genres.some(g=>set.includes(g))}
function eligible(show,type,at,category=null){let out=[],family=category?.[2]||show.family,first=careerDebutMonth(),window=awardWindow(show,at);if(category?.[3]==='new'&&(first===null||at-first>36||s.awardEntries.some(e=>e.show===show.id&&/New Artist/.test(e.category)&&e.status==='Won')))return [];for(let a of s.albums){if((type==='album'||type==='artist')&&!familyMatch(a,family))continue;if(type==='album'||type==='artist'){if(type==='album'&&(!published(a)||releaseKind(a)!=='album'))continue;if(a.month>=window.start&&a.month<=window.end)out.push({id:type==='artist'?'artist-entry':a.id,title:type==='artist'?`${s.name} · eligible era: ${a.title}`:a.title,quality:a.quality,reach:a.total,type,album:a.id,month:a.month})}else for(let t of a.tracks){if(!familyMatch({genres:t.genres||a.genres},family))continue;let month=type==='video'?t.video?.month:t.released;if(month===null||month===undefined||month<window.start||month>window.end)continue;out.push({id:t.id,title:t.title+' — '+a.title,quality:type==='video'?t.video.quality:t.quality,reach:t.total,type,album:a.id,month})}}if(type==='artist')return out.sort((a,b)=>b.month-a.month).slice(0,1);return out}
function awardSelectPage(p){awardPage=p;awards()}
function awards(){let submitted=s.awardEntries.filter(e=>e.status==='Submitted'),nominated=s.awardEntries.filter(e=>e.nominated),won=s.awardEntries.filter(e=>e.status==='Won');let years=[...new Set([...s.awardEntries.map(e=>year(e.at)),...SHOWS.map(h=>year(ceremony(h)))])].sort((a,b)=>b-a);$('view').innerHTML=`<div class="card"><div class="eyebrow">AWARDS CENTRE</div><h2 style="margin-top:10px">Every entry. Every nomination. Every win.</h2><div class="statsgrid"><div><small>AWAITING NOMINATIONS</small><div class="number">${submitted.length}</div></div><div><small>CAREER NOMINATIONS</small><div class="number">${nominated.length}</div></div><div><small>CAREER WINS</small><div class="number">${s.awards}</div></div></div><div class="actions">${[['submit','Submit work'],['pending','Pending'],['nominations','Nominations'],['wins','Wins'],['archive','All results']].map(([p,n])=>`<button class="${awardPage===p?'primary':''}" onclick="awardSelectPage('${p}')">${n}</button>`).join('')}</div><div class="grid" style="margin-top:18px"><label>Award year<select onchange="awardYear=this.value;awards()"><option value="all">All years</option>${years.map(y=>`<option ${awardYear===String(y)?'selected':''}>${y}</option>`).join('')}</select></label><label>Show<select onchange="awardShow=this.value;awards()"><option value="all">All shows</option>${SHOWS.map(h=>`<option value="${h.id}" ${awardShow===h.id?'selected':''}>${h.name}</option>`).join('')}</select></label></div><p class="footnote">${s.worldMode==='realistic'?'Real names and selected historical categories; see coverage notes.':'Fictional shows based on real award traditions.'} Dates, nomination mechanics, geography and eligibility are simplified for the game. Mixed genres can qualify in more than one field. Game eligibility: album categories require a full album; EP songs, standalone singles and early singles can enter song/video categories using their original release dates. New artist categories cover the first 36 months after your first released music.</p></div><div id="awardsBody"></div>`;if(awardPage==='submit')awardSubmissionView();else awardRecordsView()}
function awardSubmissionView(){let shows=SHOWS.filter(h=>(awardShow==='all'||h.id===awardShow)&&(awardYear==='all'||year(ceremony(h))===Number(awardYear)));$('awardsBody').innerHTML=`<div class="notice">One work per category each year. Entries are free; no action required. Submit before the nomination month. Nominees are announced one month before each ceremony.</div>${shows.map(h=>{let at=ceremony(h),usable=h.categories.filter(c=>eligible(h,c[1],at,c).length),start=awardWindow(h,at).start,end=awardWindow(h,at).end;return `<details class="card" ${awardShow===h.id?'open':''}><summary><b>${h.name}</b> · ${MONTHS[h.month]} ${year(at)} <span class="pill">${usable.length} eligible categories</span></summary><p style="margin-top:16px" class="muted">${h.equiv}${h.nation?`<br>Home-market show: ${s.nationality===h.nation?`open to ${h.nation} artists, which includes you`:`entered by ${h.nation} artists (your nationality is ${s.nationality||'not set'}), so only its International categories are open to you`}`:''}<br>Release window: ${MONTHS[(start%12+12)%12]} ${year(start)} – ${MONTHS[(end%12+12)%12]} ${year(end)}<br>Nominations: ${MONTHS[(at-1)%12]} ${year(at-1)}</p><p class="footnote">Real-world inspiration: <a href="${h.source}" target="_blank" rel="noopener noreferrer">${h.sourceName}</a>${h.id==='hooks'?' · Pop songwriting awards, rather than a general pop performance ceremony.':''}</p>${h.categories.map((c,i)=>{let works=eligible(h,c[1],at,c),entry=s.awardEntries.find(e=>e.show===h.id&&e.at===at&&e.category===c[0]);return `<div class="entry"><div class="row wrap"><h3 style="margin:0">${esc(c[0])}</h3><span class="pill">${c[1]}${c[2]?' · '+c[2]:''}</span></div>${awardPerformanceHint(c)?`<p class="footnote">${esc(awardPerformanceHint(c))}</p>`:''}${entry?`<p>${esc(entry.title)} · <b>${entry.status}</b></p>`:works.length?`<div class="row wrap"><select id="award-${h.id}-${i}" aria-label="Entry for ${esc(c[0])}" style="flex:1;min-width:180px;margin:10px 0">${works.map(w=>`<option value="${w.id}">${esc(w.title)}</option>`).join('')}</select><button onclick="submitAward('${h.id}',${i})" ${s.retired?'disabled':''}>Submit</button></div>`:`<p class="footnote">${c[1]==='video'?'Requires a released video':c[1]==='artist'?'Requires eligible released music':'No eligible '+c[1]}${c[2]||h.family?' in this genre':''} within this release window.</p>`}</div>`}).join('')}</details>`}).join('')||'<div class="card">No upcoming show matches these filters.</div>'}`}
function awardRecordsView(){let entries=s.awardEntries.filter(e=>(awardShow==='all'||e.show===awardShow)&&(awardYear==='all'||year(e.at)===Number(awardYear)));if(awardPage==='pending')entries=entries.filter(e=>e.status==='Submitted'||e.status==='Nominated');if(awardPage==='nominations')entries=entries.filter(e=>e.nominated);if(awardPage==='wins')entries=entries.filter(e=>e.status==='Won');entries.sort((a,b)=>b.at-a.at||a.show.localeCompare(b.show)||a.category.localeCompare(b.category));let groups=new Map();for(let e of entries){let key=e.show+'-'+e.at;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e)}$('awardsBody').innerHTML=`${awardPage==='nominations'?'<p class="footnote">Includes nominations that went on to win. Each nomination is counted once.</p>':''}${[...groups.values()].map(list=>{let first=list[0],h=SHOWS.find(h=>h.id===first.show);return `<div class="card"><div class="row wrap"><h3>${esc(first.showName||h?.name||first.show)} · ${year(first.at)}</h3><span class="pill">Ceremony: ${MONTHS[first.at%12]}</span></div><div class="scroll"><table><tr><th>Work / artist</th><th>Category</th><th>Status</th><th>Next date / result</th></tr>${list.map(e=>`<tr><td>${esc(e.title)}</td><td>${esc(e.category)}</td><td><span class="pill">${e.status==='Won'?'★ Winner':e.status==='Nominated'?'Nominee':esc(e.status)}</span></td><td>${e.status==='Submitted'?'Nomination announcement: '+MONTHS[(e.at-1)%12]+' '+year(e.at-1):e.status==='Nominated'?'Ceremony: '+MONTHS[e.at%12]+' '+year(e.at):e.status==='Won'?'Won at the ceremony':e.nominated?'Final nominee; did not win':'Not nominated'}</td></tr>`).join('')}</table></div></div>`}).join('')||'<div class="card"><h3>No entries here yet.</h3><p class="muted">Try another year or show, or submit eligible work to start an awards campaign.</p></div>'}${s.legacyAwards?`<p class="footnote">${s.legacyAwards} legacy win(s) are included in your career total. Older saves did not record their categories.</p>`:''}`}
function submitAward(id,ci){if(s.retired)return;let h=SHOWS.find(h=>h.id===id),c=h?.categories[ci];if(!c)return;let at=ceremony(h);if(s.awardEntries.some(e=>e.show===id&&e.at===at&&e.category===c[0]))return;let work=eligible(h,c[1],at,c).find(w=>w.id===$(`award-${id}-${ci}`)?.value);if(!work)return;s.awardEntries.push({id:uid('entry'),show:id,category:c[0],type:c[1],at,work:work.id,album:work.album,title:work.title,status:'Submitted',nominated:false,submitted:s.month});log('For your consideration',`${work.title}: submitted for ${c[0]} at ${h.name}, ${year(at)}.`);say(`Submitted to ${h.name}. See Pending to track nomination and ceremony dates.`)}
function entryScore(e,recordOverride=null){let a=recordOverride||s.albums.find(a=>a.id===e.album);if(!a)return 0;let t=a.tracks.find(t=>t.id===e.work),quality=e.type==='album'||e.type==='artist'?a.quality:e.type==='video'?t?.video?.quality||0:t?.quality||0,reach=e.type==='album'||e.type==='artist'?a.total:t?.total||0,pop=cap(Math.log10(Math.max(1,reach))*13-15),h=SHOWS.find(x=>x.id===e.show);if(h?.popularity)return pop*.7+quality*.2+s.rep*.1;return quality*.75+pop*.15+s.rep*.1}
// Monthly simulated national charts. No historical ranks are invented on save upgrade.
function ensureCharts(){if(!s)return;if(s.chartSince===undefined)s.chartSince=s.month;for(let a of s.albums){if(!Array.isArray(a.chartHistory)){a.chartHistory=[];a.legacyPeak=a.chart||null}for(let t of a.tracks)if(!Array.isArray(t.chartHistory))t.chartHistory=[];for(let w of [a,...a.tracks])for(let p of w.chartHistory){if(p.sales===undefined)p.sales=0;if(p.units===undefined)p.units=chartUnits(w===a?'album':'song',p.streams,p.sales)}}}
function chartItems(type){let out=[];for(let a of s.albums){if(type==='album'&&albumChartEligible(a))out.push({id:a.id,title:a.title,work:a,album:a});else if(type==='song')for(let t of a.tracks)if(t.single||published(a))out.push({id:t.id,title:t.title,work:t,album:a})}return out}
function putChartPoint(work,streams,sales=0){
  if(!Array.isArray(work.chartHistory))work.chartHistory=[];
  const type=work.tracks?'album':'song';
  let p=work.chartHistory.find(p=>p.month===s.month);
  if(!p){p={month:s.month,streams:0,sales:0,units:0,rank:null};work.chartHistory.push(p)}
  let before=p.streams;
  p.streams=Math.max(0,Math.round(streams));
  if(sales)p.sales=Math.max(0,Math.round(sales));
  p.units=chartUnits(type,p.streams,p.sales||0)+(p.airplay||0);
  trackChartFlow(work,p.streams-before)}
// Streams worked out at the start of a month are spread across that month's weeks; streams earned mid-week count in that week.
function trackChartFlow(work,delta){
  if(!(delta>0))return;
  if(s.ledgerClock!==null&&s.ledgerClock!==undefined){
    let pl=work.chartPlan;
    if(pl&&pl.month===s.month)pl.total+=delta;
    else{let left=pl&&pl.done<pl.weeks?Math.max(0,pl.total-Math.round(pl.total*pl.done/pl.weeks)):0;work.chartPlan={month:s.month,total:delta+left,weeks:Math.max(1,weeksInGameMonth(s.month)),done:0}}}
  else (work.chartFlows||(work.chartFlows=[])).push({total:delta,weeks:weeksLeftInGameMonth(),done:0})}
function consumeWeekStreams(work){
  let pl=work.chartPlan;
  if((!pl||pl.month!==s.month)&&work.chartSeeded!==s.month){
    let mp=(work.chartHistory||[]).find(p=>p.month===s.month);
    if(mp&&mp.streams>0){let inFlows=(work.chartFlows||[]).reduce((n,f)=>n+f.total,0);work.chartPlan=pl={month:s.month,total:Math.max(0,mp.streams-inFlows),weeks:Math.max(1,weeksInGameMonth(s.month)),done:Math.max(0,weekOfMonth(chartAt())-1)}}
    work.chartSeeded=s.month}
  let share=0;
  if(pl&&pl.month===s.month&&pl.done<pl.weeks){let k=pl.done+1;share=wobbleShare(pl.total,pl.weeks,k,work.id||work.title);pl.done=k}
  for(let f of work.chartFlows||[]){f.done++;share+=frontLoadedShare(f.total,f.weeks,f.done)}
  if(work.chartFlows)work.chartFlows=work.chartFlows.filter(f=>f.done<f.weeks);
  return share}
function addChartReach(a,t,extra){ensureCharts();let ap=a.chartHistory.find(p=>p.month===s.month);if(albumChartEligible(a))putChartPoint(a,(ap?.streams||0)+extra);if(t){let tp=t.chartHistory.find(p=>p.month===s.month);putChartPoint(t,(tp?.streams||0)+extra)}rerankCharts()}
function chartDebut(a){ensureCharts();a.legacyPeak=null;putChartPoint(a,a.streams);for(let t of a.tracks)if(t.single)putChartPoint(t,t.firstStreams);rerankCharts()}
function rerankCharts(){}// Chart positions are tallied once a week (runWeeklyCharts). Monthly points keep each month's best weekly position.
function chartSummary(work){let hist=work.chartHistory||[],current=hist.find(p=>p.month===s.month),previous=hist.find(p=>p.month===s.month-1),ranks=hist.filter(p=>p.rank),peak=work.chart||null;let movement=current?.rank?(previous?.rank?current.rank===previous.rank?'—':current.rank<previous.rank?'↑ '+(previous.rank-current.rank):'↓ '+(current.rank-previous.rank):ranks.some(p=>p.month<s.month)?'Re-entry':'New'):previous?.rank?'Out':'—';return {current,previous,peak,movement,months:ranks.length,ones:ranks.filter(p=>p.rank===1).length,debut:hist[0]?.rank||null}}
// Eligibility limits affect rankings only, never streaming income or historical records.
// Songs have no time limit on the chart. They follow Billboard's recurrent rules instead: once a song has been on the chart this many weeks,
// it is removed if it sits below the matching position. A removed song never returns to the chart, but its sales still count.
const CHART_RECURRENT=[[78,5],[52,10],[26,25],[20,50]];// [weeks on chart, removed if below No.]
function recurrentLimit(weeks){for(let [w,lim] of CHART_RECURRENT)if(weeks>=w)return lim;return Infinity}
function songChartEligible(a,t){return !t.chartRetired}
// Allocate the existing collection audience to regular tracks without counting it twice.
function trackCollectionStreams(a,total){let tracks=a.tracks;if(!tracks.length)return;let weights=tracks.map(t=>{t.collectionWeight??=rnd(50,150);let elapsed=Math.max(0,s.month-(t.released??a.month)),tail=t.single?1.6:Math.max(.08,Math.pow(.68,Math.max(0,elapsed-1)));return t.collectionWeight*tail}),sum=weights.reduce((n,w)=>n+w,0),left=Math.max(0,Math.round(total)),actual=0;tracks.forEach((t,i)=>{let n=i===tracks.length-1?left:Math.floor(total*weights[i]/sum);left-=n;if(typeof digitalListening==='function')n=digitalListening(a,t,n);actual+=n;t.released??=a.month;t.total=(t.total||0)+n;let current=t.chartHistory?.find(p=>p.month===s.month);putChartPoint(t,(current?.streams||0)+n)});return actual}
function songChartExitReason(a,t){let r=t.chartRetired;return r?`Removed from the chart after ${r.weeks} weeks (below No. ${r.limit})`:''}
function currentTrackStreams(t){return t.chartHistory?.find(p=>p.month===s.month)?.streams||0}

// ===== Fan loyalty =====
// How devoted your fans are, from 0 to 100. Loyal fans stream more on release, keep streaming for longer and make a chart run steadier.
// It moves slowly toward a target built from your reputation, the quality of your last releases, how regularly you release,
// how recently you have done fan activities, and how long you have been in the industry.
function fanLoyaltyTarget(){
  let recent=s.albums.filter(a=>published(a)).sort((a,b)=>b.month-a.month).slice(0,3),
    quality=recent.length?recent.reduce((n,a)=>n+(a.quality||0),0)/recent.length/100:.3,
    last=s.albums.length?Math.max(...s.albums.map(a=>a.month)):-999,since=s.month-last,
    consistency=since<=6?1:Math.max(0,1-(since-6)/30),
    acts=Object.values((s.fanGrowth&&s.fanGrowth.last)||{}).filter(m=>typeof m==='number'&&m>=s.month-6).length,
    debut=careerDebutMonth(),tenure=debut===null?0:Math.min(1,(s.month-debut)/60);
  return 100*(.3*Math.min(1,Math.max(0,(s.rep||0)/100))+.3*quality+.15*Math.min(1,acts/4)+.15*consistency+.1*tenure)}
function updateFanLoyalty(){
  let target=fanLoyaltyTarget();
  s.fanLoyalty=s.fanLoyalty===undefined?Math.round(target):Math.round((s.fanLoyalty+(target-s.fanLoyalty)*.05)*10)/10}
function loyaltyLabel(n){return n<25?'fickle':n<45?'casual':n<65?'steady':n<82?'loyal':'devoted'}
// ===== Weekly charts =====
// Each week every eligible work earns chart units (sales, plus streams converted to equivalent sales, plus radio airplay for Hot 100 singles)
// and is ranked against the weekly market and the other artists in your world. Monthly points keep the totals and each month's best position.
function lastChartWeekIndex(){return s.chartWeekLast===undefined?null:chartWeekIndex(s.chartWeekLast)}
function recordWeeklyPoint(work,pt){
  work.chartWeeks=work.chartWeeks||[];work.chartWeeks.push(pt);
  if(work.chartWeeks.length>208)work.chartWeeks.splice(0,work.chartWeeks.length-208);
  let st=work.chartStats||(work.chartStats={peak:null,weeks:0,ones:0});
  if(pt.rank){st.weeks++;if(pt.rank===1)st.ones++;if(st.peak===null||pt.rank<st.peak)st.peak=pt.rank;work.chart=work.chart?Math.min(work.chart,pt.rank):pt.rank}}
function runWeeklyCharts(ws){
  ensureCharts();updateFanLoyalty();let week=chartWeekIndex(ws),gm=gameMonthOfWeek(ws),L=s.fanLoyalty??50;chartAtWeek=ws;
  try{
    // Songs are measured first so each album can see what its singles sold on their own: an album's sales are the album's, not its songs'.
    for(let type of ['song','album']){
      let f=chartField(type),competitors=chartCompetitors(type,f,week),entries=[];
      for(let x of chartItems(type)){
        let work=x.work,streams=consumeWeekStreams(work);
        let air=type==='song'?airplayUnits(x.album,work,f,ws):0,age=Math.max(0,Math.round((ws-firstWeekStartOfMonth(work.singleSince??work.released??x.album.month))/7)),
          split=formatSplit(x.album,streams),ratio=type==='album'?STREAMS_PER_ALBUM_UNIT:STREAMS_PER_SONG_SALE,buy=type==='album'?albumPurchases(x.album,streams,ws):trackPurchases(x.album,work,streams),sold=sumVals(buy)/ratio,
          loyal=(.8+.4*L/100)*Math.pow(1-.012*(1-L/100),age);
        if(Math.round((sold+split.streams/ratio)*loyal)+air<=0)continue;
        // Loyalty and luck scale what fans actually buy and stream that week, so the columns always add up.
        let luck=weeklyLuck(work,type,type==='song'?airplayStrength(x.album,work,ws):0,L),m=loyal*luck,
          streamsShown=Math.round(split.streams*m),salesShown=Math.round(sold*m),airShown=Math.round(air*luck),units=Math.max(1,Math.round(streamsShown/ratio)+salesShown+airShown);
        let e={x,streams:streamsShown,sales:salesShown,air:airShown,units,raw:streams,m,fmt:shownFormats(buy,ratio,m,salesShown)};entries.push(e);competitors.push({score:units,key:x.id,e})}
      competitors.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
      // Seat everyone from the top. A song that has been on the chart long enough and would sit too low is removed, and the songs below it move up.
      let place=0;
      for(let c of competitors){
        let w=c.e&&type==='song'?c.e.x.work:null;
        if(w&&w.chartRetired){c.rank=null;continue}
        if(w){let weeks=(w.chartStats?.weeks||0)+1,lim=recurrentLimit(weeks);if(place+1<=f.limit&&place+1>lim){w.chartRetired={ws,weeks,limit:lim,rank:place+1};c.rank=null;continue}}
        place++;c.rank=place<=f.limit?place:null}
      competitors.forEach(c=>{
        if(!c.e)return;
        let e=c.e,rank=c.rank,work=e.x.work;
        if(rank||!work.chartRetired)recordWeeklyPoint(work,{w:week,d:ws,streams:e.streams,sales:e.sales,airplay:e.air,units:e.units,rank,hot:work.breakout&&work.breakout.left>0?1:0});
        work.weekChart={ws,raw:e.raw,m:e.m,fmt:e.fmt};if(e.sales>0||work.sales)recordOfficialSales(work,type,e.x.album,gm,e);
        let mp=(work.chartHistory||[]).find(p=>p.month===gm);
        if(mp){mp.airplay=(mp.airplay||0)+e.air;mp.units=chartUnits(type,mp.streams,0)+mp.airplay;if(rank)mp.rank=mp.rank?Math.min(mp.rank,rank):rank}})}
    s.chartWeekLast=ws}
  finally{chartAtWeek=null}}
// ---- Luck ----
// Every release has a week-to-week "momentum" (good and bad weeks that persist a little) and a small chance of a breakout spell.
// A strong campaign raises the chance of a breakout, but #1 is still decided by fanbase, luck and the market that week.
const LUCK_SPREAD=.28,LUCK_MEMORY=.6;
function gaussian(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function weeklyLuck(work,type,push,loyalty=50){
  work.luckLog=LUCK_MEMORY*(work.luckLog||0)+gaussian()*LUCK_SPREAD*(1.2-.5*loyalty/100)*(type==='album'?.7:1);
  let boost=1;
  if(work.breakout&&work.breakout.left>0){boost=1+work.breakout.size*(work.breakout.left/work.breakout.weeks);work.breakout.left--}
  else if(type==='song'&&Math.random()<.012+.03*Math.min(1,push||0))work.breakout={weeks:rnd(2,4),left:rnd(2,4),size:rnd(35,90)/100};
  return Math.exp(work.luckLog)*boost}
function weeklyPoint(work,w){return (work.chartWeeks||[]).find(p=>p.w===w)}
function weeklySummary(work){
  let L=lastChartWeekIndex(),current=L===null?null:weeklyPoint(work,L),previous=L===null?null:weeklyPoint(work,L-1),st=work.chartStats||{peak:null,weeks:0,ones:0};
  let movement=current?.rank?(previous?.rank?current.rank===previous.rank?'—':current.rank<previous.rank?'↑ '+(previous.rank-current.rank):'↓ '+(current.rank-previous.rank):st.weeks>1?'Re-entry':'New'):previous?.rank?'Out':'—';
  return {current,previous,peak:work.chart||st.peak||null,weeks:st.weeks,ones:st.ones,movement}}
function charts(){
  ensureCharts();let items=chartItems(chartPage),L=lastChartWeekIndex(),
    sorted=[...items].sort((a,b)=>(weeklySummary(a.work).current?.rank||999)-(weeklySummary(b.work).current?.rank||999)||(weeklySummary(b.work).current?.units||0)-(weeklySummary(a.work).current?.units||0)),
    all=[...chartItems('album'),...chartItems('song')],numberOnes=all.filter(x=>(x.work.chartStats?.ones||0)>0).length,charting=all.filter(x=>weeklySummary(x.work).current?.rank).length;
  let selected=items.find(x=>x.id===chartDetail)||items[0];if(selected)chartDetail=selected.id;
  let radio=chartPage==='song';
  $('view').innerHTML=`<div class="card"><div class="eyebrow">BILLBOARD CHARTS · ${L===null?'FIRST CHART PENDING':'WEEK ENDING '+fmtDay(s.chartWeekLast+6).toUpperCase()}</div><h2 style="margin-top:10px">Watch an era rise, fall or find a second life.</h2><p class="muted">Weekly simulated charts: Billboard 200 and Billboard Hot 100. Every Sunday-to-Saturday week, each release earns chart units (${streamShareNow()>0?'sales in every format, plus streams converted to equivalent sales':'copies sold in every format'}; Hot 100 singles also earn radio airplay from strong campaigns) and is ranked against a changing fictional market, the other artists in your world, and your other releases. The chart for a week is published when that week ends. Fan loyalty (from your reputation, recent release quality, regular releases, fan activities and time in the industry) makes streaming stronger and a chart run steadier. Standalone and early singles only enter the singles chart. Billboard chart positions are simulated within your game.</p><div class="row wrap"><span><b class="metric">${Math.round(s.fanLoyalty??fanLoyaltyTarget())}</b> fan loyalty (${loyaltyLabel(s.fanLoyalty??fanLoyaltyTarget())})</span><span><b class="metric">${charting}</b> currently charting</span><span><b class="metric">${numberOnes}</b> releases reached #1 since tracking began</span></div><div class="actions"><button class="${chartPage==='album'?'primary':''}" onclick="chartPage='album';chartDetail='';charts()">Billboard 200</button><button class="${chartPage==='song'?'primary':''}" onclick="chartPage='song';chartDetail='';charts()">Billboard Hot 100</button></div></div><div class="card"><div class="scroll"><table><tr><th>This week</th><th>Last week</th><th>Move</th><th>${chartPage==='album'?'Album':'Single'}</th>${streamShareNow()>0?'<th>Streams</th>':''}<th>Sales</th><th>Units</th>${radio?'<th>Radio</th>':''}<th>Weeks on chart</th><th>Peak</th><th>Weeks at #1</th></tr>${sorted.map(x=>{let r=weeklySummary(x.work);return `<tr><td><b>${r.current?.rank?'#'+r.current.rank:r.current?'Out':'—'}</b></td><td>${r.previous?.rank?'#'+r.previous.rank:'—'}</td><td>${r.movement}</td><td><button class="ghost compact" onclick="chartDetail='${x.id}';charts()">${esc(x.title)}</button>${r.current?.hot?'<br><small>Breakout run</small>':''}${chartPage==='song'?'<br><small>'+esc(x.album.title)+'</small>':''}${chartPage==='song'&&songChartExitReason(x.album,x.work)?'<br><small>'+songChartExitReason(x.album,x.work)+'</small>':''}</td>${streamShareNow()>0?`<td>${r.current?num(r.current.streams):'Not tracked yet'}</td>`:''}<td>${r.current?num(r.current.sales||0):'Not tracked yet'}</td><td>${r.current?num(r.current.units):'—'}</td>${radio?`<td>${r.current?num(r.current.airplay||0):'—'}</td>`:''}<td>${r.weeks}</td><td>${r.peak?'#'+r.peak:'—'}${x.work.legacyPeak?'*':''}</td><td>${r.ones}</td></tr>`}).join('')||'<tr><td colspan="'+((radio?11:10)-(streamShareNow()>0?0:1))+'">No released '+(chartPage==='album'?'albums':'songs')+' yet.</td></tr>'}</table></div><p class="footnote">Songs have no time limit on the chart, but Billboard’s recurrent rules apply: after 20 weeks a song is removed if it falls below No. 50, after 26 weeks below No. 25, after 52 weeks below No. 10 and after 78 weeks below No. 5. A removed song does not return, but its sales still count. Chart rank compares one week’s units, not lifetime totals. Royalties are paid weekly and continue after chart exit. Monthly stream and money reports are separate and add up these weeks. Tracking by week began with this update; older monthly peaks are kept as legacy records (*).</p></div>${selected?chartDetailHTML(selected):''}`}
function chartDetailHTML(x){
  let r=weeklySummary(x.work),weeks=[...(x.work.chartWeeks||[])].sort((a,b)=>b.w-a.w).slice(0,52),radio=chartPage==='song',months=[...(x.work.chartHistory||[])].sort((a,b)=>b.month-a.month).slice(0,24);
  return `<div class="card"><h3>${esc(x.title)} · chart history</h3><p class="muted">${r.peak?'Best position: #'+r.peak:'No chart entry yet'} · ${r.weeks} week(s) on the chart · ${r.ones} week(s) at #1</p>${weeklyPlot(x.work.chartWeeks||[],chartPage==='album'?200:100)}<details><summary>Weekly positions</summary><div class="scroll"><table><tr><th>Week ending</th><th>Position</th>${streamShareNow()>0?'<th>Streams</th>':''}<th>Sales</th><th>Units</th>${radio?'<th>Radio</th>':''}</tr>${weeks.map(p=>`<tr><td>${fmtDay(p.d+6)}</td><td>${p.rank?'#'+p.rank:'Outside chart'}</td>${streamShareNow()>0?`<td>${num(p.streams)}</td>`:''}<td>${num(p.sales||0)}</td><td>${num(p.units)}</td>${radio?`<td>${num(p.airplay||0)}</td>`:''}</tr>`).join('')||'<tr><td colspan="'+((radio?6:5)-(streamShareNow()>0?0:1))+'">Your first weekly chart arrives when this week ends.</td></tr>'}</table></div></details><details><summary>Monthly totals (separate from the weekly chart)</summary><p class="footnote">The monthly figure counts all listening and buying of the release together; the weekly chart splits it into streams and sales by format.</p><div class="scroll"><table><tr><th>Month</th><th>Best weekly position</th>${streamShareNow()>0?'<th>All consumption</th>':''}<th>Units</th></tr>${months.map(p=>`<tr><td>${MONTHS[p.month%12]} ${year(p.month)}</td><td>${p.rank?'#'+p.rank:'—'}</td>${streamShareNow()>0?`<td>${num(p.streams)}</td>`:''}<td>${num(p.units??0)}</td></tr>`).join('')}</table></div></details></div>`}
function weeklyPlot(points,limit){
  let data=[...points].sort((a,b)=>a.w-b.w).slice(-52);if(!data.length)return '<p class="muted">No weekly chart positions yet.</p>';
  let first=data[0].w,last=data.at(-1).w,px=p=>50+(p.w-first)/Math.max(1,last-first)*610,py=p=>25+(p.rank-1)/(limit-1)*180,lines='';
  for(let i=1;i<data.length;i++){let a=data[i-1],b=data[i];if(a.rank&&b.rank&&b.w-a.w===1)lines+=`<line x1="${px(a)}" y1="${py(a)}" x2="${px(b)}" y2="${py(b)}" stroke="var(--lime)" stroke-width="3"/>`}
  return `<svg viewBox="0 0 710 260" role="img" aria-label="Weekly chart positions; number one is at the top" style="width:100%;max-height:300px"><line x1="50" y1="25" x2="660" y2="25" stroke="#343a31"/><line x1="50" y1="205" x2="660" y2="205" stroke="#343a31"/><text x="0" y="30" fill="#a8afa2" font-size="14">#1</text><text x="0" y="210" fill="#a8afa2" font-size="14">#${limit}</text>${lines}${data.filter(p=>p.rank).map(p=>`<circle cx="${px(p)}" cy="${py(p)}" r="4" fill="#d6ff62"><title>Week ending ${fmtDay(p.d+6)}: #${p.rank}</title></circle>`).join('')}<text x="50" y="245" fill="#a8afa2" font-size="14">${fmtDay(data[0].d+6)}</text><text x="660" y="245" text-anchor="end" fill="#a8afa2" font-size="14">${fmtDay(data.at(-1).d+6)}</text></svg><p class="footnote">Higher on the plot means a better rank. Gaps mean the release was outside the chart that week.</p>`}
