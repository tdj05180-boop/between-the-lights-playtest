import {laserContact,laserSegments} from './layout.js';

const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
function hull(points){
 const p=points.sort((a,b)=>a.x-b.x||a.z-b.z),lo=[],hi=[];
 for(const v of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),v)<=0)lo.pop();lo.push(v);}
 for(let i=p.length-1;i>=0;i--){const v=p[i];while(hi.length>1&&cross(hi.at(-2),hi.at(-1),v)<=0)hi.pop();hi.push(v);}
 lo.pop();hi.pop();return lo.concat(hi);
}
// Clip the convex shoe envelope at the light surface. A raised toe/heel does
// not hit merely because the other end of the shoe is touching the floor.
export function footPatch(points,top){
 const below=[],above=[];
 for(const p of points)(p.y<=top?below:above).push(p);
 if(!below.length)return [];
 const clipped=below.map(p=>({x:p.x,z:p.z}));
 for(const a of below)for(const b of above){const t=(top-a.y)/(b.y-a.y);clipped.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}
 const polygon=hull(clipped);if(polygon.length<3)return [];
 // Small forgiveness inside the shoe silhouette; no torso-sized padding.
 const center=polygon.reduce((c,p)=>({x:c.x+p.x/polygon.length,z:c.z+p.z/polygon.length}),{x:0,z:0});
 return polygon.map(p=>({x:center.x+(p.x-center.x)*.94,z:center.z+(p.z-center.z)*.94}));
}
function overlaps(poly,cx,cz,hx,hz){
 const axes=[{x:1,z:0},{x:0,z:1}];
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];axes.push({x:-(b.z-a.z),z:b.x-a.x});}
 for(const a of axes){let min=Infinity,max=-Infinity;for(const p of poly){const n=p.x*a.x+p.z*a.z;min=Math.min(min,n);max=Math.max(max,n);}const center=cx*a.x+cz*a.z,r=Math.abs(a.x)*hx+Math.abs(a.z)*hz;if(max<center-r||min>center+r)return false;}
 return true;
}
export function feetContact(from,to,l,old,pos){
 if(!from.feet||!to.feet||!Number.isFinite(l.topY))throw Error('Laser contact needs both measured shoes');
 for(const foot of to.feet){
  const prev=from.feet.find(f=>f.side===foot.side);if(!prev||prev.points.length!==foot.points.length)throw Error('Shoe sample topology changed');
  let travel=0;for(let i=0;i<foot.points.length;i++){const a=prev.points[i],b=foot.points[i];travel=Math.max(travel,Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z));}
  const n=Math.max(1,Math.ceil((travel+Math.hypot(pos.x-old.x,pos.z-old.z))/.01));
  for(let step=0;step<=n;step++){
   const t=step/n,cx=old.x+(pos.x-old.x)*t,cz=old.z+(pos.z-old.z)*t,points=foot.points.map((b,i)=>{const a=prev.points[i];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};});
   // Broad phase only. Exact clipped footprint is tested separately per shoe.
   const hx=(l.axis==='x'?l.width:l.thickness)/2,hz=(l.axis==='z'?l.width:l.thickness)/2;
   if(points.every(p=>p.y>l.topY+.002)||points.every(p=>p.x<cx-hx)||points.every(p=>p.x>cx+hx)||points.every(p=>p.z<cz-hz)||points.every(p=>p.z>cz+hz))continue;
   const poly=footPatch(points,l.topY+.002);if(!poly.length)continue;
   for(const s of laserSegments(l,{x:cx,z:cz}))if(overlaps(poly,s.x,s.z,(l.axis==='x'?s.width:l.thickness)/2,(l.axis==='z'?s.width:l.thickness)/2))return true;
  }
 }
 return false;
}

// Test candidate: sweep both actors and jump clearance over the same frame.
// Keep the existing forgiving capsule footprint; animation does not resize it.
export const RADIUS=.26;
export function movingContact(from,to,l,old,pos,r=RADIUS){
 let lo=0,hi=1;
 const clip=(a,b,min,max)=>{
  const d=b-a;if(Math.abs(d)<1e-10)return a>=min&&a<=max;
  let t0=(min-a)/d,t1=(max-a)/d;if(t0>t1)[t0,t1]=[t1,t0];
  lo=Math.max(lo,t0);hi=Math.min(hi,t1);return lo<=hi;
 };
 const hx=(l.axis==='x'?l.width:l.thickness)/2+r,hz=(l.axis==='z'?l.width:l.thickness)/2+r;
 if(!Number.isFinite(l.topY)||!Number.isFinite(from.soleY)||!Number.isFinite(to.soleY))throw Error('Laser contact needs measured surface heights');
 if(!clip(from.x-old.x,to.x-pos.x,-hx,hx)||!clip(from.z-old.z,to.z-pos.z,-hz,hz)||!clip(from.soleY,to.soleY,-Infinity,l.topY+.002))return false;
 // Furniture masking can change within the overlap interval. Sample at <=1cm
 // relative motion; endpoints included, without allocations in the broad phase.
 const travel=Math.hypot(to.x-from.x,to.z-from.z)+Math.hypot(pos.x-old.x,pos.z-old.z);
 const n=Math.max(1,Math.ceil(travel*(hi-lo)/.01));
 for(let i=0;i<=n;i++){
  const t=lo+(hi-lo)*i/n,p={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t};
  if(laserContact(p,l,{x:old.x+(pos.x-old.x)*t,z:old.z+(pos.z-old.z)*t},r))return true;
 }
 return false;
}
