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
const temp=new URL('./.progression-execution.mjs',import.meta.url);await fs.writeFile(temp,source.replace('if(collides(a)){',`if(collides(a)){console.log('CONTACT',JSON.stringify({time:run.time,distance:run.distance,ship:ship.position.toArray(),obstacle:{x:a.x,y:a.y,z:a.z,radius:a.radius,maxR:a.maxR,amp:a.amp,kind:a.kind,position:a.g.position.toArray()}}));`)+'\nglobalThis.testFlight={asteroidScenery,get state(){return state},get run(){return run},get save(){return save},get asteroids(){return asteroids},get rings(){return rings},generateUntil,removeObject,world,surfaceClearance,asteroidMotion,ship,input,start,home,pause,shop,tick,animate,collides,prepareRun,get seed(){return seed},effects,finish,rockGeos,mat,skyDome,planetMaterial,buildShip,selectMode,selectWorld,get flightWorld(){return flightWorld},get flightMode(){return flightMode},themes,primeTime(t,p){for(const a of asteroids)removeObject(a.g);for(const r of rings)removeObject(r.g);asteroids.length=rings.length=0;themes.resetScenery();asteroidScenery.reset(world);run.time=t;run.distance=flightDistance(t,flightMode,flightWorld);nextSector=Math.max(1,Math.floor(run.distance/190)-1);ship.position.set(p.x,p.y,0);world.position.z=run.distance;}};');
try{
 await import(temp.href+'?'+Date.now());const g=globalThis.testFlight;
 const {MODES,WORLDS,routeAtTime,LIMITS,difficulty}=await import(new URL('mechanics.mjs',root));
 let flights=0;const from=Number(process.env.START??600),duration=Number(process.env.DURATION??65);
 for(const world of WORLDS.filter(w=>!process.env.WORLD||w.id===process.env.WORLD))for(const mode of MODES.filter(m=>!process.env.MODE||m.id===process.env.MODE)){
  g.home();g.selectWorld(world.id);g.selectMode(mode.id);const random=Math.random;Math.random=()=>113.5/4294967295;g.start();Math.random=random;
  g.primeTime(from,routeAtTime(from,g.seed));let nextGeneration=0,minFuel=24,peakInput=0;
  while(g.state==='playing'&&g.run.time<from+duration){
   if(g.run.distance>=nextGeneration){nextGeneration=g.run.distance+70;g.generateUntil(g.run.distance+Math.max(950,3.8*difficulty(g.run.time,mode.id).speed+190));
    for(let i=g.asteroids.length-1;i>=0;i--)if(g.asteroids[i].baseZ+g.run.distance>90){g.removeObject(g.asteroids[i].g);g.asteroids.splice(i,1);}
    for(let i=g.rings.length-1;i>=0;i--)if(g.run.distance-g.rings[i].z>60){g.removeObject(g.rings[i].g);g.rings.splice(i,1);}
    g.themes.update(g.run.distance,g.run.time,g.ship.position);g.asteroidScenery.update(g.world,g.run.distance,g.run.time);
   }
   const dt=.01,p=routeAtTime(g.run.time+dt,g.seed);
   g.input.x=Math.max(-1,Math.min(1,(p.x-g.ship.position.x)/(LIMITS.steerX*dt)));g.input.y=Math.max(-1,Math.min(1,(p.y-g.ship.position.y)/(LIMITS.steerY*dt)));
   peakInput=Math.max(peakInput,Math.abs(g.input.x),Math.abs(g.input.y));g.tick(dt);for(const r of g.rings)if(r.type===2){assert.equal(r.g.visible,!r.done&&g.run.time>=90,'red visibility follows simulation time, including lookahead');if(g.run.time<90)assert.equal(r.done,false);}
   minFuel=Math.min(minFuel,g.run.fuel);
  }
  assert.equal(g.state,'playing',world.id+'/'+mode.id+' late route at '+g.run.time);assert.ok(g.run.rings>duration/6);assert.ok(minFuel>0);assert.ok(peakInput<.65);
  console.log('LATE '+JSON.stringify({world:world.name,mode:mode.id,time:g.run.time,rings:g.run.rings,minFuel,peakInput}));flights++;
 }
 console.log('PASS: '+flights+' actual flights from '+from+' through '+(from+duration)+' seconds, active collisions, red visibility, fuel and bounded steering, no evades or bonus-ring dependence.');
}finally{await fs.unlink(temp);}
