import * as T from './three.module.js';

const clamp=T.MathUtils.clamp;
function random(seed){let s=seed>>>0;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);}
// Position-based noise is continuous at longitude seams and the poles.
function noise(x,y,z){return (Math.sin(x*3.7+y*2.1+z*.8)+Math.cos(y*4.3-z*3.1+x*.6)+.5*Math.sin(z*8.3+x*5.7-y*4.1))/2.5;}
export function sculptAsteroid(variant,detail=6){
  const g=new T.IcosahedronGeometry(1,detail),p=g.attributes.position,colors=new Float32Array(p.count*3),rng=random(981+variant*217),craters=[];
  for(let i=0;i<11;i++)craters.push({n:new T.Vector3(rng()*2-1,rng()*2-1,rng()*2-1).normalize(),width:.15+rng()*.23,depth:.065+rng()*.12});
  const cut=new T.Vector3(.5+Math.sin(variant),Math.cos(variant*1.4),Math.sin(variant*.8)).normalize(),phase=variant*1.732,raw=[],shade=[];let max=0;
  for(let i=0;i<p.count;i++){
    const n=new T.Vector3().fromBufferAttribute(p,i).normalize();let radius=.82+.11*noise(n.x+phase,n.y,n.z)+.045*noise(n.x*3,n.y*3+phase,n.z*3),cavity=0;
    // Broad impact basins with raised, chipped lips and dark sheltered floors.
    for(const c of craters){const d=Math.sqrt(Math.max(0,2-2*n.dot(c.n))),f=d/c.width;if(f<1.35){const bowl=Math.exp(-f*f*3.8),rim=Math.exp(-(((f-1)*9)**2));radius-=c.depth*bowl-.026*rim;cavity+=bowl*.23;}}
    // Planar broken faces alternate with worn boulders; no perfect balls.
    const cutDot=n.dot(cut);if(variant%3!==0&&cutDot>.57)radius=Math.min(radius,(variant%3===1?.58:.66)/cutDot);
    radius=clamp(radius,.44,.99);
    const v=n.multiplyScalar(radius);v.x*=1+.10*Math.sin(variant*2);v.y*=1+.10*Math.cos(variant*1.5);raw.push(v);max=Math.max(max,v.length());shade.push(clamp(.86+.10*noise(v.x*13+phase,v.y*13,v.z*13)-cavity,.48,1));
  }
  raw.forEach((v,i)=>{v.multiplyScalar(.975/max);p.setXYZ(i,v.x,v.y,v.z);const s=shade[i];colors.set([s,s*.985,s*.965],i*3);});
  g.computeVertexNormals();const normals=g.attributes.normal,shared=new Map();
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');if(!shared.has(key))shared.set(key,new T.Vector3());shared.get(key).add(new T.Vector3().fromBufferAttribute(normals,i));}
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(','),n=shared.get(key).normalize();normals.setXYZ(i,n.x,n.y,n.z);}
  g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeBoundingSphere();g.userData.asteroid=true;return g;
}
function stoneNoise(x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),smooth=t=>t*t*(3-2*t),u=smooth(x-a),v=smooth(y-b),w=smooth(z-c),hash=(i,j,k)=>{let n=Math.imul(i,374761393)^Math.imul(j,668265263)^Math.imul(k,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;},lerp=(a,b,t)=>a+(b-a)*t;return lerp(lerp(lerp(hash(a,b,c),hash(a+1,b,c),u),lerp(hash(a,b+1,c),hash(a+1,b+1,c),u),v),lerp(lerp(hash(a,b,c+1),hash(a+1,b,c+1),u),lerp(hash(a,b+1,c+1),hash(a+1,b+1,c+1),u),v),w)*2-1;}
function surfaceMaps(){const size=256,rng=random(716),craters=Array.from({length:46},()=>({x:rng(),y:rng(),r:.012+rng()*.045})),albedo=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/(size-1)*Math.PI*2,v=y/(size-1)*Math.PI*2,grain=stoneNoise(Math.cos(u)*19,Math.sin(u)*19,Math.cos(v)*19)+.4*stoneNoise(Math.cos(u)*39,Math.sin(u)*39,Math.sin(v)*39),seam=Math.pow(Math.max(0,1-Math.abs(stoneNoise(Math.cos(u)*5,Math.sin(u)*5,Math.sin(v)*5))/.045),2);let h=.52+grain*.16-seam*.18;
    for(const c of craters){let dx=Math.abs(x/(size-1)-c.x),dy=Math.abs(y/(size-1)-c.y);dx=Math.min(dx,1-dx);dy=Math.min(dy,1-dy);const f=Math.hypot(dx,dy)/c.r;if(f<1.3)h+=-.16*Math.exp(-f*f*5)+.05*Math.exp(-(((f-1)*10)**2));}
    const k=(y*size+x)*4,a=clamp(190+grain*26-seam*32,105,226),b=clamp(h*255,0,255),r=clamp(224+grain*18-seam*22,175,250);albedo.set([a,a*.97,a*.92,255],k);height.set([b,b,b,255],k);rough.set([r,r,r,255],k);
  }
  const tex=(data,srgb=false)=>{const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;};
  return {map:tex(albedo,true),bumpMap:tex(height),roughnessMap:tex(rough)};
}
export function createAsteroidArt(){
  const geometries=Array.from({length:9},(_,i)=>sculptAsteroid(i)),maps=surfaceMaps(),base=[0xc6bfb4,0xad9280,0x969ba4];
  const materials=base.map((color,i)=>new T.MeshStandardMaterial({color,vertexColors:true,...maps,bumpScale:.19,roughness:1,metalness:i===1?.24:.04}));
  function tint(a,b,mix){const hue=new T.Color(a).lerp(new T.Color(b),mix);materials.forEach((m,i)=>m.color.setHex(base[i]).lerp(hue,.12));}
  return {geometries,materials,maps,tint};
}

