import * as T from '../vendor/three.module.min.js';
// CPU-only construction templates, bounded across chapters. Every caller owns
// its own attribute arrays, so deformation/disposal cannot affect other props.
const bevelTemplates=new Map();let templateBytes=0;
// One bevel segment: keep highlights on edges without subdivision-heavy surfaces.
export function bevelBox(w,h,d,r=.025){
 const b=Math.min(r,w*.18,h*.18,d*.18),key=[w,h,d,b].join('/'),cached=bevelTemplates.get(key);
 if(cached){bevelTemplates.delete(key);bevelTemplates.set(key,cached);return new T.BufferGeometry().copy(cached.geometry);}
 const s=new T.Shape();
 s.moveTo(-w/2+b,-h/2+b);s.lineTo(w/2-b,-h/2+b);s.lineTo(w/2-b,h/2-b);s.lineTo(-w/2+b,h/2-b);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:1,steps:1,curveSegments:1});g.translate(0,0,-d/2+b);g.clearGroups();
 const bytes=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0);
 if(bytes<=2*1024*1024){while(bevelTemplates.size>=128||templateBytes+bytes>2*1024*1024){const first=bevelTemplates.keys().next().value,old=bevelTemplates.get(first);old.geometry.dispose();templateBytes-=old.bytes;bevelTemplates.delete(first);}bevelTemplates.set(key,{geometry:new T.BufferGeometry().copy(g),bytes});templateBytes+=bytes;}
 return g;
}
export function material(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.88,metalness:0,...extra})}
export function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
export function modelMetrics(root){let triangles=0,meshes=0,geometryBytes=0;const seen=new Set();root.traverse(n=>{if(!n.isMesh)return;meshes++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;if(seen.has(n.geometry))return;seen.add(n.geometry);for(const a of Object.values(n.geometry.attributes))geometryBytes+=a.array.byteLength;if(n.geometry.index)geometryBytes+=n.geometry.index.array.byteLength});return {triangles,meshes,geometryBytes};}
