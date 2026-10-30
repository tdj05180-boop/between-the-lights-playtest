import * as T from '../vendor/three.module.min.js';
// Presentation adapter for the supplied Tripo skeleton; game seating timing stays unchanged.
export function attachSeating(a,{hipHeight=.62}={}){
 let mesh;a.object.traverse(n=>{if(n.isSkinnedMesh&&!mesh)mesh=n;});
 const tuck=mesh.morphTargetDictionary?.SeatedShirtTuck,update=a.update;
 a.update=(...args)=>{if(tuck!==undefined)mesh.morphTargetInfluences[tuck]=0;return update(...args);};
 const bones=mesh.skeleton.bones,map=new Map(bones.map(b=>[b.name.replace(/^mixamorig:?/,''),b])),bone=n=>map.get(n),object=a.object;
 const saved=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));mesh.skeleton.pose();object.updateMatrixWorld(true);
 const bind=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()})),feet=new Map(),palms=new Map();
 for(const [side,sign]of [['Left',1],['Right',-1]]){
  const foot=bone(side+'Foot'),footLocal=object.worldToLocal(foot.getWorldPosition(new T.Vector3()));
  // An exported rig's bind sole is not necessarily at local Y=0. Measure the
  // shoe surface instead of treating the ankle's bind height as ground clearance.
  mesh.skeleton.update();let sole=Infinity;const v=new T.Vector3(),skin=mesh.geometry.attributes.skinIndex,weight=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<mesh.geometry.attributes.position.count;i++){
   let influence=0;for(let j=0;j<4;j++){const b=bones[skin.getComponent(i,j)];if(b&&b.name.replace(/^mixamorig:?/,'').startsWith(side)&&/Foot|Toe/.test(b.name))influence+=weight.getComponent(i,j);}
   if(influence<.5)continue;mesh.getVertexPosition(i,v);mesh.localToWorld(v);object.worldToLocal(v);sole=Math.min(sole,v.y);
  }
  feet.set(side,{q:object.getWorldQuaternion(new T.Quaternion()).invert().multiply(foot.getWorldQuaternion(new T.Quaternion())),offset:footLocal.y-(Number.isFinite(sole)?sole:0)});
  const h=bone(side+'Hand'),local=n=>h.worldToLocal(bone(side+n).getWorldPosition(new T.Vector3())),f=local('HandMiddle1').normalize(),normal=local('HandIndex1').cross(local('HandPinky1')).normalize();
  if(normal.clone().applyQuaternion(h.getWorldQuaternion(new T.Quaternion())).x*sign>0)normal.negate();normal.addScaledVector(f,-normal.dot(f)).normalize();
  const source=new T.Matrix4().makeBasis(f.clone().cross(normal),f,normal),forward=new T.Vector3(0,-.10,1).normalize(),down=new T.Vector3(0,-1,-.10).normalize(),dest=new T.Matrix4().makeBasis(forward.clone().cross(down),forward,down);
  palms.set(side,new T.Quaternion().setFromRotationMatrix(dest.multiply(source.invert())));
 }
 bones.forEach((b,i)=>{b.position.copy(saved[i].p);b.quaternion.copy(saved[i].q);});
 function orient(b,q){object.updateMatrixWorld(true);b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(object.getWorldQuaternion(new T.Quaternion()).multiply(q)));}
 function turn(name,angle){const b=bone(name);object.updateMatrixWorld(true);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0).applyQuaternion(object.getWorldQuaternion(new T.Quaternion())),angle);b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q.multiply(b.getWorldQuaternion(new T.Quaternion()))));}
 function aim(b,child,target){object.updateMatrixWorld(true);const p=b.getWorldPosition(new T.Vector3()),q=new T.Quaternion().setFromUnitVectors(child.getWorldPosition(new T.Vector3()).sub(p).normalize(),target.clone().sub(p).normalize());b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q.multiply(b.getWorldQuaternion(new T.Quaternion()))));}
 function solve(u,l,e,localTarget,localPole){object.updateMatrixWorld(true);const p=u.getWorldPosition(new T.Vector3()),q=l.getWorldPosition(new T.Vector3()),r=e.getWorldPosition(new T.Vector3()),target=object.localToWorld(localTarget.clone()),pole=object.localToWorld(localPole.clone()).sub(p),aLen=p.distanceTo(q),bLen=q.distanceTo(r),dir=target.clone().sub(p),d=T.MathUtils.clamp(dir.length(),Math.abs(aLen-bLen)+.0001,aLen+bLen-.0001);dir.normalize();pole.addScaledVector(dir,-pole.dot(dir)).normalize();const x=(aLen*aLen-bLen*bLen+d*d)/(2*d),bend=p.clone().addScaledVector(dir,x).addScaledVector(pole,Math.sqrt(Math.max(0,aLen*aLen-x*x)));aim(u,l,bend);aim(l,e,target);}
 a.skeleton=mesh.skeleton;
 a.deskPose=({amount=1,typing=1,time=0,keyboard,lean=.15,train=false}={})=>{
  if(tuck!==undefined)mesh.morphTargetInfluences[tuck]=T.MathUtils.smoothstep(amount,0,1);
  if(amount<=0)return;
  object.updateMatrixWorld(true);const footFrom=new Map(['Left','Right'].map(side=>[side,object.worldToLocal(bone(side+'Foot').getWorldPosition(new T.Vector3()))]));
  const from=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));bones.forEach((b,i)=>{b.position.copy(bind[i].p);b.quaternion.copy(bind[i].q);});object.updateMatrixWorld(true);
  const hip=bone('Hips'),target=object.localToWorld(new T.Vector3(0,hipHeight,train?.075:.07));hip.position.copy(hip.parent.worldToLocal(target));turn('Spine',(train?-.16:lean*typing)*.65);turn('Spine1',(train?-.16:lean*typing)*.35);turn('Neck',train?.08:-.055*typing);
  for(const [side,sign]of [['Left',1],['Right',-1]]){
   const foot=bone(side+'Foot'),f=feet.get(side);solve(bone(side+'UpLeg'),bone(side+'Leg'),foot,new T.Vector3(sign*.12,f.offset+(train?.09:0),.52),new T.Vector3(sign*.14,.54,.65));orient(foot,f.q);
   const restTarget=new T.Vector3(sign*(train?.13:.16),train?.68:.73,train?.20:.30),key=keyboard?object.worldToLocal(new T.Vector3(keyboard.x,keyboard.y+.012+Math.sin(time*8+sign)*.002,keyboard.z)).add(new T.Vector3(sign*.12,0,-.10)):restTarget.clone();
   const wrist=restTarget.lerp(key,typing);solve(bone(side+'Arm'),bone(side+'ForeArm'),bone(side+'Hand'),wrist,new T.Vector3(sign*(train?.235:.34),train?.71:.85,train?-.035:.04));orient(bone(side+'Hand'),palms.get(side));
   const hem=bone('cloth'+side+'Hem');if(hem)hem.quaternion.copy(bone(side+'UpLeg').quaternion);
  }
  if(train)bone('Head').rotateY(-.10+Math.sin(time*.38)*.02);
  bones.forEach((b,i)=>{b.position.lerpVectors(from[i].p,b.position.clone(),amount);b.quaternion.slerpQuaternions(from[i].q,b.quaternion.clone(),amount);});object.updateMatrixWorld(true);
  // Interpolating the hip height and joint rotations alone sinks the feet midway.
  // Keep both soles at the floor throughout sit/stand, then solve each knee to them.
  for(const [side,sign]of [['Left',1],['Right',-1]]){const f=feet.get(side),target=footFrom.get(side).clone().lerp(new T.Vector3(sign*.12,f.offset+(train?.09:0),.52),amount);target.y=f.offset+(train?.09:0);solve(bone(side+'UpLeg'),bone(side+'Leg'),bone(side+'Foot'),target,new T.Vector3(sign*.14,.54,.65));orient(bone(side+'Foot'),f.q);const hem=bone('cloth'+side+'Hem');if(hem)hem.quaternion.copy(bone(side+'UpLeg').quaternion);}
  object.updateMatrixWorld(true);a.refreshBounds?.();
 };
 a.deskPoseMetrics=keyboard=>['Left','Right'].map((side,i)=>{const h=bone(side+'Hand').getWorldPosition(new T.Vector3()),t=object.localToWorld(object.worldToLocal(new T.Vector3(keyboard.x,keyboard.y+.012,keyboard.z)).add(new T.Vector3(i?-.12:.12,0,-.10)));return{side,hand:h.toArray(),keyboard:t.toArray(),error:h.distanceTo(t)};});
 let trainPose=null,trainRoots=null;
 a.trainSeatPose=t=>{
  if(!trainPose){
   a.deskPose({time:0,typing:0,train:true});trainPose=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
   trainRoots=[];for(let n=bone('Hips').parent;n&&n!==object;n=n.parent)if(!n.isBone)trainRoots.push({node:n,p:n.position.clone(),q:n.quaternion.clone(),s:n.scale.clone()});
  }
  // The passenger's seat contact is fixed. Restore that same solved pose without
  // repeating twelve inverse-kinematics passes every rendered frame.
  // The locomotion adapter recenters its model wrapper before this call. Cached
  // bone coordinates alone therefore drift with the idle clip's root motion.
  for(const r of trainRoots){r.node.position.copy(r.p);r.node.quaternion.copy(r.q);r.node.scale.copy(r.s);}
  bones.forEach((b,i)=>{b.position.copy(trainPose[i].p);b.quaternion.copy(trainPose[i].q);});
  bone('Head').rotateY(Math.sin(t*.38)*.02);object.updateMatrixWorld(true);a.finalizeTrainClothing?.();a.refreshBounds?.();
 };
 a.approachPose=dt=>a.update({dt,speed:1});
 return a;
}




