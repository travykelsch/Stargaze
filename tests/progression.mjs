import assert from 'node:assert/strict';
import {progression,flightSpeed,flightDistance,flightTime,ringOffset,omitRingRow} from '../public/progression.mjs';
import {makeSector,routeAtTime,LIMITS,MODES,WORLDS,rng} from '../public/mechanics.mjs';
let samples=0,rows=0,omitted=0,minFuel=24;
for(let t=0;t<=1800;t+=.2){
 const p=progression(t),q=progression(t+.001);
 assert.ok(p.ringScale>=.78&&p.objectSpeed<=1.35&&p.scarcity<=.72);
 for(const k of ['ringMotion','scarcity','objectSpeed'])assert.ok(q[k]>=p[k]&&q[k]-p[k]<.0001);
 assert.ok(q.ringScale<=p.ringScale&&p.ringScale-q.ringScale<.0001);
 assert.ok(flightSpeed(t)<=120);
 assert.ok(Math.abs((flightDistance(t+.001)-flightDistance(t))/.001-flightSpeed(t))<.002);
 if(t%10<.21)for(const m of MODES)assert.ok(Math.abs(flightTime(flightDistance(t,m.id),m.id)-t)<1e-7);
 samples++;
}
for(const start of [30,60,90,120,150,300,900]){
 assert.ok(Math.abs(flightSpeed(start-.000001)-flightSpeed(start+.000001))<1e-7);
 assert.ok(flightSpeed(start+12)>flightSpeed(start));
}
assert.deepEqual(progression(29),{ringMotion:0,ringScale:1,scarcity:0,objectSpeed:1});
for(const mode of MODES)for(let seed=1;seed<=40;seed++){
 let previous=0,fuel=24,skipped=false;
 for(let index=1;index<=1200;index++){
  const time=flightTime(index*190,mode.id),hash=rng((seed^Math.imul(index,19349663))>>>0)(),skip=omitRingRow(index,time,mode.id,hash);
  assert.ok(!(skip&&skipped),'never omit consecutive rows');skipped=skip;
  if(skip){omitted++;continue;}
  // Use worst-case maximum drain, smallest gold refill, no precision bonus,
  // no bonus rings and no five-second coast. Fuel must stay positive indefinitely.
  fuel-=2*(time-previous);minFuel=Math.min(minFuel,fuel);assert.ok(fuel>0);
  if(previous)assert.ok(2*(time-previous)<7,'refill exceeds worst-case cost');
  fuel=Math.min(24,fuel+7);previous=time;rows++;
 }
}
for(const mode of MODES)for(const world of WORLDS)for(let seed=1;seed<=4;seed++)for(const time of [35,75,150,300,600,1800]){
 const index=Math.max(1,Math.floor(flightDistance(time,mode.id,world.id)/190)),sector=makeSector(index,time,seed,mode.id,world.id);
 for(const r of sector.rings){
  assert.ok(r.r>=1.677-1e-9);const at=flightTime(r.z,mode.id,world.id);
  for(let t=at-3;t<=at+1;t+=.05){const p=ringOffset(r,t),q=ringOffset(r,t+.001);
   assert.ok(Math.abs(r.baseX+p.x)<LIMITS.x&&Math.abs(r.baseY+p.y)<LIMITS.y);
   assert.ok(Math.hypot(q.x-p.x,q.y-p.y)/.001<2,'bounded moving target velocity');
   if(r.type===0){const route=routeAtTime(at,seed);assert.ok(Math.hypot(r.baseX+p.x-route.x,r.baseY+p.y-route.y)<r.r,'protected route crosses moving gold opening');}
  }
 }
}
console.log(`PASS: ${samples} smooth bounded progression samples; ${rows} fuel rows and ${omitted} isolated omissions; worst-case minimum tank ${minFuel.toFixed(2)}; all-world moving ring bounds and protected gold openings through 30 minutes.`);
