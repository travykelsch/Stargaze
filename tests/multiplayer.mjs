import assert from 'node:assert/strict';
import {newRoom,newPilot,applyAction,advance,publicRoom,racerPoseAt} from '../server/matches.mjs';
import {geometry} from '../server/geometry.mjs';
import {MP_RULES as R,beginEvade,movePilot,powerRings,ringPosition} from '../public/multiplayer-rules.mjs';
import {safeRoute,WORLDS,SHIPS,difficulty} from '../public/mechanics.mjs';
import {flightTime} from '../public/progression.mjs';
const engine=geometry();let checks=0;const started=performance.now();
function match(mode='survival',world='easy',difficulty='easy'){const r=newRoom('ABCDEF','owner0','p0',{mode,world,difficulty},0);for(let i=1;i<4;i++)r.players.push(newPilot('p'+i,'owner'+i,{ship:SHIPS[i].id},0));for(const p of r.players)applyAction(r,p,{action:'ready',ready:true},0);return r;}
function simulate(r,until,steer=true){while(r.time<until&&r.phase!=='results'){const now=r.startAt+(r.time+.1)*1000+.001;for(const p of r.players){p.seen=now;p.inputAt=now;const q=safeRoute(p.z+difficulty(r.time,r.difficulty,r.world).speed*.08,r.seed,r.difficulty,r.world);p.input=steer?{x:Math.max(-1,Math.min(1,(q.x-p.x)/2.7)),y:Math.max(-1,Math.min(1,(q.y-p.y)/2.4))}:{x:0,y:0};}advance(r,now,{engine});}}
for(const world of WORLDS)for(const d of ['easy','medium','hard']){const r=match('collector',world.id,d);r.seed=113;simulate(r,12);assert.equal(r.phase,'playing');assert.ok(r.players.every(p=>Number.isFinite(p.z)&&p.fuel>0));checks++;}
for(const ship of SHIPS){const r=match('collector');r.players[0].ship=ship.id;simulate(r,.2);assert.equal(r.players[0].ship,ship.id);checks++;}
// All four have individual claims. A forged collection action never changes score.
{const r=match('collector');r.seed=113;simulate(r,15);assert.ok(r.players.every(p=>p.rings>0));assert.equal(new Set(r.players.map(p=>p.score)).size,1);const score=r.players[0].score;applyAction(r,r.players[0],{action:'collect',ring:'anything',points:99999},r.simAt);assert.equal(r.players[0].score,score);const c=r.players[0].claims;assert.equal(c.length,new Set(c).size);checks++;}
// Boundary camping collides with solid visible geometry in every world.
for(const world of WORLDS){const r=match('collector',world.id);r.seed=113;for(const p of r.players)p.y=23;simulate(r,14,false);assert.ok(r.players.every(p=>p.crashes>0),world.id+' boundary');checks++;}
// End conditions and tie resolution are server decisions.
{const r=match('collector');r.time=119.98;r.simAt=r.startAt+r.time*1000;for(const p of r.players){p.seen=r.simAt;p.z=100;p.score=7;}r.players[2].score=10;advance(r,r.simAt+21,{engine});assert.equal(r.phase,'results');assert.deepEqual(r.winners,['p2']);checks++;}
{const r=match();r.phase='playing';r.time=20;r.simAt=r.startAt+20000;for(const p of r.players){p.alive=false;p.eliminatedAt=20;p.seen=r.simAt;}advance(r,r.simAt+21,{engine});assert.equal(r.phase,'results');assert.equal(r.winners.length,4,'simultaneous eliminations draw');checks++;}
{const r=match('race');r.phase='playing';r.simAt=r.startAt;for(const p of r.players){p.z=r.length-1;p.seen=r.simAt;}advance(r,r.simAt+21,{engine:{nearby:()=>({rings:[],obstacles:[]}),collision:()=>null}});assert.ok(r.players.every(p=>p.finishAt!==null));assert.equal(r.winners.length,4);checks++;}
// Duplicated/out-of-order inputs cannot replay an evade or override newer steering.
{const r=match();r.phase='playing';const p=r.players[0];applyAction(r,p,{action:'input',seq:3,x:1,y:0,evadeSeq:1,evade:{x:1,y:0}},5000);const e=p.evade;applyAction(r,p,{action:'input',seq:2,x:-1,y:0,evadeSeq:2,evade:{x:-1,y:0}},5100);assert.equal(p.input.x,1);assert.equal(p.evade,e);assert.throws(()=>applyAction(r,p,{action:'input',seq:4,x:Infinity,y:0},5100));assert.throws(()=>applyAction(r,p,{action:'input',seq:4,x:2,y:0},5100));checks++;}
{const r=match('race');const p=r.players[0];assert.ok(beginEvade(p,1,0));assert.equal(beginEvade(p,-1,0),false);for(let i=0;i<30;i++)movePilot(p,{x:0,y:0},.01,0,r);assert.ok(Math.abs(p.x-15)<1e-6);assert.ok(beginEvade(p,-1,0));assert.equal(powerRings(2,1,'survival').length,0);assert.equal(powerRings(2,1,'collector').length,0);checks++;}
// Serialization preserves the ongoing NPC field, including RNG state.
{const r=match('collector','sunscar');r.seed=113;simulate(r,1);const b=JSON.parse(JSON.stringify(r));simulate(r,1.2);simulate(b,1.2);assert.deepEqual(r.fields,b.fields);assert.deepEqual(r.players,b.players);checks++;}
{const r=match();const p=publicRoom(r,'p0');assert.equal(p.players[1].owner,undefined);assert.equal(p.players[1].claims,undefined);assert.ok(Array.isArray(p.players[0].claims));checks++;}
{const a={id:1,style:0,x:0,y:0,forward:20,vx:0,vy:0,bank:0,state:'racing'},old={x:0,y:0,forward:-20},p={x:0,y:0,z:0};assert.equal(engine.racerCollision(p,racerPoseAt(a,old,0)),false);assert.equal(engine.racerCollision(p,racerPoseAt(a,old,.5)),true,'fast racer swept through the real craft geometry');assert.equal(engine.racerCollision(p,racerPoseAt(a,old,1)),false);checks++;}
console.log(JSON.stringify({pass:true,checks,worldDifficultyPairs:18,ships:20,seconds:Number(((performance.now()-started)/1000).toFixed(2)),heapMB:Math.round(process.memoryUsage().heapUsed/1e6)}));
