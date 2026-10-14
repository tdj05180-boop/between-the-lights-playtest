import {T} from '../experiments/spaces/kit.js';

// Chapter-local two-bone reach; no change to the shared walking/character adapter.
const cache=new WeakMap();
function rig(a){
 if(!cache.has(a))cache.set(a,{b:Object.fromEntries(a.skeleton.bones.map(b=>[b.name,b])),target:new T.Vector3(),d:new T.Vector3(),pole:new T.Vector3(),elbow:new T.Vector3(),down:new T.Vector3(0,-1,0),q:new T.Quaternion(),rest:new T.Quaternion(),hand:new T.Vector3()});
 return cache.get(a);
}
export function deskPose(a,{amount=1,lean=.22,rootY=-.187,typing=1,time=0,keyboard}={}){
 const r=rig(a),{b}=r,L=lean*amount*typing;
 // Lean around the hips rather than tilting the whole seated body through the seat.
 b.body.rotation.set(L,0,0);b.body.position.set(0,rootY*amount+.825*(1-Math.cos(L)),-.825*Math.sin(L));
 a.object.children[0].rotation.set(0,0,0);
 for(const side of [-1,1]){
  b['hip'+side].rotation.set(-1.10*amount-L,0,0);b['knee'+side].rotation.set(1.10*amount,0,0);b['foot'+side].rotation.set(0,0,0);
  const shoulder=b['shoulder'+side],elbow=b['elbow'+side];
  shoulder.rotation.set(-.4*amount,0,side*.075*amount);elbow.rotation.set(-.12-.8*amount,0,0);
  if(typing>0&&keyboard){
   a.object.updateWorldMatrix(true,true);
   r.target.set(keyboard.x+side*.12*(keyboard.facing??1),keyboard.y+Math.sin(time*8+side*1.8)*.003,keyboard.z);
   shoulder.parent.worldToLocal(r.target);
   r.d.copy(r.target).sub(shoulder.position);const distance=Math.min(.265+.277-.001,r.d.length());r.d.normalize();
   const along=(.265**2-.277**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,.265**2-along**2));
   r.pole.set(side*.55,-1,-.12).addScaledVector(r.d,-r.pole.dot(r.d)).normalize();
   r.elbow.copy(r.d).multiplyScalar(along).addScaledVector(r.pole,height);
   r.q.setFromUnitVectors(r.down,r.elbow.clone().normalize());r.rest.copy(shoulder.quaternion);shoulder.quaternion.copy(r.q);
   // Target is now in the shoulder parent frame; convert it into the elbow parent frame.
   r.target.sub(shoulder.position).applyQuaternion(r.q.clone().invert()).sub(elbow.position).normalize();
   r.q.setFromUnitVectors(r.down,r.target);elbow.quaternion.slerp(r.q,typing);shoulder.quaternion.slerp(r.rest,1-typing);
  }
 }
 b.head.rotation.x=(.055+Math.sin(time*.6)*.012)*amount;
}
export function deskPoseMetrics(a,keyboard){
 const {b,hand}=rig(a);a.object.updateWorldMatrix(true,true);
 return [-1,1].map(side=>{hand.set(0,-.277,.008);b['elbow'+side].localToWorld(hand);return {side,hand:hand.toArray(),keyboard:[keyboard.x+side*.12*(keyboard.facing??1),keyboard.y,keyboard.z],error:hand.distanceTo(new T.Vector3(keyboard.x+side*.12*(keyboard.facing??1),keyboard.y,keyboard.z))};});
}
