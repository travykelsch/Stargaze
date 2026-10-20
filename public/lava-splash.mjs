import * as T from './three.module.js';
import {splashPoint,splashState} from './ember-course.mjs?v=39';

export function createLavaSplashes(clock,keep){
 const material=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{uTime:clock},vertexShader:`varying vec3 vP,vN,vView;varying vec2 vU;void main(){vP=position;vU=uv;vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform float uTime;varying vec3 vP,vN,vView;varying vec2 vU;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){vec2 p=vec2(vU.x*7.,vU.y*18.-uTime*1.7);float n=noise(p)+noise(p*2.7)*.4;float crust=smoothstep(.84,1.20,n);float seam=1.-smoothstep(.035,.12,abs(n-.68));vec3 hot=mix(vec3(.80,.065,.004),vec3(2.3,.72,.09),seam);vec3 N=normalize(vN);float light=.6+.4*max(0.,dot(N,normalize(vec3(-.5,.8,.4))));float rim=pow(1.-abs(dot(N,normalize(vView))),3.);vec3 c=mix(hot,vec3(.09,.025,.019)*light,crust*.88)+vec3(.7,.15,.02)*rim*.4;gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const dropGeo=keep(new T.SphereGeometry(1,6,4)),dropMat=new T.MeshBasicMaterial({color:0xff7b19}),warningMat=new T.MeshBasicMaterial({color:0xff8c19,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide});
 const warningGeo=keep(new T.CircleGeometry(1,24));warningGeo.rotateX(-Math.PI/2);
 const segments=32,sides=8,vertices=(segments+1)*sides+2;
 function create(a){
  const group=new T.Group(),geo=new T.BufferGeometry(),positions=new Float32Array(vertices*3),uv=new Float32Array(vertices*2),index=[];
  for(let j=0;j<=segments;j++)for(let k=0;k<sides;k++){const n=j*sides+k;uv[n*2]=k/sides;uv[n*2+1]=j/segments;}
  for(let j=0;j<segments;j++)for(let k=0;k<sides;k++){const n=j*sides+k,next=j*sides+(k+1)%sides;index.push(n,next,n+sides,next,next+sides,n+sides);}
  for(let k=0;k<sides;k++){index.push(vertices-2,(k+1)%sides,k);const end=segments*sides;index.push(vertices-1,end+k,end+(k+1)%sides);}
  geo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(index);
  const surface=new T.Mesh(geo,material);surface.userData.concave=true;surface.frustumCulled=false;group.add(surface);
  const strands=[];for(let side of [-1,1]){const geometry=new T.BufferGeometry(),p=new Float32Array((segments+1)*6),u=new Float32Array((segments+1)*4),indices=[];for(let j=0;j<=segments;j++){u.set([0,j/segments,1,j/segments],j*4);if(j<segments){const n=j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}geometry.setAttribute('position',new T.BufferAttribute(p,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('uv',new T.BufferAttribute(u,2));geometry.setIndex(indices);const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);strands.push({side,mesh,p});}
  const drops=new T.InstancedMesh(dropGeo,dropMat,40);drops.userData.sharedGeometry=true;drops.frustumCulled=false;drops.count=0;group.add(drops);
  const warning=new T.Mesh(warningGeo,warningMat);warning.userData.sharedGeometry=true;warning.position.set(a.splash.startX,-44,0);warning.scale.set(8,1,6);group.add(warning);
  const swell=new T.Mesh(dropGeo,material);swell.userData.sharedGeometry=true;swell.position.copy(warning.position);group.add(swell);
  const matrix=new T.Matrix4(),q=new T.Quaternion(),v=new T.Vector3(),scale=new T.Vector3();let lastTime=NaN;
  function update(time){
   if(time===lastTime)return splashState(a,time);lastTime=time;const state=splashState(a,time);surface.visible=state.active&&state.end-state.start>.025;warning.visible=state.warning||state.active&&state.age<.4;warning.scale.set(8+Math.sin(time*19)*.8,1,6+Math.sin(time*16)*.6);swell.visible=warning.visible;swell.scale.set(6,1.1+Math.max(0,1+state.age)*2+Math.sin(time*21)*.35,4);drops.count=0;
   for(const s of strands)s.mesh.visible=surface.visible;
   if(!surface.visible){group.visible=warning.visible;return state;}group.visible=true;
   const span=state.end-state.start,points=[];
   for(let j=0;j<=segments;j++){
    const age=state.start+span*j/segments,p=splashPoint(a,age,time),dx=a.splash.vx,dy=a.splash.vy-a.splash.gravity*age,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
    // Taper ends and advect small lobes along the fluid, without a rigid silhouette.
    const taper=.23+.77*Math.min(1,j/2,(segments-j)/2);points.push(p);
    for(let k=0;k<sides;k++){const angle=k/sides*Math.PI*2,lobe=1+.14*Math.sin(age*14+k*2.3-time*5),w=p.width*taper*lobe,c=Math.cos(angle),s=Math.sin(angle),n=(j*sides+k)*3;positions[n]=p.x+nx*c*w;positions[n+1]=p.y+ny*c*w;positions[n+2]=p.z+s*p.depth*taper;}
   }
   const first=points[0],last=points[segments];positions.set([first.x,first.y,first.z,last.x,last.y,last.z],(vertices-2)*3);geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
   for(const s of strands){for(let j=0;j<=segments;j++){const p=points[j],edge=Math.sin(j/segments*Math.PI),offset=s.side*(p.width+.7+Math.sin(j*.6-time*6)*.6)*edge,width=.08+.23*edge;for(let k=0;k<2;k++)s.p.set([p.x+offset+(k?width:-width),p.y-.8*edge,p.z+s.side*p.depth*1.2*edge],j*6+k*3);}s.mesh.geometry.attributes.position.needsUpdate=true;s.mesh.geometry.computeVertexNormals();}
   // Detached, clearly thin spray. Heavy connected stream alone owns collision.
   for(let i=0;i<40;i++){const age=state.start+span*((i*.6180339)%1),p=splashPoint(a,age,time),life=((time*1.3+i*.137)%1),side=i%2?1:-1;v.set(p.x+side*(p.width+life*3),p.y+Math.sin(i*7)*2-life*life*7,p.z+Math.cos(i*9)*3);scale.setScalar((.12+(i%5)*.055)*(1-life*.6));scale.y*=1.8;matrix.compose(v,q,scale);drops.setMatrixAt(drops.count++,matrix);}drops.instanceMatrix.needsUpdate=true;
   return state;
  }
  return {group,surface,drops,warning,update};
 }
 return {create,material};
}
