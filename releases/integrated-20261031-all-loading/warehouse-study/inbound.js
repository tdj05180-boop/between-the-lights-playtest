import {T,P} from './geometry.js';
import {createCandidateAvatar} from '../src/models/candidate-avatar.js';
import {makeInboundManifest,inboundSlot,workerPhase} from './inbound-plan.js';
import {workerPose} from './worker-pose.js';
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const rest={x:-4,y:.19,z:-15.25};
export function createInbound(k,crateRoot,boxes,characters){
 const adapter=characters?characters.create('warehouseInbound'):createCandidateAvatar(),pose=characters?workerPose(adapter):null,object=adapter.object;object.name='InboundWorker';k.root.add(object);
 const skin=object.getObjectByName('TailoredHumanContinuousSurfaces');
 if(skin)[0x929e79,0x687559,0xe8dcb8,0xd9ae88,0x554a3b,0x606e73,0x4f584b,0xc4bea7,0x423e35,0xa97760].forEach((c,i)=>skin.material[i].color.setHex(c));
 const bones=adapter.skeleton?.bones??[],root=bones.find(b=>b.name==='body');let manifest,order,last={...rest},status={},lastIndex=-1,releaseTime=1;
 // Analytic arm reach keeps hands on this same parcel through lifting and placing.
 function reach(box){object.updateMatrixWorld(true);for(const side of [-1,1]){
  const upper=bones.find(b=>b.name==='shoulder'+side),lower=bones.find(b=>b.name==='elbow'+side),target=new T.Vector3(box.x,box.y-.07,box.z);
  const right=new T.Vector3(side*.24,0,0).applyAxisAngle(new T.Vector3(0,1,0),object.rotation.y);target.add(right);
  const a=upper.getWorldPosition(new T.Vector3()),v=target.clone().sub(a),d=Math.min(.535,Math.max(.03,v.length())),dir=v.normalize(),l1=.265,l2=.277;
  const along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));
  const bend=new T.Vector3(side, -.45,0).applyAxisAngle(new T.Vector3(0,1,0),object.rotation.y);bend.addScaledVector(dir,-bend.dot(dir)).normalize();
  const elbow=a.clone().addScaledVector(dir,along).addScaledVector(bend,h);
  const set=(bone,from,to)=>{const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,-1,0),to.clone().sub(from).normalize()),parent=bone.parent.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(q));object.updateMatrixWorld(true);};
  set(upper,a,elbow);set(lower,lower.getWorldPosition(new T.Vector3()),target);
 }}
 function reset(){
  pose?.restore();
  lastIndex=-1;releaseTime=1;pose?.release(0);
  manifest=makeInboundManifest();order=manifest.boxes.map((b,i)=>{const item=boxes.find(x=>x.id===b.id);item.setColor(b.color);crateRoot.add(item.model);item.model.visible=true;item.model.rotation.set(0,0,0);item.model.position.copy(inboundSlot(i));return item;});
  boxes.splice(0,boxes.length,...order);last={...rest};object.position.set(rest.x,rest.y,rest.z);object.rotation.y=Math.PI;adapter.update({dt:1/60});status={stage:'ready',truck:10,workerId:null,manifest};return manifest;
 }
 function update(queue,dt){
  const pending=queue.boxes.filter(b=>b.state==='pending'),next=pending[0],index=next?queue.boxes.indexOf(next):-1;
  // Keep the final placing pose across parcel ownership changes. The hands
  // release and the torso rises before the next reach, rather than snapping.
  if(index!==lastIndex&&lastIndex>=0){pose?.rememberRelease();releaseTime=0;}
  lastIndex=index;pose?.restore();
  const release=()=>{pose?.release(1-ease(releaseTime/.32));releaseTime+=dt;};
  for(const b of pending){const i=queue.boxes.indexOf(b),m=order[i].model;m.visible=true;m.position.copy(inboundSlot(i));m.rotation.set(0,0,0);}
  if(!next){adapter.update({dt,speed:0});release();status={stage:'idle',truck:0,workerId:null,manifest};return;}
  const {u,stage}=workerPhase(queue.elapsed,index,queue.releaseMs),slot=inboundSlot(index),pick={x:pose?slot.x:-4,y:.275,z:slot.z+(pose?.34:.26)};
  const prev=index?rest:pick;let pos=u<.3?mix(prev,pick,ease(u/.3)):u<.46?pick:u<.87?mix(pick,rest,ease((u-.46)/.41)):rest;
  const carrying=u>=.3,speed=index===0&&u<.3?0:Math.hypot(pos.x-last.x,pos.z-last.z)/Math.max(dt,.001);last={...pos};
  object.position.set(pos.x,pos.y,pos.z);const yawPick=Math.atan2(slot.x-pick.x,slot.z-pick.z);object.rotation.y=u<.3&&index>0?yawPick*ease(u/.3):u<.46?yawPick:yawPick*(1-ease((u-.46)/.20));
  adapter.update({dt,speed:Math.min(2.8,speed),carrying:pose?false:carrying});
  const bend=(u<.3?ease(u/.3):1-ease((u-.3)/.16))*.72;
  if(!pose){root.rotation.x=bend;root.position.set(0,-.20*bend,.13*bend);
  for(const side of [-1,1]){const hip=bones.find(b=>b.name==='hip'+side),knee=bones.find(b=>b.name==='knee'+side);hip.rotation.x-=bend;knee.rotation.x+=bend*.8;}}
  const carry={x:pos.x+Math.sin(object.rotation.y)*.40,y:pos.y+1.03,z:pos.z+Math.cos(object.rotation.y)*.40};
  let box=slot;if(u>=.3&&u<.46)box=mix(slot,carry,ease((u-.3)/.16));else if(u>=.46&&u<.87)box=carry;else if(u>=.87)box=mix(carry,{x:-4,y:1.267,z:-14.7},ease((u-.87)/.13));
  const item=order[index],model=item.model;model.position.copy(box);model.rotation.y=u>=.3?object.rotation.y:0;
  if(pose){const low=T.MathUtils.clamp((pos.y+(item.color==='blue'?1.12:1.045)-box.y)/(item.color==='blue'?.68:.815),0,1),blend=ease((u-.12)/.18),minimum=.18+.14*ease((u-.87)/.13);if(blend>0||(index===0))pose.parcel(box,{kind:item.color==='blue'?'rice':'food',visualOffset:item.visualOffset??0,blend,stance:1-ease((u-.42)/.10),crouch:Math.max(index===0&&u<.3?.15:0,(minimum+(1-minimum)*low)*blend)});}
  else if(u>=.20)reach(box);
  release();
  status={stage,truck:pending.length-(carrying?1:0),workerId:carrying?next.id:null,workerColor:carrying?next.color:null,manifest,position:{...pos},parcelPosition:{...box}};
 }
 reset();return {object,reset,begin:()=>status.stage==='ready'?manifest:reset(),update,snapshot:()=>({...status,character:pose?'warehouseInbound':'legacy',hands:pose?.snapshot()})};
}
