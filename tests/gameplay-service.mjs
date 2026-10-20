import {once} from 'node:events';
process.stdin.setEncoding('utf8');
const [line]=await once(process.stdin,'data');globalThis.__LIVE_GAME_QA__=JSON.parse(line);
process.env.MP_BOT_QA='1';process.env.MP_PLAY_QA='1';
await import('./multiplayer-ui.mjs');process.exit(0);
