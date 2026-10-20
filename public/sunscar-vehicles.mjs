// Geometry descriptors shared by art and rival-to-rival contact checks.
export const ENGINE_LAYOUTS=[
 [[-2.65,0,-2.5,1.1,8.2],[2.65,0,-2.5,1.1,8.2]],
 [[0,-.3,-1.8,.88,8.8],[-1.75,-.1,0,.48,4.6],[1.75,-.1,0,.48,4.6]],
 [[-2.8,-.4,-.6,1.15,6.4],[2.8,-.4,-.6,1.15,6.4],[0,-1.1,-1,.66,5.2]],
 [[-2.7,-.2,-1.8,1.24,7.7],[2.5,.1,-.2,.77,5.9]]
];
export const COCKPITS=[[0,0,3.2],[0,.3,1.7],[0,.7,1.8],[.7,.3,2.4]];
const COMPONENTS=ENGINE_LAYOUTS.map((engines,i)=>[...engines.map(([x,y,z,r,length])=>({x,y,z,rx:r,ry:r,hz:length/2})),{x:COCKPITS[i][0],y:COCKPITS[i][1],z:COCKPITS[i][2],rx:i===2?1.8:1.05,ry:i===2?1.05:.7,hz:i===2?2.6:1.75}]);
export function craftContact(a,b,sweep=0){if(Math.abs(a.x-b.x)>8.5||Math.abs(a.y-b.y)>4||Math.abs(a.forward-b.forward)>14+sweep)return false;for(const p of COMPONENTS[a.style%4])for(const q of COMPONENTS[b.style%4]){if(Math.abs(a.forward-p.z-b.forward+q.z)>p.hz+q.hz+sweep)continue;const dx=a.x+p.x-b.x-q.x,dy=a.y+p.y-b.y-q.y;if((dx/(p.rx+q.rx))**2+(dy/(p.ry+q.ry))**2<1)return true;}return false;}

export function craftBounds(style){const c=COMPONENTS[style%4];return {halfX:Math.max(...c.map(p=>Math.abs(p.x)+p.rx)),halfY:Math.max(...c.map(p=>Math.abs(p.y)+p.ry)),front:Math.max(...c.map(p=>-p.z+p.hz)),rear:Math.max(...c.map(p=>p.z+p.hz))};}
