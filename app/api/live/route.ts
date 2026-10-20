import {env} from 'cloudflare:workers';
import {live} from '../../../server/live.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return live(request,env.DB);}
