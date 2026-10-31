const BASE=new URL('../../releases/integrated-20261031-control-perf2/agency-study/control-room/',import.meta.url);
const variants=[['baseline','기준 화면',''],['noRoutes','경로만 숨김','.route-layer{display:none!important}'],['noFilters','핀 그림자만 해제','.map-pin,.map-pin>svg,.route-preview{filter:none!important}'],['noMap','지도만 숨김','.city-art{visibility:hidden!important}'],['noTimer','숫자 갱신만 정지',''],['noMotion','이동 표시만 정지','.route-line{animation:none!important}'],['noMeter','FPS 패널만 숨김',''],['static','전체 UI 갱신 정지','.route-line{animation:none!important}'],['baselineEnd','기준 화면 재측정','']];
const $=id=>document.getElementById(id);let running=false,interrupted=false;
document.addEventListener('visibilitychange',()=>{if(running&&document.hidden)interrupted=true;});
window.addEventListener('resize',()=>{if(running)interrupted=true;});
$('again').onclick=()=>location.reload();
$('start').onclick=async()=>{
 if(running)return;running=true;$('intro').hidden=true;$('stage').hidden=false;$('stage').textContent='화면 준비 중';
 let host,ui,meter,meterWasEnabled;const rows=[];
 try{
 const [{createControlView},{ControlState},{installFpsMeter},css]=await Promise.all([import(new URL('game-view.js',BASE)),import(new URL('state.js',BASE)),import(new URL('../../src/systems/fps-meter.js',BASE)),fetch(new URL('control-room.css',BASE)).then(r=>{if(!r.ok)throw Error('CSS '+r.status);return r.text();})]);
 host=document.createElement('section');host.id='agencyControl';document.body.append(host);meter=installFpsMeter();meterWasEnabled=meter.enabled;const shadow=host.attachShadow({mode:'open'});
 for(const mode of ['dispatch','management'])for(const [variant,label,override]of variants){
  if(interrupted)throw Error('화면 전환 또는 크기 변경으로 측정이 중단됐습니다. 같은 방향을 유지한 채 다시 측정해 주세요.');
  $('stage').textContent=`${mode==='dispatch'?'배차':'권역'} · ${label} (${rows.length+1}/18)`;
  shadow.innerHTML='<style>'+css.replace(':root{',':host{').replace('body{',':host{')+override+'</style><div id="control-room"></div>';
  meter.setEnabled(variant!=='noMeter');const root=shadow.querySelector('#control-room'),s=new ControlState({random:()=>.5});ui=createControlView(root);s.orders.forEach(o=>o.deadlineMs=100000);
  for(let i=1;i<=3;i++){s.selectedRider=i;s.selectedOrder=i;s.assign();}s.mode=mode;if(mode==='management'){s.managementStart=0;s.riders.forEach(r=>r.trip=null);}
  ui.render(s);ui.timer(s);await Promise.all([...root.querySelectorAll('img')].map(i=>i.decode()));
  const frames=[],js=[];let start,last,lastTimer=0;
  await new Promise(resolve=>{function tick(t){if(!start){start=t;last=t;}const elapsed=t-start;if(elapsed>500)frames.push(t-last);last=t;const c=performance.now();meter.tick(t);if(variant!=='static'){const changed=s.update(elapsed);if(changed)ui.render(s);if(variant!=='noMotion')ui.motion(s);if(variant!=='noTimer'&&elapsed-lastTimer>=100){ui.timer(s);lastTimer=elapsed;}}js.push(performance.now()-c);if(elapsed>3500||interrupted)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
  frames.sort((a,b)=>a-b);js.sort((a,b)=>a-b);rows.push({mode,variant,label,fps:1000/(frames.reduce((a,b)=>a+b,0)/frames.length),p95:frames[Math.floor(frames.length*.95)],jsP95:js[Math.floor(js.length*.95)],width:innerWidth,height:innerHeight,dpr:devicePixelRatio});ui.dispose();ui=null;
 }
 if(interrupted)throw Error('화면이 전환돼 비교 결과를 사용할 수 없습니다. 다시 측정해 주세요.');
 $('summary').textContent=`${innerWidth}×${innerHeight} · 화면 배율 ${devicePixelRatio} · 아래 수치는 실시간 측정 FPS입니다.`;
 const table=document.createElement('table');table.innerHTML='<thead><tr><th>조건</th><th>배차 FPS</th><th>권역 FPS</th></tr></thead><tbody>'+variants.map(([v,label])=>'<tr><td>'+label+'</td>'+['dispatch','management'].map(mode=>'<td>'+rows.find(r=>r.mode===mode&&r.variant===v).fps.toFixed(1)+'</td>').join('')+'</tr>').join('')+'</tbody>';$('table').replaceChildren(table);
 $('report').textContent=JSON.stringify({status:'passed',version:'control-ablation-20261031',userAgent:navigator.userAgent,rows},null,2);
 }catch(e){$('summary').textContent=e.message;$('report').textContent=JSON.stringify({status:'failed',error:e.message,rows},null,2);}
 finally{running=false;ui?.dispose();if(meter){meter.setEnabled(meterWasEnabled);document.getElementById('fpsPanel').hidden=true;}host?.remove();$('stage').hidden=true;$('result').hidden=false;window.scrollTo(0,0);}
};
