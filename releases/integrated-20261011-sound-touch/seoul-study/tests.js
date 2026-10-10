import {createTraffic} from './traffic.js';
import * as T from "../src/vendor/three.module.min.js";
import {scoreRound} from '../experiments/scoring.js';
const frame=document.querySelector('#game'),out=document.querySelector('#result'),w=()=>frame.contentWindow,d=()=>frame.contentDocument,s=()=>w().gameStatus?.(),v=()=>w().seoulView;
let reports=[],errors=[],held=new Set(),mobile=false,stick=false;
const wait=ms=>new Promise(r=>setTimeout(r,ms));function show(status='running',extra={}){out.textContent=JSON.stringify({status,reports,errors,...extra},null,2);}function check(ok,name,extra={}){if(!ok)throw Error(name);reports.push({name,...extra});show();}
async function until(fn,ms=20000){const end=performance.now()+ms;while(!fn()){if(performance.now()>end)throw Error('Timeout '+fn);await wait(25);}}
function keys(next=[]){next=new Set(next);for(const c of held)if(!next.has(c))w().dispatchEvent(new(w().KeyboardEvent)('keyup',{code:c,bubbles:true}));for(const c of next)w().dispatchEvent(new(w().KeyboardEvent)('keydown',{code:c,bubbles:true}));held=next;}
function pointer(id,type,dx=0,dy=0,pointerId=17){const b=d().getElementById(id);if(!b&&type==='pointerup')return;if(!b)throw Error('Missing input '+id);const r=b.getBoundingClientRect();b.setPointerCapture=()=>{};b.hasPointerCapture=()=>true;b.releasePointerCapture=()=>{};b.dispatchEvent(new(w().PointerEvent)(type,{pointerId,pointerType:'touch',button:0,clientX:r.x+r.width/2+dx*r.width*.35,clientY:r.y+r.height/2+dy*r.height*.35,bubbles:true,cancelable:true}));delete b.setPointerCapture;delete b.hasPointerCapture;delete b.releasePointerCapture;}
function stop(){keys();if(stick){pointer('joystick','pointerup');pointer('runBtn','pointerup',0,0,18);stick=false;}}
function action(){if(mobile){pointer('interactBtn','pointerdown');pointer('interactBtn','pointerup');}else{keys(['KeyE']);keys();}}
async function load(touch=false){frame.scrollIntoView();mobile=touch;reports=[];errors=[];held.clear();stick=false;show();frame.style.width=touch?'844px':'1100px';frame.style.height=touch?'390px':'690px';frame.src=(new URLSearchParams(location.search).has('audio')?'./audio-play.html':'./play.html')+'?t='+performance.now();await new Promise(r=>frame.addEventListener('load',r,{once:true}));await until(()=>s()&&!d().getElementById('startBtn').disabled);w().addEventListener('error',e=>errors.push(e.message));w().addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));d().getElementById('startBtn').click();await until(()=>s().started&&!s().movementLocked);action();await until(()=>s().content?.kind==='seoul-lights');}
async function run(fn){try{await fn();check(errors.length===0,'브라우저 오류 없음');show('passed',{state:s()});}catch(e){stop();show('failed',{error:e.message,state:s()});}}
async function walkRaw(tx,tz){const returns=s().content?.returnCount,end=performance.now()+180000;while(Math.hypot(s().position.x-tx,s().position.z-tz)>.23&&!s().content?.completed){if(performance.now()>end)throw Error('Walk timeout '+tx+','+tz);if(s().content?.returning||s().content?.returnCount!==returns){stop();throw Error('Replan after return');}if(s().movementLocked){stop();await wait(30);continue;}
 const p=s().position,dx=tx-p.x,dz=tz-p.z,yaw=s().camera.currentYaw,ix=dx*Math.cos(yaw)-dz*Math.sin(yaw),iz=dx*Math.sin(yaw)+dz*Math.cos(yaw),m=Math.max(Math.abs(ix),Math.abs(iz));
 if(mobile){const len=Math.hypot(ix,iz);if(!stick){pointer('joystick','pointerdown',ix/len,iz/len);stick=true;}else {pointer('joystick','pointerdown',ix/len,iz/len);pointer('joystick','pointermove',ix/len,iz/len);}}
 else keys([...(Math.abs(ix)>m*.4?[ix>0?'KeyD':'KeyA']:[]),...(Math.abs(iz)>m*.4?[iz>0?'KeyS':'KeyW']:[])]);await wait(30);
 }stop();await wait(90);}
