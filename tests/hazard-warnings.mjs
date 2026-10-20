import assert from 'node:assert/strict';
import * as T from '../public/three.module.js';
import {createHazardWarnings,FALL_WARNING_SECONDS} from '../public/hazard-warnings.mjs';
import {LIMITS} from '../public/mechanics.mjs';
assert.ok(FALL_WARNING_SECONDS>=.7+50/LIMITS.steerX,'warning allows reaction plus full route-range lateral steering');
assert.ok(FALL_WARNING_SECONDS>=.7+37/LIMITS.steerY);
for(const category of ['shard','small']){
 const world=new T.Group(),w=createHazardWarnings(world,0xffffff);w.setActive(true);const a={category,x:8,y:-5,z:600,encounterAt:10,radius:3};
 w.update([a],7.39,{x:8,y:-5});assert.equal(w.mesh.count,0);
 w.update([a],7.41,{x:8,y:-5});assert.equal(w.mesh.count,1);const matrix=new T.Matrix4();w.mesh.getMatrixAt(0,matrix);assert.equal(matrix.elements[12],8);assert.equal(matrix.elements[13],-5);assert.equal(matrix.elements[14],-600);
 const before=matrix.elements.slice();w.update([a],7.41,{x:10,y:-4});w.mesh.getMatrixAt(0,matrix);assert.deepEqual(matrix.elements,before,'marker does not chase the player');
 w.update([a],10.1,{x:8,y:-5});assert.equal(w.mesh.count,0);w.update(Array.from({length:100},()=>a),8,{x:8,y:-5});assert.equal(w.mesh.count,24,'bounded warning pool');w.reset();assert.equal(w.mesh.count,0);w.setActive(false);assert.equal(w.mesh.visible,false);
}
console.log('PASS: 2.6-second reaction/steering budget, fixed ice/fire crossing markers, paused clock, expiry, bounded pool and restart/world cleanup.');
