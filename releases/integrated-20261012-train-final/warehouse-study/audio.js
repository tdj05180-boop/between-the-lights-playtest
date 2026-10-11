import {workflow} from './workflow-layout.js';
const FILES={pickup:'pickup.mp3',load:'truck-load.mp3',success:'success.mp3',conveyor:'conveyor.mp3'};
const url=name=>new URL('./audio/'+name,import.meta.url).href;
export function createWarehouseAudio(isPaused,isStarted,getView){
 let context=null,master=null,musicGain=null,fxGain=null,machineGain=null,musicNode=null;
 let entered=false,ended=false,paused=false,unlocked=false,muted=false,disposed=false,loop=null;
 let bgmVolume=.28,sfxVolume=.65,machineLevel=0,loads=null,playPending=false;
 const buffers=new Map(),voices=new Map(),errors=[],counts={pickup:0,load:0,success:0,conveyor:0},skipped={pickup:0,load:0,success:0};
 const music=new Audio(url('bgm.mp3'));music.loop=true;music.preload='metadata';
 const $=id=>document.getElementById(id);
 const controls=$('warehouseAudioSettings');
 function issue(name,error){if(!errors.some(e=>e.name===name))errors.push({name,message:String(error?.message??error)});}
 music.addEventListener('error',()=>issue('bgm',music.error?.message??'음원 로딩 실패'));
 function allowed(){return entered&&!ended&&!disposed&&unlocked&&isStarted()&&!paused&&!isPaused()&&!document.hidden&&!muted;}
 function target(node,value,t=.08){if(node&&context){node.gain.cancelScheduledValues(context.currentTime);node.gain.setTargetAtTime(value,context.currentTime,t);}}
 function ui(){if($('soundState'))$('soundState').textContent=unlocked&&!muted?'ON':'OFF';if($('soundBtn')){$('soundBtn').setAttribute('aria-label',muted||!unlocked?'소리 켜기':'소리 끄기');$('soundBtn').title=muted||!unlocked?'소리 켜기':'소리 끄기';}if($('warehouseMute'))$('warehouseMute').checked=muted;}
 function stopVoice(name){const v=voices.get(name);if(v){voices.delete(name);try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();}}
 function stopEffects(){for(const name of [...voices.keys()])stopVoice(name);if(loop){try{loop.stop();}catch{}loop.disconnect();loop=null;}}
 function machine(){if(!allowed()||!context||!buffers.has('conveyor')||loop)return;loop=context.createBufferSource();loop.buffer=buffers.get('conveyor');loop.loop=true;loop.connect(machineGain);loop.start();counts.conveyor++;}
 function sync(){
  ui();if(!context)return;
  target(master,muted?0:1);target(musicGain,bgmVolume);target(fxGain,sfxVolume);
  if(!allowed()){music.pause();context.suspend().catch(e=>issue('suspend',e));return;}
  context.resume().then(()=>{if(!allowed())return;machine();if(music.paused&&!playPending){playPending=true;music.play().catch(e=>issue('bgm-play',e)).finally(()=>{playPending=false;if(!allowed())music.pause();});}}).catch(e=>issue('resume',e));
 }
 function init(){
  if(context)return true;const C=window.AudioContext||window.webkitAudioContext;if(!C){issue('support','Web Audio 미지원');return false;}
  try{context=new C();master=context.createGain();musicGain=context.createGain();fxGain=context.createGain();machineGain=context.createGain();master.connect(context.destination);musicGain.connect(master);fxGain.connect(master);machineGain.connect(fxGain);machineGain.gain.value=0;musicGain.gain.value=0;fxGain.gain.value=sfxVolume;musicNode=context.createMediaElementSource(music);musicNode.connect(musicGain);
   loads=Promise.all(Object.entries(FILES).map(async([name,file])=>{try{const r=await fetch(url(file));if(!r.ok)throw Error('HTTP '+r.status);const b=await context.decodeAudioData(await r.arrayBuffer());if(disposed)return;buffers.set(name,b);if(name==='conveyor')machine();}catch(e){issue(name,e);}}));
   return true;
  }catch(e){issue('init',e);return false;}
 }
 function cue(name,delay=0){
  if(!allowed()||!context||!buffers.has(name)){if(name in skipped)skipped[name]++;return;}
  stopVoice(name);const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(name);gain.gain.value={pickup:.32,load:.7,success:.28}[name]??.3;source.connect(gain);gain.connect(fxGain);const voice={source,gain};voices.set(name,voice);source.onended=()=>{if(voices.get(name)===voice)voices.delete(name);source.disconnect();gain.disconnect();};source.start(context.currentTime+delay);counts[name]++;
 }
 const api={
  // This local chapter uses only supplied recordings; no procedural music/steps.
  tone(){},chime(){},
  start(){if(disposed)return;unlocked=true;paused=isPaused();init();sync();},
  toggle(){if(!unlocked){unlocked=true;muted=false;init();}else muted=!muted;if(muted)stopEffects();sync();},
  pause(value){paused=value;sync();},
  enter(id){api.leave();entered=id==='warehouse-workflow';ended=false;if(controls)controls.hidden=!entered;if(entered){getView().warehouseAudio=api;sync();}},
  leave(){entered=false;music.pause();try{music.currentTime=0;}catch{}stopEffects();if(getView()?.warehouseAudio===api)delete getView().warehouseAudio;},
  finish(){ended=true;api.leave();},
  pickup(){cue('pickup');},delivered(){cue('load');cue('success',.13);},
  update(){
   if(!allowed()||!context)return;const view=getView(),p=view.avatar.position;
   const distances=workflow.belts.map(b=>{const horizontal=!!b.rotation;return Math.hypot(Math.max(0,Math.abs(p.x-b.x)-(horizontal?b.length/2:.925)),Math.max(0,Math.abs(p.z-b.z)-(horizontal?.925:b.length/2)));});
   const motion=view.features.conveyorMotion,speed=motion?.speed??.165;
   const freeFraction=Math.max(0,1-(motion?.waiting.length??0)*.98/30.7);
   const level=.075*Math.min(1,speed/2)*freeFraction/(1+Math.min(...distances)/5)**2;
   if(Math.abs(level-machineLevel)>.001){machineLevel=level;target(machineGain,level,.18);}machine();
  },
  setVolume(kind,value){const v=Math.max(0,Math.min(1,Number(value)));if(!Number.isFinite(v))return;if(kind==='bgm')bgmVolume=v;else if(kind==='sfx')sfxVolume=v;sync();},
  snapshot(){return {entered,ended,unlocked,muted,paused:paused||isPaused(),context:context?.state??'locked',bgmPaused:music.paused,bgmTime:music.currentTime,bgmLoop:music.loop,bgmReady:music.readyState,bgmVolume,sfxVolume,machineLevel,activeVoices:voices.size,loopInstances:loop?1:0,loaded:[...buffers.keys()],counts:{...counts},skipped:{...skipped},errors:[...errors]};},
  async dispose(){if(disposed)return;api.leave();disposed=true;for(const [el,type,fn] of listeners)el?.removeEventListener(type,fn);music.removeAttribute('src');music.load();musicNode?.disconnect();buffers.clear();await context?.close().catch(()=>{});}
 };
 const listeners=[];function listen(el,type,fn){if(el){el.addEventListener(type,fn);listeners.push([el,type,fn]);}}
 listen($('warehouseBgm'),'input',e=>{api.setVolume('bgm',e.target.value);$('warehouseBgmValue').textContent=Math.round(bgmVolume*100)+'%';});
 listen($('warehouseSfx'),'input',e=>{api.setVolume('sfx',e.target.value);$('warehouseSfxValue').textContent=Math.round(sfxVolume*100)+'%';});
 listen($('warehouseMute'),'change',e=>{muted=e.target.checked;if(muted)stopEffects();sync();});
 ui();return api;
}
