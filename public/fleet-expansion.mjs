import * as T from './three.module.js';

export const EXPANSION_SHIPS=[
{id:'delorean',name:'Flying DeLorean',price:24000,desc:'Stainless wedge, folded hover wheels, time coils and rear reactor.',palette:[0xb9c0c6,0x3c424a,0x5fcfff],source:'Back to the Future DeLorean',icon:'M18 9h28l7 12v31H11V21Zm0 11h28l-4-8H22Zm-7 7H5v12h6m42-12h6v12h-6M17 44h30v7H17Z'},
{id:'naboo-n1',name:'Naboo N-1',price:26000,desc:'Yellow dart hull, polished nose and long twin engine needles.',palette:[0xe3b83d,0xc6d4dc,0x79d7ff],source:'Naboo N-1 starfighter',icon:'M30 5h4l3 27 13-5V8h5v33h-6l-11-4-6 22-6-22-11 4H9V8h5v19l13 5Z'},
{id:'firespray',name:'Firespray',price:28000,desc:'Weathered green armor, upright curved hull and swept stabilizers.',palette:[0x708775,0xad8b68,0x7dd9ff],source:'Firespray / Slave I',icon:'M32 5C14 5 16 25 20 40l-13 7 3 8 14-6h16l14 6 3-8-13-7C48 25 50 5 32 5Zm-6 8h12v20H26Z'},
{id:'imperial-shuttle',name:'Imperial Shuttle',price:30000,desc:'White cockpit pod, tall central sail and swept folding wings.',palette:[0xc8cdd4,0x5b6571,0x8ed9ff],source:'Lambda-class Imperial shuttle',icon:'M29 5h6l2 24 22 23-4 7-19-17h-8L9 59l-4-7 22-23Z'},
{id:'colonial-viper',name:'Colonial Viper',price:22000,desc:'Long white-and-red nose, three engine pods and compact swept wings.',palette:[0xd5d4c9,0xa33535,0x85a9ff],source:'Battlestar Galactica Colonial Viper',icon:'M31 5h2l6 29 17 13-2 9-17-9h-3v12h-4V47h-3L10 56l-2-9 17-13Z'},
{id:'serenity',name:'Serenity',price:28000,desc:'Long-necked cockpit, insect-like hull, paired drives and glowing aft chamber.',palette:[0x8f9c8d,0xb29b70,0xffc36c],source:'Firefly Serenity',icon:'M30 4h4l5 7-3 14 9 10 7-7 6 3-4 18-7-4-7 11H24l-7-11-7 4-4-18 6-3 7 7 9-10-3-14Z'},
{id:'blackbird',name:'SR-71 Blackbird',price:20000,desc:'Black chined fuselage, spiked twin intakes and canted twin tails.',palette:[0x222731,0x414953,0xffab68],source:'Lockheed SR-71 Blackbird',icon:'M32 3 38 29 47 17h7l3 36-17-7-8 14-8-14-17 7 3-36h7l9 12Z'},
{id:'space-shuttle',name:'Space Shuttle',price:22000,desc:'White orbiter, black heat tiles, delta wings and three main engines.',palette:[0xe2e1d6,0x252b32,0x77b6ff],source:'NASA Space Shuttle orbiter',icon:'M32 4C25 4 23 15 24 27L7 49v7l18-5 3 8h8l3-8 18 5v-7L40 27C41 15 39 4 32 4Z'},
{id:'planet-express',name:'Planet Express',price:26000,desc:'Green delivery rocket, red wraparound fins and a large rear drive.',palette:[0x659b76,0xb54137,0x87e5a5],source:'Futurama Planet Express ship',icon:'M32 5C19 9 19 26 22 36L8 49v9l17-9 3 9h8l3-9 17 9v-9L42 36C45 26 45 9 32 5Zm-5 12h10v10H27Z'},
{id:'y-wing',name:'Y-Wing',price:26000,desc:'Armored cockpit, exposed machinery and two long skeletal nacelles.',palette:[0xd3d0bd,0xc5a348,0xffba75],source:'Star Wars BTL Y-wing',icon:'M26 6h12l5 16-7 9v10h13V15h8v42h-8v-9H15v9H7V15h8v26h13V31l-7-9Z'}
];

