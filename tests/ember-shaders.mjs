// Pipe to compile-shaders.py for real native compilation of the expanded Three
// material sources. This does not replace browser or mobile visual inspection.
import * as T from '../public/three.module.js';
import {createEmberWorld} from '../public/ember-world.mjs';
const art=createEmberWorld(new T.Scene(),new T.Group());
const expand=s=>s.replace(/#include <(\w+)>/g,(_,key)=>expand(T.ShaderChunk[key]));
const defines=`#define STANDARD
#define USE_COLOR
#define USE_FOG
#define NUM_DIR_LIGHTS 1
#define NUM_HEMI_LIGHTS 1
#define NUM_POINT_LIGHTS 1
#define NUM_SPOT_LIGHTS 0
#define NUM_RECT_AREA_LIGHTS 0
#define NUM_DIR_LIGHT_SHADOWS 0
#define NUM_POINT_LIGHT_SHADOWS 0
#define NUM_SPOT_LIGHT_SHADOWS 0
#define NUM_SPOT_LIGHT_MAPS 0
#define NUM_SPOT_LIGHT_COORDS 0
#define NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS 0
`;
function prefix(instanced,mapped){const flags=defines+(instanced?'#define USE_INSTANCING\n':'')+(mapped?'#define USE_MAP\n#define MAP_UV uv\n#define USE_BUMPMAP\n#define BUMPMAP_UV uv\n':'');return {
 vertex:`#version 330
#define attribute in
#define varying out
${flags}
uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix,viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
in vec3 position,normal,color;
in vec2 uv;
#ifdef USE_INSTANCING
in mat4 instanceMatrix;
#endif
`,
 fragment:`#version 330
#define varying in
#define gl_FragColor outColor
#define texture2D texture
#define textureCube texture
#define TONE_MAPPING
out vec4 outColor;
${flags}
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
${T.ShaderChunk.tonemapping_pars_fragment}
${T.ShaderChunk.colorspace_pars_fragment}
vec3 toneMapping(vec3 c){return ACESFilmicToneMapping(c);}
vec4 linearToOutputTexel(vec4 c){return sRGBTransferOETF(c);}
`};}
const programs=[];
for(const [name,material] of [['stone',art.stone],['hotStone',art.hotStone],['masonry',art.ruinMat]])for(const instanced of [false,true]){
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);const p=prefix(instanced,true);
 programs.push({name:name+(instanced?' instanced':''),vertex:p.vertex+expand(shader.vertexShader),fragment:p.fragment+expand(shader.fragmentShader)});
}
for(const [name,material] of [['liquid splash',art.splashes.material],['lava',art.lava],['falls',art.fallMaterial],['smoke',art.vaporMat],['sky',art.sky],['embers',art.ash.material],['lava pops',art.popMaterial],['eruption',art.plumeMaterial],['ballistic bursts',art.activity.burstMaterial],['fire trails',art.activity.flameMaterial]])for(const instanced of [false,true]){
 const p=prefix(instanced,false);programs.push({name:name+(instanced?' instanced':''),vertex:p.vertex+expand(material.vertexShader),fragment:p.fragment+expand(material.fragmentShader)});
}
console.log(JSON.stringify(programs));
