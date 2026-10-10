import {T,C} from '../experiments/spaces/kit.js';
import {createCandidateAvatar} from '../src/models/candidate-avatar.js';
// Independent geometry/materials, existing skeleton. The player's appearance is never edited.
export function passenger(k,{x,z,shirt,hair,kind,scale=1}){
 const a=createCandidateAvatar(),skin=a.object.getObjectByName('TailoredHumanContinuousSurfaces');
 skin.material[0].color.setHex(shirt);skin.material[1].color.setHex(shirt).multiplyScalar(.75);skin.material[4].color.setHex(hair);skin.material[5].color.setHex(kind==='reader'?0x76696c:0x626c74);
 const p=a.geometry.attributes.position,seen=new Set();for(const group of a.geometry.groups)for(let j=group.start;j<group.start+group.count;j++){
  const i=a.geometry.index.getX(j);if(seen.has(i))continue;seen.add(i);let xx=p.getX(i),y=p.getY(i),zz=p.getZ(i);
  if(group.materialIndex===4){const back=1-T.MathUtils.smoothstep(zz,.02,.12),low=1-T.MathUtils.smoothstep(y,1.64,1.78);if(kind==='reader'||kind==='window')y-=.15*back*low;else if(kind==='elder')y-=.035*T.MathUtils.smoothstep(y,1.67,1.84);else y+=.024*T.MathUtils.smoothstep(y,1.65,1.84);}
  if(y>1.4)xx*=kind==='reader'?.94:kind==='elder'?1.05:1;
  p.setXYZ(i,xx,y,zz);
 }p.needsUpdate=true;a.geometry.computeVertexNormals();a.geometry.computeBoundingSphere();
 a.object.scale.set(kind==='elder'?1.03:.98,scale,1);a.object.position.set(x,.11,z);k.world.add(a.object);k.dynamic.add(a.object);
 const head=a.skeleton.bones.find(b=>b.name==='head'),root=a.skeleton.bones.find(b=>b.name==='body');
 let prop;if(kind==='phone'||kind==='reader'){
  prop=new T.Group();root.add(prop);prop.position.set(0,1.04,.36);prop.rotation.x=-.42;
  if(kind==='phone'){k.box(.12,.21,.015,0x374950,0,0,0,prop);k.box(.095,.17,.004,0xb3cace,0,0,.011,prop);}else{k.box(.34,.025,.25,0x927b66,0,0,0,prop);k.box(.30,.018,.22,0xeee5cf,0,.02,0,prop);k.box(.012,.024,.22,0xb9aa8e,0,.025,0,prop);}
 }
 return {adapter:a,kind,x,z,update(t){seatPose(a,t,kind);head.rotation.y=kind==='window'?-.48:kind==='elder'?.14:0;},root:a.object};
}
export function seatPose(a,t,kind='hero'){
 const b=Object.fromEntries(a.skeleton.bones.map(b=>[b.name,b]));
 b.body.position.y=-.265;b.body.rotation.set(kind==='elder'?.035:0,0,Math.sin(t*.75)*.002);
 for(const side of [-1,1]){b['hip'+side].rotation.set(-1.30,0,side*.025);b['knee'+side].rotation.set(1.30,0,0);b['foot'+side].rotation.set(0,0,0);b['shoulder'+side].rotation.set(kind==='phone'||kind==='reader'?-.48:-.20,0,side*.045);b['elbow'+side].rotation.set(kind==='phone'||kind==='reader'?-1.12:-.72,0,0);}
 b.head.rotation.x=kind==='phone'?.19:kind==='reader'?.13:0;b.head.rotation.y=kind==='hero'?-.48+Math.sin(t*.38)*.025:0;
 a.object.updateMatrixWorld(true);
}
