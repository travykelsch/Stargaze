import * as T from './three.module.js';

const random=seed=>{let n=seed>>>0;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);};
// Authored surfaces, not scaled cones: broken ridgelines, eroded shelves and undercuts.
export function createEmberLandmarks(keep){
 function finish(positions,colors,indices){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));if(indices)g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();const p=g.attributes.position,n=g.attributes.normal,uv=[];for(let i=0;i<p.count;i++){const side=Math.abs(n.getZ(i))>Math.abs(n.getX(i));uv.push((side?p.getX(i):p.getZ(i))*.35,p.getY(i)*.35);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return keep(g);}
 const cliffs=Array.from({length:3},(_,variant)=>{const p=[],c=[],idx=[],r=random(194+variant),rows=10,columns=18;
  const height=Array.from({length:columns+1},(_,j)=>76+Math.sin(j*1.65+variant)*21+Math.sin(j*.57)*17+r()*25);
  for(let j=0;j<=columns;j++)for(let k=0;k<=rows;k++){const f=k/rows,z=(j/columns-.5)*205,h=height[j],shelf=Math.floor(f*5)/5;const x=10+Math.sin(j*.83+variant)*5+f*8+Math.sin(f*11+j*.7)*3+(shelf-f)*27;const y=f*h-52;
   p.push(x,y,z);const shade=.72+f*.14+r()*.07;c.push(shade*.80,shade*.78,shade*.84);if(j<columns&&k<rows){const a=j*(rows+1)+k;idx.push(a,a+rows+1,a+1,a+1,a+rows+1,a+rows+2);}}
  // The front faces look inward; reverse when mirroring an entire cliff instance.
  const g=finish(p,c,idx);g.userData.emberCliff=true;return g;
 });
 const islands=Array.from({length:3},(_,variant)=>{const p=[],c=[],idx=[],n=18,r=random(331+variant),radii=Array.from({length:n},()=>.78+r()*.18),levels=[[-.54,.51],[-.34,.78],[-.10,.90],[.19,1],[.31,.73]];
  for(let j=0;j<levels.length;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rr=radii[i]*levels[j][1],y=levels[j][0]+Math.sin(a*3+variant)*.035;p.push(Math.cos(a)*rr,y,Math.sin(a)*rr*.82);const shade=j===4?.87:.55+j*.065;c.push(shade*.9,shade*.82,shade*.83);if(j<levels.length-1){const k=j*n+i,next=j*n+(i+1)%n;idx.push(k,k+n,next,next,k+n,next+n);}}
  const bottom=p.length/3;p.push(0,-.62,0);c.push(.35,.30,.32);const top=p.length/3;p.push(0,.29,0);c.push(.77,.69,.70);for(let i=0;i<n;i++){const next=(i+1)%n;idx.push(bottom,i,next,top,4*n+next,4*n+i);}
  const g=finish(p,c,idx);let max=0;const pos=g.attributes.position;for(let i=0;i<pos.count;i++)max=Math.max(max,Math.hypot(pos.getX(i),pos.getY(i),pos.getZ(i)));g.scale(.975/max,.975/max,.975/max);g.computeBoundingSphere();g.userData.concave=true;return g;
 });
 const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,10),fortresses=[];
 function baked(parts){const pos=[],col=[],uv=[];for(const part of parts){const g=part.g.index?part.g.toNonIndexed():part.g.clone();g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...part.p),new T.Quaternion().setFromEuler(new T.Euler(...(part.rot||[0,0,0]))),new T.Vector3(...part.s)));const p=g.attributes.position;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));col.push(...part.color);}g.dispose();}return finish(pos,col);}
 for(let variant=0;variant<3;variant++){const parts=[],r=random(887+variant),color=[.70,.66,.68],block=(p,s,rot,colorOverride)=>parts.push({g:box,p,s,rot,color:colorOverride||color});
  // A staggered curtain wall: holes, missing floors and collapsed parapets.
  for(let section=0;section<12;section++){const x=(section-5.5)*2.5;if(section===5||section===6)continue;const h=5+r()*8;block([x,h*.5,0],[2.45,h,2.7]);if(section%2===0)block([x,h+.6,0],[1.3,1.3,2.8]);for(const s of [-1,1])block([x,h*.3,s*1.7],[.65,h*.62,1.1],[s*.08,0,0]);}
  for(const side of [-1,1]){const x=side*13,z=variant===1?4:0,height=(side===1&&variant===2?13:22)+r()*7;
   // Actual gaps between tower panels create deep slit windows and shattered tops.
   for(let floor=0;floor<6;floor++)for(let j=0;j<10;j++){if(floor===5&&r()<.4)continue;if((floor===2||floor===4)&&j%3===0)continue;const a=j/10*Math.PI*2;block([x+Math.cos(a)*3.6,(floor+.5)*height/6,z+Math.sin(a)*3.6],[2.3,height/6-.12,1.5],[0,-a,0]);}
   for(let j=0;j<10;j++)if(r()>.28){const a=j/10*Math.PI*2;block([x+Math.cos(a)*3.6,height+.8,z+Math.sin(a)*3.6],[1.5,1.7,1.5],[0,-a,0]);}
   for(let j=0;j<4;j++){const a=j*Math.PI/2;block([x+Math.cos(a)*5.5,4,z+Math.sin(a)*5.5],[1.8,8,2.5],[0,-a,.12]);}
  }
  // Remnant keep, broken flying buttresses, exposed floors and fallen masonry.
  for(const side of [-1,1]){block([side*6,6,-9],[2.2,12,12]);block([side*4,3,-15],[2,9,2],[0,0,side*.27]);}
  block([0,3,-11],[10,1.2,9]);block([0,9,-11],[8,1,8]);for(let j=0;j<28;j++)block([(r()-.5)*38,r()*2,3+r()*16],[.7+r()*2.5,.7+r()*2,1+r()*2],[r()*.9,r()*6,r()*.5],[.52,.48,.50]);
  fortresses.push(baked(parts));
 }
 box.dispose();cylinder.dispose();
 const fall=new T.BufferGeometry(),fp=[],fu=[],fi=[];
 // A scalloped, folded cascade with a shelf lip and accelerating lower strands.
 for(let j=0;j<=32;j++){const t=j/32,w=.46+Math.sin(t*17)*.055+Math.sin(t*39)*.018;for(let k=0;k<=6;k++){const u=k/6,x=(u-.5)*2*w+Math.sin(t*7)*.09;fp.push(x,-t,(Math.sin(u*16+t*11)*.13+Math.sin(t*Math.PI)*.42)*Math.sin(t*Math.PI*.5));fu.push(u,1-t);if(j<32&&k<6){const a=j*7+k;fi.push(a,a+7,a+1,a+1,a+7,a+8);}}}
 fall.setAttribute('position',new T.Float32BufferAttribute(fp,3));fall.setAttribute('uv',new T.Float32BufferAttribute(fu,2));fall.setIndex(fi);fall.computeVertexNormals();keep(fall);
 return {cliffs,islands,fortresses,fall};
}
