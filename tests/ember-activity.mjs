import assert from 'node:assert/strict';
import * as T from '../public/three.module.js';
import {createEmberWorld} from '../public/ember-world.mjs';
import {eruptionSample,emberRiverX} from '../public/ember-activity.mjs';
import {emberPosition,splashState,splashPoint,emberDistance,emberTime} from '../public/ember-course.mjs';
import {makeSector,difficulty} from '../public/mechanics.mjs';

const scene=new T.Scene(),world=new T.Group();scene.add(world);const art=createEmberWorld(scene,world);art.setActive(true);
for(let i=0;i<6;i++)art.spawn(i,12);
const bursts=[];for(const tile of art.tiles)tile.g.traverse(o=>{if(o.userData.eruptionSources){bursts.push({o,tile});assert.equal(o.userData.eruptionSources.length,6);assert.equal(o.geometry.attributes.position.count,610);const sources=o.userData.eruptionSources.filter(s=>s.y<0);assert.equal(sources.length,2);for(const s of sources)assert.ok(Math.abs(s.x-emberRiverX(tile.z-s.z))<23,'river fountains originate in the river');}});
const camera=new T.PerspectiveCamera(62,390/844,.1,1300);camera.position.set(0,6,29);camera.lookAt(0,4,-40);camera.updateMatrixWorld();let minVisible=Infinity;
// Project the actual ballistic particles in a portrait camera throughout launch.
for(let time=0;time<8;time+=.1){let visible=0;for(const {o,tile} of bursts){const p=o.geometry.attributes.position,v=o.geometry.attributes.launch,ph=o.geometry.attributes.phase;for(let i=0;i<p.count;i++){if(p.getY(i)>0)continue;const s=eruptionSample(time,ph.getX(i),{x:p.getX(i),y:p.getY(i),z:p.getZ(i)-tile.z},{x:v.getX(i),y:v.getY(i),z:v.getZ(i)});if(!s.active||s.age<.1)continue;const point=new T.Vector3(s.x,s.y,s.z+58*time);if(point.z>15)continue;const pixel=(1500+v.getY(i)*24)/(29-point.z);point.project(camera);if(Math.abs(point.x)<.95&&point.y>-.95&&point.y<.5&&pixel>4)visible++;}}minVisible=Math.min(minVisible,visible);assert.ok(visible>5,'prominent river bursts visible in early flight at '+time);}
let rain=0,launches=0,eruptions=0,interactable=0,total=0;const patterns=new Set();
for(const mode of ['easy','medium','hard'])for(let seed=1;seed<=25;seed++)for(let index=1;index<8;index++){
 const sector=makeSector(index,30,seed,mode,'ember');assert.equal(sector.asteroids.filter(a=>a.category==='eruption').length,1);
 for(const a of sector.asteroids){total++;if(Math.abs(a.x)<32+(a.splash?20:a.radius)&&Math.abs(a.y)<23+a.radius)interactable++;
  if(a.splash){eruptions++;patterns.add(a.splash.type);const s=a.splash;assert.ok(splashState(a,s.birthAt-.5).warning);assert.equal(splashState(a,s.birthAt-2).active,false);assert.equal(splashState(a,s.birthAt+s.flight+s.emission+.1).active,false);
   for(const clock of [s.birthAt+.2,a.encounterAt,s.birthAt+s.emission+s.flight-.15]){const st=splashState(a,clock);assert.ok(st.active);assert.ok(st.end>st.start);const p=splashPoint(a,st.end,clock);assert.ok(Object.values(p).every(Number.isFinite));}
   assert.ok(splashState(a,s.birthAt+.2).end<splashState(a,a.encounterAt).end,'stream grows');assert.ok(splashState(a,s.birthAt+s.emission+s.flight-.15).start>0,'source ceases and tail falls');
   continue;
  }
  if(a.category!=='small')continue;
  assert.equal(emberPosition(a,a.birthAt-.01).active,false);assert.equal(emberPosition(a,a.birthAt+a.life+.01).active,false);
  // Before player approach, a visible fireball already accelerates under gravity.
  for(let age=.1;age<a.life-.02;age+=.1){const t=a.birthAt+age,p=emberPosition(a,t),q=emberPosition(a,t+.01);assert.ok(Math.abs((q.y-p.y)/.01-(p.vy-a.gravity*.005))<.00001);assert.ok(Math.abs(p.vy-(a.velocity.y-a.gravity*age))<.00001);}
  const p=emberPosition(a,a.encounterAt);assert.ok(Math.abs(p.z+a.z)<.00001);assert.ok(Math.abs(p.vy)>35,'fast fire on approach');
  if(a.motionType==='fall'){assert.ok(emberPosition(a,a.birthAt+.001).vy< -24);rain++;}else{assert.ok(emberPosition(a,a.birthAt+.001).vy>65);assert.ok(p.vy<0,'launched fire crests and descends');launches++;}
 }
}
assert.equal(patterns.size,4);assert.ok(interactable/total>.55,'hazards stay near playable view');
const hazards=makeSector(3,20,11,'hard','ember').asteroids.map(a=>art.obstacle(a));hazards.forEach(a=>art.motion(a,580,a.encounterAt,difficulty(8,'hard')));art.update(580,8);
assert.equal(art.firePool.count,hazards.filter(a=>a.category==='small').length);assert.equal(art.activity.burstMaterial.uniforms.uTime.value,8);art.update(580,8);assert.equal(art.activity.burstMaterial.uniforms.uTime.value,8);
for(const a of hazards.filter(a=>a.fluid)){const f=a.fluid,s=a.splash;for(let age=-1.2;age<s.flight+s.emission+.2;age+=.04){art.motion(a,580,s.birthAt+age);if(f.surface.visible){assert.ok([...f.surface.geometry.attributes.position.array].every(Number.isFinite));assert.equal(a.collisionShapes[0],f.surface);assert.equal(f.drops.count,40);}}}
art.reset();assert.equal(art.firePool.count,0);art.setActive(false);assert.equal(art.firePool.visible,false);
console.log(`PASS: at least ${minVisible} prominent river particles in portrait launch view; ${rain} continuous rain / ${launches} ballistic launches / ${eruptions} liquid eruptions; all four splash lifecycles; pause, render pools and cleanup.`);
