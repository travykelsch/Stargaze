import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.resolve('wrangler/package.json')),{Miniflare}=require('miniflare'),{build}=require('esbuild');
const result=await build({stdin:{contents:`import {live} from './server/live.mjs';export default {fetch(request,env){return live(request,env.DB);}}`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'neutral',external:['node:crypto']});
const worker=new Miniflare({modules:true,script:result.outputFiles[0].text,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],cf:false});
try{
 const db=await worker.getD1Database('DB');for(const file of ['0000_aromatic_ultron.sql','0001_warm_firebrand.sql']){const sql=await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8');for(const statement of sql.split('--> statement-breakpoint'))await db.prepare(statement).run();}
 assert.equal((await worker.dispatchFetch('https://live.test/')).status,426);
 assert.equal((await worker.dispatchFetch('https://live.test/',{headers:{Upgrade:'websocket',Origin:'https://wrong.test'}})).status,403);
 const sockets=[];
 function call(socket,body){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Socket test timeout')),5000);function onMessage(event){const data=JSON.parse(event.data);if(data.requestId!==body.requestId)return;socket.removeEventListener('message',onMessage);clearTimeout(timer);resolve(data);}socket.addEventListener('message',onMessage);socket.send(JSON.stringify(body));});}
 for(let i=0;i<4;i++){const r=await worker.dispatchFetch('https://live.test/',{headers:{Upgrade:'websocket',Origin:'https://live.test'}});assert.equal(r.status,101);r.webSocket.accept();sockets.push(r.webSocket);}
 const sessions=['1','2','3','4'].map(s=>s.repeat(64));let r=await call(sockets[0],{requestId:1,session:sessions[0],action:'create',world:'sunscar',mode:'collector'});assert.equal(r.status,200);const code=r.room.code;
 for(let i=1;i<4;i++){r=await call(sockets[i],{requestId:1,session:sessions[i],code,action:'join'});assert.equal(r.status,200);}
 r=await call(sockets[0],{requestId:2,session:sessions[0],code,action:'start'});assert.equal(r.room.players.length,4);assert.equal(r.room.phase,'preparing');for(let i=0;i<4;i++)await call(sockets[i],{requestId:20,session:sessions[i],code,action:'loaded'});
 const frames=await Promise.all(sockets.map((socket,i)=>call(socket,{requestId:3,session:sessions[i],code,action:'state'})));assert.ok(frames.every(f=>f.status===200&&f.pilot===f.room.players[iFor(f)].id));function iFor(f){return f.room.players.findIndex(p=>p.id===f.pilot);}
 assert.equal(new Set(frames.map(f=>f.pilot)).size,4);for(const s of sockets)s.close();
 console.log('PASS: actual workerd WebSocket upgrade, origin enforcement, four persistent clients, authoritative membership, host start and independent pilot identity. No browser rendering.');
}finally{await worker.dispose();}
