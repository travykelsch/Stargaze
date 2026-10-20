import * as T from './three.module.js';

// Authored cliff profiles: shelves, undercuts and mossy shoulders, not cones.
export function createCanyonTerrain(keep){
 function cliff(seed){const rings=[[0,1.12],[9,1.03],[22,.95],[26,1.08],[29,1.07],[43,.82],[47,.88],[60,.72],[63,.80],[71,.64],[74,.05]],p=[],ix=[],c=[],sides=24;
  for(let j=0;j<rings.length;j++)for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,[y,r]=rings[j],ridge=1+.07*Math.sin(a*7+seed)+.05*Math.cos(a*11-seed),lean=Math.sin(y*.023+seed)*3,x=Math.cos(a)*21*r*ridge+lean,z=Math.sin(a)*32*r*(1+.07*Math.sin(a*4+seed));p.push(x,y+Math.sin(a*3+seed)*Math.min(2,y*.05),z);const shelf=j>0&&rings[j][1]>=rings[j-1][1],moss=shelf||j>8,color=new T.Color(moss?0x74865b:0xb4a394).lerp(new T.Color(0x695f68),Math.max(0,Math.sin(a*3+seed))*.15).multiplyScalar(.89+.09*Math.sin(a*9+y*.19));color.toArray(c,c.length);if(j&&k){const v=j*(sides+1)+k;ix.push(v,v-sides-2,v-1,v,v-sides-1,v-sides-2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();return keep(g);
 }
 // An irregular, layered canopy; several overlapping lobes are one draw mesh.
 const canopyParts=[],ball=new T.IcosahedronGeometry(1,1);
 for(let j=0;j<7;j++){const g=ball.clone(),a=j*2.399,s=j?(.65+(j%3)*.12):1;g.scale(s,.48+s*.22,s*.84);g.translate(Math.cos(a)*(j?.62:0),2.35+(j%3)*.17,Math.sin(a)*(j?.62:0));const p=g.attributes.position,n=g.attributes.normal,color=new T.Color(j%3?0x6c8d59:0x96a56b);for(let i=0;i<p.count;i++)canopyParts.push({p:[p.getX(i),p.getY(i),p.getZ(i)],n:[n.getX(i),n.getY(i),n.getZ(i)],c:color.clone().multiplyScalar(.85+.15*Math.max(0,n.getY(i))).toArray()});g.dispose();}
 ball.dispose();const canopy=new T.BufferGeometry();for(const [name,key]of [['position','p'],['normal','n'],['color','c']])canopy.setAttribute(name,new T.Float32BufferAttribute(canopyParts.flatMap(x=>x[key]),3));keep(canopy);
 const birds=new T.BufferGeometry();birds.setAttribute('position',new T.Float32BufferAttribute([-.9,0,0,-.2,.09,-.16,0,0,.13,0,0,.13,.2,.09,-.16,.9,0,0,-.08,0,.32,0,.08,-.3,.08,0,.32],3));birds.computeVertexNormals();keep(birds);
 return {cliffs:[1,3,7].map(cliff),canopy,birds};
}
