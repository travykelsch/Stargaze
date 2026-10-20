import {artCanvas} from './art-canvas.mjs';
import {createPassageArt} from './passage-art.mjs?v=49';
import {createSunscarWorld} from './sunscar-world.mjs?v=55';
export {FALL_WARNING_SECONDS} from './hazard-warnings.mjs?v=36';
import {createFrostWorld} from './frost-world.mjs?v=39';
import {createEmberWorld} from './ember-world.mjs?v=39';
import {finishTrafficMaterial} from './neon-architecture.mjs?v=27';
import {createCanyonTerrain} from './canyon-terrain.mjs?v=26';
import {createHardCity} from './hard-city.mjs?v=27';
import {createStoneArch} from './easy-landmarks.mjs?v=26';
import {createEasyVisuals} from './easy-visuals.mjs?v=26';
import {createDragonMaterials} from './dragon-materials.mjs?v=26';
import {createWorldArt} from './world-art.mjs?v=27';
import * as THREE from './three.module.js';

// Environment art is independent of the course generator and difficulty settings.
export const WORLD_INFO={easy:{name:'Skyward',hazard:'solid obstacle'},medium:{name:'Orion',hazard:'asteroid'},hard:{name:'Neon City',hazard:'oncoming vehicle'},ember:{name:'Ember',hazard:'volcanic debris'},frost:{name:'Frostveil',hazard:'ice storm'},sunscar:{name:'Sunscar',hazard:'rival racer'}};
export function createWorldThemes(scene,world){
  const ember=createEmberWorld(scene,world),frost=createFrostWorld(scene,world),sunscar=createSunscarWorld(scene,world);
  const passageArt=createPassageArt(world,{sunscar});const shared=new Set(),scenery=[],day=new THREE.Group(),night=new THREE.Group();scene.add(day,night);let mode='medium';
  function geo(g){shared.add(g);return g;}
  const cube=geo(new THREE.BoxGeometry(1,1,1)),sphere=geo(new THREE.IcosahedronGeometry(1,1)),cone=geo(new THREE.ConeGeometry(1,1,8)),cap=geo(new THREE.CylinderGeometry(.87,1,.15,8));
  function mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.78,...extra});}
  const cityMat=mat(0x101723,{metalness:.55,roughness:.56}),roadMat=mat(0x17213a,{metalness:.5,roughness:.4}),cyan=new THREE.MeshBasicMaterial({color:0x3de8f2,toneMapped:false}),pink=new THREE.MeshBasicMaterial({color:0xfc55c6,toneMapped:false}),amber=new THREE.MeshBasicMaterial({color:0xffca70,toneMapped:false});
  function item(g,m,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.userData.sharedGeometry=true;parent.add(o);return o;}
  function rng(seed){let a=(seed>>>0)||1;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
  function merge(parts){const arrays={position:[],normal:[],color:[],uv:[]};for(const p of parts){const src=p.g.index?p.g.toNonIndexed():p.g.clone();const m=new THREE.Matrix4().compose(new THREE.Vector3(...(p.pos||[0,0,0])),new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.rot||[0,0,0]))),new THREE.Vector3(...(p.scale||[1,1,1])));src.applyMatrix4(m);const pos=src.attributes.position,n=src.attributes.normal,c=new THREE.Color(p.color||0xffffff);for(let i=0;i<pos.count;i++){arrays.position.push(pos.getX(i),pos.getY(i),pos.getZ(i));arrays.normal.push(n.getX(i),n.getY(i),n.getZ(i));arrays.color.push(c.r,c.g,c.b);arrays.uv.push(p.glow?.75:.25,.5);}src.dispose();}const g=geo(new THREE.BufferGeometry());for(const [key,size]of Object.entries({position:3,normal:3,color:3,uv:2}))g.setAttribute(key,new THREE.Float32BufferAttribute(arrays[key],size));g.computeBoundingSphere();return g;}
  const art=createWorldArt(g=>shared.add(g)),easyVisuals=createEasyVisuals(geo),terrain=createCanyonTerrain(geo);for(const g of terrain.cliffs)easyVisuals.projectedUV(g,.13);
  for(const g of [...art.rocks,...art.arches,art.pier])easyVisuals.projectedUV(g,g===art.pier?2:.18);for(const island of art.islands)easyVisuals.projectedUV(island.geometry,2);for(const bird of art.animals.bird)for(const key of ['body','inner','outer'])if(bird[key])easyVisuals.projectedUV(bird[key],2);
  const archMat=easyVisuals.stoneMaterial(0xffffff,true),islandMat=easyVisuals.stoneMaterial(0xffffff,true),rockMat=easyVisuals.stoneMaterial(0xffffff,true);
  const glowMask=new THREE.DataTexture(new Uint8Array([0,0,0,255,255,255,255,255]),2,1,THREE.RGBAFormat);glowMask.needsUpdate=true;
  const trafficMat=mat(0xffffff,{vertexColors:true,metalness:.65,roughness:.4,emissive:0xb8e5ff,emissiveIntensity:3.1,emissiveMap:glowMask});
  finishTrafficMaterial(trafficMat);const trafficGeos=art.traffic,hardCity=createHardCity(g=>shared.add(g),trafficGeos,trafficMat);
  const stoneMat=easyVisuals.stoneMaterial(0xa08c79),grassMat=mat(0x78956a,{roughness:.95});
  const dragonMaterials=createDragonMaterials(easyVisuals.clock);
  const creatureMat=mat(0xffffff,{vertexColors:true,roughness:.78,side:THREE.DoubleSide});
  const cliffMat=easyVisuals.stoneMaterial(0xffffff,true),canopyMat=easyVisuals.frondMaterial.clone();canopyMat.onBeforeCompile=easyVisuals.frondMaterial.onBeforeCompile;canopyMat.customProgramCacheKey=()=> 'easy-canopy-wind-v26';canopyMat.emissive.setHex(0x314528);canopyMat.emissiveIntensity=.08;
  const distantBirdMat=new THREE.MeshStandardMaterial({color:0x6d6c64,roughness:1,side:THREE.DoubleSide});distantBirdMat.onBeforeCompile=shader=>{shader.uniforms.uBirdTime=easyVisuals.clock;shader.vertexShader='uniform float uBirdTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float phase=0.;
 #ifdef USE_INSTANCING
 phase=instanceMatrix[3].z*.11;
 #endif
 transformed.y+=sin(uBirdTime*7.+phase)*abs(position.x)*.35;transformed.x+=sin(uBirdTime*.55+phase)*1.7;`);};distantBirdMat.customProgramCacheKey=()=> 'skyward-distant-flock-v26';

  function backdrop(top,bottom,glowColor){const c=artCanvas();c.width=1024;c.height=1024;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,1024);g.addColorStop(0,top);g.addColorStop(1,bottom);x.fillStyle=g;x.fillRect(0,0,1024,1024);const r=x.createRadialGradient(800,550,0,800,550,800);r.addColorStop(0,glowColor);r.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=r;x.fillRect(0,0,1024,1024);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
  const cityLight=new THREE.Group();scene.add(cityLight);const lampA=new THREE.PointLight(0x7a8dda,55,130,1.6),lampB=new THREE.PointLight(0x9468d3,60,140,1.6);lampA.position.set(-35,9,15);lampB.position.set(38,-6,-24);cityLight.add(lampA,lampB);
  const trafficLights=Array.from({length:3},()=>{const light=new THREE.PointLight(0x91dfff,0,110,2);cityLight.add(light);return light;});
  function updateTrafficLights(hazards){const candidates=hazards.filter(a=>a.environment==='hard').map(a=>{const z=a.g.position.z+world.position.z,dist=Math.hypot(a.g.position.x,a.g.position.y,z);return {a,z,rank:dist/(1+Math.sqrt(a.radius)*.40)};}).filter(c=>c.z>-110&&c.z<230).sort((a,b)=>a.rank-b.rank);for(let i=0;i<trafficLights.length;i++){const light=trafficLights[i],c=candidates[i];if(mode!=='hard'||!c){light.intensity=0;continue;}light.color.setHex(c.a.kind===2?0xb2c4ff:c.a.kind===1?0x79dafa:0xb6a1ff);light.position.set(c.a.g.position.x,c.a.g.position.y,c.z+c.a.radius*.5);light.intensity=Math.min(1800,110+c.a.radius*c.a.radius*9);light.distance=65+c.a.radius*3;}}
  const backgrounds={easy:backdrop('#356ba5','#f7bd91','rgba(255,166,79,.38)'),hard:backdrop('#090d1d','#2b2140','rgba(126,96,173,.20)')};
  // Large distant celestial bodies and clouds have no collision geometry.
  // Layered atmospheric ridges sit beyond the playable canyon; scenery only.
  const ridgeRand=rng(812);for(let layer=0;layer<3;layer++){const vertices=[],indices=[],z=-820+layer*100;for(let j=0;j<=40;j++){const x=(j-20)*42,y=-18+Math.sin(j*.65+layer)*22+ridgeRand()*20-layer*17;vertices.push(x,y,z,x,-260,z);if(j){const k=j*2;indices.push(k-2,k-1,k,k,k-1,k+1);}}const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);item(g,new THREE.MeshBasicMaterial({color:[0xc5a5a0,0xa596a4,0x858e9f][layer],fog:false,side:THREE.DoubleSide}),day);}
  hardCity.populateSkyline(night);
  const palettes={sunscar:sunscar.palettes,frost:frost.palettes,ember:ember.palettes,easy:[{name:'Golden Canyon',sky:'#c8b7ad',rock:'#af9984',light:0xffcf96},{name:'Amber Water',sky:'#cbb6a4',rock:'#af9984',light:0xffc58d},{name:'Rosewater Reach',sky:'#c4adb2',rock:'#ad9988',light:0xffc6a2},{name:'Sundown Gardens',sky:'#cbb7af',rock:'#a89987',light:0xffd3a3}],hard:[{name:'Neon Skyway',sky:'#171326',rock:'#8898b6',light:0xb1a4d6},{name:'Market District',sky:'#20152d',rock:'#ab93b7',light:0xb49ac9},{name:'Ion Expressway',sky:'#151a30',rock:'#83b3c1',light:0xa0b4d5},{name:'Midnight Core',sky:'#1a1430',rock:'#ae99cc',light:0xb0a0cf}]};
  function setMode(next){mode=next;sunscar.setActive(mode==='sunscar');ember.setActive(mode==='ember');frost.setActive(mode==='frost');day.visible=mode==='easy';night.visible=mode==='hard';cityLight.visible=mode==='hard';return backgrounds[mode]||null;}
  function createObstacle(a){if(a.category==='passage')return passageArt.create(a);if(mode==='sunscar')return sunscar.obstacle(a);if(mode==='frost')return frost.obstacle(a);if(mode==='ember')return ember.obstacle(a);const g=new THREE.Group();g.position.set(a.x,a.y,-a.z);g.userData.environment=mode;let shape,collisionShapes;
    if(mode==='easy'&&a.arch){const geometry=createStoneArch(Math.floor(a.phase)%3+1,Math.max(2,a.y+27));easyVisuals.projectedUV(geometry,.12);const arch=item(geometry,archMat,g);arch.userData.sharedGeometry=false;arch.userData.ownedArch=true;collisionShapes=[arch];shape=arch;
 }else if(mode==='easy'&&a.creature){const r=a.creature==='bird'?Math.min(a.radius,1.7):Math.min(a.radius,4),design=art.animals[a.creature][Math.floor(a.phase)%3];const dragon=a.creature==='dragon',skin=dragon?dragonMaterials.skin:easyVisuals.birdMaterial,wingMaterial=dragon?dragonMaterials.wing:easyVisuals.birdMaterial;item(design.body,skin,g,0,0,0,r,r,r);if(design.eyes)item(design.eyes,dragonMaterials.eyes,g,0,0,0,r,r,r);a.wings=[];for(const side of [-1,1]){const w=new THREE.Group();w.scale.set(r,r,r*side);g.add(w);item(design.inner,wingMaterial,w);const tip=new THREE.Group();tip.position.set(0,design.tipY||0,design.tipZ);item(design.outer,wingMaterial,tip);w.add(tip);w.userData.tip=tip;a.wings.push(w);}if(design.tail)a.tail=item(design.tail,skin,g,0,0,0,r,r,r);shape=item(sphere,creatureMat,g,0,0,0,r*.6,r*.22,r*.22);shape.visible=false;collisionShapes=[shape];a.maxR=r*2.2;
 }else if(mode==='easy'){const r=a.radius,design=art.islands[(a.kind+Math.floor(a.phase))%art.islands.length];item(design.geometry,islandMat,g,0,0,0,r,r,r);shape=item(design.core,rockMat,g,0,0,0,r,r,r);shape.visible=false;collisionShapes=[shape];a.maxR=Math.max(a.maxR,r*1.3);if(r>10){const height=Math.min(18,r*.8);item(easyVisuals.fallGeometry,easyVisuals.fallMaterial,g,r*.60,-height*.5+r*.10,r*.22,r*.12,height,1);item(easyVisuals.foamGeometry,easyVisuals.foamMaterial,g,r*.60,r*.105,r*.22,r*.24,1,r*.17);}}
 else{const r=Math.min(a.radius,25),variant=a.kind*3+Math.floor(a.phase*1.5/Math.PI)%3,ry=a.kind===2?r*.8:r,rz=a.kind===2?r*1.45:r,visual=item(trafficGeos[variant],trafficMat,g,0,0,0,r,ry,rz);shape=item(trafficGeos[variant].userData.core,trafficMat,g,0,0,0,r,ry,rz);shape.visible=false;collisionShapes=[shape,visual];hardCity.addHeadlights(g,variant,r,ry,rz);const signal=item(cube,amber,g,0,ry*.6,rz*.65,r*.2,.12,.15);signal.visible=false;a.signal=signal;}
    world.add(g);return {...a,g,shape,collisionShapes,environment:mode,baseX:a.x,baseY:a.y,baseZ:-a.z};}
  function batch(parent,geometry,material,transforms){const o=new THREE.InstancedMesh(geometry,material,transforms.length),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();for(let i=0;i<transforms.length;i++){const t=transforms[i];matrix.compose(new THREE.Vector3(...t.p),q,new THREE.Vector3(...t.s));o.setMatrixAt(i,matrix);}o.instanceMatrix.needsUpdate=true;o.userData.sharedGeometry=true;parent.add(o);return o;}
  function compactScenery(g){const batches=new Map();for(const o of [...g.children])if(o.isMesh&&!o.isInstancedMesh&&!o.userData.ad&&!o.userData.adSweep){const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}for(const parts of batches.values()){if(parts.length<2)continue;const instance=new THREE.InstancedMesh(parts[0].geometry,parts[0].material,parts.length);parts.forEach((o,i)=>{o.updateMatrix();instance.setMatrixAt(i,o.matrix);g.remove(o);});instance.instanceMatrix.needsUpdate=true;instance.userData.sharedGeometry=true;g.add(instance);}}
  function spawnScenery(index,seed){if(mode==='sunscar'){sunscar.spawn(index,seed);return;}if(mode==='frost'){frost.spawn(index,seed);return;}if(mode==='ember'){ember.spawn(index,seed);return;}if(mode==='easy'){spawnCanyon(index,seed);return;}if(mode!=='hard')return;const g=new THREE.Group(),z=index*190;g.position.z=-z;world.add(g);scenery.push({g,z});hardCity.addSector(g,index,seed);}
 function spawnCanyon(index,seed){const r=rng(seed+index*991),g=new THREE.Group(),z=index*190;g.position.z=-z;world.add(g);scenery.push({g,z});
  item(easyVisuals.waterGeometry,easyVisuals.waterMaterial,g,0,-27,-95);
  const mistPositions=[],mistPhases=[],plants=[],palms=[],canopies=[],flocks=[];
  for(const side of [-1,1])for(let j=0;j<4;j++){
   const x=side*(83+r()*8),bz=-j*49,sy=.72+r()*.34,variant=(j+index)%3,ledge=-27+63*sy,top=-27+72*sy;
   item(terrain.cliffs[variant],cliffMat,g,x,-27,bz,1,sy,1.08);
   for(let k=0;k<7;k++){const scale=2.0+r()*1.4,tx=x+(r()-.5)*17,tz=bz+(r()-.5)*25;plants.push({p:[tx,top,tz],s:[scale,scale*(.85+r()*.4),scale]});if(k%3===0)canopies.push({p:[tx,top,tz],s:[scale,scale,scale]});else palms.push({p:[tx,top,tz],s:[scale,scale,scale]});}
   if(j%2===0){const fallHeight=ledge+27,fx=x-side*17,fz=bz+22;
    item(easyVisuals.fallGeometry,easyVisuals.fallMaterial,g,fx,-27+fallHeight*.5,fz,4+r()*2,fallHeight,1);
    item(easyVisuals.foamGeometry,easyVisuals.foamMaterial,g,fx,-26.79,fz,16,1,11);
    for(let k=0;k<24;k++){mistPositions.push(fx+(r()-.5)*8,-26.7,fz+(r()-.5)*5);mistPhases.push(r());}
   }
   for(let k=0;k<3;k++)flocks.push({p:[side*(59+k*3+r()*6),ledge+5+k*1.3,bz-8-k*3],s:[.6,.6,.6]});
  }
  batch(g,easyVisuals.trunkGeometry,easyVisuals.trunkMaterial,plants);batch(g,easyVisuals.frondGeometry,easyVisuals.frondMaterial,palms);batch(g,terrain.canopy,canopyMat,canopies);batch(g,terrain.birds,distantBirdMat,flocks);
  g.add(easyVisuals.makeMist(mistPositions,mistPhases));compactScenery(g);
 }
  function removeScenery(g){g.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.transientGeometry)o.geometry.dispose();});if(g.userData.cityMaterial)g.userData.cityMaterial.dispose();world.remove(g);}
  function resetScenery(){sunscar.reset();ember.reset();frost.reset();for(const s of scenery)removeScenery(s.g);scenery.length=0;}
  function update(distance,time,player){if(mode==='sunscar')sunscar.update(distance,time,player);if(mode==='frost')frost.update(distance,time,player);if(mode==='ember')ember.update(distance,time,player);for(let i=scenery.length-1;i>=0;i--)if(distance-scenery[i].z>310){removeScenery(scenery[i].g);scenery.splice(i,1);}if(mode==='easy'){easyVisuals.update(distance,time);}if(mode==='hard')hardCity.update(world,time,[lampA,lampB]);}
  setMode('medium');return {sunscar,ember,frost,updateTrafficLights,trafficLights,hardCity,easySky:easyVisuals.sky,easyVisuals,setMode,createObstacle,spawnScenery,resetScenery,update,backgrounds,palettes,shared,get mode(){return mode},get sceneryCount(){return scenery.length}};
}
