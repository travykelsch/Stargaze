import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {sqliteD1} from './sqlite-d1.mjs';
import {passwordAuth,resolveIdentity,verifyPassword} from '../server/password-auth.mjs';
import {accounts} from '../server/accounts.mjs';
const sql=new DatabaseSync(':memory:');for(const f of (await readdir(new URL('../drizzle/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort())sql.exec(await readFile(new URL('../drizzle/'+f,import.meta.url),'utf8'));const db=sqliteD1(sql),origin='https://stargaze.test';
const pw='Test-only long passphrase 741',pw2='Replacement long passphrase 852';
function request(body,cookie='',extra={}){return new Request(origin+'/api/auth',{method:'POST',headers:{origin,'content-type':'application/json',cookie,...extra},body:JSON.stringify(body)});}
async function call(body,cookie='',extra={}){const r=await passwordAuth(request(body,cookie,extra),db);return {status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0],attributes:r.headers.get('set-cookie'),...await r.json()};}
async function me(cookie){const r=await accounts(new Request(origin+'/api/accounts',{headers:{cookie}}),db);return r.json();}
assert.equal((await call({action:'signup',username:'Pilot_One',password:pw,listed:false},'',{origin:'https://bad.test'})).status,403);
assert.equal((await call({action:'signup',username:'Pilot_One',password:'short',listed:false})).status,400);
let a=await call({action:'signup',username:'Pilot_One',password:pw,listed:false});assert.equal(a.status,201);assert.ok(a.recoveryCode);assert.match(a.attributes,/HttpOnly/);assert.match(a.attributes,/Secure/);assert.match(a.attributes,/SameSite=Lax/);assert.match(a.cookie,/^__Host-/);
const user=await me(a.cookie);assert.equal(user.authenticated,true);assert.equal(user.login.username,'Pilot_One');assert.equal(user.profile.listed,false);const record=sql.prepare('SELECT * FROM player_credentials').get();assert.ok(!JSON.stringify(record).includes(pw));assert.match(record.password_hash,/scrypt\$16384\$8\$5/);assert.ok(await verifyPassword(pw,record.password_hash));assert.ok(!await verifyPassword('incorrect password',record.password_hash));assert.ok(!JSON.stringify(sql.prepare('SELECT * FROM player_sessions').get()).includes(a.cookie.split('=')[1]));
assert.equal((await call({action:'signup',username:'pilot_one',password:pw,listed:false})).status,409);
const b=await call({action:'signup',username:'Pilot_Two',password:pw,listed:false});assert.notEqual((await me(b.cookie)).profile.id,user.profile.id);
assert.equal((await call({action:'login',username:'pilot_one',password:'incorrect password'})).status,401);const unknown=await call({action:'login',username:'no_such_pilot',password:'incorrect password'});assert.equal(unknown.status,401);assert.equal(unknown.error,'Username or password is incorrect');
const login=await call({action:'login',username:'PILOT_ONE',password:pw});assert.equal(login.status,200);assert.equal((await me(login.cookie)).profile.id,user.profile.id);
const logout=await call({action:'logout'},login.cookie);assert.equal((await me(login.cookie)).authenticated,false);assert.equal((await me(logout.cookie)).authenticated,false);assert.equal((await me('__Host-stargaze_session='+ 'f'.repeat(64))).authenticated,false);
assert.equal((await call({action:'recover',username:'Pilot_One',password:pw2,recoveryCode:'wrong'})).status,401);
const recovered=await call({action:'recover',username:'Pilot_One',password:pw2,recoveryCode:a.recoveryCode});assert.equal(recovered.status,200);assert.notEqual(recovered.recoveryCode,a.recoveryCode);assert.equal((await me(a.cookie)).authenticated,false);assert.equal((await me(recovered.cookie)).authenticated,true);
assert.equal((await call({action:'recover',username:'Pilot_One',password:pw,recoveryCode:a.recoveryCode})).status,401);
sql.exec('DELETE FROM player_auth_limits');assert.equal((await call({action:'login',username:'Pilot_One',password:pw})).status,401);assert.equal((await call({action:'login',username:'Pilot_One',password:pw2})).status,200);
assert.equal((await call({action:'change-password',username:'Pilot_One',currentPassword:'wrong',password:pw},recovered.cookie)).status,401);
const changed=await call({action:'change-password',username:'Pilot_One',currentPassword:pw2,password:pw},recovered.cookie);assert.equal(changed.status,200);assert.equal((await me(recovered.cookie)).authenticated,false);assert.equal((await me(changed.cookie)).authenticated,true);
// Changing a display name must not free the private login name; signup rolls back.
sql.prepare('UPDATE player_profiles SET name=?,name_key=? WHERE user_id=?').run('Different display','different display',record.user_id);const count=sql.prepare('SELECT COUNT(*) AS n FROM player_profiles').get().n;assert.equal((await call({action:'signup',username:'Pilot_One',password:pw,listed:false})).status,409);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM player_profiles').get().n,count);
// Preserve a native pilot's ID and records when it adds a password.
const native={'oai-authenticated-user-id':'existing-native-pilot','oai-authenticated-user-email':'private@example.test'};let r=await accounts(new Request(origin+'/api/accounts',{method:'POST',headers:{origin,'content-type':'application/json',...native},body:JSON.stringify({action:'profile',name:'Existing Pilot',listed:false})}),db);const old=(await r.json()).profile;
const upgrade=await call({action:'set-password',username:'Existing_Pilot',password:pw},'',native);assert.equal(upgrade.status,200);assert.equal((await me(upgrade.cookie)).profile.id,old.id);assert.equal(await resolveIdentity(new Request(origin,{headers:{cookie:upgrade.cookie}}),db),'existing-native-pilot');
// Expiry and attempt throttling fail closed.
sql.prepare('UPDATE player_sessions SET expires=0 WHERE user_id=?').run(record.user_id);assert.equal((await me(changed.cookie)).authenticated,false);sql.exec('DELETE FROM player_auth_limits');for(let i=0;i<12;i++)await call({action:'login',username:'NoSuchPilot',password:pw});assert.equal((await call({action:'login',username:'NoSuchPilot',password:pw})).status,429);
console.log('PASS: username-only registration, scrypt hashes, unique case-insensitive login names, atomic signup rollback, secure hashed sessions, invalid/expired cookies, logout, generic login failures, recovery rotation and replay rejection, password change revokes sessions, native pilot upgrade preserves ID, CSRF and throttling. No passwords or recovery codes logged.');sql.close();
