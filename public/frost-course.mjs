import {progression} from './progression.mjs?v=49';
import {emberTime as flightTime,emberDistance as flightDistance} from './ember-course.mjs?v=39';
export {flightTime,flightDistance};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function frostState(a,time){
 const age=time-a.birthAt;
 if(a.category!=='aurora')return {age,visible:age>=0&&age<a.life,active:age>=0&&age<a.life,warning:age>=-1.2&&age<0,envelope:1};
 const phase=age/a.life,envelope=smooth(0,.18,phase)*(1-smooth(.78,1,phase));
 return {age,phase,envelope,visible:envelope>.005,active:envelope>.6,warning:age>=-1.2&&age<0};
}
export function frostPosition(a,time){
 const state=frostState(a,time),t=time-a.encounterAt;
 if(a.category==='vortex')return {...state,x:a.x+a.vx*t+(Math.sin(t*.85+a.phase)-Math.sin(a.phase))*3,y:a.y+Math.sin(t*.65)*4,z:-a.z};
 if(a.category==='aurora')return {...state,x:a.x,y:a.y,z:-a.z};
 const age=time-a.birthAt;
 return {...state,x:a.origin.x+a.vx*age,y:a.origin.y+a.vy*age-.5*a.gravity*age*age,z:-a.z+a.vz*(time-a.encounterAt),vx:a.vx,vy:a.vy-a.gravity*age,vz:a.vz};
}
// Centerline of a closed, thin curtain band. Its opening has no other collider.
export function auroraPoint(a,u,time){
 const state=frostState(a,time),wave=Math.sin(u*9+time*a.motion+a.phase),e=state.envelope;
 let x,y;
 if(a.pattern==='arch'){x=(u-.5)*84;y=-39+Math.sin(Math.PI*u)*(72*e)+wave*2*e;}
 else if(a.pattern==='high'){x=(u-.5)*92;y=22+(1-e)*25+wave*4+Math.sin(u*3+time*.5)*2;}
 else if(a.pattern==='low'){x=(u-.5)*90;y=-23-(1-e)*25+wave*4;}
 else {const side=a.pattern==='left'?-1:1;x=side*(29+(1-e)*27)+Math.sin(u*7+time*a.motion)*4;y=(u-.5)*92;}
 // Broad folds travel slowly, while fine pleats lag differently along the band.
 const fold=Math.sin(u*11-time*a.motion*.54+a.phase)*1.25+Math.sin(u*29-time*a.motion*.86+a.phase)*.40;
 return {x,y,z:fold,width:(a.pattern==='arch'?4.2:5.2)*(.82+.18*Math.sin(u*14-time*2)),depth:.22};
}
export function vortexSection(a,u,time){const p=a.phase,spin=time*(1.2+.12*Math.sin(p)),offset=a.y+Math.sin((time-a.encounterAt)*.65)*4;
 const neck=.37+.56*u-.12*Math.exp(-Math.pow((u-.30)/.15,2)),swelling=1+.11*Math.sin(u*19-spin*3+p)+.07*Math.cos(u*31+spin*2);
 return {x:Math.sin(u*5+spin+p)*(1+u*2.2)+Math.sin(u*11-spin*.6+p)*u*.55,y:-44-offset+u*(80+offset),z:Math.cos(u*4+spin*.8+p)*1.6,radius:a.radius*neck*swelling};}

export function planFrost({index,z0,count,rand,mode,seconds,safeRoute,rings,seed,warningDistance}){
 const result=[],motion=(mode==='hard'?1.55:mode==='medium'?1.25:1)*progression(seconds).objectSpeed;let vortices=0;
 for(let i=0;i<count;i++){
  const category=i===3?'aurora':i===2?'vortex':i<2?'shard':vortices<(mode==='hard'?3:2)&&rand()<.12?'vortex':'shard',z=z0+(i===3?130:25+rand()*145),at=flightTime(z,mode),route=safeRoute(z,seed,mode),sign=rand()>.5?1:-1;if(category==='vortex')vortices++;
  const a={category,z,encounterAt:at,x:(rand()-.5)*54,y:(rand()-.5)*36,phase:rand()*6.28,motion,kind:Math.floor(rand()*4),spin:(rand()-.5)*2.2,amp:0,reveal:warningDistance(seconds,mode,12)+110};
  if(category==='shard'){
   a.radius=1.6+rand()*2.4;a.maxR=a.radius;a.depth=a.maxR;a.gravity=(30+rand()*9)*motion*motion;a.vx=(rand()-.5)*22*motion;a.vy=-(30+rand()*15)*motion;a.vz=(rand()-.5)*7;
   const y=110+rand()*45,age=(a.vy+Math.sqrt(a.vy*a.vy+2*a.gravity*(y-a.y)))/a.gravity;
   a.origin={x:a.x-a.vx*age,y};a.birthAt=at-age;a.life=(a.vy+Math.sqrt(a.vy*a.vy+2*a.gravity*(y+65)))/a.gravity;
  }else if(category==='vortex'){
   a.radius=4.2+rand()*3;a.maxR=48;a.depth=13;a.y=-3+rand()*8;a.x=route.x+sign*(a.radius+17+rand()*5);a.vx=sign*(6+rand()*5)*motion*(index%2?-1:1);a.birthAt=at-4/motion;a.life=7.5/motion;
  }else{
   a.radius=a.maxR=100;a.depth=6;a.pattern=['arch','high','left','low','right'][index%5];a.x=route.x;a.y=route.y;a.birthAt=at-2.7/motion;a.life=6.5/motion;
  }
  // Reserve the reachable fuel path over the moving encounter, not just a snapshot.
  const checkPoints=[];for(let dt=-.24;dt<=.24;dt+=.04){const clock=at+dt,p=safeRoute(flightDistance(clock,mode),seed,mode);checkPoints.push({...p,clock,margin:5.5});}
  for(const r of rings)if(Math.abs(r.z-z)<(a.depth||5)+8)checkPoints.push({...r,clock:flightTime(r.z,mode),margin:r.r+5.1});
  if(category==='aurora'){
   for(let pass=0;pass<24;pass++){let blocked=false;for(const p of checkPoints)if(frostState(a,p.clock).active)for(let u=0;u<=1;u+=.02){const c=auroraPoint(a,u,p.clock);if(Math.hypot(a.x+c.x-p.x,a.y+c.y-p.y)<c.width+p.margin)blocked=true;}if(!blocked)break;if(a.pattern==='high')a.y+=3;else if(a.pattern==='low')a.y-=3;else a.x+=(a.pattern==='left'?-1:1)*3;}
  }else{
   for(let pass=0;pass<16;pass++)for(const p of checkPoints){const v=frostPosition(a,p.clock);if(!v.active)continue;const dy=category==='vortex'?0:v.y-p.y,clear=(category==='vortex'?a.radius+4:a.radius)+p.margin;if(Math.hypot(v.x-p.x,dy)<clear){const shift=sign*Math.max(.2,Math.sqrt(Math.max(0,clear*clear-dy*dy))-sign*(v.x-p.x)+.2);a.x+=shift;if(category==='shard')a.origin.x+=shift;}}
  }
  result.push(a);
 }
 return result;
}
