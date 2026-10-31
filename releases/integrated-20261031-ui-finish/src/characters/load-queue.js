// Fetch up to two encoded files ahead; decode/upload only one model at a time.
// Download concurrency must not become concurrent 4K ImageBitmap decoding.
export async function loadAssetQueue(items,{fetchBytes,decode,consume}){
 const pending=new Map();let next=0;
 const fill=()=>{while(next<items.length&&pending.size<2){const i=next++;pending.set(i,Promise.resolve().then(()=>fetchBytes(items[i])).then(value=>({value}),error=>({error})));}};
 fill();
 for(let i=0;i<items.length;i++){
  const result=await pending.get(i);pending.delete(i);if(result.error)throw result.error;
  fill();
  const model=await decode(result.value,items[i]);result.value=null;
  await consume(model,items[i]);
 }
}
