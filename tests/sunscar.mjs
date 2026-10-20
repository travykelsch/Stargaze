import assert from 'node:assert/strict';
import {RaceField} from '../public/sunscar-racing.mjs';
import {SUNSCAR,SECTIONS,sectionAt,shotPosition,tunnelBlend} from '../public/sunscar-course.mjs';
import {WORLDS,MODES,SHIPS,routeAtTime,makeSector,safeRoute,loadSave} from '../public/mechanics.mjs';
import {flightTime,flightDistance} from '../public/progression.mjs';
assert.equal(WORLDS.length,6);assert.equal(SHIPS.length,20);assert.equal(WORLDS.at(-1).id,'sunscar');
let shots=0,checks=0,bumps=0,crashes=0,passes=0,rear=0,terrain=0;
for(const mode of MODES)for(let seed=1;seed<=12;seed++){
 const obstacles=[];
 for(let index=0;index<24;index++){
  const at=flightTime(index*190,mode.id,'sunscar'),s=makeSector(index,at,seed,mode.id,'sunscar');obstacles.push(...s.asteroids);
  assert.equal(s.asteroids[0].category,'course');assert.ok(s.asteroids.length<=7);
  for(const a of s.asteroids)if(a.category==='shot'){
   shots++;const at=a.encounterAt,p=shotPosition(a,at),before=shotPosition(a,at-.001),after=shotPosition(a,at+.001);assert.ok(p.active);assert.ok(Math.hypot(after.x-before.x,after.y-before.y,after.z-before.z)<.4,'continuous ballistic shot');
   for(let dt=-.24;dt<=.24;dt+=.008){const t=at+dt,p=shotPosition(a,t),q=routeAtTime(t,seed),z=p.z+flightDistance(t,mode.id,'sunscar');if(Math.abs(z)<7)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=7.5,'projectile preserves flight route');checks++;}
  }
 }
 const field=new RaceField(routeAtTime);field.reset(seed,mode.id);let last=new Map();const kinds=new Set(),ratios=new Set();
 for(let time=.02;time<90;time+=.02){field.step(.02,time,flightDistance(time,mode.id,'sunscar'),obstacles);assert.ok(field.racers.length<=SUNSCAR.maxRacers);assert.ok(field.events.length<=64);
  for(const a of field.racers){kinds.add(a.kind);if(a.ratio<.8)ratios.add('slow');if(a.ratio>.9&&a.ratio<1.1)ratios.add('match');if(a.ratio>1.3)ratios.add('fast');assert.ok(a.ratio>0,'all racers travel forward');assert.ok([a.x,a.y,a.forward,a.bank].every(Number.isFinite));if(last.has(a.id))assert.ok(a.forward>last.get(a.id));last.set(a.id,a.forward);if(a.state==='racing')assert.ok(Math.hypot(a.x-a.ref.x,a.y-a.ref.y)>=SUNSCAR.clearance-.001);}
  field.drainEvents();
 }
 assert.equal(kinds.size,4);assert.equal(ratios.size,3);bumps+=field.stats.bumps;crashes+=field.stats.crashes;passes+=field.stats.passes;rear+=field.stats.rearWarnings;terrain+=field.stats.terrainCrashes;
 assert.ok(field.stats.bumps>0&&field.stats.crashes>0&&field.stats.passes>0&&field.stats.rearWarnings>0);
 const frozen=JSON.stringify(field.racers);field.step(0,field.time,field.distance,obstacles);assert.equal(JSON.stringify(field.racers),frozen);field.reset(seed,mode.id);assert.equal(field.racers.length,0);assert.equal(field.events.length,0);
}
assert.ok(terrain>0,'NPCs can physically crash into terrain and projectiles');
for(let i=0;i<6;i++)assert.equal(sectionAt(i*570+95).name,SECTIONS[i]);assert.equal(tunnelBlend(1800),1);assert.equal(tunnelBlend(100),0);
const prior=loadSave(JSON.stringify({version:2,world:'frost',mode:'hard',credits:1579,ownedShips:['comet','dart'],worldBests:{'frost:hard':{distance:2300,score:300}}}));prior.world='sunscar';const after=loadSave(JSON.stringify(prior));assert.equal(after.world,'sunscar');assert.equal(after.credits,1579);assert.deepEqual(after.ownedShips,prior.ownedShips);assert.deepEqual(after.worldBests['frost:hard'],prior.worldBests['frost:hard']);assert.equal(after.worldBests['sunscar:hard'].distance,0);
console.log(`PASS: six course sections, ${shots} committed shots/${checks} route samples; 36 seeded live racing simulations, ${bumps} rival contacts/${crashes} crashes/${passes} passes/${rear} rear warnings; three true forward speed classes, caps, pause/reset and old saves.`);
