import * as T from './three.module.js';

// Easy-only, cached materials and geometry. No reflection buffers or post effects.
export function createEasyVisuals(keep){
 const clock={value:0},travel={value:0};
 function texture(size,pixel,srgb=false){const data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const v=pixel(x/size,y/size,x,y),i=(y*size+x)*4;data.set([v[0],v[1],v[2],255],i);}const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=2;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;}
 const tau=Math.PI*2;
 // Periodic smooth value noise avoids geometric cloud blobs and visible tile seams.
 const lattice=(x,y,n)=>{x=(x+n)%n;y=(y+n)%n;const v=Math.sin(x*127.1+y*311.7+n*71.3)*43758.5453;return v-Math.floor(v);};
 const valueNoise=(u,v,n)=>{const x=u*n,y=v*n,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=lattice(ix,iy,n),b=lattice(ix+1,iy,n),c=lattice(ix,iy+1,n),d=lattice(ix+1,iy+1,n);return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;};
 const noise=texture(128,(u,v)=>{const n=valueNoise(u,v,4)*.58+valueNoise(u,v,8)*.27+valueNoise(u,v,16)*.11+valueNoise(u,v,32)*.04,c=Math.round(n*255);return[c,c,c];});
 const stone=texture(256,(u,v)=>{const broad=valueNoise(u,v,8),fine=valueNoise(u,v,32),fissure=Math.max(0,1-Math.abs(valueNoise(u+.13,v,8)-.48)/.028),c=Math.round(218+broad*24+fine*12-fissure*20);return[c,Math.round(c*.985),Math.round(c*.955)];},true);
 const stoneHeight=texture(256,(u,v)=>{const n=valueNoise(u,v,16)*.7+valueNoise(u,v,64)*.3,c=Math.round(115+n*75);return[c,c,c];});
 const stoneRoughness=texture(128,(u,v)=>{const c=Math.round(216+valueNoise(u,v,32)*32);return[c,c,c];});
 const feather=texture(128,(u,v)=>{const shaft=Math.pow(Math.abs(Math.cos(u*tau*5)),28),barb=Math.cos((v*34+Math.abs(Math.sin(u*tau*5))*.5)*tau),c=Math.round(237-shaft*18+barb*9);return[c,c,c];},true);
 function projectedUV(g,scale){const p=g.attributes.position,n=g.attributes.normal,uv=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));uv.push((nx>ny&&nx>nz?z:x)*scale,(ny>nx&&ny>nz?z:y)*scale);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}
 function stoneMaterial(color,vertexColors=false){return new T.MeshStandardMaterial({color,vertexColors,map:stone,bumpMap:stoneHeight,roughnessMap:stoneRoughness,bumpScale:.13,roughness:1});}
 const birdMaterial=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,map:feather,bumpMap:feather,bumpScale:.018,roughness:.72,side:T.DoubleSide});
 const sky=new T.ShaderMaterial({depthWrite:false,depthTest:false,fog:false,uniforms:{uTime:clock,uNoise:{value:noise}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 uniform float uTime;uniform sampler2D uNoise;varying vec2 vUv;
 void main(){vec2 p=vUv;float h=smoothstep(.28,.97,p.y);vec3 col=mix(vec3(.73,.40,.29),vec3(.10,.28,.47),h);col=mix(col,vec3(.94,.64,.42),exp(-pow((p.y-.42)*7.,2.))*.32);
 vec2 glow=(p-vec2(.24,.51))*vec2(1.2,1.);col+=vec3(.17,.09,.028)*exp(-length(glow)*6.);
 vec2 q=p*vec2(.85,4.2)+vec2(uTime*.0013,0.);float a=texture2D(uNoise,q).r,b=texture2D(uNoise,q*2.09+vec2(.17,uTime*.0005)).r,c=texture2D(uNoise,q*4.17).r;float cloud=smoothstep(.44,.67,a*.64+b*.27+c*.09)*smoothstep(.40,.63,p.y);float edge=smoothstep(.45,.60,a*.64+b*.27+c*.09)-smoothstep(.60,.70,a*.64+b*.27+c*.09);
 vec3 cloudCol=mix(vec3(.40,.42,.53),vec3(.86,.70,.60),smoothstep(.48,.82,p.y));cloudCol+=vec3(.14,.055,.018)*edge;col=mix(col,cloudCol,cloud*.46);float wisps=smoothstep(.56,.72,texture2D(uNoise,p*vec2(.8,4.)+vec2(uTime*.0007,0.)).r)*smoothstep(.65,.9,p.y);col=mix(col,vec3(.61,.64,.72),wisps*.16);gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const waterGeometry=keep(new T.PlaneGeometry(250,190,56,38).rotateX(-Math.PI/2));
 const waterMaterial=new T.ShaderMaterial({fog:true,uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:clock,uTravel:travel,uNoise:{value:noise}}]),vertexShader:`
 uniform float uTime,uTravel;varying vec3 vWorld;varying vec2 vFlow;
 #include <fog_pars_vertex>
 void main(){vec4 wp=modelMatrix*vec4(position,1.);vFlow=wp.xz-vec2(0.,uTravel);wp.y+=sin(vFlow.x*.24+vFlow.y*.16+uTime*.9)*.085+sin(vFlow.y*.39-vFlow.x*.11-uTime*1.4)*.035;vWorld=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,fragmentShader:`
 uniform float uTime;uniform sampler2D uNoise;varying vec3 vWorld;varying vec2 vFlow;
 #include <fog_pars_fragment>
 void main(){vec2 p=vFlow;float a=p.x*.24+p.y*.16+uTime*.9,b=p.y*.39-p.x*.11-uTime*1.4;float fine=texture2D(uNoise,p*.018+vec2(uTime*.005,0.)).r;vec3 n=normalize(vec3(-cos(a)*.0204+cos(b)*.00385+sin(p.y*1.6+uTime*1.3)*.013,1.,-cos(a)*.0136-cos(b)*.01365+cos(p.x*1.3-uTime*.9)*.012));vec3 eye=normalize(cameraPosition-vWorld);float fres=pow(1.-max(dot(n,eye),0.),3.);vec3 reflection=reflect(-eye,n);float horizon=pow(1.-abs(reflection.y),2.);vec3 reflected=mix(vec3(.13,.31,.47),vec3(.67,.43,.30),horizon);float reflectedCloud=smoothstep(.46,.68,texture2D(uNoise,reflection.xz*.31+vec2(uTime*.001,0.)).r);reflected=mix(reflected,vec3(.59,.50,.47),reflectedCloud*.09);
 float shelf=smoothstep(40.,65.,abs(p.x))*(.65+fine*.35);vec3 deep=mix(vec3(.008,.28,.32),vec3(.035,.48,.43),shelf);vec3 col=mix(deep,reflected,.15+fres*.48);
 vec3 sun=normalize(vec3(-.78,.36,-.42));float spec=pow(max(dot(reflect(-sun,n),eye),0.),135.);float shimmer=pow(max(0.,sin(p.y*2.8+p.x*.7+uTime*1.4)),12.);col+=vec3(1.,.70,.39)*spec*(.55+shimmer*.45);
 float caustic=pow(max(0.,1.-abs(texture2D(uNoise,p*.065+vec2(0.,uTime*.008)).r-.49)*14.),3.);col+=vec3(.10,.23,.18)*caustic*shelf*.16;
 float shore=smoothstep(48.,61.,abs(p.x))*(1.-smoothstep(65.,78.,abs(p.x)));float foam=smoothstep(.58,.75,texture2D(uNoise,p*.058+vec2(uTime*.005,-uTime*.013)).r);col=mix(col,vec3(.64,.80,.70),shore*foam*.35);gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`});
 // UniformsUtils clones values; reconnect the shared animation clocks afterward.
 waterMaterial.uniforms.uTime=clock;waterMaterial.uniforms.uTravel=travel;waterMaterial.uniforms.uNoise.value=noise;
 const fallGeometry=keep(new T.PlaneGeometry(1,1,5,12));
 const fallMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,fog:true,uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:clock}]),vertexShader:`varying vec2 vUv;
 #include <fog_pars_vertex>
 void main(){vUv=uv;vec3 p=position;p.z+=sin(uv.y*3.14159)*.035;vec4 local=vec4(p,1.);
 #ifdef USE_INSTANCING
 local=instanceMatrix*local;
 #endif
 vec4 mvPosition=modelViewMatrix*local;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,fragmentShader:`uniform float uTime;varying vec2 vUv;
 #include <fog_pars_fragment>
 void main(){float strands=sin(vUv.x*91.+sin(vUv.y*6.+uTime*2.)*.6)*.5+.5;float flow=sin(vUv.y*65.+uTime*13.+vUv.x*18.)*.5+.5;float edge=smoothstep(0.,.12,vUv.x)*(1.-smoothstep(.88,1.,vUv.x));vec3 col=mix(vec3(.29,.62,.65),vec3(.93,.91,.77),strands*.65+flow*.25);gl_FragColor=vec4(col,edge*(.44+strands*.35));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`});fallMaterial.uniforms.uTime=clock;
 const foamGeometry=keep(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2));
 const foamMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:clock}]),vertexShader:`varying vec2 vUv;
 #include <fog_pars_vertex>
 void main(){vUv=uv;vec4 local=vec4(position,1.);
 #ifdef USE_INSTANCING
 local=instanceMatrix*local;
 #endif
 vec4 mvPosition=modelViewMatrix*local;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,fragmentShader:`uniform float uTime;varying vec2 vUv;
 #include <fog_pars_fragment>
 void main(){vec2 p=(vUv-.5)*2.;float radius=length(p),edge=1.-smoothstep(.4,1.,radius),ring=pow(sin(radius*26.-uTime*4.)*.5+.5,4.);gl_FragColor=vec4(.74,.86,.76,edge*(.16+ring*.22));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`});foamMaterial.uniforms.uTime=clock;
 const mistMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:clock}]),vertexShader:`uniform float uTime;attribute float aPhase;varying float vLife;
 #include <fog_pars_vertex>
 void main(){float life=fract(aPhase+uTime*.22);vLife=sin(life*3.14159);vec3 p=position+vec3(sin(aPhase*49.+uTime*.3)*life*4.,life*4.,cos(aPhase*31.)*life*3.);vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;gl_PointSize=min(38.,(380.+life*300.)/max(1.,-mvPosition.z));
 #include <fog_vertex>
 }`,fragmentShader:`varying float vLife;
 #include <fog_pars_fragment>
 void main(){float a=1.-smoothstep(.12,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.89,.88,.76,a*vLife*.20);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`});mistMaterial.uniforms.uTime=clock;
 // Curved, tapered alien fronds, combined into one reusable tree mesh.
 const p=[],ix=[],colors=[];
 for(let j=0;j<9;j++){const angle=j*2.399,base=p.length/3,leafColor=new T.Color(j%3?0x62875e:0x9bb275);for(let k=0;k<=9;k++){const t=k/9,r=t*1.6,y=1.9+Math.sin(t*Math.PI*.82)*.55-t*.30,width=Math.sin(Math.PI*t)*.29;for(const side of [-1,1]){p.push(Math.cos(angle)*r-Math.sin(angle)*width*side,y,Math.sin(angle)*r+Math.cos(angle)*width*side);leafColor.clone().multiplyScalar(.74+t*.26).toArray(colors,colors.length);}
 if(k){const a=base+k*2;ix.push(a-2,a-1,a,a,a-1,a+1);}}}
 const frondGeometry=keep(new T.BufferGeometry());frondGeometry.setAttribute('position',new T.Float32BufferAttribute(p,3));frondGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));frondGeometry.setIndex(ix);frondGeometry.computeVertexNormals();
 const frondMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.86,side:T.DoubleSide});frondMaterial.onBeforeCompile=shader=>{shader.uniforms.uEasyWind=clock;shader.vertexShader='uniform float uEasyWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float phase=position.x*1.7+position.z;
 #ifdef USE_INSTANCING
 phase+=instanceMatrix[3].x*.31+instanceMatrix[3].z*.14;
 #endif
 transformed.x+=sin(uEasyWind*1.2+phase)*.055*max(0.,position.y-1.);
 transformed.z+=cos(uEasyWind*.9+phase)*.04*max(0.,position.y-1.);`);};frondMaterial.customProgramCacheKey=()=> 'easy-frond-wind-v17';
 const trunkGeometry=keep(new T.CylinderGeometry(.055,.14,2.2,6,3).translate(0,1.1,0));const tp=trunkGeometry.attributes.position;for(let i=0;i<tp.count;i++)tp.setX(i,tp.getX(i)+Math.sin(tp.getY(i)*1.1)*.15);trunkGeometry.computeVertexNormals();
 const trunkMaterial=new T.MeshStandardMaterial({color:0x72684b,roughness:1});
 function makeMist(positions,phases){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('aPhase',new T.Float32BufferAttribute(phases,1));g.computeBoundingSphere();g.boundingSphere.radius+=8;const o=new T.Points(g,mistMaterial);o.userData.transientGeometry=true;return o;}
 return {clock,stoneHeight,stoneRoughness,sky,waterGeometry,waterMaterial,fallGeometry,fallMaterial,foamGeometry,foamMaterial,frondGeometry,frondMaterial,trunkGeometry,trunkMaterial,birdMaterial,stoneMaterial,projectedUV,makeMist,noise,update(distance,time){clock.value=time;travel.value=distance;}};
}
