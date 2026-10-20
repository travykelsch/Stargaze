import assert from 'node:assert/strict';
import {RED_RING_START,redRingChance,makeSector,routeAtTime,MODES,LIMITS,WORLDS} from '../public/mechanics.mjs';
import {flightDistance,flightTime,ringOffset} from '../public/progression.mjs';
assert.equal(RED_RING_START,90);
for(let t=0;t<=90;t+=.1)assert.equal(redRingChance(t),0);
for(let t=90;t<1800;t+=.1){assert.ok(redRingChance(t+.1)>=redRingChance(t));assert.ok(redRingChance(t)<=.9);}
let early=0,later=0,rows=0,curves=0;
for(const mode of MODES)for(let seed=1;seed<=100;seed++){
 for(const [start,key] of [[0,'none'],[95,'early'],[300,'later']]){
  const first=Math.max(1,Math.floor(flightDistance(start,mode.id)/190)),last=Math.ceil(flightDistance(start+25,mode.id)/190);
  for(let index=first;index<last;index++){
   const at=flightTime(index*190,mode.id),sector=makeSector(index,at,seed,mode.id,'medium');
   const red=sector.rings.find(r=>r.type===2);
   if(red){assert.ok(flightTime(red.z,mode.id)>90,'no red encounters before 90 seconds');if(key==='none')assert.fail('red in opening');if(key==='early')early++;if(key==='later')later++;}
   if(key==='none')rows++;
  }
 }
 // Short route windows must vary in BOTH axes, including the former flat bands.
 // Curvature is measured in screen-plane coordinates at actual row crossings.
 for(const start of [0,12,25,60,95,180,600]){
  const points=[];for(let t=start;t<=start+10;t+=.1){const p=routeAtTime(t,seed),q=routeAtTime(t+.001,seed);points.push(p);assert.ok(Math.abs(p.x)<LIMITS.x-8&&Math.abs(p.y)<LIMITS.y-6);assert.ok(Math.abs(q.x-p.x)/.001<LIMITS.steerX*.6);assert.ok(Math.abs(q.y-p.y)/.001<LIMITS.steerY*.6);}
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);assert.ok(Math.max(...xs)-Math.min(...xs)>2);assert.ok(Math.max(...ys)-Math.min(...ys)>.5);
  const a=points[0],b=points.at(-1),length=Math.hypot(b.x-a.x,b.y-a.y),deviation=Math.max(...points.map(p=>Math.abs((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))/Math.max(length,.01)));
  assert.ok(deviation>.15,'course never degenerates to a straight formation over a ten-second window');curves++;
 }
}
assert.ok(early>0&&later>early*1.3,'red encounters grow gradually in the actual generator');
for(const world of WORLDS)for(const mode of MODES)for(const time of [45,91,105,300,600]){
 const index=Math.max(1,Math.floor(flightDistance(time,mode.id)/190)),sector=makeSector(index,time,77,mode.id,world.id);
 for(const r of sector.rings)for(let t=time;t<time+4;t+=.2){const o=ringOffset(r,t);assert.ok(Math.abs(r.x+o.x)<LIMITS.x&&Math.abs(r.y+o.y)<LIMITS.y);}
}
console.log(`PASS: zero early reds across ${rows} opening rows; ${early} introductory versus ${later} later red encounters; ${curves} curved, vertically varied, reachable route windows; all-world ring bounds.`);
let chains=0;
for(const mode of MODES)for(let seed=1;seed<=30;seed++)for(const start of [8,30,60,100,300,600]){
 const groups=[[],[],[]],first=Math.max(1,Math.floor(flightDistance(start,mode.id)/190));
 for(let index=first;index<first+16;index++){const at=flightTime(index*190,mode.id);for(const r of makeSector(index,at,seed,mode.id,'medium').rings)groups[r.type].push(r);}
 for(const points of groups.filter(a=>a.length>=4)){
  const a=points[0],b=points.at(-1),length=Math.hypot(b.x-a.x,b.y-a.y),deviation=Math.max(...points.map(p=>Math.abs((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))/Math.max(length,.01)));
  assert.ok(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))>.1,'generated targets never stay on a fixed altitude rail');
  assert.ok(deviation>.01,'generated same-value ring chains are not collinear');chains++;
 }
}
console.log(`PASS: ${chains} actual same-value ring chains vary in altitude and bend across the screen.`);
