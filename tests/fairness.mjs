import assert from 'node:assert/strict';
import {COURSE,LIMITS,MODES,WORLDS,routeAtTime,makeSector,difficulty,safeRoute,RING_TYPES} from '../public/mechanics.mjs';
import {emberTime} from '../public/ember-course.mjs';
import {frostPosition} from '../public/frost-course.mjs';
// A conservative proof, including rotated wingtip contact and bonus-ring offsets:
// no fixed altitude can reach both fuel plateaus. Either 28-second plateau is
// longer than a full tank plus the complete coast at the minimum possible drain.
const generousCapture=Math.max(...RING_TYPES.map((r,i)=>r.radius*1.052+4+(i?COURSE.maxRingYOffset:0)))+.8;
assert.ok(2*COURSE.height>2*(generousCapture+2.3));
assert.ok(COURSE.hold-.2>LIMITS.fuel/difficulty(0).drain+5);
let maximumIdle=0;
for(const sign of [0,1])for(let y=-23;y<=23;y+=.25){let fuel=24,coast=0,t=0;for(;t<100;t+=.02){const p=routeAtTime(t,sign);if(Math.abs(p.y-y)<=generousCapture){fuel=24;coast=0;}else{fuel=Math.max(0,fuel-1.1*.02);if(fuel===0)coast+=.02;}if(coast>=5)break;}assert.ok(t<72,'even continuous free refills cannot sustain a fixed position');maximumIdle=Math.max(maximumIdle,t);}
let samples=0,shards=0;
for(const mode of MODES)for(let seed=1;seed<=100;seed++){
 for(let time=0;time<180;time+=.1){const a=routeAtTime(time,seed),b=routeAtTime(time+.001,seed);assert.ok(Math.abs(b.x-a.x)/.001<LIMITS.steerX*.6);assert.ok(Math.abs(b.y-a.y)/.001<LIMITS.steerY*.6);assert.ok(Math.abs(a.x)<LIMITS.x-8&&Math.abs(a.y)<LIMITS.y-6);samples++;}
 // Every world receives the same moving gold path and all rings stay in its
 // altitude band. Test actual generated rows at both plateaus and transitions.
 for(const time of [6,12,30,40,46,65,75]){
  const distance=mode.speed*(120*time-4650*(1-Math.exp(-time/75))),index=Math.max(1,Math.floor(distance/190));
  for(const world of WORLDS){const sector=makeSector(index,time,seed,mode.id,world.id);assert.ok(sector.rings.length<=3);assert.ok(sector.rings.length>0);for(const r of sector.rings){assert.ok(Math.abs(r.y-safeRoute(r.z,seed,mode.id,world.id).y)<=3.001);assert.ok(Math.abs(r.x)<LIMITS.x);assert.ok(Math.abs(r.y)<LIMITS.y);}
   if(world.id==='frost')for(const a of sector.asteroids)if(a.category==='shard'){shards++;assert.ok(a.encounterAt>1.8);const p=frostPosition(a,a.encounterAt-.1),q=frostPosition(a,a.encounterAt);assert.ok(q.y<p.y);}
  }
 }
}
console.log(`PASS: all 15 world/difficulty combinations; ${samples} steerable route samples; actual ring altitude bands across 100 seeds; ${shards} moving shard trajectories; analytic no-idle fuel bound and optimistic fixed-altitude sweep (maximum ${maximumIdle.toFixed(1)} s with unrealistically generous free refills).`);
