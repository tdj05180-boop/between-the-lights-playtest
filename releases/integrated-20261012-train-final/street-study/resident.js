import * as T from '../src/vendor/three.module.min.js';
import {createCandidateAvatar} from '../src/models/candidate-avatar.js';

// A fresh adapter owns its geometry, palette and skeleton; the player factory stays untouched.
export function createStreetResident(kind='guide'){
 const adapter=createCandidateAvatar(),skin=adapter.object.getObjectByName('TailoredHumanContinuousSurfaces');
 const neighbour=kind==='neighbour';
 const colors=neighbour?[0xab8182,0x825f68,0xe2d4c4,0xdfb99a,0x483d3f,0x655d72,0x60514a,0xc4bea7,0x423e35,0xa97760]:[0x9c8875,0x786654,0xdfd4b9,0xd2ad8c,0x55534c,0x586775,0x655d51,0xc4bea7,0x423e35,0xa97760];
 skin.material.forEach((m,i)=>m.color.setHex(colors[i]));
 const g=skin.geometry,p=g.attributes.position,seen=new Set();
 for(const group of g.groups)for(let k=group.start;k<group.start+group.count;k++){
  const i=g.index.getX(k);if(seen.has(i))continue;seen.add(i);
  let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  // A roomier, shorter casual jacket; keep its cloth patches seated on the same surface.
  if([0,1,2,7].includes(group.materialIndex)&&y>.87&&y<1.39){
   const lower=1-T.MathUtils.smoothstep(y,.92,1.20);x*=1+.10*lower;z*=1+.12*lower;y+=.025*lower;
  }
  // Short, flatter grey hair with an even cropped fringe, instead of the swept cap.
  if(group.materialIndex===4&&y>1.66&&z>.06&&y<1.72)y+=.012;
  if(y>1.70)y-=.020*T.MathUtils.smoothstep(y,1.70,1.83);
  // All face patches follow the same subtle broadening, avoiding floating eyes/mouth.
  if(y>1.40)x*=1.06;
  p.setXYZ(i,x,y,z);
 }
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 // Neighbour: longer plum cardigan, softly rounded side/back hair and a narrower face.
 if(neighbour){
  const done=new Set();for(const group of g.groups)for(let k=group.start;k<group.start+group.count;k++){
   const i=g.index.getX(k);if(done.has(i))continue;done.add(i);let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   if([0,1,2,7].includes(group.materialIndex)&&y>.87&&y<1.39){const t=1-T.MathUtils.smoothstep(y,.93,1.20);y-=.045*t;x*=1-.055*t;}
   if(group.materialIndex===4&&y>1.57){const back=1-T.MathUtils.smoothstep(z,.01,.10),low=1-T.MathUtils.smoothstep(y,1.65,1.77);y-=.047*back*low;x*=1+.09*back;z-=.008*back;}
   if(y>1.4)x*=.90;
   p.setXYZ(i,x,y,z);
  }
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 }
 adapter.object.name=neighbour?'StreetNeighbourIndependent':'StreetResidentIndependent';
 return adapter;
}
