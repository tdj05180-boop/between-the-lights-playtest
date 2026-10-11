import {panel,actionButton} from '../ui.js';

// Integrate pressure over active game time, independently of the frame rate.
export function shutterFall(c,fromMs,toMs){
 const a=Math.max(0,Math.min(c.maxMs,fromMs))/1000,b=Math.max(0,Math.min(c.maxMs,toMs))/1000,max=c.maxMs/1000,p=c.fallPower??1;
 return c.baseFall*(b-a)+c.rampFall*(b**(p+1)-a**(p+1))/((p+1)*max**p);
}
export const lifeShutter={input:{movement:true,camera:true,interaction:true},create(ctx,c){
 const shutter=ctx.world().scene.userData.shutter;let amount=.5,last=0,closing=false,endedAt=0,finished=false;
 const ui=panel(ctx,'lifeShutter','버텨 낸 시간','Space 또는 버튼을 여러 번 눌러 버텨 보세요. 셔터는 결국 닫히지만, 버틴 시간이 점수가 됩니다.');
 shutter.focus=true;shutter.closing=false;shutter.target=amount;
 const b=actionButton(ctx,ui,'밀어 올리기',()=>{advance(ctx.elapsedMs());if(!closing){amount=Math.min(.95,amount+c.tapGain);shutter.target=amount;}},'Space');
 function close(ms){if(closing)return;closing=true;shutter.closing=true;endedAt=Math.min(ms,c.maxMs);shutter.target=0;b.disabled=true;ui.status.textContent='셔터가 닫힙니다. 이 장면은 정상적으로 다음 이야기로 이어집니다.';}
 function advance(ms){if(closing)return;const end=Math.min(ms,c.maxMs);amount=Math.max(0,amount-shutterFall(c,last,end));last=end;shutter.target=amount;
  if(amount===0&&ms>=c.graceMs||ms>=c.maxMs)close(end);
 }
 return {...ui,update({elapsedMs}){
  advance(elapsedMs);
  if(!closing)ui.status.textContent=`${(Math.min(elapsedMs,c.maxMs)/1000).toFixed(1)}초 / 최대 ${c.maxMs/1000}초 · 실제 개방 ${Math.round((shutter.openingFraction??shutter.progress)*100)}%`;
  // Finish on physical contact, without the old extra two-second wait. Closing earns no time.
  if(closing&&shutter.progress===0&&!finished){finished=true;ctx.finish({status:'success',score:1,metrics:{survivedMs:endedAt}});}
 },dispose(){shutter.focus=false;shutter.target=0;}};
}};
