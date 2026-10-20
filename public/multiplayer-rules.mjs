import {difficulty,LIMITS} from './mechanics.mjs';
import {flightDistance,ringOffset} from './progression.mjs';
export const MP_RULES=Object.freeze({version:2,capacity:4,countdown:5,collectorSeconds:120,raceSeconds:120,raceLimit:240,finishTimeout:30,respawnSeconds:2,respawnGrace:1.25,checkpoint:950,disconnectSeconds:12,inputTimeout:1.25,boostSeconds:3,boostFactor:1.18,powerCooldown:8,shieldSeconds:6,tick:.02});
export const MP_MODES={race:'Race to the Finish',collector:'Timed Ring Collector',survival:'Last Pilot Standing'};
export const SCORE_VALUES=[1,3,5];
export function raceLength(difficultyId,world){return Math.ceil(flightDistance(MP_RULES.raceSeconds,difficultyId,world)/190)*190;}
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function ringPosition(r,time){const d=ringOffset(r,time);return {x:r.baseX+d.x,y:r.baseY+d.y,z:r.z};}
export function powerRings(index,seed,mode){if(mode!=='race'||index<2||index%3!==2)return [];const side=(index+seed)%2?1:-1;return [{id:'power:'+index,type:index%2?'shield':'boost',x:side*22,y:((seed+index)%3-1)*7,z:index*190+100,r:3.8}];}
// Pure prediction shares the authoritative movement integrator. Inputs have a
// magnitude limit; an evade is a bounded 15 m movement, never immunity.
export function movePilot(p,input,dt,time,room){const n=Math.hypot(input.x||0,input.y||0),scale=n>1.45?1.45/n:1;if(p.evade?.remaining>0){const d=Math.min(dt,p.evade.remaining);p.x+=p.evade.vx*d;p.y+=p.evade.vy*d;p.evade.remaining=Math.max(0,p.evade.remaining-d);}else{p.x+=(input.x||0)*scale*LIMITS.steerX*dt;p.y+=(input.y||0)*scale*LIMITS.steerY*dt;}p.x=clamp(p.x,-LIMITS.x,LIMITS.x);p.y=clamp(p.y,-LIMITS.y,LIMITS.y);p.z+=difficulty(time,room.difficulty,room.world).speed*dt*(p.boostUntil>time?MP_RULES.boostFactor:1);}
export function beginEvade(p,x,y){if(p.evade?.remaining>0)return false;const n=Math.hypot(x,y);if(n<.06)return false;const dx=clamp(p.x+x/n*15,-32,32)-p.x,dy=clamp(p.y+y/n*15,-23,23)-p.y;if(Math.hypot(dx,dy)<.1)return false;p.evade={remaining:.3,vx:dx/.3,vy:dy/.3};return true;}
