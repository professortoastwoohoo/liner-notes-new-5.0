'use strict';
// Superstar phases 1–2 only. Additive metadata, canonical recordings and existing actions.
const LYRICAL_THEMES=['Love','Heartbreak','Ambition','Nostalgia','Friendship','Fame','Independence','Personal growth'];
const CREATIVE_DIRECTIONS=['Acoustic','Experimental','Commercial','Emotionally expressive'];
const FAN_LETTERS=[
 ['A song for the journey','Your songs made a long journey feel a little less lonely.','Thank them for taking the music along',{happiness:1}],
 ['Learning the chords','I’m learning an instrument and finally played one of your songs all the way through.','Encourage their next practice session',{happiness:1}],
 ['The overlooked track','That quiet track everyone skips is the one I keep returning to.','Share a detail about writing it',{buzz:1}],
 ['A new friendship','I met a friend because we both loved your music.','Celebrate the friendship',{happiness:1}],
 ['A wish for a live show','I hope to hear these songs live someday. Even a tiny room would be special.','Thank them for supporting the songs',{rep:1}],
 ['A family playlist','Someone in my family introduced me to your songs. Now we listen together.','Send a warm thank-you',{happiness:1}],
 ['A handwritten chorus','I wrote my favourite line in my notebook. It reminds me to keep going.','Explain what that line means to you',{happiness:1}],
 ['A cover from home','I recorded a rough cover at home. It is imperfect, but making it was so much fun.','Encourage them to keep creating',{rep:1}],
 ['An unexpected favourite','I came for the single and stayed for the rest of the record.','Recommend another catalogue song',{buzz:1}],
 ['Looking forward','Whatever you make next, I hope it is something you are proud of.','Thank them for leaving room to grow',{happiness:1}]
];
function ensureFanCulture(){
 if(!s.fanCulture)s.fanCulture={name:'',letters:[],reactions:[],campaigns:[],cursor:0,campaignCursor:0,lastLetter:s.month-2,lastCampaign:s.month,lastMonth:s.month};
}
const cultureEnsureBase=ensureFanGrowth;
ensureFanGrowth=function(){cultureEnsureBase();ensureFanCulture()};
FAN_ACTIONS.push({id:'meetgreet',name:'Host a fan meet-and-greet',group:'Build a community',cost:120,energy:12,lo:25,hi:70,skill:'rep',cooldown:3,minFans:100,music:true,desc:'A small, supervised fan gathering with a Q&A and photos. One action; modest discovery, no ticket windfall. Guardian support is included for younger artists.'});
function fanbaseName(){ensureFanCulture();return s.fanCulture.name||'Your listeners'}
function renameFanbase(){ensureFanCulture();if(s.retired)return;let name=String($('fanbaseName').value||'').trim().slice(0,40);s.fanCulture.name=name;log('Fanbase name',name?`Your listeners are now known as ${name}.`:'You chose to leave the fanbase unnamed.');say('Fanbase name saved. Renaming does not grant fans or money.')}
function answerFanLetter(id,choice){
 ensureFanCulture();let entry=s.fanCulture.letters.find(x=>x.id===id);if(!entry||entry.status!=='Unread'||![0,1].includes(choice)||s.retired)return;
 if(choice===0){if(!canAct(0,2))return;s.ap--;change({energy:-2,...FAN_LETTERS[entry.template][3]});entry.status='Replied';log('A fan letter answered',FAN_LETTERS[entry.template][2]+'.')}else entry.status='Kept privately';
 entry.responded=s.month;say(choice===0?'Your short reply is recorded.':'Letter kept privately. No penalty for leaving a message unanswered.');
}
function fanCultureHTML(){
 ensureFanCulture();let f=s.fanCulture;
 return `<div class="card"><div class="eyebrow">FAN CULTURE</div><h2>${esc(fanbaseName())}</h2><label>Fanbase name<input id="fanbaseName" maxlength="40" value="${esc(f.name)}" placeholder="Give your listeners a name"></label><button onclick="renameFanbase()" ${s.retired?'disabled':''}>Save / rename</button><p class="footnote">Naming is optional and free. Fan letters arrive occasionally once you have released music and reached 50 fans. Replies use 1 action and 2 energy; keeping or ignoring a letter has no penalty.</p><h3>Fan letters</h3>${f.letters.length?f.letters.slice(0,10).map(e=>{let q=FAN_LETTERS[e.template];return `<details ${e.status==='Unread'?'open':''}><summary>${esc(q[0])} · ${MONTHS[e.month%12]} ${year(e.month)} · ${esc(e.status)}</summary><p>“${esc(q[1])}”</p>${e.status==='Unread'?`<div class="actions"><button onclick="answerFanLetter('${e.id}',0)" ${s.retired||s.ap<1||s.energy<2?'disabled':''}>${esc(q[2])} · 1 action</button><button onclick="answerFanLetter('${e.id}',1)" ${s.retired?'disabled':''}>Keep privately · free</button></div>`:''}</details>`}).join(''):'<p class="muted">Letters will appear here as listeners discover your music.</p>'}<h3>Around the fanbase</h3>${f.reactions.slice(0,8).map(e=>`<p><small>${MONTHS[e.month%12]} ${year(e.month)}</small><br>${esc(e.text)}</p>`).join('')||'<p class="muted">Reactions to new releases, tours and career milestones will appear here.</p>'}${f.campaigns.length?`<h3>Fan-organised campaigns</h3>${f.campaigns.slice(0,6).map(e=>`<p><b>${esc(e.title)}</b> · ${MONTHS[e.month%12]} ${year(e.month)}<br>${esc(e.text)}</p>`).join('')}`:''}</div>`;
}
const cultureFanBase=fanGrowth;
fanGrowth=function(){cultureFanBase();$('view').innerHTML=fanCultureHTML()+$('view').innerHTML};
function fanReaction(title,text){
 ensureFanCulture();let f=s.fanCulture;if(s.fans<50)return;
 let kind=/^(Album|EP|Standalone single) released$|^A single before the era$/.test(title)?'release':/^The final encore$|^Live in /.test(title)?'tour':/^(Award won|An award nomination|An award win|A trophy|They called your name|Contract completed|A lasting change|A new chapter|A career milestone)/.test(title)?'career':'';
 if(!kind||f.reactions.some(r=>r.month===s.month&&r.kind===kind))return;
 let rows=kind==='release'?['Listeners are comparing favourite tracks and sharing first impressions.','The new release has started a lively discussion about the lyrics.','Some fans miss the earlier sound; others are excited by this chapter.']:kind==='tour'?['Fans are trading favourite live moments and setlist memories.','Listeners who missed the show are hoping for another visit.','The crowd’s favourite chorus keeps coming up in fan conversations.']:['Longtime listeners are looking back at how far your career has come.','Fans are celebrating this new chapter and wondering what comes next.'];
 f.reactions.unshift({month:s.month,kind,context:title,text:`${fanbaseName()}: ${rows[(s.month+f.reactions.length)%rows.length]} (${kind==='release'?text.split(':')[0].slice(0,80):kind==='tour'?(s.tours[0]?.title||title):title})`});f.reactions=f.reactions.slice(0,24);
}
const cultureLogBase=log;log=function(title,text){cultureLogBase(title,text);fanReaction(title,text)};
function processFanCulture(){
 ensureFanCulture();let f=s.fanCulture;if(f.lastMonth===s.month)return;f.lastMonth=s.month;
 if(s.retired||s.fans<50||!releasedRecordings().length)return;
 if(s.month-f.lastLetter>=3){f.lastLetter=s.month;let template=f.cursor++%FAN_LETTERS.length;f.letters.unshift({id:uid('fan-letter'),month:s.month,template,status:'Unread'});f.letters=f.letters.slice(0,12)}
 if(s.fans<500||s.month-f.lastCampaign<6)return;f.lastCampaign=s.month;if(Math.random()>.3)return;
 let pool=releasedRecordings(),target=[...pool].sort((a,b)=>(b.t.total||0)-(a.t.total||0))[0],type=(f.campaignCursor||0)%3,title=['A catalogue listening day','Word-of-mouth week','An appreciation project'][type];
 let text=type===0?`Listeners revisit ${target.t.title}; a fading 3% stream lift uses the existing promotion system.`:type===1?'Listeners recommend your music to friends; a small number discover your catalogue.':'Fans collect favourite lyrics and memories. The gesture lifts your spirits.';
 f.campaignCursor=(f.campaignCursor||0)+1;if(type===0)boostWork(target.a,target.t,.03);else if(type===1)grow(Math.min(150,Math.round(Math.sqrt(s.fans)*.15)));else change({happiness:2});
 f.campaigns.unshift({month:s.month,title,text});f.campaigns=f.campaigns.slice(0,9);log('Fan-organised campaign',`${fanbaseName()}: ${title}. ${text}`);
}
const cultureProcessBase=processFanCampaigns;
processFanCampaigns=function(){cultureProcessBase();processFanCulture()};
function inspirationChoices(){return s.log.filter(e=>!['Monthly statement','Concert review','Building your audience','Fanbase name','A fan letter answered','Fan-organised campaign'].includes(e.title)).slice(0,30)}
function setCreativeDirection(value){if(s.retired||value&&!CREATIVE_DIRECTIONS.includes(value))return;draft.creativeDirection=value;studio()}
function setSongTheme(id,value){let t=draft.tracks.find(t=>t.id===id);if(!t||s.retired||releasedDraftTrack(t)||value&&!LYRICAL_THEMES.includes(value))return;t.lyricalTheme=value;studio()}
function setSongInspiration(id,index){let t=draft.tracks.find(t=>t.id===id),e=inspirationChoices()[Number(index)];if(!t||s.retired||releasedDraftTrack(t))return;if(index==='')delete t.inspiration;else if(e)t.inspiration={month:e.month,title:e.title,text:e.text.slice(0,200)};studio()}
function creativeStudioHTML(){
 let events=inspirationChoices();return `<details class="card"><summary>Creative process · optional</summary><p class="muted">Themes and inspirations describe the songs; they add no extra release steps. Musical direction draws on your existing skills, changing newly recorded song quality by at most 2 points. Released recordings remain locked.</p><label>Project’s musical direction<select onchange="setCreativeDirection(this.value)" ${s.retired?'disabled':''}><option value="">Let the songs lead · no modifier</option>${CREATIVE_DIRECTIONS.map(d=>`<option ${draft.creativeDirection===d?'selected':''}>${d}</option>`).join('')}</select></label><p class="footnote">Acoustic draws on performance (60+); experimental on craft (65+, otherwise a small risk); commercial on performance and campaign preparation; emotionally expressive on craft (55+). A life-event inspiration can add 1 point with craft 50+. Total adjustment −1 to +2; no choice guarantees a hit.</p>${draft.tracks.map(t=>{let locked=releasedDraftTrack(t);return `<details><summary>${esc(t.title)}${locked?' · Recorded':''}</summary><label>Lyrical theme<select onchange="setSongTheme('${t.id}',this.value)" ${locked||s.retired?'disabled':''}><option value="">Unspecified</option>${LYRICAL_THEMES.map(v=>`<option ${t.lyricalTheme===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Life-event inspiration<select onchange="setSongInspiration('${t.id}',this.value)" ${locked||s.retired?'disabled':''}><option value="">${t.inspiration?'Choose a new memory, or clear current one':'No linked memory'}</option>${events.map((e,i)=>`<option value="${i}">${MONTHS[e.month%12]} ${year(e.month)} · ${esc(e.title)}</option>`).join('')}</select></label>${t.inspiration?`<p>Linked: ${esc(t.inspiration.title)} · ${MONTHS[t.inspiration.month%12]} ${year(t.inspiration.month)}<br><small>${esc(t.inspiration.text)}</small></p><button onclick="setSongInspiration('${t.id}','')" ${locked||s.retired?'disabled':''}>Clear inspiration</button>`:''}</details>`}).join('')||'<p>Add songs to attach themes and memories.</p>'}</details>`;
}
function creativeTrackNote(t){let bits=[t.lyricalTheme,t.creativeDirection,t.inspiration?'Inspired by '+t.inspiration.title:''].filter(Boolean);return bits.length?'<br><small>'+bits.map(esc).join(' · ')+'</small>':''}
function creativeAdjustment(t){let d=draft.creativeDirection,n=d==='Acoustic'?(s.voice>=60?1:0):d==='Experimental'?(s.craft>=65?2:-1):d==='Commercial'?(s.voice>=60&&s.promo>=20?1:0):d==='Emotionally expressive'?(s.craft>=55?1:0):0;return Math.min(2,n+(t.inspiration&&s.craft>=50?1:0))}
const creativeRecordedBase=newRecordedTrack;
newRecordedTrack=function(t,q,streams){let record=creativeRecordedBase(t,q,streams);record.quality=Math.round(cap(record.quality+creativeAdjustment(t),15,100));if(LYRICAL_THEMES.includes(t.lyricalTheme))record.lyricalTheme=t.lyricalTheme;if(CREATIVE_DIRECTIONS.includes(draft.creativeDirection))record.creativeDirection=draft.creativeDirection;if(t.inspiration)record.inspiration=JSON.parse(JSON.stringify(t.inspiration));return record};
const CREATIVE_EVENTS=[
 ['The unfinished second verse','The chorus works, but every second verse feels forced.','Write a rough version without judging it',{prep:4,energy:-3},'Leave the draft overnight',{energy:3},'Study a favourite song’s structure',{prep:2,energy:-1}],
 ['Too close to the story','A personal song feels difficult to finish while the memory is still fresh.','Write around one small detail',{prep:4,energy:-2},'Put it aside for now',{happiness:2},'Try telling it from another perspective',{prep:3,energy:-2}],
 ['Every melody sounds familiar','Your current demos keep returning to the same melodic shape.','Try the chorus on another instrument',{prep:4,energy:-3},'Take a quiet creative break',{energy:3},'Simplify the melody and focus on the words',{prep:3,energy:-1}],
 ['The line that unlocks it','One ordinary conversation gives your unfinished song a clearer centre.','Build a verse around the image',{prep:6,energy:-3},'Save a voice note for later',{prep:2},'Follow the idea into a new chorus',{prep:5,energy:-2}],
 ['A rehearsal discovery','A stripped-back rehearsal reveals a melody hidden under the arrangement.','Keep the quieter arrangement',{prep:5,energy:-2},'Keep the original and save the idea',{prep:2},'Test both versions in the demo',{prep:6,energy:-4}],
 ['An unexpected connection','Two separate drafts suddenly seem to tell the same story.','Combine their strongest ideas',{prep:6,energy:-3},'Keep them as companion songs',{prep:3},'Step back and sketch the project’s arc',{prep:4,energy:-1}]
];
function creativeScenarios(){
 if(s.retired||!draft.tracks.some(t=>!releasedDraftTrack(t))||s.month<2)return [];let bucket=Math.floor(s.month/4);
 // One creative scenario per four-month period across all projects.
 if(s.usedEvents.some(id=>id.startsWith('creative-period'+bucket+'-')))return [];
 return CREATIVE_EVENTS.map((q,i)=>story('creative-period'+bucket+'-'+i,'Creative process',q[0],q[1],[option(q[2],'A small change to existing preparation, energy or happiness.',q[3],q[2]+'. You found a manageable next step.'),option(q[4],'A small change to existing preparation, energy or happiness.',q[5],q[4]+'. The unfinished song can wait.'),option(q[6],'A small change to existing preparation, energy or happiness.',q[7],q[6]+'. You gave the idea another direction.')]));
}
const creativeFreshBase=freshScenarios;freshScenarios=function(){return [...creativeFreshBase(),...creativeScenarios()]};
