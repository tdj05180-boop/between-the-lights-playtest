import {planStorey} from '../src/models/interior-plan.js';
import {nightSuiteLighting} from './room-lighting.js';
import * as T from '../src/vendor/three.module.min.js';
import {mergeGeometries} from '../src/vendor/BufferGeometryUtils.js';
import {mergeStaticVertices} from '../src/models/merge-static-vertices.js';
import {addShopRoom,buildingRoomLayout,facadeShell,interiorGlass} from '../src/models/visible-interiors.js';
import {batchNightGlass} from './night-glass.js';
import {furnishNearSuites} from './near-room-furniture.js';

// A night-specific layer: softly occupied windows, dark closed businesses and
// coherent shallow lobbies. No daylight storefront atlas or extra shadow lights.
export function nightInteriors(world){
 const frameGeometries=new Map(),frameMaterials=new Map();
 const roots=[],report={buildings:0,upperRooms:0,shops:0,litShops:0,triangles:0,batches:0,nearFurniture:[]};
 function building({id,x,z,w,d,h,base,body,style,seed}){
  const root=new T.Group();root.name='2026Night/inhabited-building';root.position.set(x,0,z);world.add(root);roots.push(root);report.buildings++;
  const layout=buildingRoomLayout(root,{width:w,depth:d,base,top:base+h,night:true});
  const cuts=[],pending=[],upperPanes=[],frameParts=new Map();
  const face=(side,u,y,o=0)=>{const ry=side*Math.PI/2,dep=side%2?w:d,g=new T.Group();g.position.set(Math.cos(ry)*u+Math.sin(ry)*(dep/2+o),y,-Math.sin(ry)*u+Math.cos(ry)*(dep/2+o));g.rotation.y=ry;root.add(g);return g;};
  function tint(room,strength,warm=false){room.traverse(n=>{if(!n.isMesh)return;n.material=n.material.clone();n.material.color.multiplyScalar(strength);if(warm)n.material.color.multiply(new T.Color(1,.94,.79));n.userData.roomSurface=true;n.userData.retailSurface=true;});}
  function window(side,u,y,ww,hh,mode=1,frame=0x80908f){
   cuts.push({side,a:u-ww/2,b:u+ww/2,low:y-hh/2,high:y+hh/2});
   const step=(h-3.6)/Math.max(2,Math.floor((h-3.5)/2.5)),row=Math.max(0,Math.round((y-base-3.4)/step-.44)),ry=side*Math.PI/2,dep=side%2?w:d;
   const px=Math.cos(ry)*u+Math.sin(ry)*dep/2,pz=-Math.sin(ry)*u+Math.cos(ry)*dep/2;
   pending.push({side,u,y,ww,hh,mode,frame,row,step,x:px,z:pz,axis:side%2?'z':'x',width:ww});
  }
  function shop(side,span){
   const open=(seed+side)%4===0,trade=[1,9,8,3,11][(seed+side)%5],holder=face(side,0,0,.24),width=span-.62;
   cuts.push({side,a:-width/2,b:width/2,low:base+.2,high:base+2.5});
   // Two coherent front/rear premises share the side glazing. Four full-width
   // perpendicular shops used to overlap their walls and furniture at each corner.
   if(side===0||side===2){
    const room=addShopRoom(holder,{width,height:2.27,depth:d/2+.16,floor:base+.2,doorX:width*.31,type:trade,era:2026,variant:seed+side,night:true,sideWalls:false});
    tint(room,open?.48:.15,open);
   }
   const glass=new T.Mesh(new T.PlaneGeometry(width,2.27),interiorGlass(true));glass.position.set(0,base+1.335,.03);holder.add(glass);
   report.shops++;if(open)report.litShops++;
  }
  function finish(){
   // Collect every physical opening first; room boundaries and lighting are shared
   // across facades. An unlit room still has the same real glass/opening.
   const plans=new Map();
   for(const q of pending){
    if(!plans.has(q.row))plans.set(q.row,planStorey(w,d,pending.filter(p=>p.row===q.row).map(p=>({...p,u:p.axis==='x'?p.x:p.z}))));
    const plan=plans.get(q.row),cell=plan.cellAt(q.x,q.z),state=nightSuiteLighting(id,seed,q.row,cell);
    const holder=face(q.side,q.u,q.y,.187);
    // A continuous extruded frame eliminates overlapping bar ends and hidden
    // box faces (32 triangles rather than four separate 12-triangle bars).
    const frameKey=[q.ww,q.hh].join('/');
    if(!frameGeometries.has(frameKey)){
     const outer=new T.Shape(),iw=q.ww-.025,ih=q.hh-.025,ow=q.ww+.12,oh=q.hh+.10;
     outer.moveTo(-ow/2,-oh/2);outer.lineTo(ow/2,-oh/2);outer.lineTo(ow/2,oh/2);outer.lineTo(-ow/2,oh/2);outer.closePath();
     const hole=new T.Path();hole.moveTo(-iw/2,-ih/2);hole.lineTo(-iw/2,ih/2);hole.lineTo(iw/2,ih/2);hole.lineTo(iw/2,-ih/2);hole.closePath();outer.holes.push(hole);
     const geometry=new T.ExtrudeGeometry(outer,{depth:.13,bevelEnabled:false,steps:1});geometry.translate(0,0,-.062);frameGeometries.set(frameKey,geometry);
    }
    if(!frameMaterials.has(q.frame)){const m=new T.MeshBasicMaterial({color:q.frame});m.color.multiplyScalar(.6);frameMaterials.set(q.frame,m);}
    holder.updateMatrix();const framePart=new T.BufferGeometry().copy(frameGeometries.get(frameKey)).applyMatrix4(holder.matrix);
    if(!frameParts.has(q.frame))frameParts.set(q.frame,[]);frameParts.get(q.frame).push(framePart);
    const room=layout.add(holder,{width:q.ww,height:q.hh,depth:1.4,recess:-.055,mode:q.mode,variant:seed*13+q.row*7+cell.ix*3+cell.iz,furnished:state.lit},base+3.4+q.row*q.step+.07,base+3.4+(q.row+1)*q.step-.10);
    const glass=new T.Mesh(new T.PlaneGeometry(q.ww,q.hh),interiorGlass(true));upperPanes.push({glass,room});holder.add(glass);report.upperRooms++;
   }
   // Merge frames per building before the city-wide bake: thousands of extra
   // scene nodes would otherwise increase mobile chapter-start memory/work.
   for(const [color,parts]of frameParts){const frame=new T.Mesh(mergeGeometries(parts),frameMaterials.get(color));frame.name='ContinuousWindowFrames';frame.userData.windowCount=parts.length;root.add(frame);parts.forEach(g=>g.dispose());}
   frameParts.clear();
   layout.finish({lighting:(row,cell)=>nightSuiteLighting(id,seed,row,cell)});
   const furnished=furnishNearSuites(layout,{x,z,seed});
   if(furnished.eligible)report.nearFurniture.push({id,...furnished});
   // Read the completed physical suite, avoiding a second facade-space decision.
   for(const {glass,room} of upperPanes)glass.userData.nightState=room.userData.suite.state.lit?1:0;
   // Tag only upper-suite surfaces. Retail keeps its existing baked appearance.
   root.updateMatrixWorld(true);
   const centre=new T.Vector3();
   root.traverse(n=>{
    if(!n.isMesh||!n.userData.roomSurface||n.userData.retailSurface)return;
    n.getWorldPosition(centre);
    const levels=layout.root.userData.plans;
    const level=levels.reduce((best,p)=>Math.abs(centre.y-(p.floor+p.ceiling)/2)<Math.abs(centre.y-(best.floor+best.ceiling)/2)?p:best,levels[0]);
    if(level)n.userData.upperShade={floor:level.floor,ceiling:level.ceiling};
   });

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
   const gs=nodes.map(n=>{const g=new T.BufferGeometry().copy(n.geometry);
    if(!g.index){const count=g.attributes.position.count,indices=count>65535?new Uint32Array(count):new Uint16Array(count);for(let i=0;i<count;i++)indices[i]=i;g.setIndex(new T.BufferAttribute(indices,1));}
    g.applyMatrix4(n.matrixWorld);const a=g.attributes.normal,colors=new Float32Array(a.count*3),color=n.material.color;
    for(let i=0;i<a.count;i++){const bounds=n.userData.upperShade,ny=a.getY(i);
     // Static vertex shading: quieter floor/soffit, brighter upper walls.
     // No lights, extra surfaces, textures or per-frame room updates.
     const height=bounds?T.MathUtils.clamp((g.attributes.position.getY(i)-bounds.floor)/(bounds.ceiling-bounds.floor),0,1):0;
     const shade=bounds?(ny>.5?.58:ny<-.5?.70:(.75+.23*height)*(.96+.04*Math.abs(a.getZ(i)))):n.userData.roomSurface?(.79+.15*Math.max(0,ny)+.06*Math.max(0,a.getZ(i))):(.62+.27*Math.max(0,ny)+.10*Math.max(0,a.getZ(i)));colors[i*3]=color.r*shade;colors[i*3+1]=color.g*shade;colors[i*3+2]=color.b*shade;}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));for(const name of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(name))g.deleteAttribute(name);return g;
   });
   const joined=mergeGeometries(gs),indexed=mergeStaticVertices(joined,1e-5);joined.dispose();gs.forEach(g=>g.dispose());const mesh=new T.Mesh(indexed,m);mesh.name='2026Night/room-batch';world.add(mesh);nodes.forEach(n=>n.removeFromParent());report.triangles+=indexed.index.count/3;report.batches++;
  }
  batchNightGlass(world);world.userData.nightInteriors=report;return report;
 }
 return {building,finish};
}
