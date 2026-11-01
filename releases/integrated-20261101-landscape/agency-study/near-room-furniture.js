import * as T from '../src/vendor/three.module.min.js';
import {roomBuilder} from '../src/models/visible-interiors.js';

// Static, upper-storey scenery only. Keep the completed physical suite layout
// and all existing furniture; fill readable near rooms, never distant LODs.
export function furnishNearSuites(layout,{x,z,seed}){
 const report={eligible:0,added:0,boxes:0,placements:[]};
 if(Math.hypot(x+4,z+5)>75)return report;
 const root=layout.root;root.updateWorldMatrix(true,true);
 const inv=root.matrixWorld.clone().invert(),occupied=[];
 for(const room of layout.rooms){
  const furniture=room.getObjectByName('UpperFurniture');
  if(furniture?.children.length)occupied.push(new T.Box3().setFromObject(furniture).applyMatrix4(inv));
 }
 // Keep the central approach to every existing internal door unobstructed.
 const doors=[];root.traverse(n=>{
  if(n.name!=='ClosedInteriorDoor')return;
  const bb=new T.Box3().setFromObject(n).applyMatrix4(inv),s=bb.getSize(new T.Vector3());
  bb.expandByVector(s.x<s.z?new T.Vector3(.65,0,.10):new T.Vector3(.10,0,.65));doors.push(bb);
 });
 const mats=new Map();
 for(const [storey,level]of root.userData.plans.entries()){
  if(level.ceiling< -4||level.floor>9)continue;
  for(const cell of level.cells){
   if(!cell.state.lit)continue;
   const views=layout.rooms.filter(r=>r.userData.suite.storey===storey&&r.userData.suite.id===cell.id&&r.userData.visibleRoom?.mode!==0);
   // Only rooms with an unblinded opening facing the office receive new detail.
   const visible=views.filter(r=>{
    const p=r.getWorldPosition(new T.Vector3()),n=new T.Vector3(0,0,1).transformDirection(r.matrixWorld);
    return n.dot(new T.Vector3(-4-p.x,0,-5-p.z))>1;
   });
   if(!visible.length)continue;report.eligible++;
   const home=visible.every(r=>r.userData.visibleRoom?.mode===2);
   const furnished=views.some(r=>r.getObjectByName('UpperFurniture')?.children.length);
   const group=new T.Group();group.name='NearSuiteFurnishing';root.add(group);
   const box=roomBuilder(group,{night:true}).box;
   if(furnished){
    // Storage with a few closed file boxes: an occupied room, not a second desk.
    box(.88,1.12,.36,0x8c958d,0,.56,0);
    box(.92,.055,.40,0xb1ac99,0,1.15,0);
    box(.025,1.06,.025,0x56625d,0,.57,.194);
    box(.09,.025,.025,0x454f4c,-.12,.69,.204);
    box(.09,.025,.025,0x454f4c,.12,.69,.204);
    box(.26,.23,.25,0x777d71,-.22,1.29,0);
    box(.20,.18,.24,0xa19a85,.12,1.265,0);
   }else if(home){
    box(1.28,.26,.64,0x66736c,0,.40,0);
    box(1.28,.56,.14,0x69786e,0,.72,-.27);
    for(const side of [-1,1]){box(.12,.36,.64,0x586860,side*.61,.57,0);box(.10,.25,.10,0x424a45,side*.47,.125,.20);}
    box(.50,.055,.42,0xaba28a,.10,.43,.73);
    box(.10,.40,.10,0x666d64,.10,.20,.73);
   }else{
    // A complete compact workstation. Screen is subdued; no extra light source.
    box(1.20,.065,.58,0xb4ab96,0,.755,0);
    for(const side of [-1,1])box(.065,.72,.46,0x5d6964,side*.52,.36,0);
    box(.40,.29,.045,0x3c4947,0,1.03,-.15);
    box(.035,.12,.035,0x55605a,0,.83,-.15);
    box(.23,.022,.15,0x55605a,0,.795,-.15);
    box(.35,.025,.13,0x52625c,0,.80,.13);
    box(.45,.10,.43,0x53665f,.08,.47,.70);
    box(.43,.42,.075,0x596d65,.08,.72,.89);
    box(.07,.40,.07,0x48534f,.08,.20,.70);
    box(.48,.055,.43,0x48534f,.08,.045,.70);
   }
   group.updateMatrixWorld(true);
   const localBounds=new T.Box3().setFromObject(group).applyMatrix4(inv);
   const candidates=[];
   for(const rotation of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const rotated=localBounds.clone().applyMatrix4(new T.Matrix4().makeRotationY(rotation));
    for(const fx of [.22,.78,.5])for(const fz of [.22,.78,.5]){
     const px=T.MathUtils.lerp(cell.x0+.25-rotated.min.x,cell.x1-.25-rotated.max.x,fx);
     const pz=T.MathUtils.lerp(cell.z0+.25-rotated.min.z,cell.z1-.25-rotated.max.z,fz);
     const bb=rotated.clone().translate(new T.Vector3(px,level.floor,pz));
     if(bb.min.x<cell.x0+.24||bb.max.x>cell.x1-.24||bb.min.z<cell.z0+.24||bb.max.z>cell.z1-.24||bb.max.y>level.ceiling-.12)continue;
     const padded=bb.clone().expandByVector(new T.Vector3(.12,0,.12));
     if([...occupied,...doors].some(b=>b.intersectsBox(padded)))continue;
     const centre=bb.getCenter(new T.Vector3());
     const distance=Math.min(...visible.map(r=>{const p=root.worldToLocal(r.getWorldPosition(new T.Vector3()));return Math.hypot(p.x-centre.x,p.z-centre.z);}));
     candidates.push({px,pz,rotation,bb,distance});
    }
   }
   candidates.sort((a,b)=>a.distance-b.distance);
   const chosen=candidates[0];
   if(!chosen){group.removeFromParent();continue;}
   group.position.set(chosen.px,level.floor,chosen.pz);group.rotation.y=chosen.rotation;
   group.userData.suite={...cell,storey};
   group.traverse(n=>{if(!n.isMesh)return;const c=n.material.color.clone().multiplyScalar(cell.state.strength);if(cell.state.warm)c.multiply(new T.Color(1,.94,.79));const key=c.getHex();if(!mats.has(key))mats.set(key,new T.MeshBasicMaterial({color:c}));n.material=mats.get(key);n.userData.roomSurface=true;report.boxes++;});
   occupied.push(chosen.bb);report.added++;
   report.placements.push({storey,suite:cell.id,kind:furnished?'storage':home?'lounge':'workstation',bounds:{min:chosen.bb.min.toArray(),max:chosen.bb.max.toArray()},cell:{x0:cell.x0,x1:cell.x1,z0:cell.z0,z1:cell.z1},floor:level.floor,ceiling:level.ceiling});
  }
 }
 return report;
}
