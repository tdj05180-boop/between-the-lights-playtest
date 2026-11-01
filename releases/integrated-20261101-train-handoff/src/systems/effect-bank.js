// Unlock contexts/media in the original user gesture; prepare recordings separately.
// A bank is requested only for the entering chapter, never by an inactive start().
export function createEffectBank({names,url,getContext,buffers,isDisposed,onError,onLoaded=()=>{}}){
 let pending=null,generation=0;const controllers=new Set();
 async function load(name,version){
  const controller=new AbortController();let expired=false,timer;
  controllers.add(controller);
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;controller.abort();reject(Error('Audio preparation timed out'));},15000);});
  try{
   const buffer=await Promise.race([timeout,(async()=>{
    const response=await fetch(url(name),{signal:controller.signal});
    if(!response.ok)throw Error('HTTP '+response.status);
    const bytes=await response.arrayBuffer();
    if(expired||isDisposed()||version!==generation)return null;
    return getContext().decodeAudioData(bytes);
   })()]);
   if(expired||isDisposed()||version!==generation)return;
   buffers.set(name,buffer);onLoaded(name,buffer);
  }catch(error){if(!isDisposed()&&version===generation)onError(name,error);}
  finally{clearTimeout(timer);controllers.delete(controller);}
 }
 return {prepare(){
  if(isDisposed()||!getContext())return Promise.resolve();
  if(pending)return pending;
  const queue=names.filter(name=>!buffers.has(name));
  if(!queue.length)return Promise.resolve();
  // Bound simultaneous decode work; keep other loading tasks responsive.
  const version=generation;
  const worker=async()=>{while(queue.length&&!isDisposed()&&version===generation)await load(queue.shift(),version);};
  pending=Promise.all(Array.from({length:Math.min(2,queue.length)},worker)).finally(()=>{if(version===generation)pending=null;});
  return pending;
 },release(){
  // Voices are stopped by chapter leave; do not retain decoded PCM across chapters.
  generation++;pending=null;buffers.clear();
  for(const controller of controllers)controller.abort();controllers.clear();
 }};
}
