import assert from 'node:assert/strict';
import {newRoom,newPilot,applyAction,advance} from '../server/matches.mjs';
const room=newRoom('ABCDEF','owner','one',{},0);for(let i=1;i<4;i++)room.players.push(newPilot('p'+i,'owner'+i,{},0));applyAction(room,room.players[0],{action:'start'},0);
assert.equal(room.phase,'preparing');advance(room,10000);assert.equal(room.time,0);assert.ok(room.players.every(p=>p.z===0&&p.crashes===0));
for(let i=0;i<3;i++)applyAction(room,room.players[i],{action:'loaded'},10000);assert.equal(room.phase,'preparing');advance(room,15000);assert.equal(room.time,0);
applyAction(room,room.players[3],{action:'loaded'},15000);assert.equal(room.phase,'countdown');assert.equal(room.startAt,20000);assert.ok(room.players.every(p=>p.z===0&&p.crashes===0));
room.phase='results';for(const p of room.players)p.seen=21000;applyAction(room,room.players[0],{action:'start'},21000);assert.equal(room.phase,'preparing');assert.ok(room.players.every(p=>!p.loaded));applyAction(room,room.players[0],{action:'loaded'},21000);assert.equal(room.phase,'preparing');
console.log('PASS: slow device loading cannot advance course or cause crashes; every human must acknowledge its first submitted frame; rematches reset the barrier.');
const second=room.round;assert.throws(()=>applyAction(room,room.players[1],{action:'cancelLaunch',round:second},22000),/Only the room host/);
applyAction(room,room.players[0],{action:'cancelLaunch',round:second},22000);assert.equal(room.phase,'lobby');assert.equal(room.players.length,4);assert.ok(room.players.every(p=>!p.loaded&&p.z===0));assert.equal(room.resultSnapshot,null);
applyAction(room,room.players[0],{action:'start'},23000);assert.throws(()=>applyAction(room,room.players[0],{action:'loaded',round:second},23000),/Round changed/);assert.equal(room.players[0].loaded,false);
for(const p of room.players)applyAction(room,p,{action:'loaded',round:room.round},24000);assert.equal(room.phase,'countdown');applyAction(room,room.players[0],{action:'cancelLaunch',round:room.round},24500);assert.equal(room.phase,'lobby');
// A departing pilot cancels safely, rather than launching three or blocking forever.
applyAction(room,room.players[0],{action:'start'},25000);applyAction(room,room.players[1],{action:'leave'},26000);assert.equal(room.phase,'lobby');assert.equal(room.players.length,3);applyAction(room,room.players[0],{action:'start'},27000);assert.equal(room.players.length,4);assert.equal(room.players.filter(p=>p.bot).length,1);
const host=room.players[0];room.players[1].seen=40000;advance(room,40000);assert.notEqual(room.host,host.id,'connected pilot inherits launch controls');
room.players[1].seen=87000;advance(room,87000);assert.equal(room.phase,'lobby');assert.match(room.launchNotice,/timed out/);assert.equal(room.time,0);assert.ok(room.players.every(p=>!p.bot&&!p.loaded&&p.crashes===0&&p.fuel===24));assert.equal(room.resultSnapshot,null);
console.log('PASS: host-only cancellation, stale-round loading rejection, countdown cancellation, departure recovery with bot refill, host transfer, and bounded 60-second loading timeout without deaths or rewards.');
