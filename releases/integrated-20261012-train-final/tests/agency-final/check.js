const frame=document.getElementById('game'),report=document.getElementById('report');let checks=[],errors=[];
const w=()=>frame.contentWindow,d=()=>w().document,s=()=>w().gameStatus?.(),view=()=>d().getElementById('agencyControl')?.shadowRoot,root=()=>view()?.getElementById('control-room');
const wait=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,ms=45000){const t=performance.now();while(!fn()){if(performance.now()-t>ms)throw Error('Timeout: '+fn);await wait(25);}}
function out(status='running'){report.textContent=JSON.stringify({status,checks,errors,state:s(),seating:w().agencyView?.scene.userData.seating,audio:w().agencyAudioStatus?.()},null,2);}
function check(ok,name,detail){checks.push({pass:!!ok,name,detail});out();if(!ok)throw Error(name);}
function key(code,type){w().dispatchEvent(new(w().KeyboardEvent)(type,{code,bubbles:true}));}
function action(mobile){if(mobile)d().getElementById('interactBtn').click();else{key('KeyE','keydown');key('KeyE','keyup');}}
async function load(width=1672,height=941){frame.style.width=width+'px';frame.style.height=height+'px';frame.scrollIntoView({block:'start'});frame.src='../../agency-study/audio-play.html?test='+performance.now();await new Promise(r=>frame.addEventListener('load',r,{once:true}));await until(()=>w().gameStatus&&!d().getElementById('startBtn').disabled);w().addEventListener('error',e=>errors.push(e.message));w().addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));d().getElementById('startBtn').click();await until(()=>s().started&&!s().dialogue&&!s().movementLocked);
 check(s().nearest!=='computer','원거리 의자 상호작용 불가');action();check(!s().minigame,'원거리 E 무시');
 w().focus();async function move(code,fn){key(code,'keydown');await until(fn);key(code,'keyup');await until(()=>Math.hypot(s().motion.velocity.x,s().motion.velocity.z)<.02);}
 await move('KeyA',()=>s().position.x< -6.18);await move('KeyW',()=>s().position.z< -4.36);await move('KeyD',()=>s().position.x> -5.25);await until(()=>s().nearest==='computer');
 check(d().getElementById('interactText').textContent.includes('앉아서'),'의자 안내');action(width<1000);action(width<1000);await until(()=>root());
 check(w().agencyView.scene.userData.seating.phase==='working','착석/카메라 연출 완료 후 신규 UI');check(d().querySelectorAll('#agencyControl').length===1&&!d().querySelector('#dispatch,#management'),'구형 UI 없음/신규 UI 하나');check(s().minigame.id==='life-agency-control','신규 미니게임만 실행');
 check(w().agencyView.scene.userData.seating.hands.every(h=>h.error<.02),'주인공 손 위치 유지');check(w().agencyView.scene.userData.agency.hands.flat().every(h=>h.error<.02),'직원 손 위치 유지');
 const r=root().getBoundingClientRect();check(r.left>=0&&r.right<=width+1&&r.top>=0&&r.bottom<=height+1,'화면 경계 안 UI',{width,height,rect:{x:r.x,y:r.y,width:r.width,height:r.height}});
 check(w().getComputedStyle(root()).display===(width<=700?'block':'grid'),'첫 화면 스타일 준비');
 const pauseButton=view().querySelector('.topbar [data-action="timer"]');check(pauseButton.getBoundingClientRect().width>0,'PC/모바일 모두 일시정지 버튼 표시');
 const a=w().agencyAudioStatus();check(a.entered&&!a.bgmPaused&&a.bgmLoop&&a.loaded.length===8,'2026 BGM 재생/반복 및 효과음8종 로딩');
 check(a.counts.chair===2&&a.counts.typing>=1,'착석 의자 두 동작 및 업무 타이핑 연결',a.counts);
 d().getElementById('soundBtn').click();check(w().agencyAudioStatus().muted,'공통 음소거 연동');d().getElementById('soundBtn').click();check(!w().agencyAudioStatus().muted,'음소거 해제');
 const volume=d().getElementById('agencySfx'),prior=volume.value;volume.value='.3';volume.dispatchEvent(new(w().Event)('input',{bubbles:true}));check(w().agencyAudioStatus().sfxVolume===.3,'공통 효과음 볼륨 연동');volume.value=prior;volume.dispatchEvent(new(w().Event)('input',{bubbles:true}));
}
function uiClick(selector){const b=view().querySelector(selector);if(!b)throw Error('Missing '+selector);b.click();}
async function finishDispatch(){const before=s().content.completed.length;uiClick('[data-action="assign"]');check(s().content.completed.length===before+1,'첫 배차 정상');
 // Re-select an already assigned rider with another pending order through the model's UI boundary.
 const assigned=s().content.assigned[0];uiClick(`[data-rider="${assigned}"]`);check(s().content.completed.length===1,'중복 라이더 배차 방지');
 while(s().content.completed.length<5){const st=s().content,o=st.selectedOrder;const positions={1:[23,28],2:[66,26],3:[70,67],4:[32,77],5:[86,87]},rp={1:[40,35],2:[86,37],3:[59,69],4:[14,71],5:[85,74]};const free=[1,2,3,4,5].filter(r=>!st.assigned.includes(r));free.sort((a,b)=>Math.hypot(rp[a][0]-positions[o][0],rp[a][1]-positions[o][1])-Math.hypot(rp[b][0]-positions[o][0],rp[b][1]-positions[o][1]));uiClick(`[data-rider="${free[0]}"]`);uiClick('[data-action="assign"]');await wait(40);}
 check(d().getElementById('partResultOverlay').hidden,'배차 5건만으로 결과 표시 안 함');await until(()=>s().content.mode==='management');check(s().content.dispatchScore<=500,'배차 최대500');check(w().agencyView.scene.userData.seating.phase==='working','두 업무 사이 착석 유지');
}
async function pauseChecks(){uiClick('[data-action="timer"]');const state=JSON.stringify(s().content),time=s().timer.elapsedMs;uiClick('[data-move="-1"]');await wait(300);check(JSON.stringify(s().content)===state&&s().timer.elapsedMs===time,'일시정지 중 시간/배치 조작 모두 동결');d().getElementById('continueBtn').click();
 Object.defineProperty(d(),'hidden',{value:true,configurable:true});d().dispatchEvent(new(w().Event)('visibilitychange'));await wait(70);const frozen=s().content.managementMs;await wait(180);check(s().content.managementMs===frozen,'백그라운드 모방 시간 동결');delete d().hidden;d().dispatchEvent(new(w().Event)('visibilitychange'));d().getElementById('continueBtn').click();}
