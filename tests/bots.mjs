import assert from 'node:assert/strict';
import {newRoom,newPilot,applyAction,advance,publicRoom} from '../server/matches.mjs';
import {BOT_SKILL,steerBot} from '../server/bots.mjs';
import {geometry} from '../server/geometry.mjs';
import {WORLDS,SHIPS,safeRoute,difficulty} from '../public/mechanics.mjs';

const engine=geometry();let checks=0;
function make(humans=1,difficulty='easy',mode='collector',world='easy'){
 const room=newRoom('BOTEST','owner0','p0',{difficulty,mode,world},0);
 for(let i=1;i<humans;i++)room.players.push(newPilot('p'+i,'owner'+i,{},0));
 applyAction(room,room.players[0],{action:'start'},0);room.seed=113;return room;
}
for(let humans=1;humans<=4;humans++)for(const d of ['easy','medium','hard'])for(const mode of ['race','collector','survival']){
 const r=make(humans,d,mode);assert.equal(r.players.length,4);assert.equal(r.players.filter(p=>p.bot).length,4-humans);assert.equal(new Set(r.players.map(p=>p.id)).size,4);assert.ok(r.players.filter(p=>p.bot).every(p=>p.botDifficulty===d&&!p.accountUser&&SHIPS.some(s=>s.id===p.ship)));checks++;
 assert.throws(()=>applyAction(r,r.players[0],{action:'start'},1));
}
{const r=newRoom('BOTEST','owner','p0',{},0),other=newPilot('p1','other',{},0);r.players.push(other);assert.throws(()=>applyAction(r,other,{action:'start'},0),/host/);applyAction(r,r.players[0],{action:'ready',ready:true},0);applyAction(r,other,{action:'ready',ready:true},0);assert.equal(r.phase,'lobby');checks++;}
for(const world of WORLDS)for(const d of ['easy','medium','hard']){
 const r=make(1,d,'collector',world.id);
 while(r.time<14){const now=r.startAt+(r.time+.1)*1000+.001,p=r.players[0];p.seen=p.inputAt=now;const q=safeRoute(p.z+difficulty(r.time,d,world.id).speed*.08,r.seed,d,world.id);p.input={x:Math.max(-1,Math.min(1,(q.x-p.x)/2.7)),y:Math.max(-1,Math.min(1,(q.y-p.y)/2.4))};advance(r,now,{engine});}
 const bots=r.players.filter(p=>p.bot);assert.ok(bots.every(p=>p.z>0&&!p.disqualified));assert.ok(bots.some(p=>p.rings>0),world.id+'/'+d+' bots collect genuine rings');assert.ok(bots.every(p=>Math.hypot(p.input.x,p.input.y)<=1.451));assert.ok(bots.every(p=>Number.isFinite(p.fuel)&&Math.abs(p.x)<=32&&Math.abs(p.y)<=23));
 const view=publicRoom(r,'p0');assert.ok(view.players.filter(p=>p.bot).every(p=>p.connected&&!('botBrain'in p)&&!('owner'in p)));console.log(JSON.stringify({world:world.id,difficulty:d,botRings:bots.map(p=>p.rings),crashes:bots.map(p=>p.crashes)}));checks++;
 // Serialization preserves controls and reaction cadence.
 const copy=structuredClone(r),now=r.simAt+100;r.players[0].seen=copy.players[0].seen=now;advance(r,now,{engine});advance(copy,now,{engine});assert.deepEqual(r.players,copy.players);
 // Rematches replace the old AI roster instead of accumulating new pilots.
 const oldBots=bots.map(p=>p.id);r.phase='results';applyAction(r,r.players[0],{action:'start'},now);assert.equal(r.players.length,4);assert.equal(r.players.filter(p=>p.bot).length,3);assert.ok(r.players.filter(p=>p.bot).every(p=>!oldBots.includes(p.id)));checks++;
}
// Bots crash and consume fuel under the exact same authoritative collision path.
for(const mode of ['race','collector','survival']){const r=make(1,'hard',mode);advance(r,r.startAt+21,{engine:{nearby:()=>({rings:[],obstacles:[]}),collision:()=>({category:'course'})}});assert.ok(r.players.every(p=>p.crashes===1));assert.ok(r.players.filter(p=>p.bot).every(p=>mode==='survival'?!p.alive:p.respawnAt>0));checks++;}
// Skill parameters affect decision cadence, aim and control strength, not speed.
assert.ok(BOT_SKILL.easy.reaction>BOT_SKILL.medium.reaction&&BOT_SKILL.medium.reaction>BOT_SKILL.hard.reaction);assert.ok(BOT_SKILL.easy.error>BOT_SKILL.medium.error&&BOT_SKILL.medium.error>BOT_SKILL.hard.error);
console.log(JSON.stringify({pass:true,checks,rosters:'1–4 humans, all modes and difficulties',worldDifficultyPairs:18,physicalRules:true,rendered:false}));
