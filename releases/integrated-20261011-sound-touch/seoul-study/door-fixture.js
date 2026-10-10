import {door} from '../experiments/minigames/door.js?v=door-ready-20261011';
import {timingPosition} from '../src/systems/timing.js';
const mobile=new URLSearchParams(location.search).get('mobile')==='true';document.body.dataset.mobile=String(mobile);
const frames=[],receipts=[],clean=[];let elapsed=0;const initialLinks=document.querySelectorAll('link').length;
const check=(b,m)=>{if(!b)throw Error(m);};const raf=()=>new Promise(r=>requestAnimationFrame(r));
try{
 for(let n=0;n<3;n++){
  elapsed=0;let game=door.create({mount(parent,el){parent.append(el);clean.push(()=>el.remove());},listen(el,t,fn,o){el.addEventListener(t,fn,o);clean.push(()=>el.removeEventListener(t,fn,o));},elapsedMs:()=>elapsed,finish:r=>receipts.push(r)},{count:3});
  game.update();await raf();const panel=document.querySelector('#door'),track=panel.querySelector('.experiment-track');
  const f={mobile,round:n,height:getComputedStyle(track).height,radius:getComputedStyle(panel).borderRadius,marker:getComputedStyle(track.querySelector('b')).width,panels:document.querySelectorAll('#door').length};frames.push(f);
  check(f.height===(mobile?'42px':'56px')&&f.radius==='24px'&&f.marker==='12px'&&f.panels===1,'First frame incorrect');
  const rect=panel.getBoundingClientRect();check(rect.left>=0&&rect.right<=innerWidth&&rect.top>=0&&rect.bottom<=innerHeight,'Panel outside viewport');
  const button=panel.querySelector('button');check(button.textContent===(mobile?'두드리기':'두드리기 · Space'),'Input label');
  function press(){if(mobile){button.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerId:8,pointerType:'touch',bubbles:true,cancelable:true}));button.dispatchEvent(new PointerEvent('pointerup',{button:0,pointerId:8,pointerType:'touch',bubbles:true}));}else{dispatchEvent(new KeyboardEvent('keydown',{code:'Space'}));dispatchEvent(new KeyboardEvent('keyup',{code:'Space'}));}}
  press();check(panel.dataset.feedback==='miss','Failure feedback');
  for(let hits=0;hits<3;hits++){elapsed+=400;while(!(.49<timingPosition(elapsed/1000,hits)&&timingPosition(elapsed/1000,hits)<.55))elapsed+=5;game.update();press();if(hits<2)check(panel.dataset.feedback==='perfect','Success feedback');}
  check(receipts.length===n+1&&receipts[n].metrics.doorMisses===1&&receipts[n].metrics.doorHits===3,'Single result / timing rules');
  game.dispose();while(clean.length)clean.pop()();check(!document.querySelector('#door'),'Panel cleanup');check(document.querySelectorAll('link').length===initialLinks,'No per-instance CSS link');
 }
 parent.postMessage({kind:'door-first-frame',passed:true,frames,results:receipts.length},location.origin);
}catch(e){parent.postMessage({kind:'door-first-frame',passed:false,frames,error:e.message},location.origin);}
