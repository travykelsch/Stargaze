import {trafficPosition} from './traffic.mjs';
import {animateCreature} from './world-art.mjs?v=55';
import {objectTime} from './progression.mjs';
import {flightDistance} from './progression.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function obstacleMotion(a,time,d,dt,distance,themes,world,shared=false,mode='easy'){if(a.category==='passage')return;if(a.environment==='sunscar'){if(a.category!=='racer')themes.sunscar.motion(a,distance,time);return;}if(a.environment==='frost'){themes.frost.motion(a,distance,time,d);return;}if(a.environment==='ember'){themes.ember.motion(a,distance,time,d);return;}if(a.environment==='hard'){const clockDistance=shared?flightDistance(time,mode,world):distance,p=trafficPosition(a,clockDistance),q=trafficPosition(a,clockDistance+.5),vx=(q.x-p.x)*2,vy=(q.y-p.y)*2;a.g.position.set(p.x,p.y,a.baseZ);a.g.rotation.set(-Math.atan(vy),Math.atan(vx),clamp(-vx*1.2,-.28,.28));const approach=a.z-clockDistance;if(a.signal)a.signal.visible=approach<a.reveal&&approach>50&&Math.sin(time*8+a.phase)>0;return;}
if(a.arch){a.g.position.set(a.baseX,a.baseY,a.baseZ);return;}
if(a.creature){animateCreature(a,objectTime(time),d,dt,shared);return;}
const clock=objectTime(time),motion=a.environment==='easy'?.6:d.motion,phase=clock*a.rate*motion+a.phase;a.g.position.set(a.baseX+Math.sin(phase)*a.amp,a.baseY+Math.cos(phase*.8)*a.amp*.75,a.baseZ+Math.sin(time*.2+a.phase)*a.amp*.3);
if(a.environment==='easy')a.g.rotation.set(Math.sin(phase)*.025,a.phase*.5+time*a.spin*.08,Math.cos(phase)*.025);else a.g.rotation.set(a.phase+time*a.spin*d.spin,a.phase*.5+time*a.spin*d.spin*.7,a.phase*.3+time*a.spin*d.spin*.45);}
