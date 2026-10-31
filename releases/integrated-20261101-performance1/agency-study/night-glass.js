import * as T from '../src/vendor/three.module.min.js';
import {mergeGeometries} from '../src/vendor/BufferGeometryUtils.js';
import {interiorGlass} from '../src/models/visible-interiors.js';
import {nightDarkSurfaceGLSL} from './night-window-surface.js';

// One spatially batched material retains the existing shop glass shader (-1).
// Upper panes carry their physical suite's state: 0 dark, 1 occupied.
// This is a cheap night-surface approximation, not a reflected-scene render.
export function nightGlassMaterial(){
 const material=interiorGlass(true).clone();
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute float nightState; varying float vNightState; varying vec3 vNightNormal; varying vec3 vNightView; varying vec2 vNightSurfaceUV;\n'+shader.vertexShader
   .replace('#include <project_vertex>','#include <project_vertex>\nvNightState=nightState; vNightNormal=normalMatrix*normal; vNightView=-mvPosition.xyz; vNightSurfaceUV=uv;');
  shader.fragmentShader='varying float vNightState; varying vec3 vNightNormal; varying vec3 vNightView; varying vec2 vNightSurfaceUV;\n'+nightDarkSurfaceGLSL+shader.fragmentShader
   .replace('#include <opaque_fragment>',`
    // Outside views are dominated by exterior reflection when the room is dark.
    // From inside, retain the ordinary glass so the brighter outdoors stays visible.
    if(vNightState>=0.0 && gl_FrontFacing){
     float grazing=pow(1.0-abs(dot(normalize(vNightNormal),normalize(vNightView))),3.0);
     if(vNightState<0.5){
      // A dim cool surface dominates an unlit room. No fake interior windows.
      outgoingLight=nightDarkSurface(grazing,vNightSurfaceUV.y);
      diffuseColor.a=mix(0.94,0.985,grazing);
     }else{
      // Bright interior remains legible; oblique glass is slightly less clear.
      diffuseColor.a=mix(0.045,0.17,grazing);
     }
    }
    #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=> 'agency-night-glass-v2';
 return material;
}

export function batchNightGlass(root){
 root.updateMatrixWorld(true);
 const inv=root.matrixWorld.clone().invert(),buckets=new Map(),material=nightGlassMaterial();
 root.traverse(n=>{
  if(!n.isMesh||n.isInstancedMesh||n.material!==interiorGlass(true))return;
  const p=n.getWorldPosition(new T.Vector3()),key=[Math.floor(p.x/14),Math.floor(p.z/14)].join('/');
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(n);
 });
 for(const nodes of buckets.values()){
  const gs=nodes.map(n=>{
   const clone=n.geometry.clone();clone.applyMatrix4(inv.clone().multiply(n.matrixWorld));
   const g=clone.index?clone.toNonIndexed():clone;if(g!==clone)clone.dispose();
   g.setAttribute('nightState',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(n.userData.nightState??-1),1));
   return g;
  });
  const mesh=new T.Mesh(mergeGeometries(gs),material);mesh.name='InteriorGlassBatch';root.add(mesh);
  gs.forEach(g=>g.dispose());nodes.forEach(n=>n.removeFromParent());
 }
}
