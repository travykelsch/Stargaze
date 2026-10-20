import assert from 'node:assert/strict';
import {planPassages,inPassageOpening,PASSAGES} from '../public/passages.mjs';
import {WORLDS,MODES,safeRoute,routeAtTime,LIMITS,COURSE} from '../public/mechanics.mjs';
import {flightDistance,flightTime,flightSpeed,progression,ringOffset,SUNSCAR_BOOST} from '../public/progression.mjs';
let count=0,boundaries=0,stationary=0,routeChecks=0;
for(const world of WORLDS)for(const mode of MODES)for(let seed=1;seed<=12;seed++){
 const first=[];
 for(let n=0;n<180;n++){const original=PASSAGES.first+n*PASSAGES.interval,index=Math.floor(flightDistance(original,mode.id,world.id)/190),all=[...planPassages(index,seed,mode.id,world.id,safeRoute),...planPassages(index+1,seed,mode.id,world.id,safeRoute)],matches=all.filter(a=>a.passageId===n);assert.equal(matches.length,1,'each timed passage belongs to exactly one sector');const a=matches[0];count++;
  assert.ok(a.encounterAt>=original-1e-6&&a.encounterAt-original<.5);assert.ok(Math.abs(flightTime(a.z,mode.id,world.id)-a.encounterAt)<1e-7);
  const row=Math.floor(a.z/190);for(const r of [row*190,row*190+55,(row+1)*190])assert.ok(Math.abs(a.z-r)>=13-1e-5,'formation does not bury any ring row');
  for(const y of [-23,23])assert.equal(Math.abs(y-a.gapY)+.85>a.halfY,true,'no horizontal escape lane at the ceiling or floor');for(const x of [-32,32])assert.equal(Math.abs(x-a.gapX)+2.53>a.halfX,true,'no vertical escape lane at left/right bounds');boundaries+=4;
  const dt=(a.depth+4)/flightSpeed(a.encounterAt,mode.id,world.id);for(let t=a.encounterAt-dt;t<=a.encounterAt+dt;t+=dt/3){const p=routeAtTime(t,seed);assert.ok(inPassageOpening(a,p,2.6,.9),'ordinary protected route fits through complete visible depth');routeChecks++;}
  if(original<80)first.push(a);
 }
 const ix0=Math.max(...first.map(a=>a.gapX-a.halfX+2.53)),ix1=Math.min(...first.map(a=>a.gapX+a.halfX-2.53)),iy0=Math.max(...first.map(a=>a.gapY-a.halfY+.85)),iy1=Math.min(...first.map(a=>a.gapY+a.halfY-.85));assert.ok(ix0>=ix1||iy0>=iy1,'continuous intersection of all safe openings is empty');
 for(let x=-32;x<=32;x+=4)for(let y=-23;y<=23;y+=2){assert.ok(first.some(a=>!inPassageOpening(a,{x,y},2.6,.85)),'no stationary interior point survives the full route cycle');stationary++;}
}
assert.ok(COURSE.height+2.3+PASSAGES.halfY<LIMITS.y+.85,'all-time vertical bound covers every ceiling/floor position');assert.ok(18+PASSAGES.halfX<LIMITS.x+2.53,'all-time horizontal bound covers every side position');
for(let t=0;t<=60;t+=.1)assert.equal(progression(t).ringMotion,0);assert.ok(progression(60.5).ringMotion>0);assert.ok(progression(72).ringMotion>=.45);for(const t of [72,120,600,1800]){const o=ringOffset({motionPhase:.5},t);assert.ok(Math.hypot(o.x,o.y)<2.2);}
for(const m of MODES)for(const t of [8,30,120,600,1800]){const u=Math.min(1,t/8),oldClock=t+.28*(8*(u**3-.5*u**4)+Math.max(0,t-8)),oldSpeed=flightSpeed(oldClock,m.id)* (1+.28*u*u*(3-2*u));assert.ok(flightSpeed(t,m.id,'sunscar')/oldSpeed>1.23);assert.ok(flightSpeed(t,m.id,'sunscar')<=120*2.15*SUNSCAR_BOOST+.001);}
console.log(JSON.stringify({count,boundaries,stationary,routeChecks,boost:SUNSCAR_BOOST}));console.log('PASS: every map/mode has physical boundary coverage, no permanent fixed-point bypass, ring-safe placement, complete-depth steering clearance, exact faster Sunscar clock and visible ring motion beginning after 60 seconds.');
