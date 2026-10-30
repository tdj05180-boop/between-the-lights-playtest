import * as T from '../vendor/three.module.min.js';
import {GLTFLoader} from '../vendor/addons/loaders/GLTFLoader.js';
import {uploadCharacterTextures} from './texture-memory.js';

// A static desk ornament. No skeleton, animation mixer or interaction target.
export async function placeSanjini(view,scope){
 const {scene:model}=await new GLTFLoader().loadAsync(new URL('./assets/sanjini.glb',import.meta.url).href);
 uploadCharacterTextures(model,view.renderer);
 const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const scale=.23/size.y,root=new T.Group();root.name='SanjiniDeskDecoration';
 model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;/* Keep the disposable map out of the renderer-wide shadow material cache. */n.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});n.customDistanceMaterial=new T.MeshDistanceMaterial();}});
 root.add(model);root.position.set(-5.40,.975,-2.72);root.rotation.y=Math.PI;view.world.add(root);
 root.updateMatrixWorld(true);view.scene.userData.sanjini={position:root.position.toArray(),height:.23,bounds:new T.Box3().setFromObject(root)};
 scope.own(()=>{const textures=new Set();model.traverse(n=>{if(!n.isMesh)return;n.geometry.dispose();n.customDepthMaterial?.dispose();n.customDistanceMaterial?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}});textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});root.removeFromParent();});
 return root;
}
