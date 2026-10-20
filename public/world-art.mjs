import {createStoneArch} from './easy-landmarks.mjs?v=26';
import * as T from './three.module.js';

// Reusable authored geometry: organic silhouettes and surface detail, baked into
// a handful of draw meshes. +X is animal forward; +Z is oncoming craft forward.
export function createWorldArt(register){
 const keep=g=>{register(g);g.computeBoundingSphere();return g;};
 const ball=new T.SphereGeometry(1,12,8),detailBall=new T.SphereGeometry(1,8,6),box=new T.BoxGeometry(1,1,1);
 const c=(geo,color,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],glow=false)=>({geo,color,pos,scale,rot,glow});
 function bake(parts){const p=[],n=[],col=[],uv=[];for(const a of parts){const src=a.geo.index?a.geo.toNonIndexed():a.geo.clone();src.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...a.pos),new T.Quaternion().setFromEuler(new T.Euler(...a.rot)),new T.Vector3(...a.scale)));const v=src.attributes.position,no=src.attributes.normal,vc=src.attributes.color,color=new T.Color(a.color);for(let i=0;i<v.count;i++){p.push(v.getX(i),v.getY(i),v.getZ(i));n.push(no.getX(i),no.getY(i),no.getZ(i));col.push(color.r*(vc?vc.getX(i):1),color.g*(vc?vc.getY(i):1),color.b*(vc?vc.getZ(i):1));uv.push(a.glow?.75:.25,.5);}src.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return keep(g);}
 function path(points,radius=.03,segments=16,sides=6,taper=1){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const g=new T.TubeGeometry(curve,segments,radius,sides,false);if(taper!==1){const p=g.attributes.position;for(let i=0;i<=segments;i++){const center=curve.getPointAt(i/segments),scale=1-(1-taper)*i/segments;for(let j=0;j<=sides;j++){const k=i*(sides+1)+j;p.setXYZ(k,center.x+(p.getX(k)-center.x)*scale,center.y+(p.getY(k)-center.y)*scale,center.z+(p.getZ(k)-center.z)*scale);}}g.computeVertexNormals();}return keep(g);}
 function ellipsoid(color,pos,scale){return c(ball,color,pos,scale);}
 function loft(rings,sides=14,axis='x'){const p=[],ix=[];for(let i=0;i<rings.length;i++){const r=rings[i];for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;const v=axis==='x'?[r[0],r[1]+Math.sin(a)*r[3],r[2]+Math.cos(a)*r[4]]:[r[1]+Math.cos(a)*r[3],r[2]+Math.sin(a)*r[4],r[0]];p.push(...v);if(i&&j){const k=i*(sides+1)+j;ix.push(k,k-1,k-sides-2,k,k-sides-2,k-sides-1);}}}const count=p.length/3;for(const [end,i]of [[rings[0],0],[rings.at(-1),rings.length-1]]){p.push(...(axis==='x'?[end[0],end[1],end[2]]:[end[1],end[2],end[0]]));const center=p.length/3-1;for(let j=0;j<sides;j++){const k=i*(sides+1)+j;if(i===0)ix.push(center,k+1,k);else ix.push(center,k,k+1);}}
 const direction=Math.sign(rings.at(-1)[0]-rings[0][0]);if((axis==='x'&&direction>0)||(axis==='z'&&direction<0))for(let k=0;k<ix.length;k+=3)[ix[k+1],ix[k+2]]=[ix[k+2],ix[k+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return keep(g);}
 // Closed, slightly cambered membranes/feathers with shaped outlines.
 function leaf(outline,thickness=.016,camber=.035){let contour=outline.map(v=>new T.Vector2(v[0],v[1]));if(T.ShapeUtils.isClockWise(contour))contour.reverse();outline=contour.map(v=>[v.x,v.y]);const faces=T.ShapeUtils.triangulateShape(contour,[]),p=[],ix=[];for(const side of [-1,1])for(const [x,z]of outline)p.push(x,Math.sin(z*2)*camber+side*thickness*.5,z);const count=outline.length;for(const [a,b,d]of faces){ix.push(a,b,d,a+count,d+count,b+count);}for(let i=0;i<count;i++){const j=(i+1)%count;ix.push(i,j+count,j,i,i+count,j+count);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return keep(g);}
 function stone(seed,shape='boulder'){const g=new T.SphereGeometry(1,28,18),p=g.attributes.position,color=new Float32Array(p.count*3),phase=seed*1.71;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),noise=.08*Math.sin(x*5+z*3+phase)+.045*Math.sin(y*13+a*3+phase)*Math.hypot(x,z)+.025*Math.cos(z*19-x*9),r=1+noise;let yy=y;
 if(shape==='island')yy=y>0?y*.20+Math.sin(a*3+phase)*.035*Math.hypot(x,z):y*.87-.08;
 const sx=shape==='island'?1+.14*Math.sin(a*3+phase):1,sz=shape==='island'?.82+.13*Math.cos(a*2+phase):1;
 p.setXYZ(i,x*r*sx,yy*r,z*r*sz);const top=shape==='island'&&y>.22,strata=.84+.10*Math.sin(yy*42+phase+Math.sin(a*2))+.06*Math.cos(x*16+z*12),tone=new T.Color(top?(i%4?0x739c63:0x91ad6e):0xb5aa99);if(!top)tone.lerp(new T.Color(0x65667a),Math.max(0,-y)*.55);tone.multiplyScalar(strata);tone.toArray(color,i*3);}
 // Weld coincident sphere seams/poles before smoothing for continuous rock faces.
 g.setAttribute('color',new T.BufferAttribute(color,3));g.computeVertexNormals();smoothSeams(g);return keep(g);}
 function smoothSeams(g){const p=g.attributes.position,n=g.attributes.normal,map=new Map();for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');if(!map.has(key))map.set(key,new T.Vector3());map.get(key).add(new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)));}for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(','),v=map.get(key).normalize();n.setXYZ(i,v.x,v.y,v.z);}}
 const rocks=Array.from({length:4},(_,i)=>stone(i+2));
 const islands=Array.from({length:4},(_,i)=>{const core=stone(i+1,'island'),parts=[c(core,0xffffff)];
  // Interlocking shelves and roots replace the single inverted-pyramid profile.
  for(let k=0;k<4;k++){const a=k*1.65+i*.8;parts.push(c(rocks[k],0xb9b09c,[Math.cos(a)*.65,-.20-k*.045,Math.sin(a)*.48],[.30,.19,.31]));}
  for(const side of [-1,1]){const x=side*(.28+i*.025),z=side*.14,branches=path([[x,.16,z],[x+.02,.30,z],[x+side*.07,.44,z+.03]],.018,8,5);parts.push(c(branches,0x75694c));for(let k=0;k<3;k++)parts.push(ellipsoid(k%2?0x527956:0x8fa973,[x+side*(k-1)*.055,.42+k*.025,z+(k%2)*.04],[.12,.065,.10]));}
  for(let k=0;k<8;k++){const a=k*2.399+i*.8,x=Math.cos(a)*.69,z=Math.sin(a)*.56,length=.24+(k%3)*.12;parts.push(c(path([[x,-.12,z],[x*.94,-.28,z*.97],[x*.86,-.40-length*.5,z*.89],[x*.90,-.42-length,z*.82]],.014,10,5,.12),k%2?0x655d4d:0x57715a));if(k%2===0)parts.push(ellipsoid(0x6f8959,[x,-.26,z],[.075,.10,.045]));}
  return {geometry:bake(parts),core};});
 // Thick natural sandstone bridges, carved from an irregular rock shelf.
 const arches=[1,3,6].map(seed=>keep(createStoneArch(seed)));
 const pier=loft([[0,0,0,3.0,4.0],[-.10,.12,.1,3.5,4.4],[-.27,-.2,-.1,3.2,4.0],[-.48,.2,.1,3.75,4.5],[-.70,-.12,-.1,3.4,4.3],[-.86,.2,.2,4.2,4.9],[-1,0,0,4.9,5.2]],12,'x');
 // loft uses X longitudinally: turn it into a Y-down rock pillar, retaining a
 // normalized height so columns reach the river at every arch elevation.
 pier.rotateZ(Math.PI/2); // X negative becomes Y negative, widths are X/Z.

 // Subdivided, cambered wing tissue joins continuously at the wrist. Curved
 // ribs sit above the membrane rather than intersecting a flat triangular sheet.
 const wingHeight=z=>.07*Math.sin(z*2)+.04*Math.sin(z*Math.PI/1.9);
 function membraneSurface(outline,outer=false){const base=leaf(outline,.018,0),a=base.attributes.position,ix=base.index;let faces=[];for(let i=0;i<ix.count;i+=3)faces.push([0,1,2].map(k=>new T.Vector3().fromBufferAttribute(a,ix.getX(i+k))));for(let level=0;level<2;level++){const next=[];for(const [a,b,c]of faces){const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);}faces=next;}const p=[],index=[],vertices=new Map();for(const face of faces)for(const v of face){const z=v.z+(outer?.9:0),key=[v.x,v.y,v.z].map(n=>n.toFixed(6)).join(',');if(!vertices.has(key)){const ripple=.0035*Math.sin(v.x*43+z*19)*Math.sin(z*Math.PI/1.9);vertices.set(key,p.length/3);p.push(v.x,wingHeight(z)+v.y+ripple,v.z);}index.push(vertices.get(key));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(index);g.computeVertexNormals();return keep(g);}
 function wingRib(points,outer=false,r=.018){return path(points.map(([x,y,z])=>[x,wingHeight(z+(outer?.9:0))+.02+y*.25,z]),r,12,5,.45);}
 function organicLoft(rings){const centers=new T.CatmullRomCurve3(rings.map(r=>new T.Vector3(r[0],r[1],r[2])),false,'catmullrom',.32),radii=new T.CatmullRomCurve3(rings.map(r=>new T.Vector3(r[3],r[4],0)),false,'catmullrom',.32),samples=[];for(let i=0;i<=26;i++){const t=i/26,p=centers.getPoint(t),r=radii.getPoint(t);samples.push([p.x,p.y,p.z,Math.max(.006,r.x),Math.max(.006,r.y)]);}const g=loft(samples,18);smoothSeams(g);return g;}
 function skinColor(g,skin,belly){const p=g.attributes.position,n=g.attributes.normal,colors=[];for(let i=0;i<p.count;i++){const underside=Math.max(0,-n.getY(i)),tone=.89+.075*Math.sin(p.getX(i)*12+p.getZ(i)*8)+.035*Math.cos(p.getY(i)*23-p.getZ(i)*17),color=new T.Color(skin).lerp(new T.Color(belly),underside*.8).multiplyScalar(tone);colors.push(color.r,color.g,color.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));}
 function skinUV(g,wing=false){const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)*.85,wing?p.getZ(i)*.7:Math.atan2(p.getZ(i),p.getY(i))*.65);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}
 function animal(kind,variant){const dragon=kind==='dragon',skin=[0x688d74,0x9b7961,0x617c9b][variant],belly=[0xc3c0a0,0xc9aa8b,0xafaebc][variant],dark=0x293d3b,parts=[],eyes=[];
 const torso=dragon?organicLoft([[-.86,0,0,.01,.01],[-.66,.02,0,.19,.23],[-.38,.07,0,.31,.29],[-.08,.11,0,.30,.26],[.2,.15,0,.23,.20],[.4,.26,0,.14,.13],[.55,.40,0,.12,.115],[.72,.48,0,.135,.13],[.91,.47,0,.14,.145],[1.07,.42,0,.10,.12],[1.22,.41,0,.055,.08],[1.25,.41,0,.006,.006]]):loft([[-.7,0,0,.01,.01],[-.47,.04,0,.16,.19],[-.05,.06,0,.25,.23],[.26,.1,0,.20,.17],[.48,.19,0,.13,.13],[.68,.21,0,.09,.10],[.72,.20,0,.01,.01]],16);
 if(dragon){skinColor(torso,skin,belly);parts.push(c(torso,0xffffff));}else{parts.push(c(torso,skin));parts.push(ellipsoid(belly,[-.08,-.075,0],[.36,.17,.19]));}
 for(const side of [-1,1]){const eye=dragon?eyes:parts;eye.push(ellipsoid(dark,[dragon?.90:.57,dragon?.51:.23,side*(dragon?.133:.105)],[dragon?.060:.07,dragon?.036:.045,dragon?.023:.025]));eye.push(ellipsoid(0xd4a75c,[dragon?.912:.58,dragon?.51:.23,side*(dragon?.152:.126)],[dragon?.022:.023,dragon?.025:.026,dragon?.007:.008]));eye.push(ellipsoid(0x101b19,[dragon?.917:.59,dragon?.51:.23,side*(dragon?.158:.132)],[dragon?.006:.009,.022,dragon?.004:.005]));if(dragon)eye.push(ellipsoid(0xfff2ca,[.919,.522,side*.163],[.006,.006,.003]));
 if(dragon){
 parts.push(c(path([[.78,.56,side*.11],[.64,.75,side*.17],[.35,.88,side*.22]],.037,14,7,.035),0xaa9b80));
 parts.push(c(path([[.81,.555,side*.115],[.91,.555,side*.16],[1.0,.51,side*.13]],.022,10,6,.4),skin));
 parts.push(c(path([[.84,.371,side*.12],[1.03,.35,side*.112],[1.21,.37,side*.07]],.009,12,5),dark));
 parts.push(ellipsoid(dark,[1.15,.451,side*.066],[.023,.012,.014]));

 parts.push(c(path([[-.38,-.05,side*.17],[-.55,-.20,side*.28],[-.34,-.25,side*.26]],.065,12,7,.6),skin));
 for(let toe=0;toe<3;toe++)parts.push(c(path([[-.34,-.24,side*(.21+toe*.035)],[-.23,-.27,side*(.22+toe*.035)],[-.18,-.30,side*(.22+toe*.035)]],.015,6,5,.2),0xb6ac8f));
 // Small backward cheek horns and muscular shoulder folds.
 parts.push(c(path([[.75,.40,side*.13],[.61,.38,side*.23],[.46,.40,side*.28]],.025,9,6,.04),0xa89c80));
 parts.push(c(path([[.18,.24,side*.17],[-.05,.27,side*.25],[-.26,.14,side*.28]],.022,14,6,.4),skin));
 // Tucked forelegs and hooked claws give the flight pose a complete anatomy.
 parts.push(c(path([[.29,.02,side*.17],[.15,-.09,side*.25],[.32,-.12,side*.24]],.035,9,6,.55),skin));
 for(let toe=0;toe<2;toe++)parts.push(c(path([[.31,-.12,side*(.21+toe*.05)],[.39,-.13,side*(.22+toe*.05)],[.41,-.17,side*(.22+toe*.05)]],.009,6,5,.08),0xc9bea0));
 }
 }
 if(dragon){parts.push(ellipsoid(belly,[1.04,.352,0],[.18,.037,.09]));const plate=leaf([[-.065,-.12],[.04,-.16],[.075,0],[.04,.16],[-.065,.12]],.018,.014);for(let k=0;k<11;k++){const x=-.55+k*.075;parts.push(c(plate,belly,[x,-.23+Math.abs(x)*.035,0],[1,1,1-Math.abs(x)*.6]));}for(let k=0;k<7;k++){const x=.55-k*.18,y=.32+Math.max(0,x)*.35;parts.push(c(leaf([[x-.06,0],[x+.05,0],[x-.015,.14+(k%2)*.035]],.02),0x9b947d,[0,y,0],[1,1,1],[-Math.PI/2,0,0]));}
 }else{parts.push(c(loft([[.66,.20,0,.055,.07],[.84,.17,0,.01,.01]],8),0xd5ad64));for(let f=0;f<7;f++){const z=(f-3)*.044;parts.push(c(leaf([[-.43,z-.035],[-1.03-Math.abs(f-3)*.025,z-.07],[-1.16,z],[-1.02,z+.07],[-.43,z+.035]],.014),f%2?belly:skin,[0,f*.003,0]));}}
 const body=dragon?skinUV(bake(parts)):bake(parts);
 const tail=dragon?bake([c(path([[-.65,.03,0],[-.95,-.01,.02],[-1.35,.06,.06],[-1.72,.16,.10]],.075,18,7,.08),skin),c(leaf([[-1.35,.02],[-1.84,-.07],[-1.70,.11],[-1.37,.15]],.025),belly)]):null;
 const inner=[],outer=[];
 if(dragon){const membrane=0x8e9d7c;inner.push(c(membraneSurface([[.22,.12],[.44,.52],[.28,.90],[-.13,.91],[-.32,.63],[-.61,.40],[-.4,.15]]),membrane));outer.push(c(membraneSurface([[.28,0],[.20,.50],[-.04,.99],[-.21,.60],[-.43,.79],[-.49,.32],[-.72,.36],[-.52,.02],[-.13,0]],true),skin));
 for(const pts of [[[.18,.04,.12],[.43,.09,.50],[.28,.08,.9]],[[.43,.09,.50],[.04,.035,.75],[-.13,.02,.91]],[[.43,.09,.5],[-.2,.02,.46],[-.61,.01,.4]]])inner.push(c(wingRib(pts),belly));
 for(const end of [[-.04,.99],[-.43,.79],[-.72,.36]])outer.push(c(wingRib([[.28,.06,0],[.15,.07,.3],[end[0],.02,end[1]]],true,.014),belly));
 }else{
 inner.push(c(leaf([[.22,.12],[.33,.52],[.11,.82],[-.48,.8],[-.55,.39],[-.26,.13]],.035,.06),skin));
 for(let k=0;k<8;k++){const span=.23+k*.08,x=.07-k*.035;inner.push(c(leaf([[x,span-.06],[x-.36,span-.07],[x-.64,span+.005],[x-.47,span+.065],[x,span+.045]],.014,.03),k>5?0x414f50:k%3?skin:belly,[0,.006+k*.003,0]));}
 for(let k=0;k<9;k++){const z=.02+k*.083,x=.10-k*.06,length=.39+k*.025;outer.push(c(leaf([[x,z-.05],[x-length,z-.07],[x-length-.12,z+.04],[x-length*.6,z+.12],[x+.04,z+.05]],.018,.04),k>5?0x414f50:k%3?skin:belly,[0,.006+k*.003,0]));}
 outer.push(c(path([[.18,.04,0],[.05,.04,.35],[-.25,.04,.75]],.013,12,5),belly));
 }
 const outerMesh=bake(outer);if(dragon)outerMesh.translate(0,-wingHeight(.9),0);
 return {body,tail:dragon?skinUV(tail):tail,eyes:dragon?bake(eyes.map(e=>({...e,geo:detailBall}))):null,inner:dragon?skinUV(bake(inner),true):bake(inner),outer:dragon?skinUV(outerMesh,true):outerMesh,tipY:dragon?wingHeight(.9):0,tipZ:dragon?.9:.8,core:torso};
 }
 const animals={bird:Array.from({length:3},(_,i)=>animal('bird',i)),dragon:Array.from({length:3},(_,i)=>animal('dragon',i))};

 function hull(width,height,length,nose=.07){return loft([[-length,0,0,.015,.015],[-length*.78,0,0,width*.7,height*.7],[-length*.3,0,0,width,height],[length*.35,0,0,width*.75,height*.8],[length*.9,0,0,width*nose,height*.18],[length,0,0,.01,.01]],12,'z');}
 function spacecraft(kind,variant){const id=kind*3+variant,metal=[0x9badaf,0x9c947f,0x7b8e9c][variant],armor=0x394956,trim=[0xcda973,0x68babc,0x987fb5][variant],glass=0x142b3b,parts=[];let core;
 const panel=(pos,scale,color=armor,rot=[0,0,0],glow=false)=>parts.push(c(box,color,pos,scale,rot,glow));
 const pod=(x,y,z,w,h,l,color=metal)=>{const geo=hull(w,h,l,.35);parts.push(c(geo,color,[x,y,z]));return geo;};
 const ring=(r,t=.04)=>keep(new T.TorusGeometry(r,t,6,28));
 const engine=(x,y,z,r=.15)=>{const bell=keep(new T.CylinderGeometry(r,r*.85,.18,12,1,true));parts.push(c(bell,armor,[x,y,z],[1,1,1],[Math.PI/2,0,0]));parts.push(c(ring(r*.72,r*.13),0x84e8ff,[x,y,z-.10],[1,1,1],[0,0,0],true));parts.push(ellipsoid(0x9edaff,[x,y,z-.08],[r*.60,r*.60,.035]));};
 if(id===0){ // Crescent courier: curved blades around a needle cockpit.
 core=hull(.19,.16,.85);parts.push(c(core,metal));for(const s of [-1,1]){parts.push(c(path([[s*.14,0,-.5],[s*.70,-.08,-.35],[s*.85,.04,.32],[s*.48,.12,.9]],.085,22,7),metal));panel([s*.48,.09,.84],[.04,.035,.12],0xe4faff,[0,s*.3,0],true);engine(s*.64,-.02,-.6,.12);}pod(0,.13,.18,.10,.075,.38,glass);
 }else if(id===1){ // Needle skiff: tall dorsal sail and offset drive nacelle.
 core=hull(.17,.15,1.15);parts.push(c(core,metal));parts.push(c(leaf([[-.38,-.7],[.45,-.6],[.20,.65],[-.08,.92]],.05),trim,[0,.05,0],[1,1,1],[0,0,Math.PI/2]));pod(.40,-.03,-.3,.14,.14,.5);panel([.24,-.03,-.38],[.5,.07,.13]);engine(.4,-.03,-.78,.13);engine(0,-.04,-.90,.12);pod(0,.13,.22,.10,.06,.42,glass);
 }else if(id===2){ // Orbital taxi: spherical cabin and three radial ion pods.
 core=keep(new T.SphereGeometry(.43,16,10));parts.push(c(core,metal,[0,0,-.1]));for(let k=0;k<3;k++){const a=k*Math.PI*2/3,x=Math.cos(a)*.62,y=Math.sin(a)*.62;panel([x*.5,y*.5,-.18],[.58,.07,.10],armor,[0,0,a]);pod(x,y,-.25,.12,.12,.42,trim);engine(x,y,-.63,.11);}pod(0,.11,.3,.29,.10,.21,glass);
 }else if(id===3){ // Manta shuttle, broad swept shell and split forward prongs.
 core=hull(.54,.19,.9);parts.push(c(core,metal));for(const s of [-1,1]){parts.push(c(leaf([[0,-.65],[s*.95,-.80],[s*.69,.23],[s*.24,.72],[s*.15,-.2]],.11,.06),metal));pod(s*.35,-.02,.55,.12,.10,.57,trim);engine(s*.4,-.02,-.78,.18);}pod(0,.16,.25,.31,.065,.40,glass);
 }else if(id===4){ // Annular transport: thick halo nacelle around a narrow spinal hull.
 core=hull(.22,.20,.83);parts.push(c(core,metal));parts.push(c(ring(.70,.115),metal,[0,0,-.12]));for(const s of [-1,1]){panel([s*.4,0,-.13],[.65,.10,.10]);pod(s*.69,0,-.15,.10,.17,.49,armor);engine(s*.69,0,-.59,.14);}pod(0,.16,.2,.15,.075,.35,glass);panel([0,.68,-.03],[.20,.04,.11],trim,[0,0,0],true);
 }else if(id===5){ // Asymmetric survey ship: offset cockpit and sensor mast.
 core=hull(.40,.23,.95);parts.push(c(core,metal));pod(.56,.12,.25,.20,.16,.59,metal);pod(.57,.20,.53,.16,.075,.29,glass);panel([.35,.03,.12],[.55,.13,.35]);parts.push(c(ring(.29,.045),armor,[-.53,.12,.12],[1,1,1],[0,Math.PI/2,0]));panel([-.4,.35,-.2],[.07,.68,.08]);engine(-.17,-.06,-.8,.19);engine(.24,-.06,-.8,.19);
 }else if(id===6){ // Deep-space bulk carrier: long ribbed spine and six cargo tanks.
 core=hull(.26,.27,1.3);parts.push(c(core,metal));for(const s of [-1,1])for(let k=0;k<3;k++){const z=-.75+k*.55;pod(s*.45,-.03,z,.25,.33,.29,metal);for(let j=0;j<3;j++)parts.push(c(ring(.255,.018),trim,[s*.45,-.03,z-.17+j*.16],[1,1.24,1]));}pod(0,.28,.78,.34,.17,.35,armor);for(const s of [-1,1])engine(s*.22,0,-1.17,.21);
 }else if(id===7){ // Split-hull freighter with exposed center truss and bridge.
 core=hull(.20,.24,1.12);parts.push(c(core,armor));for(const s of [-1,1]){pod(s*.55,0,-.1,.30,.38,1.05,metal);for(let k=0;k<5;k++)panel([s*.55,.35,-.84+k*.32],[.48,.08,.09],trim);panel([s*.29,.03,-.1],[.52,.16,.16]);engine(s*.55,0,-1,.25);}pod(0,.35,.60,.30,.13,.38,metal);
 }else{ // Tall alien dreadnought: vertical split fins and layered arrow armor.
 core=hull(.42,.32,1.2);parts.push(c(core,metal));for(const s of [-1,1]){parts.push(c(leaf([[-.72,-.93],[.72,-.93],[.40,.24],[0,1.23]],.12,.03),armor,[0,s*.29,0],[1,1,1]));panel([s*.26,s*.43,-.42],[.08,.74,.75],trim,[0,0,s*.25]);engine(s*.25,-.1,-1.0,.19);}engine(0,.21,-.92,.18);pod(0,.29,.36,.23,.06,.45,glass);
 }
 // Recessed bridge windows, navigation lamps, greebles and panel inlays.
 const cabin=[[0,.13,.18,.10,.075,.38],[0,.13,.22,.10,.06,.42],[0,.11,.30,.29,.10,.21],[0,.16,.25,.31,.065,.40],[0,.16,.20,.15,.075,.35],[.57,.20,.53,.16,.075,.29],[0,.31,.84,.25,.09,.25],[0,.38,.68,.23,.07,.25],[0,.29,.36,.23,.06,.45]][id];
 panel([cabin[0],cabin[1]+cabin[4]*.65,cabin[2]+cabin[5]*.65],[cabin[3]*1.1,.018,.028],0xb1e8ee,[0,0,0],true);
 for(const s of [-1,1]){panel([s*.10,.07,.64],[.12,.035,.03],0xd6f4f5,[0,0,0],true);panel([s*.32,-.06,-.3],[.07,.05,.42],trim);}
 for(let k=0;k<(kind===2?7:3);k++){const z=-.70+k*.18;panel([0,.21,z],[.11,.045,.07],armor);}
 // Recessed side windows, engine cowling seams and service hatches give each
 // silhouette visible construction detail without adding separate draw meshes.
 for(const side of [-1,1])for(let k=0;k<(id===6?3:5);k++){const z=-.55+k*.23;
  panel([side*(kind===2?.35:.19),.18,z],[.055,.027,.065],0xb9dae3,[0,0,0],true);
  panel([side*(kind===2?.43:.21),-.025,z],[.035,.035,.10],armor);
 }
 for(let k=0;k<(id===6?3:6);k++)panel([0,.205,-.54+k*.17],[.15,.018,.022],trim);
 // Raised service access, recessed radiator vanes and underbody housings.
 for(const side of [-1,1]){panel([side*(kind===2?.25:.12),-.13,-.32],[kind===2?.13:.07,.065,.22],armor);for(let j=0;j<3;j++)panel([side*(kind===2?.27:.13),-.166,-.4+j*.07],[kind===2?.11:.06,.012,.025],0x1d2b37);}
 const geometry=bake(parts);let max=0;const p=geometry.attributes.position;for(let i=0;i<p.count;i++)max=Math.max(max,Math.hypot(p.getX(i),p.getY(i),p.getZ(i)));const scale=.96/max;geometry.scale(scale,scale,scale);geometry.computeBoundingSphere();
 // Exact central hull geometry provides an inside-volume test without bridging
 // the visible gaps between separated nacelles, fins or crescent arms.
 const collider=core.clone();if(id===2)collider.translate(0,0,-.1);collider.scale(scale,scale,scale);keep(collider);geometry.userData.core=collider;geometry.userData.design=id;geometry.userData.headlamp=[.10*scale,.07*scale,.64*scale];
 // Background traffic keeps the craft's broad construction at a fraction of cost.
 const lodParts=[c(core,metal,id===2?[0,0,-.1]:[0,0,0])];for(const side of [-1,1]){const x=side*(kind===2?.5:kind===1?.48:.27);lodParts.push(c(box,armor,[x,0,-.2],[kind===2?.34:.13,kind===2?.38:.13,kind===2?1.30:.65]));lodParts.push(c(box,trim,[x,0,.24],[.11,.055,.045],[0,0,0],true));}if(kind===1)lodParts.push(c(leaf([[-.80,-.55],[.80,-.55],[.25,.6],[-.25,.6]],.055),metal));const lod=bake(lodParts);let lodMax=0;const lp=lod.attributes.position;for(let i=0;i<lp.count;i++)lodMax=Math.max(lodMax,Math.hypot(lp.getX(i),lp.getY(i),lp.getZ(i)));lod.scale(.96/lodMax,.96/lodMax,.96/lodMax);lod.computeBoundingSphere();geometry.userData.lod=lod;return geometry;
 }
 const traffic=Array.from({length:9},(_,i)=>spacecraft(Math.floor(i/3),i%3));
 // Only baked geometry is rendered; construction primitives can be released.
 ball.dispose();detailBall.dispose();box.dispose();
 return {islands,rocks,arches,pier,animals,traffic};
}

