'use strict';
// ===== Touring+: bigger tours, higher ticket prices, legs, custom cities and a much larger city list =====
// Saved tours point at cities by numeric index, so the original CITIES order is never changed. New built-in cities are appended after the
// original list; custom cities (stored in the save as s.customCities) are appended after those and re-registered whenever a save is loaded.
const TOUR_MAX_STOPS=200,TOUR_MAX_LEGS=12,TOUR_MAX_REST=6,TOUR_TICKET_MIN=15,TOUR_TICKET_MAX=500,TOUR_MAX_CUSTOM_CITIES=100;
const TOUR_REGIONS=['Asia','Oceania','Europe','North America','Latin America','Africa','Middle East'];
// Countries filed under Latin America for the world-recognition system, but treated as one travel zone with the US and Canada for touring costs.
const NA_TRAVEL_COUNTRIES=['Mexico','Puerto Rico','Jamaica','Dominican Republic','Costa Rica','Panama','Guatemala'];
const CITY_TEXT_OK=/^[\p{L}\p{N} .,'’()\-]{2,40}$/u;
const MARKET_SIZES=[['Small',.65],['Medium',.85],['Large',1],['Major',1.25]];

// ---- More built-in cities: [country, region, [[city, market multiplier], ...]] ----
const EXTRA_CITIES=[
['Australia','Oceania',[['Brisbane',.9],['Perth',.85],['Adelaide',.8],['Gold Coast',.7],['Canberra',.7],['Newcastle',.65],['Wollongong',.6],['Sunshine Coast',.6],['Geelong',.6],['Hobart',.55],['Darwin',.5],['Cairns',.5],['Townsville',.5]]],
['New Zealand','Oceania',[['Auckland',.8],['Wellington',.7],['Christchurch',.7],['Dunedin',.55],['Hamilton',.5],['Tauranga',.5],['Queenstown',.45]]],
['Malaysia','Asia',[['Kuala Lumpur',1],['George Town',.75],['Johor Bahru',.7],['Petaling Jaya',.65],['Kota Kinabalu',.55],['Kuching',.55],['Ipoh',.5],['Malacca',.5]]],
['Indonesia','Asia',[['Jakarta',1.1],['Bandung',.8],['Surabaya',.8],['Bali',.75],['Yogyakarta',.65],['Medan',.65],['Semarang',.55],['Makassar',.55]]],
['China','Asia',[['Shanghai',1.2],['Beijing',1.2],['Guangzhou',1],['Shenzhen',1],['Chengdu',.9],['Hangzhou',.85],['Chongqing',.85],['Wuhan',.8],['Nanjing',.8],["Xi'an",.75],['Tianjin',.75],['Suzhou',.7],['Changsha',.7],['Qingdao',.65],['Xiamen',.65],['Zhengzhou',.65],['Shenyang',.6],['Harbin',.55],['Kunming',.55]]],
['Vietnam','Asia',[['Ho Chi Minh City',.9],['Hanoi',.85],['Da Nang',.6]]],
['Thailand','Asia',[['Chiang Mai',.6],['Phuket',.55],['Pattaya',.5]]],
['Philippines','Asia',[['Quezon City',.6],['Cebu',.65],['Davao',.55]]],
['South Korea','Asia',[['Busan',.85],['Incheon',.7],['Daegu',.6],['Daejeon',.55],['Gwangju',.5]]],
['India','Asia',[['Mumbai',1],['Delhi',1],['Bengaluru',.9],['Hyderabad',.8],['Chennai',.8],['Kolkata',.75],['Pune',.7],['Ahmedabad',.65],['Jaipur',.55],['Goa',.5]]],
['United Arab Emirates','Middle East',[['Dubai',1],['Abu Dhabi',.85]]],
['Saudi Arabia','Middle East',[['Riyadh',.9],['Jeddah',.75]]],
['Israel','Middle East',[['Tel Aviv',.8],['Jerusalem',.5]]],
['Turkey','Middle East',[['Istanbul',.9],['Ankara',.65],['Izmir',.55]]],
['Lebanon','Middle East',[['Beirut',.6]]],
['Qatar','Middle East',[['Doha',.75]]],
['Egypt','Africa',[['Cairo',.75],['Alexandria',.5]]],
['Morocco','Africa',[['Casablanca',.6],['Marrakesh',.55]]],
['South Africa','Africa',[['Johannesburg',.8],['Durban',.6],['Pretoria',.55]]],
['Nigeria','Africa',[['Lagos',.8],['Abuja',.55]]],
['Kenya','Africa',[['Nairobi',.65]]],
['Ghana','Africa',[['Accra',.6]]],
['United States','North America',[['Baltimore',.75],['St. Louis',.75],['Cincinnati',.7],['Milwaukee',.7],['San Jose',.7],['Oakland',.65],['Anaheim',.65],['Memphis',.65],['Fort Worth',.6],['Buffalo',.6],['Louisville',.6],['Honolulu',.6],['Albuquerque',.55],['Tucson',.55],['Richmond',.55],['Providence',.55],['Jacksonville',.55],['Fort Lauderdale',.55],['Oklahoma City',.55],['Birmingham, AL',.5],['Knoxville',.5],['Lexington',.5],['El Paso',.5],['Charleston',.5],['Tulsa',.5],['Omaha',.5],['Madison',.5],['Grand Rapids',.5],['Hartford',.5],['Des Moines',.45],['Savannah',.45],['Chattanooga',.45],['Boise',.45],['Spokane',.45],['Reno',.45],['Anchorage',.4]]],
['Canada','North America',[['Mississauga',.65],['London, ON',.55],['Kitchener',.5],['Windsor',.5],['Kelowna',.45],['Regina',.45],['Moncton',.4],["St. John's",.4]]],
['Mexico','Latin America',[['Guadalajara',.85],['Monterrey',.85],['Tijuana',.6],['Puebla',.6],['Cancún',.6],['Mérida',.5],['León',.5],['Querétaro',.5],['Oaxaca',.4]]],
['Puerto Rico','Latin America',[['San Juan',.65]]],
['Jamaica','Latin America',[['Kingston',.55]]],
['Dominican Republic','Latin America',[['Santo Domingo',.6]]],
['Panama','Latin America',[['Panama City',.6]]],
['Costa Rica','Latin America',[['San José',.55]]],
['Guatemala','Latin America',[['Guatemala City',.5]]],
['Colombia','Latin America',[['Bogotá',.85],['Medellín',.7],['Cali',.5]]],
['Chile','Latin America',[['Santiago',.8]]],
['Peru','Latin America',[['Lima',.8]]],
['Brazil','Latin America',[['Rio de Janeiro',1],['Brasília',.6],['Belo Horizonte',.6],['Porto Alegre',.55],['Curitiba',.55],['Salvador',.5]]],
['Argentina','Latin America',[['Córdoba',.55],['Rosario',.45]]],
['Uruguay','Latin America',[['Montevideo',.55]]],
['Ecuador','Latin America',[['Quito',.5]]],
['Spain','Europe',[['Seville',.6],['Bilbao',.55],['Málaga',.5]]],
['Italy','Europe',[['Naples',.6],['Turin',.6],['Florence',.5]]],
['France','Europe',[['Toulouse',.55],['Bordeaux',.55],['Nice',.5],['Nantes',.5],['Strasbourg',.45]]],
['Germany','Europe',[['Düsseldorf',.6],['Stuttgart',.6],['Leipzig',.5],['Hanover',.5],['Dresden',.45]]],
['Poland','Europe',[['Gdańsk',.5],['Wrocław',.5]]],
['Greece','Europe',[['Athens',.6],['Thessaloniki',.5]]]];
for(const [country,region,list] of EXTRA_CITIES)for(const [name,mult] of list)if(!CITIES.some(c=>c[0]===name&&c[3]===country))CITIES.push([name,region,mult,country]);
const BUILTIN_CITY_COUNT=CITIES.length;

// ---- City helpers ----
const cleanText=(v,max=40)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
const cityZone=c=>NA_TRAVEL_COUNTRIES.includes(c[3])?'North America':c[1];// travel-cost zone and picker heading
const cityShort=c=>c[4]?.short||c[0];
// A stop keeps its own copy of a custom city so a played tour never depends on the custom-city list.
function stopCity(x){return x.cityRef||CITIES[x.cityIndex]||[x.city,x.region||'Asia',.8,'']}

// ---- Custom cities (saved in s.customCities, appended after the built-in list) ----
let customRegSig=null;
function cleanCustomCity(x){x=x&&typeof x==='object'?x:{};let name=cleanText(x.name),country=cleanText(x.country),ok=CITY_TEXT_OK.test(name)&&CITY_TEXT_OK.test(country);return{name:ok?name:'Custom city',country:ok?country:'Unknown',region:TOUR_REGIONS.includes(x.region)?x.region:'Asia',mult:cap(Number(x.mult)||.85,.3,1.4),hidden:!ok||!!x.hidden}}
function registerCustomCities(){
  if(!s)return;
  if(!Array.isArray(s.customCities))s.customCities=[];
  let sig=JSON.stringify(s.customCities);
  if(sig===customRegSig&&CITIES.length===BUILTIN_CITY_COUNT+s.customCities.length)return;
  s.customCities=s.customCities.slice(0,TOUR_MAX_CUSTOM_CITIES).map(cleanCustomCity);
  CITIES.length=BUILTIN_CITY_COUNT;
  for(const x of s.customCities)CITIES.push([`${x.name}, ${x.country}`,x.region,x.mult,x.country,{custom:true,short:x.name,hidden:x.hidden}]);
  customRegSig=JSON.stringify(s.customCities)}
function addCustomCity(){
  if(!s||s.retired)return;
  registerCustomCities();ensureTourLegs();
  let name=cleanText($('ccName')?.value),countryIn=cleanText($('ccCountry')?.value),regionIn=$('ccRegion')?.value||'',mult=cap(Number($('ccMarket')?.value)||.85,.3,1.4);
  if(!name||!countryIn)return say('Enter both a city and its country.');
  if(!CITY_TEXT_OK.test(name)||!CITY_TEXT_OK.test(countryIn))return say('City and country names can use letters, numbers, spaces and basic punctuation (2–40 characters).');
  let known=CITIES.find(c=>c[3].toLowerCase()===countryIn.toLowerCase()),country=known?known[3]:countryIn,region=TOUR_REGIONS.includes(regionIn)?regionIn:known?known[1]:'';
  if(!region)return say(`${countryIn} is a new country, so choose its region.`);
  let same=(a,b)=>a.toLowerCase()===b.toLowerCase(),idx=CITIES.findIndex(c=>same(cityShort(c),name)&&same(c[3],country));
  if(idx>=0){if(CITIES[idx][4]?.hidden){s.customCities[idx-BUILTIN_CITY_COUNT].hidden=false;registerCustomCities()}}
  else{
    if(s.customCities.length>=TOUR_MAX_CUSTOM_CITIES)return say(`You can keep up to ${TOUR_MAX_CUSTOM_CITIES} custom cities.`);
    s.customCities.push({name,country,region,mult});registerCustomCities();idx=CITIES.length-1}
  let L=tourDraft.legs[tourDraft.activeLeg],li=tourDraft.activeLeg;
  if(!L.cities.includes(idx)){
    if(tourDraft.cities.length>=TOUR_MAX_STOPS)return say(`A tour can have up to ${TOUR_MAX_STOPS} stops.`);
    L.cities.push(idx)}
  syncTourCities();tourPreview=null;tourUI.q='';
  say(`${CITIES[idx][0]} is ready and has been added to ${legName(L,li)}.`)}
function hideCustomCity(i){
  let k=i-BUILTIN_CITY_COUNT;if(!s||!s.customCities?.[k])return;
  s.customCities[k].hidden=true;registerCustomCities();ensureTourLegs();
  tourDraft.legs.forEach(L=>L.cities=L.cities.filter(x=>x!==i));syncTourCities();tourPreview=null;tours()}

// ---- Legs: tourDraft.legs is the source of truth; tourDraft.cities is always the flat ordered list of every leg's stops ----
const legName=(L,i)=>L.name||`Leg ${i+1}`;
function newLeg(name='',cities=[],rest=1){return{id:uid('leg'),name,cities,rest}}
function syncTourCities(){tourDraft.cities=tourDraft.legs.flatMap(L=>L.cities)}
function ensureTourLegs(){
  if(!tourDraft)return;
  if(!Array.isArray(tourDraft.legs)||!tourDraft.legs.length)tourDraft.legs=[newLeg('',Array.isArray(tourDraft.cities)?[...tourDraft.cities]:[],1)];// older saves and drafts: one leg holding the old route
  let total=0;
  tourDraft.legs=tourDraft.legs.slice(0,TOUR_MAX_LEGS).map(L=>{
    L=L&&typeof L==='object'?L:{};
    let cities=(Array.isArray(L.cities)?L.cities:[]).filter(i=>Number.isInteger(i)&&CITIES[i]&&!CITIES[i][4]?.hidden&&++total<=TOUR_MAX_STOPS);
    return{id:typeof L.id==='string'&&/^[a-zA-Z0-9_-]+$/.test(L.id)?L.id:uid('leg'),name:cleanText(L.name),cities,rest:cap(Math.round(Number(L.rest)||0),0,TOUR_MAX_REST)}});
  tourDraft.activeLeg=cap(Number.isInteger(tourDraft.activeLeg)?tourDraft.activeLeg:0,0,tourDraft.legs.length-1);
  syncTourCities()}
function tourCity(i,on){
  ensureTourLegs();
  let L=tourDraft.legs[tourDraft.activeLeg];if(!CITIES[i]||CITIES[i][4]?.hidden)return;
  if(on){
    if(L.cities.includes(i))return;
    if(tourDraft.cities.length>=TOUR_MAX_STOPS)return say(`A tour can have up to ${TOUR_MAX_STOPS} stops.`);
    L.cities.push(i)}
  else L.cities=L.cities.filter(x=>x!==i);
  syncTourCities();tourPreview=null;tours()}
function tourLegSelect(i){ensureTourLegs();if(tourDraft.legs[i]){tourDraft.activeLeg=i;tours()}}
function tourLegAdd(){ensureTourLegs();if(tourDraft.legs.length>=TOUR_MAX_LEGS)return say(`A tour can have up to ${TOUR_MAX_LEGS} legs.`);tourDraft.legs.push(newLeg());tourDraft.activeLeg=tourDraft.legs.length-1;tourPreview=null;tours()}
function tourLegRename(i,v){let L=tourDraft.legs[i];if(!L)return;L.name=cleanText(v);tourPreview=null;tours()}
function tourLegRest(i,n){let L=tourDraft.legs[i];if(!L)return;L.rest=cap(Math.round(Number(n)||0),0,TOUR_MAX_REST);tourPreview=null;tours()}
function tourLegMove(i,d){let j=i+d,legs=tourDraft.legs;if(!legs[i]||!legs[j])return;[legs[i],legs[j]]=[legs[j],legs[i]];if(tourDraft.activeLeg===i)tourDraft.activeLeg=j;else if(tourDraft.activeLeg===j)tourDraft.activeLeg=i;syncTourCities();tourPreview=null;tours()}
function tourLegRemove(i){
  let L=tourDraft.legs[i];if(!L||tourDraft.legs.length<2)return;
  if(L.cities.length)return modal(`<h2>Delete ${esc(legName(L,i))}?</h2><p>Its ${L.cities.length} stop${L.cities.length===1?'':'s'} will be removed from the route. To keep them, use “Merge into previous leg” in the itinerary instead.</p><div class="actions"><button class="primary" onclick="confirmTourLegRemove(${i})">Delete leg</button><button onclick="closeModal()">Keep it</button></div>`);
  confirmTourLegRemove(i)}
function confirmTourLegRemove(i){closeModal();if(!tourDraft.legs[i]||tourDraft.legs.length<2)return;tourDraft.legs.splice(i,1);tourDraft.activeLeg=cap(tourDraft.activeLeg>i?tourDraft.activeLeg-1:tourDraft.activeLeg,0,tourDraft.legs.length-1);syncTourCities();tourPreview=null;tours()}
function tourLegMerge(i){
  let legs=tourDraft.legs,L=legs[i],prev=legs[i-1];if(!L||!prev)return;
  prev.cities=[...prev.cities,...L.cities];prev.rest=L.rest;
  legs.splice(i,1);tourDraft.activeLeg=i-1;syncTourCities();tourPreview=null;tours()}
function tourLegSplit(i,si){
  let L=tourDraft.legs[i];if(!L||si<=0||si>=L.cities.length)return;
  if(tourDraft.legs.length>=TOUR_MAX_LEGS)return say(`A tour can have up to ${TOUR_MAX_LEGS} legs.`);
  let tail=newLeg('',L.cities.splice(si),L.rest);L.rest=1;tourDraft.legs.splice(i+1,0,tail);tourDraft.activeLeg=i+1;syncTourCities();tourPreview=null;tours()}
function tourStopMove(i,si,d){let L=tourDraft.legs[i],j=si+d;if(!L||si<0||si>=L.cities.length||j<0||j>=L.cities.length)return;[L.cities[si],L.cities[j]]=[L.cities[j],L.cities[si]];syncTourCities();tourPreview=null;tours()}
function tourStopRepeat(i,si){let L=tourDraft.legs[i];if(!L||si<0||si>=L.cities.length)return;if(tourDraft.cities.length>=TOUR_MAX_STOPS)return say(`A tour can have up to ${TOUR_MAX_STOPS} stops.`);L.cities.splice(si+1,0,L.cities[si]);syncTourCities();tourPreview=null;tours()}
function tourStopRemove(i,si){let L=tourDraft.legs[i];if(!L||si<0||si>=L.cities.length)return;L.cities.splice(si,1);syncTourCities();tourPreview=null;tours()}

// ---- Planner UI ----
const tourUI={q:'',open:new Set(),cc:false};
function tourUIToggle(el){if(tourUI.q.trim())return;let c=el.dataset.c;if(el.open)tourUI.open.add(c);else tourUI.open.delete(c)}
function filterTourCities(q){tourUI.q=String(q??'');let el=$('cityPickerList');if(el)el.innerHTML=cityPickerList()}
function cityCheck(i,L){let n=L.cities.filter(x=>x===i).length;return `<label class="check"><input type="checkbox" ${n?'checked':''} onchange="tourCity(${i},this.checked)">${esc(cityShort(CITIES[i]))}${n>1?` <small class="muted">×${n}</small>`:''}</label>`}
function cityPickerList(){
  ensureTourLegs();
  let L=tourDraft.legs[tourDraft.activeLeg],q=tourUI.q.trim().toLowerCase(),zones={};
  CITIES.forEach((c,i)=>{if(c[4]?.hidden)return;((zones[cityZone(c)]??={})[c[3]]??=[]).push(i)});
  let html=[...TOUR_REGIONS,...Object.keys(zones).filter(z=>!TOUR_REGIONS.includes(z))].filter(z=>zones[z]).map(z=>{
    let body=Object.keys(zones[z]).sort((a,b)=>a.localeCompare(b)).map(country=>{
      let ids=zones[z][country],shown=q?ids.filter(i=>(cityShort(CITIES[i])+' '+country).toLowerCase().includes(q)):ids;
      if(!shown.length)return '';
      let chosen=ids.filter(i=>L.cities.includes(i)).length;
      return `<details ${q||chosen||tourUI.open.has(country)?'open':''} data-c="${esc(country)}" ontoggle="tourUIToggle(this)"><summary style="padding:9px 0">${esc(country)}${chosen?' · '+chosen+' in this leg':''}</summary><div class="checkgrid">${shown.map(i=>cityCheck(i,L)).join('')}</div></details>`}).join('');
    return body?`<div class="eyebrow" style="margin:16px 0 2px">${esc(z)}</div>${body}`:''}).join('');
  return html||'<p class="muted">No matching cities. You can add it as a custom city below.</p>'}
function cityPicker(){return `<label>Find a city<input id="cityFilter" type="search" placeholder="Search cities or countries" value="${esc(tourUI.q)}" oninput="filterTourCities(this.value)"></label><div id="cityPickerList">${cityPickerList()}</div>`}
function customCityForm(){
  let countries=[...new Set(CITIES.filter(c=>!c[4]?.hidden).map(c=>c[3]))].sort((a,b)=>a.localeCompare(b)),mine=(s.customCities||[]).map((x,k)=>[x,k+BUILTIN_CITY_COUNT]).filter(([x])=>!x.hidden);
  return `<details class="card" style="padding:14px 18px;margin:16px 0 0" ${tourUI.cc?'open':''} ontoggle="tourUI.cc=this.open"><summary>Add a custom city</summary><p class="footnote">Not on the list? Add any city. It is saved with your game and added to the leg you are editing, shown as “City, Country”.</p><div class="grid"><label>City<input id="ccName" maxlength="40" placeholder="e.g. Taipei"></label><label>Country<input id="ccCountry" maxlength="40" list="ccCountries" placeholder="e.g. Taiwan"></label><label>Region<select id="ccRegion"><option value="">Match the country</option>${TOUR_REGIONS.map(r=>`<option>${esc(r)}</option>`).join('')}</select></label><label>Market size<select id="ccMarket">${MARKET_SIZES.map(([n,m])=>`<option value="${m}" ${m===.85?'selected':''}>${n}</option>`).join('')}</select></label></div><datalist id="ccCountries">${countries.map(c=>`<option value="${esc(c)}">`).join('')}</datalist><button onclick="addCustomCity()" ${s.retired?'disabled':''}>Add city to this leg</button>${mine.length?`<p class="footnote" style="margin-top:14px">Your custom cities</p>${mine.map(([x,i])=>`<div class="track"><span>${esc(x.name)}, ${esc(x.country)} <small class="muted">· ${esc(x.region)}</small></span><div class="trackbuttons"><button class="compact" onclick="hideCustomCity(${i})">Remove</button></div></div>`).join('')}`:''}</details>`}
function tourRoutePlanner(){
  ensureTourLegs();
  let legs=tourDraft.legs,ai=tourDraft.activeLeg,L=legs[ai],n=tourDraft.cities.length,last=ai===legs.length-1;
  return `<div class="row wrap"><h3>Route <small>${n}/${TOUR_MAX_STOPS} stops · ${legs.length} leg${legs.length===1?'':'s'}</small></h3><button class="compact" onclick="clearTourCities()" ${n?'':'disabled'}>Clear all destinations</button></div>
<p class="footnote">Cities you tick go into the leg you are editing, in the order you pick them. Add legs to split the tour, or use “Split here” in the itinerary below. “Repeat” adds another night in the same city; repeat nights draw about 15% less each. Legs play in order, with optional rest months between them.</p>
<div class="actions" style="margin:8px 0 14px">${legs.map((l,i)=>`<button class="compact ${i===ai?'primary':''}" onclick="tourLegSelect(${i})">${esc(legName(l,i))} · ${l.cities.length}</button>`).join('')}<button class="compact" onclick="tourLegAdd()" ${legs.length>=TOUR_MAX_LEGS?'disabled':''}>+ Add leg</button></div>
<div class="card" style="padding:16px;margin-bottom:14px"><label>Editing leg ${ai+1} of ${legs.length}<input maxlength="40" placeholder="Leg ${ai+1}" value="${esc(L.name)}" onchange="tourLegRename(${ai},this.value)"></label><label>Rest after this leg<select onchange="tourLegRest(${ai},Number(this.value))" ${last?'disabled':''}>${Array.from({length:TOUR_MAX_REST+1},(_,r)=>`<option value="${r}" ${L.rest===r?'selected':''}>${r===0?'No break · straight into the next leg':r+' month'+(r===1?'':'s')+' off'}</option>`).join('')}</select></label>${last?'<p class="footnote" style="margin-top:-8px">The last leg has no rest period after it.</p>':''}<div class="actions" style="margin-top:0"><button class="compact" onclick="tourLegMove(${ai},-1)" ${ai===0?'disabled':''}>Move leg up</button><button class="compact" onclick="tourLegMove(${ai},1)" ${last?'disabled':''}>Move leg down</button><button class="compact" onclick="tourLegRemove(${ai})" ${legs.length<2?'disabled':''}>Delete leg</button></div></div>
${cityPicker()}${customCityForm()}`}
function tourItineraryHTML(){
  ensureTourLegs();
  let legs=tourDraft.legs;
  if(!tourDraft.cities.length)return '<p class="footnote">Itinerary: choose cities above.</p>';
  return `<div class="section"><h3>Itinerary</h3>${legs.map((L,li)=>`<div class="card" style="padding:16px"><div class="row wrap"><div><b>${esc(legName(L,li))}</b> <small class="muted">· ${L.cities.length} stop${L.cities.length===1?'':'s'}${li<legs.length-1?` · ${L.rest?L.rest+' month'+(L.rest===1?'':'s')+' off after':'no break after'}`:''}</small></div>${li>0?`<button class="compact" onclick="tourLegMerge(${li})">Merge into previous leg</button>`:''}</div>${L.cities.length?L.cities.map((id,si)=>`<div class="track"><span class="tracktitle">${si+1}. ${esc(cityShort(CITIES[id]))} <small class="muted">${esc(CITIES[id][3])}</small></span><div class="trackbuttons"><button class="compact" title="Add another show in this city right after this one" onclick="tourStopRepeat(${li},${si})">Repeat</button>${si>0?`<button class="compact" title="Start a new leg at this stop" onclick="tourLegSplit(${li},${si})">Split here</button>`:''}<button class="compact" onclick="tourStopMove(${li},${si},-1)" ${si===0?'disabled':''} aria-label="Move up">↑</button><button class="compact" onclick="tourStopMove(${li},${si},1)" ${si===L.cities.length-1?'disabled':''} aria-label="Move down">↓</button><button class="compact" onclick="tourStopRemove(${li},${si})" aria-label="Remove stop">✕</button></div></div>`).join(''):'<p class="footnote">No stops in this leg yet.</p>'}</div>`).join('')}</div>`}
function tourNextText(t){
  let next=t.stops.find(x=>!x.done);if(!next)return 'All dates played.';
  let plan=t.legPlan,leg=plan&&plan.length>1&&plan[next.leg]?` · ${esc(plan[next.leg].name)} (leg ${next.leg+1} of ${plan.length})`:'';
  return `Next stop: <b>${esc(next.city)}</b> · ${showDate(next)}${leg}.`}
function tourLegTag(t,x){let bits=[];if(t.legPlan&&t.legPlan.length>1&&t.legPlan[x.leg])bits.push(esc(t.legPlan[x.leg].name));if(x.night>1)bits.push('night '+x.night);return bits.length?`<br><small class="muted">${bits.join(' · ')}</small>`:''}
function tourLegSummaryHTML(t){
  let plan=t.legPlan;if(!plan||plan.length<2)return '';
  return `<div class="scroll"><table><tr><th>Leg</th><th>Shows</th><th>Dates</th><th>Est. net</th></tr>${plan.map((L,i)=>{let st=t.stops.filter(x=>x.leg===i);return `<tr><td>${esc(L.name)}${i<plan.length-1&&L.rest?`<br><small class="muted">${L.rest} month${L.rest===1?'':'s'} off after</small>`:''}</td><td>${st.length}</td><td>${showDate(st[0])} – ${showDate(st.at(-1))}</td><td>${money(Math.round(st.reduce((n,x)=>n+x.estimate*t.ticket*.75-x.cost,0)))}</td></tr>`}).join('')}</table></div>`}
// Residency city menu: grouped by country so the longer city list stays usable.
function residencyCityOptions(){
  let groups={};CITIES.forEach((c,i)=>{if(!c[4]?.hidden)(groups[c[3]]??=[]).push(i)});
  return Object.keys(groups).sort((a,b)=>a.localeCompare(b)).map(country=>`<optgroup label="${esc(country)}">${groups[country].map(i=>`<option value="${i}">${esc(cityShort(CITIES[i]))}</option>`).join('')}</optgroup>`).join('')}
