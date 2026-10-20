import {planPassages} from './passages.mjs?v=49';
import {planSunscar} from './sunscar-course.mjs?v=49';
import {progression,flightSpeed,flightTime,omitRingRow,ramp,stages} from './progression.mjs?v=49';
import {planFrost} from './frost-course.mjs?v=39';
import {planEmber,emberTime} from './ember-course.mjs?v=39';
import {EXPANSION_SHIPS} from './fleet-expansion.mjs?v=29';
import {planTraffic} from './traffic.mjs?v=39';
import {MULTIPLIERS} from './rewards.mjs';
export const LIMITS={x:32,y:23,steerX:27,steerY:24,fuel:24,spacing:190};
export const PAINTS=[
{id:'sunbeam',name:'Signature',color:0xf0eee5,accent:0x4fe0ea,exhaust:null,price:0,desc:'Original engine glow'},
{id:'lagoon',name:'Ion Cyan',color:0x29b9b5,accent:0x9ff5eb,exhaust:0x4ee9ff,price:1200,desc:'Cyan engine glow'},
{id:'rose',name:'Solar Coral',color:0xec7886,accent:0xffd190,exhaust:0xff6d87,price:2400,desc:'Coral engine glow'},
{id:'midnight',name:'Ultraviolet',color:0x665fa3,accent:0xba9aff,exhaust:0xad85ff,price:4000,desc:'Violet engine glow'},
{id:'gold',name:'Stellar Gold',color:0xeeb95f,accent:0xffecac,exhaust:0xffbe58,price:6500,desc:'Golden engine glow'}];
// Preview mode bypasses checkout without granting permanent ownership or changing prices.
export const FREE_SHIPYARD_PREVIEW=true;
export const SHIPS=[
{id:'armored-flyer',name:'Iron Man Flyer',price:18000,desc:'Classic red-and-gold suit, gold faceplate, arc reactor and palm repulsors.'},
{id:'saucer-freighter',name:'Falcon Freighter',price:20000,desc:'Offset cockpit, forward mandibles and a wide ion engine strip.'},
{id:'comet',name:'X-Wing Fighter',price:0,desc:'Four open foils, wingtip cannons and four rear engines.'},
{id:'night-glider',name:'Batwing',price:16000,desc:'Batwing-inspired · curved bat wings, deep scallops, armored canopy and recessed jets.'},
{id:'dart',name:'TIE Fighter',price:6000,desc:'A spherical cockpit between tall hexagonal solar wings.'},
{id:'exploration-cruiser',name:'Enterprise Cruiser',price:24000,desc:'Broad saucer, lower hull and paired glowing warp nacelles.'},
{id:'vanguard',name:'Heavy Gunship',price:14000,desc:'Original gunship · layered armor, glazed cockpit, turret pods and four heavy thrusters.'},
{id:'twin-pod-racer',name:'Podracer',price:18000,desc:'Anakin-inspired podracer · huge yellow turbines, energy binder and a tiny cable-towed cockpit.'},
{id:'stealth-phantom',name:'Stealth Phantom',price:22000,desc:'Original stealth fighter · faceted armor, recessed violet drives and swept control surfaces.'},
{id:'solar-skimmer',name:'Solar Skimmer',price:28000,desc:'Original solar craft · copper cell arrays, gold sail framing and a slender central hull.'},
...EXPANSION_SHIPS
];
export const MODES=[
{id:'easy',label:'Easy',speed:1,density:1,motion:1,spin:1,reward:MULTIPLIERS.easy,description:'Skyward'},
{id:'medium',label:'Medium',speed:1.55,density:1.4,motion:2.25,spin:1.9,reward:MULTIPLIERS.medium,description:'Orion'},
{id:'hard',label:'Hard',speed:2.15,density:2,motion:3.4,spin:2.7,reward:MULTIPLIERS.hard,description:'Neon City'}
];
export const WORLDS=[{id:'easy',name:'Skyward'},{id:'medium',name:'Orion'},{id:'hard',name:'Neon City'},{id:'ember',name:'Ember'},{id:'frost',name:'Frostveil'},{id:'sunscar',name:'Sunscar'}];
export const defaultWorld=mode=>['easy','medium','hard'].includes(mode)?mode:'easy';
export const recordKey=(world,mode)=>world+':'+mode;
export function worldRecord(save,world,mode){const key=recordKey(world,mode);return save.worldBests[key]||(save.worldBests[key]={distance:0,score:0});}
export const RING_TYPES=[{id:'gold',name:'Fuel',points:10,fuel:7,radius:4.6,color:0xffcd63},{id:'cyan',name:'Precision',points:25,fuel:8,radius:3.0,color:0x55e8f1},{id:'coral',name:'Daredevil',points:50,fuel:9,radius:2.15,color:0xff8593}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function difficulty(seconds,mode='easy',world=''){const settings=MODES.find(m=>m.id===mode)||MODES[0];const t=Math.max(0,seconds);return {speed:flightSpeed(t,mode,world),density:(8+34*(1-Math.exp(-t/55)))*settings.density,motion:(1+5*(1-Math.exp(-t/60)))*settings.motion,spin:(1+4*(1-Math.exp(-t/65)))*settings.spin,drain:1.1+.9*(1-Math.exp(-t/75)),ringScale:progression(t).ringScale,corridor:8-5.2*(1-Math.exp(-t/40))};}
export function warningDistance(seconds,mode='easy',radius=0,world=''){const closing=difficulty(seconds,mode,world).speed+1;const steerTime=Math.max(LIMITS.x*2/LIMITS.steerX,LIMITS.y*2/LIMITS.steerY);return closing*(world?4.1:.7+steerTime)+radius+8;}
export const RED_RING_START=90;
export const redRingChance=t=>.12*ramp(t,RED_RING_START)+.78*stages(t,RED_RING_START);
export const COURSE={height:14,hold:28,transition:6,opening:.5,start:9.3,maxRingYOffset:3};
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function routeAtTime(t,seed){
 const phase=(seed>>>0)%997/997*Math.PI*2,second=((seed>>>0)%619/619)*Math.PI*2,sign=(seed&1)?1:-1,envelope=ease((t-COURSE.opening)/6);
 const h=COURSE.height,hold=COURSE.hold,change=COURSE.transition;
 let y;if(t<COURSE.start)y=h*envelope;else{const p=(t-COURSE.start)%(2*(hold+change));y=p<hold?h:p<hold+change?h-2*h*ease((p-hold)/change):p<2*hold+change?-h:-h+2*h*ease((p-2*hold-change)/change);}
 // Independent wavelengths bend the route in both axes, including the long
 // fuel-band plateaus. Every world reserves this exact continuous course.
 const weave=(1.65*Math.sin(t*.76+second)+.65*Math.sin(t*1.17+phase))*envelope;
 return {x:(13*Math.sin(t*.43+phase)+5*Math.sin(t*.91+second))*envelope,y:y*sign+weave};
}
export function fuelTarget(index,seed,mode='easy',world=''){return safeRoute(index*LIMITS.spacing,seed,mode,world);}
export function safeRoute(z,seed,mode='easy',world=''){return routeAtTime(flightTime(Math.max(0,z),mode,world),seed);}
export function ringPass(dx,dy,radius,contactRadius=.7){const d=Math.hypot(dx,dy);return {hit:d<=radius*1.052+contactRadius,perfect:d<=radius*.3};}
// Swept contacts collect both fly-throughs and grazes of the visible ring tube.
export function ringSweep(from,to,radius,contactRadius=.45){const thickness=radius*.052+contactRadius;if(Math.min(from.z,to.z)>thickness||Math.max(from.z,to.z)<-thickness)return false;const dz=to.z-from.z,f=dz===0?1:clamp(-from.z/dz,0,1),x=from.x+(to.x-from.x)*f,y=from.y+(to.y-from.y)*f;return ringPass(x,y,radius,contactRadius).hit;}

export function fuelAfterRing(fuel,type,perfect=false){return Math.min(LIMITS.fuel,fuel+RING_TYPES[type].fuel+(perfect?1.5:0));}
export function creditRing(save,run,type,perfect=false){const points=RING_TYPES[type].points+(perfect?Math.floor(RING_TYPES[type].points*.5):0);save.credits+=points;run.points+=points;run.rings++;return points;}
export function purchase(save,kind,id,{preview=FREE_SHIPYARD_PREVIEW}={}){const list=kind==='ship'?SHIPS:PAINTS,key=kind==='ship'?'ownedShips':'ownedPaints',selected=kind==='ship'?'ship':'paint',item=list.find(p=>p.id===id);if(!item)return {ok:false,reason:'unknown'};if(preview){save[selected]=id;return {ok:true,preview:true};}if(!save[key].includes(id)){if(save.credits<item.price)return {ok:false,reason:'funds',needed:item.price-save.credits};save.credits-=item.price;save[key].push(id);}save[selected]=id;return {ok:true};}
const number=(v)=>Number.isFinite(Number(v))?clamp(Math.floor(Number(v)),0,1e12):0;
export function loadSave(raw,{preview=FREE_SHIPYARD_PREVIEW}={}){let s;try{s=JSON.parse(raw)||{};}catch{s={};}const old=s.version!==2;const ownedPaints=[...new Set(['sunbeam',...(Array.isArray(old?s.owned:s.ownedPaints)?(old?s.owned:s.ownedPaints):[]).filter(id=>PAINTS.some(p=>p.id===id))])];const ownedShips=[...new Set(['comet',...(Array.isArray(s.ownedShips)?s.ownedShips:[]).filter(id=>SHIPS.some(p=>p.id===id))])];const world=WORLDS.some(w=>w.id===s.world)?s.world:defaultWorld(s.mode);const worldBests=Object.fromEntries(WORLDS.flatMap(w=>MODES.map(m=>{const prior=s.worldBests?.[recordKey(w.id,m.id)]??(w.id===m.id?s.modeBests?.[m.id]:null);return [recordKey(w.id,m.id),{distance:number(prior?.distance),score:number(prior?.score)}];})));return {version:2,world,worldBests,mode:MODES.some(m=>m.id===s.mode)?s.mode:'easy',credits:old?number(s.rings)*10:number(s.credits),best:number(s.best),bestScore:number(s.bestScore),ownedPaints,ownedShips,paint:(preview?PAINTS.some(p=>p.id===s.paint):ownedPaints.includes(s.paint))?s.paint:'sunbeam',ship:(preview?SHIPS.some(p=>p.id===s.ship):ownedShips.includes(s.ship))?s.ship:'comet',sound:s.sound===true,audio:{muted:s.audio?.muted??(s.sound===false),effects:clamp(Number.isFinite(s.audio?.effects)?s.audio.effects:.8,0,1),ambience:clamp(Number.isFinite(s.audio?.ambience)?s.audio.ambience:.55,0,1)},modeBests:Object.fromEntries(MODES.map(m=>[m.id,{distance:number(s.modeBests?.[m.id]?.distance),score:number(s.modeBests?.[m.id]?.score)}])),legacyBest:number(s.legacyBest??(!s.modeBests?s.best:0))};}
export function makeSector(index,seconds,seed,mode='easy',world=mode){const rand=rng((seed+Math.imul(index+1,73471))>>>0),d=difficulty(seconds,mode,world),z0=index*LIMITS.spacing;
const ringAt=flightTime(z0,mode,world),ringDifficulty=difficulty(ringAt,mode);
const rings=[];if(index>0){const p=fuelTarget(index,seed,mode,world);rings.push({x:p.x,y:p.y,z:z0,type:0,r:RING_TYPES[0].radius*ringDifficulty.ringScale});const side=rand()>.5?1:-1;const bx=side*(18+rand()*7),band=safeRoute(z0+55,seed,mode,world).y,by=band+(rand()-.5)*6;rings.push({x:bx,y:by,z:z0+55,type:1,r:RING_TYPES[1].radius*ringDifficulty.ringScale});rings.push({x:-side*(19+rand()*7),y:band+(rand()-.5)*6,z:z0+55,type:2,r:RING_TYPES[2].radius*ringDifficulty.ringScale});}
// Draw with an independent seed so scarcity never changes obstacle randomization.
const omit=omitRingRow(index,ringAt,mode,rng((seed^Math.imul(index,19349663))>>>0)(),world);
const redAt=flightTime(z0+55,mode,world),redRoll=rng((seed^Math.imul(index+1,49979687))>>>0)();
if(redRoll>=redRingChance(redAt)){const red=rings.findIndex(r=>r.type===2);if(red>=0)rings.splice(red,1);}
for(const r of rings){r.motionPhase=rng((seed^Math.imul(index+1,83492791)^r.type)>>>0)()*Math.PI*2;r.baseX=r.x;r.baseY=r.y;}
if(omit)rings.length=0;
const asteroids=[];const count=Math.floor(d.density)+(rand()<d.density%1?1:0);
for(let i=0;i<count;i++){const z=z0+20+rand()*150,sizeRoll=rand(),kind=sizeRoll>.94?0:Math.floor(rand()*3),radius=sizeRoll<.25?.7+rand()*1.3:sizeRoll>.94?32+rand()*14:sizeRoll>.77?12+rand()*16:3+rand()*5,amp=radius>9?1.6:radius<2.2?5:3.3,maxR=radius*(kind===2?1.65:1.1);let x=(rand()-.5)*78,y=(rand()-.5)*60;const p=safeRoute(z,seed,mode),clear=maxR+amp+d.corridor+maxR*.40;if(Math.hypot(x-p.x,y-p.y)<clear){const a=rand()*Math.PI*2;x=p.x+Math.cos(a)*clear;y=p.y+Math.sin(a)*clear;}
// Keep ring openings clear through the full range of asteroid movement and rotation.
let safe=true;for(const r of rings)if(Math.abs(r.z-z)<maxR+8&&Math.hypot(x-r.x,y-r.y)<maxR+amp+r.r+3.6)safe=false;if(!safe){x+=(x>=0?1:-1)*(maxR+12);}
asteroids.push({x,y,z,kind,radius,amp,phase:rand()*Math.PI*2,rate:(kind===0?.18:kind===1?.48:.3)*(rand()>.5?1:-1),spin:(kind===0?.12:kind===1?.65:.35)*(rand()>.5?1:-1),maxR});}
// A rock sits just outside each challenge ring, giving the bonus approach a visible hazard.
for(const r of rings.filter(r=>r.type>0)){const sign=r.x>0?1:-1,rad=r.type===2?4:3;asteroids.push({x:r.x+sign*(r.r+rad+2.4),y:r.y,z:r.z,kind:0,radius:rad,amp:.35,phase:rand()*6.28,rate:.25,spin:.22,maxR:rad*1.1,bonus:true});}
if(world==='sunscar'){asteroids.splice(0,asteroids.length,...planSunscar({index,z0,seed,mode,safeRoute:(z,s,m)=>safeRoute(z,s,m,'sunscar'),rings,seconds}));
 }else if(world==='frost'){
 asteroids.splice(0,asteroids.length,...planFrost({index,z0,count:asteroids.length,rand,seconds,mode,safeRoute,rings,seed,warningDistance}));
 }else if(world==='ember'){
 asteroids.splice(0,asteroids.length,...planEmber({index,z0,count:asteroids.length,rand,seconds,mode,safeRoute,rings,seed,warningDistance:(t,_,r)=>warningDistance(t,mode,r)}));
 }else if(world==='hard'){
 asteroids.splice(0,asteroids.length,...planTraffic({index,z0,count:asteroids.length,rand,seconds,safeRoute:(z,s)=>safeRoute(z,s,mode),rings,seed,warningDistance:(t,_,r)=>warningDistance(t,mode,r)}));
 }else if(world==='easy'){
 for(const a of asteroids){a.creature=a.radius<2.2?'bird':a.radius<9?'dragon':null;if(a.creature){a.amp=a.creature==='dragon'?12+3*Math.sin(a.phase)**2:Math.min(a.amp,5);a.maxR=Math.min(a.radius,a.creature==='bird'?1.7:4)*2.2;if(a.creature==='dragon'){const p=safeRoute(a.z,seed,mode),clear=a.maxR+a.amp+d.corridor+a.maxR*.4,dx=a.x-p.x,dy=a.y-p.y,length=Math.hypot(dx,dy);if(length<clear){a.x=p.x+(length>.001?dx/length:Math.cos(a.phase))*clear;a.y=p.y+(length>.001?dy/length:Math.sin(a.phase))*clear;}}}else{a.maxR=Math.max(a.maxR,a.radius*1.3);a.amp=Math.min(a.amp,.8);a.spin*=.08;a.y=Math.max(a.y,-20+a.radius*1.16);const path=safeRoute(a.z,seed,mode),clear=a.maxR+a.amp+d.corridor+a.maxR*.4,needed=Math.sqrt(Math.max(0,clear*clear-(a.y-path.y)**2));if(Math.abs(a.x-path.x)<needed)a.x=path.x+(a.x>=path.x?1:-1)*needed;}}
 if(index>0&&index%3===1){const ring=rings[0],a=asteroids.find(a=>!a.creature)||asteroids[0];if(a&&ring)Object.assign(a,{x:ring.x,y:ring.y,z:ring.z,radius:10,maxR:48,amp:0,spin:0,creature:null,arch:true});}
 }
 // Protect a continuous route through the whole object, not only its center
 // plane. The 8-unit grid has >1.3 units of interpolation allowance in clear.
 if(world==='medium'||world==='easy'){
  const solids=asteroids.filter(a=>!a.arch),extent=Math.max(0,...solids.map(a=>a.maxR+a.amp+13)),route=[];
  for(let z=Math.max(0,Math.floor((z0-extent)/8)*8);z<=z0+190+extent;z+=8)route.push({z,...safeRoute(z,seed,mode)});
  for(const a of solids){const sign=a.x>=safeRoute(a.z,seed,mode).x?1:-1,clear=a.maxR+a.amp+5.8;
   for(const p of route){if(Math.abs(p.z-a.z)>a.maxR+a.amp+13)continue;const needed=Math.sqrt(Math.max(0,clear*clear-(a.y-p.y)**2));if(needed>0)a.x=sign>0?Math.max(a.x,p.x+needed):Math.min(a.x,p.x-needed);}
  }
 }
 asteroids.push(...planPassages(index,seed,mode,world,safeRoute));
 return {rings,asteroids};}
