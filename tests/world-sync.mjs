import assert from 'node:assert/strict';
import * as T from '../public/three.module.js';
import {Geometry} from '../server/geometry.mjs';
import {WORLDS} from '../public/mechanics.mjs';
import {flightTime} from '../public/progression.mjs';
const engine=new Geometry();let checks=0;
for(const world of WORLDS){
 const room={world:world.id,difficulty:'easy',seed:113,time:20};let moving;
 for(let i=4;i<18&&!moving;i++){const sector=engine.sector(room,i);moving=sector.obstacles.find(a=>world.id==='sunscar'?a.category==='shot':world.id==='frost'?a.category==='shard':world.id==='ember'?['small','eruption'].includes(a.category):world.id==='easy'?!!a.creature:a.category!=='passage'&&!a.arch);}
 assert.ok(moving,'moving hazard exists in '+world.id);const t=moving.birthAt??moving.encounterAt??flightTime(moving.z,'easy',world.id),pilot={x:0,y:0,z:moving.z};
 engine.collision(room,pilot,t+.2,[moving]);const first=[...moving.g.position.toArray(),...moving.g.quaternion.toArray()];
 engine.collision(room,{...pilot,z:pilot.z+900},t+.2,[moving]);assert.deepEqual([...moving.g.position.toArray(),...moving.g.quaternion.toArray()],first,world.id+' world pose cannot depend on observing pilot');
 engine.collision(room,pilot,t+.6,[moving]);const next=[...moving.g.position.toArray(),...moving.g.quaternion.toArray()];assert.ok(next.some((v,i)=>Math.abs(v-first[i])>1e-5),world.id+' hazard keeps animating');checks++;
}
const g=new T.Group(),shape=new T.Mesh(new T.BoxGeometry(8,8,8));g.add(shape);g.position.z=-1500;engine.world.add(g);const obstacle={g,shape,environment:'medium',arch:true,baseX:0,baseY:0,baseZ:-1500,maxR:8,depth:8,phase:0};const room={world:'medium',difficulty:'easy'};
assert.ok(engine.collision(room,{x:0,y:0,z:1500},0,[obstacle]));engine.world.remove(g);assert.ok(engine.collision(room,{x:0,y:0,z:1500},0,[obstacle]),'retained collision handle stays in absolute course space after cache retirement');assert.equal(engine.collision(room,{x:0,y:0,z:0},0,[obstacle]),null);checks++;
console.log(JSON.stringify({pass:true,checks,sharedHazardPoses:true,movingWorlds:6,absoluteCollisionSpace:true,rendered:false}));
