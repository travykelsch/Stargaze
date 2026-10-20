import * as T from './three.module.js';
import {frostNoise} from './frost-surfaces.mjs?v=39';
const rand=seed=>{let n=seed>>>0;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);};
export function createGlacialTerrain(keep,clock,travel){
 function finish(p,c,uv,index){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(index)g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return keep(g);}
 const mountains=Array.from({length:4},(_,variant)=>{
  const p=[],c=[],uv=[],idx=[],nx=30,nz=24;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
   const x=i/nx*2-1,z=j/nz*2-1,edge=Math.max(0,1-Math.abs(x)**5)*Math.max(0,1-Math.abs(z)**5);
   const ridgeZ=.12*Math.sin(x*5+variant),ridge=Math.exp(-Math.abs(z-ridgeZ)*(3.8+variant*.3)),teeth=.62+.22*Math.cos(x*9+variant)+.10*Math.cos(x*21-variant);
   const ridge2=Math.exp(-Math.abs(z+.35+x*.25)*7)*(.35+.22*Math.sin(x*11+variant)**2),crags=Math.sin(x*37+z*19+variant)*.032+Math.sin(x*61-z*31)*.018;
   const height=Math.max(.01,(Math.max(ridge*teeth,ridge2)+crags)*edge),slab=Math.sin(z*29+x*7+variant)*.014;
   p.push(x,height+slab*edge,z*.85);uv.push(i/nx*5,j/nz*4);const snow=Math.max(0,Math.min(1,(height-.22)*1.5+ridge*.18));c.push(.26+snow*.61,.32+snow*.58,.40+snow*.54);
   if(j<nz&&i<nx){const n=j*(nx+1)+i;idx.push(n,n+nx+1,n+1,n+1,n+nx+1,n+nx+2);}
  }return finish(p,c,uv,idx);
 });
 const cliffs=Array.from({length:3},(_,variant)=>{const p=[],c=[],uv=[],idx=[],rows=24,cols=40;
  for(let j=0;j<=cols;j++)for(let k=0;k<=rows;k++){
   const u=j/cols,t=k/rows,z=(u-.5)*204,h=109+Math.sin(u*17+variant)*24+Math.sin(u*39-variant)*13,layer=Math.floor(t*6)/6,crack=Math.exp(-Math.pow((u-.21-.04*variant)/.018,2))*3+Math.exp(-Math.pow((u-.63+.03*variant)/.025,2))*2.5;
   const overhang=Math.sin(t*14+u*10)*2.6+(layer-t)*36,x=11+Math.sin(u*19+variant)*3+t*17+overhang+crack*Math.sin(t*4),y=t*h-44;
   p.push(x,y,z);uv.push(u*10,t*8);const shelf=Math.max(0,1-(t-layer)*30),snow=Math.max(t>.94?.8:0,shelf*.76),vein=.06*Math.sin(u*70+t*5);c.push(.26+snow*.54+vein,.38+snow*.45+vein,.50+snow*.37+vein);
   if(j<cols&&k<rows){const n=j*(rows+1)+k;idx.push(n,n+rows+1,n+1,n+1,n+rows+1,n+rows+2);}
  }return finish(p,c,uv,idx);
 });
 function cascade(variant){const p=[],c=[],uv=[],idx=[],r=rand(140+variant),n=8,rows=12;
  for(let tooth=0;tooth<9;tooth++){
   const cx=(tooth-4)/8,cz=Math.sin(tooth*1.7)*.45,length=tooth===4?1:.75+r()*.24,width=.065+r()*.035,start=p.length/3;
   for(let j=0;j<=rows;j++)for(let k=0;k<n;k++){const t=j/rows,a=k/n*Math.PI*2,bulge=(1-t)**.35*(.84+.16*Math.sin(t*29+tooth)),tip=Math.max(.025,bulge),lean=Math.sin(t*4+tooth)*.018*t;p.push(cx+Math.cos(a)*width*tip+lean,-t*length,cz+Math.sin(a)*tip*.38+Math.sin(t*5+tooth)*.15*t);uv.push(k/n,t*5);const shade=.70+.25*(1-t);c.push(shade*.76,shade*.91,shade);if(j<rows){const q=start+j*n+k,next=start+j*n+(k+1)%n;idx.push(q,next,q+n,next,next+n,q+n);}}
   // The separate thick icicles fuse at the broad ledge and taper irregularly.
  }return finish(p,c,uv,idx);
 }
 const falls=Array.from({length:3},(_,i)=>cascade(i));
 const bridge=(()=>{const p=[],c=[],uv=[],idx=[],rows=42,n=12;for(let j=0;j<=rows;j++)for(let k=0;k<n;k++){const u=j/rows,a=k/n*Math.PI*2,dx=110,dy=Math.cos(u*Math.PI)*29*Math.PI,l=Math.hypot(dx,dy),rough=1+.12*Math.sin(u*29+k*2)+.06*Math.cos(u*61-k*3),w=(5.3+Math.sin(u*9)*.8)*rough;const yy=Math.sin(u*Math.PI)*29;p.push((u-.5)*110-dy/l*Math.cos(a)*w,yy+dx/l*Math.cos(a)*w,Math.sin(u*9)*1.4+Math.sin(a)*w*.75);uv.push(u*9,k/n*2);const snow=Math.max(0,Math.cos(a));c.push(.34+snow*.50,.48+snow*.41,.60+snow*.33);if(j<rows){const q=j*n+k,next=j*n+(k+1)%n;idx.push(q,next,q+n,next,next+n,q+n);}}return finish(p,c,uv,idx);})();
 const boulders=Array.from({length:3},(_,v)=>{const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position,c=[],uv=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),rough=.88+.08*Math.sin(x*7+z*11+v)+.04*Math.sin(y*17-x*5);p.setXYZ(i,x*rough,y*rough*.58,z*rough*.8);const snow=Math.max(0,y);c.push(.28+snow*.58,.41+snow*.49,.54+snow*.39);uv.push(x,z);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingSphere();return keep(g);});
 function finishMaterial(material,kind){
  material.onBeforeCompile=shader=>{
   shader.uniforms.uFrostTime=clock;shader.uniforms.uFrostTravel=travel;
   shader.vertexShader='varying vec3 frostWorldP;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec4 frostP=vec4(transformed,1.);
    #ifdef USE_INSTANCING
    frostP=instanceMatrix*frostP;
    #endif
    frostWorldP=(modelMatrix*frostP).xyz;`);
   shader.fragmentShader='varying vec3 frostWorldP;uniform float uFrostTime,uFrostTravel;\n'+frostNoise+'\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    vec3 fp=vec3(frostWorldP.x,frostWorldP.y,frostWorldP.z-uFrostTravel);
    vec3 fn=inverseTransformDirection(normal,viewMatrix);
    float grain=noise(fp.xz*2.1+fp.y*.35),shelf=noise(fp.xz*.12+fp.y*.14);
    float snowTint=.4;
    #ifdef USE_COLOR
    snowTint=vColor.r;
    #endif
    float snowCover=smoothstep(.16,.70,fn.y*.65+snowTint*.58+shelf*.15)*smoothstep(-54.,-41.,fp.y);
    float strata=.90+.10*sin(fp.y*1.2+noise(fp.xz*.08)*3.);
    float fissure=1.-smoothstep(.015,.065,abs(noise(vec2(fp.x*.31+fp.z*.11,fp.y*.23))-.5));
    ${kind==='ice'?`float fresnel=pow(1.-max(0.,dot(normal,normalize(vViewPosition))),3.);diffuseColor.rgb=mix(vec3(.14,.34,.43),vec3(.51,.76,.83),grain*.28+fresnel*.72);diffuseColor.rgb*=1.-fissure*.18;roughnessFactor=.20+grain*.17;`:`vec3 stone=vec3(.23,.29,.35)*strata*(.86+grain*.18);vec3 snow=vec3(.78,.83,.86)*(.94+grain*.06);diffuseColor.rgb=mix(stone,snow,snowCover);diffuseColor.rgb*=1.-fissure*(1.-snowCover)*.19;roughnessFactor=mix(.57,.95,snowCover);`}
   `);
  };material.customProgramCacheKey=()=>`frost-surface-${kind}-v35`;
 }
 return {mountains,cliffs,falls,bridge,boulders,finishMaterial};
}
