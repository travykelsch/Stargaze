// Smooth 12-second transitions on a 30-second cadence. Geometric increments
// approach a finite ceiling: long runs never exhaust a hidden difficulty budget.
const clamp=v=>Math.max(0,Math.min(1,v));
export function ramp(t,start){const u=clamp((t-start)/12);return u*u*(3-2*u);}
export function stages(t,start){let value=0,weight=.19;for(let n=0;n<100&&start+n*30<t;n++){value+=weight*ramp(t,start+n*30);weight*=.81;}return value;}
function rampIntegral(t,start){const v=Math.max(0,t-start),u=Math.min(1,v/12);return 12*(u*u*u-.5*u*u*u*u)+Math.max(0,v-12);}
const modeScale=mode=>mode==='hard'?2.15:mode==='medium'?1.55:1;
export const SUNSCAR_BOOST=1.58;
export function progression(t){return {ringMotion:ramp(t,60)*(.45+.55*stages(t,90)),ringScale:1-.22*stages(t,60),scarcity:.72*stages(t,90),objectSpeed:1+.35*stages(t,120)};}
// Sunscar accelerates over the opening eight seconds. Its distance clock is
// integrated analytically, so generation, rings, AI and replay agree exactly.
export function sunscarClock(t){const u=clamp(t/8);return t+(SUNSCAR_BOOST-1)*(8*(u*u*u-.5*u*u*u*u)+Math.max(0,t-8));}
export function flightSpeed(t,mode='easy',world=''){const u=clamp(t/8),boost=world==='sunscar'?1+(SUNSCAR_BOOST-1)*u*u*(3-2*u):1;return (58+62*stages(world==='sunscar'?sunscarClock(t):t,30))*modeScale(mode)*boost;}
export function flightDistance(t,mode='easy',world=''){t=Math.max(0,t);if(world==='sunscar')t=sunscarClock(t);let distance=58*t,weight=.19;for(let n=0;n<100&&30+n*30<t;n++){distance+=62*weight*rampIntegral(t,30+n*30);weight*=.81;}return distance*modeScale(mode);}
export function flightTime(z,mode='easy',world=''){if(world==='sunscar'){let t=Math.max(0,z)/(58*modeScale(mode)*SUNSCAR_BOOST);for(let i=0;i<8;i++)t=Math.max(0,t+(z-flightDistance(t,mode,world))/flightSpeed(t,mode,world));return t;}let lo=0,hi=Math.max(10,z/58+10);for(let i=0;i<42;i++){const m=(lo+hi)/2;if(flightDistance(m,mode,world)<z)lo=m;else hi=m;}return (lo+hi)/2;}
export function ringOffset(r,time){const strength=progression(time).ringMotion,phase=r.motionPhase||0;return {x:Math.sin(time*.85+phase)*1.8*strength,y:Math.sin(time*.64+phase*.73)*1.15*strength};}
// Only isolated odd rows can be omitted. A retained gold ring on each even row
// limits spacing to 380 m. At maximum drain the gap must cost < 7 refill units.
export function omitRingRow(index,at,mode,hash,world=''){return index>2&&index%2===1&&hash<progression(at).scarcity&&2*(flightTime(index*190,mode,world)-flightTime((index-2)*190,mode,world))<=6.5;}

export function objectTime(t){let clock=t,weight=.19;for(let n=0;n<100&&120+n*30<t;n++){clock+=.35*weight*rampIntegral(t,120+n*30);weight*=.81;}return clock;}