// Distant bodies, grit and a fractured moon are scenery, outside the flight lane.
// They never enter the hazard list or acquire collision/reward state.
export function createAsteroidScenery(art){
  const group=new T.Group(),tiles=[],dust=new T.PointsMaterial({color:0xe9c2a6,size:.22,transparent:true,opacity:.22,depthWrite:false,sizeAttenuation:true}),farMat=new T.MeshStandardMaterial({color:0xa391a0,roughness:1,vertexColors:true,...art.maps,bumpScale:.2}),nearMat=art.materials[0];
  const backgroundGeometries=[1,4,7].map(i=>sculptAsteroid(i,2)),chipGeo=new T.IcosahedronGeometry(1,0),matrix=new T.Matrix4(),rotation=new T.Quaternion();
  function spawn(parent,index,seed){const rng=random(seed+index*1021),tile=new T.Group();tile.position.z=-index*190;parent.add(tile);tiles.push({g:tile,z:index*190});
    const rocks=new T.InstancedMesh(backgroundGeometries[index%3],farMat,12),chips=new T.InstancedMesh(chipGeo,nearMat,28);
    for(let i=0;i<12;i++){const side=i%2?-1:1,scale=5+rng()*22;rotation.setFromEuler(new T.Euler(rng()*6,rng()*6,rng()*6));matrix.compose(new T.Vector3(side*(160+scale+rng()*230),(rng()-.5)*300,-rng()*190),rotation,new T.Vector3(scale,scale*(.6+rng()*.5),scale));rocks.setMatrixAt(i,matrix);}
    for(let i=0;i<28;i++){const side=i%2?-1:1,s=.12+rng()*.65;rotation.setFromEuler(new T.Euler(rng()*6,rng()*6,0));matrix.compose(new T.Vector3(side*(65+rng()*95),(rng()-.5)*150,-rng()*190),rotation,new T.Vector3(s,s*.6,s*1.4));chips.setMatrixAt(i,matrix);}
    tile.add(rocks,chips);const positions=[];for(let i=0;i<42;i++)positions.push((i%2?-1:1)*(58+rng()*140),(rng()-.5)*160,-rng()*190);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));tile.add(new T.Points(g,dust));
  }
  // A single distant fragmented planetoid gives an occasional scale landmark.
  const landmarkMat=farMat.clone();landmarkMat.fog=false;landmarkMat.color.setHex(0x705b70);const landmark=new T.Group();landmark.position.set(-180,110,-1010);group.add(landmark);
  for(let i=0;i<3;i++){const o=new T.Mesh(art.geometries[i*3+1],landmarkMat);o.scale.set(60-i*14,75-i*17,53-i*12);o.position.set(i*65,i*21,-i*16);o.rotation.set(i*.7,.8+i*.5,.3);landmark.add(o);}
  function remove(tile,parent){tile.g.traverse(o=>{if(o.isInstancedMesh)o.dispose();else if(o.isPoints)o.geometry.dispose();});parent.remove(tile.g);}
  function reset(parent){for(const tile of tiles)remove(tile,parent);tiles.length=0;}
  function update(parent,distance,time){for(let i=tiles.length-1;i>=0;i--)if(distance-tiles[i].z>310){remove(tiles[i],parent);tiles.splice(i,1);}landmark.rotation.z=Math.sin(time*.015)*.025;}
  return {group,spawn,reset,update,get count(){return tiles.length},landmark,chipGeo,dust,farMat};
}