// Browser verification driver: wait for real gaps instead of blindly running through cars.
async function walk(tx,tz){
 const gaps=[-8.7,-6.7,-3.4,0,3.4,6.7,8.7],deadline=performance.now()+300000;
 async function step(x,z){
  while(true){if(performance.now()>deadline)throw Error('Traffic-aware route timeout');
   if(s().content?.returning){stop();throw Error('Replan after return');}
   const p=s().position,distance=Math.hypot(x-p.x,z-p.z);if(distance<.15)return;
   const duration=distance/2.55+.65,loZ=Math.min(p.z,z)-1.47,hiZ=Math.max(p.z,z)+1.47,loX=Math.min(p.x,x)-3.05,hiX=Math.max(p.x,x)+3.05;
   const blocked=v().features.cars.some(c=>c.z>loZ&&c.z<hiZ&&Math.max(c.x,c.x+c.dir*c.max*duration)>loX&&Math.min(c.x,c.x+c.dir*c.max*duration)<hiX);
   if(!blocked)break;stop();await wait(40);
  }
  await walkRaw(x,z);
 }
 for(let attempt=0;attempt<10;attempt++){
  await until(()=>!s().content?.returning);try{
  const p=s().position,direction=Math.sign(tz-p.z)||1;
  // Leave a collected light's lane before changing X; waiting gaps are between vehicle envelopes.
  const near=gaps.filter(z=>direction*(z-p.z)>=-.42).sort((a,b)=>Math.abs(a-p.z)-Math.abs(b-p.z))[0]??gaps.at(direction>0?-1:0);
  await step(p.x,near);await step(tx,near);
  const points=gaps.filter(z=>direction*(z-near)>.1&&direction*(tz-z)>.1).sort((a,b)=>direction*(a-b));
  for(const z of [...points,tz]){await step(tx,z);if(s().content?.returning)break;}
  if(Math.hypot(s().position.x-tx,s().position.z-tz)<.5)return;
  }catch(e){if(e.message!=='Replan after return')throw e;}
 }
 throw Error('Route interrupted repeatedly');
}
async function collect(){const pts=[...s().content.lights];for(const p of pts){await walk(p.x,p.z);await until(()=>s().content?.collected.includes(p.id)||s().dialogue);check(!v().features.lights.find(l=>l.id===p.id).model.visible,'접촉 수집 및 표시 제거',{id:p.id});}}
async function knock(photoOnly=false){
 check(s().content?.lightsComplete&&s().minigame,'빛 3개 후 미니게임 유지');check(d().getElementById('partResultOverlay').hidden&&s().chapterId==='seoul','빛 수집만으로 결과/전환 없음');check(v().features.exitGlow.visible,'목적지 문 안내 빛 활성화');check(v().features.exit.z < -5.1 && v().features.exit.x>=8,'마지막 빛 너머 목적지: 시작 인도로 되돌아가지 않음');
 const exit=v().features.exit;await walk(exit.x,exit.z-Math.sign(exit.z)*.6);await until(()=>s().nearest==='seoul-door'&&!s().content.stunned);action();await until(()=>!!d().querySelector('#door .experiment-track b'));check(s().movementLocked,'문 타이밍 중 이동 잠금');if(photoOnly){await until(()=>[...d().querySelectorAll('link')].some(l=>l.href.includes('door.css')&&l.sheet));return;}
 const config=await fetch('../experiments/data/scores.json').then(r=>r.json());check(config.seoul.maxScore===1000&&Object.values(config).reduce((n,c)=>n+c.maxScore,0)===6000,'서울 포함 6파트 총 6000점');
 if(mobile){await until(()=>parseFloat(d().querySelector('#door .experiment-track b').style.left)<20);pointer('experimentAction','pointerdown');pointer('experimentAction','pointerup');await wait(400);check(d().querySelector('#door output').textContent.includes('빗나감 1'),'문 타이밍 실패도 성과에 반영');} let last=-Infinity;const end=performance.now()+30000;while(s().content?.phase==='knocking'||d().querySelector('#door')){if(performance.now()>end)throw Error('Door timing timeout');const bar=d().querySelector('#door .experiment-track b');if(!bar)break;const left=parseFloat(bar.style.left);if(left>45&&left<59&&performance.now()-last>400){if(mobile){pointer('experimentAction','pointerdown');pointer('experimentAction','pointerup');}else{keys(['Space']);keys();}last=performance.now();}await wait(20);}
 check(s().minigameResult?.metrics?.doorHits===3,'기존 타이밍 입력 3회 성공 후에만 종료');
}
async function result(confirm=true){await until(()=>!d().getElementById('partResultOverlay').hidden);const receipt=s().minigameResult,config=await fetch('../experiments/data/scores.json').then(r=>r.json()),expected=scoreRound('seoul',receipt.metrics,config.seoul),actual=Number(d().getElementById('partResultScore').textContent.replaceAll(',',''));check(receipt.metrics.collected===3,'세 개 획득 뒤에만 성공');check(actual===expected,'기존 공통 결과 화면에서 서울 점수 표시',{metrics:receipt.metrics,score:actual});check(d().getElementById('partResultTitle').textContent.includes('서울'),'서울 독립 점수 파트 이름');
 const before=s().timer.elapsedMs;await wait(450);check(s().timer.elapsedMs===before&&s().movementLocked,'결과 대기 시간 제외 및 입력 잠금');check(s().chapterId==='seoul','확인 전 다음 챕터로 이동하지 않음');const scoreRows=d().getElementById('partResultCount').textContent;check(scoreRows.includes('1')&&scoreRows.includes('6'),'6개 점수 파트 중 서울 1회 집계',{text:scoreRows});
 if(confirm){d().getElementById('nextPartBtn').click();d().getElementById('nextPartBtn').click();await until(()=>s().chapterId==='2026');check(s().sceneId==='life-agency','결과 확인 후 2026 진입');}}
