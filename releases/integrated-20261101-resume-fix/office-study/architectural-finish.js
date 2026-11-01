import {T} from '../experiments/spaces/kit.js';
import {mergeGeometries} from '../src/vendor/BufferGeometryUtils.js';

// A restrained older office: fitted joinery, recessed windows, inset wall panels.
// Exit/vestibule, cables, dark monitors and all game/collision data are untouched.
export function refineOfficeArchitecture(k){
 const {world,box}=k,stats={recessedWindows:0,wallPanels:0,deskPedestals:0};
 const inside=0x59665e,trim=0x455851;
 world.updateMatrixWorld(true);
 for(const side of [-1,1]){
  // Continuous wall layers sit behind the actual cabinet rear envelope.
  // Keep furniture/collision coordinates and the exterior wall face unchanged.
  const cabinets=world.children.filter(n=>n.name.startsWith('2019-cabinet-')&&Math.sign(n.position.x)===side);
  const rear=Math.max(5.915,...cabinets.map(n=>{const b=new T.Box3().setFromObject(n,true);return side<0?-b.min.x:b.max.x;}));
  const trimFront=rear+.010,wallFace=trimFront+.060,wallOuter=6.11;
  const x=side*6,wall=world.children.find(n=>n.isMesh&&Math.abs(n.position.x-x)<.001&&n.position.y===2.21&&n.position.z===0);
  if(wall){const parts=[],put=(h,d,y,z)=>{const g=new T.BoxGeometry(wallOuter-wallFace,h,d);g.translate(side*((wallOuter+wallFace)/2-6),y-2.21,z);parts.push(g);};
   put(2.225,15,1.2225,0);put(.785,15,3.9175,0);let prev=-7.5;for(const z of [-2.4,2.2]){put(1.15,z-1-prev,2.95,(prev+z-1)/2);prev=z+1;}put(1.15,7.5-prev,2.95,(prev+7.5)/2);wall.geometry=mergeGeometries(parts);wall.scale.setScalar(1);parts.forEach(g=>g.dispose());
  }
  const skirting=world.children.find(n=>n.isMesh&&Math.abs(n.position.x-x)<.001&&n.position.y===.21&&n.position.z===0);
  if(skirting){skirting.geometry=new T.BoxGeometry(.060,.16,15);skirting.scale.setScalar(1);skirting.position.x=side*(trimFront+.030);}
  for(const z of [-2.4,2.2]){
   // Old dark flat backplate becomes a shallow exterior recess behind the blind.
   const plate=world.children.find(n=>n.isMesh&&Math.abs(n.position.x-side*5.86)<.001&&Math.abs(n.position.y-2.95)<.001&&Math.abs(n.position.z-z)<.001);
   if(plate)plate.removeFromParent();
   box(.10,1.30,2.18,0x344c50,side*6.72,2.95,z);
   for(const dz of [-1.04,1.04])box(.90,1.30,.07,inside,side*6.3,2.95,z+dz);
   for(const y of [2.34,3.57])box(.90,.07,2.1,inside,side*6.3,y,z);
   stats.recessedWindows++;
  }
  // Full-length moulding continues behind freestanding cabinets, never clipped.
  // Panel backs meet the wall; trim overlaps the panel face for a supported joint.
  box(.035,1.13,14.65,0x637268,side*(wallFace-.0175),.805,0);
  box(.045,.055,14.7,0x899084,side*(trimFront+.0225),1.40,0);
  for(let z=-6.6;z<7;z+=1.65)box(.04,1.07,.018,0x4e6057,side*(wallFace-.039),.81,z);
  stats.wallPanels++;
 }
 // Original desks remain at the same heights. A narrow paper pedestal occupies
 // only the existing leg area opposite the PC, leaving both chair and wires free.
 for(const desk of world.children.filter(n=>n.name.startsWith('2019-desk-'))){
  const s=desk.position.x<0?1:-1,x=s*.83;
  box(.36,.65,.48,0x716d5d,x,.49,-.01,desk);
  for(let j=0;j<3;j++){box(.346,.178,.025,0x8b826d,x,.30+j*.195,.244,desk);box(.13,.024,.025,0x4d5b54,x,.325+j*.195,.271,desk);}
  for(const dx of [-.13,.13])box(.045,.035,.38,trim,x+dx,.1525,-.01,desk);
  stats.deskPedestals++;
 }
 world.userData.officeArchitecture=stats;
}
