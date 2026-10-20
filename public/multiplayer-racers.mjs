import {difficulty} from './mechanics.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Bounded presentation tracks for the server's Sunscar field. Never run the
// racing simulation locally: every client follows the same authoritative actors.
export class MultiplayerRacers {
 constructor(){this.tracks=new Map();}
 reset(){this.tracks.clear();}
 frame(room,time,distance,dt){
  const active=new Set(),result=[],speed=difficulty(time,room.difficulty,room.world).speed,age=clamp(time-room.time,0,1.5),token=room.round+':'+room.simAt;
  for(const a of room.fields.flat()){
   if(Math.abs(a.forward-distance)>1800)continue;
   active.add(a.id);const target={x:a.x+clamp(a.vx||0,-24,24)*age,y:a.y+clamp(a.vy||0,-16,16)*age,forward:a.forward+speed*a.ratio*age};let track=this.tracks.get(a.id);
   if(!track){track={token,shown:{...target},offset:{x:0,y:0,forward:0}};this.tracks.set(a.id,track);}
   if(track.token!==token){for(const key of ['x','y','forward'])track.offset[key]=track.shown[key]-target[key];track.token=token;}
   for(const key of ['x','y'])track.offset[key]*=Math.exp(-dt*8);
   const repay=Math.max(8,speed*a.ratio)*dt*.25;track.offset.forward+=clamp(-track.offset.forward,-repay,repay);
   for(const key of ['x','y','forward'])track.shown[key]=target[key]+track.offset[key];
   result.push({...a,...track.shown,crashAge:a.crashAge+(a.state==='crashing'?age:0)});
  }
  for(const id of this.tracks.keys())if(!active.has(id))this.tracks.delete(id);
  return result;
 }
}
