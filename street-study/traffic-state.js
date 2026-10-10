// Metres / seconds. Only street ambience uses these values; player physics is unchanged.
export const ROAD={center:6.05,width:4.5,junctions:[-30,30],crossHalf:2.9,stopOffset:5.35,end:146};
export const VEHICLE={length:4.05,width:1.64,maxSpeed:4.8,accel:1.45,brake:3.2,margin:.48};
export function signalAt(time){
 const t=((time%30)+30)%30;
 return t<13?{main:'green',cross:'red'}:t<16?{main:'amber',cross:'red'}:t<17?{main:'red',cross:'red'}:t<26?{main:'red',cross:'green'}:t<29?{main:'red',cross:'amber'}:{main:'red',cross:'red'};
}
export function intersects(x,z,r,o){return Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r;}
const approach=(a,b,step)=>a<b?Math.min(b,a+step):Math.max(b,a-step);
export function createTrafficState(){
 let time=0;
 const cars=[{id:'sage-sedan',x:-38,z:7.175,dir:1,speed:0,distance:0,amber:new Set()},{id:'cream-estate',x:38,z:4.925,dir:-1,speed:0,distance:0,amber:new Set()}];
 const walkers=[{id:'walker-north',kind:'walk',x:-15,z:1.55,home:1.55,lo:.15,hi:3.22,dir:1,speed:0,max:1.0,r:.27,distance:0},
  {id:'walker-south',kind:'walk',x:19,z:11.7,home:11.7,lo:8.85,hi:12.8,dir:-1,speed:0,max:.88,r:.28,distance:0},
  {id:'cyclist',kind:'bike',x:-21,z:9.65,home:9.65,lo:8.85,hi:12.7,dir:1,speed:0,max:1.65,r:.40,distance:0}];
 function playerBlock(p,r=.34){return {x:p.x,z:p.z,w:r*2,d:r*2};}
 function blocksPlayer(x,z,r=.26){return cars.some(c=>intersects(x,z,r,{x:c.x,z:c.z,w:VEHICLE.length,d:VEHICLE.width}))||walkers.some(a=>intersects(x,z,r,{x:a.x,z:a.z,w:a.kind==='bike'?1.8:.50,d:.55}));}
 function update(dt,player,obstacles=[]){
  if(dt<=0)return;
  // Substeps make yielding safe even when the render rate temporarily drops.
  for(let remaining=dt;remaining>1e-8;){const step=Math.min(remaining,1/60);remaining-=step;time+=step;
   const signal=signalAt(time);
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
    const pd=(player.x-c.x)*c.dir-VEHICLE.length/2-.34-VEHICLE.margin;
    if(Math.abs(player.z-c.z)<VEHICLE.width/2+.50&&pd>-.25&&pd<gap){gap=Math.max(0,pd);c.reason='player';}
    const target=Math.min(VEHICLE.maxSpeed,Math.sqrt(2*VEHICLE.brake*Math.max(0,gap)));
    c.speed=approach(c.speed,target,(target<c.speed?VEHICLE.brake:VEHICLE.accel)*step);
    const move=Math.min(c.speed*step,Math.max(0,gap));
    if(move<c.speed*step)c.speed=move/step;
    c.x+=c.dir*move;c.distance+=move;
    if(c.x*c.dir>ROAD.end){c.x=-c.dir*ROAD.end;c.amber.clear();}
   }
   for(const a of walkers){
    const others=walkers.filter(b=>b!==a).map(b=>({x:b.x,z:b.z,w:b.kind==='bike'?1.85:.6,d:.62}));
    const all=[...obstacles,playerBlock(player,.43),...others];
    const half=a.kind==='bike'?.93:.30;
    const clear=(x,z)=>z>=a.lo&&z<=a.hi&&!all.some(o=>intersects(x,z,a.r,o)||intersects(x+a.dir*half,z,a.r,o)||intersects(x-a.dir*half,z,a.r,o));
    // A fixed look-ahead prevents stop/steer oscillation as speed drops near an obstacle.
    const forward=.9+a.max*.8;
    const aheadClear=z=>[.25,.5,.75,1].every(t=>clear(a.x+a.dir*forward*t,z));
    const choices=[a.home,...Array.from({length:Math.ceil((a.hi-a.lo)/.4)},(_,i)=>a.lo+i*.4),a.z].filter(z=>z>=a.lo&&z<=a.hi).sort((x,z)=>Math.abs(x-a.home)+Math.abs(x-a.z)*.4-Math.abs(z-a.home)-Math.abs(z-a.z)*.4);
    let target=choices.find(z=>aheadClear(z)&&clear(a.x,z));
    if(target===undefined)target=a.z;
    let nextZ=approach(a.z,target,step*(a.kind==='bike'?.72:1.0));
    if(!clear(a.x,nextZ))nextZ=a.z;
    const open=aheadClear(nextZ);
    a.speed=approach(a.speed,open?a.max:0,step*(open?.8:2.8));
    let nextX=a.x+a.dir*a.speed*step;
    if(!clear(nextX,nextZ)){nextX=a.x;a.speed=0;}
    const dx=nextX-a.x,dz=nextZ-a.z;a.distance+=Math.hypot(dx,dz);a.x=nextX;a.z=nextZ;
    a.yaw=Math.atan2(a.dir,0)+(Math.abs(dx)>.001?-Math.atan2(dz,Math.abs(dx))*a.dir:0);
    a.reason=!open?'yield':Math.abs(a.z-a.home)>.15?'avoid':'walk';
    if(a.x*a.dir>ROAD.end)a.x=-a.dir*ROAD.end;
   }
  }
 }
 return {cars,walkers,update,blocksPlayer,snapshot:()=>({time,signal:signalAt(time),cars:cars.map(({amber,...c})=>({...c})),walkers:walkers.map(a=>({...a}))})};
}
