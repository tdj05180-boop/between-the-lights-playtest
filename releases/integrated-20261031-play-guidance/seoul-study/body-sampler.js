import * as T from '../src/vendor/three.module.min.js';
import {CAPSULES} from './body-contact.js';
export function createBodySampler(avatar){
 let mesh,bones;const v=new T.Vector3();
 return ()=>{
  const m=avatar.getObjectByProperty('isSkinnedMesh',true);if(!m)throw Error('2019 character not loaded');
  if(mesh!==m){mesh=m;bones=new Map(m.skeleton.bones.map(b=>[b.name.replace(/^mixamorig:?/,''),b]));}
  avatar.updateWorldMatrix(true,true);
  const points=new Map();const get=n=>{if(!points.has(n)){const b=bones.get(n);if(!b)throw Error('Missing joint '+n);b.getWorldPosition(v);points.set(n,{x:v.x,y:v.y,z:v.z});}return points.get(n);};
  const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  const pose={x:avatar.position.x,y:avatar.position.y,z:avatar.position.z,yaw:avatar.rotation.y,capsules:CAPSULES.map(([name,from,to,r,inA,inB])=>{
   const a=get(from),b=get(to);return {name,a:mix(a,b,inA),b:mix(b,a,inB),r};
  })};
  pose.bounds={min:{x:Infinity,y:Infinity,z:Infinity},max:{x:-Infinity,y:-Infinity,z:-Infinity}};
  for(const c of pose.capsules)for(const k of ['x','y','z']){pose.bounds.min[k]=Math.min(pose.bounds.min[k],c.a[k]-c.r,c.b[k]-c.r);pose.bounds.max[k]=Math.max(pose.bounds.max[k],c.a[k]+c.r,c.b[k]+c.r);}
  return pose;
 };
}
