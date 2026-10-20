import assert from 'node:assert/strict';
import * as T from '../public/three.module.js';
import {collisionQuery} from '../server/collision.mjs';
import {collisionQuery as originalQuery} from './fixtures/collision-before-v58.mjs';
const scene=new T.Scene(),world=new T.Group(),ship=new T.Group();scene.add(world,ship);
const cached=collisionQuery(ship),original=originalQuery(ship);let checks=0;
for(const geo of [new T.BoxGeometry(10,8,12,4,4,4),new T.SphereGeometry(7,24,16),new T.TorusGeometry(12,2,12,40)]){
 const shape=new T.Mesh(geo),group=new T.Group();group.add(shape);world.add(group);shape.userData.concave=geo.type==='TorusGeometry';
 for(let phase=0;phase<4;phase++){
  group.position.set(phase*3,phase-2,-2000);group.rotation.set(phase*.18,phase*.31,phase*.23);shape.scale.set(1+phase*.2,1-phase*.1,1+phase*.15);
  for(let i=0;i<100;i++){ship.position.set(Math.sin(i*2.399)*19,Math.cos(i*1.31)*14,-2000+(i%13-6)*2);assert.equal(cached({shape}),original({shape}),geo.type+' posed collision parity');checks++;}
 }
 // Attribute edits must invalidate transformed vertices even with the same mesh.
 const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)+7);p.needsUpdate=true;
 for(let i=0;i<20;i++){ship.position.set(i-4,1,-2000);assert.equal(cached({shape}),original({shape}));checks++;}
 world.remove(group);
}
console.log(JSON.stringify({pass:true,exactTriangleParity:checks,rotations:true,nonuniformScale:true,concaveOpenings:true,mutableGeometry:true}));
