// Warm only the browser's HTTP cache, never GLTFs, decoded images or GPU models.
// One low-priority request at a time; pause/background/scene exit abort promptly.
export function createEncodedWarmup(urls,{fetcher=globalThis.fetch,document=globalThis.document,connection=globalThis.navigator?.connection,delay=5}={}){
 let elapsed=0,index=0,controller=null,disposed=false,disabled=!!connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType),pending=Promise.resolve();
 const stats={completed:0,bytes:0,aborted:0,failed:0};
 const stop=()=>controller?.abort();
 const visibility=()=>{if(document?.hidden)stop();};document?.addEventListener('visibilitychange',visibility);
 function tick({dt=0,playing=false}={}){
  if(disposed||disabled)return;
  if(!playing||document?.hidden){stop();return;}
  elapsed+=Math.min(Math.max(dt,0),.1);
  if(elapsed<delay||controller||index>=urls.length)return;
  const current=new AbortController();controller=current;
  pending=(async()=>{
   try{
    const response=await fetcher(urls[index],{signal:current.signal,cache:'force-cache',priority:'low'});
    if(!response.ok||!response.body){stats.failed++;index++;return;}
    // Development/no-store servers would download everything twice: opt out.
    if(/no-store/i.test(response.headers.get('cache-control')||'')){disabled=true;await response.body.cancel();return;}
    const reader=response.body.getReader();try{while(true){const chunk=await reader.read();if(chunk.done)break;stats.bytes+=chunk.value.byteLength;}}finally{reader.releaseLock();}
    if(current.signal.aborted){stats.aborted++;return;}
    stats.completed++;index++;
   }catch(error){if(current.signal.aborted)stats.aborted++;else{stats.failed++;index++;}}
   finally{if(controller===current)controller=null;}
  })();
 }
 return {tick,stats,settled:()=>pending,dispose(){disposed=true;stop();document?.removeEventListener('visibilitychange',visibility);}};
}
