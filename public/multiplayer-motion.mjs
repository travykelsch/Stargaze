import {movePilot,beginEvade,clamp} from './multiplayer-rules.mjs?v=52';

// Presentation prediction only. Pickups, crashes and results remain server-owned.
export class MultiplayerMotion {
 constructor(){this.reset();}
 reset(){this.pilot=null;this.history=[];this.offset={x:0,y:0,z:0};this.at=0;this.time=0;this.tick=-1;this.baseTime=0;this.displayedZ=null;}
 sample(input,now){this.history.push({at:now,input:{...input}});while(this.history.length>240||this.history[0]?.at<now-3000)this.history.shift();}
 accept(p,room,now,rtt=0,evade=null){
  const old=this.display(),previous=this.pilot;
  const continuous=previous&&previous.id===p.id&&previous.crashes===p.crashes&&previous.alive===p.alive&&previous.respawnAt===p.respawnAt&&previous.finishAt===p.finishAt;
  this.pilot=structuredClone(p);if(room.simAt>this.tick||room.phase!=='playing'){this.at=now;this.tick=room.simAt;}this.baseTime=room.time;
  const lead=room.phase==='playing'?Math.min(.35,Math.max(clamp((room.serverNow-room.simAt)/1000+rtt/2000,0,.25),continuous?this.time-room.time:0)):0;
  this.time=room.time+lead;
  if(p.alive&&!p.respawnAt&&p.finishAt===null){
   const start=now-lead*1000;let input=p.input||{x:0,y:0},cursor=start;
   for(const h of this.history){if(h.at<=start){input=h.input;continue;}if(h.at>now)break;this.integrate(input,(h.at-cursor)/1000,room.time+(cursor-start)/1000,room);cursor=h.at;input=h.input;}
   this.integrate(input,(now-cursor)/1000,room.time+(cursor-start)/1000,room);
   // Until acknowledged, retain the roll already performed locally. Replaying
   // beginEvade on every snapshot used to restart the same roll repeatedly.
   if(evade&&p.evadeSeq<evade.seq&&continuous){this.pilot.x=previous.x;this.pilot.y=previous.y;this.pilot.evade=previous.evade?{...previous.evade}:null;}
  }
  this.offset=continuous&&old?{x:clamp(old.x-this.pilot.x,-3,3),y:clamp(old.y-this.pilot.y,-3,3),z:clamp(old.z-this.pilot.z,-15,15)}:{x:0,y:0,z:0};
  if(!continuous)this.displayedZ=null;
 }
 integrate(input,dt,time,room){for(let remaining=dt;remaining>1e-8;){const step=Math.min(.01,remaining);movePilot(this.pilot,input,step,time,room);time+=step;remaining-=step;}}
 step(input,dt,room,now){this.sample(input,now);if(!this.pilot)return;const elapsed=Math.max(0,(now-this.at)/1000),beforeZ=this.pilot.z;
  // A disconnected client cannot keep flying through an invented world.
  if(room.phase==='playing'&&this.pilot.alive&&!this.pilot.respawnAt&&this.pilot.finishAt===null&&elapsed<.5){const allowed=Math.max(0,Math.min(dt,.35-(this.time-this.baseTime)));this.integrate(input,allowed,this.time,room);this.time+=allowed;}
  const decay=Math.exp(-dt*9);for(const k of ['x','y'])this.offset[k]*=decay;
  // A positive forward correction must never pull scenery backward. Repay it
  // at less than the ship's forward travel, even after a jitter spike.
  this.offset.z=this.offset.z>0?Math.max(this.offset.z*decay,this.offset.z-Math.max(0,this.pilot.z-beforeZ)*.5):this.offset.z*decay;
 }
 display(){if(!this.pilot)return null;const z=this.pilot.z+this.offset.z;this.displayedZ=this.displayedZ===null?z:Math.max(z,this.displayedZ);return {...this.pilot,x:this.pilot.x+this.offset.x,y:this.pilot.y+this.offset.y,z:this.displayedZ};}
}

// Short extrapolation bridges snapshot gaps without freezing every remote actor.
export function remotePose(p,age,room){const q={...p,evade:p.evade?{...p.evade}:null};if(p.alive&&!p.respawnAt&&p.finishAt===null)movePilot(q,{x:0,y:0},Math.min(.65,Math.max(0,age)),room.time,room);return q;}
