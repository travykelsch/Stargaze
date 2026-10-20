import {env} from 'cloudflare:workers';
import {passwordAuth} from '../../../server/password-auth.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){return passwordAuth(request,env.DB);}
