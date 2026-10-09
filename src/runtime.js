import {timingPosition} from './systems/timing.js';
import * as THREE from './vendor/three.module.min.js';
import {Flow,BOXES} from './flow.js';
import {minigames,spaces,appearances,resolveChapter} from './content/registry.js';
import {InputLocks,Scope} from './systems/content.js';
import {MinigameHost} from './systems/minigames.js';
import {PartResults} from './systems/part-results.js';
import {SpaceHost} from './systems/spaces.js';
import {AppearanceHost} from './systems/appearances.js';
import {createAudio} from './audio.js';
import {GameTime,Timeline,formatTime,withLoading} from './systems/time.js';
import {validateChapter} from './systems/quests.js';
import {MovementController} from './systems/movement.js';
import {InteractionRegistry} from './systems/interactions.js';
import {JumpController} from './systems/jump.js';
import {CameraRig} from './systems/camera.js';
import {capturePointer,releasePointer,inside,guardGameGestures,bindTouchAction,bindFullscreen,visibleGameViewport} from './systems/browser-compat.js';

let booted=false;
export async function startGame({campaignUrl=new URL('./data/campaign.json',import.meta.url),session={},cameraRig=null,audioFactory=createAudio}={}){
if(booted)throw Error('Game runtime already started');booted=true;
const $=id=>document.getElementById(id);
const gameTime=new GameTime(),timeline=new Timeline(gameTime),rig=cameraRig??new CameraRig();
if(rig.commonThirdPerson)document.querySelector('.camera-tools')?.remove();

async function readJSON(url){const r=await fetch(url);if(!r.ok)throw Error(`JSON 로딩 실패: ${r.status} ${url}`);return r.json();}
const campaign=await readJSON(campaignUrl);
if(campaign.schemaVersion!==1||!['presentation','distribution'].includes(campaign.mode)||!Array.isArray(campaign.chapters)||!campaign.chapters.length)throw Error('잘못된 campaign.json');
let chapterIndex=0;
async function loadChapter(index){return validateChapter(resolveChapter(await readJSON(new URL(campaign.chapters[index],campaignUrl))));}
let chapter=await loadChapter(0);
const flow=new Flow(chapter);
let registry=new InteractionRegistry(chapter.interactions);
const canvas=$('scene');
const visualProfile='improved';
const initialScope=new Scope();
let view=await spaces.get('legacy-room').create({canvas,scope:initialScope,chapter});
let {renderer,scene,camera,world,avatar,avatarShadow,carryAnchor,playerView,crates,crateShadows,waypoint,goalBeam,waypointMaterial,dust,trees,sun,bulb,glass,lampLight,cutawayBack,cutawayLeft,add}=view;
const movement=new MovementController(avatar,(x,z)=>view.canWalk(x,z));
const jump=new JumpController();let jumpOffset=0;
let started=false,finished=false,gameOpen=false,completing=false,warmth=0;
let elapsed=0,walkTime=0,lastStep=0,lampTime=0,gamePos=0,cooldown=0,nearest=null;
let currentYaw=rig.yaw,currentDistance=rig.distance,currentPitch=rig.pitch,lastFrame=performance.now();
let sequenceConfig=null,savedCamera=null,sequencePromiseResolve=null;
const camTarget=new THREE.Vector3(0,1.15,.6),lookTarget=new THREE.Vector3(),labelV=new THREE.Vector3();
const keys=new Set(),touch={x:0,z:0};let stickId=null,drag=null,touchRun=false,runPointerId=null;
const touchActions=[];let renderWidth=innerWidth,renderHeight=innerHeight;
let coarse=matchMedia('(any-pointer:coarse)').matches||innerWidth<=900;
const audio=audioFactory(()=>gameTime.paused,()=>started,()=>view);
const {tone,chime}=audio;
let labels=[],toastUntil=0;
const markerGroup=new THREE.Group();world.add(markerGroup);
const marker=add(new THREE.OctahedronGeometry(.115),new THREE.MeshBasicMaterial({color:0xf2d798}),0,0,0,markerGroup);marker.castShadow=false;

const locks=new InputLocks();
const partResults=new PartResults({pause,resume,canConfirm:()=>!document.hidden&&[...gameTime.reasons].every(reason=>reason==='part-result')});
const appearance=new AppearanceHost(appearances,playerView);
const mini=new MinigameHost({registry:minigames,clock:gameTime,locks,world:()=>({scene,world,avatar,camera,carryAnchor,view,playerState:()=>({jumpHeight:jumpOffset,carrying:flow.carry!==null})}),onError:fail,onInputChange:(policy)=>{if(policy.movement)clearInput();else if(policy.camera)endDrag();syncControls();},input:()=>({...moveInput(),running:touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight')}),onResult:async(result,{questId,target})=>{
 if(flow.quest?.id!==questId)return;
 if(flow.runner.minigameResult(result,target)){const receipt=session.onResult?.(result,flow.quest,gameTime.snapshot());await completeQuest(receipt);updateHUD();}
 else{toast(flow.runner.canAttempt?'미니게임을 완료하지 못했습니다. 행동으로 다시 시도할 수 있습니다.':'다시 시도할 수 없습니다.');updateHUD();}
}});
const spaceHost=new SpaceHost({registry:spaces,clock:gameTime,context:{canvas,renderer,camera,clock:gameTime,controls:{notify:toast,respawn(p){clearInput();jump.reset();jumpOffset=0;avatar.position.set(p.x,.11,p.z);}},player:{avatar,avatarShadow,carryAnchor,playerView}},beforeChange:()=>{mini.stop();clearInput();markerGroup.removeFromParent();audio.leave?.();audio.pause(true);updateTimer();},onLoaded:(next,definition)=>{
 view=next;({renderer,scene,camera,world,avatar,avatarShadow,carryAnchor,playerView,crates,crateShadows,waypoint,goalBeam,waypointMaterial,dust,trees,sun,bulb,glass,lampLight,cutawayBack,cutawayLeft,add}=view);world.add(markerGroup);rig.configure(definition.cameraPresets);if(rig.commonThirdPerson){camera.fov=60;camera.updateProjectionMatrix();}appearance.apply(chapter.appearanceId??'default');audio.enter?.(chapter.sceneId);
}});
spaceHost.current={id:'legacy-room',instance:view,scope:initialScope};
async function enterChapter(next,index){
 const previous=chapter;chapter=next;
 try{await spaceHost.change(next.sceneId,next);chapterIndex=index;flow.load(chapter);registry=new InteractionRegistry(chapter.interactions);resetWorld();renderer.render(scene,camera);}
 catch(error){chapter=previous;throw error;}
 lastFrame=performance.now();audio.pause(gameTime.paused);
}

function syncRunButton(){$('runBtn').dataset.held=String(touchRun);$('runBtn').textContent='달리기';}
function moveInput(){return {x:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+touch.x,z:(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+touch.z};}
function carrying(){return flow.carry!==null||!!view.carrying;}
function walkSpeed(){return carrying()?2.1:2.55;}
function requestJump(mobile=false){if(!jump.start(movementLocked()))return;movement.beginJump({mobile});}
function endStick(){const id=stickId;stickId=null;touch.x=touch.z=0;movement.clearRunRelease();$('stick').style.transform='translate(0,0)';releasePointer($('joystick'),id);}
function endRun(softRelease=false){if(softRelease&&touchRun&&!jump.airborne&&!movementLocked())movement.beginRunRelease(moveInput(),currentYaw,walkSpeed());else movement.clearRunRelease();const id=runPointerId;runPointerId=null;touchRun=false;syncRunButton();releasePointer($('runBtn'),id);}
function endDrag(){const id=drag?.id;drag=null;releasePointer(canvas,id??null);}
function clearInput(){keys.clear();endStick();endRun();endDrag();for(const clear of touchActions)clear();movement.stop();}
function worldLocked(){return spaceHost.busy||!started||!gameTime.started||finished||gameTime.paused||gameOpen||completing&&!timeline.active||timeline.active&&(timeline.step.lockMovement??sequenceConfig.lockMovement);}
function movementLocked(){return locks.locked('movement')||worldLocked();}
function interactionLocked(){return locks.locked('interaction')||worldLocked()||timeline.active||completing;}
function cameraLocked(){return locks.locked('camera')||spaceHost.busy||gameTime.paused||timeline.active||gameOpen||finished;}
function syncControls(){
 document.body.dataset.mobile=String(coarse);document.body.dataset.dialogue=String(timeline.active);
 $('touchControls').hidden=!coarse||!started||finished;
 $('joystick').setAttribute('aria-disabled',String(movementLocked()));
 $('interactBtn').hidden=coarse?false:timeline.active||finished;
 $('runBtn').hidden=!coarse;$('runBtn').disabled=movementLocked();
 $('jumpBtn').hidden=!coarse;$('jumpBtn').disabled=movementLocked()||jump.airborne;
 $('hint').hidden=timeline.active||finished;
 if($('cameraPreset'))$('cameraPreset').disabled=cameraLocked();
 for(const id of ['rotateLeft','rotateRight','resetCamera'])if($(id))$(id).disabled=cameraLocked()||!rig.acceptsInput;
 $('pauseBtn').disabled=!started||finished;
}
function makeLabels(){for(const l of labels)l.el.remove();labels=chapter.interactions.map(t=>{const el=document.createElement('div');el.className='world-label';el.textContent=t.label;$('worldLabels').appendChild(el);return {id:t.id,el,p:new THREE.Vector3(t.x,t.y??1.5,t.z)}});}
function candidates(){const q=flow.quest;if(!q)return [];let list=registry.candidates(q.targets);if(['interact','exit'].includes(q.type))list=list.filter(t=>!flow.runner.seen.has(t.id));
 if(q.type==='boxes')list=list.filter(t=>flow.carry===null?t.action==='pick'&&!flow.placed.has(t.boxId):t.action==='place'&&t.boxId===flow.carry);return list.concat(view.optionalTargets?.()??[]);
}
function chooseNearest(){nearest=mini.hasInteraction?(!worldLocked()&&!timeline.active&&!completing?mini.interactionTarget():null):interactionLocked()?null:registry.nearest(avatar.position,candidates());view.showInteraction?.(nearest);$('interactBtn').disabled=!nearest;$('interactText').textContent=nearest?.label??(nearest?`${nearest.name} · ${nearest.action}`:'주변을 둘러보세요');}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=gameTime.elapsed()+2700;}
function updateHUD(){const q=flow.objectives();$('questTitle').textContent=q.title;$('questDesc').textContent=q.desc;
 const steps=$('steps');if(steps.children.length!==chapter.quests.length)steps.replaceChildren(...chapter.quests.map(()=>document.createElement('span')));
 [...steps.children].forEach((el,i)=>el.className=i<q.index?'done':i===q.index?'active':'');
 document.querySelector('.quest-eyebrow').textContent=`CHAPTER ${chapterIndex+1} · ${chapter.title}`;
 $('cargo').hidden=flow.carry===null;if(flow.carry!==null)$('cargo').textContent=`들고 있는 상자 ${BOXES[flow.carry].mark} ${BOXES[flow.carry].name}`;
 if(waypoint)waypoint.visible=flow.phase==='exit';if(goalBeam)goalBeam.visible=flow.phase==='exit';syncControls();
}
function playSequence(id){
 if(!id)return Promise.resolve();const config=chapter.sequences[id];
 if(!config)throw Error(`대사 설정 없음: ${id}`);
 if(timeline.active)throw Error('대사 중복 실행');
 sequenceConfig=config;savedCamera=rig.snapshot();clearInput();
 if(config.camera)rig.select(config.camera.preset,config.camera.target??null);
 $('letterbox').classList.toggle('on',!!config.cinematic);
 return new Promise(resolve=>{sequencePromiseResolve=resolve;timeline.play(config.lines,(line,index)=>{
   clearInput();$('speaker').textContent=config.speaker??'';$('dialogText').textContent=line.text;
   $('dialogCount').textContent=`${index+1} / ${config.lines.length}`;$('dialogue').hidden=!line.text;
   if(line.effect==='warmth'){warmth=1;chime();}syncControls();
 },()=>{rig.restore(savedCamera);if($('cameraPreset'))$('cameraPreset').value=rig.mode;savedCamera=null;sequenceConfig=null;sequencePromiseResolve=null;
   $('dialogue').hidden=true;$('letterbox').classList.remove('on');clearInput();syncControls();resolve();
 });});
}
function persistRecord(completed=false){const record={version:1,mode:campaign.mode,chapterId:chapter.id,...gameTime.snapshot(),completed};
 try{localStorage.setItem((session.recordPrefix??'between-lights')+':current',JSON.stringify(record));if(completed){localStorage.setItem((session.recordPrefix??'between-lights')+':last',JSON.stringify(record));$('saveStatus').textContent='이 브라우저에 기록을 저장했습니다.';}return true;}
 catch{if(completed)$('saveStatus').textContent='브라우저 저장소를 사용할 수 없어 기록을 저장하지 못했습니다.';return false;}
}
function updateTimer(){const ms=gameTime.elapsed();$('runTime').textContent=formatTime(ms);$('runState').textContent=finished?'완료':gameTime.paused?'일시정지':started?'진행 중':'시작 대기';$('interruptState').textContent=gameTime.interrupted?'중단 이력 있음':'';}
function pause(reason){gameTime.pause(reason);mini.syncPause();clearInput();audio.pause(true);if(started&&!finished)persistRecord();syncControls();updateTimer();}
function resume(reason){gameTime.resume(reason);mini.syncPause();lastFrame=performance.now();clearInput();audio.pause(gameTime.paused);syncControls();updateTimer();}
function manualPause(){if(!started||finished)return;pause('manual');$('pauseMessage').textContent='게임과 기록, 대사·연출 시간이 멈췄습니다.';$('pauseOverlay').hidden=false;}
function continueGame(){if(document.hidden||gameTime.reasons.has('loading')||gameTime.reasons.has('context'))return;resume('background');resume('manual');$('pauseOverlay').hidden=true;canvas.focus();}
function resetCrates(){if(!crates)return;BOXES.forEach(b=>{const g=crates[b.id];world.add(g);g.position.set(b.x,.39,b.z);g.scale.setScalar(1);g.rotation.set(0,0,0);crateShadows[b.id].visible=true});}
function resetWorld(){clearInput();jump.reset();jumpOffset=0;avatar.position.set(chapter.spawn.x,.11,chapter.spawn.z);avatar.rotation.y=0;movement.direction=0;warmth=0;walkTime=elapsed=lastStep=lampTime=gamePos=cooldown=0;
 resetCrates();
 rig.select('free');if($('cameraPreset'))$('cameraPreset').value='free';makeLabels();updateHUD();
}
async function advanceChapter(){
 await playSequence(chapter.ending);
 if(chapterIndex+1<campaign.chapters.length){
   await withLoading(gameTime,async()=>{const next=await loadChapter(chapterIndex+1);await enterChapter(next,chapterIndex+1);});
   lastFrame=performance.now();audio.pause(gameTime.paused);await playSequence(chapter.opening);completing=false;updateHUD();return;
 }
 gameTime.finish();audio.finish?.();finished=true;completing=false;clearInput();persistRecord(true);updateTimer();
 $('finalTime').textContent=`기록 ${formatTime(gameTime.elapsed())}${gameTime.interrupted?' · 중단 이력 있음':''}`;
 $('ending').hidden=false;$('hud').hidden=true;$('controls').hidden=true;session.onFinish?.(gameTime.snapshot());syncControls();
}
function fail(error){pause('error');$('loadError').hidden=false;$('errorMessage').textContent=`진행을 중단했습니다. ${error.message}`;console.error(error);}
async function completeQuest(receipt=null){if(completing||!flow.runner.ready)return;completing=true;clearInput();
 await playSequence(flow.quest.after);
 if(receipt&&!(await partResults.show(receipt)))return;
 flow.advance();
 if(flow.runner.complete){await advanceChapter();return;}
 if(flow.phase==='boxes')resetCrates();completing=false;updateHUD();
}
async function interact(){if(mini.hasInteraction){if(!worldLocked()&&!timeline.active&&!completing)mini.interact();return;}if(interactionLocked())return;
 // A space with optional observations shares this input route and revalidates the displayed ID.
 if(view.optionalTargets){
  if(!nearest||!registry.nearest(avatar.position,[nearest]))return;
  if(nearest.optional){view.interactOptional?.(nearest.id);return;}
 }else chooseNearest();
 if(!nearest)return;const c=nearest,q=flow.quest;
 if(q.type==='minigame'){
  if(mini.active)return;
  if(!flow.runner.canAttempt){toast('다시 시도할 수 없습니다.');return;}
  mini.start(q.minigameId,q.config,{questId:q.id,target:c.id});return;
 }
 if(q.type==='interact'){completing=true;chime();await playSequence(q.before);flow.record(c.id);completing=false;updateHUD();await completeQuest();}
 else if(q.type==='boxes'){
  if(c.action==='pick'){if(!flow.pick(c.boxId))return;const g=crates[c.boxId];carryAnchor.add(g);g.position.set(0,0,0);g.rotation.set(0,0,0);g.scale.setScalar(.8);crateShadows[c.boxId].visible=false;tone(240,.035,.15,'triangle');toast('같은 모양의 뒤쪽 선반으로 옮겨주세요.');}
  else if(c.action==='place'){if(!flow.place(c.boxId))return;const b=BOXES[c.boxId],g=crates[c.boxId];world.add(g);g.position.set(b.slotX,1.61,-3.47);g.rotation.set(0,0,0);g.scale.setScalar(1);chime();}
  updateHUD();await completeQuest();
 }else if(q.type==='light'){gameOpen=true;lampTime=0;cooldown=0;clearInput();$('lampGame').hidden=false;updateLampDots();syncControls();}
 else if(q.type==='exit'){flow.finish(c.id);await completeQuest();}
}
function updateLampDots(){[...$('lampDots').children].forEach((el,i)=>el.classList.toggle('lit',i<flow.sparks));}
function closeLamp(){if(gameTime.paused)return;gameOpen=false;$('lampGame').hidden=true;clearInput();syncControls();}
function catchSpark(){if(!gameOpen||gameTime.paused||cooldown>0||timeline.active)return;cooldown=.38;
 if(flow.spark(gamePos)){chime();updateLampDots();$('lampStatus').textContent=`불씨를 모았어요. ${flow.sparks} / ${flow.quest.goal.count}`;
  if(flow.runner.ready){closeLamp();completeQuest().catch(fail);}}
 else{tone(220,.02,.2);$('lampStatus').textContent='불씨가 밝은 구간에 올 때 다시 눌러보세요.';}
}
async function start(){if(started||$('startBtn').disabled)return;started=true;gameTime.start();$('welcome').hidden=true;$('sceneCaption').hidden=true;$('hud').hidden=false;resetWorld();audio.start();await playSequence(chapter.opening);canvas.focus();}
async function reset(){if(!finished)return;partResults.close();timeline.cancel();gameTime.reset();session.onReset?.();finished=false;gameOpen=false;completing=false;chapterIndex=0;
 try{await enterChapter(await loadChapter(0),0);['ending','lampGame','dialogue','help','pauseOverlay'].forEach(id=>$(id).hidden=true);$('hud').hidden=false;$('controls').hidden=false;gameTime.start();lastFrame=performance.now();await playSequence(chapter.opening);canvas.focus();}catch(e){fail(e);}
}
function showHelp(){pause('help');$('help').hidden=false;}
function closeHelp(){$('help').hidden=true;resume('help');canvas.focus();}
function safe(fn){return ()=>Promise.resolve().then(fn).catch(fail);}
$('startBtn').addEventListener('click',safe(start));touchActions.push(bindTouchAction($('interactBtn'),safe(interact)));$('catchBtn').addEventListener('click',catchSpark);
$('closeLamp').addEventListener('click',closeLamp);$('restartBtn').addEventListener('click',safe(reset));$('helpBtn').addEventListener('click',showHelp);$('closeHelp').addEventListener('click',closeHelp);$('resumeBtn').addEventListener('click',closeHelp);
$('pauseBtn').addEventListener('click',manualPause);$('continueBtn').addEventListener('click',continueGame);
$('homeLink').addEventListener('click',e=>{e.preventDefault();showHelp()});$('soundBtn').addEventListener('click',()=>{audio.toggle();audio.pause(gameTime.paused)});
const syncFullscreen=bindFullscreen($('fullBtn'),document,()=>toast('전체 화면으로 전환하지 못했습니다. 브라우저 설정을 확인해 주세요.'));
if(!rig.commonThirdPerson){
$('cameraPreset').addEventListener('change',()=>{if(cameraLocked())return;const mode=$('cameraPreset').value;rig.select(mode,mode==='fixed'?{x:0,y:1.15,z:.6}:null);syncControls();});
$('rotateLeft').addEventListener('click',()=>{if(!cameraLocked())rig.rotate(-Math.PI/5)});$('rotateRight').addEventListener('click',()=>{if(!cameraLocked())rig.rotate(Math.PI/5)});$('resetCamera').addEventListener('click',()=>{if(!cameraLocked())rig.select('free')});
}
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLSelectElement)return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE','KeyQ','KeyR','KeyP'].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(e.code==='Escape'||e.code==='KeyP'){if(!$('help').hidden)closeHelp();else if(!$('pauseOverlay').hidden)continueGame();else if(started&&!finished)manualPause();else showHelp();return;}
 if(gameTime.paused||finished)return;
 if(!started){if(['Enter','Space'].includes(e.code))safe(start)();return;}
 if(gameOpen){if(['Space','Enter','KeyE'].includes(e.code))catchSpark();return;}
 if(['KeyE','Enter'].includes(e.code)&&(!interactionLocked()||mini.hasInteraction))safe(interact)();
 if(!rig.commonThirdPerson&&!cameraLocked()){if(e.code==='KeyQ')rig.rotate(-Math.PI/5);if(e.code==='KeyR')rig.rotate(Math.PI/5);}
 if(e.code==='Space'&&!movementLocked())requestJump();
 if(!movementLocked())keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearInput);
