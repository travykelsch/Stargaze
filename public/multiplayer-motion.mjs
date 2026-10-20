import {movePilot,beginEvade,clamp} from './multiplayer-rules.mjs?v=52';

// Presentation prediction only. Pickups, crashes and results remain server-owned.
export class MultiplayerMotion {
 constructor(){this.reset();}
 reset(){this.pilot=null;this.history=[];this.offset={x:0,y:0,z:0};this.at=0;this.time=0;this.tick=-1;this.baseTime=0;this.displayedZ=null;this.targetTime=0;}
 sample(input,now){this.history.push({at:now,input:{...input}});while(this.history.length>240||this.history[0]?.at<now-3000)this.history.shift();}
 accept(p,room,now,rtt=0,evade=null){
  const old=this.display(),previous=this.pilot;
  const continuous=previous&&previous.id===p.id&&previous.crashes===p.crashes&&previous.alive===p.alive&&previous.respawnAt===p.respawnAt&&previous.finishAt===p.finishAt;
  // A repeated database snapshot is not a new movement anchor. Replaying it
  // repeatedly produced a stop/jump cycle even while the socket stayed open.
  if(continuous&&room.phase==='playing'&&room.simAt<=this.tick)return;
  this.pilot=structuredClone(p);this.at=now;this.tick=room.simAt;this.baseTime=room.time;
  this.targetTime=room.time+clamp((room.serverNow-room.simAt)/1000+rtt/2000,0,.75);
  if(!continuous||room.phase!=='playing')this.time=room.phase==='playing'?this.targetTime:room.time;
  const lead=room.phase==='playing'?clamp(this.time-room.time,0,1.5):0;
  if(p.alive&&!p.respawnAt&&p.finishAt===null){
   const start=now-lead*1000;let input=p.input||{x:0,y:0},cursor=start;
   for(const h of this.history){if(h.at<=start){input=h.input;continue;}if(h.at>now)break;this.integrate(input,(h.at-cursor)/1000,room.time+(cursor-start)/1000,room);cursor=h.at;input=h.input;}
   this.integrate(input,(now-cursor)/1000,room.time+(cursor-start)/1000,room);
   // Until acknowledged, retain the roll already performed locally. Replaying
   // beginEvade on every snapshot used to restart the same roll repeatedly.
   if(evade&&p.evadeSeq<evade.seq&&continuous){this.pilot.x=previous.x;this.pilot.y=previous.y;this.pilot.evade=previous.evade?{...previous.evade}:null;}
  }
  // Preserve the presented pose at receipt. Corrections are paid over frames,
  // never by dropping a large part of the error at a packet boundary.
  this.offset=continuous&&old?{x:old.x-this.pilot.x,y:old.y-this.pilot.y,z:old.z-this.pilot.z}:{x:0,y:0,z:0};
  if(!continuous)this.displayedZ=null;
 }
 integrate(input,dt,time,room){for(let remaining=dt;remaining>1e-8;){const step=Math.min(.01,remaining);movePilot(this.pilot,input,step,time,room);time+=step;remaining-=step;}}
 step(input,dt,room,now){this.sample(input,now);if(!this.pilot)return;const elapsed=Math.max(0,(now-this.at)/1000),beforeZ=this.pilot.z;
  // A disconnected client cannot keep flying through an invented world.
  if(room.phase==='playing'&&this.pilot.alive&&!this.pilot.respawnAt&&this.pilot.finishAt===null&&elapsed<1.5){const clockError=this.targetTime+elapsed-this.time,rate=clamp(1+clockError*.3,.88,1.12),allowed=Math.max(0,Math.min(dt*rate,1.5-(this.time-this.baseTime)));this.integrate(input,allowed,this.time,room);this.time+=allowed;}
  const decay=Math.exp(-dt*9);for(const k of ['x','y'])this.offset[k]*=decay;
  // A positive forward correction must never pull scenery backward. Repay it
  // at less than the ship's forward travel, even after a jitter spike.
  const repayment=Math.max(0,this.pilot.z-beforeZ)*.2;this.offset.z+=clamp(-this.offset.z,-repayment,repayment);
 }
 display(){if(!this.pilot)return null;const z=this.pilot.z+this.offset.z;this.displayedZ=this.displayedZ===null?z:Math.max(z,this.displayedZ);return {...this.pilot,x:this.pilot.x+this.offset.x,y:this.pilot.y+this.offset.y,z:this.displayedZ};}
}

// Short extrapolation bridges snapshot gaps without freezing every remote actor.
export function remotePose(p,age,room){const q={...p,evade:p.evade?{...p.evade}:null};if(p.alive&&!p.respawnAt&&p.finishAt===null)movePilot(q,{x:0,y:0},Math.min(1.5,Math.max(0,age)),room.time,room);return q;}
