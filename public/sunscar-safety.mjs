import {craftBounds} from './sunscar-vehicles.mjs?v=49';
import {flightSpeed,flightDistance,flightTime} from './progression.mjs?v=49';
import {shotPosition,sectionAt} from './sunscar-course.mjs?v=49';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const REAR_WARNING_SECONDS=3.2;
// This planner uses the same player collision envelope as game.js. Paths start
// at the actual position/velocity, include a current roll's committed remainder,
// then conservative ordinary steering (never assumes the faster touch gain).
export function playerPath(player,dx,dy,t){
 const e=player.evade||{},roll=e.active?Math.min(t,e.remaining):0,reaction=.38;
 let x=player.x+(roll?e.vx*roll:clamp(player.vx||0,-27,27)*Math.min(t,reaction)),y=player.y+(roll?e.vy*roll:clamp(player.vy||0,-24,24)*Math.min(t,reaction));
 const steer=Math.max(0,t-Math.max(reaction,roll));x+=dx*27*steer;y+=dy*24*steer;
 return {x:clamp(x,-32,32),y:clamp(y,-23,23)};
}
export function obstacleBlocks(p,forward,time,obstacles,padX=3,padY=1.5){
 for(const b of obstacles){
  if(b.category==='passage'&&Math.abs(forward-b.z)<b.depth+3&&(Math.abs(p.x-b.gapX)+padX>b.halfX||Math.abs(p.y-b.gapY)+padY>b.halfY))return true;
  if(b.category==='shot'){const q=shotPosition(b,time);if(q.active&&q.y>-30&&Math.abs(forward+q.z)<b.radius+3&&Math.abs(p.x-q.x)<b.radius+padX&&Math.abs(p.y-q.y)<b.radius+padY)return true;}
  else if(b.category==='pillar'&&Math.abs(forward-b.z)<b.radius+3&&Math.abs(p.x-b.x)<b.radius+padX&&Math.abs(p.y-b.y)<b.height*.5+padY)return true;
  else if(b.category==='gate'&&Math.abs(forward-b.z)<10){const x=Math.abs(p.x-b.x),y=p.y-b.y;if(x<33&&y<18&&((x>10.4-padX&&y>-49)||(y>6.5-padY)))return true;}
 }
 // The sculpted wall starts at x=42; the exact triangle test remains authoritative.
 return Math.abs(p.x)+padX>40||p.y-padY<-29||(sectionAt(forward).tunnel&&p.y+padY>35);
}
export class RearSafety{
 constructor(route){this.route=route;this.reset();}
 reset(){this.warnings=[];this.nextCheck=0;this.stats={checks:0,plans:0,delayed:0,minInitialLead:Infinity};}
 evaluate(field,obstacles,player){
  const {time,distance,mode,seed,racers}=field,speed=flightSpeed(time,mode,'sunscar');if(time<this.nextCheck)return;this.nextCheck=time+.10;this.warnings=[];
  const incoming=racers.filter(a=>a.state!=='crashing'&&distance-a.forward>8&&(a.ratio>1.10||a.targetRatio>1.2||(a.kind===1&&a.baseRatio>=1&&a.matchedUntil&&a.matchedUntil-time<4))).sort((a,b)=>(distance-a.forward)/(a.ratio-1)-(distance-b.forward)/(b.ratio-1));
  for(const [incomingIndex,a] of incoming.entries()){
   const bounds=craftBounds(a.style||0),gap=distance-a.forward-bounds.front-(player.halfZ||2.2),futureRatio=Math.max(a.ratio,a.targetRatio,a.kind===1&&a.baseRatio>=1&&a.matchedUntil&&a.matchedUntil-time<4?1.8:0),closing=Math.max(1,(futureRatio-1)*speed);let ttc=gap/closing;
   // Integrate bounded acceleration from current speed rather than assuming a
   // late surge instantly reaches its planned speed. Also anticipate scheduled
   // similar-speed rivals accelerating, before the surge begins.
   if(futureRatio>a.ratio){const accel=.45*speed,dv=(futureRatio-a.ratio)*speed,current=(a.ratio-1)*speed,reach=dv/accel,during=current*reach+.5*accel*reach*reach;ttc=gap<during?(-current+Math.sqrt(current*current+2*accel*gap))/accel:reach+(gap-during)/closing;}
   // Faster game speed during the warning is included in the encounter horizon.
   const camera=player.camera||{z:29,fov:66,aspect:.462},depth=camera.z-(distance-a.forward),halfView=Math.max(0,depth)*Math.tan(camera.fov*Math.PI/360),unseen=depth<bounds.rear||Math.abs(a.x-(camera.x??player.x))>halfView*camera.aspect+bounds.halfX||Math.abs(a.y-(camera.y??player.y+5))>halfView+bounds.halfY;const required=REAR_WARNING_SECONDS+(player.warningAllowance||0)+(unseen?.15:0)+Math.min(.8,Math.hypot(player.vx||0,player.vy||0)/38)+(player.evade?.active?player.evade.remaining:0);
   if(ttc>Math.max(6,required+1.6))continue;
   this.stats.checks++;const at=time+ttc,forward=flightDistance(at,mode,'sunscar')+(field.sharedCourse?distance-flightDistance(time,mode,'sunscar'):0),q=this.route(field.sharedCourse?flightTime(forward,mode,'sunscar'):at,seed),side=Math.abs(a.x-player.x)<5?'direct':a.x<player.x?'left':'right';
   if(!a.rearWarned){a.rearWarned=true;a.warnAt=time;this.stats.minInitialLead=Math.min(this.stats.minInitialLead,ttc);field.stats.rearWarnings++;field.emit('rear',a,{side,ttc});}
   if(incomingIndex>=3){a.safetyRatio=1.03;a.safetyHeld=true;this.stats.delayed++;this.warnings.push({id:a.id,side,ttc,required,urgent:false,held:true,x:a.x,y:a.y});continue;}
   if(!a.passLine){
    const options=[[-15,0],[15,0],[0,-12],[0,12],[-13,-8],[13,8],[-13,8],[13,-8],[-11,0],[11,0]].map(([x,y])=>({x,y}));
    let best=null,bestScore=-Infinity;
    for(const line of options){const p={x:q.x+line.x,y:q.y+line.y};if(Math.abs(p.x)>34||Math.abs(p.y)>24||obstacleBlocks(p,forward,at,obstacles,4.8,2.2))continue;
     let conflict=false;for(const b of racers){if(b===a||b.state==='crashing')continue;const bf=b.forward+b.ratio*(forward-distance);if(Math.abs(bf-forward)<22&&Math.hypot((b.passLine?q.x+b.passLine.x:b.x)-p.x,(b.passLine?q.y+b.passLine.y:b.y)-p.y)<10)conflict=true;}if(conflict)continue;
     const score=Math.hypot(p.x-player.x,p.y-player.y)*.8-Math.hypot(p.x-a.x,p.y-a.y)*.25;if(score>bestScore){best=line;bestScore=score;}}
    if(best){a.passLine=best;a.commitAt=time;this.stats.plans++;}
   }
   const line=a.passLine||{x:a.x-q.x,y:a.y-q.y},directions=[[0,0],[-1,0],[1,0],[0,-1],[0,1],[-.707,-.707],[.707,-.707],[-.707,.707],[.707,.707]];
   let escape=null;
   for(const [dx,dy]of directions){let clear=true;
    // Sample the whole manoeuvre, including hazards at times before the pass.
    for(let t=.12;t<=Math.min(ttc+.24,6);t+=.12){const p=playerPath(player,dx,dy,t),pf=flightDistance(time+t,mode,'sunscar')+(field.sharedCourse?distance-flightDistance(time,mode,'sunscar'):0);if(obstacleBlocks(p,pf,time+t,obstacles,player.halfX||2.6,player.halfY||.9)){clear=false;break;}
     for(const b of racers){if(b.state==='crashing'&&b.crashAge+t>1.1)continue;const bf=b.forward+b.ratio*(pf-distance);if(Math.abs(bf-pf)>10)continue;const ref=this.route(Math.max(0,(b.courseTime||0)+t*b.ratio),seed),bl=b===a?line:b.passLine;const bx=bl?ref.x+bl.x:b.x+(b.vx||0)*Math.min(t,.6),by=bl?ref.y+bl.y:b.y+(b.vy||0)*Math.min(t,.6);if(Math.abs(p.x-bx)<6.8&&Math.abs(p.y-by)<2.9){clear=false;break;}}
     if(!clear)break;
    }
    if(clear){escape={dx,dy};break;}
   }
   const detectedFor=time-a.warnAt,leadOK=detectedFor+ttc>=required;
   if(!escape||!a.passLine||!leadOK){
    // Hold an unsafe pass behind the field by changing thrust early. No position
    // changes and no collision exceptions: acceleration is bounded in RaceField.
    a.safetyRatio=Math.min(a.ratio,1.03);a.retryAt=time+.45;this.stats.delayed++;a.safetyHeld=true;
   }else if(!a.retryAt||time>a.retryAt){a.safetyRatio=null;a.safetyHeld=false;a.escape=escape;}
   const w={id:a.id,side,ttc,required,urgent:ttc<required&&!a.safetyHeld,unseen,held:a.safetyHeld,x:a.x,y:a.y};this.warnings.push(w);a.warning=w;
  }
  this.warnings.sort((a,b)=>a.ttc-b.ttc);
 }
}
