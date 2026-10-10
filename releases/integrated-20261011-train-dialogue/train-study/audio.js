// Uses the same Start gesture + context recovery and common volume routing as chapter audio.
const FILES={bgm:'alexgrohl-new-chapter-the-inspiring-hopeful-piano-460669.mp3',ambience:'mixkit-train-passenger-passing-by-rattle-1636.wav',door:'mixkit-train-door-close-1638.wav'};
export function createTrainAudio(isPaused,isStarted,getView){
 let context,master,musicGain,sfxGain,entered=false,unlocked=false,muted=false,paused=false,disposed=false,resuming=false,bgmVolume=.24,sfxVolume=.65;
 const buffers=new Map(),voices=new Map(),counts={bgm:0,ambience:0,door:0},fired=new Set(),errors=[],log=[],listeners=[];let seq=0;
 const raw=Object.fromEntries(Object.entries(FILES).map(([name,file])=>[name,fetch(new URL('./audio/'+file,import.meta.url)).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer();}).catch(e=>{issue(name,e);return null;})]));
 const allowed=()=>entered&&unlocked&&!paused&&!isPaused()&&!document.hidden&&isStarted()&&!disposed;
 const state=()=>getView()?.features?.cutscene;
 function record(event,detail={}){log.push({sequence:++seq,event,atMs:Math.round(performance.now()),context:context?.state??'locked',...detail});if(log.length>80)log.shift();}
 function issue(name,e){const error={name,message:String(e?.message??e),errorName:e?.name??'Error'};errors.push(error);if(errors.length>30)errors.shift();record('failure',error);console.warn('[Train audio]',error);}
 function ramp(node,value,seconds=.05){if(!node)return;const t=context.currentTime;node.gain.cancelScheduledValues(t);node.gain.setValueAtTime(node.gain.value,t);node.gain.linearRampToValueAtTime(value,t+seconds);}
 function resume(reason){if(!context||context.state==='running'||resuming)return;resuming=true;record('resume-request',{reason});context.resume().then(()=>record('resume-ok',{reason})).catch(e=>issue('resume',e)).finally(()=>{resuming=false;if(!allowed())context.suspend().catch(e=>issue('suspend',e));});}
 function init(){if(context)return;const A=window.AudioContext||window.webkitAudioContext;if(!A){issue('support','Web Audio unavailable');return;}context=new A();master=context.createGain();master.gain.value=0;master.connect(context.destination);musicGain=context.createGain();musicGain.connect(master);sfxGain=context.createGain();sfxGain.connect(master);
  for(const name of Object.keys(FILES))raw[name].then(bytes=>bytes&&context.decodeAudioData(bytes)).then(buffer=>{if(buffer&&!disposed){buffers.set(name,buffer);record('decoded',{name,duration:buffer.duration});}}).catch(e=>issue(name,e));
 }
 function stop(){for(const v of voices.values())try{v.source.stop();}catch{}voices.clear();}
 function play(name,offset,level){if(voices.has(name)||!buffers.has(name)||context.state!=='running')return;const buffer=buffers.get(name);if(offset>=buffer.duration)return;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=level;source.connect(gain);gain.connect(name==='bgm'?musicGain:sfxGain);const voice={source,gain,offset};voices.set(name,voice);source.onended=()=>{if(voices.get(name)===voice)voices.delete(name);source.disconnect();gain.disconnect();};
  try{source.start(0,Math.max(0,offset));if(!fired.has(name)){counts[name]++;fired.add(name);}record('play',{name,offset});}catch(e){voices.delete(name);issue(name,e);}
 }
 function ui(){if(!entered)return;document.getElementById('soundState').textContent=unlocked&&!muted?'ON':'OFF';document.getElementById('soundBtn').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');if(controls){document.getElementById('trainMute').checked=muted;for(const [k,v]of [['Bgm',bgmVolume],['Sfx',sfxVolume]]){document.getElementById('train'+k).value=v;document.getElementById('train'+k+'Value').textContent=Math.round(v*100)+'%';}}}
 function sync(){ui();if(!context)return;if(!allowed()){stop();context.suspend().catch(e=>issue('suspend',e));return;}resume('active');const s=state();if(!s)return;const t=s.timeMs/1000,envelope=Math.min(Math.min(1,t/1.1),Math.max(0,(15-t)/1.5));ramp(master,muted?0:1);ramp(musicGain,bgmVolume*1.05*envelope);ramp(sfxGain,sfxVolume);
  play('bgm',t,1);play('ambience',t,.14*envelope);const ambient=voices.get('ambience');if(ambient)ramp(ambient.gain,.14*envelope);if(t>=.18&&t<.18+(buffers.get('door')?.duration??0))play('door',t-.18,.38);
 }
 const base=document.getElementById('warehouseAudioSettings'),controls=base?.cloneNode(true);if(controls){controls.id='trainAudioSettings';controls.querySelector('legend').textContent='서울행 기차 소리';for(const n of controls.querySelectorAll('[id]'))n.id=n.id.replace('warehouse','train');base.before(controls);controls.hidden=true;}
 const listen=(el,type,fn)=>{el?.addEventListener(type,fn);if(el)listeners.push([el,type,fn]);};
 for(const type of ['pointerup','touchend','keydown'])listen(document,type,e=>{if(e.isTrusted&&allowed()&&context?.state!=='running')resume('gesture-retry:'+type);});
 const api={tone(){},chime(){},start(){unlocked=true;paused=isPaused();init();resume('start-gesture');},toggle(){if(!unlocked){unlocked=true;init();resume('sound-gesture');}else muted=!muted;sync();},
  enter(id){api.leave();entered=id==='life-train';if(entered){fired.clear();for(const n in counts)counts[n]=0;}if(controls)controls.hidden=!entered;if(entered){record('enter');sync();}},
  leave(){entered=false;stop();if(context)context.suspend().catch(e=>issue('suspend',e));if(controls)controls.hidden=true;},finish(){api.leave();},
  pause(value){paused=value;record(value?'pause':'resume');sync();},update:sync,
  setVolume(kind,value){const n=Math.max(0,Math.min(1,Number(value)));if(!Number.isFinite(n))return;if(kind==='bgm')bgmVolume=n;else sfxVolume=n;sync();},
  snapshot(){return {entered,unlocked,muted,paused:paused||isPaused(),context:context?.state??'locked',timeMs:state()?.timeMs??0,bgmVolume,sfxVolume,musicGain:musicGain?.gain.value,voices:[...voices.keys()],counts:{...counts},loaded:[...buffers.keys()],errors:[...errors],playbackLog:[...log],decodedBytes:[...buffers.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0)};},
  async dispose(){disposed=true;api.leave();for(const [el,t,fn]of listeners)el.removeEventListener(t,fn);controls?.remove();buffers.clear();await context?.close();}
 };
 for(const kind of ['Bgm','Sfx'])listen(document.getElementById('train'+kind),'input',e=>api.setVolume(kind.toLowerCase(),e.target.value));listen(document.getElementById('trainMute'),'change',e=>{muted=e.target.checked;sync();});return api;
}
