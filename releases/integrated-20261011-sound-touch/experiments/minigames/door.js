import {panel,actionButton} from '../ui.js';
import {timingHit,timingPosition} from '../../src/systems/timing.js';
export const door={input:{movement:true,camera:true,interaction:true},create(ctx,c){
 const ui=panel(ctx,'door','새로운 문을 두드리다','움직이는 마커가 초록 구간에 들어오면 두드리세요.');let hits=0,misses=0,attempts=0,last=-Infinity,feedbackUntil=0;
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../../seoul-study/door.css',import.meta.url).href;ctx.mount(document.head,css);
 ui.el.setAttribute('aria-label','문 두드리기 타이밍 미니게임');
 const steps=document.createElement('div');steps.className='knock-steps';steps.innerHTML='<span>01</span><span>02</span><span>03</span>';ui.content.append(steps);
 const legend=document.createElement('div');legend.className='knock-legend';legend.innerHTML='<span>타이밍을 기다리세요</span><strong>초록 영역 = 성공</strong>';ui.content.append(legend);
 const track=document.createElement('div');track.className='experiment-track';track.setAttribute('aria-label','마커가 전체 구간의 40%에서 64% 사이일 때 성공');track.innerHTML='<i><em>성공</em></i><b></b>';ui.content.append(track);
 const feedback=document.createElement('div');feedback.className='knock-feedback';feedback.setAttribute('aria-live','polite');feedback.textContent='호흡을 고르고, 한 번씩';ui.content.append(feedback);
 actionButton(ctx,ui,document.body.dataset.mobile==='true'?'두드리기':'두드리기 · Space',()=>{
  const ms=ctx.elapsedMs();if(ms-last<350)return;last=ms;attempts++;const position=timingPosition(ms/1000,hits),success=timingHit(position);
  if(success)hits++;else misses++;ctx.onKnock?.({attempts,success,hits,misses});const quality=success?(position>=.48&&position<=.56?'perfect':'good'):'miss';
  ui.el.dataset.feedback=quality;feedback.textContent=quality==='perfect'?'정확해요!':quality==='good'?'좋아요':'빗나갔어요 · 다음 박자에';feedbackUntil=ms+850;
  [...steps.children].forEach((s,i)=>{s.classList.toggle('complete',i<hits);s.textContent=i<hits?'✓':String(i+1).padStart(2,'0');});
  ui.status.textContent=`성공 ${hits}/${c.count} · 빗나감 ${misses}`;
  if(hits>=c.count)ctx.finish({status:'success',metrics:{doorHits:hits,doorMisses:misses,doorAttempts:attempts,doorElapsedMs:ms}});
 },'Space');
 ui.status.textContent=`성공 0/${c.count} · 빗나감 0`;
 return {...ui,update(){const ms=ctx.elapsedMs();track.querySelector('b').style.left=timingPosition(ms/1000,hits)*100+'%';if(feedbackUntil&&ms>=feedbackUntil){feedbackUntil=0;delete ui.el.dataset.feedback;feedback.textContent='초록 구간에서 다음 두드림';}},dispose(){}};
}};
