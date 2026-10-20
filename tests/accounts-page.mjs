// Real account page controller + API, using a minimal DOM and SQLite adapter.
// Checks behavior and data wiring, not rendered appearance or browser OAuth.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {accounts} from '../server/accounts.mjs';
import {sqliteD1} from './sqlite-d1.mjs';
const sql=new DatabaseSync(':memory:');for(const f of (await readdir(new URL('../drizzle/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort())sql.exec(await readFile(new URL('../drizzle/'+f,import.meta.url),'utf8'));
const nodes=new Map(),events={};class Node{constructor(){this.textContent='';this.value='';this.checked=false;this.classList={toggle(){}};}setAttribute(){}set innerHTML(html){this.html=html;for(const match of html.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){const n=new Node();n.value=match[0].match(/value="([^"]*)"/)?.[1]||'';n.checked=/\schecked/.test(match[0]);nodes.set(match[1],n);}}get innerHTML(){return this.html||'';}}
for(const id of ['accountContent','accountMessage','profileTab','leaderboardTab'])nodes.set(id,new Node());globalThis.document={getElementById:id=>nodes.get(id)};globalThis.window={addEventListener:(e,fn)=>events[e]=fn};globalThis.location=new URL('https://stargaze.test/account.html');globalThis.localStorage={getItem(){return null}};
let signedIn=false;const db=sqliteD1(sql);
globalThis.fetch=async(url,opts)=>accounts(new Request(new URL(url,location.origin),{method:opts.method,headers:{...opts.headers,...(opts.method==='POST'?{origin:location.origin}:{}),...(signedIn?{'oai-authenticated-user-id':'private-identity','oai-authenticated-user-email':'hidden@example.test'}:{})},...(opts.body?{body:opts.body}:{})}),db);
async function until(check){for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,5));}throw Error('Timed out: '+nodes.get('accountMessage').textContent);}
await import('../public/account-page.mjs');await until(()=>nodes.get('accountContent').innerHTML.includes('Sign in with ChatGPT'));assert.match(nodes.get('accountContent').innerHTML,/signin-with-chatgpt\?return_to=%2Faccount.html" target="_top"/);
signedIn=true;events.hashchange();await until(()=>nodes.has('pilotForm'));nodes.get('pilotName').value='UI Pilot';nodes.get('pilotListed').checked=true;await nodes.get('pilotForm').onsubmit({preventDefault(){}});assert.match(nodes.get('accountContent').innerHTML,/Every run counts/);assert.match(nodes.get('accountContent').innerHTML,/UI Pilot/);assert.ok(!nodes.get('accountContent').innerHTML.includes('hidden@example.test'));
location.hash='#leaderboard';events.hashchange();await until(()=>nodes.get('boardRows')?.innerHTML.includes('first legends'));assert.match(nodes.get('myStanding').textContent,/No ranked results/);nodes.get('boardWorld').value='sunscar';await nodes.get('boardWorld').onchange();assert.equal(nodes.get('accountMessage').textContent,'');
signedIn=false;location.hash='#profile';events.hashchange();await until(()=>nodes.get('accountContent').innerHTML.includes('Sign in with ChatGPT'));assert.ok(!nodes.get('accountContent').innerHTML.includes('UI Pilot'));
console.log('PASS: native top-level sign-in anchor, onboarding form and real API persistence, private stats display without email exposure, leaderboard and filters, sign-out view clears previous pilot. DOM harness, not rendered/browser identity verification.');sql.close();
