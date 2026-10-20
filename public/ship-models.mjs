import {EXPANSION_SHIPS,buildExpansion} from './fleet-expansion.mjs?v=29';
import * as THREE from './three.module.js';

// Models share the flight controller's existing envelope. Only their appearance differs.
export function buildSpacecraft(id,paint){
  const model=new THREE.Group(),flames=[],animations=[],materials=[],geometries=new Set();
  const palettes={
    'armored-flyer':[0xa91f31,0xe4b75a,0x80eafa],
    'saucer-freighter':[0xc7c4b6,0x8f483c,0x65dfff],
    comet:[0xe3dfd2,0xb84d36,0xff8c9c],
    'night-glider':[0x171d29,0x444c58,0xffa65d],
    dart:[0x858f9e,0x303747,0x84e9dd],
    'exploration-cruiser':[0xd6e0e6,0x778f9e,0x78bfff],
    vanguard:[0x71867c,0xc69961,0xffb76f],
    'twin-pod-racer':[0xd9aa32,0x385985,0x8feeff],
    'stealth-phantom':[0x292e41,0x747089,0xc29dff],
    'solar-skimmer':[0xc4a67a,0x9c5637,0xffb963]
  };
  const p=palettes[id]||EXPANSION_SHIPS.find(s=>s.id===id)?.palette||palettes.comet,hullColor=p[0],trimColor=p[1],engineColor=paint&&paint.id!=='sunbeam'?(paint.exhaust??paint.accent):p[2];
  function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,metalness:.36,roughness:.4,...extra});materials.push(m);return m;}
  const hull=material(hullColor),trim=material(trimColor),dark=material(0x252c38,{roughness:.55}),glass=material(0x071c2b,{metalness:.65,roughness:.14}),metal=material(0x69727b,{metalness:.65,roughness:.37}),light=material(p[2],{emissive:p[2],emissiveIntensity:1.5}),black=material(0x111820,{roughness:.8});
  const flameMat=new THREE.MeshBasicMaterial({color:engineColor,transparent:true,opacity:.8,depthWrite:false});materials.push(flameMat);const coreMat=new THREE.MeshBasicMaterial({color:new THREE.Color(engineColor).lerp(new THREE.Color(0xffffff),.80)});materials.push(coreMat);const engineLight=material(engineColor,{emissive:engineColor,emissiveIntensity:1.8});hull.name='ship-hull';trim.name='ship-trim';engineLight.name='engine-glow';flameMat.name='engine-flame';coreMat.name='engine-core';light.name='ship-lamps';
  function part(g,m,x=0,y=0,z=0,parent=model){geometries.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
  function box(w,h,d,m,x=0,y=0,z=0,bevel=.06,parent=model){const shape=new THREE.Shape(),b=Math.min(bevel,w*.2,d*.2,h*.25);shape.moveTo(-w/2+b,-d/2);shape.lineTo(w/2-b,-d/2);shape.lineTo(w/2,-d/2+b);shape.lineTo(w/2,d/2-b);shape.lineTo(w/2-b,d/2);shape.lineTo(-w/2+b,d/2);shape.lineTo(-w/2,d/2-b);shape.lineTo(-w/2,-d/2+b);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:h-2*b,bevelEnabled:b>0,bevelThickness:Math.min(b,h*.2),bevelSize:b,bevelSegments:1,steps:1,curveSegments:1});g.rotateX(Math.PI/2);g.translate(0,(h-2*b)/2,0);return part(g,m,x,y,z,parent);}
  function ball(rx,ry,rz,m,x=0,y=0,z=0){const o=part(new THREE.SphereGeometry(1,12,8),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
  function cylinder(r,length,m,x=0,y=0,z=0,r2=r,segments=12,parent=model){const o=part(new THREE.CylinderGeometry(r2,r,length,segments),m,x,y,z,parent);o.rotation.x=Math.PI/2;return o;}
  function plate(points,thickness,m,y=0,parent=model){const sh=new THREE.Shape();sh.moveTo(points[0][0],points[0][1]);for(const [x,z]of points.slice(1))sh.lineTo(x,z);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:thickness,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:1,steps:1,curveSegments:1});g.rotateX(Math.PI/2);g.translate(0,y+thickness/2,0);return part(g,m,0,0,0,parent);}
  function strut(a,b,r,m,parent=model){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),o=part(new THREE.CylinderGeometry(r,r,delta.length(),8),m,0,0,0,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  function engine(x,y,z,r=.3,length=.85,parent=model){cylinder(r,length,dark,x,y,z,r*.9,12,parent);cylinder(r*.91,.09,metal,x,y,z+length*.5+.01,r*.91,16,parent);cylinder(r*.72,.1,engineLight,x,y,z+length*.5+.07,r*.72,16,parent);const f=part(new THREE.ConeGeometry(r*.68,1.2,12),flameMat,x,y,z+length*.5+.68,parent);f.rotation.x=Math.PI/2;flames.push(f);const c=part(new THREE.ConeGeometry(r*.34,.8,10),coreMat,x,y,z+length*.5+.45,parent);c.rotation.x=Math.PI/2;flames.push(c);}
  function vents(x,y,z,count=4,side=1){for(let i=0;i<count;i++)box(.05,.022,.35,black,x+i*.11*side,y,z,.005);}
  function cockpit(x,y,z,w=.4,l=.8){const canopy=ball(w,.23,l,glass,x,y,z);box(.055,.035,l*1.6,trim,x,y+.22,z,.008);return canopy;}
  function wingShape(side,parent=model){return plate([[side*.45,-1.35],[side*2.65,.35],[side*2.7,1.2],[side*.6,.85]],.11,hull,0,parent);}

  function shapePlate(shape,thickness,m,y=0,bevel=.025,curves=12){const g=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,steps:1,curveSegments:curves});g.rotateX(Math.PI/2);g.translate(0,y+thickness/2,0);return part(g,m);}
  function curve(points,r,m,segments=18,sides=6,parent=model){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return part(new THREE.TubeGeometry(path,segments,r,sides,false),m,0,0,0,parent);}
  function ring(r,t,m,x,y,z,parent=model,segments=28){return part(new THREE.TorusGeometry(r,t,6,segments),m,x,y,z,parent);}
  // Closed angular hull, sections [z, half-width, half-height, center-y].
  function hullLoft(sections,m,parent=model){const p=[],ix=[],sides=8;for(let i=0;i<sections.length;i++){const [z,w,h,cy=0]=sections[i];for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;p.push(Math.cos(a)*w,cy+Math.sin(a)*h,z);if(i&&j){const k=i*(sides+1)+j;ix.push(k,k-1,k-sides-2,k,k-sides-2,k-sides-1);}}}for(const end of [0,sections.length-1]){const [z,w,h,cy=0]=sections[end],center=p.length/3;p.push(0,cy,z);for(let j=0;j<sides;j++){const k=end*(sides+1)+j;if(!end)ix.push(center,k+1,k);else ix.push(center,k,k+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return part(g,m,0,0,0,parent);}
  function seam(points,r=.012,m=dark){return curve(points,r,m,12,5);}
  function stencil(text,size,x,y,z,m=dark){const font={N:['101','111','111','111','101'],C:['111','100','100','100','111'],'-':['000','000','111','000','000'],'1':['010','110','010','010','111'],'7':['111','001','010','010','010'],'0':['111','101','101','101','111'],R:['110','101','110','101','101'],E:['111','100','110','100','111'],D:['110','101','101','101','110'],'5':['111','100','111','001','111']};const width=text.length*4*size;for(let i=0;i<text.length;i++)for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(font[text[i]]?.[row]?.[col]==='1')part(new THREE.BoxGeometry(size*.85,.006,size*.85),m,x-width/2+(i*4+col)*size,y,z+row*size);}

  if(buildExpansion(id,{model,hull,trim,dark,glass,metal,light,engineLight,black,material,part,box,ball,cylinder,plate,strut,engine,vents,cockpit,curve,ring,hullLoft,flames,flameMat,coreMat})){
    // Expansion craft use the same batching, footprint and flight controller below.
  }else if(id==='armored-flyer'){
    // Classic red-and-gold armored anatomy, pitched to reveal the face and reactor in chase view.
    hull.metalness=.68;hull.roughness=.24;trim.metalness=.78;trim.roughness=.27;
    const redDark=material(0x701122,{metalness:.65,roughness:.3}),joint=material(0x11151c,{metalness:.35,roughness:.55});
    function armor(rx,ry,rz,m,x,y,z){const o=part(new THREE.SphereGeometry(1,20,12),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
    function repulsor(x,y,z,r){cylinder(r,.045,trim,x,y,z,r,20);cylinder(r*.74,.055,engineLight,x,y,z+.035,r*.74,20);const f=part(new THREE.ConeGeometry(r*.64,.92,16),flameMat,x,y,z+.5);f.rotation.x=Math.PI/2;flames.push(f);const c=part(new THREE.ConeGeometry(r*.3,.64,12),coreMat,x,y,z+.36);c.rotation.x=Math.PI/2;flames.push(c);}
    // A narrow waist and separate pectoral plates replace the box-shaped torso.
    armor(.49,.24,.64,joint,0,0,-.65);armor(.29,.2,.43,hull,-.255,.15,-.82);armor(.29,.2,.43,hull,.255,.15,-.82);
    plate([[-.48,-1.07],[-.2,-1.25],[0,-1.1],[.2,-1.25],[.48,-1.07],[.35,-.86],[.14,-.95],[0,-.83],[-.14,-.95],[-.35,-.86]],.065,redDark,.3);
    const reactorRing=part(new THREE.CylinderGeometry(.175,.175,.048,24),metal,0,.335,-.8);const reactor=part(new THREE.CylinderGeometry(.123,.123,.055,24),light,0,.37,-.8);reactor.name='arc-reactor';part(new THREE.CylinderGeometry(.074,.074,.06,20),material(0xe9ffff,{emissive:0xd8faff,emissiveIntensity:1.5}),0,.378,-.8);
    for(const side of [-1,1]){armor(.12,.12,.37,trim,side*.4,.02,-.42);strut([side*.4,.11,-.35],[side*.22,.13,.1],.025,joint);}
    for(let i=0;i<4;i++){const z=-.31+i*.145;box(.46-i*.035,.115,.13,i%2?redDark:hull,0,.14,z,.025);}
    armor(.34,.23,.28,hull,0,-.015,.25);box(.34,.07,.17,trim,0,.22,.26,.025);
    // Helmet with a shaped gold faceplate, two distinct white-blue eyes and mouth slit.
    armor(.315,.32,.37,hull,0,.085,-1.66);armor(.23,.14,.15,joint,0,.015,-1.31);
    const face=plate([[-.225,-1.85],[-.195,-2.005],[-.11,-2.085],[.11,-2.085],[.195,-2.005],[.225,-1.85],[.245,-1.65],[.17,-1.55],[-.17,-1.55],[-.245,-1.65]],.055,trim,.325);face.name='gold-faceplate';
    box(.22,.065,.14,hull,0,.38,-1.49,.03);
    for(const side of [-1,1]){const eye=box(.145,.026,.055,light,side*.119,.39,-1.835,.008);eye.rotation.y=side*-.14;eye.name=side<0?'left-eye':'right-eye';box(.065,.04,.15,hull,side*.24,.36,-1.9,.015);armor(.073,.115,.11,trim,side*.3,.08,-1.66);}
    box(.17,.018,.035,joint,0,.37,-2.018,.006);box(.115,.035,.052,trim,0,.36,-2.063,.01);
    // Rounded shoulders, gold upper arms, red forearms and separate gloves.
    for(const side of [-1,1]){
      armor(.29,.25,.32,hull,side*.65,.035,-.94);armor(.19,.19,.18,joint,side*.78,-.005,-.65);
      armor(.16,.16,.3,trim,side*.84,-.035,-.46);armor(.175,.14,.14,joint,side*.94,-.04,-.17);
      armor(.215,.185,.32,hull,side*1.0,-.01,.12);box(.25,.045,.28,redDark,side*1.01,.17,.14,.025);
      armor(.16,.105,.2,hull,side*1.07,-.025,.53);box(.19,.035,.13,trim,side*1.07,.085,.55,.018);
      for(let j=0;j<4;j++)box(.038,.055,.11,hull,side*(.99+j*.05),-.018,.71,.009);
      armor(.07,.07,.12,trim,side*1.22,-.025,.53);repulsor(side*1.07,-.035,.79,.115);
      // Thighs, dark knee joints, gold kneecaps and tall red armored boots.
      armor(.205,.22,.39,hull,side*.255,-.015,.68);armor(.12,.14,.22,trim,side*.39,.03,.71);
      armor(.16,.16,.15,joint,side*.26,0,1.07);box(.23,.09,.2,trim,side*.26,.17,1.06,.035);
      armor(.195,.19,.37,hull,side*.265,.005,1.48);plate([[side*.14,1.23],[side*.38,1.23],[side*.34,1.76],[side*.18,1.76]],.045,redDark,.18);
      box(.3,.22,.39,hull,side*.265,.015,1.88,.065);box(.22,.045,.17,trim,side*.265,.15,1.87,.03);repulsor(side*.265,-.02,2.08,.15);
    }
    // Fly chest-down, head first. Roll around the flight axis, not across it.
    model.rotation.set(.10,0,Math.PI);
  }else if(id==='saucer-freighter'){
    ball(2.12,.32,2.02,hull,0,0,.1);const disk=part(new THREE.CylinderGeometry(2.02,2.12,.16,24),trim,0,-.02,.1);part(new THREE.CylinderGeometry(1.85,1.98,.14,24),hull,0,.2,.1);
    for(const side of [-1,1]){plate([[side*.33,-1.25],[side*1.2,-1.25],[side*1.13,-2.85],[side*.48,-2.85]],.23,hull,.04);box(.4,.05,.7,dark,side*.78,.24,-2.04,.03);}
    box(.65,.35,1.2,hull,2.03,.12,-.74,.08);cylinder(.31,.67,hull,2.03,.13,-1.47,.27);cockpit(2.03,.34,-1.65,.27,.43);
    part(new THREE.CylinderGeometry(.61,.69,.16,14),dark,0,.33,.2);part(new THREE.CylinderGeometry(.44,.5,.14,14),hull,0,.46,.2);box(.08,.1,.8,metal,0,.58,.2,.01);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;const o=box(.62,.025,.26,i%2?trim:metal,Math.cos(a)*1.32,.35,Math.sin(a)*1.32+.1,.025);o.rotation.y=-a;}
    box(2.5,.24,.28,dark,0,0,1.92,.07);for(let i=-4;i<=4;i++){const x=i*.255,z=2.12-.2*(x*x),slot=box(.25,.13,.09,engineLight,x,0,z,.02);slot.rotation.y=x*.24;}for(const x of [-.76,0,.76]){const f=part(new THREE.ConeGeometry(.1,.7,10),flameMat,x,0,2.49);f.rotation.x=Math.PI/2;flames.push(f);}
    strut([-.68,.3,-.42],[-.68,.77,-.42],.045,metal);const dish=part(new THREE.SphereGeometry(.29,20,10,0,Math.PI*2,0,Math.PI/2),metal,-.68,.79,-.42);dish.rotation.x=-.6;strut([-.68,.8,-.42],[-.68,.99,-.51],.016,trim);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;strut([Math.cos(a)*.7,.37,Math.sin(a)*.7+.1],[Math.cos(a)*1.78,.31,Math.sin(a)*1.78+.1],.014,dark);}
    strut([-.65,.38,-1.1],[-1.4,.32,.72],.024,trim);strut([.65,.38,-1.1],[1.4,.32,.72],.024,trim);
  }else if(id==='comet'){
    // Red Squadron proportions: long faceted nose, framed canopy, four
    // independently opened S-foils, four cylinders and slender laser cannons.
    hullLoft([[-3.14,.045,.055,.0],[-2.6,.12,.105,0],[-1.05,.26,.18,0],[-.2,.36,.26,0],[.7,.32,.24,0],[1.38,.21,.19,0]],hull);
    hullLoft([[-1.32,.06,.03,.18],[-.98,.20,.20,.27],[-.26,.25,.20,.30],[.24,.20,.13,.28],[.33,.02,.02,.21]],glass);
    for(const side of [-1,1]){seam([[side*.18,.45,-.98],[side*.26,.49,-.25],[side*.19,.40,.22]],.018,metal);seam([[side*.05,.08,-3.0],[side*.21,.17,-1.32]],.018,trim);}
    box(.43,.035,.20,hull,0,.51,-.26,.01);box(.035,.028,1.12,hull,0,.5,-.4,.008);
    for(const side of [-1,1])for(const up of [-1,1]){const foil=new THREE.Group();foil.rotation.z=side*up*.31;model.add(foil);
      plate([[side*.48,-.37],[side*2.64,.18],[side*2.64,.99],[side*.48,.86]],.075,hull,0,foil);
      plate([[side*1.25,-.09],[side*2.53,.23],[side*2.53,.42],[side*1.25,.14]],.018,trim,.06,foil);
      for(let k=0;k<5;k++)box(.055,.02,.36,trim,side*(1.70+k*.12),.075,.62,.003,foil);
      cylinder(.085,1.80,hull,side*2.60,0,-.31,.085,12,foil);cylinder(.052,.88,metal,side*2.60,0,-1.55,.052,10,foil);cylinder(.027,.47,dark,side*2.60,0,-2.22,.027,8,foil);ring(.09,.018,metal,side*2.60,0,-1.17,foil,16);
      cylinder(.33,.83,hull,side*.80,0,.41,.33,20,foil);cylinder(.25,.05,black,side*.80,0,-.03,.25,20,foil);engine(side*.80,0,1.03,.26,.75,foil);
      for(const dx of [-.12,.12])box(.035,.022,.52,metal,side*.80+dx,.31,.43,.005,foil);
    }
    const droid=part(new THREE.SphereGeometry(.145,20,12,0,Math.PI*2,0,Math.PI/2),hull,0,.31,.46);for(let k=0;k<4;k++)box(.055,.022,.06,trim,Math.sin(k*Math.PI/2)*.1,.41,.46+Math.cos(k*Math.PI/2)*.1,.005);box(.034,.03,.03,light,0,.44,.39,.003);
    box(.48,.025,.38,trim,0,.23,.99,.02);vents(-.14,.255,.94,3);stencil('RED5',.045,0,.26,1.15,trim);
  }else if(id==='night-glider'){
    // 1989-style Batwing: a broad crescent, pointed cowl ears and deeply
    // scalloped trailing lobes. The silhouette stays legible from chase view.
    const outline=new THREE.Shape();outline.moveTo(0,-1.96);outline.lineTo(.34,-2.48);outline.lineTo(.49,-1.67);
    outline.bezierCurveTo(.95,-1.43,1.65,-1.96,2.48,-2.48);outline.bezierCurveTo(2.98,-2.17,3.43,-1.12,3.50,-.17);
    outline.bezierCurveTo(3.01,-.65,2.58,-.11,2.61,.72);outline.bezierCurveTo(2.17,.13,1.70,.13,1.60,1.36);outline.bezierCurveTo(1.23,.66,.84,.72,.72,1.72);outline.lineTo(0,2.15);
    outline.lineTo(-.72,1.72);outline.bezierCurveTo(-.84,.72,-1.23,.66,-1.60,1.36);outline.bezierCurveTo(-1.70,.13,-2.17,.13,-2.61,.72);outline.bezierCurveTo(-2.58,-.11,-3.01,-.65,-3.50,-.17);outline.bezierCurveTo(-3.43,-1.12,-2.98,-2.17,-2.48,-2.48);outline.bezierCurveTo(-1.65,-1.96,-.95,-1.43,-.49,-1.67);outline.lineTo(-.34,-2.48);outline.closePath();
    const bat=shapePlate(outline,.15,hull,0,.045,12);bat.name='batwing-silhouette';const bp=bat.geometry.attributes.position;for(let i=0;i<bp.count;i++){const x=bp.getX(i),z=bp.getZ(i),camber=.12*Math.exp(-x*x*.5)+.055*Math.cos(z*.8)*(1-Math.min(1,Math.abs(x)/3.5));bp.setY(i,bp.getY(i)+camber);}bat.geometry.computeVertexNormals();
    hull.metalness=.58;hull.roughness=.32;trim.metalness=.64;trim.roughness=.38;
    hullLoft([[-2.25,.045,.06,.12],[-1.35,.30,.28,.20],[-.4,.44,.35,.20],[.65,.36,.26,.22],[1.7,.12,.12,.14]],dark);
    const canopy=hullLoft([[-1.22,.035,.035,.36],[-.94,.19,.20,.40],[-.25,.26,.23,.42],[.29,.16,.13,.39],[.43,.02,.02,.35]],glass);canopy.name='batwing-canopy';
    for(const side of [-1,1]){
      curve([[side*.3,.42,-1.02],[side*.38,.41,-.45],[side*.24,.39,.29]],.025,trim);
      for(const [tipX,tipZ]of [[2.47,-2.31],[3.20,-.25],[1.59,1.23]])curve([[side*.48,.28,-.45],[side*1.20,.22,-.65],[side*tipX,.12,tipZ]],.019,metal);
      plate([[side*.58,-.9],[side*1.24,-1.05],[side*2.37,-2.07],[side*1.75,-.58],[side*.64,.31]],.028,trim,.17);
      plate([[side*.61,.2],[side*1.57,.39],[side*1.30,.71],[side*.67,1.25]],.035,dark,.19);
      engine(side*.49,.07,1.06,.23,.48);box(.39,.10,.75,hull,side*.49,.26,.94,.055);
      for(let i=0;i<5;i++)box(.29,.025,.045,black,side*.49,.33,.52+i*.11,.005);
    }
    curve([[0,.64,-1.04],[0,.67,-.4],[0,.51,.44]],.021,trim);
    model.rotation.x=.17; // slight cinematic climb exposes the scalloped deck in chase view
    const badge=material(0xc49b45,{metalness:.6,roughness:.45});plate([[-.15,.49],[-.25,.42],[-.18,.59],[-.09,.55],[0,.66],[.09,.55],[.18,.59],[.25,.42],[.15,.49],[0,.46]],.018,badge,.48);
  }else if(id==='dart'){
    ball(.6,.57,.72,dark,0,0,0);ball(.43,.39,.1,glass,0,0,-.66);const windowRim=part(new THREE.TorusGeometry(.395,.043,8,24),metal,0,0,-.745);for(let j=0;j<8;j++){const a=j*Math.PI/4;strut([0,0,-.775],[Math.cos(a)*.37,Math.sin(a)*.37,-.775],.014,metal);}
    for(const side of [-1,1]){strut([side*.45,0,0],[side*1.83,0,.18],.15,metal);const wing=new THREE.Group();wing.position.set(side*1.86,0,.18);wing.rotation.z=Math.PI/2;model.add(wing);plate([[-1.08,-1.38],[1.08,-1.38],[1.4,0],[1.08,1.38],[-1.08,1.38],[-1.4,0]],.1,metal,0,wing);plate([[-.91,-1.16],[.91,-1.16],[1.17,0],[.91,1.16],[-.91,1.16],[-1.17,0]],.12,black,.08,wing);for(let j=-1;j<=1;j++){const brace=box(.045,.025,2.36,trim,j*.55,.16,0,.006,wing);}for(const [x,z]of [[-.91,-1.16],[.91,-1.16],[1.17,0],[.91,1.16],[-.91,1.16],[-1.17,0]])strut([0,.18,0],[x,.18,z],.027,metal,wing);engine(side*.32,0,.51,.18,.25);}
    box(.12,.04,.16,light,-.22,.08,-.75,.01);box(.12,.04,.16,light,.22,.08,-.75,.01);
  }else if(id==='exploration-cruiser'){
    ball(1.85,.2,1.36,hull,0,.33,-1.22);part(new THREE.CylinderGeometry(1.58,1.75,.1,32),metal,0,.28,-1.22);ball(1.62,.15,1.19,hull,0,.41,-1.22);part(new THREE.CylinderGeometry(.28,.4,.1,16),trim,0,.59,-1.22);box(.3,.13,.32,glass,0,.66,-1.3,.03);
    ball(.44,.42,1.16,hull,0,-.3,.58);strut([0,-.1,-.7],[0,.12,-.3],.22,metal);for(const side of [-1,1]){strut([side*.25,-.12,.6],[side*1.55,.27,1.03],.09,metal);cylinder(.24,2.15,hull,side*1.66,.31,.98,.2);cylinder(.19,.29,trim,side*1.66,.31,-.2,.19);box(.1,.06,1.58,engineLight,side*1.66,.53,1,.015);engine(side*1.66,.31,1.92,.17,.2);}
    for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.07,.024,.04,light,Math.cos(a)*1.45,.52,Math.sin(a)*1.02-1.22,.002);}
    const collector=material(0xb72724,{emissive:0xb51d16,emissiveIntensity:.6});for(const side of [-1,1])ball(.18,.18,.12,collector,side*1.66,.31,-.27);cylinder(.19,.08,trim,0,-.3,-.58,.19,20);cylinder(.13,.09,light,0,-.3,-.64,.13,20);engine(0,-.3,1.41,.2,.24);
  }else if(id==='vanguard'){
    ball(.87,.38,1.4,hull,0,0,-.45);box(1.05,.5,1.85,hull,0,.04,-.68,.13);cockpit(0,.43,-1.02,.43,.65);box(.76,.17,.65,trim,0,.4,.14,.07);
    for(const side of [-1,1]){box(.75,.2,.8,dark,side*.91,-.06,.25,.05);box(.78,.52,1.94,hull,side*1.47,.04,.26,.1);box(.5,.14,.73,trim,side*1.47,.37,-.02,.04);box(.34,.2,.42,glass,side*1.47,.22,-.85,.04);engine(side*1.47,.03,1.23,.31,.51);engine(side*.46,-.12,1.17,.22,.48);cylinder(.07,1.0,metal,side*.76,-.1,-1.55,.07,8);vents(side*1.65,.35,.67,3,-side);}
    plate([[-.5,-2.1],[.5,-2.1],[.58,-1.2],[-.58,-1.2]],.12,trim,.15);for(const side of [-1,1]){plate([[side*1.73,-.5],[side*2.21,-.13],[side*2.13,.8],[side*1.73,.6]],.12,hull);box(.16,.11,.38,dark,side*.54,.45,.51,.03);}
  }else if(id==='twin-pod-racer'){
    // Anakin-style racing layout: two enormous yellow turbine engines far
    // ahead of a tiny open cockpit, connected by sagging control cables.
    const alloy=material(0x9aa5a7,{metalness:.78,roughness:.38}),burnt=material(0x4b4440,{metalness:.58,roughness:.58}),binder=material(0xa7c8ff,{emissive:0x609bff,emissiveIntensity:3.3});
    animations.push(t=>{binder.emissiveIntensity=3.1+Math.sin(t*41)*.35+Math.sin(t*67)*.18;});
    for(const side of [-1,1]){
      const x=side*1.94,z=-2.10,shell=hullLoft([[-3.85,.60,.60,0],[-3.58,.60,.60,0],[-2.98,.62,.62,0],[-2.2,.54,.54,0],[-1.35,.42,.42,0],[-.85,.31,.31,0]],hull);shell.position.x=x;shell.name=side<0?'left-pod-engine':'right-pod-engine';
      cylinder(.58,.055,dark,x,0,-3.90,.58,24);cylinder(.51,.06,alloy,x,0,-3.93,.51,24);cylinder(.45,.065,black,x,0,-3.97,.45,24);cylinder(.14,.10,metal,x,0,-4.01,.10,16);
      for(let k=0;k<12;k++){const a=k/12*Math.PI*2,blade=box(.055,.17,.025,alloy,x+Math.cos(a)*.28,Math.sin(a)*.28,-4.02,.008);blade.rotation.z=a-.45;}
      for(const zz of [-3.32,-2.95,-2.15,-1.48]){const r=zz< -2.8?.62:zz< -1.8?.55:.44;ring(r,.032,metal,x,0,zz);}
      for(const a of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){const xx=x+Math.cos(a)*.54,yy=Math.sin(a)*.54;curve([[xx,yy,-3.33],[xx,yy,-2.67],[x+Math.cos(a)*.40,Math.sin(a)*.40,-1.39]],.025,alloy);}
      for(let k=0;k<4;k++){const vane=plate([[x+side*.38,-2.30-k*.09],[x+side*.74,-2.31-k*.09],[x+side*.60,-1.70-k*.09],[x+side*.35,-1.72-k*.09]],.025,trim,.13);}
      box(.48,.045,.32,trim,x,.59,-2.93,.02);box(.46,.045,.32,trim,x,.51,-2.24,.02);
      for(let k=0;k<5;k++)box(.19,.025,.045,black,x,.57,-2.77+k*.10,.005);
      cylinder(.36,.38,burnt,x,0,-.83,.32,20);engine(x,0,-.53,.29,.35);
      // No rigid aircraft wing: delicate cable pairs trail the powerplants.
      curve([[side*.22,-.08,.88],[side*.73,-.18,.37],[side*1.38,-.12,-.35],[side*1.91,-.04,-1.05]],.014,alloy,24,5);
      curve([[side*.26,.02,1.01],[side*.78,-.07,.36],[side*1.37,-.06,-.49],[side*1.91,.08,-1.11]],.011,dark,24,5);
    }
    for(let k=0;k<3;k++){const tether=curve([[-1.36,.025,-2.62],[-.94,.05+Math.sin(k)*.07,-2.71],[-.45,-.06,-2.59],[0,.065,-2.73],[.45,-.04,-2.65],[.96,.05,-2.73],[1.36,.02,-2.62]],k? .012:.025,k?light:binder,28,5);if(k===0)tether.name='pod-energy-binder';}
    const pod=hullLoft([[.66,.045,.065,-.12],[1.13,.30,.13,-.10],[1.72,.35,.17,-.10],[2.12,.21,.12,-.10],[2.3,.05,.06,-.10]],trim);pod.name='podracer-cockpit';
    box(.40,.04,.58,black,0,.07,1.65,.04);ball(.19,.10,.22,dark,0,.11,1.82);ball(.095,.10,.10,hull,0,.24,1.81); // helmet/seat
    const shield=ball(.24,.16,.23,glass,0,.13,1.28);box(.10,.022,.75,hull,0,.05,1.01,.01);for(const side of [-1,1]){curve([[side*.23,.09,1.27],[side*.32,.15,1.58],[side*.23,.12,1.96]],.024,hull);box(.06,.09,.18,metal,side*.19,.12,1.53,.01);}
  }else if(id==='stealth-phantom'){
    plate([[0,-2.5],[3.06,1.37],[1.3,.88],[.72,1.75],[0,1.33],[-.72,1.75],[-1.3,.88],[-3.06,1.37]],.13,hull);
    plate([[0,-2.12],[.63,.83],[0,1.1],[-.63,.83]],.24,dark,.1);cockpit(0,.4,-.74,.24,.67);for(const side of [-1,1]){plate([[side*.55,-.4],[side*2.5,1.1],[side*1.5,.75]],.035,trim,.11);box(.59,.11,.36,dark,side*.94,.09,1.15,.03);box(.43,.07,.07,light,side*.94,.09,1.36,.02);engine(side*.94,.04,1.22,.16,.18);}
    box(.17,.035,.6,trim,0,.35,.34,.01);for(const side of [-1,1]){const fin=box(.07,.48,.7,hull,side*.55,.37,.8,.02);fin.rotation.z=side*-.35;}
  }else if(id==='solar-skimmer'){
    cylinder(.28,2.1,hull,0,0,-.12,.16);cockpit(0,.23,-.58,.23,.49);
    for(const side of [-1,1]){const sail=plate([[side*.51,-1.1],[side*2.74,-1.75],[side*2.35,1.27],[side*.56,.71]],.06,trim,.03);strut([side*.37,0,-.7],[side*2.72,.03,-1.75],.045,metal);strut([side*.4,0,.5],[side*2.35,.03,1.27],.045,metal);strut([side*2.72,.03,-1.75],[side*2.35,.03,1.27],.035,metal);for(let i=0;i<5;i++)strut([side*(.65+i*.35),.11,-1.03-i*.1],[side*(.65+i*.3),.11,.72+i*.08],.014,hull);engine(side*.38,-.03,.94,.19,.35);}
    box(.13,.12,.42,light,0,.26,.38,.02);
  }
  // Surface treatment follows each design's construction rather than adding
  // arbitrary blocks. All static detail is batched by material below.
  if(id==='armored-flyer'){
    const crimson=material(0x691522,{metalness:.7,roughness:.33});
    for(const side of [-1,1]){
      // Exposed back is what the chase camera sees in the correct chest-down pose.
      const back=plate([[side*.06,-1.13],[side*.43,-1.03],[side*.37,-.52],[side*.09,-.43]],.055,hull,-.24);back.rotation.z=0;
      seam([[side*.09,-.302,-1.09],[side*.34,-.302,-.98],[side*.29,-.302,-.58]],.012,trim);
      box(.15,.055,.24,crimson,side*.56,-.19,-.96,.025);box(.18,.025,.27,trim,side*.265,-.196,1.48,.02);
      for(let k=0;k<3;k++)box(.12,.026,.027,metal,side*.265,-.216,1.42+k*.09,.003);
      ring(.11,.019,metal,side*.26,0,1.09);ring(.115,.018,crimson,side*.96,-.01,-.14);
    }
    for(let k=0;k<6;k++)box(.10,.037,.09,k%2?crimson:metal,0,-.242,-.84+k*.15,.012);
    box(.10,.025,.11,light,0,-.272,-.91,.012);
  }else if(id==='saucer-freighter'){
    const weathered=material(0x9a9c94,{metalness:.27,roughness:.72});
    // Broad recessed service bays, radial plates, six distinct top cooling fans.
    for(const side of [-1,1]){
      plate([[side*.32,-1.36],[side*.51,-1.70],[side*1.04,-1.68],[side*1.10,-1.29]],.027,weathered,.37);
      for(let k=0;k<4;k++)box(.10,.020,.31,metal,side*(.43+k*.16),.285,-2.37,.006);
      for(let k=0;k<3;k++)box(.17,.028,.34,trim,side*(1.09+k*.25),.32,-.45+k*.27,.01);
      for(const z of [.65,1.10,1.50]){const x=side*(z===1.5?.52:.76);const fan=part(new THREE.CylinderGeometry(.195,.195,.025,20),black,x,.365,z);for(let j=0;j<6;j++){const aa=j*Math.PI/3;strut([x,.388,z],[x+Math.cos(aa)*.15,.388,z+Math.sin(aa)*.15],.012,metal);}}
    }
    for(let k=0;k<18;k++){const aa=k*Math.PI/9;seam([[Math.cos(aa)*.72,.415,.1+Math.sin(aa)*.72],[Math.cos(aa)*1.73,.29,.1+Math.sin(aa)*1.73]],.010,dark);}
    curve([[.70,.27,-.73],[1.31,.24,-.75],[1.82,.19,-.75]],.23,hull,14,12); // cockpit access tube
    for(const side of [-1,1])strut([side*.09,.64,-.12],[side*.09,.64,-.88],.023,metal);
    box(.33,.045,.21,dark,0,.56,.20,.025);for(const side of [-1,1]){strut([side*.06,.60,.23],[side*.18,.69,-.16],.018,metal);strut([side*.18,.69,-.16],[side*.18,.69,-.50],.016,metal);}
  }else if(id==='dart'){
    // TIE solar panels: radial spars, dense cell grid and edge rails on both sides.
    for(const side of [-1,1]){const wing=model.children.find(o=>o.isGroup&&Math.abs(o.position.x-side*1.86)<.01);if(wing){plate([[-.91,-1.16],[.91,-1.16],[1.17,0],[.91,1.16],[-.91,1.16],[-1.17,0]],.06,black,-.115,wing);for(const face of [-1,1]){for(let k=-5;k<=5;k++){part(new THREE.BoxGeometry(.010,.008,2.04),metal,k*.17,face*.202,0,wing);part(new THREE.BoxGeometry(1.68,.008,.012),metal,0,face*.204,k*.18,wing);}for(const [x,z]of [[-.91,-1.16],[.91,-1.16],[1.17,0],[.91,1.16],[-.91,1.16],[-1.17,0]])strut([0,face*.216,0],[x,face*.216,z],.021,metal,wing);} }
      cylinder(.16,.045,trim,side*.32,.02,.69,.16,16);box(.055,.05,.31,dark,side*.27,-.30,-.52,.006);
    }
    const rear=ring(.34,.035,metal,0,0,.68);cylinder(.25,.035,dark,0,0,.69,.25,20);box(.17,.045,.05,light,0,.14,.72,.005);box(.09,.12,.05,trim,0,-.06,.72,.008);
  }else if(id==='exploration-cruiser'){
    // Refit-style concentric saucer plating, registry and long nacelle grilles.
    const rimDark=material(0x737b80,{roughness:.6}),red=material(0xb74136,{emissive:0x661209,emissiveIntensity:.35});
    for(const rr of [.63,1.07,1.51]){const o=ring(rr,.009,rimDark,0,.51,-1.22,model,48);o.rotation.x=Math.PI/2;o.scale.y=.75;}
    for(let k=0;k<40;k++){const aa=k*Math.PI/20;box(.065,.022,.035,k%5?black:light,Math.cos(aa)*1.77,.33,-1.22+Math.sin(aa)*1.25,.002);}
    stencil('NCC-1701',.055,0,.56,-2.08,black);for(const side of [-1,1]){
      for(let k=0;k<11;k++)box(.095,.05,.035,metal,side*1.66,.55,.02+k*.15,.004);
      box(.055,.10,1.61,engineLight,side*1.82,.32,.95,.01);box(.055,.10,1.61,engineLight,side*1.50,.32,.95,.01);
      box(.18,.035,.40,red,side*1.66,.54,.15,.01);curve([[side*.34,-.17,.34],[side*.91,.12,.65],[side*1.54,.33,.93]],.065,hull,12,8);
      for(let k=0;k<5;k++)box(.055,.020,.018,black,side*.37,-.05,.09+k*.15,.001);
    }
    ring(.145,.022,metal,0,-.30,-.685);cylinder(.11,.025,light,0,-.30,-.71,.11,20);
  }else if(id==='vanguard'){
    for(const side of [-1,1]){box(.54,.065,1.07,metal,side*1.47,.36,.18,.03);for(let k=0;k<6;k++)box(.42,.025,.055,black,side*1.47,.414,-.30+k*.16,.006);for(let k=0;k<4;k++)box(.13,.10,.24,trim,side*.62,.18,-.64+k*.34,.015);ring(.31,.04,metal,side*1.47,.03,1.50);ball(.20,.20,.23,glass,side*.81,-.18,-.59);strut([side*.81,-.18,-.59],[side*.87,-.15,-1.47],.042,metal);}
    hullLoft([[-1.70,.03,.02,.41],[-1.23,.32,.16,.49],[-.61,.34,.17,.49],[-.28,.06,.04,.41]],glass);box(.04,.028,.90,hull,0,.665,-.95,.006);
  }else if(id==='stealth-phantom'){
    for(const side of [-1,1]){seam([[side*.25,.28,-1.35],[side*.56,.25,.39],[side*2.36,.16,1.06]],.016,metal);for(let k=0;k<4;k++)box(.045,.020,.34,dark,side*(.78+k*.17),.16,.32+k*.14,.006);plate([[side*.63,-.14],[side*1.70,.71],[side*.98,.42]],.018,metal,.14);box(.60,.05,.10,light,side*.94,.15,1.38,.02);}
    box(.15,.025,.16,trim,0,.55,-.82,.01);
  }else if(id==='solar-skimmer'){
    const cell=material(0x76513e,{metalness:.82,roughness:.3});for(const side of [-1,1]){for(let k=0;k<7;k++)for(let j=0;j<5;j++){const x=side*(.72+k*.24),z=-.78+j*.31-k*.06;box(.205,.013,.267,cell,x,.085,z,.005);}curve([[side*.55,.15,-1.01],[side*1.61,.15,-1.43],[side*2.66,.15,-1.68]],.018,hull);ring(.15,.025,metal,side*.38,-.03,1.19);}
    ball(.17,.15,.23,metal,0,-.06,-1.24);box(.065,.035,.35,dark,0,.46,-.60,.008);
  }

  // Batch static geometry per material. Fine panels/cells should not mean
  // hundreds of GPU draw calls on a phone; exhaust remains separately animated.
  model.updateMatrixWorld(true);const rootInverse=model.matrixWorld.clone().invert(),batches=new Map(),original=[];
  model.traverse(o=>{if(!o.isMesh||flames.includes(o)||o.name)return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);original.push(o);});
  for(const meshes of batches.values()){const pos=[],normal=[],uv=[];for(const o of meshes){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(rootInverse.clone().multiply(o.matrixWorld));const p=g.attributes.position,n=g.attributes.normal,t=g.attributes.uv;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));normal.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(t?t.getX(i):0,t?t.getY(i):0);}g.dispose();}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));part(g,meshes[0].material);}
  for(const o of original)o.removeFromParent();for(const child of [...model.children])if(child.isGroup&&child.children.length===0)model.remove(child);
  // Scale hulls uniformly into the existing visual footprint; exhaust stays attached.
  const visible=new THREE.Box3();model.updateMatrixWorld(true);model.traverse(o=>{if(o.isMesh&&!flames.includes(o)){o.geometry.computeBoundingBox();visible.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});const size=visible.getSize(new THREE.Vector3()),factor=Math.min(6.15/size.x,5.1/size.z,2.9/size.y,1.35);const offsetZ=-(visible.min.z+visible.max.z)/2;
  for(const child of model.children)child.position.z+=offsetZ;model.scale.setScalar(factor);model.userData.shipId=id;model.userData.originalMeshes=original.length;model.userData.inspiration=({'night-glider':'1989 Batwing','twin-pod-racer':'Anakin podracer',comet:'X-wing','armored-flyer':'Iron Man','saucer-freighter':'Millennium Falcon',dart:'TIE fighter','exploration-cruiser':'Enterprise'})[id]||EXPANSION_SHIPS.find(s=>s.id===id)?.source||'Original spacecraft';
  return {model,flames,engineMaterials:[engineLight,flameMat,coreMat],hullMaterials:[hull,trim],update(time){for(const animate of animations)animate(time);},dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}

export function shipIcon(id){const shapes={
'armored-flyer':'M27 9h10v9l8 6 5 16-6 2-6-11-2 12 4 13h-7l-1-13-1 13h-7l4-13-2-12-6 11-6-2 5-16 8-6Z',
'saucer-freighter':'M29 8C9 9 5 23 10 41l14 11h16l14-11 2-21-9-5-4 8h-5l-1-14h-6v14h-5Z',
comet:'m32 5 6 21 21-13-3 9-18 12 20 14-3 7-19-13-4 16-4-16L9 55l-3-7 20-14L8 22l-3-9 21 13Z',
'night-glider':'M32 17 36 9 38 20C44 20 49 15 54 9 59 15 62 22 63 31 56 26 51 31 52 39 46 33 41 35 40 47 36 41 35 45 32 55 29 45 28 41 24 47 23 35 18 33 12 39 13 31 8 26 1 31 2 22 5 15 10 9 15 15 20 20 26 20L28 9Z',
dart:'M5 9h12v19h9l3-7h6l3 7h9V9h12v46H47V36h-9l-3 7h-6l-3-7h-9v19H5Z',
'exploration-cruiser':'M32 5C7 5 4 18 17 24l11 2v13l-9-3V24h-7v33h7V44l9 5h8l9-5v13h7V24h-7v12l-9 3V26C64 21 57 5 32 5Z',
vanguard:'m32 8 9 8v9h6V15h11v39H47V38h-6v16H23V38h-6v16H6V15h11v10h6v-9Z',
 'twin-pod-racer':'M9 6h12v35h-5l12 10V38h8v13l12-10h-5V6h12v38h-7L36 57h-8L16 44H9Z',
'stealth-phantom':'m32 5 28 46-19-7-9 12-9-12-19 7Z',
'solar-skimmer':'m32 7 5 15 23-8-5 38-18-9-5 15-5-15-18 9-5-38 23 8Z'};return `<svg class="ship-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="${shapes[id]||EXPANSION_SHIPS.find(s=>s.id===id)?.icon||shapes.comet}" fill="currentColor"/><path d="m29 18 3-7 3 7-3 10Z" fill="#123044"/></svg>`;}
