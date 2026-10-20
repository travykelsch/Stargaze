import * as T from './three.module.js';
import {rivalProfile} from './sunscar-rivals.mjs?v=49';
import {ENGINE_LAYOUTS,COCKPITS} from './sunscar-vehicles.mjs?v=49';
// Eight cached liveries over four deliberately different silhouettes. All tiny
// mechanical pieces merge into the body; transparent glass is a single layer.
export function createRacerArt(keep,metal,glow){
 const box=keep(new T.BoxGeometry(1,1,1)),sphere=keep(new T.SphereGeometry(1,12,8)),cyl=keep(new T.CylinderGeometry(1,1,1,16));cyl.rotateX(Math.PI/2);
 const torus=keep(new T.TorusGeometry(1,.10,5,16)),cone=keep(new T.ConeGeometry(1,1,12));cone.rotateX(Math.PI/2);
 const coreMaterial=new T.MeshBasicMaterial({color:0xffefc8,vertexColors:true,transparent:true,opacity:.75,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
 const glassMat=new T.MeshStandardMaterial({color:0x315568,metalness:.72,roughness:.13,transparent:true,opacity:.67,depthWrite:false,envMapIntensity:1.15,emissive:0x082028,emissiveIntensity:.32});
 const exhausts=[0x82eaff,0xffa451,0xbba1ff,0xafff9f].map(color=>new T.MeshBasicMaterial({color,transparent:true,opacity:.67,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
 const paints=[0xe4b335,0xd8ddd0,0x307c8c,0xb9482a,0x6c723d,0xdebca4,0x764653,0x354b58],designs=[];
 function merge(parts){const positions=[],normals=[],colors=[];for(const p of parts){const g=p.geo.clone();g.scale(...p.s);if(p.rot)g.rotateZ(p.rot);g.translate(...p.p);const n=g.index?g.toNonIndexed():g,pp=n.attributes.position,nn=n.attributes.normal,c=new T.Color(p.c);for(let i=0;i<pp.count;i++){positions.push(pp.getX(i),pp.getY(i),pp.getZ(i));normals.push(nn.getX(i),nn.getY(i),nn.getZ(i));const v=.86+.14*Math.abs(Math.sin(pp.getZ(i)*3.4+pp.getX(i)*13));colors.push(c.r*v,c.g*v,c.b*v);}if(n!==g)n.dispose();g.dispose();}const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingSphere();return g;}
 function design(style){if(designs[style])return designs[style];const family=style%4,color=style<4?rivalProfile(style).paint:paints[style],parts=[],colliders=[],engines=[],panels=[];
  const add=(geo,p,s,c=0x42464a,rot=0)=>{const o={geo,p,s,c,rot};parts.push(o);return o;};
  const solid=(geo,p,s,c)=>{const o=add(geo,p,s,c);colliders.push(o);return o;};
  const cockpit=COCKPITS[family];
  solid(sphere,cockpit,family===2?[1.8,1.05,2.6]:[1.05,.7,1.75],0x35434a);
  const layouts=ENGINE_LAYOUTS[family];
  for(const [x,y,z,r,len]of layouts){
   // Turbine casing with several machined changes in diameter.
   const profile=[new T.Vector2(0,-.5),new T.Vector2(.70,-.5),new T.Vector2(.92,-.48),new T.Vector2(1,-.38),new T.Vector2(.95,-.26),new T.Vector2(1,.10),new T.Vector2(.82,.37),new T.Vector2(.68,.5),new T.Vector2(0,.5)];
   const casing=keep(new T.LatheGeometry(profile,16));casing.rotateX(Math.PI/2);solid(casing,[x,y,z],[r,r,len],color);engines.push({p:[x,y,z+len*.50],r});
   // Intake lip, recessed black throat, rotating fan hub and compressor blades.
   add(torus,[x,y,z-len*.48],[r*.83,r*.83,r*.9],0xc4b49c);add(cyl,[x,y,z-len*.43],[r*.69,r*.69,.08],0x101a20);add(sphere,[x,y,z-len*.47],[r*.28,r*.28,r*.45],0x5f696e);
   // Bold clan crest and helmet silhouette remain legible during a close pass.
  const accent=rivalProfile(style).accent;add(box,[cockpit[0],cockpit[1]+.50,cockpit[2]+.55],[.75,.06,.18],accent);add(box,[cockpit[0],cockpit[1]+.51,cockpit[2]+.78],[.75,.06,.10],accent);
  add(sphere,[cockpit[0],cockpit[1]+.73,cockpit[2]-.12],[.28,.32,.27],0x262c36);add(box,[cockpit[0],cockpit[1]+.76,cockpit[2]-.37],[.42,.11,.08],accent);
  for(const side of [-1,1])for(let k=0;k<(family===2?3:2);k++)add(box,[side*2.5,.82,-1.3+k*.35],[.65,.07,.15],accent,side*.28);
  for(let k=0;k<8;k++){const a=k*Math.PI/4;add(box,[x+Math.cos(a)*r*.4,y+Math.sin(a)*r*.4,z-len*.445],[r*.5,.045,.08],0x6b7779,a);}
   for(const f of [-.28,.12,.34])add(torus,[x,y,z+len*f],[r*1.03,r*1.03,.55],0x3b3935);
   add(torus,[x,y,z+len*.49],[r*.72,r*.72,.7],0xaaa18c);add(cyl,[x,y,z+len*.47],[r*.60,r*.60,.12],0x141c20);
   for(const side of [-1,1]){add(box,[x+side*r*.88,y+.35*r,z],[.12,.34,len*.48],0x242c30);add(box,[x+side*r*.9,y+.36*r,z-.06],[.04,.14,len*.32],0xd1c5a4);}
   for(let k=0;k<5;k++)add(box,[x,y+r*.96,z-.7+k*.26],[r*.6,.08,.10],0x222b2f);
   const path=new T.CatmullRomCurve3([new T.Vector3(x,y+.8*r,z+len*.1),new T.Vector3(x*.72,y+1.0,z+len*.45),new T.Vector3(cockpit[0],cockpit[1],cockpit[2])]);const cable=keep(new T.TubeGeometry(path,8,.055,4,false));add(cable,[0,0,0],[1,1,1],0x242222);
   const panel={geo:box,p:[x,y+r*.78,z-.6],s:[r*1.1,.18,len*.31],c:color};panels.push(panel);
  }
  // Suspension bridges, ceramic heat shields, warning stripes and repair plates.
  for(const z of [0,1.3])solid(box,[0,-.25,z],[family===1?3.6:5.7,.20,.28],0x807763);
  for(const side of [-1,1]){add(box,[side*(family===1?1.2:2.2),.35,1.3],[.12,1.5,1.5],color,side*.28);for(let k=0;k<3;k++)add(box,[side*1.4,.03,1.7+k*.18],[.58,.035,.09],k%2?0x282d2b:0xe2c36a);}
  if(family===2){solid(box,[0,-.15,.2],[3.6,.65,3.2],color);for(const side of [-1,1])add(box,[side*1.72,.3,1.3],[.14,.22,3.1],0x333d43);}
  if(family===3){add(box,[-1.3,.4,.8],[1.3,.25,2.1],0xbeb3a3,.18);add(box,[.3,1.1,1.8],[.12,1.5,1.1],color,-.14);}
  for(let k=0;k<8;k++){const side=k%2?1:-1;add(sphere,[cockpit[0]+side*.79,cockpit[1]+.45,cockpit[2]-1+k*.26],[.075,.075,.075],0xc4b9a6);}
  const body=merge(parts),panelGeo=merge(panels),coreGeo=merge(engines.map(e=>({geo:cone,p:[e.p[0],e.p[1],e.p[2]+.8],s:[e.r*.17,e.r*.17,1.6],c:0xfff2d4})));return designs[style]={body,panelGeo,coreGeo,colliders,engines,cockpit,glassGeo:sphere,family};
 }
 function make(a){const d=design(a.style),g=new T.Group();const hull=new T.Mesh(d.body,metal);g.add(hull);hull.castShadow=true;hull.receiveShadow=true;hull.userData.sharedGeometry=true;
  const panel=new T.Mesh(d.panelGeo,metal);panel.userData.sharedGeometry=true;g.add(panel);
  const glass=new T.Mesh(d.glassGeo,glassMat);glass.position.set(d.cockpit[0],d.cockpit[1]+.58,d.cockpit[2]-.15);glass.scale.set(.78,.50,1.2);glass.userData.sharedGeometry=true;g.add(glass);
  const collisionShapes=d.colliders.map(p=>{const m=new T.Mesh(p.geo,metal);m.position.set(...p.p);m.scale.set(...p.s);m.visible=false;m.userData.sharedGeometry=true;g.add(m);return m;});
  const cores=new T.Mesh(d.coreGeo,coreMaterial);cores.userData.sharedGeometry=true;g.add(cores);const flames=[],ports=[];for(const e of d.engines){const port=new T.Mesh(cyl,glow);port.position.set(...e.p);port.position.z+=.04;port.scale.set(e.r*.55,e.r*.55,.12);port.userData.sharedGeometry=true;g.add(port);ports.push(port);const flame=new T.Mesh(cone,exhausts[a.style%4]);flame.position.set(e.p[0],e.p[1],e.p[2]+1.5);flame.scale.set(e.r*.43,e.r*.43,3);flame.userData.sharedGeometry=true;g.add(flame);flames.push(flame);}
  return {g,collisionShapes,flames,cores,ports,panel,glass,design:d};
 }
 return {make,design};
}
