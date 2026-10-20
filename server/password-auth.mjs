import {scrypt,timingSafeEqual,randomBytes,createHash} from 'node:crypto';
const COOKIE='__Host-stargaze_session',LIFETIME=30*86400000;
const json=(value,status=200,cookie=null)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff',...(cookie?{'Set-Cookie':cookie}:{})}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const digest=s=>createHash('sha256').update(s).digest('hex');
const cookie=token=>`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${LIFETIME/1000}`;
function tokenFrom(request){const matches=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));return matches.length===1?matches[0].slice(COOKIE.length+1):matches.length?'invalid':null;}
export function nativeIdentity(request){const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');return id&&email?id:null;}
export async function resolveIdentity(request,db){
 const token=tokenFrom(request);if(token===null)return nativeIdentity(request);
 if(!/^[a-f0-9]{64}$/.test(token)||!db)return null;
 const s=await db.prepare('SELECT s.user_id FROM player_sessions s JOIN player_credentials c ON c.user_id=s.user_id WHERE s.token_hash=? AND s.expires>? AND s.password_version=c.version').bind(digest(token),Date.now()).first();return s?.user_id||null;
}
let hashing=0;
export async function hashPassword(password,salt=randomBytes(16).toString('hex')){
 // OWASP scrypt alternative: N=2^14, r=8, p=5 (~16 MiB). Keep concurrent
 // expensive work bounded in the 128 MiB Worker, alongside game geometry.
 if(hashing>=2)fail('Sign-in is busy. Please try again in a moment.',429);hashing++;
 try{const key=await new Promise((resolve,reject)=>scrypt(password,salt,32,{N:16384,r:8,p:5,maxmem:24*1024*1024},(error,key)=>error?reject(error):resolve(key)));return `scrypt$16384$8$5$${salt}$${key.toString('hex')}`;}finally{hashing--;}
}
export async function verifyPassword(password,encoded){const parts=String(encoded||'').split('$');const valid=parts.length===6&&parts[0]==='scrypt'&&parts[1]==='16384'&&parts[2]==='8'&&parts[3]==='5'&&/^[a-f0-9]{32}$/.test(parts[4])&&/^[a-f0-9]{64}$/.test(parts[5]);const actual=await hashPassword(password,valid?parts[4]:'0'.repeat(32));const expected=Buffer.from(valid?parts[5]:'0'.repeat(64),'hex');return timingSafeEqual(Buffer.from(actual.split('$')[5],'hex'),expected)&&valid;}
const username=s=>String(s||'').trim();
function checkUsername(s){if(!/^[A-Za-z0-9][A-Za-z0-9_-]{2,19}$/.test(s))fail('Choose a username with 3–20 letters, numbers, hyphens or underscores.');}
function checkPassword(s){if(typeof s!=='string'||s.length<12||s.length>128||Buffer.byteLength(s)>512)fail('Use a password or passphrase with 12–128 characters.');}
async function limit(db,key,max,window=900000){const now=Date.now();await db.prepare('INSERT INTO player_auth_limits(key,started,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN ?-started>=? THEN 1 ELSE count+1 END,started=CASE WHEN ?-started>=? THEN ? ELSE started END').bind(digest(key),now,now,window,now,window,now).run();const row=await db.prepare('SELECT count FROM player_auth_limits WHERE key=?').bind(digest(key)).first();if(row.count>max)fail('Too many attempts. Wait 15 minutes before trying again.',429);}
const newRecovery=()=>randomBytes(16).toString('hex').match(/.{8}/g).join('-');
const recoveryHash=(id,code)=>digest('stargaze-recovery:'+id+':'+String(code).toLowerCase().replace(/[- ]/g,''));
function recoveryValid(id,code,expected){const a=Buffer.from(recoveryHash(id,code),'hex'),b=Buffer.from(expected||'0'.repeat(64),'hex');return b.length===a.length&&timingSafeEqual(a,b);}
function session(id,version){const token=randomBytes(32).toString('hex'),now=Date.now();return {token,statement:db=>db.prepare('INSERT INTO player_sessions(token_hash,user_id,password_version,created,expires) VALUES(?,?,?,?,?)').bind(digest(token),id,version,now,now+LIFETIME)};}
export async function passwordAuth(request,storage){try{
 if(!storage)return json({error:'Account storage unavailable'},503);const db=storage.withSession?storage.withSession('first-primary'):storage;
 if(request.method!=='POST')return json({error:'POST required'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin||!request.headers.get('content-type')?.startsWith('application/json'))fail('Submit this form from Stargaze',403);
 if(Number(request.headers.get('content-length')||0)>4096)fail('Request too large',413);const raw=await request.text();if(raw.length>4096)fail('Request too large',413);let body;try{body=JSON.parse(raw);}catch{fail('Invalid request');}if(!body||Array.isArray(body)||typeof body!=='object')fail('Invalid request');
 const action=body.action;
 if(action==='logout'){const token=tokenFrom(request);if(token&&/^[a-f0-9]{64}$/.test(token))await db.prepare('DELETE FROM player_sessions WHERE token_hash=?').bind(digest(token)).run();return json({signedOut:true},200,cookie('logged-out'));}
 if(!['signup','login','recover','set-password','change-password'].includes(action))fail('Unknown sign-in action');
 const name=username(body.username),key=name.toLowerCase(),now=Date.now();checkUsername(name);
 const ip=request.headers.get('cf-connecting-ip');await limit(db,'auth-ip:'+(ip||'shared-unknown'),ip?60:180);await limit(db,'auth-name:'+key,12);
 if(action!=='login')checkPassword(body.password);else if(typeof body.password!=='string'||body.password.length>128||Buffer.byteLength(body.password)>512)fail('Username or password is incorrect',401);
 await db.prepare('DELETE FROM player_sessions WHERE token_hash IN (SELECT token_hash FROM player_sessions WHERE expires<? LIMIT 40)').bind(now).run();await db.prepare('DELETE FROM player_auth_limits WHERE key IN (SELECT key FROM player_auth_limits WHERE started<? LIMIT 40)').bind(now-86400000).run();
 if(action==='signup'){
  if(typeof body.listed!=='boolean')fail('Choose whether to appear on the leaderboard');
  await limit(db,'signup-ip:'+(ip||'shared-unknown'),ip?10:100,3600000);
  const id='pilot:'+crypto.randomUUID(),publicId=crypto.randomUUID(),password=await hashPassword(body.password),recovery=newRecovery(),s=session(id,1);
  try{await db.batch([db.prepare('INSERT INTO player_profiles(user_id,public_id,name,name_key,listed,created,updated) VALUES(?,?,?,?,?,?,?)').bind(id,publicId,name,key,body.listed?1:0,now,now),db.prepare('INSERT INTO player_credentials(user_id,username,username_key,password_hash,recovery_hash,version,created) VALUES(?,?,?,?,?,1,?)').bind(id,name,key,password,recoveryHash(id,recovery),now),s.statement(db)]);}catch(e){if(/unique/i.test(e.message))fail('That username is unavailable. Choose another.',409);throw e;}
  return json({signedIn:true,recoveryCode:recovery,username:name},201,cookie(s.token));
 }
 if(action==='login'){
  const c=await db.prepare('SELECT user_id,username,password_hash,version FROM player_credentials WHERE username_key=?').bind(key).first();if(!await verifyPassword(body.password,c?.password_hash)||!c)fail('Username or password is incorrect',401);
  const s=session(c.user_id,c.version);await s.statement(db).run();await db.prepare('DELETE FROM player_sessions WHERE user_id=? AND token_hash NOT IN (SELECT token_hash FROM player_sessions WHERE user_id=? ORDER BY created DESC,token_hash DESC LIMIT 8)').bind(c.user_id,c.user_id).run();
  return json({signedIn:true,username:c.username},200,cookie(s.token));
 }
 let c,id;
 if(action==='recover'){
  if(typeof body.recoveryCode!=='string'||body.recoveryCode.length>80)fail('Username or recovery code is incorrect',401);
  c=await db.prepare('SELECT user_id,username,recovery_hash,version FROM player_credentials WHERE username_key=?').bind(key).first();if(!recoveryValid(c?.user_id||'missing',body.recoveryCode,c?.recovery_hash)||!c)fail('Username or recovery code is incorrect',401);id=c.user_id;
 }else{
  id=await resolveIdentity(request,db);if(!id)fail('Sign in before changing your password',401);
  c=await db.prepare('SELECT user_id,username,password_hash,version FROM player_credentials WHERE user_id=?').bind(id).first();
  if(action==='set-password'&&c)fail('This pilot already has a password. Use Change password.',409);
  if(action==='change-password'&&(!c||c.username.toLowerCase()!==key||typeof body.currentPassword!=='string'||body.currentPassword.length>128||!await verifyPassword(body.currentPassword,c.password_hash)))fail('Current password is incorrect',401);
  if(!await db.prepare('SELECT user_id FROM player_profiles WHERE user_id=?').bind(id).first())fail('Create your pilot profile first',409);
 }
 const version=(c?.version||0)+1,password=await hashPassword(body.password),recovery=newRecovery(),s=session(id,version);
 // A version-checked write prevents two concurrent recovery/password requests
 // from both succeeding with the same old credential. Sessions share the version.
 if(c){const changed=await db.prepare('UPDATE player_credentials SET password_hash=?,recovery_hash=?,version=? WHERE user_id=? AND version=?').bind(password,recoveryHash(id,recovery),version,id,c.version).run();if(!changed.meta.changes)fail('Credentials changed. Sign in again.',409);}
 else{try{await db.prepare('INSERT INTO player_credentials(user_id,username,username_key,password_hash,recovery_hash,version,created) VALUES(?,?,?,?,?,?,?)').bind(id,name,key,password,recoveryHash(id,recovery),version,now).run();}catch(e){if(/unique/i.test(e.message))fail('That username is unavailable.',409);throw e;}}
 await db.batch([db.prepare('DELETE FROM player_sessions WHERE user_id=?').bind(id),s.statement(db)]);
 return json({signedIn:true,username:c?.username||name,recoveryCode:recovery},200,cookie(s.token));
 }catch(e){if(!e.status)console.error('password-auth service failure');return json({error:e.status?e.message:'Sign-in service unavailable. Please retry.'},e.status||500);}}
