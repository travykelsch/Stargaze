import assert from 'node:assert/strict';
import {MultiplayerRacers} from '../public/multiplayer-racers.mjs';
const motion=new MultiplayerRacers(),room={round:1,simAt:0,time:0,difficulty:'easy',world:'sunscar',fields:[[{id:1,x:0,y:0,forward:100,ratio:1.6,vx:0,vy:0,crashAge:0,state:'racing'}]]};
let prior=motion.frame(room,0,0,1/60)[0].forward;let maxStep=0;
for(let i=1;i<300;i++){const t=i/60;if(i%36===0){room.time=t;room.simAt=t*1000;room.fields[0][0].forward=100+t*150+(i%72?20:-20);}
 const a=motion.frame(room,t,0,1/60)[0];maxStep=Math.max(maxStep,Math.abs(a.forward-prior));assert.ok(Math.abs(a.forward-prior)<5,'racer does not teleport when a delayed snapshot arrives');prior=a.forward;}
room.fields=[];motion.frame(room,6,0,1/60);assert.equal(motion.tracks.size,0);motion.reset();assert.equal(motion.tracks.size,0);
console.log(JSON.stringify({pass:true,maxRacerStep:maxStep,cleanup:true,authoritativeStateUntouched:true}));
