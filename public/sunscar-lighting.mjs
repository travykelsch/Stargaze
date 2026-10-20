import {sectionAt,tunnelBlend} from './sunscar-course.mjs?v=49';
const profiles=[
 {fog:0xb9a6ab,sky:0x9cadd4,ground:0xa86e49,sun:0xffdbad,hemi:1.12,key:3.30,exposure:1.06,near:170,far:1030},
 {fog:0xc5bec4,sky:0xa2b9df,ground:0xb18a60,sun:0xffe8c7,hemi:1.28,key:3.10,exposure:1.02,near:220,far:1140},
 {fog:0xb19b9a,sky:0x9fa8d3,ground:0xab704c,sun:0xffd8a7,hemi:1.10,key:3.35,exposure:1.02,near:190,far:1100},
 {fog:0x685564,sky:0x8590bb,ground:0x9c684a,sun:0xffb775,hemi:1.24,key:.38,exposure:1.18,near:90,far:440},
 {fog:0xc2b8b8,sky:0xabc2df,ground:0xc39265,sun:0xffe4bf,hemi:1.24,key:3.20,exposure:1.01,near:240,far:1160},
 {fog:0xb69a9e,sky:0xa6a6cb,ground:0xad6e4b,sun:0xffd5a5,hemi:1.14,key:2.80,exposure:1.07,near:170,far:940}
];
const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);},mix=(a,b,u)=>a+(b-a)*u;
const colorMix=(a,b,u)=>{let c=0;for(const shift of [16,8,0])c|=Math.round(mix((a>>shift)&255,(b>>shift)&255,u))<<shift;return c;};
export function sunscarLighting(distance){const s=sectionAt(Math.max(0,distance-29)),a=profiles[s.type],b=profiles[(s.type+1)%6],u=smooth((s.local-440)/130),p={};for(const k of ['fog','sky','ground','sun'])p[k]=colorMix(a[k],b[k],u);for(const k of ['hemi','key','exposure','near','far'])p[k]=mix(a[k],b[k],u);p.tunnel=tunnelBlend(Math.max(0,distance-29));return p;}
