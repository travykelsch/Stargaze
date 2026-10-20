import * as T from './three.module.js';

// A carved sandstone mass: flat shelves, broad shoulders and an asymmetric
// eroded opening. This is solid rock geometry, including the visible opening.
export function createStoneArch(seed,height=27){
 const h=Math.max(8,height),outline=[[-18,-h],[-18,-h*.80],[-17,-h*.80],[-17,-h*.48],[-14.8,-h*.48],[-14.8,-h*.20],[-15.5,-h*.20],[-15.5,6.8],[-13.5,6.8],[-13.5,11.8],[-10,12.4],[-5,12],[6,11.5],[9.7,10.2],[11.5,10.2],[11.5,7.5],[14,7.5],[14,1.8],[15.2,1.8],[15.2,-h*.35],[17.2,-h*.35],[17.8,-h],[7.6,-h],[7.7,-h*.4],[7.5,1.2],[5.2,6.8],[-4.5,7],[-7,4.1],[-8.1,-h*.4],[-7.7,-h]],shape=new T.Shape(outline.map(p=>new T.Vector2(...p)));
 const source=new T.ExtrudeGeometry(shape,{depth:9,steps:2,bevelEnabled:false});source.translate(0,0,-4.5);
 const src=source.attributes.position,vertices=[];
 function refine(a,b,c,level=0){const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);if(Math.max(ab,bc,ca)>48&&level<9){if(ab>=bc&&ab>=ca){const m=a.clone().add(b).multiplyScalar(.5);refine(a,m,c,level+1);refine(m,b,c,level+1);}else if(bc>=ca){const m=b.clone().add(c).multiplyScalar(.5);refine(a,b,m,level+1);refine(a,m,c,level+1);}else{const m=c.clone().add(a).multiplyScalar(.5);refine(a,b,m,level+1);refine(m,b,c,level+1);}return;}vertices.push(...a.toArray(),...b.toArray(),...c.toArray());}
 for(let i=0;i<src.count;i+=3)refine(new T.Vector3().fromBufferAttribute(src,i),new T.Vector3().fromBufferAttribute(src,i+1),new T.Vector3().fromBufferAttribute(src,i+2));source.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const p=g.attributes.position;
 // Broad low-poly planes and hard ledges reproduce the reference silhouette.
 // No rounded tube, beveled lintel, fine strata or smoothed rubber-like surface.
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setZ(i,z+Math.min(1,Math.abs(z)/3.8)*(.64*Math.sin(x*.24+y*.13+seed)+.25*Math.cos(y*.39-x*.41)));}
 for(let i=0;i<p.count;i++)if(p.getY(i)>9)p.setY(i,p.getY(i)+.22*Math.sin(p.getX(i)*.52+seed));
 g.computeVertexNormals();const n=g.attributes.normal,colors=[];for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,up=(n.getY(i)+n.getY(i+1)+n.getY(i+2))/3;const top=x<-10?12.1:x<6?12-(x+5)*.045:11.5-(x-6)*.35,grass=up>.65||(y>top-.50&&y>9),tone=.94+.065*Math.sin(x*.63+y*.43+z*.3+seed),c=new T.Color(grass?0x9bc345:0xa0a6a4).multiplyScalar(tone);for(let k=0;k<3;k++)colors.push(c.r,c.g,c.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.scale(1.18,1,1);g.computeBoundingSphere();return g;
}

// Detailed matte-painted distant world; alpha blends it into the daylight haze.
// A single texture and draw call replace the artificial procedural stripe sphere.
export function createCanyonPlanet(){
 const group=new T.Group(),map=new T.Texture();map.colorSpace=T.SRGBColorSpace;map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.generateMipmaps=true;
 const material=new T.MeshBasicMaterial({map,color:0xe5f8ed,transparent:true,opacity:.64,depthWrite:false,fog:false,toneMapped:false});
 const planet=new T.Mesh(new T.PlaneGeometry(310,310),material);planet.userData.sharedGeometry=true;planet.userData.asset='assets/canyon-planet-v19.png';planet.visible=false;group.add(planet);
 if(typeof Image!=='undefined'){const image=new Image();image.decoding='async';image.onload=()=>{map.image=image;map.needsUpdate=true;planet.visible=true;};image.src=new URL('./assets/canyon-planet-v19.png',import.meta.url).href;}
 group.position.set(-75,175,-850);return group;
}
