import * as T from '../vendor/three.module.min.js';
import {GLTFLoader} from '../vendor/addons/loaders/GLTFLoader.js';
import {clone} from '../vendor/addons/utils/SkeletonUtils.js';
export const CARRY_SUPPORT={anchorY:1.065,anchorZ:.44,wristY:1.0,wristZ:.28,wristX:.326};
export const RICE_SUPPORT={anchorY:1.22,anchorZ:.30,wristY:.98,wristZ:.23,wristX:.18};
export const MIXED_RICE_SUPPORT={anchorY:1.268,anchorZ:.44,wristY:1.02,wristZ:.37,wristX:.18};
export const cargoSupport=(kind,stack=[])=>kind==='rice'?(stack.slice(1).includes('food')?MIXED_RICE_SUPPORT:RICE_SUPPORT):CARRY_SUPPORT;
export const prepare=url=>new GLTFLoader().loadAsync(url);
export function rig(gltf,{height=1.75,female=false,workMask=null,shoulderFit=true,locomotionPresentation=true}={}){
 const object=new T.Group(),offset=new T.Group(),model=clone(gltf.scene);object.add(offset);offset.add(model);object.name=female?'TripoCitizenB65':'TripoHeroA65';model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),scale=height/(box.max.y-box.min.y),center=box.getCenter(new T.Vector3());offset.scale.setScalar(scale);offset.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
 const meshes=[];model.traverse(n=>{if(n.isMesh){n.geometry=n.geometry.clone();n.material=n.material.clone();n.castShadow=n.receiveShadow=true;if(n.isSkinnedMesh){n.computeBoundingSphere();n.boundingSphere.radius*=1.85;}n.frustumCulled=true;meshes.push(n);}});
 if(workMask)for(const m of meshes){const mask=Float32Array.from(workMask,id=>id===30785?1:id===25486?2:0);m.geometry.setAttribute('workRegion',new T.BufferAttribute(mask,1));m.material.onBeforeCompile=s=>{s.vertexShader='attribute float workRegion; varying float vWorkRegion;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWorkRegion=workRegion;');s.fragmentShader='varying float vWorkRegion;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 if(vWorkRegion>0.5 && vWorkRegion<1.5){float g=diffuseColor.g;float mask=smoothstep(0.025,0.12,(g-diffuseColor.r)/max(g,0.001));float lum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(diffuseColor.rgb,lum*vec3(.72,.94,1.18),mask);}
 if(vWorkRegion>1.5){float lum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=lum*vec3(.65,.71,.79);}`);};m.material.customProgramCacheKey=()=> 'warehouse-workwear-v1';}
 const bones=meshes[0].skeleton.bones,boneMap=new Map(bones.map(b=>[b.name.replace(/^mixamorig:?/,''),b])),bone=name=>boneMap.get(name),hip=bone('Hips'),clips=gltf.animations.map(c=>c.clone()),finger=/Hand(?:Thumb|Index|Middle|Ring|Pinky)/;
 // Keep the supplied relaxed finger pose: the generated finger web topology tears under individual finger motion.
 for(const c of clips)c.tracks=c.tracks.filter(t=>!finger.test(t.name));
 const shoulderRest=new Map();for(const side of ['Left','Right']){const clavicle=bone(side+'Shoulder'),arm=bone(side+'Arm');if(!clavicle||!arm)continue;const d=arm.position.clone().applyQuaternion(clavicle.quaternion);shoulderRest.set(side,Math.atan2(d.y,Math.hypot(d.x,d.z)));}
 function fitShoulders(weight=1){if(!shoulderFit||weight<.001)return;for(const [side,base]of shoulderRest){const clavicle=bone(side+'Shoulder'),arm=bone(side+'Arm'),v=arm.position.clone().applyQuaternion(clavicle.quaternion).normalize(),angle=Math.atan2(v.y,Math.hypot(v.x,v.z)),drop=angle-base;if(drop>-.035)continue;const target=angle-drop*.78*weight,h=Math.hypot(v.x,v.z),w=new T.Vector3(v.x/h*Math.cos(target),Math.sin(target),v.z/h*Math.cos(target)),q=new T.Quaternion().setFromUnitVectors(v,w),old=clavicle.quaternion.clone(),armParentQ=old.clone().multiply(arm.quaternion);clavicle.quaternion.premultiply(q);arm.quaternion.copy(clavicle.quaternion.clone().invert().multiply(armParentQ));}}
 const hemSupport=['Left','Right'].map(side=>{const leg=bone(side+'UpLeg'),child=bone(side+'Leg'),hem=bones.find(b=>b.name.replace(':','')==='cloth'+side+'Hem');return hem?{leg,hem,rest:hem.quaternion.clone(),dir:child.position.clone()}:null;}).filter(Boolean);
 function syncHem(){for(const h of hemSupport){const base=h.dir.clone().applyQuaternion(h.rest).normalize(),v=h.dir.clone().applyQuaternion(h.leg.quaternion).normalize(),t=T.MathUtils.smoothstep(v.z-base.z,-.02,.14);h.hem.quaternion.copy(h.rest).slerp(h.leg.quaternion,t);}}
 const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(clips.map(c=>[c.name.split('.')[0],mixer.clipAction(c)]));let current='idle',speed=0,last='idle',transitions=0;actions.idle.play();
 const nominal={};for(const c of clips){const track=c.tracks.find(t=>/Hips.*position/.test(t.name));if(track){const v=track.values,n=v.length;nominal[c.name.split('.')[0]]=Math.hypot(v[n-3]-v[0],v[n-1]-v[2])*scale/c.duration;}}
 const bounds=meshes.filter(m=>m.isSkinnedMesh).map(m=>({mesh:m,center:m.boundingSphere.center.clone(),hip:m.worldToLocal(hip.getWorldPosition(new T.Vector3()))}));
 const boundPoint=new T.Vector3();function updateBounds(){for(const b of bounds){b.mesh.worldToLocal(hip.getWorldPosition(boundPoint));b.mesh.boundingSphere.center.copy(b.center).add(boundPoint).sub(b.hip);}}
 const p=new T.Vector3();function centerRoot(){object.updateMatrixWorld(true);hip.getWorldPosition(p);object.worldToLocal(p);offset.position.x-=p.x;offset.position.z-=p.z;object.updateMatrixWorld(true);updateBounds();}
 mixer.update(0);centerRoot();const rest=bones.map(b=>({q:b.quaternion.clone(),p:b.position.clone()}));let airborne=false,jumpHeight=0,lastHeight=0,landing=0,carry=0,airPhase='ground',airFrames=0,landings=0,jumpCarrying=false,jumpKind='standing',lead='Left',airTime=0,takeoffPose=rest.map(x=>x.q.clone()),lastAirPose=rest.map(x=>x.q.clone());
 // Estimate stance from sole/toe height and backward motion in character space.
 // During a running flight phase retain the last confirmed support, not the forward foot.
 const stanceCeiling=Math.min(...['Left','Right'].map(side=>object.worldToLocal((bone(side+'ToeBase')??bone(side+'Foot')).getWorldPosition(new T.Vector3())).y))+.065;
 let support='Left',supportConfirmed=false,supportSamples=null,takeoffSupport='Both',supportReason='initial';
 function sampleSupport(dt){
  object.updateMatrixWorld(true);const samples={};
  for(const side of ['Left','Right']){const f=object.worldToLocal(bone(side+'Foot').getWorldPosition(new T.Vector3())),toe=bone(side+'ToeBase'),t=toe?object.worldToLocal(toe.getWorldPosition(new T.Vector3())):f;
   samples[side]={height:Math.min(f.y,t.y),z:f.z,backward:supportSamples?(supportSamples[side].z-f.z)/dt:0};}
  const lower=samples.Left.height<=samples.Right.height?'Left':'Right',other=lower==='Left'?'Right':'Left',a=samples[lower],b=samples[other];
  if(!supportConfirmed){support=lower;supportReason='lowest foot fallback';}
  // A planted foot moves backward relative to the advancing hips. The height
  // difference rejects a swinging foot; hysteresis bridges double support/flight.
  const candidate=['Left','Right'].filter(side=>samples[side].backward>.12&&samples[side].height<stanceCeiling&&samples[side].height<Math.min(a.height,b.height)+.045).sort((x,y)=>(samples[x].height-samples[x].backward*.025)-(samples[y].height-samples[y].backward*.025))[0];
  if(candidate){support=candidate;supportConfirmed=true;supportReason='low foot moving backward';}
  else if(a.height<stanceCeiling&&a.height+.055<b.height&&a.backward>-.05){support=lower;supportConfirmed=true;supportReason='lower stance foot';}
  supportSamples=samples;
 }
 function rotate(name,angle){const b=bone(name);if(!b)return;object.updateMatrixWorld(true);const axis=new T.Vector3(1,0,0).applyQuaternion(object.getWorldQuaternion(new T.Quaternion())),delta=new T.Quaternion().setFromAxisAngle(axis,angle),world=b.getWorldQuaternion(new T.Quaternion()),parent=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(parent.invert().multiply(delta.multiply(world)));}
 // Hold orientation is character-local, so locomotion wrist tracks cannot wobble
 // against a box fixed to the same avatar. Finger bind pose is preserved.
 let cargoKind="food",cargoStack=[];const palmAxes=new Map(),holdOrientations=new Map();
 for(const [side,sign]of [['Left',1],['Right',-1]]){
  const hand=bone(side+'Hand'),local=n=>hand.worldToLocal(bone(side+n).getWorldPosition(new T.Vector3()));
  const finger=local('HandMiddle1').normalize(),index=local('HandIndex1'),pinky=local('HandPinky1');
  let normal=index.clone().cross(pinky).normalize();const world=normal.clone().applyQuaternion(hand.getWorldQuaternion(new T.Quaternion())),inward=new T.Vector3(-sign,0,0).applyQuaternion(object.getWorldQuaternion(new T.Quaternion()));if(world.dot(inward)<0)normal.negate();
  normal.addScaledVector(finger,-normal.dot(finger)).normalize();const across=finger.clone().cross(normal).normalize(),source=new T.Matrix4().makeBasis(across,finger,normal);palmAxes.set(side,normal);
  for(const kind of ['food','rice']){const forward=(kind==='rice'?new T.Vector3(-sign*.1,-.3,1):new T.Vector3(0,-.80,.60)).normalize(),up=kind==='rice'?new T.Vector3(0,1,0):new T.Vector3(-sign,.30,.25);up.addScaledVector(forward,-up.dot(forward)).normalize();const target=new T.Matrix4().makeBasis(forward.clone().cross(up),forward,up);holdOrientations.set(kind+side,new T.Quaternion().setFromRotationMatrix(target.multiply(source.clone().invert())));}
 }
 function aim(b,child,target){object.updateMatrixWorld(true);const a=b.getWorldPosition(new T.Vector3()),v=child.getWorldPosition(new T.Vector3()).sub(a).normalize(),w=target.clone().sub(a).normalize(),q=new T.Quaternion().setFromUnitVectors(v,w),world=b.getWorldQuaternion(new T.Quaternion()),parent=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(parent.invert().multiply(q.multiply(world)));}
 function hold(){const grip=cargoSupport(cargoKind,cargoStack);
 // Keep the upper body upright while carrying, rather than using the free-run forward dive.
 object.updateMatrixWorld(true);const torso=object.worldToLocal(bone('Neck').getWorldPosition(new T.Vector3())).sub(object.worldToLocal(hip.getWorldPosition(new T.Vector3())));
 rotate('Spine',(-.10-Math.atan2(torso.z,torso.y))*carry);
 for(const [side,sign]of [['Left',1],['Right',-1]]){const upper=bone(side+'Arm'),fore=bone(side+'ForeArm'),hand=bone(side+'Hand');if(!upper||!fore||!hand)continue;object.updateMatrixWorld(true);const a=upper.getWorldPosition(new T.Vector3()),e=fore.getWorldPosition(new T.Vector3()),h=hand.getWorldPosition(new T.Vector3()),target=object.localToWorld(new T.Vector3(sign*grip.wristX,grip.wristY,grip.wristZ)),pole=object.localToWorld(new T.Vector3(sign*.32,1.05,.035)),u=e.distanceTo(a),v=h.distanceTo(e),dir=target.clone().sub(a),dist=T.MathUtils.clamp(dir.length(),Math.abs(u-v)+.001,u+v-.001);dir.normalize();const along=(u*u-v*v+dist*dist)/(2*dist),perp=pole.sub(a).addScaledVector(dir,-pole.dot(dir)).normalize(),elbow=a.clone().addScaledVector(dir,along).addScaledVector(perp,Math.sqrt(Math.max(0,u*u-along*along)));const uq=upper.quaternion.clone(),fq=fore.quaternion.clone();aim(upper,fore,elbow);aim(fore,hand,target);
 // Distribute palm-up rotation through the forearm rather than twisting the wrist alone.
 object.updateMatrixWorld(true);const axis=hand.getWorldPosition(new T.Vector3()).sub(fore.getWorldPosition(new T.Vector3())).normalize(),palm=palmAxes.get(side).clone().applyQuaternion(hand.getWorldQuaternion(new T.Quaternion())),up=palmAxes.get(side).clone().applyQuaternion(holdOrientations.get(cargoKind+side)).applyQuaternion(object.getWorldQuaternion(new T.Quaternion()));palm.addScaledVector(axis,-palm.dot(axis)).normalize();up.addScaledVector(axis,-up.dot(axis)).normalize();const roll=Math.atan2(axis.dot(palm.clone().cross(up)),palm.dot(up)),fqWorld=fore.getWorldQuaternion(new T.Quaternion()),parentQ=fore.parent.getWorldQuaternion(new T.Quaternion());fore.quaternion.copy(parentQ.invert().multiply(new T.Quaternion().setFromAxisAngle(axis,roll).multiply(fqWorld)));
 upper.quaternion.slerpQuaternions(uq,upper.quaternion.clone(),carry);fore.quaternion.slerpQuaternions(fq,fore.quaternion.clone(),carry);object.updateMatrixWorld(true);const hq=hand.quaternion.clone(),targetQ=hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(object.getWorldQuaternion(new T.Quaternion()).multiply(holdOrientations.get(cargoKind+side)));hand.quaternion.slerpQuaternions(hq,targetQ,carry);}}
 function update({dt=0,speed:next=0,carrying=false}={}){if(dt<=0)return;speed=next;carry+=((carrying?1:0)-carry)*(1-Math.exp(-dt*14));current=speed<.05?'idle':speed>3&&actions.run?'run':'walk';if(current!==last){actions[last].fadeOut(.18);actions[current].reset().setEffectiveWeight(1).fadeIn(.18).play();last=current;transitions++;}const rate=nominal[current]>.2?speed/nominal[current]:speed/(current==='run'?3.8:1.5);actions[current].setEffectiveTimeScale(current==='idle'?1:T.MathUtils.clamp(rate,.35,2));mixer.update(airborne?0:dt);fitShoulders((current==='run'?0:1)*(1-carry));centerRoot();if(locomotionPresentation&&!airborne&&landing<=0)sampleSupport(dt);if(carry>.001)hold();syncHem();}
 // Presentation only. The existing game supplies the actual hop height after its physics update.
 function present({dt=0,jumpHeight:height=0}={}){
  if(dt<=0)return;const was=airborne;airborne=height>.0001;jumpHeight=height;const velocity=(height-lastHeight)/dt;lastHeight=height;
  if(airborne&&!was){jumpCarrying=carry>.5;jumpKind=speed<.3?'standing':speed>3?'running':'walking';airTime=0;takeoffPose=bones.map(b=>b.quaternion.clone());takeoffSupport=jumpKind==='standing'?'Both':support;lead=support==='Left'?'Right':'Left';}
  if(was&&!airborne){landing=.18;landings++;}
  if(airborne){
   airFrames++;airTime+=dt;airPhase=velocity>.2?'rise':velocity<-.2?'fall':'apex';bones.forEach((b,i)=>{b.quaternion.copy(rest[i].q);b.position.copy(rest[i].p);});
   const moving=jumpKind!=='standing',run=jumpKind==='running',reach=velocity<0?T.MathUtils.smoothstep(height,0,.38):1,split=(run?.66:.34)*reach*(jumpCarrying?.55:1),tuck=(run?.78:.48)*reach*(jumpCarrying?.75:1)+.10;
   rotate('Spine',jumpCarrying?.025:run?.10:.04);rotate('Spine1',jumpCarrying?.01:run?.06:.02);
   for(const side of ['Left','Right']){
    const front=side===lead,recovery=T.MathUtils.smoothstep(airTime,.12,.42),push=1-T.MathUtils.smoothstep(airTime,.04,.18),thigh=moving?(front?-split:split*(.64-.30*recovery)):-(.15+.13*reach),knee=moving?(front?tuck:(.12*push+tuck*.72*recovery)):(.28+.22*reach);
    rotate(side+'UpLeg',thigh);rotate(side+'Leg',knee);rotate(side+'Foot',-(thigh+knee)*.45+(moving&&!front?.18*push:0));
    if(!jumpCarrying){rotate(side+'Arm',moving?(front?.14*reach:-(run?.58:.34)*reach):-.32);rotate(side+'ForeArm',moving?-(front?.45:.75):-.42);}
   }
   const blend=T.MathUtils.smoothstep(airTime,0,jumpKind==='running'?.16:.19);bones.forEach((b,i)=>b.quaternion.slerpQuaternions(takeoffPose[i],b.quaternion.clone(),blend));
   centerRoot();if(carry>.001)hold();lastAirPose=bones.map(b=>b.quaternion.clone());
  }else if(landing>0){
   airPhase='land';const blend=T.MathUtils.smoothstep(.18-landing,0,.18);bones.forEach((b,i)=>b.quaternion.slerpQuaternions(lastAirPose[i],b.quaternion.clone(),blend));const compression=Math.sin(landing/.18*Math.PI)*.10;
   for(const side of ['Left','Right']){rotate(side+'UpLeg',-compression);rotate(side+'Leg',compression*2);rotate(side+'Foot',-compression);}hip.position.y-=compression*.045;landing=Math.max(0,landing-dt);centerRoot();if(carry>.001)hold();
  }else airPhase='ground';syncHem();
 }
 return {object,update,present,refreshBounds(){object.updateMatrixWorld(true);updateBounds();},setCargo(kind,stack=[]){cargoKind=kind==='rice'?'rice':'food';cargoStack=stack;if(carry>.001)hold();},snapshot(){return {name:object.name,rig:'Tripo '+bones.length+' joints',state:airborne?'jump-'+airPhase:airPhase==='land'?'landing':current,speed,transitions,airFrames,landings,jumpHeight,jumpKind,jumpCarrying,leadingLeg:lead,takeoffSupport,supportFoot:support,supportReason,supportConfirmed,stanceSample:supportSamples,carryBlend:carry,cargoKind,cargoStack,workwear:!!workMask,nominalClipSpeeds:nominal,clipTime:actions[current].time,triangles:meshes.reduce((s,m)=>s+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),fingerTracksSuppressed:true,shoulderFit};},dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);for(const m of meshes){m.geometry.dispose();m.material.dispose();m.skeleton?.dispose();}object.clear();}};
}











