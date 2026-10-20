import {multiplayer} from './api.mjs';
const connections=new Set();
// D1 remains the single shared authority across isolates. The socket replaces
// repeated HTTP exchanges; it does not create isolate-local match simulations.
export function live(request,db){
 if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
 if(request.headers.get('Origin')!==new URL(request.url).origin)return new Response('Wrong origin',{status:403});
 if(connections.size>=64)return new Response('Realtime service busy',{status:503});
 const [client,server]=Object.values(new WebSocketPair());server.accept();connections.add(server);
 let busy=false,closed=false,identity=null,last=Date.now(),windowAt=Date.now(),messages=0;
 const timer=setInterval(()=>{if(Date.now()-last>20000)close(1008,'No authenticated activity');},5000);
 function close(code=1000,reason='Closed'){if(closed)return;closed=true;clearTimeout(timer);connections.delete(server);try{server.close(code,reason);}catch{}}
 server.addEventListener('close',()=>close());server.addEventListener('error',()=>close(1011,'Connection failed'));
 server.addEventListener('message',async event=>{
  if(closed)return;
  if(typeof event.data!=='string'||event.data.length>5000){close(1009,'Message too large');return;}
  let packet;try{packet=JSON.parse(event.data);}catch{close(1008,'Invalid packet');return;}
  const {requestId,...body}=packet;if(!Number.isSafeInteger(requestId)||requestId<0){close(1008,'Invalid sequence');return;}
  const now=Date.now();if(now-windowAt>1000){windowAt=now;messages=0;}if(++messages>30){close(1008,'Message rate exceeded');return;}
  if(busy){server.send(JSON.stringify({requestId,status:429,error:'An update is already in progress'}));return;}
  if(identity&&identity!==body.session){close(1008,'Pilot changed');return;}
  busy=true;try{
   const headers=new Headers(request.headers);headers.delete('Upgrade');headers.set('Content-Type','application/json');
   const response=await multiplayer(new Request(new URL('/api/multiplayer',request.url),{method:'POST',headers,body:JSON.stringify(body)}),db);
   const result=await response.json();if(response.ok){identity=body.session;last=now;}
   if(!closed)server.send(JSON.stringify({requestId,status:response.status,...result}));
  }catch{if(!closed)server.send(JSON.stringify({requestId,status:503,error:'Live service interrupted'}));}finally{busy=false;}
 });
 return new Response(null,{status:101,webSocket:client});
}
