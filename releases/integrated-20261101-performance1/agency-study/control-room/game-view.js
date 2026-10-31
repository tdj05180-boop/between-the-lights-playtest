import {MANAGEMENT_MS,WAVE_MS,pickupMs,roadRoute,routePath,riderTravel} from './state.js';
import {createCitySurface} from './city-map.js';
import {bike,bowl,portrait,regionData} from './data.js';
// Approved layout, isolated from the 3D game's global CSS by Shadow DOM.
export function createControlView(root){
const baseMap='<span data-city-surface></span>',surfaces=[];
let motionNodes=[],mapSize={width:0,height:0},mapObserver;
// Do not replace text nodes or invalidate styles when a displayed value is unchanged.
const text=(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=String(value);};
const html=(node,value)=>{if(node.innerHTML!==value)node.innerHTML=value;};
const data=(node,key,value)=>{if(node.dataset[key]!==String(value))node.dataset[key]=String(value);};
const style=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);};
const setAttribute=(node,key,value)=>{if(node.getAttribute(key)!==String(value))node.setAttribute(key,value);};
function bindSurfaces(){
 root.querySelectorAll('[data-city-surface]').forEach((slot,i)=>{surfaces[i]??=createCitySurface();slot.replaceWith(surfaces[i]);});
 mapObserver?.disconnect();const layer=root.querySelector('.city-layer');
 mapSize={width:0,height:0};
 if(layer){mapObserver=new ResizeObserver(([entry])=>{mapSize=entry.contentRect;if(state)motion(state);});mapObserver.observe(layer);}
 motionNodes=[...root.querySelectorAll('.map-panel [data-rider]')].map(pin=>({id:Number(pin.dataset.rider),pin,lines:[...root.querySelectorAll(`[data-trip-route="${pin.dataset.rider}"]`)]}));
}
let orders,riders,state,mode,selectedOrder,selectedRider,selectedRegion,tab,completed,assigned,route,feedback,numbers,demand,pool,remaining,done,running;
const distance=(r,o)=>(Math.hypot(r.pos[0]-o.pos[0],r.pos[1]-o.pos[1])*.04+.2).toFixed(1);
const chip=(s,cls='')=>`<span class="chip ${cls}">${s}</span>`;
const pathFor=(r,o)=>routePath(roadRoute(r.pos,o.pos));
const travelLabel=r=>!r.trip?'대기':
 r.trip.arrival>state.now?'픽업 이동':'배달 중';
