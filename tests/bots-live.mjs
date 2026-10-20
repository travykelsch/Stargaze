// Hosted API check. Service access enters through hidden stdin only.
import assert from 'node:assert/strict';
import {once} from 'node:events';
process.stdin.setEncoding('utf8');const [line]=await once(process.stdin,'data'),{token,origin}=JSON.parse(line);
const sessions=Array.from({length:4},()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join(''));
let code='',requests=0;const reports=[];
async function call(i,action,data={}){requests++;const r=await fetch(origin+'/api/multiplayer',{method:'POST',headers:{'OAI-Sites-Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({session:sessions[i],code,action,...data}),signal:AbortSignal.timeout(20000)});const raw=await r.text();let body;try{body=JSON.parse(raw);}catch{throw new Error('Non-JSON multiplayer response '+r.status);}assert.equal(r.status,200,body.error);return body;}
try{
 for(const [humans,difficulty,mode]of [[1,'easy','collector'],[2,'medium','survival'],[3,'hard','race'],[4,'easy','collector']]){
  let r=await call(0,'create',{world:'sunscar',difficulty,mode,name:'QA Host'});code=r.room.code;
  for(let i=1;i<humans;i++)await call(i,'join',{name:'QA '+i});
  r=await call(0,'start');assert.equal(r.room.phase,'preparing');for(let i=0;i<humans;i++)r=await call(i,'loaded');assert.equal(r.room.phase,'countdown');assert.equal(r.room.players.length,4);assert.equal(r.room.players.filter(p=>p.bot).length,4-humans);assert.ok(r.room.players.filter(p=>p.bot).every(p=>p.botDifficulty===difficulty));
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,r.room.startAt-r.room.serverNow+100)));
  const seq=Array(humans).fill(0);for(let frame=0;frame<3;frame++){
   const states=await Promise.all(Array.from({length:humans},(_,i)=>call(i,'input',{seq:++seq[i],x:0,y:0,evadeSeq:0})));r=states[0];assert.ok(states.every(s=>s.room.players.length===4));assert.ok(states.every(s=>new Set(s.room.players.map(p=>p.id)).size===4));await new Promise(resolve=>setTimeout(resolve,120));
  }
  assert.ok(r.room.time>0);assert.ok(r.room.players.filter(p=>p.bot).every(p=>p.z>0||p.crashes>0));assert.ok(r.room.players.filter(p=>p.bot).every(p=>!('botBrain'in p)&&!('owner'in p)&&!('accountUser'in p)));
  reports.push({humans,bots:4-humans,difficulty,mode,simulationSeconds:r.room.time,botPositions:r.room.players.filter(p=>p.bot).map(p=>Math.round(p.z))});console.log(JSON.stringify(reports.at(-1)));
  await Promise.all(Array.from({length:humans},(_,i)=>call(i,'leave')));
 }
 console.log(JSON.stringify({pass:true,hostedWorkerD1:true,requests,reports,rendered:false,phoneTested:false}));
}catch(e){console.error(e.message);process.exitCode=1;}finally{process.exit(process.exitCode||0);}
