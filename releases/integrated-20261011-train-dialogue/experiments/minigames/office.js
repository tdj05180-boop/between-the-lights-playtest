import {panel,near} from '../ui.js';
import {laserPosition,sweptContact,safeMove} from '../../office-study/layout.js';
// Common interaction button/KeyE, clock, result receipt and score formula are reused.
export const documents={input:{movement:false,camera:false,interaction:true},create(ctx,c){
 const {view,avatar,scene,playerState}=ctx.world(),f=view.features,collected=new Set();
 let hits=0,immuneUntil=0,stunUntil=0,release=null,knock={x:0,z:0},selected=null,openingAt=null,finished=false,noticeUntil=0,lastMs=0;
 const previous={x:avatar.position.x,z:avatar.position.z};
 const ui=panel(ctx,'documents','2019 · 서류를 챙겨 다음 길로','붉은 레이저의 타이밍을 보고 이동하거나 점프하세요.',{world:true});
 const css=document.createElement('style');css.textContent='#officeHit{position:fixed;inset:0;pointer-events:none;z-index:45;box-shadow:inset 0 0 12vmin 3vmin #ed281f;opacity:0}#documents{pointer-events:none;max-width:min(440px,48vw)}#documents header p{display:none}#documents output{display:block;font-weight:600}';ctx.mount(document.head,css);
 const flash=document.createElement('div');flash.id='officeHit';flash.setAttribute('aria-hidden','true');ctx.mount(document.body,flash);
 for(const p of f.papers)p.model.visible=true;f.exitGlow.visible=false;f.setDoor(0);f.emit('chapter-enter');
 const stunMs=c.stunMs??480,immunityMs=c.hitCooldownMs??1000,doorMs=850;
 function reach(t,r){if(!near(avatar.position,t,r))return false;for(let a=.15;a<.95;a+=.15)if(!view.canWalk(avatar.position.x+(t.x-avatar.position.x)*a,avatar.position.z+(t.z-avatar.position.z)*a))return false;return true;}
 function target(){if(finished||openingAt!==null||ctx.elapsedMs()<stunUntil)return null;const p=f.papers.filter(p=>!collected.has(p.id)&&reach(p,1.05)).sort((a,b)=>Math.hypot(a.x-avatar.position.x,a.z-avatar.position.z)-Math.hypot(b.x-avatar.position.x,b.z-avatar.position.z))[0];if(p)return {id:'paper-'+p.id,label:p.name+' · 줍기',...p};if(reach(f.exit,1.25))return {...f.exit,id:'office-exit',label:collected.size===5?'문 열기':'서류를 모두 모아야 나갈 수 있습니다'};return null;}
 function act(){const t=target();if(!t||selected?.id!==t.id)return;
  if(t.id==='office-exit'){if(collected.size!==5){noticeUntil=ctx.elapsedMs()+1800;return;}openingAt=ctx.elapsedMs();release=ctx.lockInput({movement:true,interaction:true});f.emit('door-open');}
  else{const p=f.papers.find(p=>p.id===t.id);if(!p)return;collected.add(p.id);p.model.visible=false;f.emit('paper-collected',{id:p.id,count:collected.size});if(collected.size===5){f.unlock();f.emit('exit-unlocked');}}
  selected=null;publish();
 }
 function publish(){scene.userData.experiment={kind:'documents',collected:[...collected],hits,stunned:ctx.elapsedMs()<stunUntil,immune:ctx.elapsedMs()<immuneUntil,stunUntil,immuneUntil,selectedId:selected?.id??null,doorUnlocked:collected.size===5,doorProgress:openingAt===null?0:Math.min(1,(ctx.elapsedMs()-openingAt)/doorMs),doorAngle:f.door.rotation.y,exitGlow:f.exitGlow.visible,papers:f.papers.filter(p=>!collected.has(p.id)).map(({x,z,id})=>({x,z,id})),exit:f.exit,lasers:f.hazards.map(h=>({id:h.id,x:h.model.position.x,z:h.model.position.z,width:h.width,axis:h.axis,thickness:h.thickness})),events:[...f.events]};}
 function update({dt}){
  const ms=ctx.elapsedMs(),step=Math.min(dt,.05);if(release&&openingAt===null&&ms>=stunUntil){release();release=null;}
  if(openingAt!==null){const t=Math.min(1,(ms-openingAt)/doorMs);f.setDoor(t*t*(3-2*t));publish();if(t===1&&!finished){finished=true;f.emit('door-opened');ctx.finish({status:'success',metrics:{hits,elapsedMs:ms}});}return;}
  if(ms<stunUntil){const fade=Math.max(0,(stunUntil-ms)/stunMs);safeMove(avatar.position,knock.x*step*fade,knock.z*step*fade,view.canWalk);}
  const dz=avatar.position.z-previous.z,dx=avatar.position.x-previous.x;
  for(const h of f.hazards){const old=laserPosition(h,lastMs),pos=laserPosition(h,ms);h.setPosition(pos);
   if(ms>=immuneUntil&&playerState().jumpHeight<.24&&sweptContact(avatar.position,h,old,pos)){
    hits++;immuneUntil=ms+immunityMs;stunUntil=ms+stunMs;release=ctx.lockInput({movement:true,interaction:true});
    const length=Math.hypot(dx,dz);knock=length>.005?{x:-dx/length*.75,z:-dz/length*.75}:h.axis==='x'?{x:0,z:(avatar.position.z>=pos.z?1:-1)*.75}:{x:(avatar.position.x>=pos.x?1:-1)*.75,z:0};f.emit('laser-hit',{hits,laser:h.id});
   }
  }
  f.reaction=ms<stunUntil?Math.sin((1-(stunUntil-ms)/stunMs)*Math.PI):0;flash.style.opacity=String(ms<stunUntil?.38*(stunUntil-ms)/stunMs:0);
  previous.x=avatar.position.x;previous.z=avatar.position.z;lastMs=ms;selected=target();
  ui.status.textContent=`서류 ${collected.size}/5 · 피격 ${hits}${ms<stunUntil?' · 잠시 경직':''}${noticeUntil>ms?' · 서류를 모두 모아야 나갈 수 있습니다':collected.size===5?' · 밝은 출입문으로 이동해 문을 여세요':''}`;publish();
 }
 return {update,interaction:{target:()=>selected,act},pause(){ui.pause();flash.hidden=true;},resume(){ui.resume();flash.hidden=false;},dispose(){release?.();f.reaction=0;f.emit('chapter-leave');delete scene.userData.experiment;}};
}};
