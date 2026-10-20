import assert from 'node:assert/strict';
import {MultiplayerMotion,remotePose} from '../public/multiplayer-motion.mjs';
import {movePilot,beginEvade} from '../public/multiplayer-rules.mjs';
import {newPilot,newRoom,advance} from '../server/matches.mjs';

const room={phase:'playing',world:'easy',difficulty:'easy',time:0,simAt:0,serverNow:0};
const p=newPilot('one','private',{},0),motion=new MultiplayerMotion();
const packets=[];let before=0,newBacksteps=0,oldBacksteps=0,oldZ=0,lastServer=-1;
for(let i=0;i<600;i++){
 const now=i*1000/60,time=now/1000,dt=1/60;
 if(i%9===0){const delay=[90,240,130,400][(i/9)%4],pilot=structuredClone(p);packets.push({due:now+delay,delay,pilot,time});}
 movePilot(p,{x:0,y:0},dt,time,room);
 for(const packet of packets.filter(x=>!x.used&&x.due<=now).sort((a,b)=>a.due-b.due)){
  packet.used=true;if(packet.time<lastServer)continue;lastServer=packet.time;
  const r={...room,time:packet.time,simAt:packet.time*1000,serverNow:packet.time*1000};
  motion.accept(packet.pilot,r,now,2*(now-packet.time*1000));
  if(packet.pilot.z<oldZ)oldBacksteps++;oldZ=packet.pilot.z;
 }
 motion.step({x:0,y:0},dt,room,now);oldZ+=p.z-(i?p.previousZ||0:0);p.previousZ=p.z;
 const shown=motion.display();if(shown){if(shown.z<before-1e-6)newBacksteps++;before=shown.z;assert.ok(Math.abs(shown.z-p.z)<8,'forward prediction tracks the course under jitter');}
}
assert.ok(oldBacksteps>10,'fixture reproduces snapshot rewind');assert.equal(newBacksteps,0);assert.ok(motion.history.length<=181);
// Incorrect transit estimates still must not reverse the world during correction.
const last=motion.display().z;motion.accept({...motion.pilot,z:motion.pilot.z-70},room,10000,0);assert.equal(motion.display().z,last);
for(let k=0;k<60;k++){const z=motion.display().z;motion.step({x:0,y:0},1/60,room,10000+k*1000/60);assert.ok(motion.display().z>=z);}
// A snapshot must not restart an unacknowledged evade, or undo a respawn.
const own=motion.pilot;beginEvade(own,1,0);motion.step({x:0,y:0},.1,room,10010);const remaining=motion.pilot.evade.remaining;
motion.accept({...p,evadeSeq:-1},room,10020,0,{seq:1,x:1,y:0});assert.equal(motion.pilot.evade.remaining,remaining);
motion.accept({...p,crashes:1,respawnAt:12,z:0,x:0},room,10030,0);assert.equal(motion.display().z,0);assert.equal(motion.display().x,0);
const other=remotePose(p,.2,room);assert.ok(other.z>p.z);assert.equal(p.z,p.previousZ,'remote extrapolation never mutates server state');
// Receiving repeated stale snapshots must not keep flying an invented course.
{const stalled=new MultiplayerMotion(),base={...newPilot('stalled','owner',{},0),z:0};stalled.accept(base,room,0);let clock=0,held;for(let i=0;i<180;i++){const now=i*1000/60;if(i%6===0)stalled.accept(base,room,now,200);stalled.step({x:0,y:0},1/60,room,now);assert.ok(stalled.time>=clock-1e-8);clock=stalled.time;if(i===120)held=stalled.display().z;}assert.ok(stalled.time<=1.5);assert.equal(stalled.display().z,held,'prediction stops during a real outage despite stale replies');}
// Serialized mobile exchanges: 600ms gaps, asymmetric latency estimates, large
// authoritative advances, and steering reversals must not teleport the scenery.
{const m=new MultiplayerMotion(),pilot=newPilot('mobile','owner',{},0);m.accept(pilot,room,0);let previous=0,stops=0;
 for(let i=1;i<=600;i++){const now=i*1000/60,t=now/1000,input={x:i%120<60?.6:-.6,y:0};movePilot(pilot,input,1/60,t,room);
  if(i%36===0){const before=m.display().z;m.accept(pilot,{...room,time:t,simAt:now,serverNow:now},now,i%72===0?600:90);assert.equal(m.display().z,before,'packet receipt preserves forward pose');}
  m.step(input,1/60,room,now);const z=m.display().z,delta=z-previous;if(i>60&&delta<.001)stops++;assert.ok(delta>=-1e-8&&delta<2,'frame travel stays bounded through 600ms update gaps');previous=z;
 }
 assert.equal(stops,0);assert.ok(Number.isFinite(m.display().x));}
// A normal one-second delivery gap can now catch up in one bounded update.
const r=newRoom('ABCDEF','owner','one',{world:'easy',mode:'collector'},0);r.players.push(newPilot('two','second',{},0));r.phase='playing';r.startAt=0;r.simAt=0;
advance(r,1000,{engine:{nearby:()=>({rings:[],obstacles:[]}),collision:()=>null}});assert.ok(r.time>=.98);assert.ok(r.players.every(p=>p.z>0));
console.log(JSON.stringify({pass:true,jitterDelaysMs:[90,240,130,400],oldForwardRewinds:oldBacksteps,newForwardRewinds:newBacksteps,boundedHistory:true,unacknowledgedEvade:true,respawnSnaps:true,oneSecondCatchup:r.time,rendered:false}));
