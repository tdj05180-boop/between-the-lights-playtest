import {orders,riders,regionData} from './data.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
// Snapshot: 86 active + 34 waiting + 8 on break = 128 online.
// Three dispatch candidates are reused; regional totals remain an independent 128-person snapshot.
export const FIXED=[22,25,24,28]; // 99 unavailable to the regional reassignment task.
export const ORDER_LIMITS={1:16000,2:24000,3:12000,4:38000,5:44000};
export const pickupMs=(r,o)=>Math.round(2000+Math.hypot(r.pos[0]-o.pos[0],r.pos[1]-o.pos[1])*120);
// Road-space polyline shared by the moving bike and its remaining route.
export function roadRoute(from,to){
 const [rx,ry]=[from[0]*10,from[1]*8.4],[ox,oy]=[to[0]*10,to[1]*8.4];
 const xs=[190,359,516,694,856,985],ys=[181,343,398,589,741];
 const near=(values,n)=>values.reduce((a,b)=>Math.abs(a-n)<Math.abs(b-n)?a:b);
 const a=near(xs,rx),b=near(xs,ox),y=ys.reduce((v,q)=>Math.abs(ry-v)+Math.abs(oy-v)<Math.abs(ry-q)+Math.abs(oy-q)?v:q);
 return (a===b?[[rx,ry],[a,ry],[a,oy],[ox,oy]]:[[rx,ry],[a,ry],[a,y],[b,y],[b,oy],[ox,oy]])
  .filter((p,i,ps)=>!i||p[0]!==ps[i-1][0]||p[1]!==ps[i-1][1]);
}
export const routePath=points=>points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ');
export function sampleRoute(points,progress){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 let distance=lengths.reduce((a,b)=>a+b,0)*clamp(progress);
 for(let i=0;i<lengths.length;i++){if(distance<lengths[i]){const t=distance/lengths[i],a=points[i],b=points[i+1],point=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];return {pos:[point[0]/10,point[1]/8.4],remaining:[point,...points.slice(i+1)]};}distance-=lengths[i];}
 const last=points.at(-1);return {pos:[last[0]/10,last[1]/8.4],remaining:[]};
}
export function riderTravel(r,now){
 const job=r.trip;if(!job)return {pos:r.pos,remaining:[],phase:'idle'};
 const delivering=now>=job.arrival,path=delivering?job.deliveryRoute:job.pickupRoute;
 return {...sampleRoute(path,(now-(delivering?job.arrival:job.at))/((delivering?job.deliveredAt:job.arrival)-(delivering?job.arrival:job.at))),phase:delivering?'delivery':'pickup'};
}
export function createDispatchOrders(random=Math.random){
 const budgets=[12000,16000,20000,25000,29000];
 for(let i=budgets.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[budgets[i],budgets[j]]=[budgets[j],budgets[i]];}
 return orders.map((o,i)=>{const pos=[clamp(o.pos[0]+(random()-.5)*12,12,89),clamp(o.pos[1]+(random()-.5)*10,16,88)];const deadlineMs=Math.max(budgets[i]+Math.round((random()-.5)*2000),Math.min(...riders.slice(0,3).map(r=>pickupMs(r,{pos})))+6500);const offsets=[[13,12],[15,16],[-13,15],[-13,-14],[-15,-17]],offset=offsets[i];return {...o,pos,dropoff:[clamp(pos[0]+offset[0],12,89),clamp(pos[1]+offset[1],16,88)],deadlineMs};});
}
export const MANAGEMENT_MS=20000,WAVE_MS=4000;
export const TARGETS=[[30,32,31,35],[30,32,33,33],[28,34,33,33],[31,34,30,33],[31,31,30,36]];
export function agencyPoints(m){
 if(m.completed!==5||m.managementMs!==MANAGEMENT_MS)return {dispatch:0,management:0,total:0};
 const failed=Math.max(0,Math.min(5,m.failedOrders??0));
 const dispatch=Math.max(0,Math.round(500*(.7*clamp(m.efficiency)+.3*clamp((110000-m.dispatchMs)/(110000-45000))*(5-failed)/5)-failed*30));
 const management=Math.round(500*clamp(1-m.shortagePersonMs/80000));
 return {dispatch,management,total:dispatch+management};
}
// All times are supplied by the game's active clock. No wall-clock timer or random scoring.
export class ControlState {
 constructor({random=Math.random}={}){Object.assign(this,{orders:createDispatchOrders(random),mode:'dispatch',selectedOrder:5,selectedRider:1,riders:riders.slice(0,3).map(r=>({...r,pos:[...r.pos],busyUntil:0,destination:null})),lateOrders:0,failedOrders:[],dispatches:[],qualityByOrder:{},selectedRegion:3,tab:'riders',completed:[],assigned:[],route:null,feedback:'주문 5건 · 라이더 3명. 급한 주문과 픽업 시간을 보고 배차하세요.',numbers:[29,34,31,34],demand:[...TARGETS[0]],pool:0,remaining:MANAGEMENT_MS/1000,done:false,wave:0,dispatchScore:0,managementScore:0,quality:[],dispatchMs:0,managementMs:0,shortagePersonMs:0,managementStart:null,now:0});}
 assign(){
  if(this.mode!=='dispatch'||this.completed.length===5)return false;
  const o=this.orders.find(o=>o.id===this.selectedOrder),r=this.riders.find(r=>r.id===this.selectedRider);
  if(!o||!r||this.completed.includes(o.id)||this.assigned.includes(r.id)){this.feedback='배차 실패 · 이미 처리한 주문 또는 배달 중인 라이더입니다.';return false;}
  const distance=a=>Math.hypot(a.pos[0]-o.pos[0],a.pos[1]-o.pos[1]);
  const efficiency=(1+Math.min(...this.riders.filter(r=>!this.assigned.includes(r.id)).map(distance)))/(1+distance(r));
  const arrival=this.now+pickupMs(r,o),late=Math.max(0,arrival-o.deadlineMs);
  if(late>0)this.lateOrders++;
  this.completed.push(o.id);this.assigned.push(r.id);r.busyUntil=arrival+6000;r.destination=[...o.dropoff];
  const job={order:o.id,rider:r.id,at:this.now,arrival,deliveredAt:r.busyUntil,late,efficiency,resolved:false,delivered:false,pickupRoute:roadRoute(r.pos,o.pos),deliveryRoute:roadRoute(o.pos,o.dropoff)};
  this.dispatches.push(job);r.trip=job;this.route=null;
  this.feedback=`주문 ${o.id} → 라이더 ${r.id} 배차 성공 · ${late>0?'픽업 지연 예상':'여유 시간 내 픽업'} · ${this.completed.length}/5`;
  const next=this.orders.find(o=>!this.completed.includes(o.id));
  // Keep the last rider visibly "assigned"; the player chooses the next free rider.
  // Auto-selecting the nearest rider would award full efficiency without a decision.
  if(next){this.selectedOrder=next.id;}
  this.checkDispatchEnd();
  return true;
 }
 failOrder(id){if(this.failedOrders.includes(id))return;this.failedOrders.push(id);this.qualityByOrder[id]=0;if(!this.completed.includes(id))this.completed.push(id);this.feedback=`주문 ${id} 취소 · 픽업 기한 초과 · 배차 점수 감점`;}
 checkDispatchEnd(){if(this.managementStart!==null||this.completed.length!==5||this.dispatches.some(j=>!j.resolved)||this.assigned.length)return;this.dispatchMs=this.now;this.managementStart=this.now+1100;this.dispatchScore=agencyPoints({...this.metrics(),managementMs:MANAGEMENT_MS}).dispatch;}
 move(index,step){
  if(this.mode!=='management'||this.done||!Number.isInteger(index)||index<0||index>3||![-1,1].includes(step))return false;
  this.selectedRegion=index;
  if(step===1&&!this.pool){this.feedback='배치 실패 · 여유 권역에서 먼저 1명을 회수하세요.';return false;}
  if(step===-1&&(this.numbers[index]<=this.demand[index]||this.numbers[index]<=FIXED[index])){this.feedback='회수 불가 · 필요 인원과 업무 중인 인력은 유지해야 합니다.';return false;}
  this.numbers[index]+=step;this.pool-=step;this.feedback=`${regionData[index][0]} · ${step>0?'1명 배치':'1명 회수'} 완료`;return true;
 }
 update(ms){
  this.now=ms;let changed=false;
  if(this.done)return false;
  if(this.mode==='dispatch'){
   for(const job of this.dispatches){if(!job.resolved&&ms>=Math.min(job.arrival,this.orders.find(o=>o.id===job.order).deadlineMs)){job.resolved=true;if(job.late>0){this.failOrder(job.order);const r=this.riders.find(r=>r.id===job.rider);r.pos=riderTravel(r,this.orders.find(o=>o.id===job.order).deadlineMs).pos;r.trip=null;r.destination=null;r.busyUntil=0;this.assigned=this.assigned.filter(id=>id!==r.id);job.cancelled=true;}else{this.qualityByOrder[job.order]=job.efficiency;this.feedback=`주문 ${job.order} 픽업 완료 · 배달지로 이동`; }changed=true;}}
   for(const o of this.orders)if(!this.completed.includes(o.id)&&ms>=o.deadlineMs){this.failOrder(o.id);changed=true;}
   this.checkDispatchEnd();
  }
  if(this.mode==='dispatch')for(const r of this.riders){if(r.trip)r.pos=riderTravel(r,ms).pos;if(r.busyUntil>0&&ms>=r.busyUntil){r.pos=r.destination;r.trip.delivered=true;r.trip=null;r.destination=null;r.busyUntil=0;this.assigned=this.assigned.filter(id=>id!==r.id);this.feedback=`라이더 ${r.id} 배달 완료 · 도착지에서 다음 주문 대기`;changed=true;}}
  if(this.mode==='dispatch')this.checkDispatchEnd();
  if(this.mode==='dispatch'&&this.managementStart!==null&&ms>=this.managementStart){this.mode='management';this.route=null;this.feedback='권역 운영 시작 · 여유 권역에서 회수 → 부족 권역에 배치';changed=true;}
  if(this.mode!=='management')return changed;
  const end=Math.min(MANAGEMENT_MS,Math.max(0,ms-this.managementStart));
  // Integrate across phase boundaries, so a delayed frame cannot skip a demand wave.
  while(this.managementMs<end){
   const wave=Math.min(4,Math.floor(this.managementMs/WAVE_MS)),to=Math.min(end,(wave+1)*WAVE_MS);
   const shortage=TARGETS[wave].reduce((sum,d,i)=>sum+Math.max(0,d-this.numbers[i]),0);
   this.shortagePersonMs+=shortage*(to-this.managementMs);this.managementMs=to;
  }
  const next=Math.min(4,Math.floor(end/WAVE_MS));
  if(next!==this.wave){this.wave=next;this.demand=[...TARGETS[next]];this.feedback='수요 변경 · 부족 권역과 여유 인력을 확인하세요.';changed=true;}
  this.remaining=(MANAGEMENT_MS-end)/1000;
  if(end===MANAGEMENT_MS){this.done=true;this.managementScore=agencyPoints(this.metrics()).management;changed=true;}
  return changed;
 }
 metrics(){return {completed:this.completed.length,lateOrders:this.lateOrders,failedOrders:this.failedOrders.length,efficiency:Object.values(this.qualityByOrder).reduce((s,v)=>s+v,0)/5,dispatchMs:this.dispatchMs,managementMs:this.managementMs,shortagePersonMs:this.shortagePersonMs,onlineTotal:this.numbers.reduce((s,v)=>s+v,0)+this.pool};}
 get pressure(){return clamp(this.shortagePersonMs/80000);}
 snapshot(){return {...this,kind:'agency-control',metrics:this.metrics()};}
}
