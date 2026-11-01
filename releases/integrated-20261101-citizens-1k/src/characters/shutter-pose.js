import * as T from '../vendor/three.module.min.js';

// Presentation-only IK. The caller supplies the actual rolling rail height and
// the minigame's confirmed closing flag, never an estimated failure threshold.
export function createLiftPose(adapter){
 const object=adapter.object;let mesh;object.traverse(n=>{if(n.isSkinnedMesh&&!mesh)mesh=n;});
 const bones=mesh.skeleton.bones,map=new Map(bones.map(b=>[b.name.replace(/^mixamorig:?/,''),b])),bone=n=>map.get(n);
 for(const n of ['Hips','Spine','Spine1','Neck',...['Left','Right'].flatMap(s=>['UpLeg','Leg','Foot','Arm','ForeArm','Hand','HandMiddle1','HandIndex1','HandPinky1'].map(n=>s+n))])if(!bone(n))throw Error('Shutter pose needs joint '+n);
 const saved=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));mesh.skeleton.pose();object.updateMatrixWorld(true);
 const bind=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),feet=new Map(),hands=new Map();
 const worldQ=()=>object.getWorldQuaternion(new T.Quaternion()),local=b=>object.worldToLocal(b.getWorldPosition(new T.Vector3()));
 for(const [side,sign] of [['Left',1],['Right',-1]]){
  const f=bone(side+'Foot');feet.set(side,{p:local(f),q:worldQ().invert().multiply(f.getWorldQuaternion(new T.Quaternion()))});
  const h=bone(side+'Hand'),v=n=>h.worldToLocal(bone(side+n).getWorldPosition(new T.Vector3()));
  const forward=v('HandMiddle1').normalize(),normal=v('HandIndex1').cross(v('HandPinky1')).normalize();
  if(normal.clone().applyQuaternion(h.getWorldQuaternion(new T.Quaternion())).dot(new T.Vector3(-sign,0,0).applyQuaternion(worldQ()))<0)normal.negate();
  normal.addScaledVector(forward,-normal.dot(forward)).normalize();
  const source=new T.Matrix4().makeBasis(forward.clone().cross(normal),forward,normal),finger=new T.Vector3(0,.12,1).normalize(),up=new T.Vector3(0,1,-.12).normalize();
  const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(finger.clone().cross(up),finger,up).multiply(source.invert()));
  hands.set(side,{q,contact:v('HandMiddle1').multiplyScalar(.75)});
 }
 bones.forEach((b,i)=>{b.position.copy(saved[i].p);b.quaternion.copy(saved[i].q);});
 function orient(b,q){object.updateMatrixWorld(true);b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(worldQ().multiply(q)));}
 function turn(name,angle){const b=bone(name);object.updateMatrixWorld(true);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0).applyQuaternion(worldQ()),angle);b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q.multiply(b.getWorldQuaternion(new T.Quaternion()))));}
 function aim(b,child,target){object.updateMatrixWorld(true);const p=b.getWorldPosition(new T.Vector3()),q=new T.Quaternion().setFromUnitVectors(child.getWorldPosition(new T.Vector3()).sub(p).normalize(),target.clone().sub(p).normalize());b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q.multiply(b.getWorldQuaternion(new T.Quaternion()))));}
 function solve(u,l,e,target,pole){object.updateMatrixWorld(true);const p=u.getWorldPosition(new T.Vector3()),a=p.distanceTo(l.getWorldPosition(new T.Vector3())),b=l.getWorldPosition(new T.Vector3()).distanceTo(e.getWorldPosition(new T.Vector3())),dir=target.clone().sub(p),d=T.MathUtils.clamp(dir.length(),Math.abs(a-b)+1e-5,a+b-1e-5);dir.normalize();const perpendicular=pole.clone().sub(p);perpendicular.addScaledVector(dir,-perpendicular.dot(dir)).normalize();const x=(a*a-b*b+d*d)/(2*d),elbow=p.clone().addScaledVector(dir,x).addScaledVector(perpendicular,Math.sqrt(Math.max(0,a*a-x*x)));aim(u,l,elbow);aim(l,e,target);}
 const smooth=(x,a=0,b=1)=>T.MathUtils.smoothstep(x,a,b);let report={};
 function apply({railY=.265,blend=1,release=0,releaseRailY=railY,time=0}={}){
  const incoming=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
  bones.forEach((b,i)=>{b.position.copy(bind[i].p);b.quaternion.copy(bind[i].q);});object.updateMatrixWorld(true);
  const rise=smooth((release>0?releaseRailY:railY)-object.getWorldPosition(new T.Vector3()).y,.17,1.45),recover=smooth(release,.18,.75);
  const hip=bone('Hips'),hipHeight=T.MathUtils.lerp(.25,.94,rise),lean=T.MathUtils.lerp(1.05,.06,rise);
  hip.position.copy(hip.parent.worldToLocal(object.localToWorld(new T.Vector3(0,T.MathUtils.lerp(hipHeight,.94,recover),-.055))));
  turn('Spine',lean*.55*(1-recover));turn('Spine1',lean*.45*(1-recover));turn('Neck',-lean*.30*(1-recover));
  for(const [side,sign]of [['Left',1],['Right',-1]]){
   const f=feet.get(side),footTarget=object.localToWorld(new T.Vector3(sign*.125,f.p.y,sign===1?.10:-.045));
   solve(bone(side+'UpLeg'),bone(side+'Leg'),bone(side+'Foot'),footTarget,object.localToWorld(new T.Vector3(sign*.24,.48,.5)));orient(bone(side+'Foot'),f.q);
  }
  const errors=[];
  for(const [side,sign]of [['Left',1],['Right',-1]]){
   const h=hands.get(side),hand=bone(side+'Hand'),q=worldQ().multiply(h.q),contact=new T.Vector3(-sign*.21,(release>0?releaseRailY:railY)-.025,-.50);
   // Targets are in world space: the bottom rail is never inferred from effort.
   // Release retracts toward the body immediately, only after closing is true.
   const retreat=release>0?1-Math.exp(-release*30):0;
   contact.z+=retreat*.35;contact.y=T.MathUtils.lerp(contact.y,object.getWorldPosition(new T.Vector3()).y+.93,smooth(release,.16,.65));
   const scale=hand.getWorldScale(new T.Vector3()),offset=h.contact.clone().multiply(scale).applyQuaternion(q),wrist=contact.clone().sub(offset);
   solve(bone(side+'Arm'),bone(side+'ForeArm'),hand,wrist,object.localToWorld(new T.Vector3(sign*.38,T.MathUtils.lerp(.48,1.18,rise),.10)));
   orient(hand,h.q);object.updateMatrixWorld(true);const actual=hand.localToWorld(h.contact.clone());errors.push({side,error:actual.distanceTo(contact),target:contact.toArray(),actual:actual.toArray()});
   const hem=bone('cloth'+side+'Hem');if(hem)hem.quaternion.copy(bone(side+'UpLeg').quaternion);
  }
  const mix=blend*(1-smooth(release,.68,1.05));bones.forEach((b,i)=>{b.position.lerpVectors(incoming[i].p,b.position.clone(),mix);b.quaternion.slerpQuaternions(incoming[i].q,b.quaternion.clone(),mix);});object.updateMatrixWorld(true);
  report={railY,release,attached:release===0&&blend===1,blend:mix,hands:errors};return report;
 }
 return {apply,snapshot:()=>report};
}
