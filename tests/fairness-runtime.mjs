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
const temp=new URL('./.fairness-execution.mjs',import.meta.url);await fs.writeFile(temp,source+'\nglobalThis.testFlight={asteroidScenery,get state(){return state},get run(){return run},get save(){return save},get asteroids(){return asteroids},get rings(){return rings},generateUntil,removeObject,world,surfaceClearance,asteroidMotion,ship,input,start,home,pause,shop,tick,animate,collides,prepareRun,get seed(){return seed},effects,finish,rockGeos,mat,skyDome,planetMaterial,buildShip,selectMode,selectWorld,get flightWorld(){return flightWorld},get flightMode(){return flightMode},themes};');
try{
 await import(temp.href+'?'+Date.now());const g=globalThis.testFlight;
 const {MODES,WORLDS,difficulty,routeAtTime,LIMITS}=await import(new URL('mechanics.mjs',root));
 const report=[];let idles=0,pilots=0,nextGeneration=0;
 function recycle(){if(g.run.distance<nextGeneration)return;nextGeneration=g.run.distance+70;g.generateUntil(g.run.distance+Math.max(680,4.1*difficulty(g.run.time,g.flightMode,g.flightWorld).speed+200));for(let i=g.asteroids.length-1;i>=0;i--)if(g.asteroids[i].category==='shot'?g.run.time>g.asteroids[i].birthAt+g.asteroids[i].life:g.asteroids[i].baseZ+g.run.distance>90){g.removeObject(g.asteroids[i].g);g.asteroids.splice(i,1);}for(let i=g.rings.length-1;i>=0;i--)if(g.run.distance-g.rings[i].z>60){g.removeObject(g.rings[i].g);g.rings.splice(i,1);}g.themes.update(g.run.distance,g.run.time,g.ship.position);}
 // Fixed seeds make failures reproducible. No collision bypass, teleporting,
 // invulnerability, reward shortcut, or hidden AFK timer is used.
 for(const world of WORLDS)for(const mode of MODES){
  const deaths=[];
  for(const seed of [113,982451653]){
   g.home();g.selectWorld(world.id);g.selectMode(mode.id);const priorRandom=Math.random;Math.random=()=>(seed+.5)/4294967295;g.start();Math.random=priorRandom;
   g.input.x=g.input.y=0;nextGeneration=0;
   while(g.state==='playing'&&g.run.time<85){const dt=Math.min(.01,1/difficulty(g.run.time,mode.id).speed);g.tick(dt);recycle();}
   assert.notEqual(g.state,'playing',world.id+'/'+mode.id+' no-input run must end');deaths.push(Number(g.run.time.toFixed(2)));idles++;
  }
  for(const [edgeX,edgeY]of [[0,23],[0,-23],[-32,23],[32,-23]]){
   g.home();g.selectWorld(world.id);g.selectMode(mode.id);const rand=Math.random;Math.random=()=>113.5/4294967295;g.start();Math.random=rand;nextGeneration=0;
   while(g.state==='playing'&&g.run.time<15){const dt=.01;g.input.x=Math.max(-1,Math.min(1,(edgeX-g.ship.position.x)/(LIMITS.steerX*dt)));g.input.y=Math.max(-1,Math.min(1,(edgeY-g.ship.position.y)/(LIMITS.steerY*dt)));g.tick(dt);recycle();}
   assert.notEqual(g.state,'playing',world.id+'/'+mode.id+' boundary cannot bypass physical hazards');assert.ok(g.run.fuel>2,'boundary test ends on a real obstacle, not fuel');idles++;
  }
  g.home();g.selectWorld(world.id);g.selectMode(mode.id);const oldRandom=Math.random;Math.random=()=>(113.5)/4294967295;g.start();Math.random=oldRandom;let maximumInput=0;nextGeneration=0;
  while(g.state==='playing'&&g.run.time<65){
   const dt=Math.min(.01,1/difficulty(g.run.time,mode.id).speed),target=routeAtTime(g.run.time+dt,g.seed);
   g.input.x=Math.max(-1,Math.min(1,(target.x-g.ship.position.x)/(LIMITS.steerX*dt)));g.input.y=Math.max(-1,Math.min(1,(target.y-g.ship.position.y)/(LIMITS.steerY*dt)));
   maximumInput=Math.max(maximumInput,Math.abs(g.input.x),Math.abs(g.input.y));g.tick(dt);
   recycle();
  }
  assert.equal(g.state,'playing',world.id+'/'+mode.id+' reachable route via actual controls at '+g.run.time.toFixed(2));assert.ok(g.run.rings>12);assert.ok(maximumInput<.65);pilots++;
  report.push({world:world.name,mode:mode.label,idleSeconds:deaths,activeSeconds:Number(g.run.time.toFixed(1)),rings:g.run.rings,maximumSteering:Number(maximumInput.toFixed(2))});
  console.log('CHECK '+JSON.stringify(report.at(-1)));
 }
 // Advance warning is fixed to encounter coordinates, visible before contact,
 // pauses with simulation time, and is cleared/hidden on restart/world change.
 g.home();g.selectWorld('frost');g.selectMode('easy');g.start();const a=g.asteroids.find(a=>a.category==='shard');
 const warning=g.themes.frost.warnings;warning.update([a],a.encounterAt-1.5,{x:a.x,y:a.y});assert.equal(warning.mesh.count,1);const matrix=new (await import(new URL('three.module.js',root))).Matrix4();warning.mesh.getMatrixAt(0,matrix);assert.ok(Math.abs(matrix.elements[12]-a.x)<.001);assert.ok(Math.abs(matrix.elements[13]-a.y)<.001);
 warning.update([a],a.encounterAt-3.0,{x:a.x,y:a.y});assert.equal(warning.mesh.count,0);
 warning.update([a],a.encounterAt-1.5,{x:a.x,y:a.y});g.start();assert.equal(warning.mesh.count,0);g.home();g.selectWorld('medium');assert.equal(warning.mesh.visible,false);
 console.log('PASS: '+idles+' stationary/boundary failures and '+pilots+' actively steered 65-second flights across all 18 combinations; fixed advance warnings, restart cleanup and unchanged control speed.');
}finally{await fs.unlink(temp);}
