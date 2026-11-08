'use strict';
// Optional presentation around saved award entries. Winners and award rewards belong to processAwards.
const AWARD_CARPET_QUESTIONS=[
 ['What would make tonight meaningful, whatever the result?','Celebrate being nominated alongside other musicians','Thank the people who helped you get here','Keep expectations private'],
 ['How do you think about competing nominees?','Recognise the different strengths of their work','Keep the competition focused on the music','Say the nomination is already an honour'],
 ['Which detail of {album} would you like people to hear more closely?','Discuss one musical decision behind the record','Give the musicians and writers credit','Invite listeners to find their own favourite detail'],
 ['What did working with other artists teach you?','Name a contribution that changed the song','Explain how you learned to listen in the room','Keep the answer focused on the finished music','award-carpet-collab'],
 ['How do you handle seeing a professional rival at the same ceremony?','Respect their work without reopening the dispute','Keep the conversation warm and brief','Decline the comparison and discuss your music','award-carpet-rival'],
 ['Which part of your career are you proud of beyond the trophies?','Talk about finishing a difficult song','Thank the listeners who stayed with your music','Describe the work that happens off camera'],
 ['What can you tell us about the music you want to make next?','Discuss a creative question you are exploring','Share an influence without promising a release date','Keep the next chapter a surprise'],
 ['What does hearing your songs in a room like this feel like?','Reflect on the journey to this nomination','Celebrate the team behind the recording','Make a light joke about the nerves']
];
PRESS_QUESTIONS['award-carpet']=AWARD_CARPET_QUESTIONS;
const awardNightQuestionBase=pressQuestionAllowed;
pressQuestionAllowed=function(q){if(q[4]==='award-carpet-collab')return !!awardNightCollaborator();if(q[4]==='award-carpet-rival')return !!awardNightRival();return awardNightQuestionBase(q)};
function ensureAwardNights(){s.awardNights??={since:s.month,nights:[]};s.awardNights.nights??=[];s.awardNights.since??=s.month;return s.awardNights}
function awardNightKey(show,at){return 'night-'+show+'-'+at}
function awardNightEntries(n){return s.awardEntries.filter(e=>e.nominated&&e.show===n.show&&e.at===n.at)}
function awardNightWins(n){return awardNightEntries(n).filter(e=>e.status==='Won')}
function awardNightReady(n){let list=awardNightEntries(n);return list.length>0&&list.every(e=>['Won','Nominated · no win'].includes(e.status))}
function awardNightName(show,at){let entries=s.awardEntries.filter(e=>e.show===show&&e.at===at),h=s.worldMode==='realistic'?realShow(show,year(at)):ORIGINAL_SHOWS.find(h=>h.id===show);return entries.find(e=>e.showName)?.showName||h?.name||show}
function awardNightGroups(){let groups=new Map(),d=ensureAwardNights();for(let e of s.awardEntries)if(e.nominated&&e.at>=s.month&&e.at<=s.month+1&&e.at>=d.since){let key=awardNightKey(e.show,e.at);if(!groups.has(key))groups.set(key,{key,show:e.show,at:e.at,name:awardNightName(e.show,e.at)})}return [...groups.values()].sort((a,b)=>a.at-b.at||a.show.localeCompare(b.show))}
function awardNightCollaborator(){let ids=new Set((s.industryDesk?.collabs||[]).filter(c=>c.status==='Completed').map(c=>c.artist));for(let {t}of releasedRecordings())for(let c of t.credits||[])if(c.artist)ids.add(c.artist);return activeArtists().filter(a=>ids.has(a.id)).sort((a,b)=>b.bond-a.bond||a.id.localeCompare(b.id))[0]||null}
function awardNightRival(){return activeArtists().filter(a=>rivalFor(a.id).intensity>0&&rivalFor(a.id).intensity<40).sort((a,b)=>rivalFor(b.id).intensity-rivalFor(a.id).intensity||a.id.localeCompare(b.id))[0]||null}
function awardNightPlan(key,decline=false){
 if(s.retired)return;let group=awardNightGroups().find(g=>g.key===key);if(!group)return;let d=ensureAwardNights(),n=d.nights.find(n=>n.key===key);if(n&&n.status!=='Planned')return;
 if(!n){n={...group,status:'Planned',stage:'carpet',effects:[],notes:[],answers:[],repDelta:0};d.nights.unshift(n);}
 if(decline)n.status='Declined';render();
}
function awardNightBegin(key){
 let group=awardNightGroups().find(g=>g.key===key),d=ensureAwardNights(),n=d.nights.find(n=>n.key===key);
 if(n?.status==='Attending')return awardNightOpen(key);
 if(!group||group.at!==s.month||n&&n.status!=='Planned'||s.retired)return;
 if(!awardNightReady(group))return say('This ceremony’s results have not been announced by the existing awards system yet. Check back after monthly award processing.');
 if(s.pressDesk.active)return say('Finish your current interview before starting the ceremony.');
 if(!canAct(0,6))return;s.ap--;change({energy:-6});
 if(!n){n={...group,status:'Planned',effects:[],notes:[],answers:[],repDelta:0};d.nights.unshift(n);}
 n.status='Attending';n.stage='carpet';n.started=s.month;n.effects??=[];n.notes??=[];n.answers??=[];
 let pool=unasked({id:'award-carpet'}),chosen=pool[0],a=s.albums.find(a=>a.id===awardNightEntries(n)[0]?.album);
 if(chosen){n.question={id:chosen.id,prompt:pressText(chosen.q[0],a),answers:chosen.q.slice(1,4).map(v=>pressText(v,a)),topic:chosen.q[4]||''};s.pressDesk.used.push(...(s.pressDesk.used.includes(chosen.id)?[]:[chosen.id]));s.pressDesk.askedAt[chosen.id]=s.month;}
 else n.question=null;
 d.nights=[...d.nights.filter(x=>['Attending','Planned'].includes(x.status)),...d.nights.filter(x=>!['Attending','Planned'].includes(x.status)).slice(0,40)];
 render();awardNightOpen(key);
}
function awardNightInteractive(n){return !!n&&n.status==='Attending'&&!s.retired&&s.month<=n.at+1}
function awardNightAnswer(key,i){
 let n=ensureAwardNights().nights.find(n=>n.key===key);if(!awardNightInteractive(n)||n.stage!=='carpet'||!n.question||![0,1,2].includes(i))return;
 let q=n.question;n.answers.push({question:q.prompt,answer:q.answers[i]});n.notes.push('Red carpet: '+q.answers[i]+'.');
 let person=q.topic==='award-carpet-collab'?awardNightCollaborator():q.topic==='award-carpet-rival'?awardNightRival():null;
 if(i===0)n.effects.push({rep:1,artist:person?.id,bond:person?1:0});else if(i===1&&person)n.effects.push({artist:person.id,bond:1});
 n.stage='announcement';render();awardNightOpen(key);
}
function awardNightAnnounce(key){let n=ensureAwardNights().nights.find(n=>n.key===key);if(!awardNightInteractive(n)||!['carpet','announcement'].includes(n.stage)||!awardNightReady(n))return;if(n.stage==='carpet'){n.stage='announcement';render();awardNightOpen(key);return;}n.stage=awardNightWins(n).length?'speech':'reaction';if(n.stage==='reaction')n.moment=awardNightMoment(n);render();awardNightOpen(key)}
const AWARD_SPEECHES={grateful:{name:'Grateful',text:'You thank collaborators, fans and the people who supported the work.'},emotional:{name:'Emotional',text:'You reflect on the journey without turning it into a promise of future success.'},confident:{name:'Confident',text:'You celebrate the work and persistence behind the achievement.'},humorous:{name:'Humorous',text:'You share a lighthearted remark and keep the humour kind.'}};
function awardNightSpeech(key,style){
 let n=ensureAwardNights().nights.find(n=>n.key===key);if(!awardNightInteractive(n)||n.stage!=='speech'||!AWARD_SPEECHES[style]||!awardNightWins(n).length||n.speech)return;
 n.speech=style;n.notes.push(AWARD_SPEECHES[style].name+' speech: '+AWARD_SPEECHES[style].text);
 let person=style==='grateful'?awardNightCollaborator():null;n.effects.push(style==='grateful'?{rep:1,artist:person?.id,bond:person?2:0}:style==='emotional'?{rep:1,happiness:1}:style==='confident'?{buzz:1}: {happiness:1});
 n.stage='reaction';n.moment=awardNightMoment(n);render();awardNightOpen(key);
}
// Existing story/option objects keep these small, saveable and consistent with other decisions.
function awardNightMoment(n){
 if(chapterHash(n.key+':moment')>.5)return null;
 let wins=awardNightWins(n),entries=awardNightEntries(n),rival=awardNightRival(),collaborator=awardNightCollaborator(),admired=activeArtists().filter(a=>a.popularity>=75&&a.popularity>playerStanding()).sort((a,b)=>b.popularity-a.popularity||a.id.localeCompare(b.id))[0],quality=Math.max(0,...wins.map(e=>s.albums.find(a=>a.id===e.album)?.quality||0)),pool=[];
 function add(id,title,text,yes,no,effect={},v={}){pool.push(story(n.key+'-'+id,'Awards night',title,text,[option(yes,'A small social effect; award results remain unchanged.',v,yes+'.',{kind:'awardNightSocial',...effect}),option(no,'No penalty.',{},no+'.')]))}
 if(wins.some(e=>/^(Album|Record|Song|Artist|Entertainer) of the Year$/.test(e.category)))add('major','A major award, a quiet moment','The award is yours. Away from the microphones, someone asks what you will remember about the evening.','Thank the team again','Keep the moment private',{}, {rep:1});
 if(entries.some(e=>e.status==='Nominated · no win'))add('loss','After a category goes another way','A camera catches your reaction after a category you were nominated in is awarded elsewhere.','Applaud and keep the moment gracious','Take a quiet moment away from the cameras',{}, {rep:1});
 if(wins.length&&rival)add('rival','Congratulations across a professional divide',rival.name+' offers congratulations. Your existing disagreement is still there, but the gesture is friendly.','Thank them and acknowledge their music','Keep it cordial and brief',{artist:rival.id,bond:2,rival:-2});
 if(collaborator)add('reunion','A familiar face between categories',collaborator.name+' recalls a recording session you shared. The credit and collaboration are already part of your career.','Ask about their latest work','Offer a warm hello and keep moving',{artist:collaborator.id,bond:2});
 if(age()>=18)add('afterparty','An invitation after the final award','A small industry reception offers a chance to stay and talk. Rest is an equally reasonable choice.','Stay for a short conversation','Thank the hosts and head home',{}, {happiness:1,energy:-2});
 if(admired)add('admired','A musician you admire is nearby',admired.name+' has a moment to talk between appearances. A brief introduction is possible; it is not a collaboration deal.','Introduce yourself and mention their music','Give them space',{artist:admired.id,bond:2});
 if(wins.length&&n.speech&&quality>=85&&s.rep>=70)add('applause','The room responds warmly','Strong work and your acceptance remarks meet an enthusiastic response in the room.','Share the acknowledgement with the team','Let the moment speak for itself',{}, {rep:1});
 if(wins.length&&['humorous','confident'].includes(n.speech)&&s.rep>=65&&s.fans>=50000)add('speech','A speech becomes a talking point','Your short acceptance remarks attract a little extra media attention after the ceremony.','Keep the follow-up focused on the music','Leave the speech as it was',{}, {buzz:1});
 return pool.length?pool[Math.floor(chapterHash(n.key+':which')*pool.length)]:null;
}
function awardNightReact(key,i){let n=ensureAwardNights().nights.find(n=>n.key===key);if(!awardNightInteractive(n)||n.stage!=='reaction'||!n.moment||![0,1].includes(i)||n.reaction!==undefined)return;let o=n.moment.options[i];n.reaction=i;n.notes.push(n.moment.title+': '+o.label+'.');n.effects.push({...o.v,...(o.effect||{})});awardNightFinish(key);awardNightOpen(key)}
function awardNightFinish(key,leftEarly=false){
 let n=ensureAwardNights().nights.find(n=>n.key===key);if(!n||n.status!=='Attending'||n.settled||!awardNightReady(n)||s.retired)return;
 // Mark settled before any log/render hook, so repeated clicks and save restoration cannot replay effects.
 n.settled=true;n.status=leftEarly?'Left early':'Completed';n.stage='summary';n.completed=s.month;n.repDelta=0;n.interactions=[];
 for(let e of n.effects||[]){let rep=s.rep;change({rep:e.rep||0,buzz:e.buzz||0,happiness:e.happiness||0,energy:e.energy||0});n.repDelta+=s.rep-rep;let a=e.artist&&activeArtists().find(a=>a.id===e.artist);if(a){let before=a.bond;a.bond=cap(a.bond+(e.bond||0));if(a.bond!==before)n.interactions.push(a.name+': friendship '+(a.bond-before>0?'+':'')+(a.bond-before));if(e.rival&&rivalFor(a.id).intensity>0)shiftRival(a,e.rival,'A cordial exchange at '+n.name+' eased a small professional disagreement.');}}
 let entries=awardNightEntries(n),wins=awardNightWins(n),result=entries.length+' nomination(s), '+wins.length+' win(s). '+(n.notes.join(' ')||'You kept your appearance brief.')+' Reputation '+(n.repDelta>=0?'+':'')+n.repDelta+' from ceremony choices.';
 if(!s.pressDesk.history.some(e=>e.offer===n.key))s.pressDesk.history.unshift({offer:n.key,show:'award-carpet',programme:n.name+' · red carpet & ceremony',mediaType:'Awards ceremony',album:entries[0]?.album||null,month:n.at,questions:n.question?[{id:n.question.id}]:[],answers:n.answers||[],result});
 s.pressDesk.history=s.pressDesk.history.slice(0,100);log('Ceremony recap',n.name+': '+result);
 if(wins.length||n.moment&&n.reaction===0)industryEvent('recap-'+n.key,n.name+' · your awards night',result,'award',n.at,'Alternate history');
 render();
}
function syncAwardNights(){for(let n of ensureAwardNights().nights){if(n.status==='Planned'&&s.month>n.at)n.status='Did not attend';if(n.status==='Attending'&&s.month>n.at+1)awardNightFinish(n.key,true)}}
function awardNightSummary(n){let entries=awardNightEntries(n),wins=awardNightWins(n);return `<h3>${entries.length} nomination(s) · ${wins.length} win(s)</h3><ul>${entries.map(e=>`<li><b>${esc(e.category)}</b> · ${esc(e.title)} · ${e.status==='Won'?'Winner':e.status==='Nominated'?'Awaiting announcement':'Nominee; did not win'}</li>`).join('')}</ul>${(n.notes||[]).map(text=>`<p>${esc(text)}</p>`).join('')}${(n.interactions||[]).map(text=>`<p>${esc(text)}</p>`).join('')}${n.settled?`<p>Reputation from your ceremony choices: <b>${n.repDelta>=0?'+':''}${n.repDelta}</b>. Existing award rewards were handled separately, once.</p>`:''}`}
function awardNightOpen(key){
 let n=ensureAwardNights().nights.find(n=>n.key===key);if(!n)return;let html=`<h2>${esc(n.name)}</h2><p>${eraDate(n.at)} · ${esc(n.status)}</p>`;
 if(n.stage==='summary'||n.settled)html+=awardNightSummary(n);
 else if(n.status==='Attending'){
  if(n.stage==='carpet')html+=`<div class="eyebrow">1 · RED CARPET</div>${n.question?`<p class="big">${esc(n.question.prompt)}</p>${n.question.answers.map((answer,i)=>btn(answer,'A short answer; no extra action cost.',`awardNightAnswer('${n.key}',${i})`)).join('')}`:'<p>You pass the interview line and head into the ceremony.</p>'}<button onclick="awardNightAnnounce('${n.key}')">Skip interview & view announcements</button>`;
  if(n.stage==='announcement')html+=`<div class="eyebrow">2 · ANNOUNCEMENTS</div>${awardNightSummary(n)}<button class="primary" onclick="awardNightAnnounce('${n.key}')">${awardNightWins(n).length?'Your acceptance speech':'After the ceremony'}</button>`;
  if(n.stage==='speech')html+=`<div class="eyebrow">3 · ACCEPTANCE SPEECH</div>${awardNightSummary(n)}<p>One short speech represents your acceptance remarks for the night.</p>${Object.entries(AWARD_SPEECHES).map(([id,p])=>btn(p.name,p.text,`awardNightSpeech('${n.key}','${id}')`)).join('')}`;
  if(n.stage==='reaction')html+=`<div class="eyebrow">4 · AFTER THE CEREMONY</div>${n.moment?`<h3>${esc(n.moment.title)}</h3><p>${esc(n.moment.text)}</p>${n.moment.options.map((o,i)=>btn(o.label,o.hint,`awardNightReact('${n.key}',${i})`)).join('')}`:'<p>The cameras move on. Take a moment to look back on the night.</p><button class="primary" onclick="awardNightFinish(\''+n.key+'\');awardNightOpen(\''+n.key+'\')">View your recap</button>'}`;
  html+=`<p class="footnote">Your attendance action was already paid. You may close this window and continue from Awards. Choices never change this ceremony’s nominees or winners.</p><button onclick="awardNightFinish('${n.key}',true);awardNightOpen('${n.key}')">Finish now · skip remaining choices</button>`;
 }else html+='<p>Attendance is optional. No rewards or penalties for skipping the ceremony.</p>';
 html+='<button onclick="closeModal()">Close</button>';modal(html);scheduleBrowserSave();
}
function awardNightsHTML(){
 let d=ensureAwardNights(),groups=awardNightGroups(),active=d.nights.filter(n=>n.status==='Attending');
 return `<details class="card" ${groups.length||active.length?'open':''}><summary>Awards night · optional ceremonies</summary><p>Plan attendance after a nomination, then attend during the ceremony month: <b>1 action · 6 energy · no fee</b>. One red-carpet question, announcements, a speech if you win, and an optional reaction. Award results and rewards remain with the existing awards system.</p>${active.map(n=>`<div class="entry"><b>${esc(n.name)}</b> · ${eraDate(n.at)}<br><button onclick="awardNightOpen('${n.key}')">Continue ceremony · already paid</button></div>`).join('')}${groups.map(g=>{let n=d.nights.find(n=>n.key===g.key);if(n&&n.status!=='Planned')return '';return `<div class="entry"><h3>${esc(g.name)} · ${eraDate(g.at)}</h3><p>${awardNightEntries(g).length} nomination(s) · ${n?'Attendance planned':'You choose whether to attend'}</p>${g.at===s.month?`<button onclick="awardNightBegin('${g.key}')" ${s.retired||s.ap<1||s.energy<6||!awardNightReady(g)?'disabled':''}>Attend · 1 action, 6 energy</button>`:`<button onclick="awardNightPlan('${g.key}')" ${n||s.retired?'disabled':''}>${n?'Planned':'Plan attendance · free'}</button>`}<button onclick="awardNightPlan('${g.key}',true)" ${s.retired?'disabled':''}>Skip · no penalty</button></div>`}).join('')||(!active.length?'<p>No eligible ceremony invitations right now. Nominations create attendance options for the existing ceremony date.</p>':'')}<details><summary>Your ceremony recaps</summary>${d.nights.filter(n=>n.settled).map(n=>`<details class="entry"><summary>${esc(n.name)} · ${eraDate(n.at)} · ${esc(n.status)}</summary>${awardNightSummary(n)}</details>`).join('')||'<p>Completed appearances will be kept here and in your Press archive.</p>'}</details></details>`;
}
const nightAwardsBase=awards;awards=function(){nightAwardsBase();$('view').innerHTML=awardNightsHTML()+$('view').innerHTML};
const nightPressBase=press;press=function(){nightPressBase();if(!s.pressDesk.active&&awardNightGroups().length)$('view').innerHTML=`<div class="card"><h3>Invited to an awards ceremony</h3><p>Your nominations include an optional awards-night appearance. Review attendance and recaps in Awards.</p><button onclick="show('awards')">Awards night</button></div>`+$('view').innerHTML};
const nightProcessBase=processAwards;processAwards=function(){nightProcessBase();syncAwardNights()};
