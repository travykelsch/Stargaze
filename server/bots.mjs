import {LIMITS,safeRoute,difficulty} from '../public/mechanics.mjs';
import {MP_RULES,ringPosition,clamp,beginEvade,movePilot} from '../public/multiplayer-rules.mjs';

export const BOT_SKILL=Object.freeze({
 easy:{reaction:.28,error:2.1,steering:.82,look:.22,evadeDelay:2.2,risk:.05},
 medium:{reaction:.14,error:.9,steering:1.1,look:.16,evadeDelay:1.3,risk:.3},
 hard:{reaction:.08,error:.25,steering:1.4,look:.10,evadeDelay:.7,risk:.65}
});

// Bots issue ordinary controls. Movement, fuel, pickup sweeps, terrain, NPC
// impacts, respawns and elimination all use the same authoritative pilot path.
export function steerBot(p,room,nearby,engine,time){
 const skill=BOT_SKILL[room.difficulty],brain=p.botBrain??={next:0,evadeAt:-10,phase:(room.seed%997)*.01+(p.botSlot||1)*2.399};
 p.seen=room.simAt;
 if(time<brain.next)return;
 brain.next=time+skill.reaction;
 const speed=difficulty(time,room.difficulty,room.world).speed*(p.boostUntil>time?MP_RULES.boostFactor:1);
 const route=safeRoute(p.z+speed*skill.look,room.seed,room.difficulty,room.world);
 let target={...route,z:p.z+speed*skill.look},best=-Infinity;
 for(const ring of nearby.rings){
  const eta=(ring.z-p.z)/speed;if(eta<-.015||eta>3.5||p.claims.includes(ring.id)||(ring.type===2&&time<90))continue;
  const q=ringPosition(ring,time+Math.max(0,eta));
  if(Math.abs(q.x-p.x)>LIMITS.steerX*skill.steering*Math.max(.12,eta)+ring.r||Math.abs(q.y-p.y)>LIMITS.steerY*skill.steering*Math.max(.12,eta)+ring.r)continue;
  const value=10-eta*2+(p.fuel<12?(ring.type===0?5:1):ring.type*skill.risk*3);
  if(value>best){best=value;target={...q,z:ring.z};}
 }
 const error=skill.error,eta=Math.max(.16,(target.z-p.z)/speed),dx=target.x+Math.sin(time*.71+brain.phase)*error-p.x,dy=target.y+Math.sin(time*.57+brain.phase*1.3)*error*.6-p.y;
 let input={x:clamp(dx/(LIMITS.steerX*eta),-skill.steering,skill.steering),y:clamp(dy/(LIMITS.steerY*eta),-skill.steering,skill.steering)};
 const magnitude=Math.hypot(input.x,input.y);if(magnitude>1.45){input.x*=1.45/magnitude;input.y*=1.45/magnitude;}
 // One bounded visible-hazard probe per decision; no per-frame path-search tree.
 // Only future collision geometry is sampled, never changed or removed.
 const probe={...p,evade:p.evade?{...p.evade}:null};movePilot(probe,input,.38,time,room);
 if(engine.collision(room,probe,time+.38,nearby.obstacles)){
  const gap=safeRoute(p.z+speed*.38,room.seed,room.difficulty,room.world),x=gap.x-p.x,y=gap.y-p.y;
  input={x:clamp(x/(LIMITS.steerX*.28),-skill.steering,skill.steering),y:clamp(y/(LIMITS.steerY*.28),-skill.steering,skill.steering)};
  const n=Math.hypot(input.x,input.y);if(n>1.45){input.x*=1.45/n;input.y*=1.45/n;}
  if(time-brain.evadeAt>=skill.evadeDelay&&Math.hypot(x,y)>7&&beginEvade(p,x,y))brain.evadeAt=time;
 }
 p.input=input;p.inputAt=room.simAt;
}
