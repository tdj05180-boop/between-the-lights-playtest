import {ControlState} from './state.js';
import {createControlView} from './game-view.js';
import {showControlGuide} from './guide.js';

// Fetch before registry/start readiness. The first visible frame already has the approved style.
const response=await fetch(new URL('./control-room.css',import.meta.url));
if(!response.ok)throw Error('관제 UI 스타일 로딩 실패: '+response.status);
const css=(await response.text()).replace(':root{',':host{').replace('body{',':host{');
export const agencyControl={input:{movement:true,camera:true,interaction:true},create(ctx){
 const state=new ControlState(),{scene}=ctx.world();let finished=false,paused=false,lastUiTime=-Infinity,startedAt=null;
 const host=document.createElement('section');host.id='agencyControl';host.style.cssText='position:fixed;inset:0;z-index:45;background:#f7f6ef;touch-action:manipulation';host.setAttribute('aria-label','지사 통합 관제');
 const shadow=host.attachShadow({mode:'open'});shadow.innerHTML=`<style>${css}\n:host{display:block}button:disabled{opacity:.65}.topbar nav button:disabled{opacity:1}.topbar .preview-tag{display:block;border:1px solid #8ba59f;border-radius:6px;padding:8px;color:#fff}@media(max-width:700px){#control-room{height:100dvh;overflow-y:auto}.topbar{height:80px}.topbar .preview-tag{font-size:10px;min-width:44px;min-height:36px;padding:5px}.brand{font-size:19px}.clock{gap:3px;padding:3px}.topbar nav{gap:4px}}</style><div id="control-room"></div>`;
 const root=shadow.querySelector('#control-room'),ui=createControlView(root);
 const emit=type=>scene.dispatchEvent({type:'agency-audio-event',detail:{type}});
 const overlay=document.createElement('style');overlay.textContent='body.agency-control-active>#timerPanel,body.agency-control-active>.topbar,body.agency-control-active>#helpBtn,body.agency-control-active>#soundBtn,body.agency-control-active>#fullscreenBtn{visibility:hidden}';ctx.mount(document.head,overlay);
 document.body.classList.add('agency-control-active');ctx.own(()=>document.body.classList.remove('agency-control-active'));
 showControlGuide(root);ctx.mount(document.body,host);
 function publish(){scene.userData.experiment={...state.snapshot(),awaitingStart:startedAt===null};}
 function activate(b){
  if(!b||b.disabled||paused||finished)return;
  if(startedAt===null){if(b.dataset.action!=='begin')return;startedAt=ctx.elapsedMs();ui.render(state);ui.timer(state);root.scrollTop=0;emit('start');emit('notification');publish();return;}
  if(b.dataset.action==='begin')return;
  if(b.dataset.action==='timer'){document.getElementById('pauseBtn').click();return;}
  if(b.dataset.order){state.selectedOrder=Number(b.dataset.order);state.route=null;emit('click');}
  else if(b.dataset.rider){state.selectedRider=Number(b.dataset.rider);state.route=null;emit('click');}
  else if(b.dataset.tab){state.tab=b.dataset.tab;emit('click');}
  else if(b.dataset.region){state.selectedRegion=Number(b.dataset.region);emit('click');}
  else if(b.dataset.move){state.update(Math.max(0,ctx.elapsedMs()-startedAt));if(!state.done)emit(state.move(Number(b.dataset.index),Number(b.dataset.move))?'click':'error');}
  else if(b.dataset.action==='assign'){
   state.update(Math.max(0,ctx.elapsedMs()-startedAt));const o=state.orders.find(o=>o.id===state.selectedOrder),r=state.riders.find(r=>r.id===state.selectedRider);
   if(state.assign()){state.route=null;emit('success');}else emit('error');
  }
  ui.render(state);ui.timer(state);publish();
 }
 // Regional +/- controls are discrete game presses, not scroll gestures. Handle
 // touch/pen at contact so a missing Safari compatibility click cannot lose it.
 // Mouse and keyboard retain native button activation; never count both events.
 const pressedByTouch=new WeakSet();
 ctx.listen(root,'pointerdown',e=>{
  const b=e.target.closest('button[data-move]');if(!b||b.disabled||paused||finished||e.button!==0)return;
  if(e.pointerType==='mouse'){pressedByTouch.delete(b);return;}
  if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
  e.preventDefault();pressedByTouch.add(b);activate(b);
 },{passive:false});
 ctx.listen(root,'click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.move&&(e.pointerType==='touch'||e.pointerType==='pen'||e.sourceCapabilities?.firesTouchEvents||(e.detail>0&&pressedByTouch.has(b))))return;
  activate(b);
 });
 publish();
 return {coversWorld:true,update({elapsedMs}){if(startedAt===null)return;elapsedMs=Math.max(0,elapsedMs-startedAt);const before=state.mode,changed=state.update(elapsedMs);if(state.mode!==before)emit('transition');if(changed)ui.render(state);ui.motion(state);if(changed||elapsedMs-lastUiTime>=100){ui.timer(state);lastUiTime=elapsedMs;}if(state.mode!==before)root.scrollTop=0;publish();if(state.done&&!finished){finished=true;emit('complete');ctx.finish({status:'success',metrics:state.metrics()});}},pause(){paused=true;host.inert=true;},resume(){paused=false;host.inert=false;},dispose(){ui.dispose();host.remove();}};
}};


