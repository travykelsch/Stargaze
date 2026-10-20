import {createHazardWarnings} from './hazard-warnings.mjs?v=36';
import * as T from './three.module.js';
import {createGlacialTerrain} from './frost-terrain.mjs?v=39';
import {frostPosition,frostState} from './frost-course.mjs?v=39';
import {createFrostSurfaces,frostNoise,frostVertex} from './frost-surfaces.mjs?v=39';
const random=seed=>{let n=seed>>>0;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);};
export const FROST_PALETTE=[{name:'Frostveil',sky:'#243550',rock:'#aec8df',light:0xffd4b6},{name:'Glacier Reach',sky:'#273954',rock:'#bdd8e7',light:0xf7cddd},{name:'Polar Veil',sky:'#30314d',rock:'#bacce5',light:0xd8d5ff},{name:'Winterlight',sky:'#28374b',rock:'#b8d7df',light:0xffddc8}];
export function createFrostWorld(scene,world){
 const clock={value:0},travel={value:0},shared=new Set(),tiles=[],hazards=new Set(),pools=new Map();let enabled=false;
 const warnings=createHazardWarnings(world,0xb7e7f5);
 const keep=g=>(shared.add(g),g),surfaces=createFrostSurfaces(clock,keep),matrix=new T.Matrix4(),q=new T.Quaternion(),position=new T.Vector3(),scale=new T.Vector3();
 function finish(p,c,uv,index){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(c)g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(index)g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return keep(g);}
 const art=createGlacialTerrain(keep,clock,travel),mountains=art.mountains,cliffs=art.cliffs;
 const terrain=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.88,metalness:.03});
 const size=128,height=new Uint8Array(size*size*4),albedo=new Uint8Array(size*size*4),r=random(881);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const grain=r()*30,fracture=Math.abs(Math.sin(x*.18+Math.sin(y*.06)*2))<.045?45:165,n=(y*size+x)*4; height.set([fracture+grain,fracture+grain,fracture+grain,255],n);const v=210+grain;albedo.set([v*.91,v*.97,v,255],n);}
 function texture(data,color=false){const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;if(color)t.colorSpace=T.SRGBColorSpace;return t;}
 terrain.map=texture(albedo,true);terrain.bumpMap=texture(height);terrain.bumpScale=.23;
 const ice=new T.MeshStandardMaterial({color:0xb7d8e5,metalness:.08,roughness:.28,emissive:0x102e43,emissiveIntensity:.06});ice.bumpMap=terrain.bumpMap;ice.bumpScale=.075;ice.map=terrain.map;art.finishMaterial(terrain,'terrain');art.finishMaterial(ice,'ice');
 const shardGeos=Array.from({length:4},(_,variant)=>{const base=new T.IcosahedronGeometry(1,1),p=base.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),s=.86+.14*Math.sin(x*8+z*7+variant),cut=variant===1&&y>.30?.56+x*.24:y*(.90+variant*.016);p.setXYZ(i,x*(.36+variant*.025)*s+(y>.2?y*.12:0)+(variant===2&&y<-.2?.1:0),cut,variant===3&&z>.2?.09+y*.05:z*.31*s);}base.computeVertexNormals();base.computeBoundingSphere();return keep(base);});
 const floor=new T.ShaderMaterial({uniforms:{uTime:clock,uTravel:travel},vertexShader:frostVertex,fragmentShader:`uniform float uTime,uTravel;varying vec3 vW;varying vec2 vU;${frostNoise}
 void main(){
  float zz=vW.z-uTravel;float rift=abs(abs(vW.x)-(48.+sin(-zz*.018)*5.));if(rift<1.8+sin(-zz*.04)*.5)discard;
  vec2 p=vec2(vW.x,zz)*.026;float grain=noise(p*49.),sheets=fbm(p),cracks=1.-smoothstep(.012,.035,abs(fbm(p*3.7)-.51));
  float wind=9.*uTime-38.095*cos(uTime*.21);float drift=fbm(vec2(p.x*1.4-wind*.002,p.y*.42));
  float snow=smoothstep(.46,.72,sheets*.65+drift*.35);float streaks=.5+.5*sin(p.x*22.+noise(p*.8)*5.+p.y*.6);
  vec3 iceColor=mix(vec3(.075,.18,.26),vec3(.24,.40,.49),sheets);iceColor*=1.-cracks*.42;
  vec3 snowColor=vec3(.46,.55,.62)*( .91+grain*.06+streaks*.035);vec3 c=mix(iceColor,snowColor,snow);
  float light=pow(max(0.,sin(p.x*.43+p.y*.22+uTime*.16)),8.);c+=mix(vec3(.012,.05,.035),vec3(.03,.012,.05),sin(p.y*.2)*.5+.5)*light*(1.-snow*.8);
  c=mix(c,vec3(.14,.20,.29),smoothstep(170.,850.,-vW.z));gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const floorGeo=keep(new T.PlaneGeometry(1200,194));floorGeo.rotateX(-Math.PI/2);
 const sky=new T.ShaderMaterial({depthWrite:false,depthTest:false,fog:false,uniforms:{uTime:clock},vertexShader:frostVertex,fragmentShader:`uniform float uTime;varying vec2 vU;${frostNoise}
 void main(){vec2 p=vU;vec3 c=mix(vec3(.41,.34,.43),vec3(.028,.061,.12),smoothstep(.13,.9,p.y));
 float high=fbm(p*vec2(9.,35.)+vec2(uTime*.007,0.)),low=fbm(p*vec2(6.,17.)+vec2(uTime*.012,-uTime*.003));
 float cloud=smoothstep(.40,.77,high*.4+low*.6);c=mix(c,vec3(.21,.27,.36),cloud*.40*smoothstep(.3,.7,p.y));float glow=exp(-length((p-vec2(.73,.31))*vec2(1.,2.))*17.);c+=vec3(.17,.10,.07)*glow;
 gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});
 const mist=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,uniforms:{uTime:clock},vertexShader:'uniform float uTime;'+frostVertex.replace('vec4 p=vec4(position,1.);','vec3 drift=position;drift.y+=sin(uv.x*7.+uTime*.35)*.045;vec4 p=vec4(drift,1.);'),fragmentShader:`uniform float uTime;varying vec2 vU;varying vec3 vW;${frostNoise}
 void main(){float wind=9.*uTime-38.095*cos(uTime*.21);vec2 drift=vec2(-wind*.017,uTime*.013);float n=fbm(vU*vec2(7.,3.)+drift);float fine=noise(vU*vec2(29.,5.)+drift*1.5);float edge=pow(max(0.,sin(vU.x*3.14159)*sin(vU.y*3.14159)),1.3);float gust=.5+.5*sin(uTime*.21);float alpha=smoothstep(.29,.77,n*.8+fine*.2)*edge*(.13+gust*.15);gl_FragColor=vec4(mix(vec3(.27,.38,.49),vec3(.55,.65,.73),vU.y),alpha);
 #include <colorspace_fragment>
 }`});
 const plane=keep(new T.PlaneGeometry(1,1,8,4));
 // Thick fluted ice cascades are attached at cliff ledges and reach the glacier.
 const waterfall=art.falls[0],bridge=art.bridge;
 const snowMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:clock,uTravel:travel},vertexShader:`uniform float uTime,uTravel;varying float vA;void main(){float gust=.5+.5*sin(uTime*.21);vec3 p=position;p.x=mod(p.x+9.*uTime-38.095*cos(uTime*.21)+sin(uTime*.7+position.z*.1)*3.+100.,200.)-100.;p.y=mod(p.y-10.*uTime+9.524*sin(uTime*.21)+90.,150.)-55.;p.z=mod(p.z+uTravel*.30+350.,390.)-330.;vA=.25+gust*.30;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(160./max(1.,-mv.z),1.,4.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float vA;void main(){float d=length((gl_PointCoord-.5)*vec2(1.,.6));gl_FragColor=vec4(.76,.87,1.,smoothstep(.5,.05,d)*vA);
 #include <colorspace_fragment>
 }`});
 const snowGeo=keep(new T.BufferGeometry()),sp=[],sr=random(293);for(let i=0;i<580;i++)sp.push((sr()-.5)*200,sr()*150-55,-sr()*390);snowGeo.setAttribute('position',new T.Float32BufferAttribute(sp,3));const snow=new T.Points(snowGeo,snowMat);snow.frustumCulled=false;snow.visible=false;scene.add(snow);
 const backdrop=new T.Group();scene.add(backdrop);backdrop.visible=false;
 function add(parent,g,m,p,s=[1,1,1]){const mesh=new T.Mesh(g,m);mesh.position.set(...p);mesh.scale.set(...s);mesh.userData.sharedGeometry=true;parent.add(mesh);return mesh;}
 for(let i=0;i<8;i++)add(backdrop,mountains[i%4],new T.MeshBasicMaterial({color:i%2?0x33445d:0x3b4a65,fog:false,vertexColors:true}),[(i-3.5)*210,-90,-850-(i%2)*180],[200,220+(i%3)*80,180]);
 const skyAuroras=[];for(let layer=0;layer<2;layer++){const p=[],uv=[],idx=[],n=80,cols=8;for(let j=0;j<=n;j++)for(let k=0;k<=cols;k++){const u=j/n,v=k/cols;p.push((u-.5)*1250,95+Math.sin(u*10+layer)*40+v*78,-790+Math.sin(u*13+layer)*65+Math.sin(u*47-v*4)*9-layer*90);uv.push(u,v);if(j<n&&k<cols){const a=j*(cols+1)+k;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}}const geometry=finish(p,null,uv,idx),m=surfaces.aurora.clone();m.uniforms.uTime=clock;m.uniforms.uLife.value=.33;m.depthTest=true;m.side=T.DoubleSide;const mesh=add(backdrop,geometry,m,[0,layer*40,0]);skyAuroras.push(mesh);}
 const auroraLight=new T.PointLight(0x64c7b0,0,150,2);auroraLight.visible=false;scene.add(auroraLight);
 function inst(parent,geometry,material,list){if(!list.length)return;const mesh=new T.InstancedMesh(geometry,material,list.length);mesh.userData.sharedGeometry=true;for(let i=0;i<list.length;i++){const p=list[i];q.setFromEuler(new T.Euler(...(p.rot||[0,0,0])));matrix.compose(position.fromArray(p.p),q,scale.fromArray(p.s));mesh.setMatrixAt(i,matrix);}mesh.instanceMatrix.needsUpdate=true;parent.add(mesh);return mesh;}
 function spawn(index,seed){const g=new T.Group(),z=index*190,r=random(seed+index*661),peaks=[[],[],[],[]],falls=[],shelves=[],clouds=[];g.position.z=-z;world.add(g);tiles.push({g,z});add(g,floorGeo,floor,[0,-44,-95]);
  for(const side of [-1,1]){
   const wall=add(g,cliffs[(index+(side>0?1:0))%3],terrain,[side*55,0,-95]);if(side<0)wall.rotation.y=Math.PI;
   for(let j=0;j<3;j++){const height=100+r()*160,width=70+r()*40;peaks[(j+index)%4].push({p:[side*(125+r()*85),-44,-j*78-r()*35],s:[width,height,width],rot:[0,r()*6,0]});}
   for(let j=0;j<2;j++){const y=28+r()*18,x=side*(75+r()*3),zz=-30-j*105;falls.push({p:[x,y,zz],s:[7+r()*6,y+44,4],rot:[0,-side*.25,0]});shelves.push({p:[x,y-3,zz-4],s:[16,8,11]});shelves.push({p:[x-side*3,-43,zz+2],s:[12,6,9]});}
   clouds.push({p:[side*63,-20+r()*12,-95],s:[100,20+r()*20,1]});
  }
  for(const x of [-38,0,38])clouds.push({p:[x,-40,-75-r()*90],s:[70+r()*25,5+r()*3,1]});
  peaks.forEach((p,i)=>inst(g,mountains[i],terrain,p));inst(g,art.falls[index%3],ice,falls);inst(g,art.boulders[index%3],terrain,shelves);inst(g,plane,mist,clouds);
  if(index%3===1)add(g,bridge,terrain,[0,87,-130],[1,1,1]);
  // Real depth beneath matching cutouts in the floor, outside the flight route.
  const rp=[],rc=[],ru=[],ri=[];for(const side of [-1,1])for(let j=0;j<=40;j++){const localZ=-j/40*194+2,globalZ=z-localZ,center=side*(48+Math.sin(globalZ*.018)*5),width=1.8+Math.sin(globalZ*.04)*.5;
   for(const [x,y]of [[center-width,-44],[center-width*.8,-63],[center+width*.8,-63],[center+width,-44]]){rp.push(x,y,localZ);rc.push(.045,.14,.23);ru.push(j/6,(y+63)/5);}if(j<40){const n=rp.length/3-4;for(let k=0;k<3;k++)ri.push(n+k,n+k+1,n+k+4,n+k+1,n+k+5,n+k+4);}}
  const fissure=new T.BufferGeometry();fissure.setAttribute('position',new T.Float32BufferAttribute(rp,3));fissure.setAttribute('color',new T.Float32BufferAttribute(rc,3));fissure.setAttribute('uv',new T.Float32BufferAttribute(ru,2));fissure.setIndex(ri);fissure.computeVertexNormals();const rift=new T.Mesh(fissure,terrain);rift.userData.transientGeometry=true;g.add(rift);
 }
 function obstacle(a){const g=new T.Group();g.position.set(a.x,a.y,-a.z);world.add(g);let shape,field,key;
  if(a.category==='shard'){
   const geometry=shardGeos[a.kind];shape=add(g,geometry,ice,[0,0,0],[a.radius,a.radius,a.radius]);shape.visible=false;shape.userData.concave=true;key=a.kind;
   if(!pools.has(key)){const pool=new T.InstancedMesh(geometry,ice,1024);pool.frustumCulled=false;pool.count=0;pool.visible=enabled;pool.userData.sharedGeometry=true;world.add(pool);pools.set(key,pool);}
  }else {field=surfaces.deform(a);g.add(field.group);shape=field.shape;}
  const item={...a,g,shape,field,key,collisionShapes:field?.collisionShapes||[shape],collidable:false,environment:'frost',baseX:a.x,baseY:a.y,baseZ:-a.z};hazards.add(item);return item;
 }
 function motion(a,distance,time){const p=frostPosition(a,time);a.g.position.set(p.x,p.y,p.z);a.g.visible=p.visible;a.collidable=p.active;a.warning=p.warning;a.velocityNow=p;if(a.field){const state=a.field.update(time);a.collidable=state.active;}else a.g.rotation.set(time*a.spin+a.phase,time*a.spin*.7,a.phase+time*.4);}
 const trailGeo=new T.BufferGeometry(),trailPositions=new Float32Array(4096*3);trailGeo.setAttribute('position',new T.BufferAttribute(trailPositions,3).setUsage(T.DynamicDrawUsage));trailGeo.setDrawRange(0,0);keep(trailGeo);
 const trailMat=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:`void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(150./max(1.,-p.z),1.,4.);gl_Position=projectionMatrix*p;}`,fragmentShader:`void main(){gl_FragColor=vec4(.75,.90,1.,smoothstep(.5,.05,length(gl_PointCoord-.5))*.4);
 #include <colorspace_fragment>
 }`});const trails=new T.Points(trailGeo,trailMat);trails.userData.sharedGeometry=true;trails.frustumCulled=false;trails.visible=false;world.add(trails);
 function update(distance,time,player){warnings.update(hazards,time,player);clock.value=time;travel.value=distance;let count=0;for(const pool of pools.values())pool.count=0;
  for(const a of hazards){if(a.g.parent!==world){hazards.delete(a);continue;}if(!a.g.visible||a.category!=='shard')continue;const pool=pools.get(a.key);a.g.updateMatrix();a.shape.updateMatrix();matrix.multiplyMatrices(a.g.matrix,a.shape.matrix);if(pool.count<1024)pool.setMatrixAt(pool.count++,matrix);
   for(let i=0;i<5&&count<4096;i++){const p=frostPosition(a,time-.035-i*.025);trailPositions.set([p.x+Math.sin(i*7+time*12)*.25,p.y,p.z],count++*3);}}
  trailGeo.setDrawRange(0,count);trailGeo.attributes.position.needsUpdate=true;for(const p of pools.values()){p.visible=enabled;p.instanceMatrix.needsUpdate=true;}
  for(let i=tiles.length-1;i>=0;i--)if(distance-tiles[i].z>310){remove(tiles[i]);tiles.splice(i,1);}
  if(enabled){let near=null,nearest=Infinity,nearZ=0;for(const a of hazards)if(a.category==='aurora'&&a.collidable){const z=a.g.position.z+distance;if(z>-70&&z<180&&Math.abs(z)<nearest){near=a;nearest=Math.abs(z);nearZ=z;}}auroraLight.intensity=near?260*(.85+.15*Math.sin(time*.6)):0;if(near)auroraLight.position.set(near.x,near.y+18,nearZ);}
  for(let i=0;i<skyAuroras.length;i++){const o=skyAuroras[i];o.position.y=Math.sin(time*.09+i)*8;o.rotation.z=Math.sin(time*.035+i)*.018;}
 }
 function remove(tile){tile.g.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.transientGeometry)o.geometry.dispose();});world.remove(tile.g);}
 function reset(){warnings.reset();tiles.forEach(remove);tiles.length=0;hazards.clear();clock.value=0;travel.value=0;auroraLight.intensity=0;for(const p of pools.values())p.count=0;trailGeo.setDrawRange(0,0);}
 function setActive(v){warnings.setActive(v);enabled=v;snow.visible=backdrop.visible=trails.visible=auroraLight.visible=v;if(!v)auroraLight.intensity=0;for(const p of pools.values())p.visible=v;}
 return {retire:a=>hazards.delete(a),warnings,art,auroraLight,spawn,obstacle,motion,update,reset,setActive,sky,surfaces,terrain,ice,floor,mist,snow,trails,pools,shared,mountains,cliffs,shardGeos,palettes:FROST_PALETTE,get tiles(){return tiles},get active(){return enabled}};
}
