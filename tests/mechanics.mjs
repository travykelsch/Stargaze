import assert from 'node:assert/strict';
import {LIMITS,PAINTS,SHIPS,RING_TYPES,difficulty,safeRoute,makeSector,ringPass,ringSweep,fuelAfterRing,creditRing,purchase,loadSave} from '../public/mechanics.mjs';
assert.equal(loadSave('broken').credits,0);
assert.equal(loadSave('{"rings":-1,"owned":["fake"],"ship":"fake"}').ship,'comet');
const migrated=loadSave('{"rings":48,"owned":["sunbeam","lagoon"],"paint":"lagoon","best":5300}');
assert.equal(migrated.credits,480);assert.equal(migrated.paint,'lagoon');assert.equal(migrated.best,5300);
assert.deepEqual(loadSave(JSON.stringify(migrated)),migrated,'migration happens only once');
assert.equal(loadSave('{"version":2,"credits":1e999}').credits,0);
const s=loadSave(null),run={points:0,rings:0};assert.equal(creditRing(s,run,2,true),75);assert.equal(s.credits,75);assert.equal(run.points,75);
assert.equal(purchase(s,'ship','dart',{preview:false}).ok,false);assert.equal(s.credits,75);assert.equal(s.ship,'comet');
s.credits=10000;assert.equal(purchase(s,'ship','dart',{preview:false}).ok,true);assert.equal(s.credits,4000);assert.equal(s.ship,'dart');assert.equal(purchase(s,'ship','dart',{preview:false}).ok,true);assert.equal(s.credits,4000,'equipping does not charge twice');
assert.equal(purchase(s,'paint','rose',{preview:false}).ok,true);assert.equal(s.credits,1600);assert.equal(s.paint,'rose');assert.equal(purchase(s,'ship','missing',{preview:false}).ok,false);
for(const kind of [0,1,2]){assert.equal(fuelAfterRing(23,kind,true),24);assert.equal(ringPass(0,0,RING_TYPES[kind].radius).perfect,true);assert.equal(ringPass(RING_TYPES[kind].radius,0,RING_TYPES[kind].radius).hit,true);}
for(let t=0;t<600;t+=.25){const a=difficulty(t),b=difficulty(t+.25);for(const k of ['speed','density','motion','spin','drain']){assert.ok(b[k]>=a[k]);assert.ok(b[k]-a[k]<.4,'no 30-second jumps');}assert.ok(a.speed<=120);}
assert.ok(difficulty(0).speed>2*22);assert.ok(difficulty(180).density>2*difficulty(0).density);
assert.equal(ringSweep({x:5,y:0,z:-2},{x:5,y:0,z:2},4.6,.4),true,'touching outer tube collects');
assert.equal(ringSweep({x:5.5,y:0,z:-2},{x:5.5,y:0,z:2},4.6,.4),false,'clear miss stays a miss');
assert.equal(ringSweep({x:0,y:0,z:-4},{x:0,y:0,z:4},4.6),true,'fast crossing cannot tunnel');
assert.equal(ringSweep({x:0,y:0,z:5},{x:0,y:0,z:6},4.6),false,'distant ring does not collect');
assert.ok(difficulty(60).density>29);assert.ok(difficulty(60).motion>4);assert.ok(difficulty(60).speed>69);
let minRadius=Infinity,maxRadius=0,totalRocks=0;
for(let seed=1;seed<=35;seed++){for(let index=1;index<35;index++){
const sector=makeSector(index,index*4,seed);totalRocks+=sector.asteroids.length;for(const a of sector.asteroids){minRadius=Math.min(minRadius,a.radius);maxRadius=Math.max(maxRadius,a.radius);}assert.ok([0,2,3].includes(sector.rings.length));if(sector.rings.length){const [gold,cyan,coral]=sector.rings;if(coral){assert.equal(cyan.z,coral.z);assert.ok(Math.abs(cyan.x-coral.x)>=36,'bonus rings require an exclusive choice');}}
for(const r of sector.rings){assert.ok(Math.abs(r.x)<LIMITS.x);assert.ok(Math.abs(r.y)<LIMITS.y);assert.ok(r.r>.7);}
for(const a of sector.asteroids){if(a.bonus||a.arch||a.category==='passage')continue;const p=safeRoute(a.z,seed);assert.ok(Math.hypot(a.x-p.x,a.y-p.y)>=(a.creature?Math.min(a.radius,4)*.75:a.maxR)+a.amp+difficulty(index*4).corridor-.01,'safe route includes motion clearance');}
// At max speed, steering can follow the continuously curved fuel route.
for(let z=index*190;z<(index+1)*190;z+=3){const a=safeRoute(z,seed),b=safeRoute(z+.01,seed);assert.ok(Math.abs(b.x-a.x)/.01*120<LIMITS.steerX);assert.ok(Math.abs(b.y-a.y)/.01*120<LIMITS.steerY);}
}}
assert.ok(maxRadius/minRadius>50,'asteroids range from fragments to huge boulders');assert.ok(maxRadius>44,'giant asteroid tier is substantially bigger');
assert.ok(PAINTS.slice(1).every(p=>p.price>=1200));assert.ok(SHIPS.filter(p=>p.id!=='comet').every(p=>p.price>=6000));
console.log(`PASS: smooth difficulty, ${totalRocks} asteroid placements, fuel route steering, ring tiers, purchases, duplicate-charge prevention, and legacy save migration.`);

const preview=loadSave(null),ownedBefore=JSON.stringify([preview.ownedShips,preview.ownedPaints]);assert.equal(SHIPS.length,20);for(const p of SHIPS){const result=purchase(preview,'ship',p.id);assert.ok(result.ok);assert.equal(preview.ship,p.id);assert.equal(preview.credits,0);assert.equal(loadSave(JSON.stringify(preview)).ship,p.id,'free selection survives reload');}for(const p of PAINTS)assert.ok(purchase(preview,'paint',p.id).ok);assert.equal(preview.credits,0);assert.equal(JSON.stringify([preview.ownedShips,preview.ownedPaints]),ownedBefore,'preview does not grant permanent ownership');assert.equal(loadSave(JSON.stringify(preview),{preview:false}).ship,'comet','paid mode restores ownership validation');console.log('PASS: all twenty ships and all colors select freely at zero credits, persist selection, preserve ownership and support paid mode.');
