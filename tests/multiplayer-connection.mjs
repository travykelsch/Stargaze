import assert from 'node:assert/strict';
import {LiveConnection} from '../public/multiplayer-connection.mjs';
globalThis.location=new URL('https://stargaze.test/');
const sockets=[];
class Socket {
 constructor(url){this.url=url;this.readyState=0;this.sent=[];sockets.push(this);}
 open(){this.readyState=1;this.onopen?.();}
 send(raw){if(this.throwSend)throw new Error('send failed');this.sent.push(JSON.parse(raw));}
 reply(data={}){this.onmessage?.({data:JSON.stringify({requestId:this.sent.at(-1)?.requestId,status:200,...data})});}
 close(){this.readyState=3;this.onclose?.();}
}
globalThis.WebSocket=Socket;
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const c=new LiveConnection();
const first=c.call({action:'state'}),firstRejected=assert.rejects(first,/interrupted|closed/);await flush();const old=sockets.at(-1);old.open();await flush();assert.equal(old.sent.length,1);
const queued=c.call({action:'input'}),queuedRejected=assert.rejects(queued,/cancelled/);c.close();
const next=c.call({action:'join'});await flush();const current=sockets.at(-1);assert.notEqual(current,old);current.open();await flush();assert.equal(current.sent.length,1);
// Browser close/error/message events may arrive late, after a new socket opens.
old.onclose();old.onerror();old.reply({requestId:current.sent[0].requestId,error:'old response'});assert.equal(c.pending.size,1);current.reply({pilot:'mine'});assert.equal((await next).pilot,'mine');await firstRejected;await queuedRejected;
assert.equal(sockets.length,2,'cancelled queued calls cannot reopen a socket');
const failing=c.call({action:'input'}),failingRejected=assert.rejects(failing,/interrupted/);await flush();current.close();await failingRejected;
const recovered=c.call({action:'state'});await flush();const replacement=sockets.at(-1);replacement.open();await flush();current.onclose();replacement.reply({pilot:'same'});assert.equal((await recovered).pilot,'same');
replacement.throwSend=true;await assert.rejects(c.call({action:'input'}),/send failed/);assert.equal(c.pending.size,0,'send exceptions immediately release request timer');
const opening=c.call({action:'join'}),openingRejected=assert.rejects(opening,/closed/);await flush();const abandoned=sockets.at(-1);c.close();await openingRejected;abandoned.open();assert.equal(abandoned.readyState,3,'late open cannot resurrect a cancelled connection');
assert.equal(c.pending.size,0);assert.equal(c.socket,null);
console.log('PASS: stale socket close/error/replies cannot disrupt reconnection; leaving cancels queued requests; interrupted sockets reconnect; send failures and cancelled handshakes release timers.');