async function finishManage(){await pauseChecks();uiClick('[data-index="0"][data-move="1"]');check(s().content.feedback.includes('실패'),'불가능한 배치 실패 피드백');const waves=new Set();while(s().minigame){const st=s().content;if(st.mode!=='management')break;waves.add(st.wave);for(let i=0;i<4;i++){let n=st.numbers[i]-st.demand[i];while(n-->0)uiClick(`[data-index="${i}"][data-move="-1"]`);}for(let i=0;i<4;i++){let n=st.demand[i]-st.numbers[i];while(n-->0&&s().content.pool>0)uiClick(`[data-index="${i}"][data-move="1"]`);}checkTotal();await wait(80);}
 await until(()=>!d().getElementById('partResultOverlay').hidden);check(waves.size===5,'10초 중 5번의 수요 단계');check(s().minigameResult.metrics.managementMs===10000,'정확한 활성시간10초');check(s().minigameResult.metrics.onlineTotal===128,'최종 인원128 유지');check(d().getElementById('partResultMax').textContent==='1,000','통합 최대1000');check(d().getElementById('agencyBreakdown').textContent.includes('/ 500점'),'두 업무500점 내역');check(w().agencyView.scene.userData.seating.phase==='ending'&&w().agencyView.scene.userData.seating.cameraMix===0,'업무 종료 후 착석/일반 카메라 복귀');
 const t=s().timer.elapsedMs;await wait(450);check(!s().finished&&s().timer.elapsedMs===t,'결과 확인 전 엔딩 보류/기록시간 정지');out();}
