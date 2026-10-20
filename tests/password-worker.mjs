// Exercise the actual workerd runtime's crypto; no browser or preview server.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {Miniflare}=require('miniflare');
const worker=new Miniflare({modules:true,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],cf:false,script:`import {scrypt,timingSafeEqual} from 'node:crypto'; export default {async fetch(){const start=Date.now();const k=await new Promise((resolve,reject)=>scrypt('runtime-test-only-password','0123456789abcdef0123456789abcdef',32,{N:16384,r:8,p:5,maxmem:24*1024*1024},(e,k)=>e?reject(e):resolve(k)));return Response.json({bytes:k.length,equal:timingSafeEqual(k,k),milliseconds:Date.now()-start});}};`});
try{const r=await worker.dispatchFetch('https://runtime.test/');const data=await r.json();assert.equal(r.status,200);assert.equal(data.bytes,32);assert.equal(data.equal,true);console.log('PASS: scrypt N=16384 r=8 p=5 and timing-safe compare in actual workerd; '+data.milliseconds+'ms for one derivation (local server runtime, not a phone measurement).');}finally{await worker.dispose();}
