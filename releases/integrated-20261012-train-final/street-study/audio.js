const url=name=>new URL('./audio/'+name+'.mp3',import.meta.url).href;
// Same Web Audio/streaming-music pattern as the warehouse, with independent chapter settings.
export function createStreetAudio(isPaused,isStarted,getView){
 let context,master,musicGain,fxGain,musicNode,entered=false,paused=false,unlocked=false,muted=false,disposed=false;
 let bgmVolume=.24,sfxVolume=.70,playing=false,direction='idle',current=null,contact=0,fadeAt=null,lastMusic=-1;
 const buffers=new Map(),voices=new Set(),errors=[],counts={up:0,down:0,close:0},music=new Audio(url('bgm'));
 music.loop=true;music.preload='metadata';const $=id=>document.getElementById(id),listeners=[];
 const musicEvents={play:0,pause:0,waiting:0,emptied:0};for(const name of Object.keys(musicEvents))music.addEventListener(name,()=>musicEvents[name]++);
 const allowed=()=>entered&&!disposed&&unlocked&&isStarted()&&!paused&&!isPaused()&&!document.hidden&&!muted;
 function issue(name,e){if(!errors.some(x=>x.name===name))errors.push({name,message:String(e?.message??e)});}
 function target(node,v,t=.035){if(node&&context){node.gain.cancelScheduledValues(context.currentTime);node.gain.setTargetAtTime(v,context.currentTime,t);}}
 function ui(){if(!entered)return;$('soundState').textContent=unlocked&&!muted?'ON':'OFF';$('soundBtn').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');$('soundBtn').title=muted?'소리 켜기':'소리 끄기';$('streetMute').checked=muted;}
 function release(v,fade=false){if(!v)return;target(v.gain,0,.025);try{v.source.stop(context.currentTime+(fade?.12:0));}catch{}if(current===v)current=null;}
 function stop(){for(const v of voices)release(v);current=null;direction='idle';}
 function voice(name,loop=false){if(!allowed()||!buffers.has(name))return null;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(name);source.loop=loop;gain.gain.value=loop?0:.72;source.connect(gain);gain.connect(fxGain);const v={source,gain,name};voices.add(v);source.onended=()=>{voices.delete(v);source.disconnect();gain.disconnect();};source.start();if(loop)target(gain,.82);counts[name]++;return v;}
 function init(){if(context)return;const C=window.AudioContext||window.webkitAudioContext;if(!C){issue('support','Web Audio 미지원');return;}
  context=new C();master=context.createGain();master.connect(context.destination);musicGain=context.createGain();musicGain.gain.value=0;musicGain.connect(master);fxGain=context.createGain();fxGain.connect(master);musicNode=context.createMediaElementSource(music);musicNode.connect(musicGain);
  for(const name of ['up','down','close'])fetch(url(name)).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer();}).then(b=>context.decodeAudioData(b)).then(b=>{if(!disposed)buffers.set(name,b);}).catch(e=>issue(name,e));
 }
 function sync(){ui();if(!context)return;target(master,muted?0:1);target(fxGain,sfxVolume);
  if(!allowed()){music.pause();context.suspend().catch(e=>issue('suspend',e));return;}
  context.resume().then(()=>{if(!allowed())return;if(music.paused&&!playing){playing=true;music.play().catch(e=>issue('play',e)).finally(()=>{playing=false;if(!allowed())music.pause();});}}).catch(e=>issue('resume',e));
 }
 const api={tone(){},chime(){},
  start(){unlocked=true;paused=isPaused();init();sync();},
  toggle(){if(!unlocked){unlocked=true;muted=false;init();}else muted=!muted;if(muted)stop();sync();},
  pause(v){paused=v;sync();},
  enter(id){api.leave();entered=id==='life-street';$('streetAudioSettings').hidden=!entered;contact=0;fadeAt=null;lastMusic=-1;sync();},
  leave(){entered=false;music.pause();try{music.currentTime=0;}catch{}stop();if(context)context.suspend().catch(e=>issue('suspend',e));},
  finish(){api.leave();},
  update(){
   if(!entered||!context)return;const s=getView()?.scene.userData.shutter;if(!s)return;
   // Consume the physical contact even when muted; never replay an old slam on unmute.
   if(s.contacts>contact){contact=s.contacts;voice('close');}
   if(!allowed())return;
   if(s.closing&&fadeAt===null)fadeAt=context.currentTime;
   const fade=fadeAt===null?1:Math.max(0,1-(context.currentTime-fadeAt)/1.8),level=bgmVolume*(s.focus||fadeAt!==null ? .68 : 1)*fade;
   if(Math.abs(level-lastMusic)>.001){target(musicGain,level,.35);lastMusic=level;}
   const next=s.direction;
   if(next!==direction||(next!=='idle'&&!current&&buffers.has(next))){release(current,true);direction=next;current=next==='idle'?null:voice(next,true);}
   ui();
  },
  setVolume(kind,v){v=Number(v);if(!Number.isFinite(v))return;v=Math.max(0,Math.min(1,v));if(kind==='bgm'){bgmVolume=v;lastMusic=-1;}else sfxVolume=v;sync();},
  snapshot(){return {entered,unlocked,muted,paused:paused||isPaused(),context:context?.state??'locked',bgmPaused:music.paused,bgmTime:music.currentTime,bgmLoop:music.loop,bgmVolume,sfxVolume,musicLevel:lastMusic,actualMusicGain:musicGain?.gain.value,musicEvents:{...musicEvents},direction,contact,counts:{...counts},voices:voices.size,loaded:[...buffers.keys()],errors:[...errors]};},
  async dispose(){api.leave();disposed=true;for(const [el,type,fn]of listeners)el.removeEventListener(type,fn);music.removeAttribute('src');music.load();musicNode?.disconnect();buffers.clear();await context?.close();}
 };
 function listen(id,type,fn){const el=$(id);if(el){el.addEventListener(type,fn);listeners.push([el,type,fn]);}}
 listen('streetBgm','input',e=>{api.setVolume('bgm',e.target.value);$('streetBgmValue').textContent=Math.round(bgmVolume*100)+'%';});
 listen('streetSfx','input',e=>{api.setVolume('sfx',e.target.value);$('streetSfxValue').textContent=Math.round(sfxVolume*100)+'%';});
 listen('streetMute','change',e=>{muted=e.target.checked;if(muted)stop();sync();});
 music.addEventListener('error',()=>issue('bgm',music.error?.message??'음원 로딩 실패'));
 return api;
}