// Smooth bounded loops in independently oriented flight planes. Position and
// orientation share the same analytic derivative, with no heading reversals.
const forward=new T.Vector3(),side=new T.Vector3(),up=new T.Vector3(),basis=new T.Matrix4(),roll=new T.Quaternion();
export const DRAGON_BASE_SPEED=8,DRAGON_WING_RATE=12;
export function animateCreature(a,time,d,dt=.01){
 const heading=a.phase*2.399,axis=new T.Vector3(Math.cos(heading),Math.sin(a.phase*1.7)*.48,Math.sin(heading)).normalize(),second=new T.Vector3(-Math.sin(heading)*.65,.8,Math.cos(heading)*.65);second.addScaledVector(axis,-second.dot(axis)).normalize();
 const dragon=a.creature==='dragon',radius=a.amp,travel=6*time+300*(Math.exp(-time/60)-1),dragonDistance=(DRAGON_BASE_SPEED+6)*time+360*(Math.exp(-time/60)-1),angle=a.phase+(dragon?dragonDistance/Math.max(radius,.1):Math.abs(a.rate)*travel*.45),co=Math.cos(angle),si=Math.sin(angle);
 a.g.position.set(a.baseX+radius*(co*axis.x+si*.75*second.x),a.baseY+radius*(co*axis.y+si*.75*second.y),a.baseZ+radius*(co*axis.z+si*.75*second.z));
 forward.copy(axis).multiplyScalar(-si).addScaledVector(second,co*.75).normalize();side.crossVectors(forward,T.Object3D.DEFAULT_UP).normalize();up.crossVectors(side,forward).normalize();basis.makeBasis(forward,up,side);const q=new T.Quaternion().setFromRotationMatrix(basis);roll.setFromAxisAngle(new T.Vector3(1,0,0),Math.sin(angle)*.20);q.multiply(roll);a.g.quaternion.slerp(q,1-Math.exp(-6*dt));
 const bird=a.creature==='bird',period=bird?7:7.5,cycle=(time+a.phase*2)%period,glide=cycle>(bird?4.5:6.7),beat=time*(bird?8:DRAGON_WING_RATE)+a.phase;
 const smooth=x=>{const t=Math.min(1,Math.max(0,x));return t*t*(3-2*t);},feather=bird?1:cycle<5.7?1:cycle<6.1?1-smooth((cycle-5.7)/.4):cycle<6.7?0:smooth((cycle-6.7)/.8);
 for(const [i,w]of (a.wings||[]).entries()){const sign=i===0?-1:1,stroke=bird?Math.sin(beat):Math.sin(beat)+Math.sin(beat*2)*.12;w.rotation.x=sign*(.08+stroke*(bird?(glide?.035:.40):.045+.47*feather));if(!bird){w.rotation.y=sign*Math.sin(beat-.5)*.035*feather;w.rotation.z=Math.sin(beat+.2)*.035*feather;}if(w.userData.tip)w.userData.tip.rotation.x=sign*Math.sin(beat-(bird?.65:.8))*(bird?(glide?.035:.22):.055+.32*feather);}
 if(a.tail){a.tail.rotation.y=Math.sin(time*1.9+a.phase)*.07-Math.sin(angle)*.035;a.tail.rotation.z=Math.sin(time*1.4+a.phase)*.035;}
 return forward;
}
