// Executes the actual scene, controls and game loop with a non-rendering canvas adapter.
// This is an execution check, not a substitute for visual/device QA.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const nodes=new Map();
class Classes{constructor(){this.s=new Set();}add(...x){x.forEach(v=>this.s.add(v));}remove(...x){x.forEach(v=>this.s.delete(v));}toggle(x,b){if(b??!this.s.has(x))this.s.add(x);else this.s.delete(x);}}
class Node{constructor(id){this.id=id;this.classList=new Classes();this.style={setProperty(){}};this.dataset={};this.children=[];this.events={};this.tagName='DIV';this._html='';}set innerHTML(s){for(const id of this.ids||[])nodes.delete(id);this.ids=[...s.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);this._html=s;for(const m of s.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new Node(m[1]));}get innerHTML(){return this._html;}append(x){this.children.push(x);}querySelector(s){return node(this.id+s);}addEventListener(e,cb){this.events[e]=cb;}setAttribute(){}setPointerCapture(){}click(){this.onclick?.();}getContext(){return {fillText(){},fillStyle:'',font:'',textAlign:'',fillRect(){},createRadialGradient(){return {addColorStop(){}};},createLinearGradient(){return {addColorStop(){}};},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}}
function node(id){if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id);}
const events={};globalThis.__SKYWARD_TEST__=true;globalThis.window=globalThis;globalThis.innerWidth=390;globalThis.innerHeight=844;globalThis.devicePixelRatio=2;globalThis.document={getElementById:node,createElement:()=>new Node('generated'),body:new Node('body'),querySelector:()=>node('wordmark'),addEventListener:(e,fn)=>events[e]=fn};globalThis.addEventListener=(e,fn)=>events[e]=fn;globalThis.requestAnimationFrame=fn=>{globalThis.nextFrame=fn;};const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
let renders=0;globalThis.TestRenderer=class{setPixelRatio(){}setSize(){}render(scene,camera){renders++;assert.ok(scene.children.length>5);assert.ok(camera.position.toArray().every(Number.isFinite));}};
const root=new URL('../public/',import.meta.url),source=(await fs.readFile(new URL('game.js',root),'utf8')).replace("'./controls.mjs?v=38'",JSON.stringify(new URL('controls.mjs',root).href)).replace("'./three.module.js'",JSON.stringify(new URL('three.module.js',root).href)).replace("'./traffic.mjs?v=23'",JSON.stringify(new URL('traffic.mjs',root).href)).replace("'./ring-visuals.mjs?v=23'",JSON.stringify(new URL('ring-visuals.mjs',root).href)).replace("'./mechanics.mjs?v=36'",JSON.stringify(new URL('mechanics.mjs',root).href)).replace("'./ship-models.mjs?v=29'",JSON.stringify(new URL('ship-models.mjs',root).href)).replace("'./asteroid-art.mjs?v=24'",JSON.stringify(new URL('asteroid-art.mjs',root).href)).replace("'./environments.mjs?v=36'",JSON.stringify(new URL('environments.mjs',root).href)).replace("'./world-art.mjs?v=27'",JSON.stringify(new URL('world-art.mjs',root).href)).replace("'./audio.mjs?v=36'",JSON.stringify(new URL('audio.mjs',root).href)).replace("'./rewards.mjs?v=23'",JSON.stringify(new URL('rewards.mjs',root).href)).replace(/'\.\/([^']+?)(?:\?v=\d+)?'/g,(_,name)=>JSON.stringify(new URL(name,root).href)).replace("new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})",'new globalThis.TestRenderer()');
const temp=new URL('./.frost-execution.mjs',import.meta.url);await fs.writeFile(temp,source+'\nglobalThis.testFlight={asteroidScenery,get state(){return state},get run(){return run},get save(){return save},get asteroids(){return asteroids},get rings(){return rings},world,surfaceClearance,asteroidMotion,ship,input,start,home,pause,shop,tick,animate,collides,prepareRun,get seed(){return seed},effects,finish,rockGeos,mat,skyDome,planetMaterial,buildShip,selectMode,selectWorld,get flightWorld(){return flightWorld},get flightMode(){return flightMode},themes};');
try{
 await import(temp.href+'?'+Date.now());const g=globalThis.testFlight;let frameClock=performance.now();
 const {makeSector,safeRoute,difficulty,SHIPS,loadSave}=await import(new URL('mechanics.mjs',root));
 const {auroraPoint,vortexSection,frostPosition}=await import(new URL('frost-course.mjs',root));
 const T=await import(new URL('three.module.js',root));
 g.home();g.selectWorld('frost');assert.equal(g.save.world,'frost');assert.equal(node('destination').textContent,'Frostveil');assert.equal(node('worldIndex').textContent,'05 / 05');
 const balance=g.save.credits,owned=JSON.stringify(g.save.ownedShips);
 for(const mode of ['easy','medium','hard']){
  g.home();g.selectWorld('frost');g.selectMode(mode);
  for(const ship of SHIPS){g.save.ship=ship.id;g.buildShip();g.start();g.input.x=.2;g.tick(.1);assert.equal(g.state,'playing');assert.ok(Math.abs(g.ship.position.x-.54)<.001);assert.equal(g.themes.frost.active,true);assert.ok(g.asteroids.every(a=>a.z>difficulty(0,mode).speed*3.3+a.maxR));}
  g.start();g.input.x=g.input.y=0;
  for(let frame=0;frame<3000&&g.state==='playing';frame++){
   const p=safeRoute(g.run.distance+difficulty(g.run.time,mode).speed*.02,g.seed,mode);g.ship.position.set(p.x,p.y,0);g.tick(.02);
   if(frame%10===0){g.animate(frameClock+=16);}
  }
  assert.equal(g.state,'playing',mode+' Frostveil protected route survives 60 seconds');assert.ok(g.run.rings>10);assert.ok(g.run.time>59.9);assert.ok(g.themes.frost.tiles.length<12);
 }
 g.home();g.selectWorld('frost');g.selectMode('easy');g.start();assert.equal(JSON.stringify(g.save.ownedShips),owned);
 const raw=makeSector(5,30,g.seed,'easy','frost'),arch=g.themes.frost.obstacle(raw.asteroids.find(a=>a.pattern==='arch'));g.asteroids.push(arch);
 g.run.distance=arch.z;g.run.time=arch.encounterAt;g.world.position.z=g.run.distance;g.asteroidMotion(arch,g.run.time,difficulty(g.run.time));g.world.updateMatrixWorld(true);g.ship.rotation.set(0,0,0);
 g.ship.position.set(arch.x,arch.y,0);g.ship.updateMatrixWorld(true);assert.equal(g.collides(arch),false,'visible aurora arch opening is traversable');
 const p=auroraPoint(arch,.5,g.run.time);g.ship.position.set(arch.x+p.x,arch.y+p.y,p.z);g.ship.updateMatrixWorld(true);assert.equal(g.collides(arch),true,'actual folded curtain surface collides');
 g.ship.position.y+=p.width+8;g.ship.updateMatrixWorld(true);assert.equal(g.collides(arch),false,'space outside curtain is clear');
 const before=[...arch.shape.geometry.attributes.position.array];g.pause();const clock=g.run.time;g.tick(1);assert.equal(g.run.time,clock);g.asteroidMotion(arch,clock,difficulty(clock));assert.deepEqual([...arch.shape.geometry.attributes.position.array],before,'pause freezes curtain');
 let geometryDisposed=0,materialDisposed=0;arch.shape.geometry.addEventListener('dispose',()=>geometryDisposed++);arch.shape.material.addEventListener('dispose',()=>materialDisposed++);g.start();assert.equal(geometryDisposed,1);assert.equal(materialDisposed,1);
 // Check the actual closed thin surface and a clear escape point for every pattern.
 for(let index=1;index<=5;index++){
  const source=makeSector(index,35,g.seed,'easy','frost').asteroids.find(a=>a.category==='aurora'),curtain=g.themes.frost.obstacle(source);g.asteroids.push(curtain);
  g.run.distance=curtain.z;g.run.time=curtain.encounterAt;g.world.position.z=curtain.z;g.asteroidMotion(curtain,g.run.time,difficulty(g.run.time));g.world.updateMatrixWorld(true);
  const positions=curtain.shape.geometry.attributes.position,n=28*9+4,q=new T.Vector3().fromBufferAttribute(positions,n);g.ship.position.set(curtain.x+q.x,curtain.y+q.y,q.z-.7);g.ship.rotation.set(0,0,0);g.ship.updateMatrixWorld(true);assert.equal(g.collides(curtain),true,curtain.pattern+' visible sheet contact');
  const route=safeRoute(curtain.z,g.seed,'easy');g.ship.position.set(route.x,route.y,0);g.ship.updateMatrixWorld(true);assert.equal(g.collides(curtain),false,curtain.pattern+' protected opening');
  g.themes.frost.motion(curtain,0,curtain.birthAt+curtain.life+.1);assert.equal(curtain.collidable,false,curtain.pattern+' retires without hidden collider');
 }
 const vortex=g.asteroids.find(a=>a.category==='vortex');g.run.distance=vortex.z;g.run.time=vortex.encounterAt;g.world.position.z=g.run.distance;g.asteroidMotion(vortex,g.run.time,difficulty(g.run.time));g.world.updateMatrixWorld(true);
 const c=vortexSection(vortex,.5,g.run.time);g.ship.position.set(vortex.g.position.x+c.x,vortex.g.position.y+c.y,c.z);g.ship.rotation.set(0,0,0);g.ship.updateMatrixWorld(true);assert.equal(g.collides(vortex),true,'dense moving core collision');
 g.ship.position.x+=c.radius+7;g.ship.updateMatrixWorld(true);assert.equal(g.collides(vortex),false,'loose vortex snow is harmless');
 const fire=g.asteroids.find(a=>a.category==='shard'),time=fire.birthAt+.4;g.themes.frost.motion(fire,0,time);const far=fire.g.position.clone();g.themes.frost.motion(fire,fire.z-2,time);assert.ok(fire.g.position.distanceTo(far)<.00001);g.themes.frost.motion(fire,0,time+.1);assert.ok(fire.g.position.distanceTo(far)>3);g.themes.frost.motion(fire,0,fire.birthAt-.01);assert.equal(g.collides(fire),false);
 g.start();g.asteroids.splice(0);const r=g.rings.find(r=>r.type===0);g.run.distance=r.z-1.50;g.ship.position.set(r.x+r.r+2.9,r.y,0);g.ship.rotation.set(0,0,0);g.tick(.01);assert.equal(g.run.rings,1,'Frostveil wingtip ring contact');g.finish('rock');const paid=g.save.credits;g.home();assert.equal(g.save.credits,paid,'single reward settlement');
 for(let i=0;i<6;i++){g.selectWorld(i%2?'ember':'frost');g.start();g.tick(.1);g.finish('rock');g.home();}g.selectWorld('medium');assert.equal(g.themes.frost.active,false);assert.equal(g.themes.frost.tiles.length,0);assert.equal(g.themes.frost.snow.visible,false);assert.ok([...g.themes.frost.pools.values()].every(p=>p.count===0));assert.equal(g.themes.frost.trails.geometry.drawRange.count,0);
 const reloaded=loadSave(storage.get('skyward-v1'));assert.equal(reloaded.credits,g.save.credits);assert.equal(JSON.stringify(reloaded.ownedShips),owned);assert.ok(reloaded.worldBests['frost:hard'].distance>1000);
 for(const size of [[390,844],[1280,800]]){globalThis.innerWidth=size[0];globalThis.innerHeight=size[1];events.resize();}
 console.log('PASS: actual non-rendering game harness; all 20 ships × three Frostveil difficulties, three 60-second protected flights, real curtain opening/surface and vortex collisions, continuously moving shards, wingtip rings, pause/restart, owned geometry/material cleanup, mode changes, saved rewards and records.');
}finally{await fs.unlink(temp);}
