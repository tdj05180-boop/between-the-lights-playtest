// Arc-length route with rounded transfer-table corners. Coordinates match the installed line.
const points=[{x:-4,z:-14.7}];
const push=(x,z)=>points.push({x,z});
push(-4,-6.05);
for(let i=1;i<=16;i++){const a=Math.PI-i*Math.PI/32;push(-3.55+.45*Math.cos(a),-6.05+.45*Math.sin(a));}
push(10.05,-5.6);
for(let i=1;i<=16;i++){const a=Math.PI/2-i*Math.PI/32;push(10.05+.45*Math.cos(a),-6.05+.45*Math.sin(a));}
push(10.5,-10.65);
const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z));
export const conveyorPath={length:lengths.reduce((a,b)=>a+b,0),points,
 sample(distance){let s=Math.max(0,Math.min(this.length,distance));for(let i=0;i<lengths.length;i++){const l=lengths[i];if(s<=l||i===lengths.length-1){const a=points[i],b=points[i+1],t=s/l;return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:1.267,yaw:Math.atan2(b.x-a.x,b.z-a.z)};}s-=l;}}
};
export const CONVEYOR_SPEED=2,PARCEL_GAP=.92;
export class ConveyorQueue{
 constructor(boxes,{releaseMs=4500,count=10,firstReleaseMs=0}={}){this.boxes=boxes.slice(0,count).map(b=>({id:b.id,color:b.color,state:'pending',s:0}));this.elapsed=0;this.releaseMs=releaseMs;this.firstReleaseMs=firstReleaseMs;}
 update(dt){
  // Substeps preserve inlet spacing even after a slow frame. No elapsed-position reset.
  let remaining=Math.max(0,dt);
  while(remaining>1e-9){const step=Math.min(remaining,1/60);remaining-=step;this.elapsed+=step*1000;let ahead=conveyorPath.length+PARCEL_GAP;
   for(let i=0;i<this.boxes.length;i++){const b=this.boxes[i];if(['carried','sorted'].includes(b.state))continue;
    if(b.state==='pending'){if(this.elapsed+1e-6<(i===0?this.firstReleaseMs:i*this.releaseMs)||ahead<PARCEL_GAP)continue;b.state='moving';}
    const stop=Math.min(conveyorPath.length,ahead-PARCEL_GAP),before=b.s;
    b.s=Math.max(b.s,Math.min(stop,b.s+CONVEYOR_SPEED*step));b.state=b.s-before<1e-7?'waiting':'moving';ahead=b.s;
   }
  }
 }
 take(id){const b=this.boxes.find(b=>b.id===id);if(!b||!['moving','waiting'].includes(b.state))return false;b.state='carried';return true;}
 sort(id){const b=this.boxes.find(b=>b.id===id);if(!b||b.state!=='carried')return false;b.state='sorted';return true;}
 snapshot(){return this.boxes.map(b=>({...b,...conveyorPath.sample(b.s)}));}
}
