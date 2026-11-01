// Test-only collision. Geometry stays in the production car generator.
// Rounded character capsules replace the old 86cm square expansion.
export const CAPSULES=[
 ['torso','Hips','Neck',.185,.10,.10],
 ['head','Head','HeadTop_End',.105,.38,.40],
 ...['Left','Right'].flatMap(s=>[
  [s+' thigh',s+'UpLeg',s+'Leg',.085,.08,.10],
  [s+' shin',s+'Leg',s+'Foot',.065,.08,.08],
  [s+' shoe',s+'Foot',s+'ToeBase',.055,.12,-.24],
  [s+' upper arm',s+'Arm',s+'ForeArm',.055,.12,.10],
  [s+' forearm',s+'ForeArm',s+'Hand',.045,.10,.08]
 ])
];
const smooth=(a,b,t)=>{t=Math.max(0,Math.min(1,(t-a)/(b-a)));return t*t*(3-2*t);};
export function carParts(estate=false){
 const parts=[],box=(name,x0,x1,y0,y1,z0,z1)=>parts.push({name,min:{x:x0*1.075,y:y0+.13,z:z0},max:{x:x1*1.075,y:y1+.13,z:z1}});
 // Actual sculptedCar dimensions. Fine X slices follow the tapered hood/body.
 for(let i=0;i<20;i++){
  const a=-2+i*.2,b=a+.2,x=Math.abs(a)<Math.abs(b)?a:b,w=.795-.115*(Math.abs(x)/2)**5;
  const top=.976-.105*(Math.abs(x)/2)**3,bottom=.205+.135*smooth(1.60,2,Math.abs(x));
  box('body',a,b,bottom,top,-w,w);
 }
 // Roof is lower than the head but higher than the hood. No infinite-height wall.
 const rear=estate?-1.48:-1.31,roofRear=estate?-.99:-.72;
 const top=x=>x<roofRear?.965+.391*smooth(rear,roofRear,x):x>.25?1.356-.366*smooth(.25,.94,x):1.356+.020*Math.sin((x-roofRear)/(.25-roofRear)*Math.PI);
 for(let i=0;i<12;i++){
  const a=rear+(.94-rear)*i/12,b=rear+(.94-rear)*(i+1)/12,h=Math.max(top(a),top(b),top((a+b)/2))+.025;
  for(let j=0;j<4;j++){const y0=.96+(h-.96)*j/4,y1=.96+(h-.96)*(j+1)/4,w=.746-(y0-.95)*.335;box('cabin',a,b,y0,y1,-w,w);}
 }
 for(const s of [-1,1]){
  box('mirror',.4525,.7075,.961,1.073,s*.849-.08,s*.849+.08);
  for(const x of [-1.22,1.22])box('wheel',x-.32,x+.32,.015,.675,s*.635-.105,s*.635+.105);
 }
 box('front bumper',2,2.055,.45,.58,-.61,.61);
 box('rear bumper',-2.05,-2,.45,.58,-.61,.61);
 return parts;
}
const shapes=[carParts(false),carParts(true)];
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
// Exact minimum distance from line segment to AABB: piecewise quadratic.
export function segmentBoxDistance2(a,b,box){
 const cuts=[0,1],d={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
 for(const k of ['x','y','z'])if(Math.abs(d[k])>1e-10)for(const edge of [box.min[k],box.max[k]]){const t=(edge-a[k])/d[k];if(t>0&&t<1)cuts.push(t);}
 cuts.sort((a,b)=>a-b);let best=Infinity;
 const at=t=>{let sum=0;for(const k of ['x','y','z']){const p=a[k]+d[k]*t,e=Math.max(box.min[k]-p,0,p-box.max[k]);sum+=e*e;}return sum;};
 for(let i=0;i<cuts.length-1;i++){
  const lo=cuts[i],hi=cuts[i+1],mid=(lo+hi)/2;let aa=0,ab=0;
  for(const k of ['x','y','z']){const p=a[k]+d[k]*mid,e=p<box.min[k]?box.min[k]:p>box.max[k]?box.max[k]:null;if(e!==null){aa+=d[k]*d[k];ab+=d[k]*(a[k]-e);}}
  const t=aa?Math.max(lo,Math.min(hi,-ab/aa)):mid;best=Math.min(best,at(lo),at(hi),at(t));
 }return best;
}
export function vehicleContact(previous,current,car){
 if(!previous?.capsules||!current?.capsules)throw Error('Missing body pose');
 // Moving local frame, including reverse-direction traffic. Wraps use previousX=x.
 const sign=car.dir??1,prevX=car.previousX??car.x;
 if(previous.bounds&&current.bounds){
  const a=previous.bounds,b=current.bounds;
  if(Math.min(a.min.x-prevX,b.min.x-car.x)>2.22||Math.max(a.max.x-prevX,b.max.x-car.x)<-2.22||Math.min(a.min.z,b.min.z)-car.z>.95||Math.max(a.max.z,b.max.z)-car.z<-.95||Math.min(a.min.y,b.min.y)>1.55||Math.max(a.max.y,b.max.y)<.13)return null;
 }
 const local=(p,x)=>({x:(p.x-x)*sign,y:p.y,z:(p.z-car.z)*sign});
 let earliest=null,partName=null,bodyName=null;
 for(let i=0;i<current.capsules.length;i++){
  const c=current.capsules[i],p=previous.capsules[i],a0=local(p.a,prevX),b0=local(p.b,prevX),a1=local(c.a,car.x),b1=local(c.b,car.x),r=c.r;
  const min={},max={};for(const k of ['x','y','z']){min[k]=Math.min(a0[k],b0[k],a1[k],b1[k])-r;max[k]=Math.max(a0[k],b0[k],a1[k],b1[k])+r;}
  if(min.x>2.22||max.x< -2.22||min.z>.95||max.z<-.95||min.y>1.55||max.y<.13)continue;
  const parts=shapes[car.variant===3?1:0].filter(b=>['x','y','z'].every(k=>min[k]<=b.max[k]&&max[k]>=b.min[k]));if(!parts.length)continue;
  const travel=Math.max(Math.hypot(a1.x-a0.x,a1.y-a0.y,a1.z-a0.z),Math.hypot(b1.x-b0.x,b1.y-b0.y,b1.z-b0.z));
  const steps=Math.max(1,Math.ceil(travel/.015));
  for(let n=0;n<=steps;n++){
   const t=n/steps;if(earliest!==null&&t>=earliest)break;
   const a=lerp(a0,a1,t),b=lerp(b0,b1,t),hit=parts.find(box=>segmentBoxDistance2(a,b,box)<=r*r);
   if(hit){let lo=Math.max(0,(n-1)/steps),hi=t;for(let j=0;j<7;j++){const m=(lo+hi)/2;if(segmentBoxDistance2(lerp(a0,a1,m),lerp(b0,b1,m),hit)<=r*r)hi=m;else lo=m;}earliest=hi;partName=hit.name;bodyName=c.name;break;}
  }
 }
 return earliest===null?null:{t:earliest,part:partName,body:bodyName};
}
