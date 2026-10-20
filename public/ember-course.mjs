// Flight clocks are independent of visibility and distance-to-player.
import {flightDistance as emberDistance,flightTime as emberTime,progression} from './progression.mjs?v=49';
export {emberDistance,emberTime};
export function emberPosition(a,time){
 if(a.motionType==='drift')return {x:a.x+Math.sin(time*.35+a.phase)*a.amp*.6,y:a.y+Math.cos(time*.28+a.phase)*a.amp*.5,z:-a.z,active:true,vx:0,vy:0,vz:0};
 const t=time-a.birthAt,o=a.origin,v=a.velocity;
 return {x:o.x+v.x*t,y:o.y+v.y*t-.5*a.gravity*t*t,z:o.z+v.z*t,vx:v.x,vy:v.y-a.gravity*t,vz:v.z,active:t>=0&&t<a.life};
}
export function splashState(a,time){const s=a.splash,t=time-s.birthAt;return {age:t,warning:t>=-1.05&&t<0,active:t>=0&&t<s.flight+s.emission,start:Math.max(0,t-s.emission),end:Math.min(s.flight,Math.max(0,t))};}
// Each point is a parcel of liquid; cessation of emission makes the stream collapse.
export function splashPoint(a,parcel,clock){const s=a.splash,u=parcel/s.flight,edge=Math.sin(u*Math.PI);return {x:s.startX+s.vx*parcel+Math.sin(parcel*5-clock*3+a.phase)*.65*edge,y:-43+s.vy*parcel-.5*s.gravity*parcel*parcel,z:Math.sin(u*Math.PI*2+a.phase)*1.25*edge,width:s.width*(.62+.38*edge)*(1+.16*Math.sin(parcel*12-clock*5)),depth:s.width*.55};}
export function planEmber({index,z0,count,rand,seconds,mode,safeRoute,rings,seed,warningDistance}){
 const result=[],intensity=(mode==='hard'?1.3:mode==='medium'?1.15:1)*progression(seconds).objectSpeed;
 for(let i=0;i<count;i++){
  const category=i===3?'eruption':i<2?'small':i===2?'island':rand()<.72?'small':'island',z=z0+(i===3?125:25+rand()*145),at=emberTime(z,mode),route=safeRoute(z,seed,mode),phase=rand()*6.28;
  const a={x:(rand()-.5)*53,y:(rand()-.5)*35,z,category,phase,kind:Math.floor(rand()*3),amp:1.3,spin:.3+rand()*.5,rate:.2,reveal:warningDistance(seconds,mode,10)+100,encounterAt:at};
  if(category==='eruption'){
   const type=['arch','vertical','left','right'][index%4],gravity=38*intensity,crest=type==='arch'?Math.max(30,route.y+23):26+rand()*22,vy=Math.sqrt(2*gravity*(crest+43)),flight=2*vy/gravity,span=type==='vertical'?8:70;
   a.x=type==='arch'?route.x:route.x+(rand()>.5?1:-1)*(25+rand()*9);a.y=0;a.radius=a.maxR=100;a.depth=8;a.motionType='splash';
   const sign=type==='right'?-1:1,emission=type==='arch'?flight+.45:.95+rand()*.55,contact=type==='arch'?flight+.15:flight*.56;
   a.splash={type,gravity,vy,flight,emission,width:type==='vertical'?5.5:3.4,startX:type==='vertical'?-4:-sign*span*.5,vx:sign*span/flight,birthAt:at-contact};
   const away=a.x>=route.x?1:-1;
   for(let pass=0;pass<24;pass++){
    let blocked=false;
    for(let dt=-.20;dt<=.20;dt+=.04){const clock=at+dt,state=splashState(a,clock),r=safeRoute(emberDistance(clock,mode),seed,mode);for(let parcel=state.start;parcel<=state.end;parcel+=.05){const p=splashPoint(a,parcel,clock);if(Math.hypot(a.x+p.x-r.x,p.y-r.y)<p.width+6)blocked=true;}}
    for(const r of rings)if(Math.abs(r.z-z)<16){const clock=emberTime(r.z,mode),state=splashState(a,clock);for(let parcel=state.start;parcel<=state.end;parcel+=.05){const p=splashPoint(a,parcel,clock);if(Math.hypot(a.x+p.x-r.x,p.y-r.y)<p.width+r.r+5.6)blocked=true;}}
    if(!blocked)break;a.x+=away*3;
   }
  }else if(category==='island'){
   a.radius=4.5+rand()*7.5;a.maxR=a.radius*1.02;a.motionType='drift';
  }else{
   a.radius=1+rand()*1.9;a.maxR=a.radius*1.02;a.motionType=i===0?'fall':i===1?'launch':rand()<.5?'fall':'launch';a.gravity=(32+rand()*10)*intensity*intensity;
   let age,originY,vy,vx;
   if(a.motionType==='fall'){originY=105+rand()*55;vy=-(25+rand()*22)*intensity;age=(vy+Math.sqrt(vy*vy+2*a.gravity*(originY-a.y)))/a.gravity;vx=(rand()-.5)*31*intensity;}
   else {originY=-43;vy=Math.sqrt(2*a.gravity*(88+rand()*34));age=(vy+Math.sqrt(vy*vy-2*a.gravity*(a.y-originY)))/a.gravity;vx=(a.x-(rand()>.5?1:-1)*(42+rand()*12))/age;}
   const vz=(rand()-.5)*8;a.birthAt=at-age;a.velocity={x:vx,y:vy,z:vz};a.origin={x:a.x-vx*age,y:originY,z:-z-vz*age};a.life=(vy+Math.sqrt(vy*vy+2*a.gravity*(originY+65)))/a.gravity;
  }
  // Reserve a clear gold route over each object's complete moving pass.
  if(category!=='eruption'){
   const points=[];
   for(let dt=-.55;dt<=.55;dt+=.055){const time=at+dt,p=emberPosition(a,time),distance=emberDistance(time,mode);if(p.active&&Math.abs(p.z+distance)<a.maxR+9){const r=safeRoute(distance,seed,mode);points.push({x:r.x-(p.x-a.x),y:r.y-(p.y-a.y),clear:a.maxR+6+(category==='island'?1.3:0)});}}
   for(const r of rings)if(Math.abs(r.z-z)<a.maxR+9){const p=emberPosition(a,emberTime(r.z,mode));points.push({x:r.x-(p.x-a.x),y:r.y-(p.y-a.y),clear:a.maxR+r.r+5.6});}
   const initialX=a.x,away=a.x>=route.x?1:-1;
   for(let pass=0;pass<24;pass++)for(const p of points){const dx=a.x-p.x,dy=a.y-p.y,l=Math.hypot(dx,dy);if(l<p.clear){if(category==='small')a.x=p.x+away*Math.sqrt(Math.max(0,(p.clear+.1)**2-dy*dy));else{a.x=p.x+(l>.001?dx/l:1)*(p.clear+.1);a.y=p.y+(l>.001?dy/l:0)*(p.clear+.1);}}}
   if(category==='small')a.origin.x+=a.x-initialX;
  }
  result.push(a);
 }return result;
}
