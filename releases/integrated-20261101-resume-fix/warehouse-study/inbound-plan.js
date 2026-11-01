// One immutable manifest per attempt. IDs follow the same mesh for the entire round.
export const FIRST_HANDOFF_MS=2400;
export function makeInboundManifest(random=Math.random){
 const red=3+Math.min(4,Math.floor(random()*5));
 const boxes=Array.from({length:10},(_,id)=>({id,color:id<red?'red':'blue'}));
 for(let i=boxes.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[boxes[i],boxes[j]]=[boxes[j],boxes[i]];}
 return Object.freeze({red,blue:10-red,boxes:Object.freeze(boxes.map(b=>Object.freeze(b)))});
}
export function inboundSlot(i){return {x:-4+(i%2?-.67:.67),y:.49,z:-17.55-Math.floor(i/2)*.54};}
export function handoffAt(i,releaseMs=4500){return i===0?FIRST_HANDOFF_MS:i*releaseMs;}
export function workerPhase(elapsed,index,releaseMs=4500){
 const end=handoffAt(index,releaseMs),start=index===0?0:handoffAt(index-1,releaseMs),u=Math.max(0,Math.min(1,(elapsed-start)/(end-start)));
 return {u,stage:u<.3?'approach':u<.46?'lift':u<.87?'carry':'place'};
}
