import * as T from './three.module.js';
export const FALL_WARNING_SECONDS=2.6;
// Fixed encounter brackets, never a reticle that follows or targets the player.
export function createHazardWarnings(world,color){
 const positions=[];function quad(x,y,w,h){positions.push(x,y,0,x+w,y,0,x,y+h,0,x+w,y,0,x+w,y+h,0,x,y+h,0);}
 for(const x of [-1,1])for(const y of [-1,1]){quad(x<0?-1:.56,y<0?-1:.95,.44,.05);quad(x<0?-1:.95,y<0?-1:.56,.05,.44);}
 // Downward chevron distinguishes the warning from a collectible ring.
 positions.push(-.24,1.35,0,0,1.10,0,-.04,1.35,0,.04,1.35,0,0,1.10,0,.24,1.35,0);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeBoundingSphere();const material=new T.MeshBasicMaterial({color,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const mesh=new T.InstancedMesh(geometry,material,24);mesh.count=0;mesh.visible=false;mesh.frustumCulled=false;mesh.userData.sharedGeometry=true;world.add(mesh);
 const matrix=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3(),position=new T.Vector3();let enabled=false;
 function update(hazards,time,player={x:0,y:0}){
  mesh.count=0;const candidates=[];
  for(const a of hazards){if(!['shard','small'].includes(a.category))continue;const until=a.encounterAt-time;if(until<.05||until>FALL_WARNING_SECONDS)continue;const separation=Math.hypot(a.x-player.x,a.y-player.y);if(separation>a.radius+13)continue;candidates.push({a,until,rank:separation+until*2});}
  candidates.sort((a,b)=>a.rank-b.rank);
  for(const {a,until}of candidates.slice(0,24)){const r=a.radius+1.4;position.set(a.x,a.y,-a.z);scale.setScalar(r*(.97+.03*Math.sin(time*8)));matrix.compose(position,q,scale);mesh.setMatrixAt(mesh.count++,matrix);}
  mesh.instanceMatrix.needsUpdate=true;material.opacity=.56+.12*Math.sin(time*7);mesh.visible=enabled;
 }
 function setActive(v){enabled=v;mesh.visible=v;}
 function reset(){mesh.count=0;}
 return {mesh,update,setActive,reset};
}
