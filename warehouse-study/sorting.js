import {FIRST_HANDOFF_MS} from './inbound-plan.js';
import {cargoSlot,loadPosition,LOAD_SECONDS} from './cargo.js';
import {parcelRegion,truckRegion,canReach} from './reach.js';
import {T} from './geometry.js';
import {panel} from '../experiments/ui.js';
import {InteractionRegistry} from '../src/systems/interactions.js';
import {createInteractionPrompt} from '../src/systems/interaction-prompt.js';
import {ConveyorQueue,CONVEYOR_SPEED} from './conveyor.js';
export const warehouseSorting={input:{movement:false,camera:false,interaction:true},create(ctx,c){
 const {view,avatar,carryAnchor,scene}=ctx.world(),f=view.features,manifest=f.inbound.begin(),held=[],queue=new ConveyorQueue(f.boxes,{...c,firstReleaseMs:FIRST_HANDOFF_MS}),selector=new InteractionRegistry([]),prompt=createInteractionPrompt(ctx,scene);
 let correct=0,selected=null,closed=false,lastPickedId=null;const audit=[],loaded=[];f.loaded=loaded;
 const ui=panel(ctx,'sorting','유통 · 색상 분류','입고 → 컨베이어 → 회수 → 같은 색 트럭',{world:true});
 ui.el.classList.add('conveyor-status');
 function targets(){
  const list=held.length<2?queue.snapshot().filter(b=>['moving','waiting'].includes(b.state)).map(b=>({id:`box-${b.id}`,boxId:b.id,x:b.x,z:b.z,yaw:b.yaw,name:`${b.color==='blue'?'파란 쌀 포대':'빨간 식자재 상자'}`,action:'줍기',highlightY:1.064,outline:{y:b.y,width:.55,height:.48,depth:.47}})):[];
  if(held.length&&!loaded.some(l=>l.state==='loading'))list.push(...f.trucks.filter(t=>t.color===held.at(-1).color).map(t=>({...t,id:`truck-${t.color}`,facingZ:t.z-3,name:`${t.color==='blue'?'파란':'빨간'} 트럭`,action:'싣기',highlightScale:1.6})));
  return list.map(t=>t.boxId!==undefined?parcelRegion(avatar.position,t):truckRegion(avatar.position,t)).filter(t=>canReach(avatar.position,t,view.obstacles));
 }
 function select(){selected=selector.select(avatar.position,avatar.rotation.y,targets(),selected?.id);prompt.show(selected);}
 function publish(){scene.userData.experiment={kind:'sorting',inbound:f.inbound.snapshot(),targets:{red:manifest.red,blue:manifest.blue},done:loaded.filter(l=>l.state==='loaded').length,correct,held:held.map(b=>b.color),heldIds:held.map(b=>b.id),released:queue.boxes.filter(b=>b.state!=='pending').length,boxes:queue.snapshot(),selectedId:selected?.id??null,lastPickedId,audit:[...audit],loaded:loaded.map(l=>({id:l.id,color:l.color,truck:l.truck,state:l.state,slot:l.slot,position:{...l.model.position},visible:l.model.visible})),pickup:f.pickup,trucks:f.trucks};}
 function act(){
  if(closed||!selected)return;
  const displayed=selected.id,t=selector.validate(displayed,avatar.position,avatar.rotation.y,targets());
  if(!t){selected=null;prompt.show(null);publish();return;}
  if(t.boxId!==undefined){
   if(!queue.take(t.boxId))return;const b=f.boxes.find(b=>b.id===t.boxId);held.push(b);carryAnchor.add(b.model);b.model.position.set(0,(held.length-1)*.47,0);b.model.rotation.set(0,0,0);b.model.visible=true;lastPickedId=t.boxId;view.warehouseAudio?.pickup();audit.push({displayedId:displayed,pickedId:`box-${b.id}`,color:b.color});
  }else if(held.length){const b=held.pop();queue.sort(b.id);const from=b.model.getWorldPosition(new T.Vector3());f.crateRoot.attach(b.model);b.model.rotation.set(0,0,0);const slot=cargoSlot(t,loaded.filter(l=>l.truck===t.color).length);loaded.push({id:b.id,color:b.color,truck:t.color,model:b.model,from,slot,time:0,state:'loading'});held.forEach((b,i)=>b.model.position.set(0,i*.47,0));}
  view.carrying=held.length>0;selected=null;prompt.show(null);publish();
  
 }
 function update({dt}){
  queue.update(dt);f.inbound.update(queue,dt);
  for(const l of loaded){if(l.state==='loaded')continue;l.time=Math.min(LOAD_SECONDS,l.time+dt);const p=loadPosition(l.from,l.slot,l.time/LOAD_SECONDS);l.model.position.set(p.x,p.y,p.z);if(l.time===LOAD_SECONDS){l.state='loaded';if(l.color===l.truck){correct++;view.warehouseAudio?.delivered();}}}
  if(loaded.length===c.count&&loaded.every(l=>l.state==='loaded')){closed=true;publish();ctx.finish({status:'success',metrics:{correct,elapsedMs:ctx.elapsedMs(),inboundManifest:manifest,selectionAudit:audit,loaded:loaded.map(l=>({id:l.id,color:l.color,truck:l.truck,slot:l.slot,visible:l.model.visible}))}});return;}
  const snapshot=queue.snapshot();
  for(const b of snapshot){const model=f.boxes.find(m=>m.id===b.id).model;if(['pending','carried','sorted'].includes(b.state))continue;model.visible=['moving','waiting'].includes(b.state);if(model.visible){model.position.set(b.x,b.y,b.z);model.rotation.y=b.yaw;}}
  f.conveyorMotion={speed:CONVEYOR_SPEED,waiting:snapshot.filter(b=>b.state==='waiting')};
  select();publish();ui.status.textContent=`완료 ${loaded.filter(l=>l.state==='loaded').length}/${c.count} · 빨강 ${loaded.filter(l=>l.state==='loaded'&&l.color==='red').length}/${manifest.red} · 파랑 ${loaded.filter(l=>l.state==='loaded'&&l.color==='blue').length}/${manifest.blue} · 운반 ${held.length}/2${held.length?' · 위 상자 → '+(held.at(-1).color==='blue'?'파란':'빨간')+' 트럭':''}${held.length===2?' (최대 운반)':''}`;
  if(ctx.elapsedMs()>c.limitMs)ctx.finish({status:'failure',reason:'time'});
 }
 return {update,interaction:{target:()=>selected,act},pause(){ui.pause();prompt.show(null);},resume(){ui.resume();select();},dispose(){view.carrying=false;prompt.show(null);for(const b of f.boxes){f.crateRoot.add(b.model);if(!closed)b.model.visible=false;}delete f.conveyorMotion;if(!closed)delete scene.userData.experiment;}};
}};

