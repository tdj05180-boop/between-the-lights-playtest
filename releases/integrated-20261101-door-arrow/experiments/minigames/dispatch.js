import {press} from '../ui.js';
import {dashboard,bike,food,names} from '../../agency-study/ui.js';
export function efficiency(order,rider,riders){const d=a=>Math.hypot(a.x-order.x,a.y-order.y);return (1+Math.min(...riders.filter(r=>!r.busy).map(d)))/(1+d(rider));}
export const dispatch={input:{movement:true,camera:true,interaction:true},create(ctx,c){
 const {view,scene}=ctx.world();view.features.focus.active=true;let selected=null,completed=0,eff=0,next=0;const riders=c.riders.map((p,i)=>({...p,id:i,busy:0})),orders=[];
 const ui=dashboard(ctx,'dispatch','배차 관제 · 주문 5건','음식 주문을 선택한 뒤 가까운 대기 라이더를 누르세요.');
 names.forEach((n,i)=>{const el=document.createElement('span');el.className='map-zone';el.textContent=n;el.style.left=(i%2?74:26)+'%';el.style.top=(i<2?6:94)+'%';ui.map.append(el);});
 for(const r of riders){const b=document.createElement('button');b.className='map-token rider';b.style.left=r.x+'%';b.style.top=r.y+'%';b.innerHTML=bike+`<span>라이더 ${r.id+1}</span>`;b.setAttribute('aria-label',`라이더 ${r.id+1}`);ui.map.append(b);r.button=b;press(ctx,b,()=>{
  const o=orders.find(o=>o.id===selected&&!o.sent);if(!o){ui.feedback.textContent='먼저 배차할 음식 주문을 선택하세요.';return;}if(r.busy>ctx.elapsedMs()){ui.feedback.textContent='이 라이더는 배달 중입니다.';return;}
  const free=riders.map(a=>({...a,busy:a.busy>ctx.elapsedMs()})),quality=efficiency(o,r,free);eff+=quality;o.sent=true;o.button.remove();completed++;selected=null;
  ui.link(r,o);ui.feedback.textContent=`주문 ${o.id+1} 배차 완료 · ${quality>.85?'가까운 라이더':'이동 거리가 긴 배차'} · ${completed}/${c.count}`;
  r.busy=ctx.elapsedMs()+c.travelMs;ctx.after(c.travelMs,()=>{r.x=o.x;r.y=o.y;b.style.left=r.x+'%';b.style.top=r.y+'%';});
  if(completed===c.count)ctx.finish({status:'success',metrics:{efficiency:eff/c.count,elapsedMs:ctx.elapsedMs()}});
 });}
 function add(){const o={...c.orders[next],id:next++,sent:false};orders.push(o);const b=document.createElement('button');o.button=b;b.className='map-token order';b.style.left=o.x+'%';b.style.top=o.y+'%';b.innerHTML=food+`<span>주문 ${o.id+1}</span>`;b.setAttribute('aria-label',`주문 ${o.id+1}`);ui.map.append(b);press(ctx,b,()=>{selected=o.id;for(const a of orders)a.button.dataset.selected=String(a.id===selected);ui.feedback.textContent=`주문 ${o.id+1} 선택 · 대기 라이더를 선택하세요.`;});}
 return {...ui,update(){const ms=ctx.elapsedMs();if(next<c.count&&ms>=next*c.intervalMs)add();for(const r of riders){r.button.disabled=r.busy>ms;r.button.querySelector('span').textContent=(r.busy>ms?'배달 중 ':'라이더 ')+(r.id+1);}const pending=orders.filter(o=>!o.sent).length;ui.status.textContent=`배차 ${completed}/${c.count} · 대기 주문 ${pending}/5 · 운영 규모 600+`;
 scene.userData.experiment={kind:'dispatch',completed,selected,orders:orders.filter(o=>!o.sent).map(({id,x,y})=>({id,x,y})),riders:riders.map(({id,x,y,busy})=>({id,x,y,busy:busy>ms}))};if(pending>=5)ctx.finish({status:'failure',reason:'backlog'});},dispose(){view.features.focus.active=false;delete scene.userData.experiment;}};
}};
