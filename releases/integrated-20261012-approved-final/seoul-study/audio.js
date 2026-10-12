const FILES={bgm:'soulprodmusic-night-city-143869.mp3',ambience:'mixkit-city-traffic-background-ambience-2930.wav',pass:'mixkit-passing-car-and-urban-ambience-1554.wav',collect:'mixkit-fairy-arcade-sparkle-866.wav',hit:'mixkit-small-hit-in-a-game-2072.wav',knock:'mixkit-knocking-on-a-thick-wooden-door-197.wav',success:'mixkit-correct-answer-tone-2870.wav',fail:'mixkit-wrong-answer-fail-notification-946.wav',complete:'mixkit-completion-of-a-level-2063.wav'};
export function createSeoulAudio(isPaused,isStarted,getView){
 const $=id=>document.getElementById(id),url=n=>new URL('./audio/'+FILES[n],import.meta.url).href;
 let context,master,musicGain,fxGain,ambientGain,entered=false,unlocked=false,muted=false,paused=false,ending=false,disposed=false,scene=null,bgmVolume=.24,sfxVolume=.65,lastPass=-Infinity,lastHit=0,lastAttempt=0,completed=false;
 const music=new Audio(url('bgm')),ambience=new Audio(url('ambience'));music.loop=ambience.loop=true;music.preload=ambience.preload='metadata';
 const buffers=new Map(),voices=new Map(),seen=new Set(),previous=new Map(),counts=Object.fromEntries(Object.keys(FILES).filter(n=>n!=='bgm').map(n=>[n,0])),errors=[],listeners=[];
 const base=$('warehouseAudioSettings'),controls=base?.cloneNode(true);if(controls){controls.id='seoulAudioSettings';controls.querySelector('legend').textContent='서울 거리 소리';for(const n of controls.querySelectorAll('[id]'))n.id=n.id.replace('warehouse','seoul');base.before(controls);controls.hidden=true;}
 const allowed=()=>entered&&!disposed&&unlocked&&isStarted()&&!paused&&!isPaused()&&!document.hidden&&!muted;
 // A bounded, chronological log survives pause/scene changes for device diagnosis.
 const playbackLog=[];let sequence=0,primed=false,resumePending=false,revision=0;
 function record(event,details={}){const entry={sequence:++sequence,event,atMs:Math.round(performance.now()),entered,paused,hidden:document.hidden,context:context?.state??'locked',...details};playbackLog.push(entry);if(playbackLog.length>100)playbackLog.shift();return entry;}
 function mediaState(a){return {readyState:a.readyState,networkState:a.networkState,mediaPaused:a.paused,mediaTime:a.currentTime};}
 function issue(n,e,reason='resource'){const entry=record('failure',{name:n,reason,errorName:e?.name??'Error',message:String(e?.message??e),...(['bgm','ambience'].includes(n)?mediaState(n==='bgm'?music:ambience):{})});errors.push(entry);if(errors.length>50)errors.shift();console.warn('[Seoul audio]',entry);}
 function resumeContext(reason){if(!context||context.state==='running'||resumePending)return;resumePending=true;record('resume-request',{reason});context.resume().then(()=>record('resume-ok',{reason})).catch(e=>issue('resume',e,reason)).finally(()=>{resumePending=false;});}

 function ramp(node,v,sec=.1){if(!node)return;const t=context.currentTime;node.gain.cancelScheduledValues(t);node.gain.setValueAtTime(node.gain.value,t);node.gain.linearRampToValueAtTime(v,t+sec);}
 function ui(){if(!entered)return;$('soundState').textContent=unlocked&&!muted?'ON':'OFF';$('soundBtn').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');if(controls){$('seoulMute').checked=muted;for(const [k,v]of [['Bgm',bgmVolume],['Sfx',sfxVolume]]){$('seoul'+k).value=v;$('seoul'+k+'Value').textContent=Math.round(v*100)+'%';}}}
 function stop(){for(const v of voices.values())try{v.source.stop();}catch{}voices.clear();}
 function init(){if(context)return;const C=window.AudioContext||window.webkitAudioContext;if(!C){issue('support','Web Audio unavailable');return;}context=new C();master=context.createGain();master.connect(context.destination);musicGain=context.createGain();musicGain.gain.value=0;musicGain.connect(master);fxGain=context.createGain();fxGain.connect(master);ambientGain=context.createGain();ambientGain.gain.value=0;ambientGain.connect(fxGain);context.createMediaElementSource(music).connect(musicGain);context.createMediaElementSource(ambience).connect(ambientGain);
  for(const n of Object.keys(FILES).filter(n=>!['bgm','ambience'].includes(n)))fetch(url(n)).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer();}).then(b=>context.decodeAudioData(b)).then(b=>{if(!disposed)buffers.set(n,b);}).catch(e=>issue(n,e));
 }
 const pending=new Set();
 function play(media,name,reason){
  if(!media.paused||pending.has(media))return;pending.add(media);const requestedRevision=revision;record('play-request',{name,reason,...mediaState(media)});
  // Call play in the original gesture, not inside the resume() promise callback.
  let request;try{request=media.play();}catch(e){request=Promise.reject(e);}
  Promise.resolve(request).then(()=>{record('play-ok',{name,reason,...mediaState(media)});if(name==='ambience'&&allowed())counts.ambience++;})
   .catch(e=>issue(name,e,reason)).finally(()=>{pending.delete(media);if(!allowed()||ending)media.pause();if(!allowed()&&!pending.size)context.suspend().catch(e=>issue('suspend',e,reason));else if(allowed()&&!ending&&media.paused&&revision!==requestedRevision){resumeContext('state-reconcile');play(media,name,'state-reconcile');}});
 }
 function sync(fade=.15,reason='sync'){
  revision++;ui();if(!context)return;record('sync',{reason});ramp(master,muted?0:1);ramp(fxGain,sfxVolume);ramp(musicGain,ending?0:bgmVolume*.65,fade);ramp(ambientGain,ending?0:.12,fade);
  if(!allowed()||ending){music.pause();ambience.pause();if(!pending.size)context.suspend().catch(e=>issue('suspend',e,reason));return;}
  resumeContext(reason);play(music,'bgm',reason);play(ambience,'ambience',reason);
 }
 function prime(){
  if(!context||primed)return;primed=true;
  // Unlock these exact media elements during Start; graph gains keep future chapter audio silent.
  musicGain.gain.cancelScheduledValues(context.currentTime);musicGain.gain.value=0;ambientGain.gain.cancelScheduledValues(context.currentTime);ambientGain.gain.value=0;
  resumeContext('start-gesture');play(music,'bgm','start-gesture');play(ambience,'ambience','start-gesture');
 }
 function recoverGesture(e){if(!e.isTrusted||!allowed()||ending)return;if(context?.state!=='running'||music.paused||ambience.paused)sync(.3,'gesture-retry:'+e.type);}
 function cue(n,level=1){if(!allowed()||!buffers.has(n))return;const old=voices.get(n);if(old)try{old.source.stop();}catch{}if(!old&&voices.size>=4){if(n==='pass')return;const key=voices.has('pass')?'pass':voices.keys().next().value;const victim=voices.get(key);try{victim.source.stop();}catch{}voices.delete(key);}
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(n);gain.gain.value=({pass:.22,collect:.65,hit:.65,knock:.55,success:.48,fail:.24,complete:.5}[n]??.4)*level;source.connect(gain);gain.connect(fxGain);const voice={source,gain};voices.set(n,voice);source.onended=()=>{if(voices.get(n)===voice)voices.delete(n);source.disconnect();gain.disconnect();};if(n==='pass')source.start(0,4,Math.min(2,source.buffer.duration-4));else source.start();counts[n]++;
 }
 function event(e){const a=e.detail;
  if(a.type==='start'){seen.clear();lastHit=lastAttempt=0;completed=false;}
  if(a.type==='collect'&&!seen.has(a.id)){seen.add(a.id);cue('collect');}
  if(a.type==='hit'&&a.hits>lastHit){lastHit=a.hits;cue('hit');}
  if(a.type==='knock'&&a.attempts>lastAttempt){lastAttempt=a.attempts;cue('knock');cue(a.success?'success':'fail');}
  if(a.type==='complete'&&!completed){completed=true;cue('complete');ending=true;ramp(musicGain,0,1);ramp(ambientGain,0,1);}
 }
 const api={tone(){},chime(){},start(){unlocked=true;paused=isPaused();init();prime();},toggle(){if(!unlocked){unlocked=true;muted=false;init();}else muted=!muted;if(muted)stop();sync(.15,'toggle');},pause(value){paused=value;sync(value?.08:.3,value?'pause':'resume');},
  enter(id){api.leave();entered=id==='life-city';ending=false;seen.clear();previous.clear();lastHit=lastAttempt=0;completed=false;lastPass=-Infinity;if(controls)controls.hidden=!entered;if(entered){scene=getView()?.scene;scene?.addEventListener('seoul-audio-event',event);if(context)musicGain.gain.value=0;sync(1,'chapter-enter');}},
  leave(){revision++;scene?.removeEventListener('seoul-audio-event',event);scene=null;entered=false;stop();music.pause();ambience.pause();for(const a of [music,ambience])try{a.currentTime=0;}catch{}if(controls)controls.hidden=true;},finish(){api.leave();},
  update(){if(!entered||!context)return;if(ending){if(musicGain.gain.value<.001){music.pause();ambience.pause();}return;}if(!allowed())return;const v=getView(),p=v?.avatar?.position;if(!p)return;for(const c of v.features?.cars??[]){const old=previous.get(c.id),dx=c.x-p.x,dz=Math.abs(c.z-p.z);previous.set(c.id,dx);if(old!==undefined&&old*dx<=0&&Math.abs(old-dx)<8&&dz<7&&context.currentTime-lastPass>1.5&&!voices.has('pass')){lastPass=context.currentTime;cue('pass',1-dz/9);}}},
  setVolume(kind,value){const n=Math.max(0,Math.min(1,Number(value)));if(!Number.isFinite(n))return;if(kind==='bgm')bgmVolume=n;else sfxVolume=n;sync();},
  snapshot(){return {entered,unlocked,muted,paused:paused||isPaused(),ending,context:context?.state??'locked',bgmPaused:music.paused,bgmTime:music.currentTime,bgmDuration:music.duration,bgmLoop:music.loop,ambienceTime:ambience.currentTime,ambiencePaused:ambience.paused,ambienceLoop:ambience.loop,bgmVolume,sfxVolume,musicGain:musicGain?.gain.value,voices:voices.size,loaded:[...buffers.keys()],counts:{...counts},errors:[...errors],playbackLog:[...playbackLog],pendingPlays:pending.size,media:{bgm:mediaState(music),ambience:mediaState(ambience)}};},
  async dispose(){api.leave();disposed=true;for(const [el,t,fn]of listeners)el.removeEventListener(t,fn);controls?.remove();for(const a of [music,ambience]){a.removeAttribute('src');a.load();}buffers.clear();await context?.close();}
 };
 function listen(el,t,fn){if(el){el.addEventListener(t,fn);listeners.push([el,t,fn]);}}
 for(const type of ['pointerup','touchend','keydown'])listen(document,type,recoverGesture);
 for(const kind of ['Bgm','Sfx'])listen($('seoul'+kind),'input',e=>api.setVolume(kind.toLowerCase(),e.target.value));listen($('seoulMute'),'change',e=>{muted=e.target.checked;if(muted)stop();sync();});for(const [a,n]of [[music,'bgm'],[ambience,'ambience']])listen(a,'error',()=>issue(n,a.error?.message??'media error'));
 return api;
}