const orderStatus=id=>state.failedOrders.includes(id)?'취소':state.qualityByOrder[id]>0?(state.dispatches.find(j=>j.order===id)?.delivered?'배달 완료':'배달 중'):completed.includes(id)?'픽업 이동 중':'배차 대기';
function header(){return `<header class="topbar"><a class="brand" href="#">다시, 불을 켜다</a><div class="chapter">CHAPTER 2026 <span>배달 플랫폼 운영</span></div><nav aria-label="업무 진행 단계"><button disabled class="${mode==='dispatch'?'current':''}">01 배차 관제</button><button disabled class="${mode==='management'?'current':''}">02 권역 운영</button></nav><div class="clock"><span class="moon">☾</span> 저녁 피크 <b>19:42</b></div><button class="preview-tag" data-action="timer">일시정지</button></header>`;}
function left(){if(mode==='dispatch'){const o=orders.find(o=>o.id===selectedOrder);return `<aside class="left-panel"><div class="intro"><div class="eyebrow">DISPATCH CONTROL</div><h1>배차 관제 · 주문 5건</h1><p>알맞은 라이더에게, 따뜻한 한 끼가 닿도록.</p></div><section class="card progress-card"><h3>주문 처리</h3><strong class="big">${completed.length}<small> / 5</small></strong><p class="dispatch-clock">배차 경과 <b data-dispatch-clock>0.0</b>초 · 라이더 3명 순환 배차</p><p class="dispatch-loss" data-failed>취소 ${state.failedOrders.length}건 · 취소 시 점수 감점</p><div class="steps">${orders.map(o=>`<span class="${completed.includes(o.id)?'filled':''}">${state.failedOrders.includes(o.id)?'×':completed.includes(o.id)?'✓':''}</span>`).join('')}</div><p>${completed.length===5?'남은 픽업과 배달이 끝나면 권역 운영으로 넘어갑니다.':'지도에서 주문과 라이더를 선택하세요.'}</p></section><section class="card stat-card"><div>${bike}<div><span>등록 라이더</span><b>607<small>명</small></b></div></div><div class="mini-stats"><span>온라인 <b>128</b></span><span>운영 권역 <b>4</b></span></div><small>전체 온라인 128명 중 가용 후보 3명 · 배달 후 다시 배차</small></section><section class="card order-detail"><div class="section-title"><h3>선택한 주문</h3>${chip('주문 '+o.id,'amber')}</div><div class="meal">${bowl}<div><h3>${o.meal}</h3><p>접수 후 ${o.age}분 · <b data-deadline="${o.id}"></b></p></div></div><dl><dt>픽업 위치</dt><dd>${o.shop}</dd><dt>배달 위치</dt><dd>${o.to}</dd><dt>주문 금액</dt><dd>${o.price}원</dd><dt>처리 상태</dt><dd>${chip(orderStatus(o.id),state.failedOrders.includes(o.id)?'amber':'')}</dd></dl></section></aside>`;}
 return `<aside class="left-panel"><div class="intro"><div class="eyebrow">REGIONAL OPERATIONS</div><h1>권역 운영 · 집중 대응</h1><p>20초 동안 수요가 바뀝니다. 마지막까지 부족을 줄이세요.</p></div><section class="card timer-card"><h3>남은 시간</h3><div class="timer-dial" style="--progress:${remaining/(MANAGEMENT_MS/1000)*100}%"><span class="timer-icon">◷</span><strong id="countdown"><span data-countdown-value>${remaining.toFixed(1)}</span><small>초</small></strong></div><button class="primary" data-action="timer">일시정지</button></section><section class="card pressure-card"><h3>미대응 누적 손실</h3><progress id="pressure" max="1" value="${state.pressure}"></progress><b id="pressure-label">${Math.round(state.pressure*500)}점</b><p id="wave-clock"></p></section><section class="card mission"><h3>이번 업무</h3><p>여유 권역에서 회수한 인원을<br>부족한 권역에 배치하세요.</p><ul><li>회수 → 대기 인력 확보</li><li>배치 → 부족 인원 보충</li><li>수요가 바뀌면 다시 대응</li></ul></section><section class="card stat-card"><div>${bike}<div><span>등록 라이더</span><b>607<small>명</small></b></div></div><div class="mini-stats"><span>온라인 <b>128</b></span><span>대기 인력 <b id="pool">${pool}</b></span></div><p>권역 ${numbers.reduce((a,b)=>a+b,0)} + 재배치 대기 ${pool} = 128명<br>업무 고정 99명 · 대기 29명만 재배치</p></section></aside>`;
}
function map(){let labels=regionData.map(([name,sub,cls],i)=>`<div class="district-label ${cls}"><b>${name}</b><span>${sub}</span></div>`).join('');let pins='';if(mode==='dispatch'){pins=orders.filter(o=>!completed.includes(o.id)||state.dispatches.some(j=>j.order===o.id&&!j.resolved)).map(o=>`<button aria-label="주문 ${o.id} 선택" data-order="${o.id}" ${completed.includes(o.id)?'disabled':''} class="map-pin order-pin ${selectedOrder===o.id?'selected':''}" style="left:${o.pos[0]}%;top:${o.pos[1]}%"><span class="pin-label">주문 ${o.id}<small class="order-time" data-deadline="${o.id}"></small></span><span class="pin-body order-fill" data-fill="${o.id}"><i class="urgency-fill"></i>${bowl}</span></button>`).join('')+riders.map(r=>`<button aria-label="라이더 ${r.id} 선택" data-rider="${r.id}" class="map-pin rider-pin ${selectedRider===r.id?'selected':''} ${assigned.includes(r.id)?'assigned':''}" ${assigned.includes(r.id)?'disabled':''} style="left:${r.pos[0]}%;top:${r.pos[1]}%">${bike}<span class="pin-label">라이더 ${r.id}<small class="rider-time" data-return="${r.id}"></small></span></button>`).join('');}else{labels='';pins=regionData.map(([name,sub,cls],i)=>{const delta=numbers[i]-demand[i],state=delta<0?'부족':delta>0?'여유':'안정';return `<section class="region-control ${cls} ${delta<0?'short':delta>0?'surplus':'balanced'} ${selectedRegion===i?'chosen':''}" aria-label="${name}"><button class="region-heading" data-region="${i}"><b>${name}</b>${chip(state)}</button><p class="region-sub">${sub}</p><strong class="region-balance">${delta<0?`▲ ${-delta}명 부족`:delta>0?`↓ ${delta}명 회수 가능`:'✓ 충족'}</strong><div class="region-values"><span>온라인 <b>${numbers[i]}명</b></span><span>업무 필요 <b>${demand[i]}명</b></span><span class="delta">여유 / 부족 <b>${delta>0?'+':''}${delta}명</b></span></div><div class="region-actions"><button data-move="-1" data-index="${i}" aria-label="${name} 회수">− 회수</button><button data-move="1" data-index="${i}" aria-label="${name} 배치">＋ 배치</button></div></section>`;}).join('');}
 let line='';if(mode==='dispatch'){
  const r=riders.find(r=>r.id===selectedRider),o=orders.find(o=>o.id===selectedOrder);
  if(!assigned.includes(r.id)&&!completed.includes(o.id))line=`<path class="route-preview" d="${pathFor(r,o)}"/>`;
  line+=riders.filter(r=>r.trip).map(r=>`<path class="route-glow" data-trip-route="${r.id}"/><path class="route-line" data-trip-route="${r.id}"/>`).join('');
  pins+=riders.filter(r=>r.trip).map(r=>`<div class="delivery-pin" data-delivery="${r.id}" style="left:${r.destination[0]}%;top:${r.destination[1]}%">⌂<small>배달 ${r.trip.order}</small></div>`).join('');
 }

 return `<section class="map-panel" aria-label="도시 지도"><div class="city-layer">${baseMap}<div class="zone-tints"><i></i><i></i><i></i><i></i></div><svg class="route-layer" viewBox="0 0 1000 840" preserveAspectRatio="none" aria-hidden="true">${line}</svg>${labels}${pins}</div>${mode==='dispatch'?'<div class="pickup-estimate" data-pickup-estimate role="status"></div>':''}<div class="compass">N<span>▲</span></div><div class="map-legend">${mode==='dispatch'?'<span class="dot teal"></span> 라이더 <span class="dot gold"></span> 주문':'<span class="dot teal"></span> 회수 가능 <span class="dot gold"></span> 증원 필요'}</div><div class="map-scale">가상 운영 지도 <span>250 m ━</span></div></section>`;
}
function right(){if(mode==='dispatch'){const r=riders.find(r=>r.id===selectedRider),o=orders.find(o=>o.id===selectedOrder);return `<aside class="right-panel"><div class="tabs"><button data-tab="riders" class="${tab==='riders'?'active':''}">라이더 목록 (3)</button><button data-tab="orders" class="${tab==='orders'?'active':''}">주문 목록 (${5-completed.length})</button></div><div class="candidate-list">${tab==='riders'?riders.map(v=>`<button class="candidate ${selectedRider===v.id?'active':''}" data-rider="${v.id}" ${assigned.includes(v.id)?'disabled':''}>${bike}<span><b>라이더 ${v.id}</b><small>${regionData[v.zone][0]}</small></span><span class="candidate-state"><i class="dot teal"></i> <b data-return="${v.id}"></b><small>${v.trip?`주문 ${v.trip.order} 운행 중`:`${distance(v,o)} km · 픽업 ${(pickupMs(v,o)/1000).toFixed(1)}초`}</small></span></button>`).join(''):orders.map(v=>`<button class="candidate ${selectedOrder===v.id?'active':''}" data-order="${v.id}" ${completed.includes(v.id)?'disabled':''}>${bowl}<span><b>주문 ${v.id}</b><small>${regionData[v.zone][0]}</small></span><span>${completed.includes(v.id)?orderStatus(v.id):`<b data-deadline="${v.id}"></b>`}</span></button>`).join('')}</div><section class="card rider-detail"><div class="section-title"><h3>선택한 라이더</h3>${chip('라이더 '+r.id)}</div><div class="person">${portrait}<div><strong><i class="dot teal"></i> ${assigned.includes(r.id)?travelLabel(r):'배차 가능'}</strong><p>${regionData[r.zone][0]}</p></div></div><dl>${r.trip?`<dt>진행 주문</dt><dd>주문 ${r.trip.order}</dd><dt>이동 상태</dt><dd data-return="${r.id}"></dd>`:`<dt>픽업까지</dt><dd>${distance(r,o)} km</dd><dt>예상 이동</dt><dd>픽업 ${(pickupMs(r,o)/1000).toFixed(1)}초 · 배달 6초</dd>`}<dt>현재 상태</dt><dd>${travelLabel(r)}</dd></dl></section><div class="action-dock"><button class="primary assign" data-action="assign" ${completed.includes(o.id)||assigned.includes(r.id)?'disabled':''}>${bike} 배차하기</button><p class="selection-hint">${completed.length===5?'픽업·배달 완료 대기 중 · 취소 주문은 감점됩니다.':'급한 주문 우선 · 배달 완료 지점에서 다시 배차'}</p></div></aside>`;}
 const i=selectedRegion,delta=numbers[i]-demand[i];return `<aside class="right-panel"><div class="tabs"><span class="active">권역 상세 정보</span><span>전체 현황</span></div><section class="card region-detail ${delta<0?'short':delta>0?'surplus':'balanced'}"><div class="section-title"><h2>${regionData[i][0]}</h2>${chip(delta<0?'인원 부족':delta>0?'여유':'안정',delta<0?'amber':'')}</div><p>${regionData[i][1]}</p><div class="district-scene">${baseMap}</div><dl><dt>현재 온라인</dt><dd>${numbers[i]}명</dd><dt>업무 필요 인원</dt><dd>${demand[i]}명</dd><dt>여유 / 부족</dt><dd class="${delta<0?'warm':''}">${delta>0?'+':''}${delta}명</dd></dl><div class="notice"><b>${delta<0?'증원 필요':delta>0?'재배치 가능':'인원 균형 유지'}</b><p>${delta<0?`${-delta}명을 배치하면 현재 수요를 충족합니다.`:delta>0?`최대 ${delta}명을 부족한 권역으로 옮길 수 있습니다.`:'다른 권역의 수요도 함께 확인하세요.'}</p></div></section><section class="card suggestion"><div class="person">${portrait}<div><h3>운영 제안</h3><p>${numbers.some((n,j)=>n>demand[j])?'여유 권역에서 회수한 뒤 부족 권역에 배치하세요.':'재배치 대기 인원을 확인하세요.'}</p></div></div></section><div class="action-dock"><small>인력 이동은 즉시 반영됩니다.</small></div></aside>`;
}
function render(){root.innerHTML=header()+`<main class="workspace ${mode}">${left()}${map()}${right()}</main><footer><span class="live-dot"></span><strong>${mode==='dispatch'?'배차 현황':'권역 현황'}</strong><span class="feedback" role="status">${feedback}</span><small>가상 운영 데이터 · 배차 500 + 권역 500점</small></footer>`;root.dataset.mode=mode;root.dataset.completed=completed.length;root.dataset.total=numbers.reduce((a,b)=>a+b,0)+pool;root.dataset.remaining=remaining;root.dataset.wave=state.wave;root.dataset.dispatchScore=state.dispatchScore;root.dataset.managementScore=state.managementScore;}

