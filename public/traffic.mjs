import {progression} from './progression.mjs?v=49';
// Planned, distance-driven traffic motion. Each path is visible for several
// seconds before contact and continues smoothly through the player's plane.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function trafficPosition(a,distance){const reveal=a.reveal||700,exit=a.exit||180,u=clamp((reveal-(a.z-distance))/(reveal+exit),0,1),contact=reveal/(reveal+exit),smooth=t=>t*t*(3-2*t),s=smooth(u)-smooth(contact),phase=a.phase||0;return {x:a.x+(a.dx||0)*s+(a.wx||0)*(Math.sin(u*Math.PI*2+phase)-Math.sin(contact*Math.PI*2+phase)),y:a.y+(a.dy||0)*s+(a.wy||0)*(Math.sin(u*Math.PI*2+phase*.73)-Math.sin(contact*Math.PI*2+phase*.73)),progress:u};}
export function planTraffic({index,z0,count,rand,seconds,safeRoute,rings,seed,warningDistance}){
 const result=[],reservations=[],ringsHere=rings,cellCount=280;
 // Reserve adjacent-sector boundaries as calm handoff windows for giant haulers.
 // Most craft are tiny/small; the first valid heavy candidate gets priority.
 for(let attempt=0;attempt<1800&&result.length<count;attempt++){
  const pick=rand(),giant=(attempt<3&&index%2===1)||pick>.965,radius=giant?15+rand()*10:pick>.78?6+rand()*6:pick>.34?2.1+rand()*3.2:.65+rand()*1.05,kind=radius>6?2:radius>2?1:0;
  const cell=Math.floor(rand()*cellCount),row=Math.floor(cell/28),lane=cell%28,z=z0+clamp(12+row*18,radius*1.55+9,190-radius*1.55-9),x=(lane%7-3)*9.4,y=(Math.floor(lane/7)-1.5)*13;
  const a={x:giant?(rand()>.5?1:-1)*(24+radius*.22):x,y:giant?(rand()-.5)*8:y,z,radius,kind,maxR:radius*1.65,amp:0,spin:0,phase:rand()*6.283185,lane:cell,merge:0,reveal:warningDistance(seconds,'hard',radius)+100,exit:180+radius*1.6};
  const mobility=(radius>12?.22:radius>6?.5:1)*progression(seconds).objectSpeed;
  a.dx=(a.x>10?1:a.x< -10?-1:rand()>.5?1:-1)*(12+rand()*13)*mobility;
  a.dy=(a.y>5?1:a.y< -5?-1:rand()>.5?1:-1)*(7+rand()*12)*mobility;
  a.wx=(2+rand()*5)*mobility;a.wy=(1.5+rand()*4)*mobility;
  const rx=radius*1.20+1,ry=radius*1.08+.7,rz=radius*1.55+2,states=[];let valid=true,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  const start=Math.floor((z-a.reveal)/48),end=Math.ceil((z+a.exit)/48);
  for(let n=start;n<=end;n++){const p=trafficPosition(a,n*48);if(Math.abs(p.x)+radius*.72>47||Math.abs(p.y)+radius*.64>35){valid=false;break;}states.push(p);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  if(!valid)continue;
  // Protect the fuel route across the entire longitudinal extent of this craft,
  // including wingtip clearance and motion between the sampled distances.
  for(let d=z-rz-7;d<=z+rz+7&&valid;d+=7){const p=trafficPosition(a,d),route=safeRoute(d,seed,'hard');if(Math.abs(p.x-route.x)<rx+4.2&&Math.abs(p.y-route.y)<ry+2.3)valid=false;}
  if(!valid)continue;
  for(const r of ringsHere){if(Math.abs(r.z-z)>rz+8)continue;const p=trafficPosition(a,r.z);if(Math.abs(p.x-r.x)<rx+r.r+3.6&&Math.abs(p.y-r.y)<ry+r.r+3.6){valid=false;break;}}
  if(!valid)continue;
  for(const b of reservations){if(Math.abs(z-b.z)>rz+b.rz+3||minX-rx>b.maxX+b.rx||maxX+rx<b.minX-b.rx||minY-ry>b.maxY+b.ry||maxY+ry<b.minY-b.ry)continue;const first=Math.max(start,b.start),last=Math.min(end,b.end);for(let n=first;n<=last;n++){const p=states[n-start],q=b.states[n-b.start];const ex=rx+b.rx+1.5,ey=ry+b.ry+1.5,dx=p.x-q.x,dy=p.y-q.y;if(Math.abs(dx)<ex&&Math.abs(dy)<ey){valid=false;break;}if(n>first){const pp=states[n-1-start],qq=b.states[n-1-b.start],sx=pp.x-qq.x,sy=pp.y-qq.y;let lo=0,hi=1;for(const [v,delta,extent]of [[sx,dx-sx,ex],[sy,dy-sy,ey]]){if(Math.abs(delta)<1e-8){if(Math.abs(v)>=extent){hi=-1;break;}}else{const t0=(-extent-v)/delta,t1=(extent-v)/delta;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}}if(lo<=hi){valid=false;break;}}}if(!valid)break;}
  if(!valid)continue;
  result.push(a);reservations.push({z,rx,ry,rz,start,end,states,minX,maxX,minY,maxY});
 }
 return result;
}
