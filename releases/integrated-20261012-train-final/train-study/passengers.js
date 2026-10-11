import {T,C} from '../experiments/spaces/kit.js';
import {createCandidateAvatar} from '../src/models/candidate-avatar.js';
import {polishPassenger} from './passenger-model.js';
// Independent geometry/materials, existing skeleton. The player's appearance is never edited.
export function passenger(k,{x,z,shirt,hair,kind,scale=1}){
 const a=createCandidateAvatar(),skin=a.object.getObjectByName('TailoredHumanContinuousSurfaces');
 polishPassenger(a,kind,hair);
 a.object.scale.set(kind==='elder'?1.03:.98,scale,1);a.object.position.set(x,.11,z);k.world.add(a.object);k.dynamic.add(a.object);
 const bones=Object.fromEntries(a.skeleton.bones.map(b=>[b.name,b])),head=bones.head,root=bones.body;
 // Passenger-specific fit measured against seat top .6055 and floor top .20.
 const fit={reader:[.260707,1.120742],phone:[.231499,1.215137],elder:[.264293,1.162009],window:[.274790,1.068929],rest:[.226509,1.229834]}[kind];
 const hands=[new T.Vector3(),new T.Vector3()],propCenter=new T.Vector3();
 let prop;if(kind==='phone'||kind==='reader'){
  prop=new T.Group();root.add(prop);prop.position.set(0,1.04,.36);prop.rotation.x=-.42;
  if(kind==='phone'){k.box(.12,.21,.015,0x374950,0,0,0,prop);k.box(.095,.17,.004,0xb3cace,0,0,.011,prop);}else{k.box(.34,.025,.25,0x927b66,0,0,0,prop);k.box(.30,.018,.22,0xeee5cf,0,.02,0,prop);k.box(.012,.024,.22,0xb9aa8e,0,.025,0,prop);}
 }
 return {adapter:a,kind,x,z,update(t){
  seatPose(a,t,kind);a.object.position.y=fit[0];
  for(const side of [-1,1]){
   bones['hip'+side].rotation.x=-fit[1];bones['knee'+side].rotation.x=fit[1];
   const phone=kind==='phone',reader=kind==='reader';
   bones['shoulder'+side].rotation.set(phone?-.40:reader?-.30:-.16,0,-side*(phone?.43:reader?.22:.25));
   bones['elbow'+side].rotation.set(phone?-1.20:reader?-1.22:-.95,0,0);
  }
  head.rotation.y=kind==='window'?-.48:kind==='elder'?.14:0;
  a.object.updateMatrixWorld(true);
  if(prop){
   [-1,1].forEach((side,i)=>{hands[i].set(0,-.277,.008);bones['elbow'+side].localToWorld(hands[i]);});
   propCenter.copy(hands[0]).add(hands[1]).multiplyScalar(.5);root.worldToLocal(propCenter);
   prop.position.copy(propCenter);prop.position.y+=kind==='reader'?.012:.035;prop.rotation.x=kind==='reader'?-.18:-.42;
  }
 },root:a.object};
}
export function seatPose(a,t,kind='hero'){
 const b=Object.fromEntries(a.skeleton.bones.map(b=>[b.name,b]));
 b.body.position.y=-.265;b.body.rotation.set(kind==='elder'?.035:0,0,Math.sin(t*.75)*.002);
 for(const side of [-1,1]){b['hip'+side].rotation.set(-1.30,0,side*.025);b['knee'+side].rotation.set(1.30,0,0);b['foot'+side].rotation.set(0,0,0);// Keep the forearms inside and above the armrest, with hands resting forward.
  // The phone pose already clears the fixed seat; the shorter passengers need more lift.
  const phone=kind==='phone';
  b['shoulder'+side].rotation.set(phone?-.48:-.65,0,phone?side*.045:-side*.27);
  b['elbow'+side].rotation.set(phone?-1.12:kind==='reader'?-1.15:-1.20,0,0);}
 b.head.rotation.x=kind==='phone'?.19:kind==='reader'?.13:0;b.head.rotation.y=kind==='hero'?-.48+Math.sin(t*.38)*.025:0;
 a.object.updateMatrixWorld(true);
}
