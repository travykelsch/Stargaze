import {desertRandom,SUNSCAR,shotPosition} from './sunscar-course.mjs?v=49';
import {flightSpeed,flightDistance,flightTime,progression} from './progression.mjs?v=49';
import {craftContact} from './sunscar-vehicles.mjs?v=49';
import {rivalProfile,rivalIntent} from './sunscar-rivals.mjs?v=49';
import {RearSafety} from './sunscar-safety.mjs?v=49';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export class RaceField{
 constructor(route){this.route=route;this.safety=new RearSafety(route);this.reset();}
 reset(seed=1,mode='easy',time=0,distance=0){this.seed=seed;this.mode=mode;this.random=desertRandom(seed^0x45fea);this.racers=[];this.events=[];this.spawnClock=0;this.serial=0;this.time=time;this.distance=distance;this.stats={spawned:0,bumps:0,crashes:0,terrainCrashes:0,passes:0,rearWarnings:0,stalls:0,recoveries:0,nearSamples:0,nearTotal:0,duels:0,wreckReactions:0};this.lastContact=new Map();this.routeCache=new Map();this.safety.reset();}
 emit(type,r,extra={}){this.events.push({type,id:r.id,x:r.x,y:r.y,forward:r.forward,time:this.time,...extra});if(this.events.length>64)this.events.shift();}
 spawn(initial=false){const r=this.random,serial=this.serial++,kind=serial%9===7?3:serial%3,style=Math.floor(r()*8),sign=r()>.5?1:-1,speed=flightSpeed(this.time,this.mode,'sunscar');
  const ratio=kind===0?.38+r()*.28:kind===1?.96+r()*.08:kind===3?.025+r()*.04:1.65+r()*.65;
  const relative=kind===2?Math.max(290,(ratio-1)*speed*6.5+90):initial?-(48+(serial%8)*32):kind===0?-Math.max(210+r()*160,(1-ratio)*speed*3.6+80):kind===3?-(speed*4.3+130):-(110+r()*280),forward=this.distance-relative;
  const a={id:this.serial,kind,style,ratio,baseRatio:ratio,targetRatio:ratio,forward,angle:(serial%8)/8*Math.PI*2+r()*.16,omega:(.18+r()*.22)*sign,radius:13+r()*4,reckless:r()<.09,phase:r()*6.28,health:rivalProfile(style).health,born:this.time,age:0,x:0,y:0,bank:0,nudge:0,nudgeV:0,crashAge:0,state:kind===3?'stalled':'racing',lastRelative:relative,matchedUntil:0,rearWarned:false,passed:false,courseTime:flightTime(Math.max(0,forward),this.mode,'sunscar')};
  if(kind===3){this.stats.stalls++;a.health=1;a.recoverAt=this.time+relative/-speed-.6+r()*1.2;}
  a.clan=rivalProfile(style).name;a.role=rivalProfile(style).role;a.callSign=rivalProfile(style).pilot+'-'+(1+Math.floor(serial/8));a.duelAt=0;this.pose(a,0);this.racers.push(a);this.stats.spawned++;return a;
 }
 coursePoint(z){let p=this.routeCache.get(z);if(!p){p=this.route(flightTime(z,this.mode,'sunscar'),this.seed);this.routeCache.set(z,p);if(this.routeCache.size>192)this.routeCache.delete(this.routeCache.keys().next().value);}return p;}
 reference(a){if(a.forward<=0)return this.route(0,this.seed);let t=a.courseTime||0;for(let i=0;i<2;i++)t=Math.max(0,t+(a.forward-flightDistance(t,this.mode,'sunscar'))/flightSpeed(t,this.mode,'sunscar'));a.courseTime=t;return this.route(t,this.seed);}
 pose(a,dt){const ref=this.reference(a),crash=a.state==='crashing'?a.crashAge:0,angle=a.angle+a.nudge,rad=(a.apertureRadius??a.radius)+crash*13;
  if(a.passLine&&dt){const target=Math.atan2(a.passLine.y/.70,a.passLine.x);a.angle+=clamp(delta(target,a.angle),-.85*dt,.85*dt);}
  const desiredRadius=a.passLine?Math.hypot(a.passLine.x,a.passLine.y/.70):rad;a.drawRadius=a.drawRadius??a.radius;if(dt)a.drawRadius+=clamp(desiredRadius-a.drawRadius,-4*dt,4*dt);const theta=a.angle+a.nudge,targetRadius=a.drawRadius;
  const x0=ref.x+Math.cos(theta)*targetRadius,y0=ref.y+Math.sin(theta)*targetRadius*.70;
  let x=clamp(x0,-37-crash*15,37+crash*15),y=clamp(y0,-25-crash*8,25+crash*8);
  let ox=x-ref.x,oy=y-ref.y,length=Math.hypot(ox,oy),min=SUNSCAR.clearance+crash*6;
  if(length<min){if(length<.01){ox=1;oy=0;length=1;}x=ref.x+ox/length*min;y=ref.y+oy/length*min;}
  a.vx=dt?(x-a.x)/dt:0;a.vy=dt?(y-a.y)/dt:0;a.x=x;a.y=y;a.bank=clamp(-a.vx*.025,-.42,.42);a.ref=ref;
 }
 damage(a){if(a.state==='crashing')return;if(a.health<=1&&a.state==='racing'){a.state='damaged';a.targetRatio=.30;this.emit('damage',a);}}
 crash(a,terrain=false){if(a.state==='crashing')return;a.state='crashing';a.crashAge=0;a.ratio*=.65;a.passLine=null;this.stats.crashes++;if(terrain)this.stats.terrainCrashes++;this.emit('crash',a,{terrain});}
 step(dt,time,distance,obstacles=[],player=null){if(dt<=0)return;this.time=time;this.distance=distance;const speed=flightSpeed(time,this.mode,'sunscar'),cap=this.mode==='hard'?48:this.mode==='medium'?44:40;
  if(!this.racers.length&&this.serial===0)for(let i=0;i<24;i++)this.spawn(true);
  // A sustained field with authored intensity waves; density remains bounded.
  const intensity=.5+.5*Math.sin(time*.39);this.spawnClock-=dt;if(this.spawnClock<=0){this.spawnClock=(.30+(1-intensity)*.18)/(1+.12*progression(time).objectSpeed);if(this.racers.length<cap)this.spawn();}
  if(!player){const p=this.route(time,this.seed);player={...p,vx:0,vy:0,halfX:2.6,halfY:.9};}
  this.safety.evaluate(this,obstacles,player);
  let nearCount=0;
  for(const a of this.racers){a.age+=dt;const relative=distance-a.forward,nearPlayer=Math.abs(relative)<280;nearCount+=nearPlayer;
   if(a.state==='stalled'&&time>a.recoverAt){a.state='recovering';a.targetRatio=.68;this.stats.recoveries++;this.emit('recover',a);}
   if(a.state==='recovering'&&a.ratio>.62){a.state='damaged';a.targetRatio=.72;}
   if(a.state==='damaged'&&a.age>22)a.targetRatio=.58;
   if(a.kind===1&&a.state==='racing'){
    if(relative>-240&&!a.matchedUntil){a.matchedUntil=time+11+this.random()*9;a.targetRatio=a.baseRatio;this.emit('match',a);}
    if(!a.matchedUntil)a.targetRatio=.65;
    if(a.matchedUntil&&time>a.matchedUntil)a.targetRatio=a.baseRatio<1?.54:1.8;
   }
   if(a.age>40&&a.state==='racing')a.targetRatio=relative<0?1.85:.42;
   // Nearest-neighbour pressure uses no per-racer filter/sort allocations.
   let rival=null,nearest=Infinity;for(const b of this.racers){if(b===a||b.state==='crashing'||Math.abs(b.forward-a.forward)>38)continue;const d=(b.x-a.x)**2+(b.y-a.y)**2;if(d<nearest){nearest=d;rival=b;}}
   if(a.rivalId){const prior=this.racers.find(b=>b.id===a.rivalId&&b.state!=='crashing'&&Math.abs(b.forward-a.forward)<55);if(prior){rival=prior;nearest=(prior.x-a.x)**2+(prior.y-a.y)**2;}}a.rivalId=rival?.id||null;a.intent=rivalIntent(a,rival,time);
   let pressure=0;if(rival&&nearest<250&&a.state==='racing'&&!a.passLine){const otherAngle=Math.atan2((rival.y-a.ref.y)/.7,rival.x-a.ref.x);pressure=clamp(delta(otherAngle,a.angle),-.8,.8)*(nearPlayer?1.15:.3);pressure*=rivalProfile(a.style).pressure;if(a.role==='attacker')pressure+=Math.sin(time*2.7+a.phase)*.25;if(a.role==='survivor'||rival.state==='stalled'||rival.state==='crashing')pressure*=-1.3;if(nearPlayer&&time>a.duelAt){a.duelAt=time+4.5;this.stats.duels++;this.emit('duel',a,{other:rival.id,intent:a.intent,clan:a.clan});}}
   a.apertureRadius=null;let avoid=0;for(const wreck of this.racers){if(wreck.state!=='crashing'||wreck.crashAge>1.1||wreck===a||wreck.forward<a.forward||wreck.forward-a.forward>speed*a.ratio*1.6)continue;if(Math.hypot(a.x-wreck.x,a.y-wreck.y)>18)continue;const wa=Math.atan2((wreck.y-a.ref.y)/.7,wreck.x-a.ref.x);avoid-=Math.sign(delta(wa,a.angle)||1)*1.1;if(!(a.escapeUntil>time))this.stats.wreckReactions++;a.escapeUntil=time+.6;}
   if(!a.passLine&&a.state!=='crashing')for(const b of obstacles){const ahead=b.z-a.forward;if(b.category==='passage'&&ahead>-12&&ahead<speed*a.ratio*3.8){a.apertureRadius=11;const target=Math.cos(a.angle)>=0?0:Math.PI;avoid+=clamp(delta(target,a.angle)*3,-2,2);continue;}if(ahead<0||ahead>speed*a.ratio*3.2||!['pillar','gate'].includes(b.category))continue;
    const q=this.coursePoint(b.z),px=q.x+Math.cos(a.angle)*a.radius,py=q.y+Math.sin(a.angle)*a.radius*.70;let target=null;
    if(b.category==='pillar'&&Math.abs(px-b.x)<b.radius+7&&Math.abs(py-b.y)<b.height*.5+4)target=b.x>q.x?Math.PI:0;
    if(b.category==='gate'&&(Math.abs(px-b.x)>7||py>b.y+2))target=-Math.PI/2;
    if(target!==null)avoid+=clamp(delta(target,a.angle)*2,-1.6,1.6)*(a.reckless&&nearPlayer?.25:1);
   }
   a.angle+=(a.omega*(a.passLine||a.state==='stalled'?.08:1)+pressure+avoid)*dt;a.nudgeV+=(-a.nudge*5-a.nudgeV*3)*dt;a.nudge+=a.nudgeV*dt;
   const target=a.safetyRatio??(a.escapeUntil>time?Math.min(a.targetRatio,.86):a.targetRatio);a.ratio+=clamp(target-a.ratio,-dt*.85,dt*.45);a.forward+=Math.max(.02,a.ratio)*speed*dt;if(a.state==='crashing')a.crashAge+=dt;this.pose(a,dt);
   const now=distance-a.forward;
   if(!a.passed&&Math.sign(a.lastRelative)!==Math.sign(now)){a.passed=true;this.stats.passes++;this.emit('pass',a,{fast:a.ratio>1});}a.lastRelative=now;
   if(a.state!=='crashing')for(const b of obstacles){const dz=a.forward-b.z;if(b.category==='passage'&&Math.abs(dz)<b.depth+6.6&&(Math.abs(a.x-b.gapX)+4>b.halfX||Math.abs(a.y-b.gapY)+1.8>b.halfY)){this.crash(a,true);break;}
    if(b.category==='shot'){const p=shotPosition(b,time);if(p.active&&Math.abs(a.forward+p.z)<7&&Math.abs(a.x-p.x)<5&&Math.abs(a.y-p.y)<3){this.crash(a,true);break;}}
    if(b.category==='pillar'&&Math.abs(dz)<b.radius+4&&Math.abs(a.x-b.x)<b.radius+3&&Math.abs(a.y-b.y)<b.height*.5+1.5){this.crash(a,true);break;}
    if(b.category==='gate'&&Math.abs(dz)<9&&((Math.abs(a.x-b.x)>11&&Math.abs(a.x-b.x)<31&&a.y<b.y+12)||(a.y>b.y+7&&a.y<b.y+18&&Math.abs(a.x-b.x)<30))){this.crash(a,true);break;}}
   if(a.state!=='crashing'&&(Math.abs(a.x)>39||a.y<-28))this.crash(a,true);
  }
  this.stats.nearSamples++;this.stats.nearTotal+=nearCount;
  for(let i=0;i<this.racers.length;i++)for(let j=i+1;j<this.racers.length;j++){
   const a=this.racers[i],b=this.racers[j];if(a.state==='crashing'||b.state==='crashing')continue;
   const gap=Math.abs(a.forward-b.forward),closing=Math.abs(a.ratio-b.ratio)*speed*dt;
   if(!craftContact(a,b,closing))continue;
   const key=a.id+':'+b.id;if(time-(this.lastContact.get(key)??-100)<.85)continue;this.lastContact.set(key,time);this.stats.bumps++;
   const impact=Math.abs(a.ratio-b.ratio),sign=Math.sin(a.angle-b.angle)>=0?1:-1;a.nudgeV+=sign*1.25/rivalProfile(a.style).mass;b.nudgeV-=sign*1.25/rivalProfile(b.style).mass;
   this.emit('bump',a,{other:b.id,strength:impact,x:(a.x+b.x)/2,y:(a.y+b.y)/2,forward:(a.forward+b.forward)/2});a.health-=impact>.65?3:1;b.health-=impact>.65?3:1;
   if(a.health<=0)this.crash(a);else this.damage(a);if(b.health<=0)this.crash(b);else this.damage(b);
  }
  for(let i=this.racers.length-1;i>=0;i--){const a=this.racers[i],relative=distance-a.forward;if((a.state==='crashing'&&a.crashAge>1.9)||(relative>360&&(a.ratio<1||a.passed||a.state==='crashing'))||relative<-Math.max(1300,speed*9)){this.emit('retire',a);this.racers.splice(i,1);}}
  if(this.lastContact.size>160)for(const [key,t]of this.lastContact)if(time-t>4)this.lastContact.delete(key);
 }
 drainEvents(){return this.events.splice(0);}
}
