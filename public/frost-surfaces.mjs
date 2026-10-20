import * as T from './three.module.js';
import {auroraPoint,vortexSection,frostState} from './frost-course.mjs?v=39';
export const frostNoise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.11)*.15;}`;
export const frostVertex=`varying vec3 vP,vW;varying vec2 vU;void main(){vP=position;vU=uv;vec4 p=vec4(position,1.);
#ifdef USE_INSTANCING
p=instanceMatrix*p;
#endif
vW=(modelMatrix*p).xyz;gl_Position=projectionMatrix*modelViewMatrix*p;}`;
export function createFrostSurfaces(clock,keep){
 const aurora=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.FrontSide,forceSinglePass:true,uniforms:{uTime:clock,uLife:{value:1}},vertexShader:frostVertex,fragmentShader:`uniform float uTime,uLife;varying vec2 vU;varying vec3 vP;${frostNoise}
 void main(){
  float u=vU.x,v=vU.y;float drift=fbm(vec2(u*11.-uTime*.12,v*2.5+uTime*.055));
  float warp=u+sin(v*4.+u*14.-uTime*.22)*.006+drift*.015;
  float fibers=noise(vec2(warp*310.,v*.75-uTime*.13));float threads=pow(noise(vec2(warp*650.,v*1.6-uTime*.21)),3.);
  float footprint=max(1.,fwidth(warp)*310.);threads=mix(.22,threads,1./footprint);float rays=mix(.40,smoothstep(.2,.8,fibers)*(.35+.65*threads),1./footprint);float plume=fbm(vec2(u*34.-uTime*.08,v*7.+uTime*.07));
  float edge=smoothstep(0.,.10,v)*smoothstep(1.,.79,v)*smoothstep(0.,.035,u)*smoothstep(1.,.965,u);
  float green=1.-smoothstep(.47,.91,v+plume*.10);vec3 c=mix(vec3(.28,.20,.56),vec3(.055,.69,.33),green);
  c=mix(c,vec3(.07,.53,.61),smoothstep(.2,.6,v)*(1.-smoothstep(.64,.9,v))*.65);c+=vec3(.20,.035,.13)*pow(v,8.)*plume;
  float pulse=.78+.22*sin(u*9.-uTime*.44+drift*3.);float alpha=edge*(.32+.30*plume+.18*rays)*uLife;
  if(alpha<.015)discard;c*=pulse*(.76+rays*.53);c+=vec3(.12,.24,.13)*threads*green*.22;gl_FragColor=vec4(c,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const volumeVertex=`varying vec3 vP,vN,vView;varying vec2 vU;void main(){vP=position;vU=uv;vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`;
 const core=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.FrontSide,uniforms:{uTime:clock},vertexShader:volumeVertex,fragmentShader:`uniform float uTime;varying vec2 vU;varying vec3 vP,vN,vView;${frostNoise}
 void main(){vec2 flow=vec2(vU.x*6.+vU.y*9.-uTime*1.7,vU.y*13.-uTime*.62);float n=fbm(flow),fine=noise(flow*5.1+uTime*.4);
  float facing=abs(dot(normalize(vN),normalize(vView)));float edge=smoothstep(.02,.45,facing);float density=.45+n*.55;
  float shade=.38+.43*max(0.,dot(normalize(vN),normalize(vec3(-.6,.6,.4))));
  float folds=fbm(flow+vec2(n*3.,fine));vec3 shadow=vec3(.13,.22,.32),snow=vec3(.70,.81,.89);vec3 c=mix(shadow,snow,shade*(.65+folds*.35));
  c+=vec3(.018,.055,.045)*max(0.,vN.y)*(.5+.5*sin(uTime*.13+vP.y*.1));c+=fine*.035;
  float alpha=mix(.18,.90,edge)*(.75+n*.25);gl_FragColor=vec4(c,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const bands=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,uniforms:{uTime:clock},vertexShader:frostVertex,fragmentShader:`uniform float uTime;varying vec2 vU;varying vec3 vP;${frostNoise}
 void main(){float n=fbm(vec2(vU.y*18.-uTime*1.4,vU.x*4.+uTime*.3));float ragged=smoothstep(.20,.75,n);float edge=pow(max(0.,sin(vU.x*3.14159)),.8)*smoothstep(0.,.04,vU.y)*smoothstep(1.,.94,vU.y);float a=edge*ragged*.45;if(a<.018)discard;float light=.45+.40*smoothstep(-8.,8.,vP.z);gl_FragColor=vec4(mix(vec3(.28,.40,.53),vec3(.79,.88,.94),light),a);
 #include <colorspace_fragment>
 }`});
 const cloud=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,uniforms:{uTime:clock},vertexShader:frostVertex,fragmentShader:`uniform float uTime;varying vec2 vU;varying vec3 vP;${frostNoise}
 void main(){vec2 p=(vU-.5)*2.;float n=fbm(p*3.+vec2(-uTime*.38,uTime*.07)+vP.y*.027);float r=length(p*vec2(1.,1.15));float soft=1.-smoothstep(.25,.99,r+n*.20);float a=soft*smoothstep(.24,.71,n)*.42;if(a<.012)discard;vec3 c=mix(vec3(.22,.34,.46),vec3(.67,.78,.86),clamp(vU.y*.6+n*.3,0.,1.));gl_FragColor=vec4(c,a);
 #include <colorspace_fragment>
 }`});
 const wisps=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:clock,uRadius:{value:6},uPhase:{value:0}},vertexShader:`uniform float uTime,uRadius,uPhase;varying float vAlpha;void main(){float u=fract(position.y+uTime*(.16+fract(position.z)*.11));float angle=position.x+uTime*(4.6-u*2.2);float radius=uRadius*(.4+u*1.0)+sin(position.z*9.+uTime*2.)*1.1;vec3 p=vec3(cos(angle)*radius+sin(u*5.+uTime*1.5+uPhase)*(1.+u*2.2),-43.+u*80.,sin(angle)*radius);vAlpha=sin(u*3.14159)*(.22+fract(position.z*7.)*.3);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((140.+fract(position.z)*160.)/max(1.,-mv.z),1.,10.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.77,.88,.97,smoothstep(.5,.06,d)*vAlpha);
 #include <colorspace_fragment>
 }`});
 const particles=keep(new T.BufferGeometry()),pp=[];for(let i=0;i<140;i++)pp.push(i*2.399963,(i*.6180339)%1,(i*.173205)%1);particles.setAttribute('position',new T.Float32BufferAttribute(pp,3));
 function dynamic(positions,uv,index){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);return g;}
 function curtain(a){
  const rows=56,cols=8,face=(rows+1)*(cols+1),pos=new Float32Array(face*2*3),uv=[],idx=[],solid=[];
  for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){uv.push(j/rows,k/cols);const n=side*face+j*(cols+1)+k;if(j<rows&&k<cols){const tris=side===0?[n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2]:[n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1];idx.push(...tris);if(j>=1&&j<rows-1&&k>=1&&k<cols-1)solid.push(...tris);}}
  for(let j=0;j<rows;j++)for(const k of [0,cols]){const n=j*(cols+1)+k,m=n+cols+1;idx.push(n,n+face,m,m,n+face,m+face);}
  for(let k=0;k<cols;k++)for(const j of [0,rows]){const n=j*(cols+1)+k;idx.push(n,n+1,n+face,n+1,n+face+1,n+face);}
  const geometry=dynamic(pos,uv,idx),material=aurora.clone();material.uniforms.uTime=clock;const shape=new T.Mesh(geometry,material);shape.userData.ownedMaterial=true;shape.userData.concave=true;shape.frustumCulled=false;
  const group=new T.Group();group.add(shape);
  // Reuse the exact animated vertex buffer, excluding only the faded fringe.
  const hitGeo=new T.BufferGeometry();hitGeo.setAttribute('position',geometry.attributes.position);hitGeo.setIndex(solid);const hit=new T.Mesh(hitGeo,material);hit.visible=false;hit.userData.surfaceOnly=true;group.add(hit);let last=NaN;
  function update(time){const state=frostState(a,time);group.visible=state.visible;if(last===time||!state.visible)return state;last=time;
   for(let j=0;j<=rows;j++){const u=j/rows,p=auroraPoint(a,u,time),p0=auroraPoint(a,Math.max(0,u-.002),time),p1=auroraPoint(a,Math.min(1,u+.002),time),dx=p1.x-p0.x,dy=p1.y-p0.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
    for(let k=0;k<=cols;k++){const v=k/cols,across=(v-.5)*2,edge=1+.04*Math.sin(u*61-time*.7+v*5),lag=u*23-time*a.motion*.46-v*1.9,pleat=Math.sin(lag)*.42+Math.sin(u*57-time*.72-v*2.)*.13,z=p.z+pleat*Math.sin(v*Math.PI);
     for(let side=0;side<2;side++){const n=(side*face+j*(cols+1)+k)*3;pos[n]=p.x+nx*across*p.width*edge;pos[n+1]=p.y+ny*across*p.width*edge;pos[n+2]=z+(side?-.06:.06);}
    }
   }geometry.attributes.position.needsUpdate=true;geometry.computeBoundingSphere();hitGeo.boundingSphere=geometry.boundingSphere;material.uniforms.uLife.value=state.envelope;return state;
  }
  return {group,shape,collisionShapes:[hit],update};
 }
 function tornado(a){
  const rows=24,sides=12,nv=(rows+1)*sides+2,pos=new Float32Array(nv*3),uv=[],idx=[];
  for(let j=0;j<=rows;j++)for(let k=0;k<sides;k++){uv.push(k/sides,j/rows);const n=j*sides+k;if(j<rows){const next=j*sides+(k+1)%sides;idx.push(n,n+sides,next,next,n+sides,next+sides);}}uv.push(.5,0,.5,1);
  for(let k=0;k<sides;k++){idx.push(nv-2,k,(k+1)%sides);const e=rows*sides;idx.push(nv-1,e+(k+1)%sides,e+k);}
  const geometry=dynamic(pos,uv,idx),shape=new T.Mesh(geometry,core);shape.userData.concave=true;shape.frustumCulled=false;
  const group=new T.Group();group.add(shape);
  const bp=new Float32Array(3*37*2*3),bu=[],bi=[];for(let arm=0;arm<3;arm++)for(let j=0;j<=36;j++){bu.push(0,j/36,1,j/36);if(j<36){const n=arm*74+j*2;bi.push(n,n+1,n+2,n+1,n+3,n+2);}}const bandGeo=dynamic(bp,bu,bi),spirals=new T.Mesh(bandGeo,bands);spirals.frustumCulled=false;group.add(spirals);
  const cp=new Float32Array(7*4*3),cu=[],ci=[];for(let i=0;i<7;i++){cu.push(0,0,1,0,1,1,0,1);const n=i*4;ci.push(n,n+1,n+2,n,n+2,n+3);}const cloudGeo=dynamic(cp,cu,ci),clouds=new T.Mesh(cloudGeo,cloud);clouds.frustumCulled=false;group.add(clouds);
  const m=wisps.clone();m.uniforms.uTime=clock;m.uniforms.uRadius.value=a.radius;m.uniforms.uPhase.value=a.phase;const spray=new T.Points(particles,m);spray.userData.sharedGeometry=true;spray.userData.ownedMaterial=true;spray.frustumCulled=false;group.add(spray);
  let last=NaN;
  function update(time){const state=frostState(a,time);group.visible=state.visible;if(time===last||!state.visible)return state;last=time;const centers=[];
   for(let j=0;j<=rows;j++){const u=j/rows,p=vortexSection(a,u,time);centers.push(p);for(let k=0;k<sides;k++){const angle=k/sides*Math.PI*2,lobe=1+.09*Math.sin(angle*3+u*17-time*3+a.phase)+.04*Math.sin(angle*7-u*23+time*4),n=(j*sides+k)*3;pos[n]=p.x+Math.cos(angle)*p.radius*lobe;pos[n+1]=p.y+Math.sin(angle*3+time*2)*.24;pos[n+2]=p.z+Math.sin(angle)*p.radius*lobe;}}
   pos.set([centers[0].x,centers[0].y,centers[0].z,centers[rows].x,centers[rows].y,centers[rows].z],(nv-2)*3);geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
   for(let arm=0;arm<3;arm++)for(let j=0;j<=36;j++){const u=j/36,p=vortexSection(a,u,time),angle=u*(16+Math.sin(a.phase)*2)-time*(4.5-u*1.8)+arm*2.094+a.phase,r=p.radius*(1.15+.12*Math.sin(u*14+time*2+arm)),width=(1.1+u*2.2)*(.7+.3*Math.sin(u*21-time*4+arm));for(let k=0;k<2;k++){const n=(arm*74+j*2+k)*3;bp[n]=p.x+Math.cos(angle)*r;bp[n+1]=p.y+(k?width:-width);bp[n+2]=p.z+Math.sin(angle)*r;}}bandGeo.attributes.position.needsUpdate=true;
   const bottom=centers[0],top=centers[rows];for(let i=0;i<7;i++){const crown=i>=3,center=crown?top:bottom,angle=i*2.399+a.phase+time*(crown?.13:.21),spread=a.radius*(crown?1.4:1.65),cx=center.x+Math.cos(angle)*spread*.38,cy=center.y+(crown?-3:3)+(i%3)*2,cz=center.z+Math.sin(angle)*spread*.4,w=spread*(crown?1.8:2.0),h=crown?12:7;for(let k=0;k<4;k++){const sx=(k===0||k===3)?-1:1,sy=k<2?-1:1;cp.set([cx+sx*w*Math.cos(angle),cy+sy*h,cz+sx*w*Math.sin(angle)],(i*4+k)*3);}}cloudGeo.attributes.position.needsUpdate=true;
   return state;
  }
  return {group,shape,update,spray,spirals,clouds};
 }
 return {aurora,core,wisps,bands,cloud,deform:a=>a.category==='aurora'?curtain(a):tornado(a)};
}
