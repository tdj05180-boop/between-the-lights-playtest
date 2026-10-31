import {sceneModels} from './library.js';
import {createEncodedWarmup} from './encoded-warmup.js';
const order=['life-street','warehouse-workflow','life-office','life-train','life-city','life-agency'];
export function nextSceneAssets(id){
 const i=order.indexOf(id),next=i>=0?order[i+1]:null;if(!next)return [];
 const current=new Set(sceneModels[id]),urls=sceneModels[next].filter(key=>!current.has(key)).map(key=>new URL('./assets/'+key+'.glb',import.meta.url));
 if(next==='warehouse-workflow')urls.push(new URL('./assets/work-mask.json',import.meta.url));
 if(next==='life-train')urls.push(new URL('./assets/train-woman-mask.json',import.meta.url));
 if(next==='life-agency')urls.unshift(new URL('../../agency-study/assets/night-interiors-v1.bin.gz',import.meta.url),new URL('./assets/sanjini.glb',import.meta.url));
 return urls;
}
export function warmNextScene(id,scope){const warmup=createEncodedWarmup(nextSceneAssets(id));scope.own(()=>warmup.dispose());return warmup;}
