import {flightTime,flightDistance,flightSpeed} from './progression.mjs?v=49';
export const SUNSCAR={sectionLength:570,wall:42,floor:-30,roof:43,maxRacers:48,maxEffects:40,clearance:10.4};
export const SECTIONS=['Grave Run','Glassbone Reach','Shattered Crown','Furnace Cut','Sunbreak Basin','Red Market'];
export function desertRandom(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function sectionAt(distance){const n=Math.floor(Math.max(0,distance)/SUNSCAR.sectionLength);return {index:n,type:n%6,name:SECTIONS[n%6],tunnel:n%6===3,local:distance-n*SUNSCAR.sectionLength};}
export function tunnelBlend(distance){const s=sectionAt(distance);return s.tunnel?Math.min(1,Math.max(0,s.local/55),Math.max(0,(570-s.local)/55)):0;}
export function shotPosition(a,time){const t=time-a.birthAt;return {x:a.origin.x+a.velocity.x*t,y:a.origin.y+a.velocity.y*t-.5*a.gravity*t*t,z:a.origin.z+a.velocity.z*t,active:t>=0&&t<=a.life,age:t};}
export function catapultPhase(a,time){const age=time-a.birthAt;return {windup:age>=-2.2&&age<0,released:age>=0,recover:Math.max(0,Math.min(1,age/1.2)),arm:age<0?Math.max(0,Math.min(1,(age+2.2)/2.2)):Math.exp(-Math.max(0,age)*7)};}
// Shared by scenery and simulation: every launched stone has a visible battery.
export function batterySpecs(index){if(index<2||sectionAt(index*190+95).tunnel)return [];const side=index%2?1:-1;return [{side,slot:110,elevated:index%4===0},...(index%3!==0?[{side:-side,slot:160,elevated:index%4===1}]:[])];}
export function planSunscar({index,z0,seed,mode,safeRoute,rings,seconds}){
 const rand=desertRandom(seed+Math.imul(index+1,37199)),section=sectionAt(z0+95),out=[{category:'course',index,z:z0+95,x:0,y:0,radius:250,maxR:260,depth:95,amp:0,phase:0,kind:0,section:section.type,nearAwarded:true}];
 const count=section.type===1?3:section.type===2?1:section.type===3?1:2;
 for(let i=0;i<count;i++){
  const z=z0+35+i*58+rand()*12,p=safeRoute(z,seed,mode),arch=section.type===2&&i===0;
  if(arch){out.push({category:'gate',x:p.x,y:p.y,z,radius:29,maxR:54,depth:7,amp:0,kind:0,phase:rand()*6.28});continue;}
  const radius=2.7+rand()*3.5,height=section.type===1?25+rand()*30:9+rand()*18,a={category:'pillar',x:(rand()-.5)*64,y:-30+height/2,z,radius,maxR:Math.hypot(radius,height*.5),depth:radius*1.1,amp:0,kind:0,phase:rand()*6.28,height};
  // Full-length reservations protect the continuous route AND moving ring openings.
  const sign=a.x>=p.x?1:-1;
  for(let dz=-radius-8;dz<=radius+8;dz+=2){const q=safeRoute(z+dz,seed,mode);if(Math.abs(q.y-a.y)<height*.5+4)a.x=sign>0?Math.max(a.x,q.x+radius+6):Math.min(a.x,q.x-radius-6);}
  for(const r of rings)if(Math.abs(r.z-z)<radius+9&&Math.abs(r.y-a.y)<height*.5+r.r+3)a.x=sign>0?Math.max(a.x,r.x+radius+r.r+4):Math.min(a.x,r.x-radius-r.r-4);
  out.push(a);
 }
 for(const battery of batterySpecs(index)){
  const {side:sign,slot,elevated}=battery,z=z0+slot,at=flightTime(z,mode,'sunscar'),route=safeRoute(z,seed,mode),gravity=24,flight=3.8,origin={x:sign*55,y:elevated?0:-18,z:-z-45},target={x:route.x+sign*(12+rand()*5),y:route.y-4,z:-z};
  const a={category:'shot',battery:slot,index,x:target.x,y:target.y,z,radius:1.8,maxR:2,depth:2,amp:0,kind:0,phase:rand()*6.28,gravity,birthAt:at-flight,encounterAt:at,life:flight+2.6,origin,velocity:{x:(target.x-origin.x)/flight,y:(target.y-origin.y+.5*gravity*flight*flight)/flight,z:45/flight}};
  // Committed crossing trajectories reserve every part of the moving fuel line.
  // All battery shots share this corridor; RearSafety evaluates them together.
  for(let pass=0;pass<32;pass++){
   let blocked=false;
   for(let dt=-.3;dt<=.3;dt+=.025){const t=at+dt,p=shotPosition(a,t),q=safeRoute(flightDistance(t,mode,'sunscar'),seed,mode);if(Math.abs(p.z+flightDistance(t,mode,'sunscar'))<8&&Math.hypot(p.x-q.x,p.y-q.y)<9)blocked=true;}
   for(const r of rings){const t=flightTime(r.z,mode,'sunscar'),p=shotPosition(a,t);if(p.active&&Math.abs(p.z+r.z)<7&&Math.hypot(p.x-r.x,p.y-r.y)<r.r+5.5)blocked=true;}
   if(!blocked)break;a.x+=sign*2.5;a.velocity.x=(a.x-origin.x)/flight;
  }
  out.push(a);
 }
 return out;
}
