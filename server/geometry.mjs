import {createPassageArt} from '../public/passage-art.mjs';
import {createSunscarWorld} from '../public/sunscar-world.mjs';
import {createFrostWorld} from '../public/frost-world.mjs';
import {createEmberWorld} from '../public/ember-world.mjs';
import {createRacerArt} from '../public/sunscar-art.mjs';
import * as T from '../public/three.module.js';
import {createWorldThemes} from '../public/environments.mjs';
import {createAsteroidArt} from '../public/asteroid-art.mjs';
import {makeSector,difficulty} from '../public/mechanics.mjs';
import {flightTime} from '../public/progression.mjs';
import {obstacleMotion} from '../public/obstacle-motion.mjs';
import {collisionQuery} from './collision.mjs';
// One bounded geometry workspace per Worker isolate. Simulation state lives in D1,
// never in this cache; evicting an isolate cannot change a match.
let singleton;
export function geometry(){return singleton??=new Geometry();}
export class Geometry {
 constructor(){this.scene=new T.Scene();this.world=new T.Group();this.scene.add(this.world);this.passageArt=createPassageArt(this.world,{});this.themes=null;this.fullThemes=null;this.themeCache=new Map();this.art=null;this.ship=new T.Group();this.scene.add(this.ship);this.hit=collisionQuery(this.ship);this.cache=new Map();this.racerModels=new Map();this.racerArt=createRacerArt(g=>g,new T.MeshStandardMaterial(),new T.MeshBasicMaterial());}
 configure(mode){if(this.themeCache.has(mode)){this.themes=this.themeCache.get(mode);this.themes.setMode?.(mode);return;}if(['sunscar','frost','ember'].includes(mode)){const factory={sunscar:createSunscarWorld,frost:createFrostWorld,ember:createEmberWorld}[mode],world=factory(this.scene,this.world);this.themes={createObstacle:a=>a.category==='passage'&&mode!=='sunscar'?this.passageArt.create(a):world.obstacle(a),[mode]:world};}else{this.fullThemes??=createWorldThemes(this.scene,this.world);this.fullThemes.setMode(mode);this.themes=this.fullThemes;if(mode==='medium')this.art??=createAsteroidArt();}this.themeCache.set(mode,this.themes);}
 sector(room,index){const key=[room.world,room.difficulty,room.seed,index].join(':');let entry=this.cache.get(key);if(entry)return entry;this.configure(room.world);const sector=makeSector(index,flightTime(index*190,room.difficulty,room.world),room.seed,room.difficulty,room.world);const obstacles=[];
  for(const a of sector.asteroids){if(!(room.world==='sunscar'&&a.category==='course')&&a.z<=difficulty(0,room.difficulty).speed*3.3+a.maxR+(a.creature==='dragon'?a.amp:0))continue;
   if(room.world!=='medium'||a.category==='passage'){obstacles.push(this.themes.createObstacle({...a}));continue;}
   const g=new T.Group(),variant=a.kind*3+Math.floor(a.phase/Math.PI*1.5)%3,shape=new T.Mesh(this.art.geometries[variant]);shape.userData.concave=true;const f=a.kind===0?[1,.85,1.05]:a.kind===1?[.82,1,.9]:[.7,1.6,.72];g.position.set(a.x,a.y,-a.z);shape.scale.set(...f.map(x=>x*a.radius));g.rotation.set(a.phase,a.phase*.5,a.phase*.3);g.add(shape);this.world.add(g);obstacles.push({...a,g,shape,baseX:a.x,baseY:a.y,baseZ:-a.z});
  }
  entry={rings:sector.rings.map((r,i)=>({...r,id:index+':'+i})),obstacles};this.cache.set(key,entry);
  while(this.cache.size>40){const [k,e]=this.cache.entries().next().value;for(const a of e.obstacles){if(a.environment==='frost')this.themeCache.get('frost')?.frost?.retire(a);if(a.environment==='ember')this.themeCache.get('ember')?.ember?.retire(a);this.world.remove(a.g);a.g.traverse(o=>{if(o.geometry&&!o.userData.sharedGeometry&&!(this.art?.geometries||[]).includes(o.geometry))o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose();});}this.cache.delete(k);}return entry;
 }
 racerCollision(p,a){if(Math.abs(a.forward-p.z)>14||Math.abs(a.x-p.x)>9||Math.abs(a.y-p.y)>5)return false;let v=this.racerModels.get(a.style);if(!v){v=this.racerArt.make(a);this.racerModels.set(a.style,v);this.world.add(v.g);}v.g.position.set(a.x,a.y,-a.forward);v.g.rotation.set(T.MathUtils.clamp(a.vy*.008,-.18,.18),T.MathUtils.clamp(a.vx*.009,-.25,.25),a.bank+(a.state==='crashing'?a.crashAge*5:0));this.ship.position.set(p.x,p.y,-p.z);this.world.position.z=0;return this.hit(v);}
 nearby(room,p){this.configure(room.world);const out={rings:[],obstacles:[]},row=Math.floor(p.z/190);for(let i=Math.max(0,row-2);i<=row+Math.ceil(difficulty(room.time,room.difficulty,room.world).speed*4.2/190)+1;i++){const e=this.sector(room,i);out.rings.push(...e.rings);out.obstacles.push(...e.obstacles);}return out;}
 collision(room,p,time,obstacles){this.configure(room.world);this.ship.position.set(p.x,p.y,-p.z);this.world.position.z=0;const d=difficulty(time,room.difficulty,room.world);for(const a of obstacles){obstacleMotion(a,time,d,.01,p.z,this.themes,room.world,true,room.difficulty);if(a.collidable===false)continue;const dz=a.g.position.z+p.z;if(Math.abs(dz)>(a.depth??a.maxR)+4)continue;const dx=p.x-a.g.position.x,dy=p.y-a.g.position.y;if(dx*dx+dy*dy+dz*dz>(a.maxR+4)**2)continue;if(this.hit(a))return a;}return null;}
}
