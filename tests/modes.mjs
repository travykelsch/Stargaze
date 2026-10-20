import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODES,LIMITS,difficulty,makeSector,safeRoute,warningDistance,loadSave} from '../public/mechanics.mjs';
const baseline=JSON.parse(readFileSync(new URL('fixtures/easy-baseline.json',import.meta.url)));
for(const row of baseline.difficulty){for(const key of ['density','motion','spin','drain','corridor'])assert.equal(difficulty(row.t,'easy')[key],row.value[key]);for(const mode of ['medium','hard']){const d=difficulty(row.t,mode);for(const key of ['drain','ringScale','corridor'])assert.equal(d[key],difficulty(row.t,'easy')[key]);}}
const totals={easy:0,medium:0,hard:0};let checked=0;
for(let seed=1;seed<=100;seed++)for(const m of MODES){const sector=makeSector(5,60,seed,m.id);totals[m.id]+=sector.asteroids.length;assert.equal(loadSave(JSON.stringify({mode:m.id})).mode,m.id);for(let z=950;z<1140;z+=2){const a=safeRoute(z,seed,m.id),b=safeRoute(z+.01,seed,m.id),maxSpeed=120*m.speed;assert.ok(Math.abs(b.x-a.x)/.01*maxSpeed<LIMITS.steerX);assert.ok(Math.abs(b.y-a.y)/.01*maxSpeed<LIMITS.steerY);checked++;}
if(m.id==='hard'){for(const a of sector.asteroids){assert.equal(a.amp,0);assert.equal(a.spin,0);assert.ok(a.radius>=.65&&a.radius<=25);assert.ok(a.reveal>warningDistance(60,'hard',a.radius));const p=safeRoute(a.z,seed,m.id);assert.ok(Math.abs(a.x-p.x)>a.radius*1.2+5.1||Math.abs(a.y-p.y)>a.radius*1.08+3.0,'protected ring route at contact');}}

}
for(let t=0;t<240;t+=5){assert.equal(difficulty(t,'medium').speed,difficulty(t).speed*1.55);assert.equal(difficulty(t,'hard').speed,difficulty(t).speed*2.15);assert.ok(warningDistance(t,'hard')/difficulty(t,'hard').speed>3);}
assert.ok(totals.medium>totals.easy*1.25);assert.ok(totals.hard>totals.medium*1.25);
console.log(`PASS: preserved mode speed ratios and fuel/density curves; ${checked} reachable route samples across all modes; planned varied-size traffic; speed-based warning horizon.`);
