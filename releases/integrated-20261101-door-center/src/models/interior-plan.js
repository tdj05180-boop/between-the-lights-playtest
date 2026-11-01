// Visual upper-storey plan, in building-local metres. Ground-floor retail is excluded.
// Walls land on solid facade piers, never across an authored window opening.
export function planStorey(width,depth,windows){
 const margin=.18,wall=.12;
 function divisions(span,axis){
  const intervals=windows.filter(w=>w.axis===axis).map(w=>[w.u-w.width/2-.09,w.u+w.width/2+.09]);
  const ends=[-span/2+.3,span/2-.3,...intervals.flat()].sort((a,b)=>a-b),gaps=[];
  for(let i=1;i<ends.length;i++){const lo=Math.max(ends[i-1],-span/2+1.7),hi=Math.min(ends[i],span/2-1.7),mid=(lo+hi)/2;
   if(hi>lo&&!intervals.some(([a,b])=>mid>a&&mid<b))gaps.push([lo,hi]);
  }
  const targets=span>15?[-span/6,span/6]:[0],chosen=[];
  for(const target of targets){const candidates=gaps.map(([a,b])=>Math.max(a,Math.min(b,target))).filter(p=>chosen.every(q=>Math.abs(p-q)>2.6));candidates.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target));if(candidates.length)chosen.push(candidates[0]);}
  return chosen.sort((a,b)=>a-b);
 }
 const xs=[-width/2+margin,...divisions(width,'x'),width/2-margin],zs=[-depth/2+margin,...divisions(depth,'z'),depth/2-margin],cells=[];
 for(let iz=0;iz<zs.length-1;iz++)for(let ix=0;ix<xs.length-1;ix++)cells.push({id:ix+':'+iz,ix,iz,x0:xs[ix],x1:xs[ix+1],z0:zs[iz],z1:zs[iz+1]});
 const cellAt=(x,z)=>cells.find(c=>x>=c.x0-.25&&x<=c.x1+.25&&z>=c.z0-.25&&z<=c.z1+.25)||cells.reduce((a,b)=>Math.hypot(x-(a.x0+a.x1)/2,z-(a.z0+a.z1)/2)<Math.hypot(x-(b.x0+b.x1)/2,z-(b.z0+b.z1)/2)?a:b);
 return {xs,zs,cells,wall,cellAt};
}
// Room state is keyed by physical suite, not facade or individual pane.
export function suiteLighting(seed,storey,cell){
 const n=Math.sin(seed*127.1+storey*311.7+cell.ix*74.7+cell.iz*173.3)*43758.5453,r=n-Math.floor(n);
 return {lit:r>.32,strength:r>.32?.52+(Math.floor(r*13)%3)*.035:.075,warm:(seed+storey+cell.ix+cell.iz)%3!==0};
}
