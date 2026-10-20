import assert from 'node:assert/strict';
import * as T from '../public/three.module.js';
import {createEmberWorld} from '../public/ember-world.mjs';
import {emberPosition,emberDistance,emberTime,splashState,splashPoint} from '../public/ember-course.mjs';
import {makeSector,difficulty,safeRoute,warningDistance,loadSave,worldRecord,MODES,WORLDS} from '../public/mechanics.mjs';
const scene=new T.Scene(),world=new T.Group();scene.add(world);const art=createEmberWorld(scene,world);art.setActive(true);
let samples=0;const categories=new Set(),motion=new Set();
for(const mode of MODES)for(let seed=1;seed<=20;seed++)for(let sector=1;sector<8;sector++){
 const s=makeSector(sector,55,seed,mode.id,'ember');
 for(const a of s.asteroids.filter(a=>a.category!=='passage')){categories.add(a.category);motion.add(a.motionType);
  for(let dt=-.16;dt<=.16;dt+=.04){const time=a.encounterAt+dt,d=emberDistance(time,mode.id),route=safeRoute(d,seed,mode.id);
   if(a.splash){const st=splashState(a,time);for(let age=st.start;age<=st.end;age+=.04){const p=splashPoint(a,age,time);assert.ok(Math.hypot(a.x+p.x-route.x,p.y-route.y)>p.width+4.8,mode.id+' liquid route');samples++;}}
   else {const p=emberPosition(a,time);if(p.active&&Math.abs(p.z+d)<a.maxR+5){assert.ok(Math.hypot(p.x-route.x,p.y-route.y)>a.maxR+4.5,mode.id+' ballistic route');samples++;}}
  }
 }
}
assert.equal(categories.size,3);assert.equal(motion.size,4);
for(let i=0;i<8;i++)art.spawn(i,91);let draws=0,tris=0;world.traverse(o=>{if(o.isMesh){draws++;tris+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.count||1);}if(o.geometry)for(const a of Object.values(o.geometry.attributes))assert.ok([...a.array].every(Number.isFinite));});assert.ok(draws<=8*22,draws+' draws');assert.ok(tris<220000,tris+' triangles');
const matrix=new T.Matrix4(),point=new T.Vector3();for(const tile of art.tiles)tile.g.traverse(o=>{if(!o.isMesh||o.material.isShaderMaterial)return;const positions=o.geometry.attributes.position;for(let instance=0;instance<(o.isInstancedMesh?o.count:1);instance++){if(o.isInstancedMesh)o.getMatrixAt(instance,matrix);else{o.updateMatrix();matrix.copy(o.matrix);}for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(matrix);assert.ok(Math.abs(point.x)>40,'decorative solid scenery stays outside the steering corridor');}}});
for(const geo of art.volcanoes){const p=geo.attributes.position,n=geo.attributes.normal;let outward=0;for(let i=0;i<p.count;i++)if(p.getY(i)<.7&&p.getY(i)>.1&&p.getX(i)*n.getX(i)+p.getZ(i)*n.getZ(i)>0)outward++;assert.ok(outward>100,'volcano exterior normals face outward');}
for(const m of [art.stone,art.hotStone,art.ruinMat]){const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader);assert.ok(shader.uniforms.uEmberTime);assert.ok(shader.fragmentShader.includes('totalEmissiveRadiance'));assert.ok(!/[^\s\n][ \t]*#(?:define|include|if|endif)/.test(shader.fragmentShader),'injected helpers must not join a preprocessor directive');assert.ok(m.bumpMap&&m.map,'surface relief and albedo');}
for(const mat of [art.vaporMat,art.fallMaterial,art.lava])assert.ok(mat.vertexShader.includes('p=instanceMatrix*p'),'batched scenery shader applies its instance transform');
assert.equal(art.landmarks.fortresses.length,3);assert.equal(art.landmarks.islands.length,3);assert.ok(art.landmarks.fortresses.every(g=>g.attributes.position.count>4000),'substantial ruined masonry geometry');
// Shared rendering pools exactly match hidden collision transforms and release retired hazards.
const generated=makeSector(3,20,72,'hard','ember').asteroids.filter(a=>a.category!=='passage').slice(0,18),objects=generated.map(a=>art.obstacle(a));
for(const a of objects)art.motion(a,510,a.encounterAt,difficulty(a.encounterAt,'hard'));art.update(510,8);
assert.equal([...art.pools.values()].reduce((n,p)=>n+p.count,0),objects.filter(a=>!a.fluid&&a.collidable).length);
assert.ok(art.pools.size<=8);assert.ok(objects.filter(a=>!a.fluid).every(a=>!a.shape.visible));
for(const p of art.pools.values())for(let i=0;i<p.count;i++){const m=new T.Matrix4();p.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));}
const liquid=objects.find(a=>a.fluid);assert.equal(liquid.collisionShapes.length,1);assert.equal(liquid.shape,liquid.fluid.surface);assert.ok(liquid.shape.visible);
art.motion(liquid,0,liquid.splash.birthAt-2);assert.equal(liquid.collidable,false);art.motion(liquid,0,liquid.splash.birthAt+liquid.splash.flight+liquid.splash.emission+.1);assert.equal(liquid.collidable,false);
world.remove(objects[0].g);art.update(510,8);assert.equal([...art.pools.values()].reduce((n,p)=>n+p.count,0),objects.filter(a=>a.g.parent===world&&!a.fluid&&a.collidable).length);

let expectedDisposals=0;for(const tile of art.tiles)tile.g.traverse(o=>{if(o.userData.transientGeometry)expectedDisposals++;});let disposed=0;world.traverse(o=>{if(o.userData.transientGeometry)o.geometry.addEventListener('dispose',()=>disposed++);});art.update(1200,3);assert.ok(art.tiles.length<=3);art.reset();assert.equal(art.tiles.length,0);assert.equal(disposed,expectedDisposals,'recycled particle buffers released');art.setActive(false);assert.equal(art.ash.visible,false);assert.equal(art.firePool.visible,false);assert.equal(art.firePool.count,0);
const prior={version:2,mode:'hard',credits:12345,ownedShips:['comet','dart'],ownedPaints:['sunbeam','rose'],modeBests:{hard:{distance:4500,score:290},easy:{distance:900,score:50}},legacyBest:5000};const save=loadSave(JSON.stringify(prior));assert.equal(save.world,'hard');assert.equal(worldRecord(save,'hard','hard').distance,4500);assert.equal(worldRecord(save,'ember','hard').distance,0);assert.equal(worldRecord(save,'easy','hard').distance,0);assert.equal(save.credits,12345);assert.deepEqual(save.ownedShips,prior.ownedShips);assert.equal(save.legacyBest,5000);save.world='ember';save.mode='medium';worldRecord(save,'ember','medium').distance=1200;const reload=loadSave(JSON.stringify(save));assert.equal(reload.world,'ember');assert.equal(reload.worldBests['ember:medium'].distance,1200);assert.deepEqual(reload.modeBests,save.modeBests);assert.equal(WORLDS.length,6);
console.log(`PASS: ${samples} Ember trajectory clearances, continuous trajectories, four motion types, reachable rings, finite geometry, outward volcano surfaces, ${draws} scenery draws/${Math.round(tris)} triangles over eight sectors, cleanup and world/difficulty save migration.`);
