import {panel} from '../ui.js';
import {contactTime} from '../../seoul-study/contact.js';
import {HIT_RETURN,returnFrame} from '../../seoul-study/hit-return.js';
import {door} from './door.js?v=door-ready-20261011';
export const seoulLights={input:{movement:false,camera:false,interaction:true},create(ctx){
 const {view,avatar,scene}=ctx.world(),f=view.features,collected=new Set();let hits=0,transition=null,returnCount=0,immuneUntil=0,release=null,completedAt=null,finished=false,doorGame=null,doorStartedAt=null;const previous={x:avatar.position.x,z:avatar.position.z};
 const start={x:avatar.position.x,z:avatar.position.z};
 const home=Math.abs(start.z)>7.2&&view.canWalk(start.x,start.z,.43)?start:{x:-11,z:8.7};
 const ui=panel(ctx,'seoulGame','서울 · 다시 시작하는 빛','차를 피하며 도로 위 빛 3개에 닿으세요.',{world:true});
 const style=document.createElement('style');style.textContent='#seoulGame{pointer-events:none;max-width:min(420px,47vw)}#seoulGame header small,#seoulGame header p{display:none}#seoulGame h2{font-size:15px}#seoulGame output{font-weight:700}#seoulHit{position:fixed;inset:0;pointer-events:none;z-index:45;box-shadow:inset 0 0 12vmin #b95b45;opacity:0}#seoulReturnFade{position:fixed;inset:0;pointer-events:none;z-index:46;background:#111820;opacity:0}';ctx.mount(document.head,style);
 const flash=document.createElement('div');flash.id='seoulHit';flash.setAttribute('aria-hidden','true');ctx.mount(document.body,flash);const fade=document.createElement('div');fade.id='seoulReturnFade';fade.setAttribute('aria-hidden','true');ctx.mount(document.body,fade);for(const l of f.lights)l.model.visible=true;f.emit('start');
 function publish(ms){scene.userData.experiment={kind:'seoul-lights',phase:doorGame?'knocking':collected.size===3?'destination':'collect',collected:[...collected],hits,stunned:!!transition,returning:!!transition,returnPhase:transition?returnFrame(ms-transition.at).phase:null,returnAgeMs:transition?ms-transition.at:0,returnCount,respawnPoint:home,immune:!!transition||ms<immuneUntil,completed:finished,lightsComplete:collected.size===3,door:f.exit,lights:f.lights.filter(l=>!collected.has(l.id)).map(({id,x,z})=>({id,x,z})),cars:f.cars.map(({id,x,z,speed,dir})=>({id,x,z,speed,dir})),signal:f.signal,audio:'seoul-audio-events',elapsedMs:ms};}
 function target(){return !doorGame&&!transition&&collected.size===3&&Math.hypot(avatar.position.x-f.exit.x,avatar.position.z-f.exit.z)<1.45?{...f.exit,id:'seoul-door',label:'문 두드리기'}:null;}
 function openDoor(){if(!target())return;doorStartedAt=ctx.elapsedMs();release=ctx.lockInput({movement:true,camera:true,interaction:true});ui.el.hidden=true;f.emit('door-start');
  // Reuse the original timing game and its exact oscillator, interval and debounce.
  doorGame=door.create({...ctx,onKnock:detail=>f.emit('knock',detail),elapsedMs:()=>ctx.elapsedMs()-doorStartedAt,finish(result){if(finished||collected.size!==3||result.status!=='success')return;finished=true;f.emit('complete');ctx.finish({...result,metrics:{collected:3,hits,elapsedMs:doorStartedAt,...result.metrics}});}},{count:3});
 }
 function update(){const ms=ctx.elapsedMs();
  if(doorGame){doorGame.update?.();publish(ms);return;}
  if(!transition)for(const l of f.lights)if(!collected.has(l.id)&&Math.hypot(avatar.position.x-l.x,avatar.position.z-l.z)<.78){collected.add(l.id);l.model.visible=false;f.emit('collect',{id:l.id,count:collected.size});}
  ui.status.textContent=`빛 ${collected.size}/3 · 피격 ${hits}${transition?' · 안전한 인도로 돌아갑니다':collected.size===3?' · 빛나는 목적지 문으로 이동해 행동하세요':' · 차량 간격을 살펴 이동하세요'}`;
  if(collected.size===3&&completedAt===null){completedAt=ms;f.exitGlow.visible=true;f.emit('lights-complete');}
 }
 // Hold displayed traffic poses for the hit/fade; logical traffic keeps moving.
 function beginReturn(hit,ms){
  hits++;transition={at:ms,moved:false,yaw:avatar.rotation.y};release=ctx.lockInput({movement:true,camera:true,interaction:true});
  const t=hit.t;
  avatar.position.x=previous.x+(avatar.position.x-previous.x)*t;
  avatar.position.z=previous.z+(avatar.position.z-previous.z)*t;
  f.trafficPresentation=new Map(f.cars.map(c=>[c.id,{...c,x:c.previousX+(c.x-c.previousX)*t,distance:c.distance-Math.abs(c.x-c.previousX)*(1-t)}]));
  f.emit('hit',{hits,carId:hit.car.id});flash.style.opacity='.6';f.reaction=.3;
 }
 function resolveTraffic(){
  if(doorGame||finished)return;
  const ms=ctx.elapsedMs();
  if(!transition&&ms>=immuneUntil){
   const hit=f.cars.map(car=>({car,t:contactTime(avatar.position,previous,car)})).filter(h=>h.t!==null).sort((a,b)=>a.t-b.t)[0];
   if(hit)beginReturn(hit,ms);
  }
  if(transition){
   const state=returnFrame(ms-transition.at);fade.style.opacity=String(state.opacity);
   flash.style.opacity=String(state.relocate?0:.6*(1-Math.min(1,(ms-transition.at)/500)));f.reaction=state.reaction;
   if(state.relocate&&!transition.moved){
    f.returnPlayer(home);avatar.rotation.y=transition.yaw;transition.moved=true;returnCount++;delete f.trafficPresentation;
   }
   if(state.done){transition=null;immuneUntil=ms+HIT_RETURN.immuneMs;release?.();release=null;flash.style.opacity='0';fade.style.opacity='0';f.reaction=0;}
  }
  view.avatarShadow.position.x=avatar.position.x;view.avatarShadow.position.z=avatar.position.z;
  previous.x=avatar.position.x;previous.z=avatar.position.z;publish(ms);
 }
 f.resolveTraffic=resolveTraffic;
 return {update,interaction:{target,act:openDoor},pause(){if(doorGame)doorGame.pause?.();else ui.pause();},resume(){if(doorGame)doorGame.resume?.();else ui.resume();},dispose(){if(f.resolveTraffic===resolveTraffic)delete f.resolveTraffic;doorGame?.dispose?.();release?.();delete f.trafficPresentation;f.reaction=0;f.emit('leave');delete scene.userData.experiment;}};
}};
