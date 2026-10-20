import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {sqliteD1} from './sqlite-d1.mjs';
import {multiplayer} from '../server/api.mjs';
const sql=new DatabaseSync(':memory:');for(const file of ['0000_aromatic_ultron.sql','0001_warm_firebrand.sql'])sql.exec(await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8'));const db=sqliteD1(sql);
const sessions=Array.from({length:5},(_,i)=>(i+1).toString().repeat(64));
async function call(i,action,data={}){const response=await multiplayer(new Request('https://stargaze.test/api/multiplayer',{method:'POST',body:JSON.stringify({session:sessions[i],action,...data})}),db);return {status:response.status,...await response.json()};}
try{
 for(let humans=1;humans<=4;humans++){
  const created=await call(0,'create',{world:'sunscar',difficulty:'hard',mode:'collector'}),code=created.room.code;
  for(let i=1;i<humans;i++)await call(i,'join',{code});
  if(humans>1)assert.equal((await call(1,'start',{code})).status,403);
  const started=await call(0,'start',{code});assert.equal(started.status,200);assert.equal(started.room.phase,'preparing');assert.equal(started.room.players.length,4);assert.equal(started.room.players.filter(p=>p.bot).length,4-humans);
  assert.ok(started.room.players.filter(p=>p.bot).every(p=>p.botDifficulty==='hard'&&!('botBrain'in p)&&!('owner'in p)));
  assert.equal((await call(4,'join',{code})).status,409);assert.equal((await call(0,'start',{code})).status,409);
  let row=sql.prepare('SELECT data FROM multiplayer_rooms WHERE code=?').get(code),room=JSON.parse(row.data);room.phase='results';room.winners=[room.players[0].id];room.players.forEach(p=>p.reward=10);sql.prepare('UPDATE multiplayer_rooms SET data=? WHERE code=?').run(JSON.stringify(room),code);
  if(humans<4){const joined=await call(humans,'join',{code});assert.equal(joined.status,200);assert.equal(joined.room.players.filter(p=>!p.bot).length,humans+1);}
  const next=await call(0,'start',{code});assert.equal(next.status,200);assert.equal(next.room.players.length,4);assert.equal(next.room.players.filter(p=>p.bot).length,4-Math.min(4,humans+1));assert.equal(next.room.round,2);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM multiplayer_grants').get().n,0,'bots never claim rewards or create grants');
  if(humans===2){await call(0,'leave',{code});const remaining=await call(1,'state',{code});assert.equal(remaining.room.host,remaining.pilot,'host transfers to a human, never AI');}
 }
 console.log('PASS: HTTP-handler rosters for 1/2/3/4 humans, host-only launch, no late joins, four-seat cap, difficulty labels, rematches, real friends replace bot seats between rounds, human host transfer, and no bot grants. SQLite D1 adapter.');
}finally{sql.close();}