async function flow(touch=false,confirm=true){await load(touch);check(s().appearanceId==='era-office','2019 이후 주인공 외형 유지');check(s().camera.distance===3.8&&s().camera.fov===60&&Math.abs(s().camera.pitch-Math.PI/12)<.001,'공통 3인칭 카메라 유지');check(s().content.lights.length===3&&v().features.cars.length===20,'빛 세 개 / 순환 차량 스무 대');const before=v().features.cars.map(c=>c.x);await wait(350);check(v().features.cars.some((c,i)=>c.x!==before[i]),'실제 차량 이동');
 if(touch){check(s().mobileUI,'844×390 모바일 레이아웃');for(const id of ['joystick','interactBtn','jumpBtn','runBtn']){const r=d().getElementById(id).getBoundingClientRect();check(r.left>=0&&r.right<=844&&r.top>=0&&r.bottom<=390&&r.width>=44,'모바일 조작 영역 화면 내',{id});}}
 await collect();await knock();await result(confirm);}
document.querySelector('#flow').onclick=()=>run(()=>flow());document.querySelector('#mobile').onclick=()=>run(()=>flow(true));document.querySelector('#resultPhoto').onclick=()=>run(()=>flow(false,false));
async function photo(touch=false){await load(touch);await walk(-6,7.6);stop();await wait(400);check(true,'렌더링 지표',{graphics:s().graphics});/* Keep the actual gameplay UI visible for screenshots. */}
document.querySelector('#photo').onclick=()=>run(()=>photo());document.querySelector('#mobilePhoto').onclick=()=>run(()=>photo(true));

document.querySelector("#doorPhoto").onclick=()=>run(async()=>{await load(true);await collect();await knock(true);});

document.querySelector('#destinationPhoto').onclick=()=>run(async()=>{await load();await collect();const exit=v().features.exit;await walk(exit.x,exit.z+1.7);check(true,'목적지 출입구 시각 검사 위치',{graphics:s().graphics});});

