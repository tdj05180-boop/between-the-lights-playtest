export const ROOM={w:12,d:15,height:4.2};
export const DESKS=[[-3.2,2.5],[3.2,2.5],[-3.2,-4.1],[3.2,-4.1]];
export const PAPERS=[{id:0,x:-2.1,z:3.35,name:'거래명세서'},{id:1,x:-2.3,z:-.7,name:'세금계산서'},{id:2,x:2.3,z:-.7,name:'매입 내역'},{id:3,x:0,z:-5.3,name:'계약서'},{id:4,x:0,z:1.2,name:'통장 사본'}];
export const EXIT={x:0,z:-6.65,y:1.4};
// Span axis describes the visible beam; travel is perpendicular to it.
export const LASERS=[
 {id:0,axis:'x',x:0,z:0,width:11.4,thickness:.28,min:-5.7,max:3.7,period:11000,phase:0},
 {id:1,axis:'z',x:0,z:0,width:14.4,thickness:.28,min:-4.7,max:4.7,period:12500,phase:2.5}
];
export function laserPosition(l,ms){const n=(l.min+l.max)/2+Math.sin(ms/l.period*Math.PI*2+l.phase)*(l.max-l.min)/2;return l.axis==='x'?{x:l.x,z:n}:{x:n,z:l.z};}
// No desk-front safe zone. Only actual solid furniture interrupts the visible beam.
export const LASER_EXCLUSIONS=[
 ...DESKS.flatMap(([x,z])=>[{x,z,w:2.4,d:1.1},{x:x+(x<0?-.25:.25),z:z+.95,w:.56,d:.58}]),
 ...[-5.63,5.63].flatMap(x=>[-4.2,0,4.4].map(z=>({x,z,w:.57,d:1.25})))
];
export function laserSegments(l,pos){
 const across=l.axis==='x'?'x':'z',travel=l.axis==='x'?'z':'x';let intervals=[[pos[across]-l.width/2,pos[across]+l.width/2]];
 for(const b of LASER_EXCLUSIONS){const halfAcross=(across==='x'?b.w:b.d)/2,halfTravel=(travel==='x'?b.w:b.d)/2;
  if(Math.abs(pos[travel]-b[travel])>halfTravel+l.thickness/2)continue;
  const lo=b[across]-halfAcross,hi=b[across]+halfAcross;
  intervals=intervals.flatMap(([a,c])=>hi<=a||lo>=c?[[a,c]]:[[a,Math.min(c,lo)],[Math.max(a,hi),c]].filter(([a,c])=>c-a>.015));
 }
 return intervals.map(([a,b])=>({...pos,[across]:(a+b)/2,width:b-a}));
}
export function laserContact(p,l,pos,r=.26){return laserSegments(l,pos).some(s=>Math.abs(p.x-s.x)<=(l.axis==='x'?s.width:l.thickness)/2+r&&Math.abs(p.z-s.z)<=(l.axis==='z'?s.width:l.thickness)/2+r);}
export function sweptContact(p,l,old,pos,r=.26){const n=Math.max(1,Math.ceil(Math.hypot(pos.x-old.x,pos.z-old.z)/(l.thickness*.5)));for(let i=0;i<=n;i++){const a=i/n;if(laserContact(p,l,{x:old.x+(pos.x-old.x)*a,z:old.z+(pos.z-old.z)*a},r))return true;}return false;}
export function safeMove(p,dx,dz,canWalk){const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));for(let i=0;i<n;i++){if(canWalk(p.x+dx/n,p.z))p.x+=dx/n;if(canWalk(p.x,p.z+dz/n))p.z+=dz/n;}}
