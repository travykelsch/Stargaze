export class LiveConnection {
 constructor(){this.socket=null;this.opening=null;this.pending=new Map();this.serial=0;this.tail=Promise.resolve();}
 async open(){
  if(this.socket?.readyState===1)return;if(this.opening)return this.opening;
  this.opening=new Promise((resolve,reject)=>{
   const url=new URL('/api/live',location.href);url.protocol=url.protocol==='https:'?'wss:':'ws:';const socket=new WebSocket(url);this.socket=socket;
   const timer=setTimeout(()=>{socket.close();reject(new Error('Realtime connection unavailable. Please retry.'));},7000);
   socket.onopen=()=>{clearTimeout(timer);resolve();};
   socket.onmessage=event=>{let data;try{data=JSON.parse(event.data);}catch{return;}const pending=this.pending.get(data.requestId);if(!pending)return;this.pending.delete(data.requestId);clearTimeout(pending.timer);pending.resolve(data);};
   socket.onclose=()=>{clearTimeout(timer);reject(new Error('Realtime connection closed'));for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('Realtime connection interrupted'));}this.pending.clear();};
   socket.onerror=()=>{clearTimeout(timer);reject(new Error('Realtime connection unavailable'));};
  });try{await this.opening;}finally{this.opening=null;}
 }
 call(body){const task=this.tail.catch(()=>{}).then(()=>this.exchange(body));this.tail=task;return task;}
 async exchange(body){await this.open();const requestId=++this.serial;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(requestId);this.socket?.close();reject(new Error('Waiting for live simulation'));},5000);this.pending.set(requestId,{resolve,reject,timer});this.socket.send(JSON.stringify({requestId,...body}));});}
 close(){this.socket?.close();this.socket=null;}
}
