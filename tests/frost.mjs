import assert from 'node:assert/strict';
import * as T from '../public/three.module.js';
import {makeSector,safeRoute,MODES,loadSave,difficulty,WORLDS} from '../public/mechanics.mjs';
import {frostPosition,frostState,auroraPoint,vortexSection,flightTime,flightDistance} from '../public/frost-course.mjs';
import {createFrostWorld} from '../public/frost-world.mjs';
let shards=0,vortices=0,curtains=0,samples=0;const patterns=new Set(),directions=new Set();
for(const mode of MODES)for(let seed=1;seed<=24;seed++)for(let index=1;index<=10;index++){
 const sector=makeSector(index,40,seed,mode.id,'frost');assert.equal(sector.asteroids.filter(a=>a.category==='aurora').length,1);assert.ok(sector.asteroids.filter(a=>a.category==='vortex').length<=(mode.id==='hard'?3:2));
 for(const a of sector.asteroids.filter(a=>a.category!=='passage')){
  assert.ok(Math.abs(flightDistance(a.encounterAt,mode.id)-a.z)<1e-6);
  if(a.category==='shard'){
   shards++;const age=.45,p=frostPosition(a,a.birthAt+age),q=frostPosition(a,a.birthAt+age+.01);assert.ok(p.active);assert.ok(q.y<p.y-.3,'shards fall long before encounter');assert.ok(Math.abs((q.y-p.y)/.01-(p.vy-a.gravity*.005))<1e-6);assert.equal(frostPosition(a,a.birthAt-.001).visible,false);assert.equal(frostPosition(a,a.birthAt+a.life+.001).active,false);
  }else if(a.category==='vortex'){
   vortices++;directions.add(Math.sign(a.vx));const p=frostPosition(a,a.encounterAt-1),q=frostPosition(a,a.encounterAt+1);assert.ok(Math.abs(p.x-q.x)>6,'vortices translate');assert.ok(Math.abs(p.y-q.y)>3,'diagonal component');assert.notDeepEqual(vortexSection(a,.6,1),vortexSection(a,.6,1.2),'vortex bends as it rotates');
  }else {
   curtains++;patterns.add(a.pattern);assert.ok(frostState(a,a.birthAt-.5).warning);assert.equal(frostState(a,a.birthAt-.1).visible,false);assert.ok(frostState(a,a.encounterAt).active);assert.equal(frostState(a,a.birthAt+a.life+.01).visible,false);assert.ok(frostState(a,a.birthAt+a.life*.91).envelope<frostState(a,a.encounterAt).envelope);assert.notDeepEqual(auroraPoint(a,.3,a.encounterAt),auroraPoint(a,.3,a.encounterAt+.2));
  }
  for(let dt=-.20;dt<=.20;dt+=.04){const t=a.encounterAt+dt,d=flightDistance(t,mode.id),r=safeRoute(d,seed,mode.id),p=frostPosition(a,t);if(!p.active)continue;
   if(a.category==='aurora'){for(let u=0;u<=1;u+=.025){const c=auroraPoint(a,u,t);assert.ok(Math.hypot(a.x+c.x-r.x,a.y+c.y-r.y)>c.width+4.7,'aurora leaves fuel route clear');samples++;}}
   else if(a.category==='vortex'){assert.ok(Math.abs(p.x-r.x)>a.radius+7.5,'swept core leaves route clear');samples++;}
   else if(Math.abs(p.z+d)<a.maxR+5){assert.ok(Math.hypot(p.x-r.x,p.y-r.y)>a.maxR+4.8,'falling core leaves route clear');samples++;}
  }
  for(const ring of sector.rings)if(Math.abs(ring.z-a.z)<a.depth+8){const t=flightTime(ring.z,mode.id),p=frostPosition(a,t);if(!p.active)continue;if(a.category==='shard')assert.ok(Math.hypot(p.x-ring.x,p.y-ring.y)>a.maxR+ring.r+2.5);else if(a.category==='vortex')assert.ok(Math.abs(p.x-ring.x)>a.radius+ring.r+6);else for(let u=0;u<=1;u+=.025){const c=auroraPoint(a,u,t);assert.ok(Math.hypot(a.x+c.x-ring.x,a.y+c.y-ring.y)>c.width+ring.r+2.5);}}
 }
}
assert.equal(patterns.size,5);assert.equal(directions.size,2);
const scene=new T.Scene(),world=new T.Group();scene.add(world);const art=createFrostWorld(scene,world);art.setActive(true);for(let i=0;i<8;i++)art.spawn(i,42);let draws=0,tris=0;
world.traverse(o=>{if(o.isMesh){draws++;tris+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.count??1);}if(o.geometry)for(const a of Object.values(o.geometry.attributes))assert.ok([...a.array].every(Number.isFinite));});assert.ok(draws<110);assert.ok(tris<220000);
const objects=makeSector(5,40,18,'hard','frost').asteroids.filter(a=>a.category!=='passage').map(a=>art.obstacle(a));for(const a of objects){art.motion(a,0,a.encounterAt);assert.ok(a.collidable);if(a.field){const geo=a.shape.geometry;for(const attr of Object.values(geo.attributes))assert.ok([...attr.array].every(Number.isFinite));assert.equal(a.shape.geometry.attributes.position,a.collisionShapes[0].geometry.attributes.position,'collision surface shares exact animated vertices');const before=[...geo.attributes.position.array];art.motion(a,0,a.encounterAt);assert.deepEqual([...geo.attributes.position.array],before,'fixed clock freezes surfaces');art.motion(a,0,a.encounterAt+.1);assert.notDeepEqual([...geo.attributes.position.array],before);}}
const curtain=objects.find(a=>a.category==='aurora');art.motion(curtain,0,curtain.encounterAt);world.updateMatrixWorld(true);
const vertices=curtain.shape.geometry.attributes.position,edge=new T.Vector3().fromBufferAttribute(vertices,28*9).add(new T.Vector3().fromBufferAttribute(vertices,28*9+1)).multiplyScalar(.5).applyMatrix4(curtain.shape.matrixWorld);
const ray=new T.Raycaster(edge.clone().add(new T.Vector3(0,0,8)),new T.Vector3(0,0,-1),0,16);
assert.ok(ray.intersectObject(curtain.shape).length>0,'faded fringe is visibly present');
assert.equal(ray.intersectObject(curtain.collisionShapes[0]).length,0,'faded fringe has no collision triangles');
for(const geometry of art.shardGeos){assert.ok(geometry.boundingSphere.radius<1,'shard silhouette stays within its collision broad phase');}
art.auroraLight.intensity=260;
art.update(0,12);assert.equal([...art.pools.values()].reduce((n,p)=>n+p.count,0),objects.filter(a=>a.category==='shard').length);assert.ok(art.trails.geometry.drawRange.count<=4096);art.update(1400,12);assert.ok(art.tiles.length<=2);art.reset();assert.equal(art.auroraLight.intensity,0,'restart clears local aurora illumination');assert.equal(art.tiles.length,0);assert.ok([...art.pools.values()].every(p=>p.count===0));assert.equal(art.trails.geometry.drawRange.count,0);art.setActive(false);assert.equal(art.snow.visible,false);assert.equal(art.trails.visible,false);
const prior={version:2,world:'ember',mode:'hard',credits:9281,ship:'night-glider',paint:'rose',ownedShips:['comet','dart'],ownedPaints:['sunbeam','gold'],worldBests:{'ember:hard':{distance:930,score:210}},audio:{muted:true,effects:.3,ambience:.7}};const save=loadSave(JSON.stringify(prior));assert.equal(save.credits,9281);assert.deepEqual(save.audio,prior.audio);assert.equal(save.worldBests['ember:hard'].distance,930);assert.equal(save.worldBests['frost:hard'].distance,0);save.world='frost';assert.equal(loadSave(JSON.stringify(save)).world,'frost');assert.equal(WORLDS.length,6);
assert.equal(difficulty(0,'medium').speed/difficulty(0,'easy').speed,1.55);assert.equal(difficulty(0,'hard').speed/difficulty(0,'easy').speed,2.15);
console.log(`PASS: ${shards} continuous shards, ${vortices} translating vortices, ${curtains} temporary curtains, all five curtain patterns, ${samples} route clearances, reachable rings, finite surfaces, pause/recycling/save checks; eight scenery sectors ${draws} batches/${Math.round(tris)} triangles.`);
