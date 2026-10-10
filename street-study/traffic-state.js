// Metres / seconds. Only street ambience uses these values; player physics is unchanged.
export const ROAD={center:6.05,width:4.5,junctions:[-30,30],crossHalf:2.9,stopOffset:7.3,crossOffset:4.9,crossWidth:2.6,northWalk:1.25,southWalk:10.85,end:146};
export const VEHICLE={length:4.05,width:1.64,maxSpeed:4.8,accel:1.45,brake:3.2,margin:.48};
// A short all-vehicle-red pedestrian phase avoids ambiguous turning conflicts.
export function signalAt(time){
 const t=((time%51)+51)%51;
 const main=t<12?'green':t<15?'amber':'red',cross=t>=17&&t<26?'green':t>=26&&t<29?'amber':'red';
 return {main,cross,pedestrian:t>=32&&t<43?'green':t>=43&&t<49?'clearance':'red'};
}
function plan(a){
 let z=a.home;const out=[];
 for(const j of [...ROAD.junctions].sort((x,y)=>(x-y)*a.dir)){
  if((j-a.x)*a.dir<0)continue;
  const near=j-a.dir*ROAD.crossOffset,far=j+a.dir*ROAD.crossOffset;
  let bank=z<ROAD.center?ROAD.northWalk:ROAD.southWalk;
  out.push({x:near,z:bank});
  if(a.kind==='bike'||a.id==='walker-north'){
   bank=bank<ROAD.center?ROAD.southWalk:ROAD.northWalk;
   out.push({x:near,z:bank,cross:true,axis:'z',lane:near});
  }
  out.push({x:far,z:bank,cross:true,axis:'x',lane:bank});
  z=bank<ROAD.center?1.55:(a.kind==='bike'?10.2:11.7);
  out.push({x:j+a.dir*8,z});
 }
 out.push({x:a.dir*ROAD.end,z});return out;
}
const bodyBox=a=>({x:a.x,z:a.z,w:Math.abs(Math.sin(a.yaw??Math.PI/2))*(a.kind==='bike'?1.6:.1)+.55,d:Math.abs(Math.cos(a.yaw??Math.PI/2))*(a.kind==='bike'?1.6:.1)+.55});
export function intersects(x,z,r,o){return Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r;}
const approach=(a,b,step)=>a<b?Math.min(b,a+step):Math.max(b,a-step);
export function createTrafficState(){
 let time=0,cycle=0;
 const cars=[{id:'sage-sedan',x:-38,z:7.175,dir:1,speed:0,distance:0,amber:new Set()},{id:'cream-estate',x:38,z:4.925,dir:-1,speed:0,distance:0,amber:new Set()}];
 const walkers=[{id:'walker-north',kind:'walk',x:-15,z:1.55,home:1.55,dir:1,speed:0,max:1.0,r:.27,distance:0},
  {id:'walker-south',kind:'walk',x:19,z:11.7,home:11.7,dir:-1,speed:0,max:.88,r:.28,distance:0},
  {id:'cyclist',kind:'bike',x:-21,z:9.65,home:9.65,dir:1,speed:0,max:1.65,r:.40,distance:0}];
 walkers.forEach(a=>{a.route=plan(a);a.next=0;a.crossing=false;a.crossed=0;});
 const currentSignal=()=>signalAt(cycle);
 function playerBlock(p,r=.34){return {x:p.x,z:p.z,w:r*2,d:r*2};}
 function blocksPlayer(x,z,r=.26){return cars.some(c=>intersects(x,z,r,{x:c.x,z:c.z,w:VEHICLE.length,d:VEHICLE.width}))||walkers.some(a=>intersects(x,z,r,bodyBox(a)));}
 function update(dt,player,obstacles=[]){
  if(dt<=0)return;
  // Substeps make yielding safe even when the render rate temporarily drops.
  for(let remaining=dt;remaining>1e-8;){const step=Math.min(remaining,1/60);remaining-=step;time+=step;
   // Hold all-red if a crossing actor is delayed; never release cars into an occupied crossing.
   if(!(cycle>=49&&walkers.some(a=>a.crossing)))cycle=(cycle+step)%51;
   const signal=currentSignal();
   for(const c of cars){
    let gap=Infinity;c.reason='cruise';
    for(const j of ROAD.junctions){
     const line=j-c.dir*ROAD.stopOffset,front=c.x+c.dir*VEHICLE.length/2,d=(line-front)*c.dir;
     if(d<0)continue;
     if(signal.main==='green'){c.amber.delete(j);continue;}
     if(signal.main==='amber'&&!c.amber.has(j)&&d<c.speed*c.speed/(2*VEHICLE.brake)+.6){c.amber.add(j);}
     if(signal.main==='red')c.amber.delete(j); // A player may have prevented an amber clearance.
     if(c.amber.has(j))continue; // A car already committed clears the junction during all-red.
     if(d-VEHICLE.margin<gap){gap=d-VEHICLE.margin;c.reason='signal';}
    }
    for(const p of [player,...walkers]){
     const pd=(p.x-c.x)*c.dir-VEHICLE.length/2-.34-VEHICLE.margin;
     if(Math.abs(p.z-c.z)<VEHICLE.width/2+.50&&pd>-.25&&pd<gap){gap=Math.max(0,pd);c.reason=p===player?'player':'pedestrian';}
    }
    const target=Math.min(VEHICLE.maxSpeed,Math.sqrt(2*VEHICLE.brake*Math.max(0,gap)));
    c.speed=approach(c.speed,target,(target<c.speed?VEHICLE.brake:VEHICLE.accel)*step);
    const move=Math.min(c.speed*step,Math.max(0,gap));
    if(move<c.speed*step)c.speed=move/step;
    c.x+=c.dir*move;c.distance+=move;
    if(c.x*c.dir>ROAD.end){c.x=-c.dir*ROAD.end;c.amber.clear();}
   }
   for(const a of walkers){
    const goal=a.route[a.next];
    if(!goal)continue;
    if(goal.cross&&!a.crossing){
     if(signal.pedestrian!=='green'){a.speed=0;a.reason='pedestrian-red';continue;}
     a.crossing=true;
    }
    const dx=goal.x-a.x,dz=goal.z-a.z,dist=Math.hypot(dx,dz);
    if(dist<.07){
     if(goal.cross){a.crossing=false;a.crossed++;}
     a.next++;a.speed=Math.min(a.speed,.4);
     if(a.next===a.route.length){a.x=-a.dir*ROAD.end;a.home=a.z;a.route=plan(a);a.next=0;}
     continue;
    }
    const others=walkers.filter(b=>b!==a).map(bodyBox),all=[...obstacles,playerBlock(player,.43),...others,...cars.map(c=>({x:c.x,z:c.z,w:VEHICLE.length,d:VEHICLE.width}))];
    const axis=goal.cross?goal.axis:'x',dir=axis==='x'?Math.sign(dx):Math.sign(dz),half=a.kind==='bike'?.82:.15;
    const home=axis==='x'?goal.z:goal.x;
    const transverse=axis==='x'?a.z:a.x;
    const bank=home<ROAD.center?[.2,3.05]:[9.05,12.65];
    // Every road-crossing sample stays inside its zebra footprint. No diagonal shortcuts.
    const lo=goal.cross?goal.lane-ROAD.crossWidth/2+a.r:bank[0],hi=goal.cross?goal.lane+ROAD.crossWidth/2-a.r:bank[1];
    const clear=(x,z)=>{
     const t=axis==='x'?z:x;if(t<lo||t>hi)return false;
     return !all.some(o=>intersects(x,z,a.r,o)||intersects(x+(axis==='x'?dir*half:0),z+(axis==='z'?dir*half:0),a.r,o)||intersects(x-(axis==='x'?dir*half:0),z-(axis==='z'?dir*half:0),a.r,o));
    };
    const forward=Math.min(.8+a.max*.65,Math.abs(axis==='x'?dx:dz));
    const aheadClear=t=>[.25,.5,.75,1].every(k=>clear(a.x+(axis==='x'?dir*forward*k:t-a.x),a.z+(axis==='z'?dir*forward*k:t-a.z)));
    const choices=[home,...Array.from({length:Math.ceil((hi-lo)/.3)},(_,i)=>lo+i*.3),transverse].filter(t=>t>=lo&&t<=hi).sort((x,y)=>Math.abs(x-home)+Math.abs(x-transverse)*.4-Math.abs(y-home)-Math.abs(y-transverse)*.4);
    const target=choices.find(t=>aheadClear(t)&&clear(axis==='x'?a.x:t,axis==='z'?a.z:t))??transverse;
    let t=approach(transverse,target,step*(a.kind==='bike'?.72:1.0));
    if(!clear(axis==='x'?a.x:t,axis==='z'?a.z:t))t=transverse;
    const open=aheadClear(t);a.speed=approach(a.speed,open?a.max:0,step*(open?.8:2.8));
    const along=Math.min(Math.abs(axis==='x'?dx:dz),a.speed*step)*dir;
    let x=axis==='x'?a.x+along:t,z=axis==='z'?a.z+along:t;
    if(!clear(x,z)){x=a.x;z=a.z;a.speed=0;}
    const mx=x-a.x,mz=z-a.z;a.distance+=Math.hypot(mx,mz);a.x=x;a.z=z;
    if(Math.hypot(mx,mz)>.0001){const angle=Math.atan2(mx,mz),delta=Math.atan2(Math.sin(angle-(a.yaw??angle)),Math.cos(angle-(a.yaw??angle)));a.yaw=(a.yaw??angle)+Math.max(-step*3,Math.min(step*3,delta));}
    a.reason=!open?'yield':a.crossing?'crossing':Math.abs(t-home)>.15?'avoid':'walk';
   }
  }
 }
 return {cars,walkers,update,blocksPlayer,snapshot:()=>({time,cycle,signal:currentSignal(),cars:cars.map(({amber,...c})=>({...c})),walkers:walkers.map(a=>({...a}))})};
}
