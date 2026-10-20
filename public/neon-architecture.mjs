import * as T from './three.module.js';

// Normalized building families, baked into one reusable draw mesh per family.
// Open courtyards and elevated neighborhoods create real silhouette gaps.
export function createNeonArchitecture(keep){
 const box=new T.BoxGeometry(1,1,1);
 function part(g,scale=[1,1,1],p=[0,0,0],r=[0,0,0],color=0xffffff){const o=g.clone();o.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...r)),new T.Vector3(...scale)));return {g:o,color};}
 function bake(parts){const p=[],n=[],uv=[],col=[];for(const a of parts){const g=a.g.index?a.g.toNonIndexed():a.g,c=new T.Color(a.color);const pos=g.attributes.position,no=g.attributes.normal;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),nx=Math.abs(no.getX(i));p.push(x,y,z);n.push(no.getX(i),no.getY(i),no.getZ(i));uv.push((nx>.6?z:x)*1.25+.5,y);c.toArray(col,col.length);}if(g!==a.g)g.dispose();a.g.dispose();}const g=new T.BufferGeometry();for(const [name,data,size]of [['position',p,3],['normal',n,3],['uv',uv,2],['color',col,3]])g.setAttribute(name,new T.Float32BufferAttribute(data,size));g.computeBoundingSphere();g.computeBoundingBox();return keep(g);}
 function curved(){const p=[],uv=[],ix=[],levels=14,sides=20;for(let j=0;j<=levels;j++){const y=j/levels,w=.24+.20*Math.sin(y*Math.PI)**2,lean=Math.sin(y*Math.PI)*.12;for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2;p.push(Math.cos(a)*w+lean,y,Math.sin(a)*w*.82);uv.push(k/sides,y);if(j&&k){const i=j*(sides+1)+k;ix.push(i,i-sides-2,i-1,i,i-sides-1,i-sides-2);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
 // A hollow central aperture, asymmetrical pylons and suspended observation decks.
 const outline=new T.Shape([new T.Vector2(-.46,0),new T.Vector2(-.5,.30),new T.Vector2(-.42,.82),new T.Vector2(-.24,1),new T.Vector2(.32,.96),new T.Vector2(.49,.74),new T.Vector2(.43,0)]),hole=new T.Path();hole.moveTo(-.20,.36);hole.lineTo(.17,.39);hole.lineTo(.22,.70);hole.lineTo(.10,.80);hole.lineTo(-.16,.77);hole.lineTo(-.24,.65);hole.closePath();outline.holes.push(hole);
 const hollow=new T.ExtrudeGeometry(outline,{depth:.46,bevelEnabled:true,bevelThickness:.025,bevelSize:.018,bevelSegments:1,steps:1});hollow.translate(0,0,-.23);
 const split=bake([part(hollow),part(box,[.18,.065,.66],[-.30,.35,.02],[0,.16,0],0xa0afc1),part(box,[.23,.08,.64],[.31,.67,0],[0,-.2,0],0x899db7),part(box,[.05,.15,.05],[-.29,1.02,0],[0,0,.12],0xb0c2d8)]);hollow.dispose();
 const shell=curved(),fin=new T.BoxGeometry(.035,.86,.70);const arcParts=[part(shell)];for(const side of [-1,1])arcParts.push(part(fin,[1,1,1],[side*.30,.48,0],[0,side*.25,side*.08],0x94a6c1));for(let j=0;j<3;j++)arcParts.push(part(box,[.72,.035,.62],[.08,.25+j*.23,0],[0,.2+j*.15,0],0xb4bed1));const arcology=bake(arcParts);shell.dispose();fin.dispose();
 const disk=new T.TorusGeometry(.32,.062,6,24),shaft=new T.CylinderGeometry(.075,.15,1,10),district=[part(shaft,[1,1,1],[0,.5,0],[0,0,0],0x8c9cae)];for(let j=0;j<3;j++){district.push(part(disk,[1.30,1,.80],[j%2?.04:-.03,.25+j*.29,0],[Math.PI/2,0,j*.33]));for(let k=0;k<4;k++){const a=k*Math.PI*.5+j*.55;district.push(part(box,[.16,.12,.18],[Math.cos(a)*.32,.29+j*.29,Math.sin(a)*.24],[0,-a,0],0xa9b9cb));}}const orbital=bake(district);disk.dispose();shaft.dispose();box.dispose();return [split,arcology,orbital];
}

// Fine hull panels are object-space; the existing emissive UV mask is preserved.
export function finishTrafficMaterial(material){
 material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vHullPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHullPosition=position;');shader.fragmentShader='varying vec3 vHullPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 cell=abs(fract(vHullPosition*vec3(18.,14.,22.))-.5);float seam=smoothstep(.455,.49,max(cell.x,max(cell.y,cell.z)));float hullMask=1.;
 #ifdef USE_EMISSIVEMAP
 hullMask=1.-step(.5,vEmissiveMapUv.x);
 #endif
 float grain=fract(sin(dot(floor(vHullPosition*170.),vec3(12.9898,78.233,31.41)))*43758.5453);diffuseColor.rgb*=mix(1.,.94-seam*.22+grain*.055,hullMask);`);};material.customProgramCacheKey=()=> 'neon-traffic-panels-v27';return material;
}
