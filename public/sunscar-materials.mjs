import * as T from './three.module.js';
export const SUNSCAR_COLORS={ivory:0xe8d5b6,copper:0xb46945,violet:0x51425f,turquoise:0x45b8ad,crimson:0x9a2638,amber:0xffaa4b};
export function createSunscarMaterials(){
 const std=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra}),shaders=new Set();
 const stoneMap=new T.Texture();stoneMap.colorSpace=T.SRGBColorSpace;stoneMap.wrapS=stoneMap.wrapT=T.RepeatWrapping;stoneMap.anisotropy=4;
 if(typeof Image!=='undefined'){const image=new Image();image.decoding='async';image.onload=()=>{stoneMap.image=image;stoneMap.needsUpdate=true;for(const s of shaders)s.uniforms.stoneReady.value=1;};image.src=new URL('./assets/sunscar-sandstone-v42.webp',import.meta.url).href;}
 function stone(color,mineral=0){const m=std(color,{side:T.DoubleSide});m.onBeforeCompile=s=>{shaders.add(s);s.uniforms.stoneMap={value:stoneMap};s.uniforms.stoneReady={value:stoneMap.image?1:0};s.uniforms.mineralStrength={value:mineral};
  s.vertexShader='varying vec3 vStone;varying vec3 vStoneNormal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vec3 sp=position;
  #ifdef USE_INSTANCING
  sp=mat3(instanceMatrix)*sp;
  #endif
  vStone=mat3(modelMatrix)*sp;vStoneNormal=normalize(inverseTransformDirection(transformedNormal,viewMatrix));`);
  s.fragmentShader='uniform sampler2D stoneMap;uniform float stoneReady;uniform float mineralStrength;varying vec3 vStone;varying vec3 vStoneNormal;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  vec3 sw=pow(abs(normalize(vStoneNormal)),vec3(5.));sw/=max(.001,sw.x+sw.y+sw.z);
  vec3 stoneTex=texture2D(stoneMap,vStone.yz*.040).rgb*sw.x+texture2D(stoneMap,vStone.xz*.040).rgb*sw.y+texture2D(stoneMap,vStone.xy*.040).rgb*sw.z;
  float stoneHeight=dot(stoneTex,vec3(.299,.587,.114))*stoneReady;
  float sediment=sin(vStone.y*.43+sin(vStone.x*.13)+sin(vStone.z*.16));
  float mineral=smoothstep(.78,.96,sin(vStone.y*.21+sin(vStone.x*.14)*2.+sin(vStone.z*.15)))*mineralStrength;
  float patina=.5+.5*sin(vStone.x*.031+sin(vStone.z*.023)*3.);
  diffuseColor.rgb*=mix(vec3(1.),stoneTex*1.45,.66*stoneReady);
  diffuseColor.rgb*=.91+.09*sediment;
  diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.75,.68,.93),patina*.17);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.065,.30,.27),mineral*.70);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.61,.46),max(0.,vStoneNormal.y)*.15);`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
  roughnessFactor=clamp(roughnessFactor-mineral*.22+sediment*.035,.38,.98);`);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  vec3 sd0=dFdx(-vViewPosition),sd1=dFdy(-vViewPosition);vec3 sr0=cross(sd1,normal),sr1=cross(normal,sd0);float sdet=dot(sd0,sr0);
  normal=normalize(abs(sdet)*normal-sign(sdet)*(dFdx(stoneHeight)*sr0+dFdy(stoneHeight)*sr1)*.22);`);
 };m.customProgramCacheKey=()=> 'sunscar-geology-v43';return m;}
 const rock=stone(0xd6a77e,.18),ivory=stone(0xe5dbc6,.52),copper=stone(0xb67d60,.12),char=stone(0x6a5358,.04),violet=stone(0x746478,.04);
 const sand=std(0xd8bb91),darkRock=std(0x665365),wood=std(0x66513e),cloth=std(0xa72d43,{side:T.DoubleSide}),skin=std(0x899d87),black=std(0x202730,{metalness:.63,roughness:.42}),metal=std(0xffffff,{vertexColors:true,metalness:.68,roughness:.39,envMapIntensity:.9}),ceramic=std(0xb4aba1,{roughness:.58}),rust=std(0x86513e,{metalness:.62,roughness:.68});
 metal.onBeforeCompile=s=>{s.vertexShader='varying vec3 vMachine;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMachine=position;');s.fragmentShader='varying vec3 vMachine;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grime=.5+.5*sin(vMachine.z*2.7+sin(vMachine.x*5.)*.6);float heat=smoothstep(1.8,4.7,vMachine.z);diffuseColor.rgb*=.88+.12*grime;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.69,.60,.76),heat*.23);`);s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+grime*.17,.22,.7);');};metal.customProgramCacheKey=()=> 'sunscar-machined-v43';
 sand.onBeforeCompile=s=>{s.vertexShader='varying vec3 vDune;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDune=(modelMatrix*vec4(position,0.)).xyz;');s.fragmentShader='varying vec3 vDune;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ripplePhase=vDune.x*2.4+sin(vDune.z*.15)*1.8;float duneRipple=sin(ripplePhase)*(1.-smoothstep(.5,3.,fwidth(ripplePhase)));float track=1.-smoothstep(1.1,2.4,abs(sin(vDune.x*.09)*15.));diffuseColor.rgb*=.96+duneRipple*.025-track*.045;');};sand.customProgramCacheKey=()=> 'sunscar-wind-sand-v43';
 const glow=new T.MeshBasicMaterial({color:0x88d8d6,toneMapped:false}),mineral=std(0x529c91,{metalness:.38,roughness:.28,emissive:0x1a625b,emissiveIntensity:.28}),fire=new T.MeshBasicMaterial({color:0xffb060,toneMapped:false}),ember=std(0x9b4528,{metalness:.35,roughness:.46,emissive:0xff741f,emissiveIntensity:1.3});
 // A small analytic desert panorama supplies actual specular reflections. The
 // renderer converts this once to a filtered environment map; no live probes.
 const w=256,h=128,pixels=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=1-y/(h-1),sky=v<.5,sun=Math.exp(-((x/w-.34)**2/.0018+(v-.28)**2/.0009));const color=sky?[.22+.45*v,.36+.42*v,.54+.16*v]:[.65-.27*(v-.5),.45-.22*(v-.5),.29-.16*(v-.5)];for(let k=0;k<3;k++)pixels[(y*w+x)*4+k]=Math.min(255,Math.round((color[k]+sun*(k===2?.35:.60))*255));pixels[(y*w+x)*4+3]=255;}
 const environment=new T.DataTexture(pixels,w,h);environment.colorSpace=T.SRGBColorSpace;environment.mapping=T.EquirectangularReflectionMapping;environment.minFilter=environment.magFilter=T.LinearFilter;environment.needsUpdate=true;
 const themes=[copper,ivory,rock,char,ivory,copper];
 return {rock,ivory,copper,char,violet,sand,darkRock,wood,cloth,skin,black,metal,ceramic,rust,glow,mineral,fire,ember,environment,themes};
}
