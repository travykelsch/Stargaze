export async function accountRequest(body=null,query=''){
 const r=await fetch('/api/accounts'+query,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(7000)});
 let data;try{data=await r.json();}catch{throw new Error('Accounts are unavailable. Please retry.');}if(!r.ok)throw Object.assign(new Error(data.error||'Unable to reach your account'),{status:r.status});return data;
}
export function mergeRecords(a={},b={}){const out=structuredClone(a);for(const [key,r]of Object.entries(b)){out[key]={distance:Math.max(out[key]?.distance||0,r.distance||0),score:Math.max(out[key]?.score||0,r.score||0)};}return out;}
export function installAccounts(game){
 let profile=null,ready=false,flushing=false,queue=[];
 const status=document.getElementById('accountStatus'),link=document.getElementById('pilotAccount');
 const label=text=>{if(status)status.textContent=text;};
 function persistQueue(){try{localStorage.setItem('stargaze-flight-queue:'+profile.id,JSON.stringify(queue));return true;}catch{label('Cloud save pending · keep this page open');return false;}}
 async function flush(){if(!profile||flushing||!queue.length)return;flushing=true;try{while(queue.length){await accountRequest({...queue[0],action:'solo',profile:profile.id});queue.shift();persistQueue();}label('Pilot stats saved online');}catch(e){label(e.status===400?'A flight could not be saved · open My pilot for help':e.status===409||e.status===401?'Sign-in changed · reload to save':'Offline · flight stats will retry');}finally{flushing=false;}}
 const init=(async()=>{try{
  const a=await accountRequest();profile=a.profile;
  if(profile){
   const key='stargaze-account-save:'+profile.id;let prior=null;try{prior=localStorage.getItem(key);}catch{}
   game.activate(key,prior,a.stats.records);
   try{queue=JSON.parse(localStorage.getItem('stargaze-flight-queue:'+profile.id)||'[]');if(!Array.isArray(queue))queue=[];}catch{queue=[];}
   label('Cloud records · '+profile.name);if(link)link.textContent='My pilot & stats ↗';
  }else label(a.authenticated?'Create your pilot profile to save online':'Guest · sign in to save your stats');
  try{const current=profile?.id||'guest',previous=sessionStorage.getItem('stargaze-account-session');if(previous!==current)sessionStorage.removeItem('stargaze-pilot');sessionStorage.setItem('stargaze-account-session',current);if(profile)localStorage.setItem('stargaze-pilot-name',profile.name);}catch{}
 }catch{label('Accounts unavailable · guest play available');}finally{ready=true;void flush();}})();
 window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
 const timer=setInterval(()=>void flush(),20000);window.addEventListener('online',()=>void flush());
 return {get ready(){return ready;},get profile(){return profile;},initialized:init,stop(){clearInterval(timer);},record(run,world,difficulty,ship){
  if(!profile||run.accountRecorded||run.time<=.01)return;run.accountRecorded=true;
  if(queue.length>=200){game.toast('Cloud save queue is full. Reconnect before another flight.');return;}
  queue.push({id:run.statsId,world,difficulty,ship,duration:run.time,distance:run.distance,rings:run.rings,credits:run.points,combo:run.maxCombo||0,nearMisses:run.nearMisses||0});persistQueue();void flush();
 }};
}
