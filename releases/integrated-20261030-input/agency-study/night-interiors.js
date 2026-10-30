import * as T from '../src/vendor/three.module.min.js';
import {mergeGeometries,mergeVertices} from '../src/vendor/BufferGeometryUtils.js';
import {addShopRoom,addUpperRoom,facadeShell,interiorGlass,batchInteriorVisuals} from '../src/models/visible-interiors.js';

// A night-specific layer: softly occupied windows, dark closed businesses and
// coherent shallow lobbies. No daylight storefront atlas or extra shadow lights.
export function nightInteriors(world){
 const roots=[],report={buildings:0,upperRooms:0,shops:0,litShops:0,triangles:0,batches:0};
 function building({x,z,w,d,h,base,body,style,seed}){
  const root=new T.Group();root.name='2026Night/inhabited-building';root.position.set(x,0,z);world.add(root);roots.push(root);report.buildings++;
  const cuts=[];
  const face=(side,u,y,o=0)=>{const ry=side*Math.PI/2,dep=side%2?w:d,g=new T.Group();g.position.set(Math.cos(ry)*u+Math.sin(ry)*(dep/2+o),y,-Math.sin(ry)*u+Math.cos(ry)*(dep/2+o));g.rotation.y=ry;root.add(g);return g;};
  function tint(room,strength,warm=false){room.traverse(n=>{if(!n.isMesh)return;n.material=n.material.clone();n.material.color.multiplyScalar(strength);if(warm)n.material.color.multiply(new T.Color(1,.94,.79));n.userData.roomSurface=true;});}
  function window(side,u,y,ww,hh,mode=1){
   cuts.push({side,a:u-ww/2,b:u+ww/2,low:y-hh/2,high:y+hh/2});
   const roomVariant=seed*13+side*7+Math.round(u*3+y*5);
   const holder=face(side,u,y,.187),room=addUpperRoom(holder,{width:ww,height:hh,depth:mode===0?.24:1.35,mode,variant:roomVariant,night:true});room.position.z=-.055;
   tint(room,.54+((seed+side)%3)*.045,style%2===0);
   const glass=new T.Mesh(new T.PlaneGeometry(ww,hh),interiorGlass(true));holder.add(glass);report.upperRooms++;
  }
  function shop(side,span){
   const open=(seed+side)%4===0,trade=[1,9,8,3,11][(seed+side)%5],holder=face(side,0,0,.24),width=span-.62;
   cuts.push({side,a:-width/2,b:width/2,low:base+.2,high:base+2.5});
   const room=addShopRoom(holder,{width,height:2.27,depth:2.75,floor:base+.2,doorX:width*.31,type:trade,era:2026,variant:seed+side,night:true});
   tint(room,open?.48:.15,open);
   const glass=new T.Mesh(new T.PlaneGeometry(width,2.27),interiorGlass(true));glass.position.set(0,base+1.335,.03);holder.add(glass);
   report.shops++;if(open)report.litShops++;
  }
  function finish(){
   const mesh=new T.Mesh(facadeShell(w,h,d,base,cuts),new T.MeshBasicMaterial({color:body}));mesh.material.color.multiplyScalar(.6);root.add(mesh);
  }
  return {window,shop,finish};
 }
 function finish(){
  // All solid room surfaces are baked into spatial vertex-colour batches.
  world.updateMatrixWorld(true);const buckets=new Map();
  for(const root of roots)root.traverse(n=>{if(!n.isMesh||n.material.transparent)return;const p=n.getWorldPosition(new T.Vector3()),key=[Math.floor(p.x/30),Math.floor(p.z/30)].join('/');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(n);});
  const m=new T.MeshBasicMaterial({vertexColors:true});
  for(const nodes of buckets.values()){
   const gs=nodes.map(n=>{const g=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();g.applyMatrix4(n.matrixWorld);const a=g.attributes.normal,colors=[];
    for(let i=0;i<a.count;i++){const shade=n.userData.roomSurface?(.79+.15*Math.max(0,a.getY(i))+.06*Math.max(0,a.getZ(i))):(.62+.27*Math.max(0,a.getY(i))+.10*Math.max(0,a.getZ(i)));const c=n.material.color.clone().multiplyScalar(shade);colors.push(c.r,c.g,c.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));for(const name of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(name))g.deleteAttribute(name);return g;
   });
   const joined=mergeGeometries(gs),indexed=mergeVertices(joined,1e-5);joined.dispose();gs.forEach(g=>g.dispose());const mesh=new T.Mesh(indexed,m);mesh.name='2026Night/room-batch';world.add(mesh);nodes.forEach(n=>n.removeFromParent());report.triangles+=indexed.index.count/3;report.batches++;
  }
  batchInteriorVisuals(world,{glassOnly:true});world.userData.nightInteriors=report;return report;
 }
 return {building,finish};
}
