import {createEffectBank} from '../src/systems/effect-bank.js';
import {createMediaPlayback} from '../src/systems/media-playback.js';
export const FILES={chair:'freesound_community-office-chair-rolling-69797.mp3',typing:'virtual_vibes-realistic-typing-sound-for-office-use-379369.mp3',bgm:'cozyvibes-ambient-chill-technology-503847.mp3',click:'virtual_vibes-single-mouse-click-sound-hd-379373.mp3',notification:'universfield-soft-notification-146623.mp3',success:'universfield-success-notification-132473.mp3',error:'universfield-error-notification-352286.mp3',transition:'universfield-swoosh-05-329226.mp3',complete:'soundshelfstudio-mission-complete-chime-534595.mp3'};
export function createAgencyAudio(isPaused,isStarted,getView){
 const url=n=>new URL('./audio/'+FILES[n],import.meta.url).href,music=new Audio(url('bgm'));music.loop=true;music.preload='metadata';
 let context,master,bgmGain,fxGain,scene,entered=false,unlocked=false,muted=false,paused=false,ending=false,disposed=false,bgmVolume=.24,sfxVolume=.65;
 let ambientAt=0,nextTyping=6,lastAmbient=null; const lastCue=new Map();
 const buffers=new Map(),voices=new Map(),counts={},errors=[],playbackLog=[],listeners=[];
 const base=document.getElementById('warehouseAudioSettings'),controls=base?.cloneNode(true);if(controls){controls.id='agencyAudioSettings';controls.querySelector('legend').textContent='2026 지사 소리';for(const n of controls.querySelectorAll('[id]'))n.id=n.id.replace('warehouse','agency');base.before(controls);controls.hidden=true;}
 const log=(event,detail={})=>{playbackLog.push({event,atMs:Math.round(performance.now()),context:context?.state??'locked',...detail});if(playbackLog.length>80)playbackLog.shift();};
 const issue=(name,error)=>{const e={name,message:String(error?.message??error),type:error?.name};errors.push(e);if(errors.length>30)errors.shift();log('failure',e);console.warn('[Agency audio]',e);};
 const allowed=()=>entered&&unlocked&&!disposed&&isStarted()&&!isPaused()&&!paused&&!document.hidden&&!muted;
 const playback=createMediaPlayback({media:music,getContext:()=>context,allowed:()=>allowed()&&!ending,onError:issue});
 function ramp(node,v,seconds=.15){if(!node)return;const t=context.currentTime;node.gain.cancelScheduledValues(t);node.gain.setValueAtTime(node.gain.value,t);node.gain.linearRampToValueAtTime(v,t+seconds);}
 function stopFX(){for(const s of voices.values())try{s.stop();}catch{}voices.clear();}
 function sync(fade=.25){if(controls&&entered){for(const [k,v]of [['Bgm',bgmVolume],['Sfx',sfxVolume]]){document.getElementById('agency'+k).value=v;document.getElementById('agency'+k+'Value').textContent=Math.round(v*100)+'%';}document.getElementById('agencyMute').checked=muted;document.getElementById('soundState').textContent=unlocked&&!muted?'ON':'OFF';}
  if(!context)return;ramp(master,muted?0:1);ramp(fxGain,sfxVolume);ramp(bgmGain,ending||!allowed()?0:bgmVolume*.55,fade);
  if(!allowed())stopFX();playback.sync();
 }
 const effects=createEffectBank({names:Object.keys(FILES).filter(n=>n!=='bgm'),url:url,getContext:()=>context,buffers,isDisposed:()=>disposed,onError:(name,error)=>issue(name,error)});
 function init(){if(context)return;const C=window.AudioContext||window.webkitAudioContext;if(!C){issue('support','Web Audio unavailable');return;}context=new C();master=context.createGain();master.connect(context.destination);bgmGain=context.createGain();bgmGain.gain.value=0;bgmGain.connect(master);fxGain=context.createGain();fxGain.connect(master);context.createMediaElementSource(music).connect(bgmGain);
  if(entered)void effects.prepare();
 }
 function cue(n,options={}){if(!allowed()||!buffers.has(n))return;
  const now=context.currentTime;if(now-(lastCue.get(n)??-Infinity)<(n==='click'?.07:n==='typing'?.8:0))return;lastCue.set(n,now);if(voices.has(n))try{voices.get(n).stop();}catch{}if(voices.size>=4){const old=voices.keys().next().value;voices.get(old).stop();voices.delete(old);}const s=context.createBufferSource(),g=context.createGain();s.buffer=buffers.get(n);g.gain.value=({click:.35,notification:.4,success:.4,error:.28,transition:.3,complete:.5,chair:1.2,typing:.12})[n]*(options.level??1);s.connect(g);g.connect(fxGain);voices.set(n,s);s.onended=()=>{if(voices.get(n)===s)voices.delete(n);s.disconnect();g.disconnect();};const offset=n==='chair'?5.4:0,duration=Math.min(options.duration??s.buffer.duration,s.buffer.duration-offset),t=context.currentTime,level=g.gain.value;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+.012);g.gain.setValueAtTime(level,t+Math.max(.012,duration-.05));g.gain.linearRampToValueAtTime(0,t+duration);
  s.start(0,offset,duration);log('cue',{name:n,offset,duration,level});counts[n]=(counts[n]??0)+1;}
 function event(e){const type=e.detail.type;if(type==='start'){ending=false;sync(.5);cue('typing',{duration:1.2});return;}cue(type,e.detail);if(type==='complete'&&!ending){ending=true;ramp(bgmGain,0,.9);}}
 function listen(el,type,fn){if(el){el.addEventListener(type,fn);listeners.push([el,type,fn]);}}
 const api={prepare:()=>effects.prepare(),releaseBuffers:()=>effects.release(),tone(){},chime(){},start(){unlocked=true;paused=isPaused();init();if(context){bgmGain.gain.value=0;playback.prime();if(allowed())sync(1);}},toggle(){if(!unlocked){unlocked=true;init();}else muted=!muted;sync();},pause(value){paused=value;sync();},
  enter(id){api.leave();entered=id==='life-agency';if(entered)void effects.prepare();ending=false;ambientAt=0;nextTyping=6;lastAmbient=null;lastCue.clear();if(controls)controls.hidden=!entered;if(entered){scene=getView()?.scene;scene?.addEventListener('agency-audio-event',event);if(bgmGain)bgmGain.gain.value=0;sync(1);}},
  leave(){scene?.removeEventListener('agency-audio-event',event);scene=null;entered=false;music.pause();try{music.currentTime=0;}catch{}stopFX();if(controls)controls.hidden=true;},finish(){api.leave();},
  update(){playback.tick();if(ending&&bgmGain?.gain.value<.001)music.pause();
   const time=scene?.userData.agency?.timeMs;if(Number.isFinite(time)){const dt=lastAmbient===null?0:Math.max(0,Math.min(.1,(time-lastAmbient)/1000));lastAmbient=time;
    if(allowed()&&!ending){ambientAt+=dt;const phase=scene?.userData.seating?.phase;if(ambientAt>=nextTyping&&(!phase||phase==='idle')){cue('typing',{duration:.85,level:.45});nextTyping=ambientAt+9+(counts.typing??0)%4;}}}
  },setVolume(kind,value){const n=Math.max(0,Math.min(1,Number(value)));if(!Number.isFinite(n))return;if(kind==='bgm')bgmVolume=n;else sfxVolume=n;sync();},
  snapshot(){return {...playback.snapshot(),entered,unlocked,muted,paused:paused||isPaused(),ending,bgmPaused:music.paused,bgmTime:music.currentTime,bgmLoop:music.loop,context:context?.state??'locked',bgmVolume,sfxVolume,loaded:[...buffers.keys()],durations:Object.fromEntries([...buffers].map(([k,b])=>[k,b.duration])),counts:{...counts},errors:[...errors],playbackLog:[...playbackLog],voices:voices.size};},
  async dispose(){api.leave();disposed=true;effects.release();playback.dispose();for(const [el,t,fn]of listeners)el.removeEventListener(t,fn);controls?.remove();music.removeAttribute('src');music.load();buffers.clear();await context?.close();}
 };
 for(const kind of ['Bgm','Sfx'])listen(document.getElementById('agency'+kind),'input',e=>api.setVolume(kind.toLowerCase(),e.target.value));listen(document.getElementById('agencyMute'),'change',e=>{muted=e.target.checked;sync();});listen(music,'error',()=>issue('bgm',music.error?.message??'media error'));
 return api;
}
