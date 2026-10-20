// Sites dispatch supplies verified identity. Never accept an account ID from a body.
import {WORLDS,MODES,SHIPS,loadSave} from '../public/mechanics.mjs';
import {flightDistance} from '../public/progression.mjs';
const worlds=WORLDS.map(w=>w.id),difficulties=MODES.map(m=>m.id);
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function identity(request){const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');return id&&email?id:null;}
const publicProfile=p=>p?{id:p.public_id,name:p.name,listed:!!p.listed}:null;
export async function accountProfile(db,id){return id?db.prepare('SELECT public_id,name,listed FROM player_profiles WHERE user_id=?').bind(id).first():null;}
export function normalizeRecords(raw){const s=loadSave(JSON.stringify(raw||{})),records={};for(const w of worlds)for(const d of difficulties){const b=s.worldBests[w+':'+d];records[w+':'+d]={distance:Math.min(1e9,b.distance),score:Math.min(1e9,b.score)};}return records;}
async function stats(db,id){
 const solo=await db.prepare('SELECT COUNT(*) AS flights,COALESCE(SUM(duration),0) AS seconds,COALESCE(SUM(distance),0) AS distance,COALESCE(SUM(rings),0) AS rings,COALESCE(SUM(credits),0) AS credits,COALESCE(MAX(combo),0) AS combo,COALESCE(SUM(near_misses),0) AS nearMisses FROM player_solo_runs WHERE user_id=?').bind(id).first();
 const online=await db.prepare('SELECT COUNT(*) AS matches,COALESCE(SUM(won),0) AS wins,COALESCE(SUM(drawn),0) AS draws,COALESCE(SUM(rings),0) AS rings,COALESCE(SUM(credits),0) AS credits,COALESCE(SUM(ranked),0) AS rankedMatches FROM player_match_results WHERE user_id=?').bind(id).first();
 const saved=await db.prepare('SELECT data FROM player_imports WHERE user_id=?').bind(id).first();const records=normalizeRecords(saved?JSON.parse(saved.data):{});
 const best=await db.prepare('SELECT world,difficulty,MAX(distance) AS distance,MAX(credits) AS score FROM player_solo_runs WHERE user_id=? GROUP BY world,difficulty').bind(id).all();
 for(const row of best.results){const b=records[row.world+':'+row.difficulty];if(b){b.distance=Math.max(b.distance,row.distance);b.score=Math.max(b.score,row.score);}}
 const recent=await db.prepare('SELECT mode,world,difficulty,won,drawn,score,duration,ranked,created FROM player_match_results WHERE user_id=? ORDER BY created DESC,id DESC LIMIT 12').bind(id).all();
 return {solo,online,records,recent:recent.results,imported:!!saved};
}
async function board(db,id,url){
 const world=url.searchParams.get('world')||'all',difficulty=url.searchParams.get('difficulty')||'all',mode=url.searchParams.get('mode')||'all';
 if(!['all',...worlds].includes(world)||!['all',...difficulties].includes(difficulty)||!['all','race','collector','survival'].includes(mode))fail('Unknown leaderboard filter');
 const where=['r.ranked=1','p.listed=1'],args=[];for(const [col,val]of [['world',world],['difficulty',difficulty],['mode',mode]])if(val!=='all'){where.push('r.'+col+'=?');args.push(val);}
 const base=`WITH totals AS (SELECT p.user_id,p.public_id AS id,p.name,SUM(r.won) AS wins,COUNT(*) AS matches,SUM(r.rings) AS rings FROM player_match_results r JOIN player_profiles p ON p.user_id=r.user_id WHERE ${where.join(' AND ')} GROUP BY p.user_id), ranked AS (SELECT *,DENSE_RANK() OVER(ORDER BY wins DESC) AS rank FROM totals)`;
 const entries=await db.prepare(base+' SELECT id,name,wins,matches,rings,rank FROM ranked ORDER BY wins DESC,name COLLATE NOCASE,id LIMIT 50').bind(...args).all();
 const mine=id?await db.prepare(base+' SELECT id,name,wins,matches,rings,rank FROM ranked WHERE user_id=?').bind(...args,id).first():null;
 return {entries:entries.results,mine,world,difficulty,mode};
}
// Called only with completed authoritative simulation state, never client scores.
export async function recordMatch(db,room){
 if(room.phase!=='results'||!room.round)return;room=room.resultSnapshot||room;
 const accounts=new Set(room.players.map(p=>p.accountUser).filter(Boolean));
 const ranked=accounts.size>=2&&room.time>=10;
 for(const p of room.players){if(!p.accountUser)continue;
  const key=room.code+':'+room.created+':'+room.round+':'+p.id;
  const won=room.winners.includes(p.id)&&!p.disqualified&&!p.left;
  await db.prepare('INSERT OR IGNORE INTO player_match_results(id,user_id,world,difficulty,mode,won,drawn,ranked,score,rings,distance,duration,credits,crashes,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(key,p.accountUser,room.world,room.difficulty,room.mode,won&&room.winners.length===1?1:0,won&&room.winners.length>1?1:0,ranked?1:0,p.score,p.rings,Math.floor(p.z),p.finishAt??p.eliminatedAt??room.time,p.reward??0,p.crashes,Date.now()).run();
 }
}
export async function accounts(request,db){try{
 if(!db)return json({error:'Account storage unavailable'},503);db=db.withSession?db.withSession('first-primary'):db;
 const id=identity(request),url=new URL(request.url);
 if(request.method==='GET'){
  if(url.searchParams.get('view')==='leaderboard')return json(await board(db,id,url));
  if(!id)return json({authenticated:false,profile:null});
  const p=await accountProfile(db,id);return json({authenticated:true,profile:publicProfile(p),stats:p?await stats(db,id):null});
 }
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!id)fail('Sign in to save your pilot profile',401);
 if(request.headers.get('origin')!==url.origin||!request.headers.get('content-type')?.startsWith('application/json'))fail('Please submit from Stargaze',403);
 if(Number(request.headers.get('content-length')||0)>16000)fail('Request too large',413);
 const raw=await request.text();if(raw.length>16000)fail('Request too large',413);let b;try{b=JSON.parse(raw);}catch{fail('Invalid JSON');}if(!b||typeof b!=='object'||Array.isArray(b))fail('Invalid request');
 const now=Date.now(),p=await accountProfile(db,id);
 // Fixed-window, per-account write limit, independent of the multiplayer loop.
 await db.prepare('INSERT INTO player_limits(user_id,started,count) VALUES(?,?,1) ON CONFLICT(user_id) DO UPDATE SET count=CASE WHEN ?-started>=60000 THEN 1 ELSE count+1 END,started=CASE WHEN ?-started>=60000 THEN ? ELSE started END').bind(id,now,now,now,now).run();
 const rate=await db.prepare('SELECT count FROM player_limits WHERE user_id=?').bind(id).first();if(rate.count>120)fail('Too many updates. Please wait a minute.',429);
 if(b.action==='profile'){
  const name=String(b.name||'').trim().replace(/ +/g,' ');if(!/^[a-zA-Z0-9][a-zA-Z0-9 _-]{2,19}$/.test(name))fail('Use 3–20 letters, numbers, spaces, hyphens or underscores for your pilot name.');
  if(typeof b.listed!=='boolean')fail('Choose whether to appear on the leaderboard');
  try{await db.prepare('INSERT INTO player_profiles(user_id,public_id,name,name_key,listed,created,updated) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,name_key=excluded.name_key,listed=excluded.listed,updated=excluded.updated').bind(id,crypto.randomUUID(),name,name.toLowerCase(),b.listed?1:0,now,now).run();}catch(e){if(/unique/i.test(e.message))fail('That pilot name is already taken. Try another.',409);throw e;}
  return json({profile:publicProfile(await accountProfile(db,id))});
 }
 if(!p)fail('Create your pilot profile first',409);
 if(b.profile!==p.public_id)fail('Your signed-in account changed. Reload Stargaze before saving.',409);
 if(b.action==='import'){
  const data={version:2,worldBests:normalizeRecords(b.save)};
  const result=await db.prepare('INSERT OR IGNORE INTO player_imports(user_id,data,created) VALUES(?,?,?)').bind(id,JSON.stringify(data),now).run();return json({imported:!!result.meta.changes});
 }
 if(b.action==='solo'){
  if(typeof b.id!=='string'||!/^[a-f0-9-]{36}$/.test(b.id)||!worlds.includes(b.world)||!difficulties.includes(b.difficulty)||!SHIPS.some(s=>s.id===b.ship))fail('Invalid flight');
  for(const k of ['duration','distance','rings','credits','combo','nearMisses'])if(!Number.isFinite(b[k])||b[k]<0)fail('Invalid flight statistics');
  if(b.duration<.01||b.duration>86400||b.distance>flightDistance(b.duration+1,b.difficulty,b.world)+10||b.rings>b.distance/30+10||b.credits>b.rings*400+b.nearMisses*6+100||b.combo>b.rings||b.nearMisses>b.duration*100)fail('Flight statistics outside supported limits');
  await db.prepare('INSERT OR IGNORE INTO player_solo_runs(id,user_id,world,difficulty,ship,duration,distance,rings,credits,combo,near_misses,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id+':'+b.id,id,b.world,b.difficulty,b.ship,b.duration,Math.floor(b.distance),Math.floor(b.rings),Math.floor(b.credits),Math.floor(b.combo),Math.floor(b.nearMisses),now).run();return json({saved:true});
 }
 fail('Unknown account action');
 }catch(e){if(!e.status)console.error('accounts',e.message);return json({error:e.status?e.message:'Account service unavailable. Please retry.'},e.status||500);}}