function lightCenter(root,hex){const target=new T.Color(hex),sum=new T.Vector3();let count=0;root.updateMatrixWorld(true);root.traverse(n=>{if(!n.isMesh)return;const a=n.geometry.attributes.position,c=n.geometry.attributes.color;if(!c)return;for(let i=0;i<a.count;i++)if(Math.abs(c.getX(i)-target.r)+Math.abs(c.getY(i)-target.g)+Math.abs(c.getZ(i)-target.b)<.0001){sum.add(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld));count++;}});if(!count)throw Error('Missing lamp color '+hex);return sum.divideScalar(count);}
document.querySelector('#vehicleAudit').onclick=()=>run(async()=>{await load();const cars=v().features.cars;
 const geometry=cars.map(c=>{const front=lightCenter(c.model.root,0xffefd0),rear=lightCenter(c.model.root,0xbd675f);return {id:c.id,model:c.model.root.name,dir:c.dir,frontDelta:front.x-rear.x,forward:(front.x-rear.x)*c.dir>3};});
 check(geometry.every(c=>c.forward),'실제 전조등/후미등 메시 기준 20대 전진 방향',{geometry});
 const wheelSamples=cars.map(c=>{let wheel;c.model.root.traverse(n=>{if(n.name==='rolling-wheel')wheel=n;});return {id:c.id,dir:c.dir,wheel,angle:wheel.rotation.z,distance:c.distance};});
 await wait(500);const rolling=wheelSamples.map(a=>{const c=cars.find(c=>c.id===a.id);return {id:a.id,dir:a.dir,deltaAngle:a.wheel.rotation.z-a.angle,travel:c.distance-a.distance};});check(rolling.every(a=>a.travel<.001||Math.abs(a.deltaAngle+a.travel/.345)<.001),'양방향 바퀴가 로컬 전진으로 회전',{rolling});
 check(cars.every(c=>c.max>=9.8&&c.max<=10.2),'36km/h 기준 순항 설정',{speeds:cars.filter(c=>c.id%5===0).map(c=>({lane:c.z,metersPerSecond:c.max,kmh:c.max*3.6}))});
 const stopped=new Set(),restarted=new Set(),wrapped=new Set(),peaks=new Map(),end=performance.now()+35000;let samples=0;const previous=new Map(cars.map(c=>[c.id,c.x]));
 while(performance.now()<end){for(const c of cars){const front=new T.Vector3(...c.model.root.userData.forwardAxis).applyQuaternion(c.model.root.quaternion);if(front.x*c.dir<.999)throw Error('Direction changed '+c.id);
  if(c.speed<9.79)throw Error('Unexpected traffic slowdown '+c.id);if(v().features.signal.car!=='green'||v().features.signal.crossCar!=='red')throw Error('Conflicting background signal');peaks.set(c.z,Math.max(peaks.get(c.z)||0,c.speed));
  const delta=Math.abs(c.x-previous.get(c.id));if(delta>100){if(Math.abs(c.x)<117||Math.abs(previous.get(c.id))<117)throw Error('Visible-route teleport');wrapped.add(c.id);}previous.set(c.id,c.x);
 }samples++;await wait(50);}
 check(true,'35초 동안 전 차량 신호 정지 없음 / 배경 본선 녹색·교차 방향 적색');
 check([...new Set(cars.filter(c=>wrapped.has(c.id)).map(c=>c.dir))].length===2,'양방향 먼 배경 구간 순환',{wrapped:[...wrapped]});check([...peaks.values()].every(n=>n>=9.8),'실제 갱신 속도 9.8~10.2m/s 도달',{peaks:Object.fromEntries(peaks),samples});
 const after=cars.map(c=>({id:c.id,dir:c.dir,delta:(lightCenter(c.model.root,0xffefd0).x-lightCenter(c.model.root,0xbd675f).x)*c.dir}));check(after.every(c=>c.delta>3),'연속 주행·순환 후 실제 메시 전방 유지',{after});
 
});


