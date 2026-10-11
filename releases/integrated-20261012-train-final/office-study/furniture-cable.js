import {T} from '../experiments/spaces/kit.js';

// 2019-local copy: preserve rounded, non-overshooting routes.
// Keep the existing socket anchors and clearance route. Convex corner blends
// avoid Catmull-Rom overshoot into the desktop, tower or rear modesty panel.
export function cablePath(points){
 const pts=points.map(p=>new T.Vector3(...p)),curve=new T.CurvePath();
 const seed=Math.abs(pts[0].x*1.7+pts[0].z*2.3),softness=.10+(seed%1)*.045;
 const span=(a,b)=>{
  if(a.distanceToSquared(b)<1e-10)return;
  const u=a.clone().lerp(b,1/3),v=a.clone().lerp(b,2/3);
  // Gravity on free, mostly horizontal spans. Floor leads stay above the floor;
  // near-vertical drops retain their rear-edge clearance and socket tangents.
  const horizontal=Math.hypot(b.x-a.x,b.z-a.z),vertical=Math.abs(b.y-a.y);
  const sag=horizontal>vertical*1.8?Math.min(.045,horizontal*(.07+seed%1*.025),Math.max(0,Math.min(a.y,b.y)-.151)):0;
  u.y-=sag;v.y-=sag;
  curve.add(new T.CubicBezierCurve3(a,u,v,b));
 };
 let from=pts[0];
 for(let i=1;i<pts.length-1;i++){
  const q=pts[i],before=pts[i-1],after=pts[i+1],l=q.distanceTo(before),r=q.distanceTo(after);
  if(l<1e-6||r<1e-6)continue;
  const radius=Math.min(softness,l*.38,r*.38),a=q.clone().lerp(before,radius/l),b=q.clone().lerp(after,radius/r);
  span(from,a);curve.add(new T.QuadraticBezierCurve3(a,q,b));from=b;
 }
 span(from,pts.at(-1));return curve;
}
