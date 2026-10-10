// Seoul-only layout and deterministic traffic. All time is supplied by GameTime.
export const ROAD={halfWidth:6.8,end:118,crossings:[-33,33],carLength:4.4,carWidth:1.8};
export const CRUISE_KMH=36;
export const LIGHTS=[{id:'seoul-light-1',x:-8,z:5.1},{id:'seoul-light-2',x:0,z:1.7},{id:'seoul-light-3',x:8,z:-5.1}];
// Background junctions use a coordinated main-road priority phase in this study.
// There is no crossing or signal-controlled stop in the playable mid-block.
// Cross streets remain red; pedestrians across the main road remain red.
export function signalAt(){return {car:'green',crossCar:'red',pedestrian:false};}
export function createTraffic(){return [{z:5.1,dir:1,x:-8},{z:1.7,dir:1,x:-23},{z:-1.7,dir:-1,x:6},{z:-5.1,dir:-1,x:30}].flatMap((lane,i)=>Array.from({length:5},(_,j)=>{const max=CRUISE_KMH/3.6*[.98,1,1.02,1][i],x=((lane.x-lane.dir*j*47.2+ROAD.end*3)%(ROAD.end*2))-ROAD.end;return {...lane,id:i*5+j,x,max,speed:max,previousX:x,distance:0,variant:i};}));}
export function advanceTraffic(cars,dt,ms){const signal=signalAt(ms),positions=cars.map(c=>({id:c.id,x:c.x,z:c.z,dir:c.dir}));for(const c of cars){c.previousX=c.x;let target=c.max;
 const leaderGap=Math.min(Infinity,...positions.filter(o=>o.id!==c.id&&o.z===c.z&&o.dir===c.dir).map(o=>((o.x-c.x)*c.dir+ROAD.end*2)%(ROAD.end*2)-ROAD.carLength));
 target=Math.min(target,Math.sqrt(2*3.2*Math.max(0,leaderGap-2.4)));
 const accel=target<c.speed?3.2:1.5;c.speed+=Math.max(-accel*dt,Math.min(accel*dt,target-c.speed));let travel=Math.min(c.speed*dt,Math.max(0,leaderGap-1.4));
 c.x+=travel*c.dir;c.distance+=travel;if(Math.abs(c.x)>ROAD.end){c.x-=c.dir*ROAD.end*2;c.previousX=c.x;}
}return signal;}
export function carContactTime(p,previous,c,r=.27,shape={x:2.2,z:.9}){
 // Relative swept AABB: no frame-rate dependent tunneling by car or player.
 const a={x:previous.x-c.previousX,z:previous.z-c.z},b={x:p.x-c.x,z:p.z-c.z},size={x:shape.x+r,z:shape.z+r};let lo=0,hi=1;
 for(const axis of ['x','z']){const d=b[axis]-a[axis];if(Math.abs(d)<1e-8){if(Math.abs(a[axis])>size[axis])return null;continue;}let t0=(-size[axis]-a[axis])/d,t1=(size[axis]-a[axis])/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return null;}return lo;
}

export function carContact(p,previous,c,r=.27){return carContactTime(p,previous,c,r)!==null;}
