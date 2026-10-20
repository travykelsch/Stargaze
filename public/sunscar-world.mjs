import * as T from './three.module.js';
import {createPassageArt} from './passage-art.mjs?v=49';
import {createSunscarMaterials} from './sunscar-materials.mjs?v=49';
import {createCivilization} from './sunscar-civilization.mjs?v=49';
import {createStoneArch} from './easy-landmarks.mjs?v=26';
import {createRacerArt} from './sunscar-art.mjs?v=49';
import {RaceField} from './sunscar-racing.mjs?v=49';
import {desertRandom,sectionAt,tunnelBlend,shotPosition,catapultPhase,batterySpecs,SUNSCAR} from './sunscar-course.mjs?v=49';
import {flightTime,flightSpeed} from './progression.mjs?v=49';
const clamp=T.MathUtils.clamp;
export function createSunscarWorld(scene,world){
 const shared=new Set(),tiles=[],rigs=[],hazards=[],visuals=new Map(),effects=[],events=[];let active=false,field=null,lastTime=0,seed=1,mode='easy',quality=1;
 const keep=g=>{shared.add(g);return g;},box=keep(new T.BoxGeometry(1,1,1)),ball=keep(new T.IcosahedronGeometry(1,1)),cylinder=keep(new T.CylinderGeometry(1,1,1,12)),disc=keep(new T.CylinderGeometry(1,1,.05,24)),cone=keep(new T.ConeGeometry(1,1,8));
 const M=createSunscarMaterials(),{rock,darkRock,sand,wood,cloth,skin,black,metal,glow,fire}=M,material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra}),civilization=createCivilization(keep,M),passageArt=createPassageArt(world,{sunscar:{materials:M}});
 const wind={value:0},flagCloth=cloth.clone(),flagGeo=keep(new T.PlaneGeometry(4.2,2.2,8,3));flagCloth.onBeforeCompile=s=>{s.uniforms.sunscarWind=wind;s.vertexShader='uniform float sunscarWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.z+=sin(position.x*1.7+sunscarWind*3.+position.y*.7)*.38*(position.x/4.2+.5);');};flagCloth.customProgramCacheKey=()=> 'sunscar-flags-v42';
 const sky=new T.ShaderMaterial({depthWrite:false,toneMapped:false,uniforms:{},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float cloud(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}void main(){float h=smoothstep(0.,1.,vUv.y);vec3 c=mix(vec3(.77,.64,.57),vec3(.20,.39,.61),h);c=mix(c,vec3(.59,.57,.69),exp(-pow((vUv.y-.26)*5.,2.))*.28);float s=length((vUv-vec2(.27,.78))*vec2(1.6,1.));c+=vec3(1.,.70,.35)*(.17*exp(-s*11.)+.70*(1.-smoothstep(.018,.023,s)));float wisps=cloud(vUv*vec2(9.,22.))*.55+cloud(vUv*vec2(22.,55.))*.22;c=mix(c,vec3(.90,.79,.69),smoothstep(.47,.69,wisps)*smoothstep(.25,.8,vUv.y)*.18);gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`});
 const palettes=Array.from({length:4},(_,i)=>({name:['Grave Run','Glassbone Reach','Furnace Cut','Red Market'][i],sky:'#b9bdc2',rock:'#d6b799',light:0xffe1b4}));
 function mesh(g,m,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.userData.sharedGeometry=true;parent.add(o);return o;}
 function pillarGeo(variant){const vertices=[],indices=[],sides=24,rows=24;
  for(let j=0;j<=rows;j++)for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,t=j/rows,ledge=1+.16*Math.sin(j*1.35+variant)+.11*Math.sin(a*5+j*.31)+.04*Math.sin(a*11+j*2.1),r=(.82+.18*Math.sin(t*7+variant))*(j===rows?.48:1)*ledge;vertices.push(Math.cos(a)*r+Math.sin(t*3+variant)*.1,t-.5,Math.sin(a)*r);if(j&&k){const n=j*(sides+1)+k;indices.push(n,n-sides-2,n-1,n,n-sides-1,n-sides-2);}}
  for(const j of [0,rows]){const center=vertices.length/3;vertices.push(Math.sin(j/rows*3+variant)*.1,j/rows-.5,0);for(let k=0;k<sides;k++){const a=j*(sides+1)+k,b=a+1;if(j===0)indices.push(center,a,b);else indices.push(center,b,a);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return keep(g);
 }
 const pillars=[0,1,2,3].map(pillarGeo),arch=keep(createStoneArch(7,38));arch.deleteAttribute('color');
 // These are closed sandstone volumes with a genuine open interior, not a dark
 // plane painted over the course. The visible triangles are the collision mesh.
 function tunnelGeo(){const outer=new T.Shape([[-78,-50],[-78,105],[-50,125],[35,118],[78,95],[78,-50]].map(p=>new T.Vector2(...p))),hole=new T.Path([[-42,-35],[-42,18],[-36,31],[-22,39],[0,43],[22,39],[36,31],[42,18],[42,-35]].map(p=>new T.Vector2(...p)));hole.closePath();outer.holes.push(hole);const g=new T.ExtrudeGeometry(outer,{depth:190,steps:1,bevelEnabled:false});g.translate(0,0,-95);g.computeBoundingSphere();return keep(g);}
 const tunnel=tunnelGeo();
 function cliffGeo(variant){const vertices=[],indices=[],rows=22,cols=28;
  const profile=[[42,-31],[42,0],[43,19],[47,36],[45,57],[52,66],[48,96],[60,126],[83,133],[110,100],[112,-31]];
  for(let j=0;j<=cols;j++){const z=j/cols*190-95;
   for(let k=0;k<profile.length;k++){const [x,y]=profile[k],edge=Math.sin(Math.PI*j/cols),noise=(Math.sin(z*.049+variant+k*.4)*3.5+Math.sin(z*.19+k*.7)*1.1)*edge;
    const pocket=48*(.5+.5*Math.cos((z+95)/190*Math.PI*2));vertices.push(x+pocket+Math.max(0,k>1?1:.18)*noise,y+Math.sin(z*.075+k+variant)*edge*2.3,z);}
  }
  const n=profile.length;for(let j=0;j<cols;j++)for(let k=0;k<n;k++){const a=j*n+k,b=j*n+(k+1)%n,c=(j+1)*n+k,d=(j+1)*n+(k+1)%n;indices.push(a,b,c,b,d,c);}
  const caps=T.ShapeUtils.triangulateShape(profile.map(p=>new T.Vector2(...p)),[]);for(const end of [0,cols])for(const [a,b,c]of caps){const k=end*n;if(end===0)indices.push(k+a,k+c,k+b);else indices.push(k+a,k+b,k+c);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return keep(g);
 }
 const wallGeos=[0,1,2].map(cliffGeo),marketWalls=wallGeos.map(g=>keep(g.clone().translate(48,0,0)));
 function compact(group){const batches=new Map();for(const o of [...group.children])if(o.isMesh&&o.geometry!==null){const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}for(const parts of batches.values())if(parts.length>1){const batch=new T.InstancedMesh(parts[0].geometry,parts[0].material,parts.length);for(let i=0;i<parts.length;i++){parts[i].updateMatrix();batch.setMatrixAt(i,parts[i].matrix);parts[i].userData.batch={mesh:batch,index:i};group.remove(parts[i]);}batch.instanceMatrix.needsUpdate=true;batch.userData.sharedGeometry=true;batch.receiveShadow=parts.some(p=>p.receiveShadow);batch.castShadow=parts.some(p=>p.castShadow);group.add(batch);}}
 function courseObject(a){const terrain=M.themes[a.section];const g=new T.Group();g.position.set(0,0,-a.z);const collisionShapes=[];
  const ground=mesh(box,sand,g,0,-31.5,0,170,3,190);ground.receiveShadow=true;collisionShapes.push(ground);
  if(a.section===3){const o=mesh(tunnel,terrain,g);o.userData.concave=true;collisionShapes.push(o);for(const side of [-1,1])for(let j=0;j<4;j++){mesh(box,wood,g,side*39,2,-80+j*50,.7,4,.7);mesh(cone,fire,g,side*38.7,4.7,-80+j*50,.75,2.3,.75);mesh(ball,fire,g,side*38.7,4.2,-80+j*50,.6,.9,.6);}}
  else if(a.section===1||a.section===2||a.section===5){for(const side of [-1,1]){const o=mesh((a.section===5?marketWalls:wallGeos)[a.index%3],terrain,g);o.scale.x=side;o.material.side=T.DoubleSide;o.userData.concave=true;collisionShapes.push(o);}}
  if(a.section===3){for(let z=-88;z<96;z+=38){for(const side of [-1,1]){mesh(box,black,g,side*40,0,z,.65,56,.6);mesh(box,glow,g,side*39.6,11,z,.16,6,.7);}mesh(box,black,g,0,40,z,47,.6,.8);mesh(box,glow,g,0,39.6,z,10,.12,1);}}
  for(const c of collisionShapes){c.receiveShadow=true;c.castShadow=c!==ground;}world.add(g);return {...a,g,shape:collisionShapes[0],collisionShapes,environment:'sunscar',baseX:0,baseY:0,baseZ:-a.z};
 }
 function obstacle(a){if(a.category==='passage')return passageArt.create(a);if(a.category==='course')return courseObject(a);const g=new T.Group();g.position.set(a.x,a.y,-a.z);let shape;
  if(a.category==='pillar')shape=mesh(pillars[Math.floor(a.phase)%4],M.themes[sectionAt(a.z).type],g,0,0,0,a.radius,a.height,a.radius);
  else if(a.category==='gate'){shape=mesh(arch,M.ivory,g,0,0,0,1.48,1.25,1.3);shape.userData.ownedArch=true;}
  else shape=mesh(ball,darkRock,g,0,0,0,a.radius,a.radius,a.radius);
  shape.castShadow=shape.receiveShadow=true;const shadow=a.category==='shot'?mesh(disc,new T.MeshBasicMaterial({color:0x573e2d,transparent:true,opacity:.28,depthWrite:false}),g,0,-30-a.y,0,2.2,1,2.2):null;if(shadow)shadow.userData.ownedMaterial=true;
  world.add(g);return {...a,g,shape,shadow,collisionShapes:[shape],environment:'sunscar',baseX:a.x,baseY:a.y,baseZ:-a.z,collidable:a.category!=='shot'};
 }
 function motion(a,distance,time){if(a.category==='shot'){const p=shotPosition(a,time);a.g.position.set(p.x,p.y,p.z);a.shape.rotation.set(time*2.1,time*1.3,time*.8);if(a.shadow){a.shadow.position.y=-29.85-p.y;a.shadow.visible=p.active&&p.y>-30;}a.g.visible=a.collidable=p.active;if(!a.launched&&p.age>=0){a.launched=true;events.push({type:'catapult',x:a.origin.x,y:a.origin.y,forward:-a.origin.z,time});}if(!a.impacted&&p.active&&p.y<-28){a.impacted=true;addEffect('impact',p.x,-28,-p.z,time);events.push({type:'impact',x:p.x,y:p.y,forward:-p.z,time});}if(p.y<-30)a.collidable=a.g.visible=false;}else a.g.position.set(a.baseX,a.baseY,a.baseZ);}
 const farMaterials=[0xaea1a1,0x9b9eaf,0x91a7b7].map(c=>material(c));const horizon=new T.Group();scene.add(horizon);const randFar=desertRandom(64117);
 for(let layer=0;layer<3;layer++)for(let i=0;i<13;i++){const x=(i-6)*145+(randFar()-.5)*40,h=150+randFar()*160;mesh(pillars[(i+layer)%4],farMaterials[layer],horizon,x,-80+h*.5-layer*12,-780-layer*130,45+randFar()*35,h,45+randFar()*25);}
 compact(horizon);
 function flag(parent,x,y,z,rand){mesh(cylinder,wood,parent,x,y,z,.15,12,.15);const f=mesh(flagGeo,flagCloth,parent,x+2.1,y+4,z);f.rotation.z=(rand()-.5)*.15;}
 function camp(parent,index,rand,battery){const {side,slot,elevated}=battery,x=side*55,z=-slot-45,base=elevated?-7:-25;mesh(box,darkRock,parent,x,base-4,z,23,9,27);mesh(box,black,parent,x,base+.2,z,22,.7,25);
  for(let j=0;j<3;j++){mesh(cone,cloth,parent,x+side*(13+j*6),base-1,z+12-j*12,6,10,7);mesh(cylinder,black,parent,x-side*9,base+3,z-10+j*8,1.2,3,1.2);}
  const crew=[];for(let j=0;j<7;j++){const ax=x+(rand()-.5)*18,az=z+(rand()-.5)*18;crew.push(civilization.actor(parent,ax,base+3.5,az,j%3,j===0?'loader':j===1?'signal':j===2?'mechanic':'cheer',rand()*6.28));}
  flag(parent,x-side*11,base+10,z-12,rand);flag(parent,x+side*11,base+10,z+12,rand);
  // Scavenged counterweight launcher, bow-string and ratchet machinery.
  const rig=new T.Group();rig.position.set(x,base,z);parent.add(rig);mesh(civilization.rigBody,metal,rig);const arm=new T.Group();arm.position.y=2;rig.add(arm);mesh(civilization.rigArm,metal,arm);const loaded=mesh(ball,darkRock,arm,0,5,0,1.8,1.8,1.8);
  rigs.push({arm,loaded,index,side,slot,crew});
 }
 function spawn(index,sourceSeed){const rand=desertRandom(sourceSeed+index*4373),g=new T.Group(),z=index*190,type=sectionAt(z+95).type;g.position.z=-z;world.add(g);const tile={g,z,life:null};tiles.push(tile);
  // Varied mesas, sandstone scree and dunes extend beyond the collision course.
  for(const side of [-1,1])for(let j=0;j<4;j++){const x=side*(69+rand()*52),h=25+rand()*74,zz=-j*52;mesh(pillars[(index+j)%4],rock,g,x,-30+h*.5,zz,11+rand()*15,h,13+rand()*20);if(type===0||type===4){const dune=mesh(ball,sand,g,side*(45+rand()*25),-34,-j*55,28+rand()*20,5+rand()*6,47);dune.rotation.y=rand();}}
  for(const battery of batterySpecs(index))camp(g,index,rand,battery);
  if(type===5){for(const side of [-1,1]){flag(g,side*49,-21,-70,rand);for(let row=0;row<4;row++)mesh(box,wood,g,side*(52+row*4),-24+row*3,-92,5,2,95);}}
  // Close rubble and scarred track furniture provide parallax against the mesas.
  for(const side of [-1,1])for(let j=0;j<5;j++){const zz=-20-j*35;mesh(box,black,g,side*(36+rand()*3),-28.5,zz,2.6,2.4,5.5);mesh(box,cloth,g,side*36.3,-27,zz,.25,.55,4);mesh(ball,darkRock,g,side*(47+rand()*8),-29,zz,3,1.4,5);}
  if(index%5===2){const giant=mesh(arch,rock,g,(index%2?1:-1)*160,18,-90,4,4,4);giant.rotation.y=(rand()-.5)*.45;}
  if(index%4===0){const wreck=mesh(box,black,g,(index%2?1:-1)*45,-26,-90,9,4,14);wreck.rotation.set(.3,.4,.6);for(let j=0;j<5;j++)mesh(box,black,g,(index%2?1:-1)*(41+rand()*13),-29.6,-60-j*9,2,.25,3);}

  tile.life=civilization.decorate(g,index,sourceSeed);compact(g);
 }
 const racerArt=createRacerArt(keep,metal,glow),visualPool=[];
 function racerVisual(a){let v=visualPool.find(v=>v.style===a.style);if(v)visualPool.splice(visualPool.indexOf(v),1);else{const model=racerArt.make(a);v={...model,shape:model.collisionShapes[0],environment:'sunscar',category:'racer',radius:5,maxR:10.5,depth:9,collidable:true,nearAwarded:true,style:a.style};}v.id=a.id;v.nearest=Infinity;v.nearAwarded=true;v.enteredNear=false;v.g.visible=active;world.add(v.g);visuals.set(a.id,v);return v;}
 function addEffect(kind,x,y,forward,time,strength=1){effects.push({kind,x,y,forward,time,phase:time*31+x,strength});if(effects.length>SUNSCAR.maxEffects)effects.shift();}
 const dotData=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const f=Math.max(0,1-Math.hypot(x-15.5,y-15.5)/15.5),i=(y*32+x)*4;dotData.set([255,255,255,Math.round(f*f*255)],i);}const dot=new T.DataTexture(dotData,32,32,T.RGBAFormat);dot.needsUpdate=true;
 function particleMaterial(color,size,opacity,blending=T.NormalBlending){const m=new T.PointsMaterial({map:dot,color,size,transparent:true,opacity,depthWrite:false,blending,toneMapped:blending!==T.AdditiveBlending});m.onBeforeCompile=s=>{s.vertexShader='attribute float particleAlpha;varying float vParticleAlpha;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvParticleAlpha=particleAlpha;');s.fragmentShader='varying float vParticleAlpha;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a*=vParticleAlpha;\n#include <opaque_fragment>');};m.customProgramCacheKey=()=> 'sunscar-particle-life-v43';return m;}
 const dustAlpha=new Float32Array(1536),smokeAlpha=new Float32Array(512),sparkAlpha=new Float32Array(512),dustPositions=new Float32Array(1536*3),dustGeo=keep(new T.BufferGeometry());dustGeo.setAttribute('position',new T.BufferAttribute(dustPositions,3));dustGeo.setAttribute('particleAlpha',new T.BufferAttribute(dustAlpha,1));const dust=new T.Points(dustGeo,particleMaterial(0xdab28d,4.7,.30));dust.frustumCulled=false;dust.userData.sharedGeometry=true;world.add(dust);
 const smokePositions=new Float32Array(512*3),smokeGeo=keep(new T.BufferGeometry());smokeGeo.setAttribute('position',new T.BufferAttribute(smokePositions,3));smokeGeo.setAttribute('particleAlpha',new T.BufferAttribute(smokeAlpha,1));const smoke=new T.Points(smokeGeo,particleMaterial(0x423b49,5.4,.53));smoke.frustumCulled=false;smoke.userData.sharedGeometry=true;world.add(smoke);
 const shadowGeo=keep(new T.PlaneGeometry(1,1));shadowGeo.rotateX(-Math.PI/2);const groundShadows=new T.InstancedMesh(shadowGeo,new T.MeshBasicMaterial({map:dot,color:0x51361e,transparent:true,opacity:.25,depthWrite:false}),SUNSCAR.maxRacers);groundShadows.count=0;groundShadows.frustumCulled=false;groundShadows.userData.sharedGeometry=true;world.add(groundShadows);const shadowMatrix=new T.Matrix4(),shadowQ=new T.Quaternion();
 const debris=new T.InstancedMesh(box,black,96);debris.count=0;debris.userData.sharedGeometry=true;debris.frustumCulled=false;world.add(debris);const debrisMatrix=new T.Matrix4(),debrisRotation=new T.Quaternion();
 const sparkPositions=new Float32Array(512*3),sparkGeo=keep(new T.BufferGeometry());sparkGeo.setAttribute('position',new T.BufferAttribute(sparkPositions,3));sparkGeo.setAttribute('particleAlpha',new T.BufferAttribute(sparkAlpha,1));const sparks=new T.Points(sparkGeo,particleMaterial(0xffba54,1.9,.95,T.AdditiveBlending));sparks.frustumCulled=false;sparks.userData.sharedGeometry=true;world.add(sparks);
 const torchGroup=new T.Group();scene.add(torchGroup);const torchLights=[];
 function ensureTorches(){if(torchLights.length)return;for(let i=0;i<2;i++){const l=new T.PointLight(0xffae55,0,90,2);l.position.set(i?25:-25,8,-20-i*55);torchGroup.add(l);torchLights.push(l);}}
 function initialize(sourceSeed,difficulty,route,time=0,distance=0){seed=sourceSeed;mode=difficulty;field=new RaceField(route);field.reset(seed,mode,time,distance);lastTime=time;}
 function step(dt,time,distance,d,route,obstacles,player){if(!active)return;if(!field)initialize(seed,mode,route,time-dt,distance-d.speed*dt);field.step(dt,time,distance,obstacles,player);
  for(const e of field.drainEvents()){if(e.type==='bump')addEffect('sparks',e.x,e.y,e.forward,time,e.strength);if(e.type==='crash'){addEffect('explosion',e.x,e.y,e.forward,time);for(const tile of tiles)tile.life?.react(e);for(const rig of rigs)if(Math.abs(e.forward-(rig.index*190+rig.slot))<160)rig.alarm=time+1.5;}if(e.type!=='retire')events.push(e);}
  const alive=new Set(field.racers.map(a=>a.id));for(const [id,v]of visuals)if(!alive.has(id)){world.remove(v.g);if(visualPool.length<48)visualPool.push(v);visuals.delete(id);}
  hazards.length=0;for(const a of field.racers){const v=visuals.get(a.id)||racerVisual(a),relative=distance-a.forward;v.g.position.set(a.x,a.y,-a.forward);v.g.rotation.set(clamp(a.vy*.008,-.18,.18),clamp(a.vx*.009,-.25,.25),a.bank+(a.state==='crashing'?a.crashAge*5:0));v.g.children[0].castShadow=Math.abs(relative)<160;v.g.visible=active&&(a.state!=='crashing'||a.crashAge<1.1);v.collidable=v.g.visible;v.baseZ=-a.forward;v.x=a.x;v.y=a.y;v.z=a.forward;v.state=a.state;v.ratio=a.ratio;v.kind=a.kind;v.forward=a.forward;v.health=a.health;v.warning=a.warning;v.clan=a.clan;v.intent=a.intent;v.cores.visible=Math.abs(relative)<180&&a.health>1;v.panel.visible=a.health>1;v.panel.rotation.z=a.health===2?Math.sin(time*31+a.id)*.035:0;v.glass.visible=Math.abs(relative)<260;v.g.rotation.z+=(a.state==='stalled'?.07:0)*Math.sin(time*17+a.id);for(const port of v.ports)port.visible=Math.abs(relative)<400;for(const [engineIndex,f]of v.flames.entries()){f.visible=Math.abs(relative)<260&&a.state!=='crashing';const failing=a.health<2&&engineIndex===a.id%v.flames.length;f.scale.z=(a.state==='stalled'?.25:2.5+a.ratio)*(failing?.25:1)+Math.sin(time*(failing?19:42)+a.id)*.25;}hazards.push(v);}
  if(events.length>64)events.splice(0,events.length-64);lastTime=time;
 }
 function applyNetwork(racers,time,distance,d,route,obstacles,player){if(!field)initialize(seed,mode,route,time,distance);field.racers=racers;field.time=time;field.distance=distance;step(0,time,distance,d,route,obstacles,player);}
 function networkEvent(e){if(!active||!['bump','crash'].includes(e.type))return;addEffect(e.type==='bump'?'sparks':'explosion',e.x,e.y,e.forward,e.time,e.strength||1);if(e.type==='crash')for(const tile of tiles)tile.life?.react(e);events.push(e);if(events.length>64)events.shift();}
 function setFrameCost(dt){if(!active)return;quality=clamp(quality+(dt>.029?-.012:dt<.020?.002:0),.5,1);}
 function update(distance,time,player){if(!active)return;wind.value=time;
  for(let i=tiles.length-1;i>=0;i--)if(distance-tiles[i].z>400){const tile=tiles[i];tile.g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});world.remove(tile.g);tiles.splice(i,1);}
  for(let i=rigs.length-1;i>=0;i--){const r=rigs[i],age=time-(flightTime(r.index*190+r.slot,mode,'sunscar')-3.8);r.loaded.visible=age<0;if(r.index*190<distance-400){rigs.splice(i,1);continue;}const load=age<-.22?clamp((age+2.2)/1.98,0,1):age<0?-age/.22:0;r.arm.rotation.z=-load*r.side*1.05;if(Math.abs(distance-r.index*190)<460)for(const actor of r.crew)civilization.animateActor(actor,time,r.alarm||0);}
  for(const tile of tiles)tile.life?.update(time,distance,quality);const tunnel=tunnelBlend(distance);metal.envMapIntensity=.88-tunnel*.46;for(const [i,l]of torchLights.entries()){l.intensity=tunnel*(700+Math.sin(time*13+i)*65);l.position.x=(player?.x||0)+(i?19:-19);l.position.y=(player?.y||0)+9;}
  horizon.visible=active;debris.count=0;let n=0,s=0,sm=0;
  groundShadows.count=0;for(const a of field?.racers||[]){if(groundShadows.count>=SUNSCAR.maxRacers)break;shadowMatrix.compose(new T.Vector3(a.x+(a.y+30)*.6,-29.79,-a.forward+(a.y+30)*.2),shadowQ,new T.Vector3(9,1,13));groundShadows.setMatrixAt(groundShadows.count++,shadowMatrix);}groundShadows.instanceMatrix.needsUpdate=true;
  for(const a of field?.racers||[])if(a.health<2||a.state==='stalled')for(let j=0;j<Math.floor(15*quality)&&sm<512;j++){const p=a.id*3.7+j,engineOffset=a.id%2?2.4:-2.4;smokeAlpha[sm]=Math.pow(1-j/15,1.2);smokePositions.set([a.x+engineOffset+Math.sin(p+time)*j*.13,a.y+j*.30,-a.forward+4+j*1.7],sm++*3);}
  for(const a of field?.racers||[])for(let j=0;j<Math.floor(12*quality)&&n<1536;j++){const back=j*2,phase=a.id*3.7+j;dustAlpha[n]=Math.pow(1-j/12,1.4);dustPositions.set([a.x+Math.sin(phase+time)*(.5+j*.22),a.y-1-j*.16,-a.forward+5+back],n++*3);}
  for(let i=effects.length-1;i>=0;i--){const e=effects[i],age=time-e.time;if(age>2.4){effects.splice(i,1);continue;}if(e.kind==='explosion'&&age<1.2)for(let j=0;j<6&&debris.count<96;j++){const angle=j*2.399+e.phase,r=age*(8+j);debrisRotation.setFromEuler(new T.Euler(age*(j+2),age*5,angle));debrisMatrix.compose(new T.Vector3(e.x+Math.cos(angle)*r,e.y+Math.sin(angle)*r-age*age*5,-e.forward+Math.sin(j*7)*r),debrisRotation,new T.Vector3(.4,.2,.8));debris.setMatrixAt(debris.count++,debrisMatrix);}for(let j=0;j<Math.floor(18*quality)&&n<1536;j++){const angle=j*2.399+e.phase,r=age*(e.kind==='explosion'?15:7),x=e.x+Math.cos(angle)*r,y=e.y+Math.sin(angle)*r-age*age*2,z=-e.forward+Math.sin(j*7)*r;dustAlpha[n]=Math.pow(Math.max(0,1-age/2.4),1.8);dustPositions.set([x,y,z],n++*3);if(age<.75&&s<512){sparkAlpha[s]=Math.max(0,1-age/.75);sparkPositions.set([x,y,z],s++*3);}}}
  for(const geometry of [dustGeo,smokeGeo,sparkGeo])geometry.attributes.particleAlpha.needsUpdate=true;debris.instanceMatrix.needsUpdate=true;debris.visible=active;smokeGeo.setDrawRange(0,sm);smokeGeo.attributes.position.needsUpdate=true;smoke.visible=active;dustGeo.setDrawRange(0,n);sparkGeo.setDrawRange(0,s);dustGeo.attributes.position.needsUpdate=true;sparkGeo.attributes.position.needsUpdate=true;dust.visible=sparks.visible=active;
 }
 function drainEvents(){return events.splice(0);}
 function reset(){for(const tile of tiles){tile.g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});world.remove(tile.g);}tiles.length=rigs.length=hazards.length=effects.length=events.length=0;for(const v of visuals.values())world.remove(v.g);visuals.clear();field=null;debris.count=0;groundShadows.count=0;dustGeo.setDrawRange(0,0);sparkGeo.setDrawRange(0,0);smokeGeo.setDrawRange(0,0);smoke.visible=false;torchLights.forEach(l=>l.intensity=0);}
 function setActive(value){active=value;scene.environment=value?M.environment:null;torchGroup.visible=value;if(value)ensureTorches();horizon.visible=debris.visible=smoke.visible=dust.visible=sparks.visible=groundShadows.visible=value;tiles.forEach(t=>t.g.visible=value);for(const v of visuals.values())v.g.visible=value;if(!value){smokeGeo.setDrawRange(0,0);smoke.visible=false;torchLights.forEach(l=>l.intensity=0);}}
 return {materials:M,civilization,setFrameCost,get quality(){return quality},flagCloth,sky,rock,metal,palettes,obstacle,motion,spawn,step,initialize,applyNetwork,networkEvent,update,reset,setActive,drainEvents,torchLights,shared,horizon,dust,sparks,groundShadows,smoke,racerArt,visualPool,debris,get hazards(){return hazards},get field(){return field},get tiles(){return tiles},get effects(){return effects},get rigs(){return rigs},get active(){return active}};
}
