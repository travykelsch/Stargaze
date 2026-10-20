// Real hosted service smoke test. A Sites service token is read only from hidden
// stdin, never from source, arguments, environment, or output. No visual claims.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {safeRoute,difficulty} from '../public/mechanics.mjs';
process.stdin.setEncoding('utf8');const [line]=await once(process.stdin,'data');const {token,origin}=JSON.parse(line);
const sessions=Array.from({length:4},()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join(''));
let code='';const latencies=[];
async function call(i,action,data={}){const at=performance.now();const r=await fetch(origin+'/api/multiplayer',{method:'POST',headers:{'OAI-Sites-Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({session:sessions[i],code,action,...data}),signal:AbortSignal.timeout(20000)});latencies.push(performance.now()-at);let body;try{body=await r.json();}catch{throw new Error('Service returned non-JSON status '+r.status);}if(!r.ok)throw new Error(r.status+': '+body.error);return body;}
const report=[];
try{
 for(const mode of ['collector','race','survival']){
  let r=await call(0,'create',{name:'QA 1',world:'sunscar',difficulty:'easy',mode});code=r.room.code;
  for(let i=1;i<4;i++)await call(i,'join',{name:'QA '+(i+1),ship:['comet','dart','twin-pod-racer','night-glider'][i]});
  const joined=await Promise.all([0,1,2,3].map(i=>call(i,'state')));assert.ok(joined.every(x=>x.room.players.length===4));
  await Promise.all([0,1,2,3].map(i=>call(i,'ready',{ready:true})));r=await call(0,'state');console.log(JSON.stringify({mode,phase:r.room.phase,ready:r.room.players.map(p=>p.ready),ages:r.room.players.map(p=>r.room.serverNow-p.seen)}));assert.equal(r.room.phase,'countdown');
  const seq=[0,0,0,0],seenIds=new Set();let frames=0,lastPhase='countdown',maxTime=0,states=joined;
  const until=Date.now()+9500;
  while(Date.now()<until){states=await Promise.all([0,1,2,3].map((i)=>{const s=states[i],p=s.room.players.find(p=>p.id===s.pilot),q=safeRoute(p.z+difficulty(s.room.time,'easy','sunscar').speed*.08,s.room.seed,'easy','sunscar');return call(i,'input',{seq:++seq[i],x:Math.max(-1,Math.min(1,(q.x-p.x)/2.7)),y:Math.max(-1,Math.min(1,(q.y-p.y)/2.4)),evadeSeq:0});}));for(const s of states){assert.equal(s.room.mode,mode);assert.equal(s.room.players.length,4);seenIds.add(s.pilot);maxTime=Math.max(maxTime,s.room.time);lastPhase=s.room.phase;}frames++;await new Promise(r=>setTimeout(r,110));}
  states=await Promise.all([0,1,2,3].map(i=>call(i,'state')));assert.equal(seenIds.size,4);assert.ok(maxTime>0);assert.ok(states.every(s=>s.room.players.some(p=>p.z>0)));assert.ok(states.some(s=>s.room.fields.flat().length>0));
  const before=states[0].pilot;const reconnect=await call(0,'join');assert.equal(reconnect.pilot,before);
  // Explicitly forfeit three pilot sessions; the fourth can finish/spectate.
  for(let i=1;i<4;i++)await call(i,'leave');r=await call(0,'state');if(mode==='survival'){assert.equal(r.room.phase,'results');assert.deepEqual(r.room.winners,[r.pilot]);const a=await call(0,'claim'),b=await call(0,'claim');assert.equal(a.grant.id,b.grant.id);assert.equal(a.grant.balance,b.grant.balance);}await call(0,'leave');
  report.push({mode,fourClients:true,frames,maxSimTime:maxTime,lastPhase,sharedRacers:states[0].room.fields.flat().length,reconnect:true});
 }
 latencies.sort((a,b)=>a-b);console.log(JSON.stringify({passed:true,service:'hosted Worker + D1',report,requests:latencies.length,p50ms:Math.round(latencies[Math.floor(latencies.length*.5)]),p95ms:Math.round(latencies[Math.floor(latencies.length*.95)]),note:'Synthetic HTTP clients; no rendered frames, phone or human play tested.'}));
}catch(e){console.error(e.message);process.exitCode=1;}
process.exit();
