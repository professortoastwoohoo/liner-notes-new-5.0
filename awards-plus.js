'use strict';
// ===== More award shows and categories =====
// Fictional mode gets its shows from NEW_SHOWS in awards-charts.js. This file adds the realistic-world side: real names, the years each show
// was held, ceremony months and era-appropriate categories. Category start years are approximate selections, not a complete archive.
//
// Home-market shows (Juno, ARIA, Japan Record Awards, Golden Disc) carry a `nation`. Only artists of that nationality can enter their main
// categories; their "International" categories (gate 'intl') are open to everyone else. This applies in both world modes.
REAL_AWARD_INFO.maple=['Juno Awards',1970,'https://en.wikipedia.org/wiki/Juno_Awards'];
REAL_AWARD_INFO['southern-cross']=['ARIA Music Awards',1987,'https://en.wikipedia.org/wiki/ARIA_Music_Awards'];
REAL_AWARD_INFO.sakura=['Japan Record Awards',1959,'https://en.wikipedia.org/wiki/Japan_Record_Awards'];
REAL_AWARD_INFO.hanbit=['Golden Disc Awards',1986,'https://en.wikipedia.org/wiki/Golden_Disc_Awards'];

const baseShowHeld=showHeld;
showHeld=function(id,y){if(id==='maple'&&y===2020)return false;return baseShowHeld(id,y)};

const baseAwardMonthFor=awardMonthFor;
awardMonthFor=function(id,y){
  if(id==='maple')return y===2021?5:y===2022?4:[2003,2004,2005,2006,2007,2008,2012,2013,2016,2017].includes(y)?3:2;
  if(id==='southern-cross')return y<=1993?2:y<=2009?9:10;
  if(id==='sakura')return 11;
  if(id==='hanbit')return 0;
  return baseAwardMonthFor(id,y)};

const NATIONAL_REAL_CATEGORIES={
  maple(y,c){let o=[c('Album of the Year','album')];
    if(y>=1971)o.push(c('Single of the Year','song'));
    if(y>=2000)o.push(c('Artist of the Year','artist'));
    o.push(c(y>=1990?'Breakthrough Artist of the Year':'Most Promising Artist','artist',null,'new'));
    if(y>=1998)o.push(c('Songwriter of the Year','artist'));
    if(y>=2007)o.push(c('Fan Choice Award','artist'));
    if(y>=2004)o.push(c('Pop Album of the Year','album','pop'));
    if(y>=1996)o.push(c('Rock Album of the Year','album','rock'));
    if(y>=1995)o.push(c('Alternative Album of the Year','album','alternative'));
    if(y>=1976)o.push(c('Country Album of the Year','album','country'));
    if(y>=1986)o.push(c('R&B/Soul Recording of the Year','song','rnb'));
    if(y>=1991)o.push(c('Rap Recording of the Year','song','rap'));
    if(y>=1999)o.push(c('Dance Recording of the Year','song','dance'));
    if(y>=1996)o.push(c('Adult Alternative Album of the Year','album','folk'));
    if(y>=2005)o.push(c('Contemporary Roots Album of the Year','album','folk'));
    if(y>=2000)o.push(c('Jazz Vocal Album of the Year','album','jazz'));
    if(y>=1990)o.push(c('Video of the Year','video'));
    if(y>=1980&&y<=2019)o.push(c('International Album of the Year','album',null,'intl'));
    return o},
  'southern-cross'(y,c){let o=[c('Album of the Year','album'),c(y>=2007?'Song of the Year':'Single of the Year','song'),c('Best Artist','artist'),
      c(y>=2012?'Breakthrough Artist':'Best New Talent','artist',null,'new'),c('Best Pop Release','song','pop'),c('Best Country Album','album','country'),c('Best Jazz Album','album','jazz'),c('Best Video','video')];
    if(y>=1993)o.push(c('Best Rock Album','album','rock'));
    if(y>=1996)o.push(c('Best Hip Hop Release','song','rap'),c('Best Dance Release','song','dance'));
    if(y>=1997)o.push(c('Best Independent Release','album'));
    if(y>=1998)o.push(c('Best Soul/R&B Release','song','rnb'),c('Best International Artist','artist',null,'intl'));
    if(y>=2004)o.push(c('Best Blues & Roots Album','album','folk'));
    return o},
  sakura(y,c){let o=[c('Grand Prix','song'),c('Best New Artist','artist',null,'new'),c('Best Vocalist Award','artist'),c('Composition Award','song')];
    if(y>=1962)o.push(c('Excellence Work Award','song'));
    if(y>=1983)o.push(c('Best Album Award','album'));
    if(y>=2014)o.push(c('Special International Music Award','artist',null,'intl'));
    return o},
  hanbit(y,c){let o=[c('Album Daesang','album'),c('Best Album (Bonsang)','album'),c('Rookie Artist of the Year','artist',null,'new')];
    if(y>=2005)o.push(c('Song Daesang','song'),c('Best Digital Song (Bonsang)','song'),c('Popularity Award','artist'));
    if(y>=2010)o.push(c('Best Pop Album','album','pop'));
    if(y>=2018)o.push(c('Global Artist Award','artist',null,'intl'));
    return o}};

// Extra real categories for the shows that already existed (year-gated; Grammy-, CMA-, AMA-, VMA- and BMI-style names).
const baseRealCategories=realCategories;
realCategories=function(id,y){
  const c=(name,type,family,gate)=>[name,type,family||null,gate||null];
  if(NATIONAL_REAL_CATEGORIES[id])return NATIONAL_REAL_CATEGORIES[id](y,c);
  let out=baseRealCategories(id,y),add=(ok,...cats)=>{if(ok)out.push(...cats.filter(x=>!out.some(o=>o[0]===x[0])))};
  if(id==='meridian')add(y>=2001,c('Best Traditional Pop Vocal Album','album','pop')),add(y>=2010,c('Best Americana Album','album','folk')),add(y>=2012,c('Best Traditional R&B Performance','song','rnb')),add(y>=2022,c('Best Progressive R&B Album','album','alternative'));
  if(id==='prairie')add(y>=1981,c(y>=2009?'New Artist of the Year':'Horizon Award','artist',null,'new')),add(y>=1989,c('Vocal Event of the Year','song',null,'collab'));
  if(id==='audience')add(y>=1989,c('Favorite Rap/Hip-Hop Album','album','rap')),add(y>=1992,c('Favorite Alternative Artist','artist','alternative')),add(y>=1990,c('New Artist of the Year','artist',null,'new')),add(y>=2022,c('Collaboration of the Year','song',null,'collab'));
  if(id==='prism')add(y>=1984,c('Best Visual Effects','video'),c('Best Art Direction','video'),c('Best Choreography','video')),add(y>=1992,c('Best Dance Video','video','dance')),add(y>=2008,c('Best Collaboration','video',null,'collab'));
  if(id==='hooks')add(true,c('Most-Performed Song','song'));
  if(id==='billboard')add(y>=1992,c('Top New Artist','artist',null,'new'));
  return out};

// Home-market gate, for both world modes.
const baseEligibleByNation=eligible;
eligible=function(h,type,at,c=null){
  if(h.nation){let home=(s.nationality||'')===h.nation;if(c?.[3]==='intl'){if(home)return []}else if(!home)return []}
  return baseEligibleByNation(h,type,at,c)};
