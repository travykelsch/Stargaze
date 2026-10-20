import {createHazardWarnings} from './hazard-warnings.mjs?v=36';
import * as T from './three.module.js';
import {sculptAsteroid} from './asteroid-art.mjs?v=24';
import {createLavaSplashes} from './lava-splash.mjs?v=39';
import {emberPosition} from './ember-course.mjs?v=39';
import {createEmberLandmarks} from './ember-landmarks.mjs?v=33';
import {createEmberActivity,emberRiverX} from './ember-activity.mjs?v=32';
const rnd=seed=>{let n=seed>>>0;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);};
const noiseGL=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.11)*.15;}`;
const vertex=`varying vec3 vP;varying vec3 vW;varying vec2 vU;void main(){vP=position;vU=uv;vec4 p=vec4(position,1.);
#ifdef USE_INSTANCING
p=instanceMatrix*p;
#endif
vW=(modelMatrix*p).xyz;gl_Position=projectionMatrix*modelViewMatrix*p;}`;
export const EMBER_PALETTE=[{name:'Ember',sky:'#72575e',rock:'#89736a',light:0xffbc86},{name:'Cinder Valley',sky:'#796065',rock:'#8b7065',light:0xffb37d},{name:'Ashen Citadel',sky:'#6c5965',rock:'#8b766e',light:0xffc293},{name:'Molten Reach',sky:'#7a595e',rock:'#8e7265',light:0xffb484}];
export function createEmberWorld(scene,world){
 const time={value:0},travel={value:0},tiles=[],shared=new Set(),hazards=new Set(),pools=new Map();
 const warnings=createHazardWarnings(world,0xffd29c);
 const keep=g=>(shared.add(g),g);const box=keep(new T.BoxGeometry(1,1,1));
 const rockGeos=Array.from({length:5},(_,i)=>keep(sculptAsteroid(i+14,3)));
 const landmarks=createEmberLandmarks(keep);
 const splashes=createLavaSplashes(time,keep);
 const activity=createEmberActivity(time,keep),firePool=new T.InstancedMesh(activity.flameGeometry,activity.flameMaterial,1024);firePool.count=0;firePool.frustumCulled=false;firePool.visible=false;firePool.userData.sharedGeometry=true;world.add(firePool);
 // Triplanar-like object-space surface: continuous fractures on every rotated rock.
 const stone=new T.MeshStandardMaterial({color:0x777078,roughness:.96,metalness:.10,vertexColors:true});
 function fissures(material,strength){material.onBeforeCompile=s=>{s.uniforms.uEmberTime=time;s.vertexShader='varying vec3 emberP;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nemberP=position;');s.fragmentShader='varying vec3 emberP;uniform float uEmberTime;\n'+noiseGL+'\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 vec3 ep=emberP*6.;float n=fbm(ep.xy+fbm(ep.yz));float crack=1.-smoothstep(.016,.045,abs(n-.48));float hot=crack*${strength.toFixed(2)}*(.83+.17*sin(uEmberTime*1.5+ep.z));totalEmissiveRadiance+=vec3(1.,.18,.015)*hot;diffuseColor.rgb*=.72+fbm(ep.xz*3.)*.40;`);};material.customProgramCacheKey=()=>`ember-fissures-${strength}`;}
 fissures(stone,.025);const hotStone=stone.clone();hotStone.color.setHex(0x655254);hotStone.emissive.setHex(0xff631b);hotStone.emissiveIntensity=.36;fissures(hotStone,1.3);
 const ruinMat=new T.MeshStandardMaterial({color:0x91827a,roughness:.94,vertexColors:true});fissures(ruinMat,0);
 // Separate albedo and linear height maps give rock and masonry real surface relief.
 function surfaceMaps(masonry=false){const size=128,albedo=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),r=rnd(masonry?51:73);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const seam=masonry?(y%16<1||(x+(Math.floor(y/16)%2)*16)%32<1):false,grain=(r()-.5)*24+Math.sin(x*.7+y*.9)*5,base=(seam?85:188)+grain,h=(seam?58:145)+grain;const k=(y*size+x)*4;albedo.set([base,base*.96,base*.93,255],k);height.set([h,h,h,255],k);}const tex=(a,srgb)=>{const t=new T.DataTexture(a,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};return {map:tex(albedo,true),bumpMap:tex(height,false)};}
 const rockMaps=surfaceMaps(),masonryMaps=surfaceMaps(true);Object.assign(stone,rockMaps,{bumpScale:.17});Object.assign(hotStone,rockMaps,{bumpScale:.14});Object.assign(ruinMat,masonryMaps,{bumpScale:.24});
 const lava=new T.ShaderMaterial({uniforms:{uTime:time,uTravel:travel},vertexShader:vertex,fragmentShader:`
uniform float uTime,uTravel;
varying vec3 vP,vW;
varying vec2 vU;
${noiseGL}
void main(){
 vec2 p=vec2(vW.x,vW.z-uTravel)*.065;
 float n=fbm(p+vec2(uTime*.04,-uTime*.13));
 float plates=smoothstep(.49,.66,n);
 float veins=1.-smoothstep(.025,.085,abs(fbm(p*2.7+uTime*.018)-.50));
 vec3 molten=mix(vec3(.57,.035,.005),vec3(1.50,.30,.025),veins);
 vec3 c=mix(molten,vec3(.035,.019,.021),plates*.88);
 c+=vec3(.17,.022,0.)*sin(p.y*2.+uTime*.8)*.25;
 float zz=vW.z-uTravel;
 float mainRiver=1.-smoothstep(23.,31.,abs(vW.x-sin(zz*.009)*13.));
 float branchA=1.-smoothstep(7.,13.,abs(vW.x-(sin(zz*.014)*95.+65.)));
 float branchB=1.-smoothstep(6.,12.,abs(vW.x-(sin(zz*.011+2.)*110.-70.)));
 float river=(abs(vP.y)>.01||vW.y> -40.)?1.:max(mainRiver,max(branchA,branchB));
 vec3 crust=vec3(.046,.028,.030)*(.72+fbm(vec2(vW.x,zz)*.18)*.6);
 c=mix(crust,c,river);
 gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const lavaGeo=keep(new T.PlaneGeometry(1,1,1,1));lavaGeo.rotateX(-Math.PI/2);
 // A warm moving ash sky; calm enough to retain silhouettes.
 const sky=new T.ShaderMaterial({depthWrite:false,depthTest:false,fog:false,uniforms:{uTime:time},vertexShader:vertex,fragmentShader:`uniform float uTime;varying vec2 vU;${noiseGL}void main(){vec2 p=vU;vec3 c=mix(vec3(.88,.34,.14),vec3(.075,.048,.095),smoothstep(.05,.95,p.y));float smoke=fbm(p*vec2(5.,9.)+vec2(uTime*.012,-uTime*.003));float layers=fbm(p*vec2(11.,17.)+vec2(uTime*.018,0.));float cover=smoothstep(.36,.72,smoke*.7+layers*.3);c=mix(c,vec3(.20,.13,.16),cover*.48);float sun=exp(-length((p-vec2(.72,.36))*vec2(1.,1.5))*28.);c+=vec3(.64,.27,.10)*sun;gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`});
 const vaporMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:time},vertexShader:'uniform float uTime;'+vertex.replace('vec4 p=vec4(position,1.);','vec3 smoke=position;smoke.x+=sin(uTime*.38+uv.y*7.)*.09*uv.y;smoke.y+=sin(uTime*.23+uv.x*8.)*.025;vec4 p=vec4(smoke,1.);'),fragmentShader:`uniform float uTime;varying vec2 vU;${noiseGL}void main(){vec2 p=vU;float n=fbm(p*vec2(4.,7.)+vec2(uTime*.065,-uTime*.20));float edge=sin(p.x*3.14159)*sin(p.y*3.14159);float a=smoothstep(.22,.68,n)*edge*.58;gl_FragColor=vec4(mix(vec3(.18,.16,.19),vec3(.51,.39,.36),p.y),a);
#include <colorspace_fragment>
}`});
 const smokeGeo=keep(new T.PlaneGeometry(1,1,8,12));
 const fallVertex=vertex.replace('vP=position;vU=uv;vec4 p=vec4(position,1.);','vP=position;vU=uv;vec3 flow=position;float edge=sin(uv.y*3.14159);flow.x+=sin(uv.y*32.-uTime*6.+uv.x*15.)*.035*edge;flow.z+=sin(uv.y*18.-uTime*4.+uv.x*8.)*.10*edge;vec4 p=vec4(flow,1.);');
 const fallMaterial=new T.ShaderMaterial({transparent:true,depthWrite:true,side:T.DoubleSide,uniforms:{uTime:time},vertexShader:'uniform float uTime;'+fallVertex,fragmentShader:`uniform float uTime;varying vec2 vU;${noiseGL}void main(){float n=fbm(vec2(vU.x*15.,vU.y*18.+uTime*2.4));float edge=smoothstep(.0,.08+n*.04,vU.x)*smoothstep(1.,.92-n*.04,vU.x);float strands=sin(vU.x*54.+n*5.);float breaking=smoothstep(.02,.16,vU.y);float alpha=edge*mix(smoothstep(-.3,.2,strands),1.,breaking);float crust=smoothstep(.55,.78,n);vec3 c=mix(vec3(1.75,.43,.025),vec3(.14,.025,.012),crust*.85);c+=vec3(.7,.22,.025)*pow(max(0.,strands),10.);if(alpha<.07)discard;gl_FragColor=vec4(c,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const ashMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:time,uTravel:travel},vertexShader:`uniform float uTime,uTravel;attribute float phase;varying float vHot;void main(){vec3 p=position;vHot=step(.62,fract(phase));p.x+=sin(uTime*.4+phase)*5.;p.y=mod(p.y+uTime*(vHot>.5?3.5:-1.4)+80.,140.)-65.;p.z=mod(p.z+uTravel*.18+300.,320.)-280.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((vHot>.5?170.:55.)/-mv.z,1.,6.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float vHot;void main(){vec2 p=(gl_PointCoord-.5)*vec2(1.4,.8);float a=smoothstep(.5,.08,length(p));gl_FragColor=vec4(mix(vec3(.60,.51,.48),vec3(1.,.43,.09),vHot),a*(.35+vHot*.4));
#include <colorspace_fragment>
}`});
 const ashG=new T.BufferGeometry(),ap=[],ph=[],ar=rnd(883);for(let i=0;i<420;i++){ap.push((ar()-.5)*140,ar()*140-65,-ar()*250);ph.push(ar()*7);}ashG.setAttribute('position',new T.Float32BufferAttribute(ap,3));ashG.setAttribute('phase',new T.Float32BufferAttribute(ph,1));const ash=new T.Points(ashG,ashMat);ash.frustumCulled=false;scene.add(ash);ash.visible=false;
 const fill=new T.PointLight(0xff661b,0,190,1.7);fill.position.set(0,-38,-35);scene.add(fill);
 const matrix=new T.Matrix4(),q=new T.Quaternion();
 function inst(g,geometry,material,list){if(!list.length)return;const m=new T.InstancedMesh(geometry,material,list.length);list.forEach((p,i)=>{q.setFromEuler(new T.Euler(...(p.rot||[0,0,0])));matrix.compose(new T.Vector3(...p.p),q,new T.Vector3(...p.s));m.setMatrixAt(i,matrix);});m.instanceMatrix.needsUpdate=true;m.userData.sharedGeometry=true;g.add(m);return m;}
 function add(g,geo,mat,p,s){const m=new T.Mesh(geo,mat);m.position.set(...p);m.scale.set(...s);m.userData.sharedGeometry=true;g.add(m);return m;}
 function volcanoGeometry(variant){const r=rnd(810+variant),rings=9,segments=28,verts=[],colors=[],indices=[];for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,h=j/rings,rough=Math.sin(a*5+variant)*.06+Math.sin(a*9+variant*2)*.035;const rad=(1-h)**1.65*.86+.14+rough*(1-h*.5),y=h*.94+(Math.sin(a*4+variant)*.025)*h;verts.push(Math.cos(a)*rad,y,Math.sin(a)*rad);const c=new T.Color().setRGB(.65+r()*.12,.59+r()*.09,.59+r()*.1);colors.push(c.r,c.g,c.b);if(j<rings&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}}
 // Inner crater slopes down to an open, molten caldera instead of a cone tip.
 const start=verts.length/3;for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;verts.push(Math.cos(a)*.075,.78,Math.sin(a)*.075);colors.push(.37,.30,.30);if(i<segments){const o=rings*(segments+1)+i;indices.push(o,start+i,o+1,o+1,start+i,start+i+1);}}
 const g=new T.BufferGeometry(),uvs=[];for(let i=0;i<verts.length;i+=3)uvs.push(Math.atan2(verts[i+2],verts[i])/Math.PI*.5+.5,verts[i+1]*3);g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return keep(g);}
 const volcanoes=Array.from({length:3},(_,i)=>volcanoGeometry(i));
 // Broken crenellated walls/towers are batched stone blocks; gaps are real geometry.
 function castle(parts,x,y,z,scale,rand){const block=(dx,dy,dz,sx,sy,sz,tilt=0)=>parts.push({p:[x+dx*scale,y+dy*scale,z+dz*scale],s:[sx*scale,sy*scale,sz*scale],rot:[0,0,tilt]});
 for(let j=0;j<10;j++){if(j===4||j===5)continue;const h=3+rand()*4;block((j-4.5)*2,h*.5,0,2,h,1.7);if(j%2===0)block((j-4.5)*2,h+.5,0,1.2,1.1,1.8);}
 for(const side of [-1,1]){const h=10+rand()*6;for(let j=0;j<5;j++){const width=5-j*.3;block(side*11,j*h/5+h/10,0,width,h/5-.08,width);}for(let i=0;i<4;i++)if(rand()>.2)block(side*11+(i%2?1.6:-1.6),h+.7,i<2?-1.6:1.6,1.2,1.4,1.2);}
 for(let j=0;j<12;j++)block((rand()-.5)*27,rand(),3+rand()*8,1+rand()*2,1+rand()*2,1+rand()*2,(rand()-.5)*.7);
 }
 function spawn(index,seed){const r=rnd(seed+index*773),g=new T.Group(),z=index*190;g.position.z=-z;world.add(g);tiles.push({g,z});const banks=[[],[],[]],mounts=[[],[],[]],ruins=[[],[],[]],islands=[[],[],[]],falls=[],smokes=[],calderas=[],burstSources=[];
 add(g,lavaGeo,lava,[0,-45,-95],[1200,1,192]);
 for(const side of [-1,1]){
  // Continuous, layered canyon cliffs: tall silhouettes remain in the portrait view.
  const cliff=add(g,landmarks.cliffs[(index+(side>0?0:1))%3],stone,[side*65,0,-95],[1,1,1]);if(side<0)cliff.rotation.y=Math.PI;
  for(let j=0;j<5;j++){const h=25+r()*25;banks[j%3].push({p:[side*(78+r()*17),-31,-j*43],s:[20,h,23],rot:[0,r()*6,side*.12]});}
  for(let j=0;j<2;j++){const height=65+r()*100,width=height*(.60+r()*.17),xx=side*(85+width*.90),zz=-j*120-r()*35;
   mounts[(j+index)%3].push({p:[xx,-44,zz],s:[width,height,width],rot:[0,r()*6,0]});
   calderas.push({p:[xx,-44+height*.79,zz],s:[width*.17,1,width*.17]});
   burstSources.push({x:xx,y:-44+height*.84,z:zz,width:width*.10,speed:58,variation:25,spread:24,phase:index*.93+j*1.7+(side>0?2.2:0),count:90});
   smokes.push({p:[xx,-44+height+48,zz],s:[width,115+r()*60,1],rot:[0,-side*.12,side*.10]});
   smokes.push({p:[xx+side*16,-44+height+105,zz-4],s:[width*1.35,125,1],rot:[0,0,side*.19]});
   // Lava follows the volcano's surface and broad cliff shelves, not a floating rigid strip.
   falls.push({p:[xx-side*width*.17,-44+height*.79,zz+width*.20],s:[4+r()*3,height*1.02,1],rot:[0,-side*.25,-side*.67]});
  }
  const cx=side*(96+r()*9),cz=-70-r()*55,cy=4+r()*12;
  banks[0].push({p:[cx,cy-15,cz],s:[37,26,34]});ruins[index%3].push({p:[cx,cy+6,cz],s:[1.65,1.65,1.65],rot:[0,side*.15,0]});
  const radius=18+r()*4,ix=side*(66+r()*6),iy=40+r()*24,iz=-25-r()*130,variant=(index+(side>0?1:0))%3;
  islands[variant].push({p:[ix,iy,iz],s:[radius,radius,radius],rot:[0,r()*3,0]});
  falls.push({p:[ix-side*radius*.55,iy+radius*.26,iz+radius*.25],s:[4+r()*3,iy+44+radius*.26,1],rot:[0,0,side*.04]});
  banks[1].push({p:[side*62,13,-155],s:[12,8,13]});falls.push({p:[side*53,17,-144],s:[5,62,1]});
  if(index%2===0)ruins[(index+1)%3].push({p:[ix,iy+radius*.30,iz],s:[.58,.58,.58],rot:[0,side*.18,0]});
  const riverZ=side>0?58:140;burstSources.push({x:emberRiverX(z+riverZ)+side*12,y:-43,z:-riverZ,width:4,speed:43,variation:18,spread:15,phase:index*1.31+(side>0?0:2.4),count:125});
  smokes.push({p:[side*44,18,-riverZ],s:[34,120,1],rot:[0,0,-side*.1]});
 }
 banks.forEach((list,i)=>inst(g,rockGeos[i],stone,list));mounts.forEach((list,i)=>inst(g,volcanoes[i],stone,list));ruins.forEach((list,i)=>inst(g,landmarks.fortresses[i],ruinMat,list));islands.forEach((list,i)=>inst(g,landmarks.islands[i],stone,list));inst(g,landmarks.fall,fallMaterial,falls);inst(g,smokeGeo,vaporMat,smokes);inst(g,lavaGeo,lava,calderas);
 const burst=new T.Points(activity.burstGeometry(burstSources,r),activity.burstMaterial);burst.frustumCulled=false;burst.userData.transientGeometry=true;burst.userData.eruptionSources=burstSources;g.add(burst);
 // Small lava pops are decorative below the flight floor, never hidden hazards.
 const pops=[];for(let i=0;i<45;i++)pops.push((r()-.5)*110,-43-r()*4,-r()*190);for(const f of falls){const base=new T.Vector3(0,-f.s[1],0).applyEuler(new T.Euler(...(f.rot||[0,0,0]))).add(new T.Vector3(...f.p));for(let i=0;i<8;i++)pops.push(base.x+(r()-.5)*7,-44,base.z+(r()-.5)*6);}const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(pops,3));const pm=popMaterial;const p=new T.Points(pg,pm);p.userData.transientGeometry=true;p.frustumCulled=false;g.add(p);
 }
 const popMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:time},vertexShader:`uniform float uTime;varying float life;void main(){float phase=fract(uTime*.55+position.x*.13+position.z*.037);life=sin(phase*3.14159);vec3 p=position;p.y+=life*(7.+fract(position.z)*9.);p.x+=sin(phase*6.28)*1.6;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(1300./max(1.,-mv.z),1.,13.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float life;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.43,.05,smoothstep(.5,.05,d)*life);
#include <colorspace_fragment>
}`});
 const plumeMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uTime:time},vertexShader:`uniform float uTime;attribute float phase;varying float fade;void main(){float t=fract(uTime*.46+phase);vec3 p=position;p.x*=t;p.z*=t;p.y=sin(t*3.14159)*position.y;fade=sin(t*3.14159);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((1600.+phase*600.)/max(1.,-mv.z),1.,24.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float fade;void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.25+fade*.27,.035,smoothstep(.5,.09,r)*fade*.85);
#include <colorspace_fragment>
}`});
 function obstacle(a){
 const g=new T.Group();g.position.set(a.x,a.y,-a.z);
 if(a.category==='eruption'){
  const fluid=splashes.create(a);g.add(fluid.group);world.add(g);
  return {...a,g,shape:fluid.surface,collisionShapes:[fluid.surface],fluid,collidable:false,environment:'ember',baseX:a.x,baseY:0,baseZ:-a.z};
 }
 const geo=a.category==='island'?landmarks.islands[Math.floor(a.phase)%3]:rockGeos[Math.floor(a.phase)%5],material=a.category==='island'?stone:hotStone,shape=add(g,geo,material,[0,0,0],[a.radius,a.radius*(a.category==='small'?.85:1),a.radius]);shape.userData.concave=true;shape.visible=false;
 const key=geo.uuid+material.uuid;if(!pools.has(key)){const batch=new T.InstancedMesh(geo,material,1024);batch.count=0;batch.frustumCulled=false;batch.userData.sharedGeometry=true;world.add(batch);pools.set(key,batch);}
 const obstacle={...a,g,shape,collisionShapes:[shape],key,collidable:false,environment:'ember',baseX:a.x,baseY:a.y,baseZ:-a.z};
 world.add(g);hazards.add(obstacle);return obstacle;
 }
 function motion(a,distance,t,d){
  if(a.fluid){const state=a.fluid.update(t);a.collidable=state.active&&a.fluid.surface.visible;a.warning=state.warning;a.g.visible=a.fluid.group.visible;return;}
  const p=emberPosition(a,t);a.collidable=p.active;a.g.visible=p.active;a.velocityNow=p;a.g.position.set(p.x,p.y,p.z);
  if(a.category==='island')a.g.rotation.set(Math.sin(t*.3+a.phase)*.025,a.phase+t*.025,Math.cos(t*.25+a.phase)*.025);else a.g.rotation.set(t*a.spin*.55+a.phase,t*a.spin*.35,0);
 }
 function remove(tile){tile.g.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.transientGeometry)o.geometry.dispose();});world.remove(tile.g);}
 function reset(){warnings.reset();tiles.forEach(remove);tiles.length=0;hazards.clear();firePool.count=0;sparks.count=0;for(const p of pools.values())p.count=0;}
 const landmark=new T.Group();scene.add(landmark);add(landmark,volcanoes[2],stone,[-170,-100,-1050],[340,340,280]);add(landmark,smokeGeo,vaporMat,[-175,350,-1060],[260,330,1]);add(landmark,volcanoes[0],stone,[440,-100,-1160],[250,210,220]);landmark.visible=false;
 let enabled=false;function setActive(v){warnings.setActive(v);enabled=v;landmark.visible=v;ash.visible=v;fill.visible=v;firePool.visible=v;sparks.visible=v;for(const p of pools.values())p.visible=v;fill.intensity=v?320:0;}
 const firePosition=new T.Vector3(),fireScale=new T.Vector3(),tailDirection=new T.Vector3();
 const sparkGeo=keep(new T.SphereGeometry(1,5,3)),sparkMat=new T.MeshBasicMaterial({color:0xffa333}),sparks=new T.InstancedMesh(sparkGeo,sparkMat,2048);sparks.count=0;sparks.frustumCulled=false;sparks.userData.sharedGeometry=true;world.add(sparks);
 function update(distance,t,player){warnings.update(hazards,t,player);
 firePool.count=0;sparks.count=0;for(const p of pools.values())p.count=0;
 for(const a of hazards){
  if(a.g.parent!==world){hazards.delete(a);continue;}if(!a.g.visible||!a.collidable)continue;
  const pool=pools.get(a.key);if(pool.count>=1024)continue;a.g.updateMatrix();a.shape.updateMatrix();matrix.multiplyMatrices(a.g.matrix,a.shape.matrix);pool.setMatrixAt(pool.count++,matrix);
  if(a.category==='small'&&firePool.count<1024){
   const r=a.radius,p=a.velocityNow,dir=tailDirection.set(-p.vx,-p.vy,-p.vz).normalize();firePosition.copy(a.g.position).addScaledVector(dir,r*2.2);q.setFromUnitVectors(T.Object3D.DEFAULT_UP,dir);fireScale.set(r*.85,r*1.15,r*.85);matrix.compose(firePosition,q,fireScale);firePool.setMatrixAt(firePool.count++,matrix);
   for(let i=0;i<6&&sparks.count<2048;i++){const age=.035+i*.025;firePosition.copy(a.g.position).addScaledVector(dir,r+Math.hypot(p.vx,p.vy,p.vz)*age);firePosition.x+=Math.sin(t*17+i*13)*r*.6;firePosition.z+=Math.cos(t*19+i*7)*r*.5;fireScale.setScalar(r*(.11-i*.012));matrix.compose(firePosition,q,fireScale);sparks.setMatrixAt(sparks.count++,matrix);}
  }
 }
 for(const p of pools.values()){p.visible=enabled;p.instanceMatrix.needsUpdate=true;}firePool.instanceMatrix.needsUpdate=true;sparks.instanceMatrix.needsUpdate=true;sparks.visible=enabled;time.value=t;travel.value=distance;
 for(let i=tiles.length-1;i>=0;i--)if(distance-tiles[i].z>310){remove(tiles[i]);tiles.splice(i,1);}if(enabled)fill.intensity=320+Math.sin(t*1.8)*25;
 }
 return {retire:a=>hazards.delete(a),warnings,splashes,spawn,obstacle,motion,reset,update,setActive,sky,palettes:EMBER_PALETTE,shared,pools,activity,firePool,stone,hotStone,ruinMat,lava,fallMaterial,landmarks,vaporMat,ash,popMaterial,volcanoes,get tiles(){return tiles},plumeMaterial,get active(){return enabled}};
}
