import {load,run,check,until,wait,collect,knock,result,walk,w,d,s,v,action,pointer} from './tests.js';
const a=()=>w().seoulAudioStatus();
document.querySelector('#soundCheck').onclick=()=>run(async()=>{
 await load(true);await until(()=>a().loaded.length===7&&!a().bgmPaused&&!a().ambiencePaused,25000);
 const music=w().testMedia.find(m=>m.src.includes('night-city')),ambient=w().testMedia.find(m=>m.src.includes('traffic-background'));check(!!music&&!!ambient,'실제 제공 음원 연결');
 const bt=a().bgmTime;await wait(350);check(a().bgmTime>bt&&a().bgmLoop&&a().ambienceLoop,'BGM/환경음 실제 재생 및 반복 설정');
 for(const m of [music,ambient]){await until(()=>Number.isFinite(m.duration));m.currentTime=m.duration-.4;await until(()=>!m.seeking&&m.currentTime<2,4000);check(!m.paused,'실제 파일 끝에서 반복',{file:m.src.split('/').at(-1)});}
 d().getElementById('pauseBtn').click();const frozen=a().bgmTime;await wait(250);check(a().bgmPaused&&Math.abs(a().bgmTime-frozen)<.08,'일시정지 음악 위치 유지');d().getElementById('continueBtn').click();await until(()=>!a().bgmPaused);check(a().bgmTime>=frozen,'음악 이어 재생');
 d().getElementById('soundBtn').click();check(a().muted&&a().bgmPaused,'공통 음소거');d().getElementById('soundBtn').click();await until(()=>!a().bgmPaused);
 const slider=d().getElementById('seoulSfx');slider.value='.5';slider.dispatchEvent(new(w().Event)('input',{bubbles:true}));check(a().sfxVolume===.5,'공통 SFX 설정');slider.value='.65';slider.dispatchEvent(new(w().Event)('input',{bubbles:true}));
 const car=v().features.cars[0],p=v().avatar.position;car.x=car.previousX=-4;p.set(0,.11,car.z);const cars=v().features.cars.splice(0);v().features.resolveTraffic();v().features.cars.push(...cars);
 await until(()=>s().content.returning);await until(()=>!s().content.returning);check(a().counts.hit===1,'확정 피격 1회 효과음 / 암전 복귀');v().scene.dispatchEvent({type:'seoul-audio-event',detail:{type:'hit',hits:1}});check(a().counts.hit===1,'동일 피격 이벤트 중복 재생 없음');
 await collect();const before=a().bgmTime;let continuity=true;const poll=setInterval(()=>{if(!a().ending&&(a().bgmPaused||a().bgmTime<before-.1))continuity=false;},20);
 try{await knock();}finally{clearInterval(poll);}check(continuity,'빛 수집부터 문 두드리기까지 음악 연속');
 await result();const audio=a();check(audio.counts.collect===3&&audio.counts.knock===4&&audio.counts.success===3&&audio.counts.fail===1&&audio.counts.complete===1,'수집·두드림·판정·완료 효과음 횟수',{audio});check(audio.counts.pass>0&&audio.counts.ambience>0,'근거리 통과음 및 환경음');check(!audio.entered&&audio.bgmPaused&&audio.ambiencePaused,'2026 전환 후 서울 음원 정지');check(audio.errors.length===0,'음원 로딩/디코딩/재생 오류 없음');check(w().chapterAudioStatus().menu.musicGain<.001,'공통 멜로디 게임 중 중복 없음');
});
document.querySelector('#touchCheck').onclick=()=>run(async()=>{
 await load(true);const css=el=>w().getComputedStyle(el).touchAction;
 const ids=['hud','timerPanel','dialogue','pauseOverlay','partResultOverlay','seoulGame'];for(const id of ids)check(css(d().getElementById(id))==='manipulation','기존 UI 루트 확대 정책',{id});
 const dynamic=d().createElement('section');dynamic.innerHTML='<div>future modal <span>new content</span></div><button>native click</button><input type="range">';d().body.append(dynamic);
 check(css(dynamic)==='manipulation'&&css(dynamic.querySelector('span'))==='manipulation','새 body 오버레이 자동 적용');let clicked=0;dynamic.querySelector('button').onclick=()=>clicked++;
 const double=new(w().MouseEvent)('dblclick',{bubbles:true,cancelable:true});dynamic.dispatchEvent(double);check(double.defaultPrevented,'게임 루트 더블클릭 기본 동작 차단');dynamic.querySelector('button').click();check(clicked===1,'일반 버튼 클릭 보존');
 for(const id of ['scene','joystick','runBtn','jumpBtn'])check(css(d().getElementById(id))==='none','기존 게임 멀티터치 none 유지',{id});
 const start=s().position,yaw=s().camera.yaw;pointer('joystick','pointerdown',1,0,41);pointer('runBtn','pointerdown',0,0,42);
 const canvas=d().getElementById('scene');canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>true;canvas.releasePointerCapture=()=>{};for(const [type,x,y]of [['pointerdown',600,200],['pointermove',625,205]])canvas.dispatchEvent(new(w().PointerEvent)(type,{pointerId:43,pointerType:'touch',button:0,clientX:x,clientY:y,bubbles:true,cancelable:true}));
 await wait(100);pointer('jumpBtn','pointerdown',0,0,44);await wait(40);check(s().jump.airborne&&s().runRequested&&s().camera.yaw!==yaw&&Math.hypot(s().position.x-start.x,s().position.z-start.z)>.01,'조이스틱+달리기+점프+카메라 모의 멀티터치');
 for(const [id,pid]of [['joystick',41],['runBtn',42],['jumpBtn',44]])pointer(id,'pointercancel',0,0,pid);canvas.dispatchEvent(new(w().PointerEvent)('pointercancel',{pointerId:43,pointerType:'touch',bubbles:true}));await wait(80);check(!s().runRequested,'멀티터치 취소 후 달리기 해제');
 check(!d().querySelector('meta[name="viewport"]').content.includes('user-scalable=no'),'메타 확대 전역 차단 없음');dynamic.remove();
 d().getElementById('pauseBtn').click();check(!d().getElementById('pauseOverlay').hidden,'일시정지 패널 클릭 유지');d().getElementById('continueBtn').click();check(!s().timer.pauseReasons.length,'재개 버튼 유지');
});
