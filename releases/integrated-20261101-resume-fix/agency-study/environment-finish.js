import {T} from '../experiments/spaces/kit.js';

export function finishAgency(k){
 const report={chairSupports:4,sharedFurnitureMaps:2,plantStems:0,plantLeaves:0,lightMounts:6};
 // Two indoor planters only. Outdoor trees, planter bodies and collision boxes
 // are retained. Folded blades share one opaque, double-sided geometry.
 const leaf=new T.BufferGeometry(),vertices=[],indices=[];
 for(let j=0;j<=8;j++){
  const t=j/8,width=Math.sin(Math.PI*t)*.071,curve=.04*Math.sin(Math.PI*t)-.06*t*t;
  vertices.push(-width,t*.32,curve,0,t*.32,curve+.014*Math.sin(Math.PI*t),width,t*.32,curve);
  if(j<8)for(let a=0;a<2;a++){const i=j*3+a;indices.push(i,i+3,i+1,i+1,i+3,i+4);}
 }
 leaf.setAttribute('position',new T.Float32BufferAttribute(vertices,3));leaf.setIndex(indices);leaf.computeVertexNormals();
 const leafMats=[0x89a693,0x739580].map(color=>new T.MeshStandardMaterial({color,roughness:.76,side:T.DoubleSide}));
 for(const [px,pz] of [[-1.7,2.3],[1.45,-5.1]]){
  const crowns=k.world.children.filter(n=>!n.isInstancedMesh&&n.geometry?.type==='IcosahedronGeometry'&&Math.abs(n.position.x-px)<.25&&Math.abs(n.position.z-pz)<.25&&n.position.y>.6&&n.position.y<1.3);
  for(const [i,n] of crowns.entries()){
   const node=n.position.clone();n.geometry.dispose();n.removeFromParent();
   const bottom=new T.Vector3(px,.56,pz),top=node.clone().add(new T.Vector3(0,.20,0)),dir=top.clone().sub(bottom);
   const stem=new T.Mesh(new T.CylinderGeometry(.008,.013,dir.length(),7),k.mat(0x506f58));stem.position.copy(bottom.clone().add(top).multiplyScalar(.5));stem.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());stem.castShadow=true;k.world.add(stem);report.plantStems++;
   for(let j=0;j<5;j++){
    const a=i*2.1+j*2.4,along=.36+j*.115,origin=bottom.clone().lerp(top,along),direction=new T.Vector3(Math.sin(a)*.66,.72,Math.cos(a)*.66).normalize();
    const m=new T.Mesh(leaf,leafMats[(i+j)%2]);m.position.copy(origin);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);m.scale.setScalar(.78+j*.045);m.castShadow=m.receiveShadow=true;k.world.add(m);report.plantLeaves++;
   }
  }
 }
 // Join each existing ceiling housing to the ceiling underside (Y=4.42).
 for(const x of [-4,0,4])for(const z of [-3,2])k.box(1.54,.04,.38,0x677b7b,x,4.403,z).castShadow=false;
 k.world.userData.agencyFinish=report;
}
