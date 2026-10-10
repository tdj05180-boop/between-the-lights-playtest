import {createTrainAudio} from '../train-study/audio.js';
import {createOfficeAudio} from '../office-study/audio.js';
import {createWarehouseAudio} from '../warehouse-study/audio.js';
import {createAudio} from '../src/audio.js';
import {createStreetAudio} from './audio.js';
import {createSeoulAudio} from '../seoul-study/audio.js?v=seoul-audio-start-20261011';
export function createChapterAudio(isPaused,isStarted,getView){
 let current=null,ended=false,handoff=false,handoffEnd=0,muted=false,unlocked=false;
 const playing=()=>isStarted()&&!handoff;
 const office=createOfficeAudio(isPaused,playing,getView),warehouse=createWarehouseAudio(isPaused,playing,getView),street=createStreetAudio(isPaused,playing,getView),seoul=createSeoulAudio(isPaused,playing,getView);
 const train=createTrainAudio(isPaused,playing,getView);
 const all=[office,warehouse,street,seoul,train],legacy=createAudio(isPaused,isStarted,{musicActive:()=>!isStarted()&&!ended});
 const active=()=>!isStarted()?legacy:current==='office'?office:current==='warehouse'?warehouse:current==='street'?street:current==='seoul'?seoul:current==='train'?train:current==='legacy'?legacy:null;
 const ui=()=>{document.getElementById('soundBtn').disabled=false;if(!isStarted()){document.getElementById('soundState').textContent=unlocked&&!muted?'ON':'OFF';document.getElementById('soundBtn').setAttribute('aria-label',unlocked&&!muted?'소리 끄기':'소리 켜기');}};
 function applyMute(){for(const a of [...all,legacy]){if(a.snapshot().unlocked&&a.snapshot().muted!==muted)a.toggle();}}
 function unlockMenu(e){if(isStarted()||unlocked||e.target.closest?.('#soundBtn'))return;unlocked=true;legacy.start();muted=legacy.snapshot().muted;ui();}
 document.addEventListener('pointerdown',unlockMenu,{capture:true});document.addEventListener('keydown',unlockMenu,{capture:true});
 function setting(e){const id=e.target.id??'';if(/^(street|warehouse|office|seoul|train)(Bgm|Sfx)$/.test(id)){const kind=id.endsWith('Bgm')?'bgm':'sfx';for(const a of [...all,legacy])a.setVolume(kind,e.target.value);}if(/^(street|warehouse|office|seoul|train)Mute$/.test(id)){muted=e.target.checked;applyMute();}}
 document.addEventListener('input',setting);document.addEventListener('change',setting);
 window.officeAudioStatus=office.snapshot;window.warehouseAudioStatus=warehouse.snapshot;window.streetAudioStatus=street.snapshot;window.seoulAudioStatus=seoul.snapshot;
 window.trainAudioStatus=train.snapshot;
 window.chapterAudioStatus=()=>({route:!isStarted()?'menu':current,handoff,menu:legacy.snapshot(),fov:getView()?.camera.fov});
 return {tone(...args){active()?.tone(...args);},chime(...args){active()?.chime(...args);},
  start(){unlocked=true;legacy.start();handoff=true;handoffEnd=legacy.snapshot().time+1;legacy.fadeMusic(0,1);legacy.pause(isPaused());for(const a of all)a.start();applyMute();ui();},
  toggle(){if(!isStarted()){legacy.toggle();unlocked=true;muted=legacy.snapshot().muted;}else{muted=!muted;applyMute();}ui();},
  pause(value){for(const a of all)a.pause(value);legacy.pause(value||(!handoff&&isStarted()&&current!=='legacy'));ui();},
  enter(id){ended=false;current=id==='warehouse-workflow'?'warehouse':id==='life-street'?'street':id==='life-office'?'office':id==='life-city'?'seoul':id==='life-train'?'train':'legacy';for(const a of all)a.enter(id);legacy.pause(isStarted()&&!handoff&&current!=='legacy'||isPaused());ui();},
  leave(){current=null;for(const a of all)a.leave();if(isStarted()&&!handoff)legacy.pause(true);},
  finish(){ended=true;current=null;for(const a of all)a.finish();legacy.pause(true);},
  update(){if(handoff&&legacy.snapshot().time>=handoffEnd){handoff=false;legacy.fadeMusic(0,0);legacy.pause(current!=='legacy'||isPaused());for(const a of all)a.pause(isPaused());}active()?.update?.();},
  async dispose(){current=null;ended=true;document.removeEventListener('pointerdown',unlockMenu,true);document.removeEventListener('keydown',unlockMenu,true);document.removeEventListener('input',setting);document.removeEventListener('change',setting);legacy.dispose();for(const a of all)await a.dispose();}
 };
}
