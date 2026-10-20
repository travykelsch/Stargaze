import { env } from 'cloudflare:workers';
import { multiplayer } from '../../../server/api.mjs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) { return multiplayer(request, env.DB); }
