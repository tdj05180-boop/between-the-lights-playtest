// Streaming BGM: authorize the actual element silently in the Start gesture.
// Call resume() and play() synchronously, never play() in resume().then().
export function createMediaPlayback({media,getContext,allowed,onError=()=>{},doc=globalThis.document,win=globalThis.window,now=()=>performance.now()}){
 const log=[],listeners=[];
 let disposed=false,pending=null,resuming=null,priming=false,blocked=false,lastCheck=0,lastTime=0,lastAdvance=0,retries=0,observed=null;
 const state=()=>({context:getContext()?.state??'locked',readyState:media.readyState,networkState:media.networkState,mediaPaused:media.paused,mediaTime:media.currentTime,hidden:!!doc?.hidden});
 function record(event,detail={}){log.push({event,atMs:Math.round(now()),...state(),...detail});if(log.length>80)log.shift();}
 function issue(name,error,reason){record('failure',{name,reason,errorName:error?.name??'Error',message:String(error?.message??error)});onError(name,error);}
 function suspend(reason){const c=getContext();if(!c||c.state==='closed'||c.state==='suspended'||priming)return;c.suspend().catch(e=>{if(!disposed)issue('suspend',e,reason);});}
 function inactive(reason){if(priming)return;if(pending)pending.interrupted=true;media.pause();suspend(reason);}
 function resume(reason,gesture=false){
  const c=getContext();if(!c||c.state==='running'||c.state==='closed'||resuming&&!gesture&&now()-resuming.at<6000)return;
  const token={at:now()};resuming=token;record('resume-request',{reason});let p;try{p=c.resume();}catch(e){p=Promise.reject(e);}
  Promise.resolve(p).then(()=>{if(!disposed&&resuming===token)record('resume-ok',{reason});}).catch(e=>{if(!disposed&&resuming===token)issue('resume',e,reason);}).finally(()=>{
   if(resuming!==token)return;resuming=null;if(!disposed&&!allowed())suspend('inactive');
  });
 }
 function play(reason){
  if(disposed||pending||!media.paused)return;
  const token={at:now(),interrupted:false};pending=token;lastAdvance=now();lastTime=media.currentTime;record('play-request',{reason});
  let p;try{p=media.play();}catch(e){p=Promise.reject(e);}
  Promise.resolve(p).then(()=>{if(disposed||pending!==token)return;blocked=false;record('play-ok',{reason});}).catch(e=>{
   if(disposed||pending!==token)return;if(e?.name==='NotAllowedError')blocked=true;issue('bgm-play',e,reason);
  }).finally(()=>{
   if(pending!==token)return;pending=null;priming=false;if(disposed)return;
   if(!allowed())inactive('inactive');
   else if(token.interrupted&&media.paused&&!blocked)sync('state-reconcile');
  });
 }
 function sync(reason='sync',gesture=false){
  if(disposed||!getContext())return;
  if(!allowed()){inactive(reason);return;}
  if(gesture){blocked=false;retries=0;}
  if(blocked&&!gesture)return;resume(reason,gesture);play(reason);
 }
 function listen(el,type,fn){if(el?.addEventListener){el.addEventListener(type,fn);listeners.push([el,type,fn]);}}
 function observe(){const c=getContext();if(c&&c!==observed){observed=c;listen(c,'statechange',()=>{record('context-state');if(allowed()&&!blocked&&c.state==='running')sync('context-running');});}}
 for(const type of ['pointerup','touchend','keydown'])listen(doc,type,e=>{
  if(!e.isTrusted||!allowed()||getContext()?.state==='running'&&!media.paused&&!blocked&&!pending)return;
  if(pending&&now()-pending.at>6000){pending=null;priming=false;media.pause();record('pending-cancel');}
  sync('gesture-retry:'+type,true);
 });
 for(const type of ['canplay','loadeddata'])listen(media,type,()=>{if(allowed()&&!blocked&&media.paused&&retries<3)sync('media-ready');});
 listen(doc,'visibilitychange',()=>{if(doc.hidden){priming=false;inactive('background');}else if(allowed()){lastAdvance=now();sync('visible');}});
 listen(win,'pageshow',()=>{if(allowed()){lastAdvance=now();sync('pageshow');}});
 return {
  prime(reason='start-gesture'){if(disposed||!getContext())return;observe();blocked=false;retries=0;priming=true;resume(reason,true);play(reason);if(!pending)priming=false;},
  sync(reason){observe();sync(reason);},
  // Existing game update only, at most three automatic retries until media
  // advances or trusted input arrives. No extra RAF or interval.
  tick(){const t=now();if(disposed||!allowed()||t-lastCheck<1000)return;lastCheck=t;
   if(media.currentTime!==lastTime){lastTime=media.currentTime;lastAdvance=t;retries=0;}
   if(blocked||retries>=3)return;
   if(pending&&t-pending.at>6000){
    if(!media.paused&&t-lastAdvance<2000){pending=null;priming=false;record('play-observed');return;}
    pending=null;priming=false;media.pause();retries++;record('play-timeout');sync('pending-timeout');return;
   }
   if(!pending&&(media.paused||getContext()?.state!=='running')){retries++;sync('active-retry');}
   else if(!pending&&media.readyState>=2&&t-lastAdvance>6000){retries++;record('stalled');media.pause();sync('stalled-retry');}
  },
  snapshot:()=>({recoveryLog:[...log],pendingPlays:pending?1:0,policyBlocked:blocked,retries,media:state()}),
  dispose(){disposed=true;pending=null;resuming=null;priming=false;media.pause();for(const [el,type,fn]of listeners)el.removeEventListener(type,fn);listeners.length=0;}
 };
}
