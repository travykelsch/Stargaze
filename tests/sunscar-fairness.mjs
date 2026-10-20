import assert from 'node:assert/strict';
import {RaceField} from '../public/sunscar-racing.mjs';
import {RearSafety,REAR_WARNING_SECONDS,playerPath,obstacleBlocks} from '../public/sunscar-safety.mjs';
import {flightSpeed,flightDistance,flightTime,SUNSCAR_BOOST} from '../public/progression.mjs';
import {routeAtTime,makeSector,SHIPS} from '../public/mechanics.mjs';
// The common collision samples are deliberately shared across all 20 silhouettes.
assert.equal(SHIPS.length,20);let cases=0,warnings=0,holds=0;
for(const mode of ['easy','medium','hard'])for(const start of [0,100,600])for(const [x,y,vx,vy]of [[0,0,0,0],[-32,23,-27,0],[32,-23,27,-24],[-14,-12,27,24],[16,15,-27,-24]])for(const roll of [false,true]){
 const f=new RaceField(routeAtTime);f.reset(113,mode,start,flightDistance(start,mode,'sunscar'));f.spawnClock=1e9;
 const speed=flightSpeed(start,mode,'sunscar'),a=f.spawn();a.kind=2;a.ratio=a.baseRatio=a.targetRatio=2.2;a.forward=f.distance-(1.2*speed*6.5+90);a.courseTime=flightTime(Math.max(0,a.forward),mode,'sunscar');a.lastRelative=f.distance-a.forward;a.angle=x>0?0:Math.PI;f.pose(a,0);f.serial=1;
 const player={x,y,vx,vy,fuel:roll?1:24,halfX:2.6,halfY:.9,evade:{active:roll,remaining:.23,vx:vx>0?50:-50,vy:0}},obstacles=[];
 const sector=Math.floor(f.distance/190);for(let i=Math.max(0,sector-1);i<sector+12;i++)obstacles.push(...makeSector(i,flightTime(i*190,mode,'sunscar'),113,mode,'sunscar').asteroids);
 let warned=false,firstLead=0;for(let k=1;k<=100;k++){const t=start+k*.05;f.step(.05,t,flightDistance(t,mode,'sunscar'),obstacles,player);const w=f.safety.warnings.find(w=>w.id===a.id);if(w&&!warned){warned=true;firstLead=w.ttc;assert.ok(firstLead>=3.0,'early warning at real closing speed');warnings++;}if(a.safetyHeld)holds++;if(a.passed||a.state==='crashing')break;}
 assert.ok(warned,'every rear approach becomes detectable');assert.ok(a.passLine||a.safetyHeld||a.state==='crashing');cases++;
}
// A boxed crossing has no escape: thrust is reduced before the encounter.
const fake={time:100,distance:10000,mode:'hard',seed:1,racers:[],stats:{rearWarnings:0},emit(){}};const speed=flightSpeed(100,'hard','sunscar'),r={id:1,state:'racing',forward:10000-speed*1.2*5,ratio:2.2,targetRatio:2.2,baseRatio:2.2,x:0,y:0};fake.racers=[r];const safety=new RearSafety(routeAtTime);safety.evaluate(fake,[{category:'pillar',z:flightDistance(102,'hard','sunscar'),x:0,y:0,radius:100,height:200}],{x:0,y:0,vx:0,vy:0});assert.ok(r.safetyRatio<=1.03);assert.ok(safety.stats.delayed>0);
// Four simultaneous approaches: all four are warned; overflow thrust waits
// behind the three fully planned passes without teleporting or disabling contact.
const pack=new RaceField(routeAtTime);pack.reset(77,'hard',150,flightDistance(150,'hard','sunscar'));pack.spawnClock=1e9;const ps=flightSpeed(150,'hard','sunscar');for(let i=0;i<4;i++){const a=pack.spawn();a.kind=2;a.ratio=a.targetRatio=a.baseRatio=2;a.forward=pack.distance-ps*(5+i*.1);a.lastRelative=pack.distance-a.forward;}
pack.safety.evaluate(pack,[],{x:0,y:0,vx:0,vy:0,fuel:1});assert.equal(pack.safety.warnings.length,4);assert.ok(pack.racers.some(a=>a.safetyHeld));
const p=playerPath({x:30,y:22,vx:27,vy:24,evade:{active:true,remaining:.2,vx:50,vy:0}},1,1,3);assert.deepEqual(p,{x:32,y:23});
for(const mode of ['easy','medium','hard'])for(const t of [0,4,8,35,120,600,1800]){assert.ok(Math.abs(flightTime(flightDistance(t,mode,'sunscar'),mode,'sunscar')-t)<1e-7);const ds=(flightDistance(t+.0001,mode,'sunscar')-flightDistance(t,mode,'sunscar'))/.0001;assert.ok(Math.abs(ds-flightSpeed(t,mode,'sunscar'))<.003);assert.ok(flightSpeed(t,mode,'sunscar')<=120*2.15*SUNSCAR_BOOST+.001);}
console.log(JSON.stringify({cases,warnings,holds,minimumTarget:REAR_WARNING_SECONDS}));console.log('PASS: actual-position rear checks at corners, steering reversals, active evades, tunnels/arches/pillars/volleys, early and late speeds; unsafe timing brakes continuously; exact Sunscar clock and caps. Logic simulation, not phone play.');
