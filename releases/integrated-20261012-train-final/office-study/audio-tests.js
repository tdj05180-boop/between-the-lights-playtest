import {load,run,check,until,wait,collectAll,finish,w,d,s,v,out} from './tests.js';
const button=document.createElement('button');button.id='audioCheck';button.textContent='사무실 오디오·실제 진행 검사';out.before(button);
const a=()=>w().officeAudioStatus();
button.onclick=()=>run(async()=>{
 await load();await until(()=>a()?.loaded.length===4&&a().context==='running'&&!a().bgmPaused,20000);
 v().avatar.position.x=-5;v().avatar.position.z=6.5;
 const music=w().officeTestMedia.find(m=>m.src.includes('ovrsoull-deep-bass'));check(!!music,'제공된 BGM 파일 사용');
 const before=a().bgmTime;await wait(400);check(a().bgmLoop&&a().bgmTime>before,'BGM 실제 재생 및 반복 설정');
 const seeked=new Promise(r=>music.addEventListener('seeked',r,{once:true}));music.currentTime=music.duration-.6;await seeked;check(music.currentTime>music.duration-1,'BGM 끝부분으로 검사 위치 이동');await until(()=>!music.seeking&&music.currentTime<2,5000);check(!music.paused,'BGM 끝에서 실제 반복 재생',{time:music.currentTime,duration:music.duration});
 d().getElementById('pauseBtn').click();const pt=a().bgmTime;await wait(300);check(a().bgmPaused&&Math.abs(a().bgmTime-pt)<.06,'일시정지 중 음악 위치 보존');d().getElementById('continueBtn').click();await until(()=>!a().bgmPaused);await wait(200);check(a().bgmTime>=pt&&a().bgmTime<pt+1,'재개 시 처음부터 재생하지 않음');
 d().getElementById('soundBtn').click();await wait(150);check(a().muted&&a().bgmPaused,'공통 소리 버튼 음소거');d().getElementById('soundBtn').click();await until(()=>!a().muted&&!a().bgmPaused);
 for(const [id,value]of [['officeBgm','.18'],['officeSfx','.5']]){const el=d().getElementById(id);el.value=value;el.dispatchEvent(new(w().Event)('input',{bubbles:true}));}await wait(250);check(a().bgmVolume===.18&&a().sfxVolume===.5,'기존 도움말 방식 BGM/효과음 볼륨 연동');
 for(const [id,value]of [['officeBgm','.24'],['officeSfx','.65']]){const el=d().getElementById(id);el.value=value;el.dispatchEvent(new(w().Event)('input',{bubbles:true}));}
 const prev=s().content.hits,h=s().content.lasers[0];v().avatar.position.x=h.x;v().avatar.position.z=h.z;await until(()=>s().content.hits>prev);const c=a().counts.hit;
 v().scene.dispatchEvent({type:'office-audio-event',detail:{type:'laser-hit',hits:s().content.hits}});await wait(150);check(a().counts.hit===c&&c===s().content.hits,'확정 피격당 효과음 1회, 무적/중복 이벤트 방지');
 await collectAll();check(a().counts.paper===5&&a().counts.unlock===1,'서류 5회 / 다섯 번째 잠금 해제 1회',{audio:a()});
 v().scene.dispatchEvent({type:'office-audio-event',detail:{type:'paper-collected',id:0,count:5}});v().scene.dispatchEvent({type:'office-audio-event',detail:{type:'exit-unlocked'}});check(a().counts.paper===5&&a().counts.unlock===1,'수집·잠금 해제 중복 방지');
 // Observe real end-dialogue/result state while the common flow test operates.
 let faded=false,resultPaused=false;const poll=setInterval(()=>{if(a().ending&&a().musicGain<.001)faded=true;if(d().getElementById('partResultOverlay')?.hidden===false&&a().bgmPaused)resultPaused=true;},25);
 try{await finish();}finally{clearInterval(poll);}
 check(a().counts.door===1,'문 애니메이션 시작 효과음 1회');check(faded&&resultPaused,'종료 대사 중 페이드아웃 및 결과 화면 음악 정지');check(!a().entered&&a().bgmPaused&&w().chapterAudioStatus().route==='legacy','기차 전환 후 사무실 음악 종료');check(a().errors.length===0,'오디오 로딩/디코딩/재생 오류 없음',{audio:a()});
});
const analyze=document.createElement('button');analyze.id='audioLevels';analyze.textContent='음원 레벨 측정';out.before(analyze);
analyze.onclick=()=>run(async()=>{await load();const C=w().AudioContext||w().webkitAudioContext,ctx=new C(),rows=[];
 for(const file of ['ovrsoull-deep-bass-cinematic-tension-forensic-noir-investigative-pulse-454724.mp3','mixkit-small-electric-glitch-2595.wav','mixkit-paper-slide-1530.wav','mixkit-unlock-game-notification-253.wav','mixkit-creaky-door-open-195.wav']){const res=await fetch('./audio/'+file);check(res.ok,'HTTP 200',{file});const buf=await ctx.decodeAudioData(await res.arrayBuffer());let sum=0,peak=0;for(let ch=0;ch<buf.numberOfChannels;ch++){const data=buf.getChannelData(ch);for(let i=0;i<data.length;i++){sum+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]));}}rows.push({file,seconds:buf.duration,rms:Math.sqrt(sum/(buf.length*buf.numberOfChannels)),peak});}await ctx.close();check(true,'실제 디코딩 샘플 음량 측정',{rows});});
