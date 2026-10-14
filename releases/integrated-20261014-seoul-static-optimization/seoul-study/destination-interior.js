import * as T from '../src/vendor/three.module.min.js';
import {facadeShell,interiorGlass,addUpperRoom,roomBuilder} from '../src/models/visible-interiors.js';

// The interaction building is authored directly in world, unlike the other
// parcels. Give its existing panes real openings without moving the doorway.
export function openDestinationInterior(world){
 const x=8.2,z=-15,w=6.8,d=7,front=z+d/2;
 const size=n=>{n.geometry.computeBoundingBox();return n.geometry.boundingBox.getSize(new T.Vector3()).multiply(n.scale);};
 const near=(a,b)=>Math.abs(a-b)<.002;
 const all=world.children.filter(n=>n.isMesh&&!n.isInstancedMesh);
 const panes=all.filter(n=>{const s=size(n);return near(n.position.z,front+.055)&&near(s.x,1.9)&&near(s.y,2.7)||near(n.position.z,front+.065)&&n.position.x>x-w/2&&n.position.x<x+w/2&&near(s.x,1.34)&&near(s.y,1.26);});
 // Ground panes of this building only (adjacent parcels are nested groups).
 const own=panes.filter(n=>Math.abs(n.position.x-x)<w/2);
 for(const body of all){
  const s=size(body),p=body.position;
  if(!near(p.z,z)||Math.abs(p.x-x)>2.4||s.z<6.99||s.z>7.01)continue;
  const wing=near(s.x,2.3)&&near(s.y,3.15),upper=near(s.x,w)&&s.y>3.15;
  if(!wing&&!upper)continue;
  const cuts=own.filter(n=>Math.abs(n.position.x-p.x)<s.x/2&&n.position.y>p.y-s.y/2&&n.position.y<p.y+s.y/2).map(n=>{const q=size(n);return {side:0,a:n.position.x-p.x-q.x/2,b:n.position.x-p.x+q.x/2,low:n.position.y-q.y/2,high:n.position.y+q.y/2};});
  // The two old solid wings are now one lobby. Keep their external walls, but
  // do not accidentally turn the sides facing the entrance into partitions.
  if(wing)cuts.push({side:p.x<x?1:3,a:-d/2,b:d/2,low:p.y-s.y/2,high:p.y+s.y/2});
  const g=facadeShell(s.x,s.y,s.z,p.y-s.y/2,cuts);g.translate(0,-p.y,0);body.geometry=g;body.scale.setScalar(1);
 }
 const door=all.find(n=>near(n.position.x,x)&&near(n.position.z,front-.695)&&near(size(n).x,1.64));
 const backing=all.find(n=>near(n.position.x,x)&&near(n.position.z,front-.78)&&near(size(n).x,1.96)&&near(size(n).y,2.76));
 if(backing){
  const {box}=roomBuilder(world),p=backing.position;
  // A real border replaces the solid slab previously hidden behind the glass.
  for(const sign of [-1,1])box(.16,2.76,.13,0x344d56,x+sign*.90,p.y,p.z);
  for(const sign of [-1,1])box(1.64,.165,.13,0x344d56,x,p.y+sign*1.2975,p.z);
  backing.removeFromParent();
 }
 for(const [i,pane]of [...own,...(door?[door]:[])].entries()){
  const s=size(pane);pane.geometry=new T.PlaneGeometry(s.x,s.y);pane.scale.setScalar(1);pane.material=interiorGlass();pane.castShadow=pane.receiveShadow=false;
  if(pane.position.y>3.05){const holder=new T.Group();holder.position.copy(pane.position);holder.position.z-=.045;world.add(holder);addUpperRoom(holder,{width:s.x,height:s.y,depth:1.25,mode:i%3===0?0:1,variant:i});}
 }
 const room=new T.Group();room.name='SeoulDestinationInterior';room.position.set(x,.21,front-.08);world.add(room);
 const {box:b}=roomBuilder(room),width=6.36,depth=2.75,height=2.78;
 b(width,.08,depth,0xb3b7ac,0,-.04,-depth/2);b(width,.08,depth,0xd9d7c8,0,height,-depth/2);
 b(width,height,.10,0xc2c9bd,0,height/2,-depth);
 for(const side of [-1,1])b(.10,height,depth,0xc2c9bd,side*width/2,height/2,-depth/2);
 // Reception and waiting area flank the existing central vestibule/entry aisle.
 b(1.45,.80,.58,0x929e91,-1.96,.40,-1.65,.018);b(1.52,.07,.66,0xc6bca4,-1.96,.835,-1.65,.018);
 for(let i=0;i<3;i++)b(.30,.018,.22,0xe2dfcc,-1.95,.89+i*.02,-1.60);
 b(1.38,.16,.52,0x8c9d95,1.85,.44,-1.78,.025);b(1.38,.48,.10,0x8c9d95,1.85,.73,-2.01,.025);
 for(const sx of [-.52,.52])b(.045,.36,.40,0x61766d,1.85+sx,.18,-1.78);
 b(1.12,.74,.05,0x80978e,-1.90,1.78,-depth+.08);b(1.02,.64,.012,0xcdd3c2,-1.90,1.78,-depth+.113);
 for(let i=0;i<3;i++)b(.24,.31,.01,0xe3decb,-2.23+i*.33,1.78,-depth+.126);
 b(1.1,.055,.24,0xaab8ad,0,height-.05,-1.60);
 world.userData.destinationInterior={panes:own.length+(door?1:0),upperRooms:own.filter(n=>n.position.y>3.05).length,door:[x,1.58,front-.695],entryPreserved:true};
}
