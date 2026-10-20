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
const temp=new URL('./.red-execution.mjs',import.meta.url);await fs.writeFile(temp,source+'\nglobalThis.testFlight={asteroidScenery,get state(){return state},get run(){return run},get save(){return save},get asteroids(){return asteroids},get rings(){return rings},spawnRing,world,surfaceClearance,asteroidMotion,ship,input,start,home,pause,shop,tick,animate,collides,prepareRun,get seed(){return seed},effects,finish,rockGeos,mat,skyDome,planetMaterial,buildShip,selectMode,selectWorld,get flightWorld(){return flightWorld},get flightMode(){return flightMode},themes};');
try{
 await import(temp.href+'?'+Date.now());const g=globalThis.testFlight;
 const {MODES,WORLDS,makeSector}=await import(new URL('mechanics.mjs',root));
 const {flightTime,flightDistance}=await import(new URL('progression.mjs',root));
 for(const mode of MODES){
  let red;for(let index=1;index<300&&!red;index++)red=makeSector(index,flightTime(index*190,mode.id),113,mode.id,'medium').rings.find(r=>r.type===2);
  assert.ok(red);assert.ok(flightTime(red.z,mode.id)>90);
  for(const world of WORLDS){
   g.home();g.selectMode(mode.id);g.selectWorld(world.id);g.start();g.asteroids.splice(0);
   assert.equal(g.rings.some(r=>r.type===2),false,'no red in opening lookahead');
   g.run.time=89.98;g.run.distance=flightDistance(89.98,mode.id);g.spawnRing(red);const queued=g.rings.at(-1);
   assert.equal(queued.g.visible,false,'future red is hidden at creation');g.tick(.01);assert.equal(queued.g.visible,false,'future red stays hidden before 90');
   g.pause();const before=g.run.time;g.tick(5);assert.equal(g.run.time,before);assert.equal(queued.g.visible,false);node('resume').click();
   g.tick(.02);assert.ok(g.run.time>=90);assert.equal(queued.g.visible,true,'red becomes available after threshold');
   g.start();assert.equal(g.rings.some(r=>r.type===2),false,'restart restores opening gate');
  }
 }
 console.log('PASS: actual red-ring creation, simulation threshold, paused threshold, visible lookahead and restart across all 15 world/mode combinations.');
}finally{await fs.unlink(temp);}
