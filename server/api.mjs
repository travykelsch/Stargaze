import {identity,accountProfile,recordMatch} from './accounts.mjs';
import {newRoom,newPilot,applyAction,advance,publicRoom,fail} from './matches.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
const random=n=>Array.from(crypto.getRandomValues(new Uint8Array(n))).map(x=>x.toString(16).padStart(2,'0')).join('');
// Inputs have their own rows. One leased update advances a room while other
// pilots publish inputs and read snapshots, avoiding four competing physics runs.
async function saveStats(db,room){if(room.phase==='results'&&!room.statsRecorded){await recordMatch(db,room);room.statsRecorded=true;}}
async function exchange(db,room,p,b,now){
 const key=room.code+':'+room.round+':'+p.id,packet=b.action==='input';
 let inputWrite;
 if(packet){if(b.round!==undefined&&b.round!==room.round)fail('Round changed; synchronizing',409);applyAction({...room},structuredClone(p),b,now);inputWrite=db.prepare('INSERT INTO multiplayer_inputs(key,code,pilot,seen,input_at,seq,data) VALUES(?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET seen=excluded.seen, input_at=CASE WHEN excluded.seq>seq THEN excluded.input_at ELSE input_at END, seq=MAX(seq,excluded.seq), data=CASE WHEN excluded.seq>seq THEN excluded.data ELSE data END WHERE excluded.seen-seen>=45').bind(key,room.code,p.id,now,now,b.seq,JSON.stringify({action:'input',seq:b.seq,x:b.x,y:b.y,evadeSeq:b.evadeSeq,evade:b.evade}));
 }else inputWrite=db.prepare("INSERT INTO multiplayer_inputs(key,code,pilot,seen,input_at,seq,data) VALUES(?,?,?,?,0,-1,'{}') ON CONFLICT(key) DO UPDATE SET seen=excluded.seen").bind(key,room.code,p.id,now);
 // D1 batch is transactional: input publication, lease acquisition and the
 // corresponding snapshot read take one database round trip, not four.
 const lease=random(16),[,locked,observed,packets]=await db.batch([inputWrite,
  db.prepare('UPDATE multiplayer_rooms SET lease=?,lease_until=? WHERE code=? AND lease_until<?').bind(lease,now+10000,room.code,now),
  db.prepare('SELECT revision,data FROM multiplayer_rooms WHERE code=?').bind(room.code),
  db.prepare('SELECT pilot,seen,input_at,seq,data FROM multiplayer_inputs WHERE code=? AND key LIKE ?').bind(room.code,room.code+':'+room.round+':%')]);
 const row=observed.results[0];if(!row)return room;room=JSON.parse(row.data);
 if(!locked.meta.changes)return room;
 let released=false;try{
  for(const input of packets.results){const pilot=room.players.find(x=>x.id===input.pilot);if(pilot)pilot.seen=Math.max(pilot.seen,input.seen);}
  advance(room,now);
  for(const input of packets.results){const pilot=room.players.find(x=>x.id===input.pilot);if(!pilot||input.seq<=pilot.seq)continue;const data=JSON.parse(input.data);applyAction(room,pilot,data,input.input_at);pilot.seen=Math.max(pilot.seen,input.seen);}
  room.revision=row.revision+1;const [persisted]=await db.batch([
   db.prepare('UPDATE multiplayer_rooms SET data=?,revision=revision+1,updated=? WHERE code=? AND revision=? AND lease=?').bind(JSON.stringify(room),now,room.code,row.revision,lease),
   db.prepare('UPDATE multiplayer_rooms SET lease=NULL,lease_until=0 WHERE code=? AND lease=?').bind(room.code,lease)]);released=true;
  if(persisted.meta.changes){await saveStats(db,room);return room;}
 }finally{if(!released)await db.prepare('UPDATE multiplayer_rooms SET lease=NULL,lease_until=0 WHERE code=? AND lease=?').bind(room.code,lease).run();}
 const latest=await db.prepare('SELECT data FROM multiplayer_rooms WHERE code=?').bind(room.code).first();return latest?JSON.parse(latest.data):room;
}
export async function multiplayer(request,db){try{
 if(request.method!=='POST')return json({error:'POST required'},405);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)fail('Wrong origin',403);
 if(Number(request.headers.get('content-length')||0)>4096)fail('Message too large',413);
 const raw=await request.text();if(raw.length>4096)fail('Message too large',413);let b;try{b=JSON.parse(raw);}catch{fail('Invalid JSON');}
 if(!b||Array.isArray(b)||typeof b!=='object')fail('Invalid message');
 if(typeof b.session!=='string'||!/^[a-f0-9]{64}$/.test(b.session))fail('A valid pilot session is required',401);
 const owner=await hash(b.session),id=owner.slice(0,16),accountUser=await identity(request,db),account=accountUser||owner,now=Date.now();
 if(!db)return json({error:'Multiplayer storage unavailable'},503);db=db.withSession?db.withSession('first-primary'):db;
 if(b.action==='create'){
  const limit=await db.prepare('SELECT created, count FROM multiplayer_limits WHERE owner = ?').bind(account).first();if(limit&&now-limit.created<60000&&limit.count>=5)fail('Please wait before creating another room',429);
  await db.prepare('INSERT INTO multiplayer_limits(owner,created,count) VALUES(?,?,1) ON CONFLICT(owner) DO UPDATE SET created = CASE WHEN ? - created >= 60000 THEN ? ELSE created END, count = CASE WHEN ? - created >= 60000 THEN 1 ELSE count+1 END').bind(account,now,now,now,now).run();
  await db.prepare('DELETE FROM multiplayer_inputs WHERE code NOT IN (SELECT code FROM multiplayer_rooms)').run();
  await db.prepare('DELETE FROM multiplayer_rooms WHERE code IN (SELECT code FROM multiplayer_rooms WHERE updated < ? LIMIT 10)').bind(now-2*60*60*1000).run();
  const bytes=crypto.getRandomValues(new Uint8Array(6)),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=[...bytes].map(x=>alphabet[x%alphabet.length]).join('');const room=newRoom(code,owner,id,b,now);room.players[0].account=account;room.players[0].accountUser=accountUser;if(accountUser){const profile=await accountProfile(db,accountUser);if(profile)room.players[0].name=profile.name;}
  await db.prepare('INSERT INTO multiplayer_rooms(code,revision,updated,data) VALUES(?,0,?,?)').bind(code,now,JSON.stringify(room)).run();return json({pilot:id,room:publicRoom(room,id,now)});
 }
 const code=String(b.code||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))fail('Enter a six-character room code');
 for(let retry=0;retry<5;retry++){
  const row=await db.prepare('SELECT revision,data,updated FROM multiplayer_rooms WHERE code = ?').bind(code).first();if(!row||now-row.updated>2*60*60*1000)fail('Room not found or expired',404);const room=JSON.parse(row.data);let p=room.players.find(x=>x.owner===owner);
  if(!p){if(b.action!=='join')fail('Join this room first',403);if(!['lobby','results'].includes(room.phase))fail('This match has started. Join the next round.',409);room.players=room.players.filter(x=>!x.bot);if(room.players.length>=4)fail('Room is full',409);if(accountUser&&room.players.some(x=>x.accountUser===accountUser&&!x.left))fail('This account is already in the room in another tab',409);p=newPilot(id,owner,b,now);p.account=account;p.accountUser=accountUser;if(accountUser){const profile=await accountProfile(db,accountUser);if(profile)p.name=profile.name;}room.players.push(p);}
  if((p.accountUser||null)!==accountUser)fail('Your sign-in changed. Join a new room.',401);
  await saveStats(db,room);
  if(p.left)fail('You left this match. Join a new room.',409);
  if(['preparing','countdown','playing'].includes(room.phase)&&['input','state','join'].includes(b.action)){const shared=await exchange(db,room,p,b,now);return json({pilot:id,room:publicRoom(shared,id,now)});}
  // Bursty mobile delivery is coalesced, not treated as a lost connection.
  if(now-(p.requestAt||0)<45&&b.action==='input')return json({pilot:id,room:publicRoom(room,id,now)});
  advance(room,now);const completed=room.phase==='results'&&!room.statsRecorded?structuredClone(room):null;p.requestAt=now;applyAction(room,p,b,now);
  if(!room.players.some(x=>x.id===room.host&&!x.bot&&!x.left&&now-x.seen<12000))room.host=room.players.find(x=>!x.bot&&!x.left&&now-x.seen<12000)?.id||room.players.find(x=>!x.bot&&!x.left)?.id||null;
  if(room.phase==='lobby')room.players=room.players.filter(x=>now-x.seen<120000);
  room.revision=row.revision+1;const result=await db.prepare('UPDATE multiplayer_rooms SET data = ?, revision = revision+1, updated = ? WHERE code = ? AND revision = ?').bind(JSON.stringify(room),now,code,row.revision).run();if(!result.meta.changes)continue;
  if(completed)await saveStats(db,completed);
  let grant=null;
  if(b.action==='claim'&&room.phase==='results'&&p.reward!==undefined){const grantId=code+':'+room.created+':'+room.round+':'+p.id;await db.prepare('INSERT OR IGNORE INTO multiplayer_grants(id,owner,amount,created) VALUES(?,?,?,?)').bind(grantId,p.account||account,p.reward,now).run();const bank=await db.prepare('SELECT COALESCE(SUM(amount),0) AS balance FROM multiplayer_grants WHERE owner = ?').bind(p.account||account).first();grant={id:grantId,amount:p.reward,balance:bank.balance};}
  return json({pilot:id,room:publicRoom(room,id,now),grant});
 }
 return json({error:'Room is busy; reconnecting.'},409);
 }catch(e){console.error('multiplayer',e.message);return json({error:e.status?e.message:'Multiplayer service error. Please retry.'},e.status||500);}}
