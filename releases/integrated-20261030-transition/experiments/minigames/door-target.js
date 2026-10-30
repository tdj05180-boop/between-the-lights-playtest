// Fixed-width target; only a completed input chooses the next location.
export function nextDoorTarget(previous=null,random=Math.random){
 const centers=[.20,.35,.50,.65,.80].filter(c=>previous===null||Math.abs(c-previous)>.14);
 const center=centers[Math.min(centers.length-1,Math.floor(Math.max(0,random())*centers.length))];
 return {center,min:center-.12,max:center+.12};
}
export const doorQuality=(position,target)=>position<target.min||position>target.max?'miss':Math.abs(position-target.center)<=.04?'perfect':'good';
