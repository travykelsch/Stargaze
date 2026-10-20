import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {once} from 'node:events';
import {safeRoute,difficulty} from '../public/mechanics.mjs';
const require=createRequire(import.meta.resolve('wrangler/package.json')),mfRequire=createRequire(require.resolve('miniflare/package.json')),nextRequire=createRequire(import.meta.resolve('next/package.json'));
const WebSocket=mfRequire('ws'),{HttpsProxyAgent}=nextRequire('next/dist/compiled/https-proxy-agent');
process.stdin.setEncoding('utf8');const [line]=await once(process.stdin,'data'),{token,origin}=JSON.parse(line);
const sessions=Array.from({length:4},()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join(''));
const sockets=[],pending=[],latency=[],states=[];let serial=0,code='';
async function connect(i){const url=new URL('/api/live',origin);url.protocol='wss:';const socket=new WebSocket(url,{agent:new HttpsProxyAgent(process.env.HTTPS_PROXY),headers:{Origin:origin,'OAI-Sites-Authorization':'Bearer '+token},handshakeTimeout:15000});sockets[i]=socket;pending[i]=new Map();socket.on('message',raw=>{const r=JSON.parse(raw),p=pending[i].get(r.requestId);if(p){pending[i].delete(r.requestId);clearTimeout(p.timer);latency.push(performance.now()-p.at);r.status===200?p.resolve(r):p.reject(new Error(r.error));}});await once(socket,'open');}
function call(i,action,data={}){const requestId=++serial;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Live update timeout')),10000);pending[i].set(requestId,{resolve,reject,timer,at:performance.now()});sockets[i].send(JSON.stringify({requestId,session:sessions[i],code,action,...data}));});}
try{
 await Promise.all([0,1,2,3].map(connect));let r=await call(0,'create',{world:'sunscar',difficulty:'easy',mode:'collector',name:'Live QA'});code=r.room.code;states[0]=r;
 for(let i=1;i<4;i++)states[i]=await call(i,'join',{name:'Live QA '+i});r=await call(0,'start');for(let i=0;i<4;i++)r=await call(i,'loaded');assert.equal(r.room.phase,'countdown');await new Promise(resolve=>setTimeout(resolve,Math.max(0,r.room.startAt-r.room.serverNow+50)));
 const until=Date.now()+15000,counts=[0,0,0,0];
 await Promise.all([0,1,2,3].map(async i=>{let seq=0;while(Date.now()<until){const state=states[i],p=state.room.players.find(p=>p.id===state.pilot),speed=difficulty(state.room.time,'easy','sunscar').speed,q=safeRoute(p.z+speed*.2,state.room.seed,'easy','sunscar');states[i]=await call(i,'input',{seq:++seq,x:Math.max(-1,Math.min(1,(q.x+(i-1.5)*.3-p.x)/4.86)),y:Math.max(-1,Math.min(1,(q.y-p.y)/4.32)),evadeSeq:0});assert.equal(states[i].pilot,state.pilot);assert.equal(states[i].room.players.length,4);counts[i]++;await new Promise(resolve=>setTimeout(resolve,100));}}));
 const final=await call(0,'state');assert.equal(new Set(states.map(s=>s.pilot)).size,4);assert.ok(final.room.time>5);assert.ok(final.room.fields.flat().length>0);assert.ok(counts.every(n=>n>=5));latency.sort((a,b)=>a-b);
 console.log(JSON.stringify({pass:true,transport:'four persistent WebSockets',updates:counts,simulationSeconds:final.room.time,racers:final.room.fields.flat().length,crashes:final.room.players.map(p=>p.crashes),rings:final.room.players.map(p=>p.rings),p50ms:Math.round(latency[Math.floor(latency.length*.5)]),p95ms:Math.round(latency[Math.floor(latency.length*.95)]),rendered:false,phoneTested:false}));
 for(let i=0;i<4;i++)await call(i,'leave');
}catch(e){console.error(e.message);process.exitCode=1;}finally{for(const s of sockets)s.close();process.exit(process.exitCode||0);}
