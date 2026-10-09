import {panel,actionButton} from '../ui.js';
import {timingHit,timingPosition} from '../../src/systems/timing.js';
export const door={input:{movement:true,camera:true,interaction:true},create(ctx,c){
 const ui=panel(ctx,'door','새로운 문','밝은 구간에서 누르기 · 기존 불씨 모으기와 같은 타이밍 규칙');let hits=0,last=-Infinity;
 const track=document.createElement('div');track.className='experiment-track';track.innerHTML='<i></i><b></b>';ui.content.append(track);
 actionButton(ctx,ui,'문 두드리기 · Space',()=>{const ms=ctx.elapsedMs();if(ms-last<350)return;last=ms;if(timingHit(timingPosition(ms/1000,hits))){hits++;if(hits>=c.count)ctx.finish({status:'success'});}ui.status.textContent=`성공 ${hits}/${c.count}`;},'Space');
 return {...ui,update(){track.querySelector('b').style.left=timingPosition(ctx.elapsedMs()/1000,hits)*100+'%';},dispose(){}};
}};
