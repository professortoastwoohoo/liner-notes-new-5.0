'use strict';
function pressQuestionAllowed(q){return q[4]==='graduate'?s.education?.qualifications.some(x=>x.month!==null):lifeGate(q[4])}
const LIFE_PRESS_QUESTIONS={
late:[
['Your homework and a setlist end up in the same bag. Which one gets checked first?','Describe the school routine that keeps you organised','Joke about nearly handing in the setlist','Explain how your tutor helps protect school time','school'],
['Can the band turn an ordinary household complaint into your next chorus?','Improvise a dramatic chorus about the washing up','Ask the drummer for a rhythm and build on it','Explain how small observations become lyrics'],
['What is the least glamorous thing in your backstage bag?','Show the battered notebook','Admit how many spare cables you carry','Describe the practical things that save a show'],
['You are married now. Did planning a wedding feel anything like planning a concert?','Compare the seating plan with the setlist','Say the celebration was about people, not a performance','Keep wedding details private and share a rehearsal joke','married'],
['Your classmates can now say they knew you before this sofa. What would they correct about your star image?','Tell a harmless story about being unprepared','Explain that you still have assignments to finish','Laugh about your very ordinary study habits','college'],
['Can you teach us a warm-up without making us sound completely ridiculous?','Lead a simple breathing exercise','Let the band demonstrate first','Show how a warm-up becomes a melody'],
['What would the twelve-year-old version of you make of this stage?','Describe the first song you tried to write','Talk about learning to enjoy mistakes','Play a few notes that remind you of home'],
['If the audience could choose one instrument for your next song, which choice would scare you most?','Invite a surprising instrument into the arrangement','Pick one you have never learned','Explain why silence can be more intimidating']
],
long:[
['How do you protect your education when the music industry rewards being available all the time?','Describe the school hours you refuse to sacrifice','Explain where you still need support','Discuss learning without turning it into a success story','school'],
['Has being married changed the boundary between honesty and privacy in your writing?','Separate emotional honesty from identifying details','Describe how you discuss sensitive lyrics together','Keep your spouse out of the answer and focus on craft','married'],
['What did studying give you that professional praise could not?','Describe a difficult piece of feedback','Talk about becoming a beginner again','Explain the value of work that never reaches the charts','college'],
['When a relationship ends, does the narrator in an old song belong to either person anymore?','Discuss how songs become independent of their origins','Acknowledge change without explaining your former partner','Say the audience can interpret what you no longer explain','divorced'],
['What is the difference between being understood and being closely watched?','Discuss boundaries that let you keep writing','Explain why attention is not always connection','Describe an ordinary moment you keep entirely private'],
['Which part of your early ambition have you deliberately let go?','Talk about a metric that stopped motivating you','Describe a creative ideal that became too restrictive','Say you are still deciding what success should mean'],
['How do you recognise when a song is truthful but not ready to be released?','Explain the distance you need from its subject','Describe testing the song privately','Distinguish finishing a song from publishing it'],
['What does returning to an old lyric teach you about memory?','Describe a detail you now remember differently','Explain how performance changes the narrator','Leave the literal history outside the song']
],
day:[
['Your partner is famous too. Are the matching release dates a publicity strategy?','Clarify that you each make your own career decisions','Set a boundary around private planning','Redirect to the separate music you are both making','celebrity'],
['People want to know what the wedding cost. Will you tell us?','Say the meaningful part was the commitment','Decline to turn a private celebration into a price tag','Share a small non-financial detail instead','married'],
['Did your divorce inspire every song on the new project?','Reject that assumption without discussing your ex','Explain that a record can contain several kinds of stories','Discuss one fictional narrator instead','divorced'],
['Do your teachers make exceptions because you are on television?','Explain that schoolwork still needs to be completed','Describe the support without claiming special treatment','Keep classmates and teachers out of the spotlight','school'],
['Who gets jealous when strangers sing your love songs back at you?','Say you do not speak for your partner’s feelings','Explain that performing is part of your work','Redirect the question to the audience connection','partner'],
['Can we read an old private message if it explains a lyric?','Say no and explain the difference between lyrics and consent','Offer a writing notebook passage instead','Move the conversation back to the released work'],
['You look so composed. Is the public seeing the real you?','Explain that a performance is one real part of a person','Share a harmless everyday habit','Set a boundary around what authenticity requires'],
['Would you name the person who told you that you would never succeed?','Discuss what the criticism taught you without naming anyone','Say the story is more complicated than a villain','Focus on the people who supported the work']
],
craft:[
['How do you keep a shared home from becoming a permanent studio?','Describe the hours you protect for non-musical life','Explain how you separate writing space from shared space','Discuss portable writing habits','married'],
['Has a class assignment ever changed the way you build a verse?','Describe a technique learned through coursework','Explain how feedback exposed a familiar habit','Keep the assignment separate and discuss the general lesson','college'],
['What survives when you remove every decorative production layer from {song}?','Play the melody over a single chord','Read the lyric without the track','Explain which rhythmic detail carries its identity'],
['How do you decide whose name belongs in the songwriting credits?','Explain why contributions are discussed early','Distinguish arrangement work from the writing agreement','Describe checking credits with everyone involved'],
['Where do you place a breath when the emotional line runs past the bar?','Demonstrate two different phrasing choices','Explain how you revised the lyric to make space','Describe asking the band to leave a gap'],
['What do you do with a beautiful verse that weakens the song?','Save it for another composition','Cut it and explain the structural reason','Rewrite the surrounding song once before deciding'],
['How different is your first voice memo from a finished vocal?','Compare the rhythm and emphasis','Explain which imperfect detail you preserve','Describe the changes made for live performance'],
['When does a key change deepen a story, and when is it just decoration?','Demonstrate how the lyric earns the lift','Explain why you sometimes avoid the lift','Compare a harmonic change with a change in texture']
],
radio:[
['What does a normal morning look like when you still have school?','Describe getting ready before a lesson','Explain how you fit writing around homework','Talk about an ordinary breakfast and commute','school'],
['Which song would you choose for listeners heading home from a difficult shift?','Choose a quieter catalogue moment','Offer a live version with a gentler arrangement','Explain why an uplifting song can help too'],
['What is the best soundcheck advice another musician has given you?','Describe checking the vocal monitor first','Explain keeping a simple fallback arrangement','Talk about listening to the room before changing everything'],
['Your tour schedule looks busy. How do you make a strange city feel familiar?','Describe a small pre-show routine','Talk about keeping in touch with home','Explain why a quiet walk helps','tour'],
['How would you introduce {song} to someone hearing your music for the first time?','Describe the feeling rather than the chart position','Explain the image that started it','Play the opening and let it speak'],
['When the chorus comes on in a shop, do you stop and listen?','Admit you notice different details outside the studio','Say the listener reaction interests you more','Tell a harmless story about an unexpected playback'],
['What is one deep cut you wish radio would give a chance?','Introduce a less obvious track from the project','Explain the arrangement that makes it special','Offer a short live version'],
['You finished a qualification alongside music. What helped you stick with it?','Describe breaking work into manageable sessions','Credit the people who supported your timetable','Talk honestly about pausing and returning','graduate']
],
culture:[
['When two famous people date, their audiences sometimes treat the relationship as shared property. How do you respond?','Say public interest does not create a right to private details','Describe agreeing boundaries before joint appearances','Keep your partner out of the answer and speak generally','celebrity'],
['Why pursue a qualification when the industry already considers you successful?','Discuss learning without immediate commercial pressure','Describe wanting options beyond performance','Explain how a classroom challenges your assumptions','college'],
['Does a marriage announcement risk becoming another part of the album campaign?','Explain how you separate personal news from promotion','Acknowledge the pressure without giving private details','Discuss why a quiet celebration can matter','married'],
['What gets lost when a divorce becomes a narrative of winners and losers?','Reject the competition and discuss moving forward','Say both people deserve a life beyond the headline','Keep the answer focused on boundaries','divorced'],
['Does your visual identity help people hear the music, or sometimes get in its way?','Describe an image that clarified the concept','Discuss when you deliberately simplify the presentation','Explain a visual idea you chose to abandon'],
['Who is missing from the usual story of a successful record?','Credit session players and technical staff','Discuss the people supporting ordinary life around the work','Explain why accurate credits matter'],
['When a new generation discovers an old song, who gets to define its meaning?','Welcome readings you did not anticipate','Explain the original context without policing listeners','Describe how the live version has changed'],
['What would you change about the way interviews measure an artist’s progress?','Ask for more discussion of craft and less ranking','Explain why a slower year can still be productive','Discuss work that matters without becoming a milestone']
]
};
for(const [id,questions]of Object.entries(LIFE_PRESS_QUESTIONS))PRESS_QUESTIONS[id].push(...questions);
