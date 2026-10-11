// Warehouse-only interaction geometry. Distances are in world metres.
// Selection-only proxy: never used for rendering or movement collisions.
export const PICKUP_PROXY={halfWidth:.7,halfDepth:.7};
export const PICKUP_RADIUS=1.35;
export const TRUCK_WORK_AREA={halfWidth:1.2,halfDepth:1.3,offsetZ:.1};
export function closestPoint(p,t){
 const yaw=t.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw),dx=p.x-t.x,dz=p.z-t.z;
 const x=Math.max(-(t.halfWidth??0),Math.min(t.halfWidth??0,dx*c-dz*s));
 const z=Math.max(-(t.halfDepth??0),Math.min(t.halfDepth??0,dx*s+dz*c));
 return {x:t.x+x*c+z*s,z:t.z-x*s+z*c};
}
export function parcelRegion(p,b){
 const region={...b,...PICKUP_PROXY,radius:PICKUP_RADIUS};
 const near=closestPoint(p,region),distance=Math.hypot(p.x-near.x,p.z-near.z);
 // Occlusion still reaches the real parcel, not the enlarged invisible proxy.
 const surface=closestPoint(p,{...b,halfWidth:.25,halfDepth:.21});
 return {...region,facingX:surface.x,facingZ:surface.z,minFacing:distance<=.75?-1:-.25,accessX:surface.x,accessZ:surface.z};
}
export function truckRegion(p,t){
 const region={...t,z:t.z+TRUCK_WORK_AREA.offsetZ,...TRUCK_WORK_AREA,radius:0,minFacing:-1};
 return {...region,facingX:Math.max(t.x-1.2,Math.min(t.x+1.2,p.x)),facingZ:t.z-3,accessX:Math.max(t.x-1.2,Math.min(t.x+1.2,p.x)),accessZ:t.z-1.1};
}
// Body plus forward carried parcel footprint instead of a .79m exclusion square.
export function canStandCarrying(x,z,yaw,obstacles){
 const s=Math.sin(yaw),c=Math.cos(yaw);
 const shapes=[{x,z,hx:.26,hz:.26,c:1,s:0},{x:x+.44*s,z:z+.44*c,hx:.27,hz:.25,c,s}];
 return shapes.every(a=>{
  const ex=Math.abs(a.c)*a.hx+Math.abs(a.s)*a.hz,ez=Math.abs(a.s)*a.hx+Math.abs(a.c)*a.hz;
  if(a.x-ex<=-21.6||a.x+ex>=21.6||a.z-ez<=-15.2||a.z+ez>=16.2)return false;
  return !obstacles.some(o=>{
   const dx=o.x-a.x,dz=o.z-a.z,bx=o.w/2,bz=o.d/2;
   return Math.abs(dx)<ex+bx&&Math.abs(dz)<ez+bz&&Math.abs(dx*a.c-dz*a.s)<a.hx+Math.abs(a.c)*bx+Math.abs(a.s)*bz&&Math.abs(dx*a.s+dz*a.c)<a.hz+Math.abs(a.s)*bx+Math.abs(a.c)*bz;
  });
 });
}
// Use the nearest accessible face, not the object's centre. Only the supporting
// conveyor is exempt; intervening posts, shelves and other conveyors still block.
export function canReach(position,target,obstacles){
 const end={x:target.accessX??target.x,z:target.accessZ??target.z};
 return !obstacles.some(o=>{
  const contains=Math.abs(target.x-o.x)<=o.w/2&&Math.abs(target.z-o.z)<=o.d/2;
  if(target.boxId!==undefined&&o.interactionSurface&&contains)return false;
  let enter=0,exit=1;
  for(const [axis,size] of [['x','w'],['z','d']]){
   const start=position[axis],delta=end[axis]-start;
   const low=o[axis]-o[size]/2-.04,high=o[axis]+o[size]/2+.04;
   if(Math.abs(delta)<1e-9){if(start<low||start>high)return false;}
   else{const a=(low-start)/delta,b=(high-start)/delta;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));if(enter>exit)return false;}
  }
  return enter<=exit;
 });
}
