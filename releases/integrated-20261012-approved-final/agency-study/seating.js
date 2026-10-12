import {deskPose,deskPoseMetrics} from './desk-pose.js';
import {T} from '../experiments/spaces/kit.js';

// Chapter-owned presentation. Gameplay timers begin only after enter() resolves.
export function createSeating(view,chair,scope){
 const {avatar,playerView,camera,scene}=view,baseChair=chair.position.clone();
 const workZ=-4.0,keyboard={x:-4,y:1.043,z:-3.44};
 const side=new T.Vector3(-5.1,.11,-4.3),front=new T.Vector3(-4,.11,-4.55),seat=new T.Vector3(-4,.11,-5);
 const overview=new T.Vector3(-5.8,2.3,-5.55),overviewTarget=new T.Vector3(-4,1.02,-4.15);
 const style=document.createElement('style');style.textContent='.agency-seating #hud,.agency-seating #controls,.agency-seating #worldLabels,.agency-seating #actionControls,.agency-seating #joystick{visibility:hidden!important}.agency-seating #interruptState{display:none}.agency-seating #dispatch,.agency-seating #management{animation:agency-work-reveal .2s ease-out}@keyframes agency-work-reveal{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){.agency-seating #dispatch,.agency-seating #management{animation:none}}';document.head.append(style);
 let phase='idle',time=0,blend=0,task=null,resolve=null,from=side.clone(),yaw=0,camFrom=new T.Vector3(),lookFrom=new T.Vector3(),workCam=new T.Vector3(),workLook=new T.Vector3(-4,1.47,-2.84),cameraMix=0,returning=false,disposed=false;
 const sound=(type,duration)=>scene.dispatchEvent({type:'agency-audio-event',detail:{type,duration}});
 const smooth=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
 const mix=(a,b,t)=>a+(b-a)*smooth(t);
 function snapshot(){scene.userData.seating={phase,time,blend,chair:chair.position.toArray(),position:avatar.position.toArray(),task,cameraMix,hands:deskPoseMetrics(playerView.adapter,keyboard)};}
 function pose(amount){
  const typing=phase==='approach'?smooth((time-2.8)/.5):phase==='zoom'||phase==='working'?1:phase==='return'?1-smooth(time/.6):0;
  deskPose(playerView.adapter,{amount,typing,keyboard,time,lean:.24});
 }
 function start(kind){if(disposed||resolve)return Promise.resolve(false);document.body.classList.add('agency-seating');task=kind;time=0;phase='approach';sound('chair',.35);returning=false;from.copy(avatar.position);yaw=avatar.rotation.y;camFrom.copy(camera.position);lookFrom.set(0,0,-1).applyQuaternion(camera.quaternion).multiplyScalar(3).add(camera.position);cameraMix=1;
  workCam.set(camera.aspect<.8?-4.15:-5.05,camera.aspect<.8?2.22:2.02,camera.aspect<.8?-5.65:-4.75);
  snapshot();return new Promise(r=>resolve=r);
 }
 function leave({questId,result}){if(phase==='idle')return Promise.resolve(true);task=questId;phase='return';time=0;sound('chair',.75);returning=true;const ending=(questId==='agency'||questId==='management')&&result.status==='success';return new Promise(r=>{resolve=r;task=ending?'ending':questId;});}
 function done(next){phase=next;if(next==='idle')document.body.classList.remove('agency-seating');const r=resolve;resolve=null;r?.(true);}
 function tick(dt){
  if(phase==='idle')return;const previousTime=time;time+=dt;
  if(phase==='approach'&&previousTime<2.65&&time>=2.65)sound('chair',.65);
  if(phase==='approach'){
   chair.position.z=mix(baseChair.z,-5,time/.35);
   if(time<.85)avatar.position.lerpVectors(from,side,smooth(time/.85));else avatar.position.lerpVectors(side,front,smooth((time-.85)/.9));
   avatar.rotation.y=yaw+Math.atan2(Math.sin(-yaw),Math.cos(-yaw))*smooth(time/1.5);
   blend=smooth((time-1.9)/.75);
   if(time>=1.9)avatar.position.lerpVectors(front,seat,blend);
   if(time>=2.65){const t=smooth((time-2.65)/.65);chair.position.z=-5+(workZ+5)*t;avatar.position.z=chair.position.z;}
   if(time>=3.55){phase='zoom';time=0;}
  }else if(phase==='zoom'){blend=1;avatar.position.set(-4,.11,workZ);if(time>=.95)done('working');}
  else if(phase==='working'||phase==='ending'){blend=1;avatar.position.set(-4,.11,phase==='working'?workZ:baseChair.z);}
  else if(phase==='return'){
   blend=1;chair.position.z=mix(workZ,baseChair.z,time/.75);avatar.position.set(-4,.11,chair.position.z);
   if(task==='ending'){cameraMix=1-smooth((time-.5)/.9);if(time>=1.4){cameraMix=0;done('ending');}}
   else if(time>.85){
    if(time<1.35){chair.position.z=mix(baseChair.z,-5,(time-.85)/.5);avatar.position.z=chair.position.z;}
    else if(time<2.1){chair.position.z=-5;blend=1-smooth((time-1.35)/.75);avatar.position.lerpVectors(front,seat,blend);}
    else{blend=0;avatar.position.lerpVectors(front,side,smooth((time-2.1)/.75));chair.position.z=mix(-5,baseChair.z,(time-2.6)/.4);cameraMix=1-smooth((time-2.1)/.9);}
    if(time>=3){chair.position.copy(baseChair);avatar.position.copy(side);pose(0);cameraMix=0;done('idle');}
   }
  }
  if(blend>0||phase==='return')pose(blend);
  else if(phase==='approach'){const b=Object.fromEntries(playerView.adapter.skeleton.bones.map(b=>[b.name,b]));for(const s of [-1,1]){b['hip'+s].rotation.x=Math.sin(time*10)*.23*s;b['knee'+s].rotation.x=Math.max(0,-Math.sin(time*10)*s)*.25;}}
  avatar.position.y=.11;snapshot();
 }
 function frame(cam,target){
  const focus=phase==='zoom'?smooth(time/.95):phase==='working'?1:phase==='return'?1-smooth(time/.85):0;
  const fov=60+(cam.aspect<.8?18:0)*focus;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix();}
  if(!cameraMix)return;
  let p=overview.clone(),t=overviewTarget.clone();
  if(phase==='approach'){const a=smooth(time/1.4);p.lerpVectors(camFrom,overview,a);t.lerpVectors(lookFrom,overviewTarget,a);}
  else if(phase==='zoom'){const a=smooth(time/.95);p.lerp(workCam,a);t.lerp(workLook,a);}
  else if(phase==='working'){p.copy(workCam);t.copy(workLook);}
  else if(phase==='return'){const a=smooth(time/.85);p.lerpVectors(workCam,overview,a);t.lerpVectors(workLook,overviewTarget,a);}
  cam.position.lerp(p,cameraMix);target.lerp(t,cameraMix);
 }
 scope.own(()=>{disposed=true;document.body.classList.remove('agency-seating');style.remove();chair.position.copy(baseChair);pose(0);resolve?.(false);resolve=null;delete scene.userData.seating;});
 return {enter:({questId})=>start(questId),leave,tick,frame};
}