export function buildExpansion(id,a){
 const {model,hull,trim,dark,glass,metal,light,engineLight,black,material,part,box,ball,cylinder,plate,strut,engine,vents,cockpit,curve,ring,hullLoft,flames,flameMat,coreMat}=a;
 if(id==='delorean'){
  hull.metalness=.80;hull.roughness=.30;
  plate([[-.94,-2.05],[.94,-2.05],[1.06,-.75],[1.0,1.68],[-1.0,1.68],[-1.06,-.75]],.39,hull,-.17);
  hullLoft([[-2.05,.90,.08,-.02],[-1.34,.98,.16,0],[.35,.97,.25,0],[1.65,.90,.18,0]],hull);
  hullLoft([[-1.12,.73,.03,.20],[-.48,.69,.43,.27],[.53,.64,.43,.27],[1.02,.77,.04,.22]],glass);
  box(1.32,.06,1.02,hull,0,.73,.05,.02);for(const s of [-1,1]){strut([s*.72,.23,-1.07],[s*.68,.72,-.48],.035,hull);strut([s*.65,.72,.55],[s*.77,.22,1.05],.04,hull);box(.045,.05,1.70,trim,s*.95,.22,.04,.008);box(.06,.035,.26,black,s*.98,.24,.19,.005);box(.19,.09,.24,metal,s*1.1,.24,-.54,.02);}
  box(1.89,.17,.14,black,0,-.04,-2.08,.02);for(const s of [-1,1]){for(let j=0;j<2;j++)box(.24,.12,.04,light,s*(.44+j*.29),.02,-2.16,.005);box(.37,.10,.035,material(0x8e2726,{emissive:0x481015,emissiveIntensity:.4}),s*.64,.02,1.78,.006);}
  for(const s of [-1,1])for(const z of [-1.15,1.05]){const wheel=part(new T.CylinderGeometry(.37,.37,.20,20),black,s*1.12,-.20,z);part(new T.CylinderGeometry(.26,.26,.22,16),metal,s*1.12,-.19,z);part(new T.CylinderGeometry(.14,.14,.235,12),dark,s*1.12,-.18,z);strut([s*.79,-.06,z],[s*1.12,-.18,z],.065,metal);}
  // Exposed time-machine deck, rear cooling vents and perimeter flux coils.
  for(const s of [-1,1]){box(.65,.33,.65,dark,s*.50,.44,1.22,.04);for(let j=0;j<5;j++)box(.50,.04,.055,metal,s*.5,.63,.96+j*.12,.006);curve([[s*.9,.13,-1.8],[s*.99,.20,-.85],[s*.96,.33,.68],[s*.79,.49,1.61]],.035,metal,24,6);engine(s*.66,-.08,1.67,.19,.25);}
  cylinder(.22,.30,metal,0,.79,1.23,.25);ball(.20,.15,.20,dark,0,.99,1.23);box(.32,.23,.23,metal,0,.36,.93,.03);curve([[0,.45,.92],[.15,.58,1.1],[0,.68,1.25]],.025,engineLight,10,5);
 }else if(id==='naboo-n1'){
  trim.metalness=.92;trim.roughness=.2;
  hullLoft([[-3.1,.015,.015,0],[-1.30,.20,.14,0],[-.34,.40,.22,0],[.70,.34,.20,0],[2.1,.025,.045,0]],hull);
  hullLoft([[-3.12,.016,.016,0],[-1.65,.14,.095,0],[-.97,.23,.13,0]],trim);
  cockpit(0,.29,-.15,.28,.57);box(.035,.025,.90,trim,0,.51,-.15,.005);
  for(const s of [-1,1]){plate([[s*.18,-.58],[s*2.28,-.77],[s*2.35,.13],[s*.28,.74]],.09,hull);const pod=hullLoft([[-2.80,.018,.018,0],[-1.59,.31,.31,0],[-.56,.30,.30,0],[.72,.20,.20,0],[2.55,.015,.015,0]],trim);pod.position.x=s*2.18;cylinder(.32,.73,hull,s*2.18,0,-1.10,.32,20);ring(.33,.024,metal,s*2.18,0,-.70);engine(s*2.18,0,.50,.17,.4);curve([[s*.47,.06,.08],[s*1.1,.07,.17],[s*2,.06,.09]],.016,trim);}
  part(new T.SphereGeometry(.13,12,8,0,Math.PI*2,0,Math.PI/2),metal,0,.25,.71);box(.14,.03,.18,trim,0,.25,1.02,.01);
 }else if(id==='firespray'){
  const rust=material(0x875c47,{roughness:.85}),pale=material(0xbdb8a2,{roughness:.65});
  ball(1.05,1.30,1.17,hull,0,.34,.03);ball(.67,.78,.95,pale,0,.73,-.43);hullLoft([[-1.69,.42,.16,.49],[-1.21,.59,.31,.67],[-.44,.55,.34,.70],[.12,.26,.13,.66]],glass);
  for(const s of [-1,1]){plate([[s*.82,-.69],[s*2.38,-.25],[s*2.63,.72],[s*1.06,.87]],.16,trim,-.41);box(.14,.19,1.35,rust,s*1.12,.12,.51,.02);cylinder(.07,1.07,metal,s*.55,-.37,-1.72,.06,10);curve([[s*.39,.87,-1.23],[s*.65,1.03,-.45],[s*.36,.93,.19]],.025,metal);engine(s*.58,-.33,1.21,.27,.40);for(let k=0;k<4;k++)box(.27,.04,.07,dark,s*.85,.67,.27+k*.21,.008);}
  box(.49,.13,.69,rust,0,1.13,.43,.04);for(let k=0;k<6;k++)box(.29,.025,.075,metal,0,1.22,.15+k*.11,.005);ring(.26,.035,metal,0,.18,1.58);box(.60,.15,.45,dark,0,-.70,.35,.04);
 }else if(id==='imperial-shuttle'){
  hullLoft([[-1.73,.26,.15,-.23],[-1.18,.64,.34,-.18],[.74,.71,.39,-.14],[1.45,.53,.23,-.13]],hull);hullLoft([[-1.82,.21,.07,.02],[-1.46,.52,.20,.03],[-.65,.52,.20,.03]],glass);
  const fin=plate([[-.10,-.70],[1.65,.65],[1.65,1.45],[-.10,1.10]],.12,hull);fin.rotation.z=Math.PI/2;fin.position.y=.13;fin.position.z=.24;
  for(const s of [-1,1]){const wing=new T.Group();wing.position.set(s*.65,-.1,.0);wing.rotation.z=-s*.28;model.add(wing);plate([[0,-.63],[s*2.3,.45],[s*2.65,1.70],[s*.40,1.02]],.13,hull,0,wing);for(let k=0;k<5;k++)box(.04,.025,.55,dark,s*(.5+k*.25),.08,.27+k*.14,.004,wing);engine(s*.44,-.15,1.32,.19,.26);strut([s*.73,.07,-.33],[s*1.42,-.06,.67],.06,metal);}
  for(let j=0;j<6;j++)box(.09,.035,.14,dark,-.28+j*.11,.26,.82,.004);box(1.03,.14,.13,engineLight,0,-.12,1.55,.015);
 }else if(id==='colonial-viper'){
  hullLoft([[-3.00,.04,.06,0],[-1.8,.19,.18,0],[-.41,.36,.29,0],[.86,.42,.30,0],[1.53,.26,.24,0]],hull);cockpit(0,.40,-.44,.29,.60);box(.15,.03,1.50,trim,0,.20,-1.74,.008);
  for(const s of [-1,1]){plate([[s*.33,-.13],[s*2.27,1.05],[s*1.94,1.65],[s*.42,.86]],.10,hull);plate([[s*.49,.13],[s*1.89,1.02],[s*1.70,1.23],[s*.52,.53]],.025,trim,.065);cylinder(.31,1.30,hull,s*.60,-.16,.81,.33,18);engine(s*.6,-.16,1.48,.26,.35);cylinder(.045,1.30,metal,s*1.77,.0,.63,.04,8);}
  cylinder(.32,1.20,hull,0,.52,.91,.34,18);engine(0,.52,1.57,.27,.32);const fin=plate([[-.13,.49],[.58,1.22],[.58,1.8],[-.13,1.35]],.08,trim);fin.rotation.z=Math.PI/2;fin.position.y=.63;for(let k=0;k<4;k++)box(.09,.03,.16,dark,-.16+k*.11,.34,.52,.005);
 }else if(id==='serenity'){
  ball(.92,.48,1.15,hull,0,0,.10);hullLoft([[-2.13,.20,.13,.35],[-1.47,.22,.18,.27],[-.73,.46,.25,.03],[.52,.67,.35,0]],hull);cockpit(0,.54,-1.84,.31,.46);ball(.80,.60,.81,dark,0,.02,1.31);ball(.66,.51,.15,engineLight,0,.02,2.0);
  for(const s of [-1,1]){strut([s*.59,.03,.04],[s*1.63,-.05,.38],.17,metal);ball(.35,.41,.62,hull,s*1.76,-.05,.48);cylinder(.24,.25,black,s*1.76,-.05,-.10,.24);engine(s*1.76,-.05,.99,.26,.36);plate([[s*.65,.39],[s*1.0,1.38],[s*.58,1.76]],.10,trim,.3);strut([s*.62,-.12,-.55],[s*.97,-.53,-.11],.08,dark);box(.19,.10,.45,metal,s*.97,-.54,-.03,.03);for(let k=0;k<5;k++)box(.14,.05,.07,dark,s*.61,.33,-.33+k*.18,.01);}
  engine(0,.02,1.78,.47,.25);for(let k=0;k<7;k++){const a=k*Math.PI/3.5;curve([[Math.cos(a)*.61,Math.sin(a)*.42,1.0],[Math.cos(a)*.78,Math.sin(a)*.54,1.40],[Math.cos(a)*.65,Math.sin(a)*.46,1.80]],.025,metal,12,5);}
 }else if(id==='blackbird'){
  hull.metalness=.57;hull.roughness=.45;hullLoft([[-3.5,.02,.025,0],[-2.11,.25,.15,0],[-.5,.47,.25,0],[1.25,.55,.22,0],[2.12,.22,.12,0]],hull);
  plate([[-.05,-3.3],[-.51,-1.2],[-1.3,-.35],[-2.45,1.47],[-.60,1.76],[0,2.05],[.60,1.76],[2.45,1.47],[1.3,-.35],[.51,-1.2]],.075,hull);
  for(const s of [-1,1]){cylinder(.30,3.0,hull,s*1.35,-.03,.28,.30,20);cylinder(.22,.19,black,s*1.35,-.03,-1.30,.22,20);const spike=part(new T.ConeGeometry(.19,.74,16),metal,s*1.35,-.03,-1.74);spike.rotation.x=-Math.PI/2;engine(s*1.35,-.03,1.72,.26,.35);const tail=plate([[-.12,.50],[.69,1.55],[.58,2.06],[-.12,1.8]],.07,hull);tail.rotation.z=Math.PI/2-s*.20;tail.position.x=s*1.35;tail.position.y=.18;curve([[s*.15,.15,-2.4],[s*.51,.20,-.24],[s*.87,.15,1.52]],.012,trim,18,5);}
  cockpit(0,.30,-1.24,.25,.61);for(let k=0;k<3;k++)box(.32,.018,.035,metal,0,.51,-1.62+k*.37,.003);
 }else if(id==='space-shuttle'){
  hullLoft([[-2.7,.06,.06,0],[-2.2,.43,.34,0],[-1.4,.56,.42,0],[1.4,.60,.46,0],[2.0,.44,.34,0]],hull);plate([[-.13,-2.67],[-.47,-1.64],[-.58,.45],[-2.32,1.75],[-.57,1.66],[.57,1.66],[2.32,1.75],[.58,.45],[.47,-1.64],[.13,-2.67]],.10,trim,-.21);
  plate([[-.55,-.05],[-2.26,1.70],[-.56,1.51]],.055,hull,-.10);plate([[.55,-.05],[2.26,1.70],[.56,1.51]],.055,hull,-.10);cockpit(0,.36,-1.76,.40,.36);box(.065,.06,.58,hull,0,.55,-1.73,.006);box(.045,.035,2.13,metal,0,.48,.22,.005);
  const fin=plate([[-.18,.55],[.84,1.72],[.72,2.03],[-.18,1.76]],.10,hull);fin.rotation.z=Math.PI/2;fin.position.y=.44;for(const s of [-1,1]){engine(s*.32,-.12,1.91,.23,.26);box(.11,.06,.35,black,s*.66,-.06,1.70,.01);for(let k=0;k<5;k++)box(.12,.012,.055,metal,s*.45,.39,-.47+k*.29,.002);}engine(0,.28,1.92,.22,.24);
 }else if(id==='planet-express'){
  ball(.87,.64,1.79,hull,0,.05,-.03);ball(.54,.37,.48,glass,0,.43,-1.19);box(.055,.035,.67,metal,0,.75,-1.27,.008);cylinder(.54,.27,trim,0,.0,1.52,.57,22);engine(0,0,1.72,.43,.36);
  for(const s of [-1,1]){plate([[s*.60,-.13],[s*2.27,1.35],[s*2.03,1.72],[s*.62,1.08]],.15,trim,-.09);box(.1,.035,.35,metal,s*.56,.62,-.16,.012);ball(.08,.07,.08,light,s*.65,.32,-.73);}
  const tail=plate([[-.11,.40],[.66,1.49],[.59,1.96],[-.11,1.48]],.13,trim);tail.rotation.z=Math.PI/2;tail.position.y=.43;for(let k=0;k<3;k++)ring(.10,.018,metal,-.90,.07,-.55+k*.45).rotation.y=Math.PI/2;curve([[0,.5,-1.68],[0,.61,-.6],[0,.61,.3]],.018,metal,16,5);
 }else if(id==='y-wing'){
  const frame=material(0x8f9288,{metalness:.76,roughness:.48});hullLoft([[-2.20,.19,.12,.08],[-1.74,.46,.25,.08],[-.91,.43,.24,.08],[-.54,.23,.15,0]],hull);cockpit(0,.34,-1.47,.30,.40);box(.13,.025,.60,trim,0,.32,-2.0,.005);box(.44,.18,1.92,dark,0,-.04,.57,.03);
  for(let k=0;k<7;k++)box(.20,.11,.12,k%2?metal:frame,0,.16,-.28+k*.25,.01);for(const s of [-1,1]){strut([s*.18,-.02,.17],[s*1.49,-.02,.30],.11,frame);cylinder(.33,1.1,hull,s*1.50,0,-.92,.33,20);ball(.33,.33,.18,trim,s*1.50,0,-1.52);for(const q of [-1,1])strut([s*1.50+q*.24,q*.16,-.32],[s*1.50+q*.24,q*.16,1.84],.035,frame);cylinder(.30,.15,metal,s*1.50,0,1.78,.30,18);engine(s*1.50,0,1.92,.24,.26);box(.13,.17,.27,metal,s*.32,.21,.11,.02);cylinder(.035,.55,dark,s*.16,.43,-1.45,.035,8);}
  const turret=part(new T.CylinderGeometry(.14,.16,.08,14),metal,0,.38,-.57);for(const s of [-1,1])cylinder(.025,.57,dark,s*.06,.44,-.82,.025,8);part(new T.SphereGeometry(.11,12,8,0,Math.PI*2,0,Math.PI/2),trim,0,.27,-.21);
 }else return false;
 if(id==='delorean'){
  for(const side of [-1,1]){curve([[side*.94,.20,-.84],[side*.98,.24,.68],[side*.77,.39,1.03]],.014,black,16,5);curve([[side*.78,.10,-1.94],[side*.78,.18,-1.15],[side*.68,.22,-.9]],.012,dark,12,5);for(let k=0;k<6;k++)box(.12,.045,.045,metal,side*.99,.24,.85+k*.11,.004);}
  box(.36,.06,.025,metal,0,.0,1.81,.004);box(.21,.04,.028,trim,0,.01,1.83,.002);
 }else if(id==='naboo-n1'){
  for(const side of [-1,1]){for(let k=0;k<5;k++){const a=k*Math.PI*2/5;curve([[side*2.18+Math.cos(a)*.30,Math.sin(a)*.30,-1.44],[side*2.18+Math.cos(a)*.29,Math.sin(a)*.29,-.77]],.012,metal,8,5);}strut([side*.31,.03,.30],[side*1.89,.03,.34],.022,trim);}
 }else if(id==='firespray'){
  for(const side of [-1,1]){curve([[side*.53,1.20,.67],[side*.83,.79,1.06],[side*.78,.01,1.15]],.027,material(0x875c47,{roughness:.85}),18,6);for(let k=0;k<5;k++)box(.16,.045,.10,dark,side*.71,.60-k*.16,1.07,.009);plate([[side*.32,-.16],[side*.69,.08],[side*.56,.62],[side*.21,.49]],.04,trim,.98);box(.28,.09,.42,material(0xbdb8a2,{roughness:.65}),side*1.48,-.29,.31,.02);}
  box(.61,.20,.16,dark,0,-.45,1.15,.03);for(let k=0;k<4;k++)box(.07,.10,.03,metal,-.20+k*.13,-.44,1.25,.004);
 }else if(id==='imperial-shuttle'){
  for(const side of [-1,1]){curve([[side*.57,.22,-.70],[side*.65,.25,.34],[side*.45,.17,1.18]],.014,dark,14,5);for(let k=0;k<5;k++)box(.06,.027,.13,metal,side*.40,.27,.12+k*.16,.004);box(.14,.04,.45,black,side*.56,.28,.61,.006);}
 }else if(id==='colonial-viper'){
  for(const side of [-1,1]){curve([[side*.13,.16,-2.35],[side*.28,.23,-1.18],[side*.34,.25,.14]],.016,trim,18,5);for(let k=0;k<4;k++)box(.11,.035,.065,dark,side*.45,.22,.30+k*.14,.004);ring(.34,.018,metal,side*.60,-.16,.34);}
 }else if(id==='serenity'){
  for(const side of [-1,1]){curve([[side*.54,.23,-.55],[side*.78,.35,.03],[side*.61,.40,.56]],.022,trim,16,6);for(let k=0;k<6;k++)box(.08,.04,.17,dark,side*.63,.35,-.23+k*.16,.005);ring(.33,.033,metal,side*1.76,-.05,.66);box(.13,.12,.36,trim,side*.31,.30,-1.20,.02);}
  box(.36,.18,.26,metal,0,.49,-.61,.03);
 }else if(id==='blackbird'){
  for(const side of [-1,1]){for(let k=0;k<4;k++)curve([[side*(.49+k*.15),.07,-.49+k*.10],[side*(1.07+k*.16),.06,.26+k*.16],[side*(1.52+k*.17),.06,1.32]],.008,trim,12,4);ring(.30,.013,metal,side*1.35,-.03,-.89);for(let k=0;k<6;k++)box(.075,.015,.04,black,side*1.35,.276,.51+k*.10,.002);}
 }else if(id==='space-shuttle'){
  for(const side of [-1,1]){curve([[side*.39,.35,-.93],[side*.54,.45,-.20],[side*.55,.46,.82],[side*.36,.40,1.33]],.012,metal,18,5);for(let k=0;k<7;k++)box(.035,.018,.10,metal,side*.51,.40,-.34+k*.20,.002);box(.28,.05,.12,trim,side*1.15,-.05,1.43,.004);}
  for(let k=0;k<5;k++)box(.62,.011,.018,metal,0,.48,-.35+k*.32,.001);
 }else if(id==='planet-express'){
  for(const side of [-1,1])for(let k=0;k<3;k++){const port=ball(.025,.075,.075,dark,side*.84,.10,-.53+k*.38);ball(.027,.052,.052,light,side*.86,.10,-.53+k*.38);}box(.22,.06,.13,trim,0,.66,-.16,.012);
 }else if(id==='y-wing'){
  for(const side of [-1,1]){curve([[side*.16,.18,-.32],[side*.23,.20,.16],[side*.18,.21,.74],[side*.27,.18,1.40]],.020,trim,16,5);for(let k=0;k<6;k++)box(.14,.09,.075,metal,side*.24,.17,-.12+k*.24,.004);for(const z of [-.28,.42,1.12])ring(.29,.018,metal,side*1.50,0,z);}
 }
 return true;
}
