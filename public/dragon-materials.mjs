import * as T from './three.module.js';

// Seamless generated surface maps, cached once for the entire dragon population.
// Geometry carries the form; these maps add restrained scale relief and veins.
export function createDragonMaterials(clock={value:0}){
 function maps(membrane=false){const size=128,color=new Uint8Array(size*size*4),height=new Uint8Array(color.length);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const row=Math.floor(y/8),u=((x+(row%2)*4)%8)/8,v=(y%8)/8,dx=Math.abs(u-.5)*2,dy=Math.abs(v-.5)*2,scale=Math.max(0,1-Math.pow(dx,2.5)-Math.pow(dy,1.5)),grain=Math.sin(x*1.7+y*2.3)*Math.sin(x*.83-y*1.07);let relief,tone;
 if(membrane){const vein=Math.max(0,Math.cos((x+y*.5)*Math.PI/8)-.9)*4,fold=Math.sin(y*Math.PI/16+Math.sin(x*Math.PI/32)*.8);relief=.52+fold*.045-vein*.06;tone=.95+fold*.025-vein*.035+grain*.01;}else{relief=.34+scale*.28+grain*.012;tone=.89+scale*.10+grain*.012;}
 const i=(y*size+x)*4,val=Math.round(Math.min(1,tone)*255),bump=Math.round(relief*255);color.set([val,val,val,255],i);height.set([bump,bump,bump,255],i);}
 const texture=data=>{const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=2;t.needsUpdate=true;return t;};const map=texture(color),bumpMap=texture(height);map.colorSpace=T.SRGBColorSpace;return {map,bumpMap};}
 const skinMaps=maps(),wingMaps=maps(true),skin=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.73,metalness:.015,map:skinMaps.map,bumpMap:skinMaps.bumpMap,bumpScale:.018}),wing=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.82,metalness:0,side:T.DoubleSide,map:wingMaps.map,bumpMap:wingMaps.bumpMap,bumpScale:.012}),eyes=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.17,metalness:0});
 for(const [material,isWing]of [[skin,false],[wing,true]]){material.onBeforeCompile=shader=>{shader.uniforms.uCreatureTime=clock;shader.vertexShader='uniform float uCreatureTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 transformed.y+=sin(uCreatureTime*${isWing?'12.':'4.'}+position.x*2.-position.z*2.)*${isWing?'.006*abs(position.z)':'.003'};`);shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight+=diffuseColor.rgb*vec3(1.,.68,.36)*pow(1.-abs(dot(normal,normalize(vViewPosition))),2.)*${isWing?'.19':'.035'};
 #include <opaque_fragment>`);};material.customProgramCacheKey=()=>isWing?'skyward-wing-light-v26':'skyward-skin-light-v26';}
 return {skin,wing,eyes,dispose(){for(const m of [skin,wing]){m.map.dispose();m.bumpMap.dispose();m.dispose();}eyes.dispose();}};
}