function checkTotal(){const st=s().content;if(st.numbers.reduce((a,b)=>a+b,0)+st.pool!==128)throw Error('128 conservation');}
async function ending(){d().getElementById('nextPartBtn').click();await until(()=>s().finished);check(Object.keys(w().experimentResult.scores).join()==='agency','2026 점수 한 번만 집계');check(d().querySelectorAll('#roundResults .score-row').length===5&&d().getElementById('roundResults').textContent.includes('5000'),'5라운드/5000점 엔딩');check(w().experimentResult.version==='agency-v2-5000','새 기록 버전');check(w().agencyAudioStatus().errors.length===0,'음원 로딩/재생 오류 없음');check(w().agencyAudioStatus().counts.success===5&&w().agencyAudioStatus().counts.complete===1&&w().agencyAudioStatus().counts.transition===1,'성공5/전환1/완료1 효과음');check(!errors.length,'브라우저 예외 없음');}
let busy=false;async function run(fn){if(busy)return;busy=true;checks=[];errors=[];try{await fn();out('passed');}catch(e){errors.push(String(e));out('failed');}finally{busy=false;}}
for(const [id,width,height]of [['pc',1672,941],['landscape',844,390],['portrait',390,844]])document.getElementById(id).onclick=()=>run(async()=>{await load(width,height);await finishDispatch();await finishManage();await ending();});
document.getElementById('dispatchShot').onclick=()=>run(()=>load());
document.getElementById('manageShot').onclick=()=>run(async()=>{await load();await finishDispatch();d().getElementById('pauseBtn').click();d().getElementById('pauseOverlay').hidden=true;});
document.getElementById('resultShot').onclick=()=>run(async()=>{await load();await finishDispatch();await finishManage();});
document.getElementById('portraitShot').onclick=()=>run(()=>load(390,844));
document.getElementById('portraitManageShot').onclick=()=>run(async()=>{await load(390,844);await finishDispatch();d().getElementById('pauseBtn').click();d().getElementById('pauseOverlay').hidden=true;});
document.getElementById('landscapeManageShot').onclick=()=>run(async()=>{await load(844,390);await finishDispatch();d().getElementById('pauseBtn').click();d().getElementById('pauseOverlay').hidden=true;});
document.getElementById('scoreTest').onclick=()=>run(async()=>{await load();const {runScoreTests}=await import('./score-check.js');await runScoreTests(w(),d(),check);});
document.getElementById('regression').onclick=()=>run(async()=>{
 for(const [i,scene,route]of [[0,'life-street','street'],[1,'warehouse-workflow','warehouse'],[2,'life-office','office'],[3,'life-train','train'],[4,'life-city','seoul']]){
  frame.src='../../tests/integration/play.html?chapter='+i;await new Promise(r=>frame.addEventListener('load',r,{once:true}));await until(()=>w().gameStatus&&!d().getElementById('startBtn').disabled);w().addEventListener('error',e=>errors.push(e.message));d().getElementById('startBtn').click();await until(()=>s().started&&s().rendered&&w().chapterAudioStatus().route===route);await wait(1400);check(s().sceneId===scene,'기존 챕터 진입: '+scene);check(w().chapterAudioStatus().route===route&&!w().agencyAudioStatus().entered,'이전 챕터 오디오 라우팅 보존: '+route);
 }
 const manifest=await fetch('../../release-manifest.json').then(r=>r.json());let missing=[];for(let i=0;i<manifest.files.length;i+=12)await Promise.all(manifest.files.slice(i,i+12).map(async f=>{const r=await fetch('../../'+f.path,{method:'HEAD',signal:AbortSignal.timeout(15000)});if(!r.ok)missing.push(f.path);}));check(missing.length===0,'로컬 패키지 모든 리소스 HTTP200',{files:manifest.files.length,missing});check(!errors.length,'이전 챕터 초기화 예외 없음');
});
document.getElementById('restart').onclick=()=>run(async()=>{
 await load();await finishDispatch();await finishManage();await ending();d().getElementById('restartBtn').click();await until(()=>!s().finished&&!s().dialogue&&!s().movementLocked);check(!d().getElementById('roundResults')&&!d().getElementById('agencyControl'),'실제 다시 플레이: 이전 UI/점수 제거');check(Math.abs(s().position.x+4)<.01&&Math.abs(s().position.z+.8)<.01,'재시작 시작 위치 복원');check(!w().agencyView.scene.userData.seating||w().agencyView.scene.userData.seating.phase==='idle','착석 상태 초기화');check(w().agencyAudioStatus().entered&&!w().agencyAudioStatus().ending,'BGM 재진입 상태 초기화');
 async function move(code,fn){key(code,'keydown');await until(fn);key(code,'keyup');await until(()=>Math.hypot(s().motion.velocity.x,s().motion.velocity.z)<.02);}await move('KeyA',()=>s().position.x< -6.18);await move('KeyW',()=>s().position.z< -4.36);await move('KeyD',()=>s().position.x> -5.25);await until(()=>s().nearest==='computer');action();await until(()=>root());check(s().content.completed.length===0&&s().content.managementMs===0&&s().content.pool===0,'다시 착석: 새 업무0/5,10초,인원 초기화');
});





