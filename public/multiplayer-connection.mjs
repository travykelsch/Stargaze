export class LiveConnection {
 constructor(){this.socket=null;this.opening=null;this.pending=new Map();this.serial=0;this.tail=Promise.resolve();this.generation=0;this.cancelOpen=null;}
 async open(){
  if(this.socket?.readyState===1)return;if(this.opening)return this.opening;
  const epoch=this.generation,url=new URL('/api/live',location.href);url.protocol=url.protocol==='https:'?'wss:':'ws:';
  const socket=new WebSocket(url);this.socket=socket;
  const opening=new Promise((resolve,reject)=>{
   let settled=false;
   const fail=message=>{clearTimeout(timer);if(!settled){settled=true;reject(new Error(message));}for(const [id,p] of this.pending){if(p.socket!==socket)continue;this.pending.delete(id);clearTimeout(p.timer);p.reject(new Error(message));}if(this.socket===socket)this.socket=null;};
   const timer=setTimeout(()=>{fail('Realtime connection unavailable. Please retry.');socket.close();},7000);
   this.cancelOpen=()=>fail('Realtime connection closed');
   socket.onopen=()=>{if(epoch!==this.generation||this.socket!==socket){socket.close();return;}clearTimeout(timer);settled=true;resolve();};
   socket.onmessage=event=>{if(epoch!==this.generation||this.socket!==socket)return;let data;try{data=JSON.parse(event.data);}catch{return;}const p=this.pending.get(data.requestId);if(!p||p.socket!==socket)return;this.pending.delete(data.requestId);clearTimeout(p.timer);p.resolve(data);};
   socket.onclose=()=>fail('Realtime connection interrupted');
   socket.onerror=()=>{fail('Realtime connection unavailable');socket.close();};
  });
  this.opening=opening;try{await opening;}finally{if(this.opening===opening){this.opening=null;this.cancelOpen=null;}}
 }
 call(body){const epoch=this.generation,task=this.tail.catch(()=>{}).then(()=>{if(epoch!==this.generation)throw new Error('Realtime request cancelled');return this.exchange(body,epoch);});this.tail=task;return task;}
 async exchange(body,epoch){await this.open();if(epoch!==this.generation)throw new Error('Realtime request cancelled');const socket=this.socket,requestId=++this.serial;return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{this.pending.delete(requestId);reject(new Error('Waiting for live simulation'));socket.close();},5000);this.pending.set(requestId,{resolve,reject,timer,socket});
  try{socket.send(JSON.stringify({...body,requestId}));}catch(e){this.pending.delete(requestId);clearTimeout(timer);reject(e);socket.close();}
 });}
 close(){this.generation++;const socket=this.socket;this.cancelOpen?.();this.opening=null;this.cancelOpen=null;this.socket=null;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('Realtime connection closed'));}this.pending.clear();this.tail=Promise.resolve();socket?.close();}
}
