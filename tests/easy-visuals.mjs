import assert from 'node:assert/strict';
import * as T from '../public/three.module.js';
import {createEasyVisuals} from '../public/easy-visuals.mjs';
import {createWorldThemes} from '../public/environments.mjs';
const shared=new Set(),v=createEasyVisuals(g=>{shared.add(g);return g;});
v.update(1234,15.5);for(const m of [v.waterMaterial,v.fallMaterial])assert.equal(m.uniforms.uTime.value,15.5);assert.equal(v.waterMaterial.uniforms.uTravel.value,1234);assert.equal(v.sky.uniforms.uTime.value,15.5);
for(const g of shared){for(const a of Object.values(g.attributes))for(const n of a.array)assert.ok(Number.isFinite(n));}
// Adjacent river tiles meet at exactly the same flow coordinates and wave height.
const river=v.waterGeometry.attributes.position,lo=[],hi=[];for(let i=0;i<river.count;i++){const p=[river.getX(i),river.getZ(i)];if(Math.abs(p[1]+95)<.001)lo.push(p);if(Math.abs(p[1]-95)<.001)hi.push(p);}assert.equal(lo.length,hi.length);for(let i=0;i<lo.length;i++)assert.deepEqual([lo[i][0],lo[i][1]-95],[hi[i][0],hi[i][1]-285]);
const shader={uniforms:{},vertexShader:'#include <begin_vertex>'};v.frondMaterial.onBeforeCompile(shader);assert.equal(shader.uniforms.uEasyWind.value,15.5);assert.ok(shader.vertexShader.includes('instanceMatrix'));
globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}})})};
const scene=new T.Scene(),world=new T.Group();scene.add(world);const themes=createWorldThemes(scene,world);themes.setMode('easy');
let disposed=0;for(let round=0;round<3;round++){for(let i=0;i<5;i++)themes.spawnScenery(i,77);assert.equal(themes.sceneryCount,5);let mist=0,draws=0;world.traverse(o=>{if(o.isPoints){mist++;o.geometry.addEventListener('dispose',()=>disposed++);assert.equal(o.geometry.attributes.position.count,96);}if(o.isMesh||o.isPoints)draws++;});assert.equal(mist,5);assert.ok(draws<=70,'batched canyon: at most fourteen draws per tile');themes.update(200,22);assert.equal(themes.easySky.uniforms.uTime.value,22);themes.resetScenery();assert.equal(world.children.length,0);}assert.equal(disposed,15,'all transient mist buffers disposed after restart');
themes.setMode('medium');themes.spawnScenery(0,1);assert.equal(world.children.length,0);themes.setMode('hard');themes.spawnScenery(0,1);world.traverse(o=>assert.notEqual(o.material,themes.easyVisuals.waterMaterial));themes.resetScenery();
console.log('PASS: river tile continuity, shared animation clocks, finite meshes, wind hook, bounded canyon draws, Easy-only effects and repeated mist cleanup.');