document.getElementById('audioDetail').onclick=()=>run(async()=>{
 await load();const a=()=>w().agencyAudioStatus(),media=w().agencyTestMedia.find(m=>m.src.includes('cozyvibes-ambient-chill'));
 check(!!media,'단일 2026 BGM 객체');const first=a().bgmTime;await wait(400);check(a().bgmTime>first,'BGM 시간 실제 증가');
 media.currentTime=media.duration-.4;await until(()=>media.currentTime<2&&!media.seeking,5000);check(!media.paused,'BGM 파일 끝에서 실제 반복');
 d().getElementById('pauseBtn').click();const t=a().bgmTime,c=JSON.stringify(a().counts);await wait(400);check(a().bgmPaused&&Math.abs(a().bgmTime-t)<.08&&JSON.stringify(a().counts)===c&&a().voices===0,'정지 중 BGM 위치/효과음 이벤트 동결');d().getElementById('continueBtn').click();await until(()=>!a().bgmPaused);await wait(150);check(a().bgmTime>=t&&a().bgmTime<t+1,'BGM 이어서 재생');
 const {FILES}=await import('../../agency-study/audio.js');const ctx=new AudioContext(),levels=[];
 for(const [key,file]of Object.entries(FILES)){const res=await fetch('../../agency-study/audio/'+file);check(res.ok,'음원 HTTP200: '+key);const buffer=await ctx.decodeAudioData(await res.arrayBuffer()),end=Math.min(buffer.length,Math.floor(buffer.sampleRate*(key==='chair'?.35:key==='typing'?.85:buffer.duration)));const start=key==='chair'?Math.floor(5.4*buffer.sampleRate):0;let energy=0,peak=0;for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=start;i<start+end;i++){energy+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]));}}levels.push({key,seconds:buffer.duration,excerptRms:Math.sqrt(energy/(end*buffer.numberOfChannels)),peak});}
 await ctx.close();check(levels.every(l=>l.excerptRms>.001),'9개 음원 및 짧은 의자/타이핑 구간에 실제 신호 존재',levels);check(!a().errors.length,'재생 실패 로그 없음');
});
