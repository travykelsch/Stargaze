import * as T from './three.module.js';

export const ERUPTION_PERIOD=4.8;
export function emberRiverX(distance){return Math.sin(-distance*.009)*13;}
export function eruptionSample(time,phase,origin,velocity){const age=((time+phase)%ERUPTION_PERIOD+ERUPTION_PERIOD)%ERUPTION_PERIOD,life=Math.min(3.9,velocity.y*2/34);return {x:origin.x+velocity.x*age,y:origin.y+velocity.y*age-17*age*age,z:origin.z+velocity.z*age,active:age<life,age};}
export function createEmberActivity(clock,keep){
 const burstMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uTime:clock},vertexShader:`
uniform float uTime;
attribute vec3 launch;
attribute float phase;
varying float vLife,vHeat;
void main(){float age=mod(uTime+phase,4.8);float life=min(3.9,launch.y*2./34.);vec3 p=position+launch*age;p.y-=17.*age*age;vLife=smoothstep(0.,.09,age)*(1.-smoothstep(life-.55,life,age));vHeat=1.-age/life;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((1500.+launch.y*24.)/max(1.,-mv.z),1.,25.);gl_Position=projectionMatrix*mv;}
`,fragmentShader:`varying float vLife,vHeat;void main(){float d=length(gl_PointCoord-.5);float core=1.-smoothstep(.04,.24,d);vec3 c=mix(vec3(.95,.08,.004),vec3(2.,.70,.08),core*max(.35,vHeat));float a=(1.-smoothstep(.08,.5,d))*vLife*.82;gl_FragColor=vec4(c,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 function burstGeometry(sources,random){const p=[],launch=[],phases=[];for(const s of sources)for(let i=0;i<s.count;i++){p.push(s.x+(random()-.5)*s.width,s.y,s.z+(random()-.5)*s.width);launch.push((random()-.5)*s.spread,s.speed+random()*s.variation,(random()-.5)*s.spread);phases.push(s.phase+random()*.95);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('launch',new T.Float32BufferAttribute(launch,3));g.setAttribute('phase',new T.Float32BufferAttribute(phases,1));g.userData.emberBurst=true;return g;}
 const flameGeometry=keep(new T.ConeGeometry(1,3.6,8,4,true));
 const flameMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{uTime:clock},vertexShader:`
uniform float uTime;
varying vec2 vUv;
void main(){vUv=uv;vec3 p=position;float flicker=.83+.17*sin(uTime*16.+uv.y*13.);p.xz*=flicker;p.x+=sin(uv.y*9.-uTime*8.)*uv.y*.17;vec4 v=vec4(p,1.);
#ifdef USE_INSTANCING
v=instanceMatrix*v;
#endif
gl_Position=projectionMatrix*modelViewMatrix*v;}
`,fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){float streak=.7+.3*sin(vUv.x*31.+vUv.y*13.-uTime*19.);float fade=pow(max(0.,1.-vUv.y),.7)*streak;vec3 c=mix(vec3(1.7,.48,.025),vec3(.8,.035,.002),vUv.y);gl_FragColor=vec4(c,fade*.65);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 return {burstMaterial,burstGeometry,flameGeometry,flameMaterial};
}
