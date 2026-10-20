import {sqliteD1} from './sqlite-d1.mjs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {multiplayer} from '../server/api.mjs';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(await readFile(new URL('../drizzle/0000_aromatic_ultron.sql',import.meta.url),'utf8'));sqlite.exec(await readFile(new URL('../drizzle/0001_warm_firebrand.sql',import.meta.url),'utf8'));
const db=sqliteD1(sqlite);
let batches=0;const batch=db.batch.bind(db);db.batch=statements=>{batches++;return batch(statements);};
const server=createServer(async(req,res)=>{let body='';for await(const part of req)body+=part;const result=await multiplayer(new Request('http://127.0.0.1'+req.url,{method:req.method,headers:{'content-type':'application/json'},body}),db);res.writeHead(result.status,{'content-type':'application/json'});res.end(await result.text());});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const pilots=Array.from({length:5},()=>[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join(''));
async function call(i,action,data={}){const r=await fetch(origin+'/api/multiplayer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:pilots[i],action,...data})});return {status:r.status,...await r.json()};}
try{
 let a=await call(0,'create',{name:'One',world:'sunscar',mode:'collector'});assert.equal(a.status,200);const code=a.room.code;const joined=await Promise.all([1,2,3].map(i=>call(i,'join',{code,name:'Pilot '+i})));assert.ok(joined.every(r=>r.status===200));assert.equal((await call(4,'join',{code})).status,409);
 a=await call(0,'state',{code});assert.equal(a.room.players.length,4);assert.ok(a.room.players.every(p=>!('owner'in p)&&!('account'in p)));assert.equal((await call(4,'state',{code})).status,403);assert.equal((await call(1,'settings',{code,world:'easy'})).status,403);
 await Promise.all([0,1,2,3].map(i=>call(i,'ready',{code,ready:true})));a=await call(0,'state',{code});assert.equal(a.room.phase,'countdown');assert.equal(new Set(a.room.players.map(p=>p.id)).size,4);
 // Reconnect uses the same session and pilot ID rather than allocating a seat.
 const before=a.pilot;assert.equal((await call(0,'join',{code})).pilot,before);
 // A leased simulator never blocks other pilots from publishing inputs.
 await new Promise(r=>setTimeout(r,60));sqlite.prepare('UPDATE multiplayer_rooms SET lease=?,lease_until=? WHERE code=?').run('other-worker',Date.now()+10000,code);
 const priorBatches=batches,queued=await Promise.all([0,1,2,3].map(i=>call(i,'input',{code,seq:5,x:.2,y:0,evadeSeq:0})));assert.ok(queued.every(r=>r.status===200));assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM multiplayer_inputs WHERE code=?').get(code).n,4);assert.equal(batches-priorBatches,4,'one transactional exchange per non-simulating pilot');
 sqlite.prepare('UPDATE multiplayer_rooms SET lease=NULL,lease_until=0 WHERE code=?').run(code);const beforeSimulation=batches;await call(0,'state',{code});assert.equal(batches-beforeSimulation,2,'simulator publishes and commits with two database batches');const applied=JSON.parse(sqlite.prepare('SELECT data FROM multiplayer_rooms WHERE code=?').get(code).data);assert.ok(applied.players.every(p=>p.seq===5));
 // Mobile packets can arrive together despite having been sent apart. Coalesce
 // the burst without 429/reconnect loops; later input still gets acknowledged.
 const burst=await Promise.all(Array.from({length:6},(_,k)=>call(0,'input',{code,seq:6+k,x:.3,y:0,evadeSeq:0})));assert.ok(burst.every(r=>r.status===200));
 await new Promise(r=>setTimeout(r,60));const newest=await call(0,'input',{code,seq:20,x:-.3,y:0,evadeSeq:0});assert.equal(newest.status,200);assert.equal(newest.room.players.find(p=>p.id===before).seq,20);assert.ok(newest.room.revision>0);
 // Transactional result grants remain idempotent under parallel retries.
 let row=sqlite.prepare('SELECT data FROM multiplayer_rooms WHERE code=?').get(code),r=JSON.parse(row.data);r.phase='results';for(const p of r.players)p.reward=25;sqlite.prepare('UPDATE multiplayer_rooms SET data=? WHERE code=?').run(JSON.stringify(r),code);
 const grants=await Promise.all(Array.from({length:4},()=>call(0,'claim',{code})));assert.ok(grants.every(g=>g.status===200));assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM multiplayer_grants').get().n,1);assert.ok(grants.every(g=>g.grant.balance===25));
 // Malformed steering, wrong sessions, unauthorized actions, duplicate requests.
 await new Promise(r=>setTimeout(r,60));assert.equal((await call(0,'input',{code,seq:21,x:9,y:0})).status,400);assert.equal((await call(0,'state',{code:'XXXXXX'})).status,404);
 console.log('PASS: four independent HTTP clients, concurrent joins and ready, fifth-seat rejection, membership and host authorization, reconnect identity, atomic CAS updates, idempotent persistent reward grants. SQLite adapter; not hosted D1.');
}finally{server.close();sqlite.close();}