touchActions.push(bindTouchAction($('jumpBtn'),()=>requestJump(true),{onPress:true}));
guardGameGestures([$('world'),$('touchControls'),$('actionControls')]);
$('runBtn').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();if(movementLocked()||runPointerId!==null||!capturePointer($('runBtn'),e.pointerId))return;movement.clearRunRelease();runPointerId=e.pointerId;touchRun=true;syncRunButton();});
$('runBtn').addEventListener('pointermove',e=>{if(e.pointerId===runPointerId&&!inside($('runBtn'),e))endRun(true);});
$('runBtn').addEventListener('lostpointercapture',e=>{if(e.pointerId===runPointerId)endRun();});
document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden){pause('background');if(started&&!finished){$('pauseMessage').textContent='다른 탭으로 이동해 일시정지했습니다. 기록에 중단 이력이 저장됩니다.';$('pauseOverlay').hidden=false;}}
 else if(!started||finished){resume('background');}else{updateTimer();}});
window.addEventListener('pagehide',()=>{if(started&&!finished){pause('background');persistRecord();}});
canvas.addEventListener('pointerdown',e=>{if(cameraLocked()||!rig.acceptsInput||drag||!capturePointer(canvas,e.pointerId))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||cameraLocked())return;rig.rotate(-(e.clientX-drag.x)*.007,(e.clientY-drag.y)*.004);drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===drag?.id)endDrag();});
if(!rig.commonThirdPerson)canvas.addEventListener('wheel',e=>{e.preventDefault();if(!cameraLocked())rig.zoom(e.deltaY*.012)},{passive:false});
function moveStick(e){const r=$('joystick').getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width*.35),z=(e.clientY-r.top-r.height/2)/(r.height*.35);const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}touch.x=x;touch.z=z;$('stick').style.transform=`translate(${x*r.width*.29}px,${z*r.height*.29}px)`;}
$('joystick').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();if(movementLocked()||stickId!==null||!capturePointer($('joystick'),e.pointerId))return;stickId=e.pointerId;moveStick(e);});
$('joystick').addEventListener('pointermove',e=>{if(e.pointerId===stickId&&!movementLocked())moveStick(e)});
$('joystick').addEventListener('lostpointercapture',e=>{if(e.pointerId===stickId)endStick();});
// Capture-phase cleanup also covers release outside a button or a removed/disabled target.
for(const type of ['pointerup','pointercancel'])window.addEventListener(type,e=>{if(e.pointerId===stickId)endStick();if(e.pointerId===runPointerId)endRun(type==='pointerup');if(e.pointerId===drag?.id)endDrag();},true);
function syncInputHelp(){
 $('hint').innerHTML=coarse?'빛나는 표시 가까이에서 행동 버튼을 누르세요.':'빛나는 표시 가까이에서 <kbd>E</kbd> 를 누르세요.';
 $('controls').innerHTML=coarse?'조이스틱으로 이동 · 행동 버튼으로 상호작용 · 점프 버튼으로 점프 · 달리기 버튼을 누른 채 이동':'<span><kbd>W A S D</kbd> 이동 · <kbd>Shift</kbd> 달리기 · <kbd>Space</kbd> 점프</span><i></i><span><kbd>E</kbd> 상호작용</span><i></i><span>드래그 시점 회전 · 휠 확대</span>';
 let rows=coarse?[['이동','왼쪽 조이스틱'],['행동','대상 가까이에서 행동 버튼'],['점프','점프 버튼 · 착지 후 다시 점프'],['달리기','달리기 버튼을 누른 채 이동'],['시점','빈 화면을 밀어 회전 · 카메라 프리셋'],['대사·연출','자동 진행 · 스킵 불가'],['일시정지','왼쪽 위 버튼 · 복귀 후 직접 재개']]:[['이동','WASD / 방향키'],['달리기','Shift를 누른 채 이동'],['점프','Space · 착지 후 다시 점프'],['상호작용','E / 화면 오른쪽 아래 버튼'],['시점 회전','화면 드래그 / Q · R / 회전 버튼'],['가까이 보기','마우스 휠 · 시점 초기화 ◎'],['대사·연출','자동 진행 · 스킵 불가'],['일시정지','P / ESC / 왼쪽 위 버튼']];
 if(rig.commonThirdPerson){rows=rows.filter(([name])=>name!=='가까이 보기').map(([name,text])=>[name,name.includes('시점')?(coarse?'빈 화면 드래그로 상하좌우 회전':'화면 드래그로 상하좌우 회전'):text]);$('controls').innerHTML=$('controls').innerHTML.replace('드래그 시점 회전 · 휠 확대','드래그로 상하좌우 시점 회전');}
 $('controlHelp').innerHTML=rows.map(([a,b])=>'<dt>'+a+'</dt><dd>'+b+'</dd>').join('');
 $('scene').setAttribute('aria-label',coarse?'조이스틱 이동, 행동 버튼 상호작용, 점프 버튼 점프, 달리기 버튼 홀드, 빈 화면 드래그 시점 회전':'방향키 또는 WASD 이동, E 상호작용, Space 점프, Shift 달리기, '+(rig.commonThirdPerson?'화면 드래그 카메라 회전':'Q와 R 카메라 회전'));
 $('lampInstruction').innerHTML=coarse?'움직이는 불씨가 밝은 구간에 닿으면<br>불씨 잡기 버튼을 누르세요.':'움직이는 불씨가 밝은 구간에 닿으면<br><strong>SPACE</strong> 또는 아래 버튼을 누르세요.';
}
function resize(){
 const viewport=visibleGameViewport(window);document.body.style.setProperty('--game-height',viewport.height+'px');document.body.style.setProperty('--game-top',viewport.top+'px');
 const width=canvas.clientWidth,height=canvas.clientHeight;
 if(width!==renderWidth||height!==renderHeight)clearInput();
 renderWidth=Math.max(1,width);renderHeight=Math.max(1,height);
 coarse=matchMedia('(any-pointer:coarse)').matches||renderWidth<=900;syncControls();syncInputHelp();syncFullscreen();
 renderer.setSize(renderWidth,renderHeight,false);camera.aspect=renderWidth/renderHeight;camera.updateProjectionMatrix();
}
let resizeFrame=0;function scheduleResize(){if(!resizeFrame)resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resize();});}
window.addEventListener('resize',scheduleResize);window.addEventListener('orientationchange',scheduleResize);
window.visualViewport?.addEventListener('resize',scheduleResize);window.visualViewport?.addEventListener('scroll',scheduleResize);
document.addEventListener('fullscreenchange',scheduleResize);document.addEventListener('webkitfullscreenchange',scheduleResize);resize();
function animate(now){requestAnimationFrame(animate);const frameSeconds=Math.max(0,(now-lastFrame)/1000);lastFrame=now;
 const dt=gameTime.paused?0:Math.min(frameSeconds,.05);elapsed+=dt;timeline.tick();mini.tick();updateTimer();
 if(timeline.active)$('dialogRemaining').textContent=`자동 진행 · ${(timeline.remainingMs/1000).toFixed(1)}초${gameTime.paused?' · 일시정지':''}`;
 if(toastUntil&&gameTime.elapsed()>=toastUntil){$('toast').classList.remove('show');toastUntil=0;}
 const previousX=avatar.position.x,previousZ=avatar.position.z;
 const running=touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight'),targetSpeed=(carrying()?(running?3.2:2.1):(running?4.15:2.55))*(view.speedScale??1);
 const moving=movement.update(dt,moveInput(),currentYaw,targetSpeed,movementLocked(),jump.airborne);
 if(!interactionLocked()&&flow.phase==='exit'){const target=candidates()[0];if(target&&Math.hypot(avatar.position.x-target.x,avatar.position.z-target.z)<.58){flow.finish(target.id);completeQuest().catch(fail);}}
 walkTime+=moving?dt*9:0;playerView.update({dt,speed:dt>0?Math.hypot(avatar.position.x-previousX,avatar.position.z-previousZ)/dt:0,moving,gait:moving?Math.sin(walkTime):0,elapsed,carrying:carrying()});
 avatar.position.y-=jumpOffset;view.updatePlayerHeight(dt);const wasAirborne=jump.airborne;jumpOffset=jump.update(dt);if(wasAirborne&&!jump.airborne)movement.land();avatar.position.y+=jumpOffset;
 $('jumpBtn').disabled=movementLocked()||jump.airborne;
 if(moving&&elapsed-lastStep>.28){lastStep=elapsed;tone(125,.006,.045,'triangle');}chooseNearest();
 let desiredDistance=rig.distance,desiredYaw=rig.yaw;const portrait=renderWidth/renderHeight<.8;
 const studyTarget=rig.commonThirdPerson?(rig.target??{x:avatar.position.x,y:1.4,z:avatar.position.z}):cameraRig&&cameraRig.study!==false&&view.cameraTarget?view.cameraTarget(avatar,rig):null;
 if(studyTarget){lookTarget.set(studyTarget.x,studyTarget.y,studyTarget.z);}
 else if(rig.target){lookTarget.set(rig.target.x,rig.target.y,rig.target.z);if(portrait)desiredDistance*=1.18;}
 else if(!started){lookTarget.set(portrait?0:-2.8,portrait?-.3:1,portrait?2.6:.25);desiredDistance=portrait?29:25.5;desiredYaw+=Math.sin(elapsed*.13)*.025;}
 else{const close=rig.mode==='close';lookTarget.set(avatar.position.x*(close?1:.21),close?1:.9,close?avatar.position.z:.4+avatar.position.z*.19);if(portrait)desiredDistance*=1.47;}
 camTarget.lerp(lookTarget,1-Math.exp(-dt*(studyTarget?8:2.7)));currentYaw=THREE.MathUtils.lerp(currentYaw,desiredYaw,1-Math.exp(-dt*5));currentPitch=THREE.MathUtils.lerp(currentPitch,rig.pitch,1-Math.exp(-dt*5));currentDistance=THREE.MathUtils.lerp(currentDistance,desiredDistance,1-Math.exp(-dt*3));
 if(!studyTarget&&view.cameraTarget&&!timeline.active){const target=view.cameraTarget(avatar,rig);lookTarget.set(target.x,target.y,target.z);camTarget.lerp(lookTarget,1-Math.exp(-dt*8));}
 camera.position.set(camTarget.x+Math.sin(currentYaw)*Math.cos(currentPitch)*currentDistance,camTarget.y+Math.sin(currentPitch)*currentDistance,camTarget.z+Math.cos(currentYaw)*Math.cos(currentPitch)*currentDistance);
 // Optional space-owned framing/occlusion; legacy-room has no hook and keeps its camera behavior.
 lookTarget.copy(camTarget);view.resolveCamera?.(camera,lookTarget,dt);camera.lookAt(lookTarget);camera.updateMatrixWorld();
 const ct=candidates(),markerTarget=ct.reduce((best,c)=>!best||Math.hypot(c.x-avatar.position.x,c.z-avatar.position.z)<Math.hypot(best.x-avatar.position.x,best.z-avatar.position.z)?c:best,null);
 markerGroup.visible=!interactionLocked();if(markerTarget){markerGroup.position.set(markerTarget.x,(markerTarget.y??1.7)+Math.sin(elapsed*3)*.095,markerTarget.z);marker.rotation.y=elapsed;}
 for(const l of labels){const relevant=!interactionLocked()&&ct.some(c=>c.id===l.id);l.el.hidden=!relevant;if(!relevant)continue;labelV.copy(l.p).project(camera);l.el.style.left=(labelV.x*.5+.5)*renderWidth+'px';l.el.style.top=(-labelV.y*.5+.5)*renderHeight+'px';l.el.style.opacity=labelV.z<1?1:0;}
 audio.update?.();
 view.updateAmbient({dt,elapsed,warmth,currentYaw,playing:started&&!finished&&!gameTime.paused,activeMs:gameTime.elapsed(),jumpHeight:jumpOffset,quest:{id:flow.quest?.id,type:flow.phase,seen:[...flow.runner.seen]}});
 if(gameOpen&&!gameTime.paused){lampTime+=dt;cooldown=Math.max(0,cooldown-dt);gamePos=timingPosition(lampTime,flow.sparks);$('spark').style.left=(gamePos*100)+'%';}
 renderer.render(scene,camera);
}
if(chapter.sceneId!=='legacy-room')await enterChapter(chapter,0);else{appearance.apply(chapter.appearanceId??'default');resetWorld();renderer.render(scene,camera);}
await withLoading(gameTime,async()=>{});
lastFrame=performance.now();requestAnimationFrame(animate);
$('startBtn').disabled=false;$('startLabel').textContent='이야기 속으로';
if(document.hidden)pause('background');
// Read-only diagnostics. No teleport, skip, or state mutation API is exposed.
window.gameStatus=()=>({content:scene.userData.experiment?structuredClone(scene.userData.experiment):null,sceneId:spaceHost.current?.id,appearanceId:appearance.id,minigame:mini.snapshot(),minigameResult:flow.runner.lastResult,attempts:flow.runner.attempts,visualProfile,motion:movement.snapshot(),jump:jump.snapshot(),mobileUI:coarse,runRequested:touchRun||keys.has('ShiftLeft')||keys.has('ShiftRight'),graphics:{buffers:scene.userData.resourceMetrics??null,render:{...renderer.info.render},memory:{...renderer.info.memory},dpr:renderer.getPixelRatio()},model:playerView.adapter.snapshot?.(),phase:flow.phase,questId:flow.quest?.id,chapterId:chapter.id,chapterIndex,carrying:flow.carry,placed:flow.placed.size,sparks:flow.sparks,started,finished,completing,dialogue:timeline.active,lineIndex:timeline.index,remainingMs:timeline.remainingMs,movementLocked:movementLocked(),position:{x:avatar.position.x,z:avatar.position.z,yaw:avatar.rotation.y},camera:{...rig.snapshot(),currentYaw,fov:camera.fov,actualPosition:camera.position.toArray(),lookAt:camTarget.toArray()},gamePos,cooldown,gameOpen,nearest:nearest?.id,rendered:renderer.info.render.calls>0,timer:gameTime.snapshot()});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause('context');$('loadError').hidden=false;$('errorMessage').textContent='3D 화면 연결이 끊겼습니다. 기록과 진행을 멈췄습니다. 다시 불러오기를 눌러주세요.';});


}