document.querySelector('#collisionCases').onclick=()=>run(async()=>{
 await load();const view=v(),f=view.features,ambient=view.updateAmbient;let monitor=false,samples=0,visibleOverlap=0,wrongMove=0,opaqueReturn=0,impact=null;
 view.updateAmbient=function(args){ambient.call(this,args);if(!monitor||args.dt<=0)return;const c=s().content;if(!c?.returning)return;samples++;
  const opacity=Number(d().getElementById('seoulReturnFade').style.opacity),body=new T.Box3().setFromObject(view.avatar,true);
  if(opacity<.99)for(const car of f.cars)if(body.intersectsBox(new T.Box3().setFromObject(car.model.root,true)))visibleOverlap++;
  if(['flinch','fade-out'].includes(c.returnPhase)){if(!impact)impact={x:view.avatar.position.x,z:view.avatar.position.z};if(Math.hypot(view.avatar.position.x-impact.x,view.avatar.position.z-impact.z)>.001)wrongMove++;}
  if(c.returnPhase==='covered'&&opacity===1&&Math.hypot(view.avatar.position.x-c.respawnPoint.x,view.avatar.position.z-c.respawnPoint.z)<.01)opaqueReturn++;
 };
 async function collide(){await until(()=>!s().content.returning&&!s().content.immune);monitor=false;
  const initial=createTraffic();for(const c of f.cars)Object.assign(c,initial[c.id]);const c=f.cars[0];c.x=c.previousX=-4;view.avatar.position.set(0,.11,c.z);
  const saved=f.cars.splice(0);f.resolveTraffic();f.cars.push(...saved);impact=null;monitor=true;const hits=s().content.hits;
  await until(()=>s().content.returning);check(s().content.hits===hits+1&&s().movementLocked,'사건당 피격 1회 / 전환 입력 잠금');return hits+1;
 }
 async function finishReturn(hits,beforeCollected,beforeTime){await until(()=>!s().content.returning,6000);
  check(s().content.hits===hits,'전환 중 피격 중복 없음');check(JSON.stringify(s().content.collected)===JSON.stringify(beforeCollected),'수집 진행도 유지');
  const home=s().content.respawnPoint;check(Math.abs(home.z)>7.2&&Math.hypot(s().position.x-home.x,s().position.z-home.z)<.01&&view.canWalk(home.x,home.z,.43),'안전한 시작 인도로 복귀',{home});
  check(s().timer.elapsedMs>beforeTime,'경과 시간 초기화 없음');check(s().content.immune&&!s().movementLocked,'복귀 후 입력 복구 및 1초 보호');
  check(s().camera.distance===3.8&&s().camera.fov===60&&Math.hypot(s().camera.lookAt[0]-home.x,s().camera.lookAt[2]-home.z)<.1,'공통 카메라 유지 / 암전 중 추적 복원');
  await wait(450);check(s().content.immune,'복귀 0.45초 후 보호 유지');await wait(650);check(!s().content.immune,'복귀 약 1초 뒤 보호 종료');
 }
 try{
  for(const p of [...s().content.lights].slice(0,2)){await walk(p.x,p.z);await until(()=>s().content.collected.includes(p.id));}
  check(s().content.collected.length===2,'실제 이동으로 빛 2개 수집');const collected=[...s().content.collected],beforeTime=s().timer.elapsedMs;
  const hits=await collide();await until(()=>s().content.returnPhase==='fade-out');d().getElementById('pauseBtn').click();
  const age=s().content.returnAgeMs,opacity=d().getElementById('seoulReturnFade').style.opacity,time=s().timer.elapsedMs;await wait(250);
  check(s().content.returnAgeMs===age&&d().getElementById('seoulReturnFade').style.opacity===opacity&&s().timer.elapsedMs===time,'피격 암전 중 수동 일시정지: 전환/시간 동결');d().getElementById('continueBtn').click();
  await finishReturn(hits,collected,beforeTime);check(s().content.returnCount>=1,'복귀 실행 기록');
  const last=s().content.lights[0];await walk(last.x,last.z);await until(()=>s().content.collected.length===3);
  const beforeReturns=s().content.returnCount,hits2=await collide();await until(()=>s().content.returnPhase==='fade-out');
  Object.defineProperty(d(),'hidden',{configurable:true,value:true});d().dispatchEvent(new(w().Event)('visibilitychange'));
  const bgAge=s().content.returnAgeMs;await wait(250);check(s().content.returnAgeMs===bgAge&&s().timer.pauseReasons.includes('background')&&s().timer.interrupted,'visibilitychange 모방: 전환 동결 및 interrupted');
  delete d().hidden;d().dispatchEvent(new(w().Event)('visibilitychange'));d().getElementById('continueBtn').click();
  await finishReturn(hits2,[...collected,last.id],beforeTime);check(s().content.returnCount===beforeReturns+1,'백그라운드 복귀 후 재배치 1회만 실행');check(f.exitGlow.visible&&s().content.lightsComplete,'3개 수집 후 피격해도 문 목표 유지');
  check(samples>20&&wrongMove===0&&visibleOverlap===0&&opaqueReturn>0,'밀림 없이 암전 중 복귀 / 노출된 차체 관통 없음',{samples,wrongMove,visibleOverlap,opaqueReturn});
  monitor=false;await knock();await result();
 }finally{monitor=false;stop();delete d().hidden;view.updateAmbient=ambient;}
});



// Isolated visual fixture, using the same real swept hit and return state machine.
document.querySelector('#returnPhoto').onclick=()=>run(async()=>{
 await load();const f=v().features;const c=f.cars[0];c.x=c.previousX=-4;v().avatar.position.set(0,.11,c.z);
 const cars=f.cars.splice(0);f.resolveTraffic();f.cars.push(...cars);
 await until(()=>s().content.returning);await until(()=>!s().content.returning);
 check(s().content.hits===1&&s().content.returnCount===1,'시작 인도 복귀: 피격 1회 / 복귀 1회');
});

export {load,run,check,until,wait,collect,knock,result,walk,w,d,s,v,pointer,action,stop};
