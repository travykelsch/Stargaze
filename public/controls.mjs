// Touch response and evade tuning, independent of visuals and saved progress.
export const CONTROL_TUNING=Object.freeze({duration:.30,distance:15,deadZone:.045,touchGain:1.45});
export const DEFAULT_CONTROLS=Object.freeze({side:'left',layout:'directional'});
export function controlPreferences(raw){let s;try{s=JSON.parse(raw)||{};}catch{s={};}return {side:s.side==='right'?'right':'left',layout:s.layout==='split'?'split':'directional'};}
export function normalizeInput(x,y){const length=Math.hypot(x,y);return length>1?{x:x/length,y:y/length}:{x,y};}
export function touchSteering(dx,dy,width,height){const radius=Math.max(36,Math.min(64,Math.min(width,height)*.12)),length=Math.hypot(dx,dy),r=Math.min(1,length/radius),d=CONTROL_TUNING.deadZone;if(r<=d)return {x:0,y:0};const t=(r-d)/(1-d),strength=(.5*t+.5*t*t)*CONTROL_TUNING.touchGain;return {x:dx/length*strength,y:-dy/length*strength};}
export class Evade {
 constructor(){this.reset();}
 reset(){this.active=false;this.elapsed=0;this.x=this.y=0;}
 activate(x,y,position,limits){if(this.active)return false;const length=Math.hypot(x,y);if(length<.06)return false;x/=length;y/=length;const endX=Math.max(-limits.x,Math.min(limits.x,position.x+x*CONTROL_TUNING.distance)),endY=Math.max(-limits.y,Math.min(limits.y,position.y+y*CONTROL_TUNING.distance));if(Math.hypot(endX-position.x,endY-position.y)<.1)return false;this.x=x;this.y=y;this.dx=endX-position.x;this.dy=endY-position.y;this.elapsed=0;this.active=true;return true;}
 step(dt){if(!this.active)return {x:0,y:0};const before=this.elapsed/CONTROL_TUNING.duration;this.elapsed=Math.min(CONTROL_TUNING.duration,this.elapsed+dt);if(CONTROL_TUNING.duration-this.elapsed<1e-9)this.elapsed=CONTROL_TUNING.duration;const after=this.elapsed/CONTROL_TUNING.duration;this.active=after<1;return {x:this.dx*(after-before),y:this.dy*(after-before)};}
 get phase(){return this.active?this.elapsed/CONTROL_TUNING.duration:0;}
}
