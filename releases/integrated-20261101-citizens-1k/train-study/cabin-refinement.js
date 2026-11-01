import {T} from '../experiments/spaces/kit.js';
import {bevelBox} from '../src/models/pastel-shapes.js';
import {mergeGeometries} from '../src/vendor/BufferGeometryUtils.js';

export function refineCabin(k,room,slidingDoors){
 const stats={sculptedSeatParts:0,vestibules:2,luggage:0};
 const reshaped=new Map();
 room.traverse(n=>{
  if(!n.isMesh||Array.isArray(n.material))return;
  const color=n.material.color.getHex();
  if([0x607f8e,0x809ba8,0x718f9e,0x819ca8].includes(color)&&n.parent!==room){
   n.geometry.computeBoundingBox();const size=n.geometry.boundingBox.getSize(new T.Vector3());
   if(size.x<.3)return;const key=n.geometry.uuid;
   if(!reshaped.has(key)){const g=new T.BufferGeometry().copy(n.geometry),p=g.attributes.position,w=size.x,h=size.y,d=size.z;
    for(let i=0;i<p.count;i++){
     let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const xx=x/(w/2),yy=y/(h/2);
     if(h>.3){x*=.94-.08*Math.max(0,-yy);z+=.028*xx*xx+.018*Math.cos(yy*Math.PI*.72);}
     else if(d>.3){const zz=z/(d/2);y-=.012*(1-xx*xx)*Math.max(0,1-zz*zz);x*=.96+.04*(zz+1)/2;}
     p.setXYZ(i,x,y,z);
    }g.computeVertexNormals();reshaped.set(key,g);
   }n.geometry=reshaped.get(key);stats.sculptedSeatParts++;
  }
 });
 // Individual shell seats, upholstered cushion, matte hand rests: three materials
 // with coherent finish instead of adding details to a single block silhouette.
 const cutDoor=(mesh,w,h,d,holeW,low,high)=>{
  const bottom=mesh.position.y-h/2,top=mesh.position.y+h/2,parts=[],put=(ww,hh,x,y)=>{const g=new T.BoxGeometry(ww,hh,d);g.translate(x,y-mesh.position.y,0);parts.push(g);};
  const rim=(w-holeW)/2;for(const s of [-1,1])put(rim,h,s*(holeW/2+rim/2),mesh.position.y);
  put(holeW,low-bottom,0,(bottom+low)/2);put(holeW,top-high,0,(high+top)/2);mesh.geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());mesh.scale.setScalar(1);
 };
 const glass=new T.MeshStandardMaterial({color:0xa6c6c5,transparent:true,opacity:.18,roughness:.27,metalness:.10,depthWrite:false,side:T.DoubleSide});
 for(const z of [-8,8]){
  const door=room.children.find(n=>n.isMesh&&n.position.x===0&&n.position.y===1.33&&n.position.z===z);
  if(door)cutDoor(door,1.20,2.20,.13,.75,1.24,2.32);
  const pane=room.children.find(n=>n.isMesh&&n.material.color.getHex()===0xa7c1bc&&Math.abs(n.position.z-z)<.15);if(pane){pane.material=glass;pane.castShadow=false;}
  const sign=Math.sign(z),mid=z+sign*.71;
  k.box(1.50,.08,1.45,0x8a9992,0,.20,mid,room);
  k.box(1.50,.10,1.45,0xc9d1c5,0,2.71,mid,room);
  for(const side of [-1,1])k.box(.09,2.5,1.45,0xb3c1b8,side*.72,1.46,mid,room);
  k.box(1.5,2.5,.10,0x738d89,0,1.46,z+sign*1.42,room);
  for(const side of [-1,1])k.box(.035,2.2,.06,0xa9bdb2,side*.48,1.38,z+sign*1.35,room);
  k.box(.84,1.0,.025,0x536e70,0,1.75,z+sign*1.35,room);
  k.box(.6,.035,.30,0xe1ddc6,0,2.61,mid,room);
 }
 for(const door of slidingDoors){
  const body=door.children.find(n=>n.isMesh&&n.position.y===1.32);if(body)cutDoor(body,.57,2.17,.11,.40,1.26,2.24);
  for(const pane of door.children.filter(n=>n.isMesh&&n.material.color.getHex()===0xbacbc1)){pane.material=glass;pane.castShadow=false;}
 }
 for(const bag of [...room.children]){
  if(!bag.isMesh||bag.position.y!==2.51||Math.abs(Math.abs(bag.position.x)-1.60)>.01)continue;
  bag.geometry.computeBoundingBox();const size=bag.geometry.boundingBox.getSize(new T.Vector3());if(size.y<.19||size.z<.5)continue;
  bag.geometry=bevelBox(.35,.21,.55,.055);
  for(const dz of [-.16,.16])k.box(.353,.025,.038,0x536e6a,bag.position.x,2.619,bag.position.z+dz,room);
  k.box(.13,.018,.025,0xb7c4b8,bag.position.x,2.644,bag.position.z,room);stats.luggage++;
 }
 k.world.userData.trainRefinement=stats;
}
