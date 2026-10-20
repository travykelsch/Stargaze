import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {sqliteD1} from './sqlite-d1.mjs';
import {accounts,recordMatch} from '../server/accounts.mjs';
import {multiplayer} from '../server/api.mjs';
import {flightDistance} from '../public/progression.mjs';
const sql=new DatabaseSync(':memory:');for(const f of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())sql.exec(await readFile(new URL('../drizzle/'+f,import.meta.url),'utf8'));
const db=sqliteD1(sql),origin='https://stargaze.test';
const owners=['private-owner-A','private-owner-B','private-owner-C'];
function headers(i){return i===null?{}:{'oai-authenticated-user-id':owners[i],'oai-authenticated-user-email':'private'+i+'@example.test'};}
async function call(i,b=null,q='',extra={}){const r=await accounts(new Request(origin+'/api/accounts'+q,{method:b?'POST':'GET',headers:{...headers(i),...(b?{'content-type':'application/json',origin}:{}),...extra},...(b?{body:JSON.stringify(b)}:{})}),db);return {status:r.status,...await r.json()};}
const a=await call(null);assert.equal(a.authenticated,false);assert.equal((await call(null,{action:'profile',name:'Aaa',listed:true})).status,401);
assert.equal((await call(0,{action:'profile',name:'Pilot One',listed:true},'',{origin:'https://evil.test'})).status,403);
assert.equal((await call(0,{action:'profile',name:'<script>',listed:true})).status,400);
const p=(await call(0,{action:'profile',name:'Pilot One',listed:true})).profile;assert.ok(p.id);assert.equal((await call(1,{action:'profile',name:'pilot one',listed:true})).status,409);
const q=(await call(1,{action:'profile',name:'Pilot Two',listed:true})).profile;
const mine=await call(0);assert.equal(mine.stats.solo.flights,0);assert.equal((await call(1)).stats.solo.flights,0);
const run={action:'solo',profile:p.id,id:crypto.randomUUID(),world:'sunscar',difficulty:'hard',ship:'comet',duration:100,distance:flightDistance(100,'hard','sunscar'),rings:20,credits:400,combo:6,nearMisses:3};
assert.equal((await call(1,run)).status,409,'account switch cannot misattribute an offline queue');
assert.equal((await call(0,{...run,distance:1e12})).status,400);
assert.equal((await call(0,{...run,credits:1e12})).status,400);
await Promise.all([call(0,run),call(0,run)]);assert.equal((await call(0)).stats.solo.flights,1);assert.equal((await call(1)).stats.solo.flights,0);
assert.equal((await call(0,{...run,action:'award-win',wins:999})).status,400);
await call(0,{action:'import',profile:p.id,save:{version:2,worldBests:{'easy:easy':{distance:999,score:55}}}});
await call(0,{action:'import',profile:p.id,save:{version:2,worldBests:{'easy:easy':{distance:99999,score:999}}}});
assert.equal((await call(0)).stats.records['easy:easy'].distance,999,'guest import can only occur once');
const room={code:'ABCDEF',created:1,round:1,phase:'results',time:60,world:'sunscar',difficulty:'hard',mode:'survival',winners:['one'],players:[{id:'one',accountUser:owners[0],score:5,rings:3,z:2000,finishAt:null,eliminatedAt:null,reward:65,crashes:0},{id:'two',accountUser:owners[1],score:8,rings:4,z:1990,finishAt:null,eliminatedAt:59,reward:20,crashes:1}]};
await Promise.all([recordMatch(db,room),recordMatch(db,room)]);
assert.equal((await call(0)).stats.online.wins,1);assert.equal((await call(1)).stats.online.matches,1);
let b=await call(null,null,'?view=leaderboard');assert.equal(b.entries.length,2);assert.equal(b.entries[0].name,'Pilot One');assert.equal(b.entries[0].rank,1);assert.equal((await call(1,null,'?view=leaderboard')).mine.rank,2);
assert.ok(!JSON.stringify(b).includes('private-owner'));assert.ok(!JSON.stringify(b).includes('@example'));
assert.equal((await call(null,null,'?view=leaderboard&world=easy')).entries.length,0);assert.equal((await call(null,null,'?view=leaderboard&mode=collector')).entries.length,0);assert.equal((await call(null,null,'?view=leaderboard&world=oops')).status,400);
await call(0,{action:'profile',name:'Pilot One',listed:false});b=await call(null,null,'?view=leaderboard');assert.equal(b.entries.length,1);assert.equal((await call(0)).stats.online.wins,1);assert.equal((await call(0,null,'?view=leaderboard')).mine,null);
await recordMatch(db,{...room,round:2,winners:['one','two']});assert.equal((await call(1)).stats.online.draws,1);assert.equal((await call(1)).stats.online.wins,0);
await recordMatch(db,{...room,round:3,time:4});assert.equal((await call(0)).stats.online.rankedMatches,2,'very short games are unranked');
await recordMatch(db,{...room,round:4,players:[room.players[0],{...room.players[1],accountUser:null}]});assert.equal((await call(0)).stats.online.rankedMatches,2,'guest-only opponents cannot generate ranked wins');
// Exercise the real multiplayer API identity binding and automatic results path.
const sessions=[crypto.randomUUID().replaceAll('-','').repeat(2),crypto.randomUUID().replaceAll('-','').repeat(2)];
async function mp(i,action,body={}){const r=await multiplayer(new Request(origin+'/api/multiplayer',{method:'POST',headers:{...headers(i),'content-type':'application/json',origin},body:JSON.stringify({session:sessions[i],action,...body})}),db);return {status:r.status,...await r.json()};}
let r=await mp(0,'create',{name:'Fake name',world:'easy',mode:'collector'});assert.equal(r.room.players[0].name,'Pilot One');const code=r.room.code;await mp(1,'join',{code});
const stored=sql.prepare('SELECT data FROM multiplayer_rooms WHERE code=?').get(code),live=JSON.parse(stored.data);live.round=1;live.phase='results';live.time=120;live.winners=[live.players[0].id];for(const p of live.players)p.reward=25;sql.prepare('UPDATE multiplayer_rooms SET data=? WHERE code=?').run(JSON.stringify(live),code);
r=await mp(0,'state',{code});assert.equal(r.status,200);assert.ok(!JSON.stringify(r.room).includes('private-owner'));await mp(0,'claim',{code});await mp(0,'claim',{code});assert.equal((await call(0)).stats.online.matches,5,'result recorded automatically once even across duplicate claims');
const spoof=await multiplayer(new Request(origin+'/api/multiplayer',{method:'POST',headers:{...headers(1),'content-type':'application/json',origin},body:JSON.stringify({session:sessions[0],action:'state',code})}),db);assert.equal(spoof.status,401);
// One account cannot compete against itself in multiple seats.
const duplicate=await multiplayer(new Request(origin+'/api/multiplayer',{method:'POST',headers:{...headers(0),'content-type':'application/json',origin},body:JSON.stringify({session:'a'.repeat(64),action:'join',code})}),db);assert.equal(duplicate.status,409);
sql.prepare('UPDATE player_limits SET count=120,started=? WHERE user_id=?').run(Date.now(),owners[0]);assert.equal((await call(0,{action:'profile',name:'Pilot One',listed:true})).status,429);
console.log('PASS: verified identity requirement, account isolation, CSRF and name checks, unique aliases, idempotent solo and match writes, import once, cloud records, opt-out privacy, filters and own rank, no email/owner leaks, client cannot award wins, draws/short/guest matches, real MP auto-recording and membership binding, write rate limits.');sql.close();
