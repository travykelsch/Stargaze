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
const temp=new URL('./.sunscar-execution.mjs',import.meta.url);await fs.writeFile(temp,source.replace('if(collides(a)){',`if(collides(a)){console.log('CONTACT',JSON.stringify({time:run.time,distance:run.distance,ship:ship.position.toArray(),obstacle:{x:a.x,y:a.y,z:a.z,radius:a.radius,maxR:a.maxR,amp:a.amp,kind:a.kind,position:a.g.position.toArray()}}));`)+'\nglobalThis.testFlight={asteroidScenery,get state(){return state},get run(){return run},get save(){return save},get asteroids(){return asteroids},get rings(){return rings},generateUntil,removeObject,world,surfaceClearance,asteroidMotion,ship,input,start,home,pause,shop,tick,animate,collides,prepareRun,get seed(){return seed},effects,finish,rockGeos,mat,skyDome,planetMaterial,buildShip,selectMode,selectWorld,get flightWorld(){return flightWorld},get flightMode(){return flightMode},get camera(){return camera},get hemisphere(){return hemisphere},get sun(){return sun},get renderer(){return renderer},spawnRing,themes,primeTime(t,p){for(const a of asteroids)removeObject(a.g);for(const r of rings)removeObject(r.g);asteroids.length=rings.length=0;themes.resetScenery();asteroidScenery.reset(world);run.time=t;run.distance=flightDistance(t,flightMode,flightWorld);nextSector=Math.max(1,Math.floor(run.distance/190)-1);ship.position.set(p.x,p.y,0);world.position.z=run.distance;}};');
try{
 await import(temp.href+'?'+Date.now());const g=globalThis.testFlight;
 const {MODES,SHIPS,routeAtTime,LIMITS,difficulty,loadSave}=await import(new URL('mechanics.mjs',root));
 const {flightDistance}=await import(new URL('progression.mjs',root));
 const {sectionAt}=await import(new URL('sunscar-course.mjs',root));
 g.selectWorld('sunscar');let flights=0;
 for(const mode of MODES){
  g.home();g.selectWorld('sunscar');g.selectMode(mode.id);
  for(const item of SHIPS){g.save.ship=item.id;g.buildShip();const savedRandom=Math.random;Math.random=()=>113.5/4294967295;g.start();Math.random=savedRandom;g.input.x=.2;g.input.y=.1;g.tick(.1);assert.equal(g.state,'playing');assert.equal(g.flightWorld,'sunscar');assert.ok(Math.abs(g.ship.position.x-.54)<.002);assert.ok(g.themes.sunscar.field.racers.length>=6&&g.themes.sunscar.field.racers.length<=48);assert.equal(new Set(g.themes.sunscar.field.racers.map(a=>a.kind)).size,4);}
  for(const [from,duration] of [[0,115],[150,35],[600,45]]){
   g.home();g.selectWorld('sunscar');g.selectMode(mode.id);const random=Math.random;Math.random=()=>113.5/4294967295;g.start();Math.random=random;
   if(from)g.primeTime(from,routeAtTime(from,g.seed));let nextGeneration=0,minFuel=24,peakInput=0,peakRacers=0,peakTiles=0;const sections=new Set();
   while(g.state==='playing'&&g.run.time<from+duration){
    if(g.run.distance>=nextGeneration){nextGeneration=g.run.distance+70;g.generateUntil(g.run.distance+Math.max(950,3.8*difficulty(g.run.time,mode.id,'sunscar').speed+190));
     for(let i=g.asteroids.length-1;i>=0;i--){const a=g.asteroids[i];if(a.category==='shot'?g.run.time>a.birthAt+a.life:a.baseZ+g.run.distance>120){g.removeObject(a.g);g.asteroids.splice(i,1);}}
     for(let i=g.rings.length-1;i>=0;i--)if(g.run.distance-g.rings[i].z>60){g.removeObject(g.rings[i].g);g.rings.splice(i,1);}
     g.themes.update(g.run.distance,g.run.time,g.ship.position);
    }
    const dt=.01,p=routeAtTime(g.run.time+dt,g.seed);g.input.x=Math.max(-1,Math.min(1,(p.x-g.ship.position.x)/(LIMITS.steerX*dt)));g.input.y=Math.max(-1,Math.min(1,(p.y-g.ship.position.y)/(LIMITS.steerY*dt)));peakInput=Math.max(peakInput,Math.abs(g.input.x),Math.abs(g.input.y));
    g.tick(dt);minFuel=Math.min(minFuel,g.run.fuel);peakRacers=Math.max(peakRacers,g.themes.sunscar.hazards.length);peakTiles=Math.max(peakTiles,g.themes.sunscar.tiles.length);sections.add(sectionAt(g.run.distance).type);
    for(const r of g.rings)if(r.type===2)assert.equal(r.g.visible,!r.done&&g.run.time>=90);
   }
   assert.equal(g.state,'playing',mode.id+' Sunscar survival at '+g.run.time);assert.ok(g.run.rings>duration/6);assert.ok(minFuel>0);assert.ok(peakInput<.65);assert.ok(peakRacers<=48&&peakTiles<13);
   if(!from)assert.equal(sections.size,6,'all course section families encountered');
   console.log('SUNSCAR '+JSON.stringify({mode:mode.id,from,time:g.run.time,rings:g.run.rings,minFuel,peakInput,peakRacers,peakTiles,stats:g.themes.sunscar.field.stats}));flights++;
  }
 }
 // Real rendered craft primitives and real gate/tunnel geometry participate in
 // the same collision function as the player. No sphere-only collision bypass.
 g.home();g.selectMode('easy');g.selectWorld('sunscar');g.start();g.tick(.01);
 const npc=g.themes.sunscar.hazards[0];g.world.position.z=npc.forward;g.ship.position.set(npc.x,npc.y,0);g.ship.rotation.set(0,0,0);g.ship.updateMatrixWorld(true);g.world.updateMatrixWorld(true);assert.equal(g.collides(npc),true,'NPC visible body is solid');
 g.ship.position.x+=30;g.ship.updateMatrixWorld(true);assert.equal(g.collides(npc),false);
 g.generateUntil(2400);const gate=g.asteroids.find(a=>a.category==='gate'),hollow=g.asteroids.find(a=>a.category==='course'&&a.section===3);assert.ok(gate&&hollow);
 g.world.position.z=gate.z;g.ship.position.set(gate.x,gate.y,0);g.ship.updateMatrixWorld(true);g.world.updateMatrixWorld(true);assert.equal(g.collides(gate),false,'true stone gate opening');g.ship.position.x+=18;g.ship.position.y-=5;g.ship.updateMatrixWorld(true);assert.equal(g.collides(gate),true,'solid gate column');
 g.world.position.z=hollow.z;g.ship.position.set(0,0,0);g.ship.updateMatrixWorld(true);g.world.updateMatrixWorld(true);assert.equal(g.collides(hollow),false,'true tunnel interior');g.ship.position.set(50,10,0);g.ship.updateMatrixWorld(true);assert.equal(g.collides(hollow),true,'solid tunnel wall');
 g.start();g.tick(.05);const before=JSON.stringify(g.themes.sunscar.field.racers);g.pause();g.tick(3);assert.equal(JSON.stringify(g.themes.sunscar.field.racers),before);node('resume').click();g.tick(.02);assert.notEqual(JSON.stringify(g.themes.sunscar.field.racers),before);
 g.start();assert.equal(g.themes.sunscar.hazards.length,0);assert.equal(g.themes.sunscar.effects.length,0);g.tick(.02);assert.ok(g.themes.sunscar.hazards.length>0);
 for(const world of ['easy','medium','hard','ember','frost']){g.home();g.selectWorld(world);g.start();assert.equal(g.themes.sunscar.active,false);assert.equal(g.themes.sunscar.hazards.length,0);assert.equal(g.themes.sunscar.tiles.length,0);assert.ok(g.themes.sunscar.torchLights.every(l=>l.intensity===0));g.tick(.1);assert.equal(g.state,'playing');}
 const saved=loadSave(storage.get('skyward-v1'));assert.equal(saved.credits,g.save.credits);assert.equal(saved.ship,g.save.ship);
 console.log('PASS: '+flights+' active Sunscar early/middle/late flights, all 20 ships × 3 modes, actual racer/gate/tunnel triangles, all six sections, red timing, pause/restart, bounded recycling, all-world cleanup and saved progress.');
}finally{await fs.unlink(temp);}
