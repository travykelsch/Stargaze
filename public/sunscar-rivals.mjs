export const RIVAL_CLANS=[
 {name:'Ash Knives',pilot:'Cinder',role:'attacker',paint:0xc15f35,accent:0xf5d7a0,pressure:1.48,mass:.9,health:4,pitch:79,timbre:'sawtooth'},
 {name:'Glass Wraiths',pilot:'Vesper',role:'specialist',paint:0xd5d7ca,accent:0x77aaa9,pressure:.72,mass:.67,health:3,pitch:123,timbre:'triangle'},
 {name:'Crown Hammers',pilot:'Brakk',role:'bruiser',paint:0x9b2e43,accent:0xd8b46a,pressure:1.15,mass:1.75,health:6,pitch:43,timbre:'sawtooth'},
 {name:'Dust Saints',pilot:'Sable',role:'survivor',paint:0x607c78,accent:0xbec4ae,pressure:.55,mass:1.05,health:4,pitch:65,timbre:'triangle'}
];
export const rivalProfile=style=>RIVAL_CLANS[style%4];
export function rivalIntent(a,rival,time){const role=rivalProfile(a.style).role;if(a.state!=='racing')return a.state;if(a.escapeUntil>time)return 'evading wreck';if(!rival)return 'racing';if(role==='attacker')return 'feinting';if(role==='bruiser')return a.forward>rival.forward?'blocking':'counter-overtaking';if(role==='specialist')return 'threading gap';return 'finding space';}
