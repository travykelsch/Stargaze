import * as THREE from '../public/three.module.js';
export function collisionQuery(ship){const query=new THREE.Vector3(),localPoint=new THREE.Vector3(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),v3=new THREE.Vector3(),closest=new THREE.Vector3(),tri=new THREE.Triangle();
const shipSamples=[{p:new THREE.Vector3(0,0,-1.2),r:.68},{p:new THREE.Vector3(0,0,.7),r:.85},{p:new THREE.Vector3(-2.15,0,.9),r:.38},{p:new THREE.Vector3(2.15,0,.9),r:.38}];
function collides(a){return a.collidable!==false&&(a.collisionShapes||[a.shape]).some(shape=>collidesShape(shape));}
const archInsideRay=new THREE.Ray(new THREE.Vector3(),new THREE.Vector3(.937,.271,.219).normalize()),archRayHit=new THREE.Vector3();
function collidesShape(shape){const positions=shape.geometry.attributes.position,idx=shape.geometry.index;shape.updateWorldMatrix(true,false);if(!shape.geometry.boundingSphere)shape.geometry.computeBoundingSphere();
for(const s of shipSamples){query.copy(s.p).add(ship.position);localPoint.copy(query).applyMatrix4(shape.matrixWorld.clone().invert());if(localPoint.distanceTo(shape.geometry.boundingSphere.center)>shape.geometry.boundingSphere.radius+s.r/Math.min(shape.scale.x,shape.scale.y,shape.scale.z))continue;let inside=!shape.userData.surfaceOnly;const crossings=!shape.userData.surfaceOnly&&(shape.userData.ownedArch||shape.userData.concave)?[]:null;if(crossings)archInsideRay.origin.copy(query);const count=idx?idx.count:positions.count;
for(let i=0;i<count;i+=3){v1.fromBufferAttribute(positions,idx?idx.getX(i):i).applyMatrix4(shape.matrixWorld);v2.fromBufferAttribute(positions,idx?idx.getX(i+1):i+1).applyMatrix4(shape.matrixWorld);v3.fromBufferAttribute(positions,idx?idx.getX(i+2):i+2).applyMatrix4(shape.matrixWorld);tri.set(v1,v2,v3);tri.closestPointToPoint(query,closest);if(closest.distanceToSquared(query)<s.r*s.r)return true;if(crossings&&archInsideRay.intersectTriangle(v1,v2,v3,false,archRayHit))crossings.push(archRayHit.distanceTo(query));tri.getNormal(closest);if(closest.dot(localPoint.set(0,0,0).subVectors(query,v1))>0)inside=false;}
if(inside&&!crossings)return true;if(crossings){crossings.sort((a,b)=>a-b);let hits=0,lastHit=-Infinity;for(const d of crossings)if(d-lastHit>1e-8){hits++;lastHit=d;}if(hits%2===1)return true;}
}return false;}

return collides;}
