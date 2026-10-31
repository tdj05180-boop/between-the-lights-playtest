import * as T from '../vendor/three.module.min.js';
let metadata;
export function loadStartupBounds(){
 return metadata??=fetch(new URL('./assets/model-bounds.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).catch(()=>null);
}
// A stale/missing cache falls back to the existing exact runtime calculation.
export async function applyStartupBounds(gltf,key,bytes,data){
 const entry=data?.version===1&&data.models[key];if(!entry||!globalThis.crypto?.subtle)return false;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');if(hash!==entry.sha256)return false;
 const meshes=[];gltf.scene.traverse(n=>{if(n.isSkinnedMesh)meshes.push(n);});
 if(meshes.length!==entry.meshes.length||meshes.some((m,i)=>m.geometry.attributes.position.count!==entry.meshes[i].vertices))return false;
 for(let i=0;i<meshes.length;i++){const m=meshes[i],b=entry.meshes[i];m.boundingBox=new T.Box3(new T.Vector3().fromArray(b.min),new T.Vector3().fromArray(b.max));m.boundingSphere=new T.Sphere(new T.Vector3().fromArray(b.center),b.radius);}
 return true;
}
