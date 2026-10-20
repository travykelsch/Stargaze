import assert from 'node:assert/strict';
import {newRoom,newPilot,applyAction,advance} from '../server/matches.mjs';
const room=newRoom('ABCDEF','owner','one',{},0);for(let i=1;i<4;i++)room.players.push(newPilot('p'+i,'owner'+i,{},0));applyAction(room,room.players[0],{action:'start'},0);
assert.equal(room.phase,'preparing');advance(room,10000);assert.equal(room.time,0);assert.ok(room.players.every(p=>p.z===0&&p.crashes===0));
for(let i=0;i<3;i++)applyAction(room,room.players[i],{action:'loaded'},10000);assert.equal(room.phase,'preparing');advance(room,15000);assert.equal(room.time,0);
applyAction(room,room.players[3],{action:'loaded'},15000);assert.equal(room.phase,'countdown');assert.equal(room.startAt,20000);assert.ok(room.players.every(p=>p.z===0&&p.crashes===0));
room.phase='results';for(const p of room.players)p.seen=21000;applyAction(room,room.players[0],{action:'start'},21000);assert.equal(room.phase,'preparing');assert.ok(room.players.every(p=>!p.loaded));applyAction(room,room.players[0],{action:'loaded'},21000);assert.equal(room.phase,'preparing');
console.log('PASS: slow device loading cannot advance course or cause crashes; every human must acknowledge its first submitted frame; rematches reset the barrier.');
