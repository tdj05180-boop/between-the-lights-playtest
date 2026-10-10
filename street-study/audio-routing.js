import {createOfficeAudio} from '../office-study/audio.js';
import {createWarehouseAudio} from '../warehouse-study/audio.js';
import {createAudio} from '../src/audio.js';
import {createStreetAudio} from './audio.js';

// Entry-only routing; both existing audio implementations remain unchanged.
// Street and warehouse use exclusive chapter routes. Later legacy audio stays unchanged.
export function createChapterAudio(isPaused,isStarted,getView){
 let current=null,ended=false;
 const office=createOfficeAudio(isPaused,isStarted,getView);
 const warehouse=createWarehouseAudio(isPaused,isStarted,getView);
 const street=createStreetAudio(isPaused,isStarted,getView);
 const legacy=createAudio(()=>isPaused()||current!=='legacy'||ended,isStarted);
 const active=()=>current==='office'?office:current==='warehouse'?warehouse:current==='street'?street:current==='legacy'?legacy:null;
 const ui=()=>{document.getElementById('soundBtn').disabled=!current;if(!current)document.getElementById('soundState').textContent='OFF';};
 window.officeAudioStatus=office.snapshot;
 window.warehouseAudioStatus=warehouse.snapshot;
 window.streetAudioStatus=street.snapshot;
 window.chapterAudioStatus=()=>({route:current,fov:getView()?.camera.fov});
 return {
  tone(...args){active()?.tone(...args);},chime(...args){active()?.chime(...args);},
  start(){warehouse.start();legacy.start();legacy.pause(current!=='legacy'||isPaused());street.start();office.start();ui();},
  toggle(){active()?.toggle();},pause(value){warehouse.pause(value);legacy.pause(value||current!=='legacy');street.pause(value);office.pause(value);ui();},
  enter(id){ended=false;current=id==='warehouse-workflow'?'warehouse':id==='life-street'?'street':id==='life-office'?'office':'legacy';warehouse.enter(id);street.enter(id);office.enter(id);legacy.pause(current!=='legacy'||isPaused());ui();},
  leave(){current=null;street.leave();warehouse.leave();office.leave();legacy.pause(true);},
  finish(){ended=true;current=null;street.finish();warehouse.finish();office.finish();legacy.pause(true);},
  update(){active()?.update?.();},
  async dispose(){current=null;ended=true;legacy.pause(true);await street.dispose();await warehouse.dispose();await office.dispose();}
 };
}
