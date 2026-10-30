import {T} from './geometry.js';

// Presentation only: world-space contacts supplied by the existing cargo/cart
// workflow. No change to parcel ownership, timings, paths or collision volumes.
export function workerPose(adapter){
 const object=adapter.object;let mesh;object.traverse(n=>{if(n.isSkinnedMesh&&!mesh)mesh=n;});
 const bones=mesh.skeleton.bones,map=new Map(bones.map(b=>[b.name.replace(/^mixamorig:?/,''),b])),bone=n=>map.get(n),hands=new Map();
 object.updateMatrixWorld(true);
 for(const [side,sign]of [['Left',1],['Right',-1]]){
  const hand=bone(side+'Hand'),local=n=>hand.worldToLocal(bone(side+n).getWorldPosition(new T.Vector3()));
  const contact=local('HandMiddle1').multiplyScalar(.65),finger=contact.clone().normalize(),index=local('HandIndex1'),pinky=local('HandPinky1');
  const normal=index.clone().cross(pinky).normalize(),inward=new T.Vector3(-sign,0,0).applyQuaternion(object.getWorldQuaternion(new T.Quaternion()));
  if(normal.clone().applyQuaternion(hand.getWorldQuaternion(new T.Quaternion())).dot(inward)<0)normal.negate();
  normal.addScaledVector(finger,-normal.dot(finger)).normalize();
  hands.set(side,{contact,source:new T.Matrix4().makeBasis(finger.clone().cross(normal),finger,normal)});
 }
 const wp=b=>b.getWorldPosition(new T.Vector3());
 function aim(b,child,target){object.updateMatrixWorld(true);const a=wp(b),q=new T.Quaternion().setFromUnitVectors(wp(child).sub(a).normalize(),target.clone().sub(a).normalize());b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q.multiply(b.getWorldQuaternion(new T.Quaternion()))));object.updateMatrixWorld(true);}
 function solve(upper,lower,end,target,pole){
  object.updateMatrixWorld(true);const a=wp(upper),u=a.distanceTo(wp(lower)),v=wp(lower).distanceTo(wp(end)),delta=target.clone().sub(a),d=T.MathUtils.clamp(delta.length(),Math.abs(u-v)+.0001,u+v-.0001),dir=delta.normalize(),along=(u*u-v*v+d*d)/(2*d),bend=pole.clone().sub(a);bend.addScaledVector(dir,-bend.dot(dir)).normalize();
  aim(upper,lower,a.clone().addScaledVector(dir,along).addScaledVector(bend,Math.sqrt(Math.max(0,u*u-along*along))));aim(lower,end,target);
 }
 function turn(name,angle){const b=bone(name);object.updateMatrixWorld(true);const axis=new T.Vector3(1,0,0).applyQuaternion(object.getWorldQuaternion(new T.Quaternion())),q=new T.Quaternion().setFromAxisAngle(axis,angle);b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q.multiply(b.getWorldQuaternion(new T.Quaternion()))));}
 function crouch(amount,back=.19,wide=0){
  if(amount<=0)return;object.updateMatrixWorld(true);const feet=['Left','Right'].map(s=>({s,p:wp(bone(s+'Foot')),q:bone(s+'Foot').getWorldQuaternion(new T.Quaternion())}));
  // At the low pickup the walking clip must not keep a swing foot in the air.
  const plant=T.MathUtils.smoothstep(amount,.2*(1-wide),.75-.35*wide);for(const f of feet){const local=object.worldToLocal(f.p.clone());local.lerp(new T.Vector3((f.s==='Left'?1:-1)*(.10+.16*wide),.115,.015-.075*wide),plant);f.p.copy(object.localToWorld(local));}
  // Share the reach between a hip hinge and a squat. Lowering the pelvis by
  // .77m folded the knees almost 180 degrees on this 1.75m character.
  const hip=bone('Hips'),p=object.worldToLocal(wp(hip));p.y-=amount*.52;p.z-=amount*back;hip.position.copy(hip.parent.worldToLocal(object.localToWorld(p)));turn('Spine',amount*.95);turn('Spine1',amount*.80);
  for(const f of feet){const foot=object.worldToLocal(f.p.clone());solve(bone(f.s+'UpLeg'),bone(f.s+'Leg'),bone(f.s+'Foot'),f.p,object.localToWorld(new T.Vector3(foot.x*(1-wide)+(f.s==='Left'?.55:-.55)*wide,.45,foot.z+(.75-.5*wide))));bone(f.s+'Foot').quaternion.copy(bone(f.s+'Foot').parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(f.q));}
 }
 let report=[],incoming=null,released=null;
 const capture=()=>{incoming=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));};
 function outsideLegs(point){
  // Route a reaching palm around the thighs, not through them. Work in
  // actor space so this also follows the turn back from the conveyor.
  const p=object.worldToLocal(point.clone());
  for(const side of ['Left','Right']){
   const a=object.worldToLocal(wp(bone(side+'UpLeg'))),b=object.worldToLocal(wp(bone(side+'Leg'))),ab=b.clone().sub(a);
   for(let i=0;i<4;i++){const t=T.MathUtils.clamp(p.clone().sub(a).dot(ab)/ab.lengthSq(),0,1),near=a.clone().addScaledVector(ab,t),away=p.clone().sub(near),d=away.length();if(d>=.19)break;if(d<.001)away.set(0,0,1);else away.divideScalar(d);p.addScaledVector(away,.19-d);}
  }
  return object.localToWorld(p);
 }
 function contact(side,target,{kind='parcel',blend=1}={}){
  const sign=side==='Left'?1:-1,hand=bone(side+'Hand'),h=hands.get(side),forward=kind==='cart'?new T.Vector3(0,-.85,.3).normalize():new T.Vector3(0,.10,1).normalize(),up=kind==='cart'?new T.Vector3(0,.3,.85):new T.Vector3(-sign*.18,1,0);
  up.addScaledVector(forward,-up.dot(forward)).normalize();const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(forward.clone().cross(up),forward,up).multiply(h.source.clone().invert()));q.premultiply(object.getWorldQuaternion(new T.Quaternion()));
  object.updateMatrixWorld(true);
  let reach=target;
  if(kind==='parcel'){
   reach=hand.localToWorld(h.contact.clone()).lerp(target,blend);
   const local=object.worldToLocal(reach.clone()),end=object.worldToLocal(target.clone());
   // Clear the thighs and the parcel's side before lowering under its base.
   const arc=Math.sin(Math.PI*blend);
   local.x+=sign*.10*arc;
   local.z=Math.max(local.z,end.z*blend+.48*arc);reach=object.localToWorld(local);
   q.slerpQuaternions(hand.getWorldQuaternion(new T.Quaternion()),q.clone(),blend);
   if(blend<.999)reach=outsideLegs(reach);
  }
  let wrist=reach.clone().sub(h.contact.clone().multiply(hand.getWorldScale(new T.Vector3())).applyQuaternion(q));
  const upper=bone(side+'Arm'),lower=bone(side+'ForeArm'),saved=[upper,lower,hand].map(b=>b.quaternion.clone());
  if(kind==='parcel'&&blend<.999){
   const a=wp(upper),length=a.distanceTo(wp(lower))+wp(lower).distanceTo(wp(hand))-.002;
   for(let i=0;i<3;i++){
    const delta=wrist.clone().sub(a);if(delta.length()>length)wrist.copy(a).add(delta.setLength(length));
    wrist=outsideLegs(wrist);
   }
  }
  solve(upper,lower,hand,wrist,object.localToWorld(kind==='parcel'?new T.Vector3(sign*.62,.80,.12):new T.Vector3(sign*.48,.95,.02)));
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));
  if(kind!=='parcel')[upper,lower,hand].forEach((b,i)=>b.quaternion.slerpQuaternions(saved[i],b.quaternion.clone(),blend));object.updateMatrixWorld(true);
  report.push({side,error:hand.localToWorld(h.contact.clone()).distanceTo(target),target:target.toArray(),actual:hand.localToWorld(h.contact.clone()).toArray(),shoulder:wp(upper).toArray()});
 }
 return {rememberRelease(){released=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));},release(weight){if(!released||weight<=0){released=null;return;}if(!incoming)capture();bones.forEach((b,i)=>{b.position.lerp(released[i].p,weight);b.quaternion.slerp(released[i].q,weight);});object.updateMatrixWorld(true);adapter.refreshBounds();},restore(){if(incoming){bones.forEach((b,i)=>{b.position.copy(incoming[i].p);b.quaternion.copy(incoming[i].q);});incoming=null;}},parcel(box,{kind='food',visualOffset=0,blend=1,crouch:amount=0,stance=0}={}){
  capture();report=[];crouch(amount,kind==='food'?.24:.19,stance);
  // Both the crate and the sack need the gaze ahead of the
  // lifting surface instead of letting the head inherit the full hip hinge.
  turn('Neck',-amount*.94);turn('Head',-amount*.90);
  for(const [side,sign]of [['Left',1],['Right',-1]]){
   const offset=new T.Vector3(sign*(kind==='rice'?.185:.235),visualOffset-(kind==='rice'?.095:.215)-.006,kind==='rice'?-.045:-.12).applyAxisAngle(new T.Vector3(0,1,0),object.rotation.y);
   contact(side,new T.Vector3(box.x,box.y,box.z).add(offset),{blend});
  }adapter.refreshBounds();return report;
 },cart(cart){capture();report=[];for(const [side,sign]of [['Left',1],['Right',-1]])contact(side,cart.localToWorld(new T.Vector3(-sign*.27,1.16,.5)),{kind:'cart'});adapter.refreshBounds();return report;},
 shelf(target,blend){capture();report=[];contact('Right',target,{kind:'shelf',blend});adapter.refreshBounds();return report;},snapshot:()=>report};
}


