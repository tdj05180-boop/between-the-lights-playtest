import {orders,riders,regionData} from './data.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
// Snapshot: 86 active + 34 waiting + 8 on break = 128 online.
// Five selected riders start deliveries (one NW/NE/SW, two SE): 91 active + 29 waiting + 8 break.
export const FIXED=[22,25,24,28]; // 99 unavailable to the regional reassignment task.
export const TARGETS=[[30,32,31,35],[30,32,33,33],[28,34,33,33],[30,34,31,33],[30,32,31,35]];
export function agencyPoints(m){
 if(m.completed!==5||m.managementMs!==10000)return {dispatch:0,management:0,total:0};
 const dispatch=Math.round(500*(.7*clamp(m.efficiency)+.3*clamp((110000-m.dispatchMs)/(110000-45000))));
 const management=Math.round(500*clamp(1-m.shortagePersonMs/40000));
 return {dispatch,management,total:dispatch+management};
}
// All times are supplied by the game's active clock. No wall-clock timer or random scoring.
export class ControlState {
 constructor(){Object.assign(this,{mode:'dispatch',selectedOrder:5,selectedRider:5,selectedRegion:3,tab:'riders',completed:[],assigned:[],route:null,feedback:'주문과 라이더를 선택한 뒤 배차하세요.',numbers:[29,34,31,34],demand:[...TARGETS[0]],pool:0,remaining:10,done:false,wave:0,dispatchScore:0,managementScore:0,quality:[],dispatchMs:0,managementMs:0,shortagePersonMs:0,managementStart:null,now:0});}
 assign(){
  if(this.mode!=='dispatch'||this.completed.length===5)return false;
  const o=orders.find(o=>o.id===this.selectedOrder),r=riders.find(r=>r.id===this.selectedRider);
  if(!o||!r||this.completed.includes(o.id)||this.assigned.includes(r.id)){this.feedback='배차 실패 · 이미 처리한 주문 또는 배달 중인 라이더입니다.';return false;}
  const distance=a=>Math.hypot(a.pos[0]-o.pos[0],a.pos[1]-o.pos[1]);
  const efficiency=(1+Math.min(...riders.filter(r=>!this.assigned.includes(r.id)).map(distance)))/(1+distance(r));
  this.quality.push(efficiency);this.completed.push(o.id);this.assigned.push(r.id);
  this.feedback=`주문 ${o.id} → 라이더 ${r.id} 배차 성공 · ${efficiency>.85?'가까운 라이더':'장거리 배차'} · ${this.completed.length}/5`;
  const next=orders.find(o=>!this.completed.includes(o.id));
  // Keep the last rider visibly "assigned"; the player chooses the next free rider.
  // Auto-selecting the nearest rider would award full efficiency without a decision.
  if(next){this.selectedOrder=next.id;}
  else{this.dispatchMs=this.now;this.managementStart=this.now+1100;this.dispatchScore=agencyPoints({...this.metrics(),managementMs:10000}).dispatch;}
  return true;
 }
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
  if(this.mode==='dispatch'&&this.managementStart!==null&&ms>=this.managementStart){this.mode='management';this.route=null;this.feedback='권역 운영 시작 · 여유 권역에서 회수 → 부족 권역에 배치';changed=true;}
  if(this.mode!=='management')return changed;
  const end=Math.min(10000,Math.max(0,ms-this.managementStart));
  // Integrate across phase boundaries, so a delayed frame cannot skip a demand wave.
  while(this.managementMs<end){
   const wave=Math.min(4,Math.floor(this.managementMs/2000)),to=Math.min(end,(wave+1)*2000);
   const shortage=TARGETS[wave].reduce((sum,d,i)=>sum+Math.max(0,d-this.numbers[i]),0);
   this.shortagePersonMs+=shortage*(to-this.managementMs);this.managementMs=to;
  }
  const next=Math.min(4,Math.floor(end/2000));
  if(next!==this.wave){this.wave=next;this.demand=[...TARGETS[next]];this.feedback='수요 변경 · 부족 권역과 여유 인력을 확인하세요.';changed=true;}
  this.remaining=(10000-end)/1000;
  if(end===10000){this.done=true;this.managementScore=agencyPoints(this.metrics()).management;changed=true;}
  return changed;
 }
 metrics(){return {completed:this.completed.length,efficiency:this.quality.reduce((s,v)=>s+v,0)/5,dispatchMs:this.dispatchMs,managementMs:this.managementMs,shortagePersonMs:this.shortagePersonMs,onlineTotal:this.numbers.reduce((s,v)=>s+v,0)+this.pool};}
 snapshot(){return {...this,kind:'agency-control',metrics:this.metrics()};}
}
