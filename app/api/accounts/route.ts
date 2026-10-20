import {env} from 'cloudflare:workers';
import {accounts} from '../../../server/accounts.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return accounts(request,env.DB);}
export async function POST(request:Request){return accounts(request,env.DB);}
