const FILES={bgm:'ovrsoull-deep-bass-cinematic-tension-forensic-noir-investigative-pulse-454724.mp3',hit:'mixkit-small-electric-glitch-2595.wav',paper:'mixkit-paper-slide-1530.wav',unlock:'mixkit-unlock-game-notification-253.wav',door:'mixkit-creaky-door-open-195.wav'};
const MUSIC_TRIM=.45; // Supplied bass track RMS .174; leave room for short paper/door transients.
const url=name=>new URL('./audio/'+FILES[name],import.meta.url).href;
// Same streaming BGM + decoded one-shot pattern as the existing chapter audio.
export function createOfficeAudio(isPaused,isStarted,getView){
 let context,master,musicGain,fxGain,musicNode,entered=false,unlocked=false,muted=false,paused=false,disposed=false,ending=false,scene=null,playing=false,fadeTimer=null;
 let bgmVolume=.24,sfxVolume=.65,lastTime=0,loops=0;
 const music=new Audio(url('bgm'));music.loop=true;music.preload='metadata';music.dataset.officeBgm='true';
 const buffers=new Map(),voices=new Map(),errors=[],counts={hit:0,paper:0,unlock:0,door:0},observed={hit:0,paper:0,unlock:0,door:0},seenPapers=new Set(),listeners=[];
 let lastHit=0,didUnlock=false,didDoor=false;
 const $=id=>document.getElementById(id),base=$('warehouseAudioSettings'),controls=base?.cloneNode(true);
 if(controls){controls.id='officeAudioSettings';controls.querySelector('legend').textContent='2019 사무실 소리';for(const n of controls.querySelectorAll('[id]'))n.id=n.id.replace('warehouse','office');base.before(controls);controls.hidden=true;}
 const allowed=()=>entered&&!disposed&&unlocked&&isStarted()&&!paused&&!isPaused()&&!document.hidden&&!muted;
 function issue(name,e){if(!errors.some(x=>x.name===name))errors.push({name,message:String(e?.message??e)});}
 function ramp(node,value,seconds=.08){if(!node||!context)return;const p=node.gain,t=context.currentTime;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(value,t+seconds);}
 function ui(){if(!entered)return;$('soundState').textContent=unlocked&&!muted?'ON':'OFF';$('soundBtn').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');if($('officeMute'))$('officeMute').checked=muted;for(const [kind,value]of [['Bgm',bgmVolume],['Sfx',sfxVolume]]){if($('office'+kind))$('office'+kind).value=value;if($('office'+kind+'Value'))$('office'+kind+'Value').textContent=Math.round(value*100)+'%';}}
 function stopEffects(){for(const v of voices.values()){try{v.source.stop();}catch{}}voices.clear();}
 function sync(fade=.18){ui();if(!context)return;ramp(master,muted?0:1);ramp(fxGain,sfxVolume);ramp(musicGain,ending?0:bgmVolume*MUSIC_TRIM,fade);
  if(!allowed()){music.pause();context.suspend().catch(e=>issue('suspend',e));return;}
  context.resume().then(()=>{if(!allowed()||ending)return;if(music.paused&&!playing){playing=true;music.play().catch(e=>issue('play',e)).finally(()=>{playing=false;if(!allowed())music.pause();});}}).catch(e=>issue('resume',e));
 }
 function init(){if(context)return;const C=window.AudioContext||window.webkitAudioContext;if(!C){issue('support','Web Audio 미지원');return;}
  context=new C();master=context.createGain();master.connect(context.destination);musicGain=context.createGain();musicGain.gain.value=0;musicGain.connect(master);fxGain=context.createGain();fxGain.gain.value=sfxVolume;fxGain.connect(master);musicNode=context.createMediaElementSource(music);musicNode.connect(musicGain);
  for(const name of ['hit','paper','unlock','door'])fetch(url(name)).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer();}).then(b=>context.decodeAudioData(b)).then(b=>{if(!disposed)buffers.set(name,b);}).catch(e=>issue(name,e));
 }
 function cue(name){observed[name]++;if(!allowed()||!buffers.has(name))return;const previous=voices.get(name);if(previous){try{previous.source.stop();}catch{}}
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(name);gain.gain.value={hit:.48,paper:.72,unlock:.40,door:.42}[name];source.connect(gain);gain.connect(fxGain);const voice={source,gain};voices.set(name,voice);source.onended=()=>{if(voices.get(name)===voice)voices.delete(name);source.disconnect();gain.disconnect();};source.start();counts[name]++;
 }
 function fadeOut(){if(ending)return;ending=true;ramp(musicGain,0,1.2);}
 function event(e){const a=e.detail;if(a.type==='chapter-enter'){lastHit=0;seenPapers.clear();didUnlock=didDoor=false;}
  if(a.type==='laser-hit'&&a.hits>lastHit){lastHit=a.hits;cue('hit');}
  if(a.type==='paper-collected'&&!seenPapers.has(a.id)){seenPapers.add(a.id);cue('paper');}
  if(a.type==='exit-unlocked'&&!didUnlock){didUnlock=true;cue('unlock');}
  if(a.type==='door-open'&&!didDoor){didDoor=true;cue('door');}
  if(a.type==='door-opened')fadeOut();
 }
 const api={tone(){},chime(){},
  start(){unlocked=true;paused=isPaused();init();sync(1);},
  toggle(){if(!unlocked){unlocked=true;muted=false;init();}else muted=!muted;if(muted)stopEffects();sync();},
  pause(value){paused=value;sync(value?.08:1);},
  enter(id){api.leave();entered=id==='life-office';ending=false;if(controls)controls.hidden=!entered;if(!entered)return;clearTimeout(fadeTimer);scene=getView()?.scene;scene?.addEventListener('office-audio-event',event);lastHit=0;seenPapers.clear();didUnlock=didDoor=false;if(context)musicGain.gain.value=0;sync(1);},
  leave(){scene?.removeEventListener('office-audio-event',event);scene=null;const was=entered;entered=false;if(controls)controls.hidden=true;stopEffects();clearTimeout(fadeTimer);if(was&&context&&!music.paused&&!ending){ramp(musicGain,0,.4);fadeTimer=setTimeout(()=>{if(!entered){music.pause();music.currentTime=0;}},450);}else{music.pause();try{music.currentTime=0;}catch{}}},
  finish(){api.leave();},
  update(){if(entered&&ending&&context&&musicGain.gain.value<.001)music.pause();},
  setVolume(kind,value){const n=Number(value);if(!Number.isFinite(n))return;if(kind==='bgm')bgmVolume=Math.max(0,Math.min(1,n));else if(kind==='sfx')sfxVolume=Math.max(0,Math.min(1,n));sync();},
  snapshot(){return {entered,unlocked,muted,paused:paused||isPaused(),ending,context:context?.state??'locked',bgmPaused:music.paused,bgmTime:music.currentTime,bgmDuration:music.duration,bgmLoop:music.loop,loops,bgmVolume,sfxVolume,musicGain:musicGain?.gain.value,fxGain:fxGain?.gain.value,loaded:[...buffers.keys()],counts:{...counts},observed:{...observed},voices:voices.size,errors:[...errors]};},
  async dispose(){api.leave();disposed=true;clearTimeout(fadeTimer);for(const [el,type,fn]of listeners)el.removeEventListener(type,fn);controls?.remove();music.removeAttribute('src');music.load();musicNode?.disconnect();buffers.clear();await context?.close();}
 };
 function listen(el,type,fn){if(el){el.addEventListener(type,fn);listeners.push([el,type,fn]);}}
 for(const kind of ['Bgm','Sfx'])listen($('office'+kind),'input',e=>api.setVolume(kind.toLowerCase(),e.target.value));
 listen($('officeMute'),'change',e=>{muted=e.target.checked;if(muted)stopEffects();sync();});
 listen(music,'error',()=>issue('bgm',music.error?.message??'음원 로딩 실패'));
 listen(music,'timeupdate',()=>{if(music.currentTime+.5<lastTime&&!music.seeking)loops++;lastTime=music.currentTime;});
 return api;
}
