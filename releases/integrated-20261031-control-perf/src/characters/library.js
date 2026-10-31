import {loadStartupBounds,applyStartupBounds} from './startup-bounds.js';
import {fitTrainSkirt} from './train-skirt.js';
import * as T from '../vendor/three.module.min.js';
import {rig} from './adapter.js';
import {GLTFLoader} from '../vendor/addons/loaders/GLTFLoader.js';
import {loadAssetQueue} from './load-queue.js';
import {attachSeating as heroSeating} from './hero-seated.js';
import {attachSeating as passengerSeating} from './passenger-seated.js';
import {applySleeveFinish} from './professor-finish.js';
import {finishSuit} from './suit-finish.js';
import {finishWalkerFace} from './walker-face.js';
import {bicycleWithRider} from './bicycle.js';
import {uploadCharacterTextures} from './texture-memory.js';
const cache=new Map();let workMask=null,trainWomanMask=null;
export const sceneModels={
 'life-street':['hero2003','woman','man','shopkeeper','professor','cyclist'],
 'warehouse-workflow':['hero2003','warehouseInbound','warehouseForklift','warehouseShelf','warehouseCart'],
 'life-office':['hero2019'],
 'life-train':['hero2019','woman','man','elder','grandmother','businesswoman'],
 'life-city':['hero2019'],
 'life-agency':['hero2026','woman','man','elder','professor','grandmother','distantMan','distantWoman','businesswoman','coworker']
};
export const sceneAppearance={'life-street':'hero-2003','warehouse-workflow':'hero-warehouse','life-office':'hero-2019','life-train':'hero-2019','life-city':'hero-2019','life-agency':'hero-2026'};
export async function prepareScene(id,renderer){
 if(id==='life-train'&&!trainWomanMask)trainWomanMask=await fetch(new URL('./assets/train-woman-mask.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Train clothing mask unavailable');return r.json();});
 const keys=sceneModels[id]&&(id==='life-agency'?[...sceneModels[id],'sanjini']:sceneModels[id]);if(!keys)throw Error('No character manifest for '+id);
 // Old scene instances have been disposed by SpaceHost. Retire its templates
 // before decoding the next cast, and avoid ten simultaneous 4K image decodes.
 releaseUnused(id);
 for(const key of keys)if(cache.has(key))uploadCharacterTextures(cache.get(key).scene,renderer);
 const assetRoot=new URL('./assets/',import.meta.url),loader=new GLTFLoader(),bounds=await loadStartupBounds();
 await loadAssetQueue(keys.filter(key=>!cache.has(key)),{
  async fetchBytes(key){const response=await fetch(new URL(key+'.glb',assetRoot));if(!response.ok)throw Error('Character download failed: '+key+' '+response.status);return response.arrayBuffer();},
  decode:async(bytes,key)=>{const gltf=await loader.parseAsync(bytes,assetRoot.href);gltf.boundsApplied=await applyStartupBounds(gltf,key,bytes,bounds);return gltf;},
  consume({scene,animations,boundsApplied},key){
  const model={scene,animations}; // Do not retain GLTFParser's binary/dependency caches.
  if(!model.animations.length){model.scene.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.pose();});model.scene.updateMatrixWorld(true);model.scene.traverse(n=>{if(n.isSkinnedMesh&&!boundsApplied){n.computeBoundingBox();n.computeBoundingSphere();}});model.animations=[new T.AnimationClip('idle',1,[])];}
  uploadCharacterTextures(model.scene,renderer);cache.set(key,model);
 }});
 if(id==='warehouse-workflow'&&!workMask)workMask=await fetch(new URL('./assets/work-mask.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Workwear mask unavailable');return r.json();});
 return id==='life-agency'?cache.get('sanjini'):null;
}
const heights={woman:1.65,man:1.76,shopkeeper:1.72,professor:1.72,elder:1.72,grandmother:1.58,businesswoman:1.68,coworker:1.75,distantMan:1.76,distantWoman:1.65};
export function character(key,{seated=false,workwear=false}={}){
 const model=cache.get(key);if(!model)throw Error('Character not prepared: '+key);
 const worker=key.startsWith('warehouse');
 let a=rig(model,{height:heights[key]??1.75,workMask:workwear?workMask:null,locomotionPresentation:key.startsWith('hero'),shoulderStrength:worker?.94:.78,preserveIdleSway:true,phaseOffset:({woman:1.7,man:5.1,shopkeeper:2.8,professor:8.4,elder:10.5,grandmother:6.2,distantMan:12.1,distantWoman:3.6,warehouseInbound:0,warehouseForklift:3.1,warehouseShelf:7.3,warehouseCart:11.2})[key]??0});
 if(key==='woman'&&seated)fitTrainSkirt(a,trainWomanMask);
 a.object.name='Character/'+key;a.object.userData.characterId=key;
 if(key==='professor')applySleeveFinish(a);
 if(key==='man')finishWalkerFace(a.object);
 if(key==='hero2026'){a=heroSeating(a);finishSuit(a.object);}
 else if(seated||key==='hero2019')a=passengerSeating(a,{hipHeight:({hero2019:.545,man:.62,woman:.56,elder:.635,grandmother:.615,businesswoman:.575,coworker:.625})[key]??.62});
 return a;
}
export function bicycle(){return bicycleWithRider(cache.get('cyclist'));}
export function characterAssets(){return [...cache.keys()].filter(key=>key!=='sanjini');}

// Called after old scene disposal and before loading the next cast. Release old
// GPU textures and decoded images rather than retaining every visited cast.
export function releaseUnused(id){
 const keep=new Set(sceneModels[id]);if(id==='life-agency')keep.add('sanjini');
 for(const [key,g]of cache){if(keep.has(key))continue;
  const textures=new Set(),materials=new Set(),geometries=new Set();g.scene.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});cache.delete(key);
 }
}
