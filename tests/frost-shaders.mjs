// Pipe to compile-shaders.py for real native compilation of the expanded Three
// material sources. This does not replace browser or mobile visual inspection.
import * as T from '../public/three.module.js';
import {createFrostWorld} from '../public/frost-world.mjs';
const art=createFrostWorld(new T.Scene(),new T.Group());
const expand=s=>s.replace(/#include <(\w+)>/g,(_,key)=>expand(T.ShaderChunk[key]));
const defines=`#define STANDARD
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
function prefix(instanced,mapped,colored=false){const flags=defines+(colored?'#define USE_COLOR\n':'')+(instanced?'#define USE_INSTANCING\n':'')+(mapped?'#define USE_MAP\n#define MAP_UV uv\n#define USE_BUMPMAP\n#define BUMPMAP_UV uv\n':'');return {
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
for(const [name,material] of [['glacier',art.terrain],['ice',art.ice]])for(const instanced of [false,true]){
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);const p=prefix(instanced,true,material.vertexColors);
 programs.push({name:name+(instanced?' instanced':''),vertex:p.vertex+expand(shader.vertexShader),fragment:p.fragment+expand(shader.fragmentShader)});
}
for(const [name,material] of [['aurora curtain',art.surfaces.aurora],['tornado spiral bands',art.surfaces.bands],['tornado base/crown clouds',art.surfaces.cloud],['snow vortex',art.surfaces.core],['vortex wisps',art.surfaces.wisps],['glacier floor',art.floor],['snow clouds',art.mist],['sky',art.sky],['snowfall',art.snow.material],['shard trails',art.trails.material]])for(const instanced of [false,true]){
 const p=prefix(instanced,false);programs.push({name:name+(instanced?' instanced':''),vertex:p.vertex+expand(material.vertexShader),fragment:p.fragment+expand(material.fragmentShader)});
}
console.log(JSON.stringify(programs));
