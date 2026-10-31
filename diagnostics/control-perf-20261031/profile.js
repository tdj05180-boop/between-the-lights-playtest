const BASE=new URL('../../releases/integrated-20261031-control-perf2/agency-study/control-room/',import.meta.url);
const SHELL_CSS="\n:host{display:block}button:disabled{opacity:.65}.topbar nav button:disabled{opacity:1}.topbar .preview-tag{display:block;border:1px solid #8ba59f;border-radius:6px;padding:8px;color:#fff}@media(max-width:700px){#control-room{height:100dvh;overflow-y:auto}.topbar{height:80px}.topbar .preview-tag{font-size:10px;min-width:44px;min-height:36px;padding:5px}.brand{font-size:19px}.clock{gap:3px;padding:3px}.topbar nav{gap:4px}}";
const variants=[['baseline','기준 화면',''],['noRoutes','경로만 숨김','.route-layer{display:none!important}'],['noFilters','핀 그림자만 해제','.map-pin,.map-pin>svg,.route-preview{filter:none!important}'],['noMap','지도만 숨김','.city-art{visibility:hidden!important}'],['noTimer','숫자 갱신만 정지',''],['noMotion','이동 표시만 정지','.route-line{animation:none!important}'],['noMeter','FPS 패널만 숨김',''],['static','전체 UI 갱신 정지','.route-line{animation:none!important}'],['baselineEnd','기준 화면 재측정','']];
const $=id=>document.getElementById(id);let running=false,interrupted=false;
document.addEventListener('visibilitychange',()=>{if(running&&document.hidden)interrupted=true;});
window.addEventListener('resize',()=>{if(running)interrupted=true;});
$('again').onclick=()=>location.reload();
$('start').onclick=async()=>{
 if(running)return;document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';window.scrollTo(0,0);running=true;$('intro').hidden=true;$('stage').hidden=false;$('stage').textContent='화면 준비 중';
 let host,ui,meter,meterWasEnabled;const rows=[];
 try{
 const [{createControlView},{ControlState},{installFpsMeter},css]=await Promise.all([import(new URL('game-view.js',BASE)),import(new URL('state.js',BASE)),import(new URL('../../src/systems/fps-meter.js',BASE)),fetch(new URL('control-room.css',BASE)).then(r=>{if(!r.ok)throw Error('CSS '+r.status);return r.text();})]);
 host=document.createElement('section');host.id='agencyControl';host.style.cssText='position:fixed;inset:0;z-index:45;background:#f7f6ef;touch-action:manipulation';document.body.append(host);meter=installFpsMeter();meterWasEnabled=meter.enabled;const shadow=host.attachShadow({mode:'open'});
 for(const mode of ['dispatch','management'])for(const [variant,label,override]of variants){
  if(interrupted)throw Error('화면 전환 또는 크기 변경으로 측정이 중단됐습니다. 같은 방향을 유지한 채 다시 측정해 주세요.');
  $('stage').textContent=`${mode==='dispatch'?'배차':'권역'} · ${label} (${rows.length+1}/18)`;
  shadow.innerHTML='<style>'+css.replace(':root{',':host{').replace('body{',':host{')+SHELL_CSS+override+'</style><div id="control-room"></div>';
  meter.setEnabled(variant!=='noMeter');const root=shadow.querySelector('#control-room'),s=new ControlState({random:()=>.5});ui=createControlView(root);s.orders.forEach(o=>o.deadlineMs=100000);
  for(let i=1;i<=3;i++){s.selectedRider=i;s.selectedOrder=i;s.assign();}s.mode=mode;if(mode==='management'){s.managementStart=0;s.riders.forEach(r=>r.trip=null);}
  ui.render(s);ui.timer(s);await Promise.all([...root.querySelectorAll('img')].map(i=>i.decode()));
  // Same fixed shell as the game. On a vertically stacked layout, bring the
  // map under the sticky header before sampling; never benchmark an offscreen map.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const map=root.querySelector('.map-panel'),header=root.querySelector('.topbar');
  let rect=map.getBoundingClientRect(),head=header.getBoundingClientRect();
  if(rect.bottom>innerHeight||rect.top<head.bottom)root.scrollTop+=rect.top-Math.max(0,head.bottom);
  await new Promise(resolve=>requestAnimationFrame(resolve));
  const mapView=()=>{const r=map.getBoundingClientRect(),h=header.getBoundingClientRect();const top=Math.max(0,h.bottom);return {x:r.x,y:r.y,width:r.width,height:r.height,visibleWidth:Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left)),visibleHeight:Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(top,r.top)),availableHeight:innerHeight-top,rootScroll:root.scrollTop,pageScroll:scrollY};};
  const placement=mapView();
  const visible=p=>p.pageScroll===0&&p.visibleWidth>=p.width-2&&p.visibleHeight>=Math.min(p.height,p.availableHeight)-2;
  if(!visible(placement))throw Error('지도를 화면에 맞추지 못해 측정을 시작하지 않았습니다. 화면 방향과 크기를 알려 주세요.');
  const frames=[],js=[];let start,last,lastTimer=0;
  await new Promise(resolve=>{function tick(t){if(!start){start=t;last=t;}const elapsed=t-start;if(elapsed>500)frames.push(t-last);last=t;const c=performance.now();meter.tick(t);if(variant!=='static'){const changed=s.update(elapsed);if(changed)ui.render(s);if(variant!=='noMotion')ui.motion(s);if(variant!=='noTimer'&&elapsed-lastTimer>=100){ui.timer(s);lastTimer=elapsed;}}js.push(performance.now()-c);if(elapsed>3500||interrupted)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
  if(!visible(mapView()))throw Error('측정 중 지도가 화면 밖으로 벗어났습니다. 다시 측정해 주세요.');
  frames.sort((a,b)=>a-b);js.sort((a,b)=>a-b);rows.push({mode,variant,label,fps:1000/(frames.reduce((a,b)=>a+b,0)/frames.length),p95:frames[Math.floor(frames.length*.95)],jsP95:js[Math.floor(js.length*.95)],width:innerWidth,height:innerHeight,dpr:devicePixelRatio,mapView:placement});ui.dispose();ui=null;
 }
 if(interrupted)throw Error('화면이 전환돼 비교 결과를 사용할 수 없습니다. 다시 측정해 주세요.');
 $('summary').textContent=`${innerWidth}×${innerHeight} · 화면 배율 ${devicePixelRatio} · 아래 수치는 실시간 측정 FPS입니다.`;
 const table=document.createElement('table');table.innerHTML='<thead><tr><th>조건</th><th>배차 FPS</th><th>권역 FPS</th></tr></thead><tbody>'+variants.map(([v,label])=>'<tr><td>'+label+'</td>'+['dispatch','management'].map(mode=>'<td>'+rows.find(r=>r.mode===mode&&r.variant===v).fps.toFixed(1)+'</td>').join('')+'</tr>').join('')+'</tbody>';$('table').replaceChildren(table);
 $('report').textContent=JSON.stringify({status:'passed',version:'control-ablation-viewport2-20261031',userAgent:navigator.userAgent,rows},null,2);
 }catch(e){$('summary').textContent=e.message;$('report').textContent=JSON.stringify({status:'failed',error:e.message,rows},null,2);}
 finally{running=false;document.documentElement.style.overflow='';document.body.style.overflow='';ui?.dispose();if(meter){meter.setEnabled(meterWasEnabled);document.getElementById('fpsPanel').hidden=true;}host?.remove();$('stage').hidden=true;$('result').hidden=false;window.scrollTo(0,0);}
};
