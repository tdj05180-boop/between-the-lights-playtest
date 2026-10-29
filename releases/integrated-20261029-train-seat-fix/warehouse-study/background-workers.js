import {T,P} from './geometry.js';
import {createCandidateAvatar} from '../src/models/candidate-avatar.js';

export function createBackgroundWorkers(k,world,player){
 const object=new T.Group();object.name='WarehouseBackgroundWorkers';world.add(object);
 const palettes=[[0x92775e,0x76644e,0xe0d4b9,0xd0a585,0x615a4c,0x62666b,0x4a514b],[0xab9876,0x8a795e,0xe6dcc5,0xcba38b,0x393b35,0x747264,0x534f47],[0x728f88,0x546f69,0xe4dac5,0xd9b08f,0x746154,0x786b59,0x4e514a]];
 const workers=palettes.map((palette,i)=>{
  const a=createCandidateAvatar(),skin=a.object.getObjectByName('TailoredHumanContinuousSurfaces');palette.forEach((c,j)=>skin.material[j].color.setHex(c));
  const p=skin.geometry.attributes.position,index=skin.geometry.index,done=new Set();
  for(const group of skin.geometry.groups)for(let n=group.start;n<group.start+group.count;n++){const id=index.getX(n);if(done.has(id))continue;done.add(id);let x=p.getX(id),y=p.getY(id),z=p.getZ(id);if(group.materialIndex===4){if(i===0)y=1.6+(y-1.6)*.75;if(i===1){x*=1.12;z*=1.08;}if(i===2&&y>1.69)y+=.028;}if(y>.9&&y<1.4)x*=i===0?1.08:i===1?.95:1;p.setXYZ(id,x,y,z);}
  skin.geometry.computeVertexNormals();skin.geometry.computeBoundingSphere();a.object.scale.setScalar([1.02,.97,1][i]);a.object.name=['ForkliftAttendant','ShelfChecker','CartPorter'][i];object.add(a.object);return a;
 });
 workers[0].object.position.set(-5, .11,1.8);workers[0].object.rotation.y=-1.1;
 workers[1].object.position.set(-12.8,.11,3.2);workers[1].object.rotation.y=Math.PI/2;
 // Reuse the existing hand cart at its original starting location; route stays in the storage aisle.
 const cart=k.group(-9,0,8.4,object);cart.name='ExistingPackingCart';
 k.box(.8,.07,1.15,P.steel,0,.46,0,cart);const wheels=[];
 for(const dx of [-.32,.32])for(const dz of [-.46,.46]){const w=k.cyl(.1,.06,P.dark,dx,.25,dz,cart);w.rotation.z=Math.PI/2;wheels.push(w);}
 for(const dx of [-.36,.36])k.box(.04,.7,.04,P.frame,dx,.81,.5,cart);k.box(.76,.045,.04,P.frame,0,1.16,.5,cart);
 cart.add(workers[2].object);workers[2].object.position.set(0,.11,1.02);workers[2].object.rotation.y=Math.PI;
 let elapsed=0,cartTime=0,distance=0,blocked=false;
 const bones=a=>Object.fromEntries(a.skeleton.bones.map(b=>[b.name,b]));const shelf=bones(workers[1]),porter=bones(workers[2]);
 const pose=t=>{const phase=t%14;let z,yaw;if(phase<5){z=8.4-phase*.56;yaw=0;}else if(phase<7){z=5.6;yaw=(phase-5)/2*Math.PI;}else if(phase<12){z=5.6+(phase-7)*.56;yaw=Math.PI;}else{z=8.4;yaw=Math.PI+(phase-12)/2*Math.PI;}return {z,yaw};};
 function update(dt){
  if(dt<=0)return;elapsed+=dt;workers[0].update({dt,speed:0});workers[1].update({dt,speed:0});
  shelf.shoulder1.rotation.x=-.45-.22*Math.sin(elapsed*1.25);shelf.elbow1.rotation.x=-.9;shelf.body.rotation.x=.05+.025*Math.sin(elapsed*.6);
  const next=pose(cartTime+dt),workerZ=next.z+Math.cos(next.yaw)*1.02,workerX=-9+Math.sin(next.yaw)*1.02;
  blocked=Math.hypot(player.position.x+9,player.position.z-next.z)<1.45||Math.hypot(player.position.x-workerX,player.position.z-workerZ)<.85;
  if(!blocked){const old=cart.position.z;cartTime+=dt;cart.position.z=next.z;cart.rotation.y=next.yaw;distance+=Math.abs(next.z-old);}
  const moving=!blocked&&(cartTime%14<5||cartTime%14>=7&&cartTime%14<12);workers[2].update({dt,speed:moving?.56:0});
  for(const side of [-1,1]){porter['shoulder'+side].rotation.set(-.64,0,side*.08);porter['elbow'+side].rotation.x=-.68;}porter.body.rotation.x=.09;
  for(const w of wheels)w.rotation.x=distance/.1;
 }
 workers.forEach(a=>a.update({dt:0,speed:0}));
 return {object,update,snapshot:()=>({count:3,elapsed,cartTime,blocked,cart:{x:cart.position.x,z:cart.position.z,yaw:cart.rotation.y},workers:workers.map(a=>({name:a.object.name,position:a.object.getWorldPosition(new T.Vector3()).toArray()}))})};
}
