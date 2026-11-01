import * as T from '../src/vendor/three.module.min.js';

// The original tile seams are raised strips (.130-.138). Flatten just those
// colored vertices to a surface detail, below the light but above the floor.
// Normal depth testing can then hide seams without painting over shoes/papers.
export function flattenFloorSeams(world){
 const seam=new T.Color(0x414941);let count=0;
 world.traverse(m=>{
  if(!m.isMesh||m.isSkinnedMesh)return;
  const p=m.geometry.attributes.position,c=m.geometry.attributes.color;
  if(!p||!c||m.name!=='StaticPastelBatch')return;
  let changed=false;
  for(let i=0;i<p.count;i++){
   const y=p.getY(i);
   if(y<.12999||y>.13801||Math.abs(c.getX(i)-seam.r)>1e-6||Math.abs(c.getY(i)-seam.g)>1e-6||Math.abs(c.getZ(i)-seam.b)>1e-6)continue;
   p.setY(i,.1277+(y-.13)*.025);changed=true;count++;
  }
  if(changed){p.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingBox();m.geometry.computeBoundingSphere();}
 });
 return count;
}

// Floor light: floor top .1275, paper top .1415.
// Keep all layers below paper/shoes and use normal depth occlusion.
export function flattenLaser(h){
 const g=h.model;g.position.y=.128;
 for(const [i,m] of g.children.entries()){
  if(i<2){const old=m.geometry;m.geometry=new T.PlaneGeometry(h.width,i===0?h.thickness:.065);old.dispose();m.rotation.x=-Math.PI/2;}
  m.position.y=[.0005,.0008,.0002,0][i];
  m.material.depthTest=true;m.castShadow=false;m.receiveShadow=false;
 }
}

// Select a small set of actual shoe vertices once. Runtime samples the skinned
// surface, so ankle height is never mistaken for the sole or a 24cm hit volume.
export function createSoleSampler(avatar){
 let mesh=null,ids=[],groups=[],point=new T.Vector3();
 function prepare(m){
  mesh=m;ids=[];groups=[];m.updateWorldMatrix(true,false);m.skeleton.update();
  const si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;
  for(const side of ['Left','Right']){
   const vertices=[];
   for(let i=0;i<si.count;i++){
    let w=0;for(let k=0;k<4;k++)if(new RegExp(side+'(Foot|Toe)').test(m.skeleton.bones[si.array[i*4+k]].name))w+=sw.array[i*4+k];
    if(w>.5)vertices.push({id:i,p:m.getVertexPosition(i,new T.Vector3())});
   }
   if(!vertices.length)continue;
   // Directional extrema cover heel, toe and side edges, including rotation.
   const chosen=new Set();
   for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
    if(!x&&!y&&!z)continue;let best=-Infinity,id=0;
    for(const v of vertices){const dot=v.p.x*x+v.p.y*y+v.p.z*z;if(dot>best){best=dot;id=v.id;}}
    chosen.add(id);
   }
   groups.push({side,ids:[...chosen]});ids.push(...chosen);
  }
 }
 return ()=>{
  const current=avatar.getObjectByProperty('isSkinnedMesh',true);
  if(!current)throw Error('Office sole sampler: character mesh missing');
  if(current!==mesh)prepare(current);
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();let y=Infinity;
  const feet=groups.map(g=>({side:g.side,points:g.ids.map(id=>{mesh.getVertexPosition(id,point);mesh.localToWorld(point);y=Math.min(y,point.y);return {x:point.x,y:point.y,z:point.z};})}));
  if(!Number.isFinite(y))throw Error('Office sole sampler: shoe vertices missing');
  return {y,vertices:ids.length,feet};
 };
}

export function laserTopY(h){
 h.model.updateWorldMatrix(true,true);let top=-Infinity;const p=new T.Vector3();
 for(const m of h.model.children){
  if(!m.isMesh||m.material.transparent)continue;
  if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
   p.set(x,y,z).applyMatrix4(m.matrixWorld);top=Math.max(top,p.y);
  }
 }
 return top;
}
