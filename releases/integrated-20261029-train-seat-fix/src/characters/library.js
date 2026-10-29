import {fitTrainSkirt} from './train-skirt.js';
import * as T from '../vendor/three.module.min.js';
import {prepare,rig} from './adapter.js';
import {attachSeating as heroSeating} from './hero-seated.js';
import {attachSeating as passengerSeating} from './passenger-seated.js';
import {applySleeveFinish} from './professor-finish.js';
import {finishSuit} from './suit-finish.js';
import {finishWalkerFace} from './walker-face.js';
import {bicycleWithRider} from './bicycle.js';
const cache=new Map();let workMask=null,trainWomanMask=null;
export const sceneModels={
 'life-street':['hero2003','woman','man','shopkeeper','professor','cyclist'],
 'warehouse-workflow':['hero2003'],
 'life-office':['hero2019'],
 'life-train':['hero2019','woman','man','elder','grandmother','businesswoman'],
 'life-city':['hero2019'],
 'life-agency':['hero2026','woman','man','elder','professor','grandmother','distantMan','distantWoman','businesswoman','coworker']
};
export const sceneAppearance={'life-street':'hero-2003','warehouse-workflow':'hero-warehouse','life-office':'hero-2019','life-train':'hero-2019','life-city':'hero-2019','life-agency':'hero-2026'};
export async function prepareScene(id){
 if(id==='life-train'&&!trainWomanMask)trainWomanMask=await fetch(new URL('./assets/train-woman-mask.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Train clothing mask unavailable');return r.json();});
 const keys=sceneModels[id];if(!keys)throw Error('No character manifest for '+id);
 await Promise.all(keys.map(async key=>{if(cache.has(key))return;const model=await prepare(new URL('./assets/'+key+'.glb',import.meta.url).href);
  if(!model.animations.length){model.scene.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.pose();});model.scene.updateMatrixWorld(true);model.scene.traverse(n=>{if(n.isSkinnedMesh){n.computeBoundingBox();n.computeBoundingSphere();}});model.animations=[new T.AnimationClip('idle',1,[])];}
  cache.set(key,model);
 }));
 if(id==='warehouse-workflow'&&!workMask)workMask=await fetch(new URL('./assets/work-mask.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Workwear mask unavailable');return r.json();});
}
const heights={woman:1.65,man:1.76,shopkeeper:1.72,professor:1.72,elder:1.72,grandmother:1.58,businesswoman:1.68,coworker:1.75,distantMan:1.76,distantWoman:1.65};
export function character(key,{seated=false,workwear=false}={}){
 const model=cache.get(key);if(!model)throw Error('Character not prepared: '+key);
 let a=rig(model,{height:heights[key]??1.75,workMask:workwear?workMask:null,locomotionPresentation:key.startsWith('hero')});
 if(key==='woman'&&seated)fitTrainSkirt(a,trainWomanMask);
 a.object.name='Character/'+key;a.object.userData.characterId=key;
 if(key==='professor')applySleeveFinish(a);
 if(key==='man')finishWalkerFace(a.object);
 if(key==='hero2026'){a=heroSeating(a);finishSuit(a.object);}
 else if(seated||key==='hero2019')a=passengerSeating(a,{hipHeight:({hero2019:.545,man:.62,woman:.56,elder:.635,grandmother:.615,businesswoman:.575,coworker:.625})[key]??.62});
 return a;
}
export function bicycle(){return bicycleWithRider(cache.get('cyclist'));}
export function characterAssets(){return [...cache.keys()];}

// Called after the new chapter and its player appearance are active. Release old
// GPU textures and decoded images rather than retaining every visited cast.
export function releaseUnused(id){
 const keep=new Set(sceneModels[id]);
 for(const [key,g]of cache){if(keep.has(key))continue;
  const textures=new Set(),materials=new Set(),geometries=new Set();g.scene.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});cache.delete(key);
 }
}