function motion(s){
 if(s.mode!=='dispatch'||!mapSize.width||!mapSize.height)return;
 for(const {id,pin,lines} of motionNodes){
  const r=s.riders.find(r=>r.id===id),travel=riderTravel(r,s.now);
  const transform=`translate3d(${(travel.pos[0]*mapSize.width/100).toFixed(2)}px,${(travel.pos[1]*mapSize.height/100).toFixed(2)}px,0) translate(-50%,-50%)`;
  if(pin.style.transform!==transform){pin.style.left='0px';pin.style.top='0px';pin.style.transform=transform;}
  if(pin.dataset.phase!==travel.phase)pin.dataset.phase=travel.phase;
  const path=routePath(travel.remaining);
  for(const line of lines){setAttribute(line,'d',path);const delivery=travel.phase==='delivery';if(line.classList.contains('delivery-route')!==delivery)line.classList.toggle('delivery-route',delivery);}
 }
}
// Keep the actual touch targets mounted across taps and demand changes. Replacing
// the whole screen between pointerdown and click can drop Safari's next tap.
function patchManagement(){
 for(const [i,el] of [...root.querySelectorAll('.region-control')].entries()){
  const delta=numbers[i]-demand[i];
  el.classList.toggle('short',delta<0);el.classList.toggle('surplus',delta>0);el.classList.toggle('balanced',delta===0);el.classList.toggle('chosen',selectedRegion===i);
  text(el.querySelector('.chip'),delta<0?'부족':delta>0?'여유':'안정');
  text(el.querySelector('.region-balance'),delta<0?`▲ ${-delta}명 부족`:delta>0?`↓ ${delta}명 회수 가능`:'✓ 충족');
  const values=el.querySelectorAll('.region-values b');text(values[0],numbers[i]+'명');text(values[1],demand[i]+'명');text(values[2],(delta>0?'+':'')+delta+'명');
 }
 text(root.querySelector('#pool'),pool);
 html(root.querySelector('.left-panel .stat-card p'),`권역 ${numbers.reduce((a,b)=>a+b,0)} + 재배치 대기 ${pool} = 128명<br>업무 고정 99명 · 대기 29명만 재배치`);
 const detail=root.querySelector('.region-detail'),i=selectedRegion,delta=numbers[i]-demand[i];
 detail.classList.toggle('short',delta<0);detail.classList.toggle('surplus',delta>0);detail.classList.toggle('balanced',delta===0);
 text(detail.querySelector('h2'),regionData[i][0]);text(detail.querySelector(':scope>p'),regionData[i][1]);
 const badge=detail.querySelector('.chip');text(badge,delta<0?'인원 부족':delta>0?'여유':'안정');badge.classList.toggle('amber',delta<0);
 const fields=detail.querySelectorAll('dd');text(fields[0],numbers[i]+'명');text(fields[1],demand[i]+'명');text(fields[2],(delta>0?'+':'')+delta+'명');fields[2].classList.toggle('warm',delta<0);
 text(detail.querySelector('.notice b'),delta<0?'증원 필요':delta>0?'재배치 가능':'인원 균형 유지');
 text(detail.querySelector('.notice p'),delta<0?`${-delta}명을 배치하면 현재 수요를 충족합니다.`:delta>0?`최대 ${delta}명을 부족한 권역으로 옮길 수 있습니다.`:'다른 권역의 수요도 함께 확인하세요.');
 text(root.querySelector('.suggestion p'),numbers.some((n,j)=>n>demand[j])?'여유 권역에서 회수한 뒤 부족 권역에 배치하세요.':'재배치 대기 인원을 확인하세요.');
 text(root.querySelector('footer .feedback'),feedback);
 data(root,'total',numbers.reduce((a,b)=>a+b,0)+pool);data(root,'wave',state.wave);data(root,'remaining',remaining);data(root,'managementScore',state.managementScore);
}
function estimate(s){
 const el=root.querySelector('[data-pickup-estimate]');if(!el)return;
 const r=s.riders.find(r=>r.id===s.selectedRider),o=s.orders.find(o=>o.id===s.selectedOrder);
 if(r.trip){text(el,`라이더 ${r.id} · 주문 ${r.trip.order} ${s.now<r.trip.arrival?'픽업 이동':'배달 중'} · 완료 후 다시 배차 가능`);data(el,'late',false);return;}
 if(s.completed.includes(o.id)){text(el,'대기 중인 주문과 라이더를 선택하세요.');data(el,'late',false);return;}
 const duration=pickupMs(r,o),margin=o.deadlineMs-s.now-duration;
 text(el,`라이더 ${r.id} → 주문 ${o.id} · 픽업 ${(duration/1000).toFixed(1)}초 · ${margin>=0?'마감 전 '+(margin/1000).toFixed(1)+'초 여유':'마감 '+(-margin/1000).toFixed(1)+'초 초과 예상'}`);
 data(el,'late',margin<0);
}
return {render(s){state=s;orders=s.orders;riders=s.riders;({mode,selectedOrder,selectedRider,selectedRegion,tab,completed,assigned,route,feedback,numbers,demand,pool,remaining,done}=s);running=true;if(mode==='management'&&root.dataset.mode==='management')patchManagement();else {render();bindSurfaces();}motion(s);estimate(s);},motion,timer(s){
 estimate(s);
 for(const fill of root.querySelectorAll('[data-fill]')){
  const id=fill.dataset.fill,ratio=Math.max(0,Math.min(1,s.now/s.orders.find(o=>o.id===Number(id)).deadlineMs));
  style(fill,'--urgency',ratio*100+'%');setAttribute(fill,'aria-label',`주문 ${id} 대기 한계 ${Math.round(ratio*100)}%`);
 }
 for(const el of root.querySelectorAll('[data-deadline]')){
  const id=Number(el.dataset.deadline);
  if(s.failedOrders.includes(id)||s.qualityByOrder[id]>0){text(el,orderStatus(id));data(el,'urgent',false);continue;}
  const left=(s.orders.find(o=>o.id===id).deadlineMs-s.now)/1000;
  let label=left>0?`마감 ${left.toFixed(1)}초`:`지연 ${(-left).toFixed(1)}초`;
  data(el,'urgent',left<10);
  const job=s.dispatches.find(j=>j.order===id&&!j.resolved);
  if(job)label+=` · 픽업 ${Math.max(0,(job.arrival-s.now)/1000).toFixed(1)}초`;
  else if(id===s.selectedOrder&&!s.completed.includes(s.selectedOrder)){
   const r=s.riders.find(r=>r.id===s.selectedRider);
   if(r&&!s.assigned.includes(r.id))label+=` · 픽업 예상 ${(pickupMs(r,s.orders.find(o=>o.id===s.selectedOrder))/1000).toFixed(1)}초`;
  }
  text(el,label);
 }
 for(const el of root.querySelectorAll('[data-return]')){
  const r=s.riders.find(r=>r.id===Number(el.dataset.return)),left=Math.max(0,(r.busyUntil-s.now)/1000);
  text(el,left>0?(s.now<r.trip?.arrival?`픽업 ${((r.trip.arrival-s.now)/1000).toFixed(1)}초`:`배달 ${left.toFixed(1)}초`):'대기');
 }
 const pressure=root.querySelector('#pressure');if(pressure&&pressure.value!==s.pressure)pressure.value=s.pressure;
 text(root.querySelector('#pressure-label'),`${Math.round(s.pressure*500)}점 손실 · 부족을 채우면 증가 중단`);
 text(root.querySelector('#wave-clock'),`수요 ${s.wave+1}/5 · 다음 변경 ${Math.max(0,(WAVE_MS-s.managementMs%WAVE_MS)/1000).toFixed(1)}초`);
 text(root.querySelector('[data-dispatch-clock]'),(s.now/1000).toFixed(1));
 text(root.querySelector('[data-failed]'),`취소 ${s.failedOrders.length}건 · 취소 시 점수 감점`);
 text(root.querySelector('[data-countdown-value]'),s.remaining.toFixed(1));
 const dial=root.querySelector('.timer-dial');if(dial)style(dial,'--progress',s.remaining/(MANAGEMENT_MS/1000)*100+'%');
 data(root,'remaining',s.remaining);
},dispose(){mapObserver?.disconnect();motionNodes=[];surfaces.length=0;},pathFor};}


