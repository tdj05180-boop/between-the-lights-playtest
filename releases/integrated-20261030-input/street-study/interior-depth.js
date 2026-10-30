import * as T from '../src/vendor/three.module.min.js';
import {addShopRoom,addUpperRoom,facadeShell,interiorGlass} from '../src/models/visible-interiors.js';

export function openNeighbourInterior(parent,b,shop,type,doorX){
 // The older neighbourhood has timber fittings, modest inventory and mixed
 // residential upper floors. It does not inherit Seoul's contemporary facade.
 const body=parent.children.find(n=>n.isMesh&&n.position.y>2&&n.geometry&&(()=>{n.geometry.computeBoundingBox();const s=n.geometry.boundingBox.getSize(new T.Vector3()).multiply(n.scale);return Math.abs(s.x-b.w)<.05&&Math.abs(s.z-b.d)<.05&&s.y>3;})());
 if(!body)return;
 body.geometry.computeBoundingBox();const size=body.geometry.boundingBox.getSize(new T.Vector3()).multiply(body.scale),base=body.position.y-size.y/2;
 const openings=[{side:0,a:-(b.w-.78)/2,b:(b.w-.78)/2,low:.22,high:2.36}];
 const windows=[];parent.traverse(n=>{if(n.name==='2003-upper-glazing')windows.push(n);});
 parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert();
 for(const [i,pane]of windows.entries()){
  const holder=pane.parent,rel=inverse.clone().multiply(holder.matrixWorld),pos=new T.Vector3().setFromMatrixPosition(rel),rot=new T.Quaternion().setFromRotationMatrix(rel),normal=new T.Vector3(0,0,1).applyQuaternion(rot);
  const side=(Math.round(Math.atan2(normal.x,normal.z)/(Math.PI/2))+4)%4,u=side===0?pos.x:side===2?-pos.x:side===1?-pos.z:pos.z;
  pane.geometry.computeBoundingBox();const sz=pane.geometry.boundingBox.getSize(new T.Vector3()).multiply(pane.scale);
  openings.push({side,a:u-sz.x/2,b:u+sz.x/2,low:pos.y-sz.y/2,high:pos.y+sz.y/2});
  // Remove the old solid trim backing; the four surrounding sash pieces remain.
  const backing=holder.children[0];if(backing!==pane)backing.removeFromParent();
  pane.geometry=new T.PlaneGeometry(sz.x,sz.y);pane.scale.setScalar(1);pane.material=interiorGlass();pane.castShadow=pane.receiveShadow=false;
  const room=addUpperRoom(holder,{width:sz.x,height:sz.y,depth:i%3===0?.25:1.12,mode:i%3===0?0:2,variant:i*7+Math.round(parent.position.x*3+parent.position.z*5)});room.position.z=-.03;
 }
 const shell=facadeShell(b.w,size.y,b.d,base,openings);shell.translate(-body.position.x,-body.position.y,-body.position.z);body.geometry=shell;body.scale.setScalar(1);
 const room=addShopRoom(shop,{width:b.w-.78,height:2.10,depth:2.35,floor:.22,doorX,type,variant:Math.round(Math.abs(parent.position.x)),era:2003,name:b.sign});room.position.z=.06;
 for(const pane of shop.children.filter(n=>n.name==='2003-connected-neighbour-glass')){
  pane.geometry.computeBoundingBox();const sz=pane.geometry.boundingBox.getSize(new T.Vector3()).multiply(pane.scale);pane.geometry=new T.PlaneGeometry(sz.x,sz.y);pane.scale.setScalar(1);pane.material=interiorGlass();pane.castShadow=pane.receiveShadow=false;
 }
}

export function openMainInterior(world,b,index){
 const type=({0:0,1:1,3:5,4:10})[index],base=.11;
 const body=world.children.find(n=>n.isMesh&&Math.abs(n.position.x-b.x)<.001&&Math.abs(n.position.z+3)<.001&&Math.abs(n.position.y-(b.h/2+.11))<.001);
 if(!body)return;
 body.userData.mainInterior={...b,index};
 const shell=facadeShell(b.w,b.h,4,base,[{side:0,a:-b.w/2+.34,b:b.w/2-.34,low:.25,high:2.43}]);shell.translate(0,-body.position.y,0);body.geometry=shell;body.scale.setScalar(1);
 const holder=new T.Group();holder.position.set(b.x,0,-.94);world.add(holder);
 addShopRoom(holder,{width:b.w-.68,height:2.12,depth:2.35,floor:.25,doorX:b.w/2-.83,type,era:2003,name:b.sign,variant:index});
 for(const pane of world.children.filter(n=>n.name==='2003-connected-shop-glass'&&Math.abs(n.position.x-b.x)<b.w/2)){
  pane.geometry.computeBoundingBox();const sz=pane.geometry.boundingBox.getSize(new T.Vector3()).multiply(pane.scale);pane.geometry=new T.PlaneGeometry(sz.x,sz.y);pane.scale.setScalar(1);pane.material=interiorGlass();pane.castShadow=pane.receiveShadow=false;
 }
}

export function finishMainUpperRooms(world){
 for(const body of world.children.filter(n=>n.userData.mainInterior)){
  const b=body.userData.mainInterior,cuts=b.hero?[]:[{side:0,a:-b.w/2+.34,b:b.w/2-.34,low:.25,high:2.43}];
  const panes=world.children.filter(n=>n.isMesh&&!Array.isArray(n.material)&&n.material.color?.getHex()===0x809f9d&&n.position.y>3&&Math.abs(n.position.x-b.x)<b.w/2+.2&&n.position.z<-.70&&n.position.z>-5.3);
  for(const [i,pane]of panes.entries()){
   pane.geometry.computeBoundingBox();const s=pane.geometry.boundingBox.getSize(new T.Vector3()).multiply(pane.scale),side=s.x<s.z?(pane.position.x<b.x?3:1):(pane.position.z<-4?2:0),w=side%2?s.z:s.x,h=s.y;
   const u=side===0?pane.position.x-b.x:side===2?b.x-pane.position.x:side===1?-(pane.position.z+3):pane.position.z+3;
   cuts.push({side,a:u-w/2,b:u+w/2,low:pane.position.y-h/2,high:pane.position.y+h/2});
   for(const old of [...world.children]){
    if(old===pane||!old.isMesh||!old.material.color||old.material.color.getHex()!==0xf1e6cf||Math.abs(old.position.y-pane.position.y)>.02)continue;
    old.geometry.computeBoundingBox();const os=old.geometry.boundingBox.getSize(new T.Vector3()).multiply(old.scale);
    if((side%2?Math.abs(old.position.z-pane.position.z)<.03&&os.z>w+.08&&os.z<w+.25:Math.abs(old.position.x-pane.position.x)<.03&&os.x>w+.08&&os.x<w+.25)&&os.y>h+.08&&os.y<h+.25)old.removeFromParent();
   }
   pane.geometry=new T.PlaneGeometry(w,h);pane.scale.setScalar(1);pane.rotation.y=side*Math.PI/2;pane.material=interiorGlass();pane.castShadow=pane.receiveShadow=false;
   const holder=new T.Group();holder.position.copy(pane.position);holder.rotation.copy(pane.rotation);holder.translateZ(-.035);world.add(holder);addUpperRoom(holder,{width:w,height:h,depth:i%3===0?.23:1.05,mode:i%3===0?0:2,variant:i+b.index*13});
  }
  const shell=facadeShell(b.w,b.shellHeight??b.h,4,b.shellBase??.11,cuts);shell.translate(0,-body.position.y,0);body.geometry=shell;body.scale.setScalar(1);
 }
}
