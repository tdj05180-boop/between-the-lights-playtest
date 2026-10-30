import * as T from '../vendor/three.module.min.js';
import {createLiftPose} from './shutter-pose.js';

export function installShutterLift(view,ctx){
 const {avatar,scene}=view,shutter=scene.userData.shutter,approachTo=new T.Vector3(0,.11,-.12);
 let pose,phase='idle',time=0,releaseTime=0,releaseY=0,previousRail=shutter.bottomY,from,fromYaw,resolveEnter,resolveExit;
 const smooth=t=>T.MathUtils.smoothstep(t,0,1),oldBefore=view.beforeMinigame,oldAfter=view.afterMinigame;
 function snapshot(){scene.userData.shutterLift={phase,time,releaseTime,confirmedClosing:shutter.closing,...pose?.snapshot()};}
 view.beforeMinigame=detail=>{
  if(detail.questId!=='shutter')return oldBefore?.(detail)??Promise.resolve(true);
  pose??=createLiftPose(ctx.player.playerView.adapter);phase='approach';time=0;releaseTime=0;from=avatar.position.clone();fromYaw=avatar.rotation.y;
  return new Promise(r=>resolveEnter=r);
 };
 view.afterMinigame=detail=>{
  if(detail.questId!=='shutter')return oldAfter?.(detail)??Promise.resolve(true);
  return new Promise(r=>{resolveExit=r;if(phase==='idle'){resolveExit=null;r(true);}});
 };
 const presentation=view.updatePresentation;view.updatePresentation=dt=>{
  presentation?.call(view,dt);if(phase==='idle'||dt<=0)return;
  time+=dt;
  if(phase==='approach'){
   const move=smooth(time/1.25);avatar.position.lerpVectors(from,approachTo,move);avatar.rotation.y=fromYaw+Math.atan2(Math.sin(Math.PI-fromYaw),Math.cos(Math.PI-fromYaw))*move;
   if(time>=1.85){phase='holding';time=0;previousRail=shutter.bottomY;const r=resolveEnter;resolveEnter=null;r?.(true);}
  }else if(phase==='holding'){avatar.position.copy(approachTo);avatar.rotation.y=Math.PI;}
  else if(phase==='release'){
   releaseTime+=dt;avatar.position.copy(approachTo);avatar.position.z+=.19*smooth(releaseTime/.45);avatar.rotation.y=Math.PI;
   if(releaseTime>=1.15&&!shutter.focus){phase='idle';snapshot();const r=resolveExit;resolveExit=null;r?.(true);}
  }
 };
 const ambient=view.updateAmbient;view.updateAmbient=state=>{
  ambient.call(view,state);if(!pose||phase==='idle')return;
  // Closing is set by lifeShutter.close(), not by downward motion or low effort.
  if(phase==='holding'&&shutter.closing){phase='release';releaseTime=Math.max(state.dt,1/240);releaseY=previousRail;}
  const blend=phase==='approach'?smooth((time-1.25)/.6):1;
  if(phase==='approach'&&time<1.25)ctx.player.playerView.adapter.update({dt:state.dt,speed:from.distanceTo(approachTo)/1.25});
  if(blend>0)pose.apply({railY:shutter.bottomY,blend,release:phase==='release'?releaseTime:0,releaseRailY:releaseY,time});
  previousRail=shutter.bottomY;view.avatarShadow.position.set(avatar.position.x,.116,avatar.position.z);snapshot();
 };
 ctx.scope.own(()=>{resolveEnter?.(false);resolveExit?.(false);delete scene.userData.shutterLift;});
 return view;
}
