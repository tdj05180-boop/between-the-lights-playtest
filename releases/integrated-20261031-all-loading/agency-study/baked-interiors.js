import * as T from '../src/vendor/three.module.min.js';
import {nightGlassMaterial} from './night-glass.js';

// Exact, precomputed static scenery. No texture resampling, quantization or LOD.
// Array views share one scene-owned buffer; no decoded city cache survives exit.
const types={Float32Array,Uint16Array,Uint32Array};
export function readInteriorBake(buffer){
 const bytes=new DataView(buffer);
 if(buffer.byteLength<8||bytes.getUint32(0,true)!==0x31494c42)throw Error('Invalid interior bake');
 const length=bytes.getUint32(4,true),offset=8+Math.ceil(length/4)*4;
 if(offset>buffer.byteLength)throw Error('Truncated interior bake');
 const data=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,8,length)));
 if(data.version!==1||!Array.isArray(data.meshes))throw Error('Unsupported interior bake');
 for(const mesh of data.meshes){
  if(!['solid','glass'].includes(mesh.material))throw Error('Invalid baked material');
  for(const a of [...Object.values(mesh.attributes),...(mesh.index?[mesh.index]:[])]){
   const Type=types[a.type];
   if(!Type||!Number.isInteger(a.offset)||a.offset<0||a.offset%4||!Number.isInteger(a.length)||a.length<0||offset+a.offset+a.length*Type.BYTES_PER_ELEMENT>buffer.byteLength)throw Error('Invalid baked buffer');
  }
 }
 return {data,buffer,offset};
}
export async function loadInteriorBake(){
 // Older browsers retain the approved procedural fallback instead of failing.
 if(typeof DecompressionStream==='undefined')return null;
 try{
  const response=await fetch(new URL('./assets/night-interiors-v1.bin.gz',import.meta.url));
  if(!response.ok)throw Error('HTTP '+response.status);
  const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  return readInteriorBake(buffer);
 }catch(error){console.warn('2026 interior cache unavailable; using procedural scenery:',error.message);return null;}
}
export function bakedNightInteriors(world,bake){
 return {
  building(){return {window(){},shop(){},finish(){}};},
  finish(){
   const materials={solid:new T.MeshBasicMaterial({vertexColors:true}),glass:nightGlassMaterial()};
   const attribute=a=>new T.BufferAttribute(new types[a.type](bake.buffer,bake.offset+a.offset,a.length),a.itemSize,a.normalized);
   for(const entry of bake.data.meshes){
    const geometry=new T.BufferGeometry();
    for(const [name,a]of Object.entries(entry.attributes))geometry.setAttribute(name,attribute(a));
    if(entry.index)geometry.setIndex(attribute(entry.index));
    if(entry.bounds){geometry.boundingBox=new T.Box3(new T.Vector3().fromArray(entry.bounds.min),new T.Vector3().fromArray(entry.bounds.max));geometry.boundingSphere=new T.Sphere(new T.Vector3().fromArray(entry.bounds.center),entry.bounds.radius);}
    const mesh=new T.Mesh(geometry,materials[entry.material]);mesh.name=entry.name;
    mesh.matrix.fromArray(entry.matrix);mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);
    mesh.castShadow=entry.castShadow;mesh.receiveShadow=entry.receiveShadow;mesh.renderOrder=entry.renderOrder;
    world.add(mesh);
   }
   const report=structuredClone(bake.data.report);world.userData.nightInteriors=report;return report;
  }
 };
}
