import {createFoodCargo} from './food-cargo.js';
import {createBackgroundWorkers} from './background-workers.js';
import {createInbound} from './inbound.js';
import {canStandCarrying} from './reach.js';
import {workflow} from './workflow-layout.js';
import {buildOffice} from './office.js';
import {buildCampus} from './campus.js';
import {buildArchitecture,installSky,mountSigns,addContactLighting} from './architecture.js';
import {workshop,P,T} from './geometry.js';
import {pallet,rack,conveyor,truck,forklift,carton} from './props.js';
import {ownScene} from '../src/spaces/legacy-room.js';
import {modelMetrics} from '../src/models/pastel-shapes.js';

export const layout={
 footprint:{width:44,depth:34,clearHeight:8.4},spawn:{x:-15,z:12},
 zones:[{id:'entry',name:'입구 · 보행 통로',x:-17,z:13},{id:'storage',name:'입고 · 랙 보관',x:-15,z:5},{id:'feed',name:'입고 도크 · 컨베이어 투입',x:-4,z:-14},{id:'sorting',name:'분류 · 상자 회수',x:10.5,z:-12},{id:'staging',name:'출고 대기 구역',x:14,z:-8},{id:'dock',name:'하역 플랫폼 · 외부 트럭',x:10.5,z:-13.8}],
 route:workflow.route
};
export function createWarehouseStudy(ctx){
 const {renderer,camera,player}=ctx,scene=new T.Scene();scene.fog=new T.Fog(0xe7ecdf,80,205);const sky=installSky(scene);const world=new T.Group();scene.add(world);const k=workshop(world),obstacles=[],dynamic=new Set();
 k.foodCargo=createFoodCargo(k);
 const previousFar=camera.far;camera.far=240;camera.updateProjectionMatrix();
 const block=(x,z,w,d,h=2.3)=>obstacles.push({x,z,w,d,h});
 // The traversable floor is a small part of a continuing industrial campus.
 const ground=k.box(400,.2,400,0xb4c2b4,0,-1.28,0,world,.001);ground.castShadow=false;
 k.box(104,.12,84,P.road,0,-1.12,-6,world,.001).castShadow=false;
 k.box(44.8,1.15,34.8,0xb3b9aa,0,-.485,0,world,.01);k.box(44,.10,34,P.floor,0,.06,0,world,.001).castShadow=false;
 // Concrete panel seams, not a miniature display plinth.
 for(let x=-20;x<=20;x+=4)k.stripe(x,0,.017,33,0xb4bdaf);for(let z=-16;z<=16;z+=4)k.stripe(0,z,43,.017,0xb4bdaf);
 const architecture=buildArchitecture(k,world,block);
 for(const x of [-18.5,-11.2])for(const z of [-7,1]){rack(k,x,z);block(x,z,1.85,7.2,5.6);}for(const x of [-18.5,-11.2])pallet(k,x,7,{stack:2});for(const x of [-18.5,-11.2])block(x,7,1.3,1.1,1.4);
 mountSigns(k);
 const belts=workflow.belts.map(b=>{const belt=conveyor(k,b.x,b.z,{...b,openEnds:true});dynamic.add(belt.rollers);block(b.x,b.z,b.rotation?b.length:1.85,b.rotation?1.85:b.length,1.4);obstacles.at(-1).interactionSurface=true;return belt;});
 // Open dock apron replaces the enclosed bridge and sleeve.
 // Two turn transfer plates connect the incoming line to the near-dock sorting terminal.
 for(const x of [-4,10.5]){k.box(1.4,.22,1.4,P.steel,x,.86,-5.6);k.box(1.38,.06,1.38,P.dark,x,.99,-5.6);for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)k.cyl(.055,.05,P.steel,x+a*.23,1.027,-5.6+b*.23);}
 // Open loading apron: no overhead equipment obscures the worker or the rear cargo.
 k.box(2.4,.14,2.15,P.steel,-4,.19,-16.05); // dock-to-belt walking deck
 for(const x of [-5.22,-2.78])k.stripe(x,-15.8,.06,1.5,P.line);
 // Reserve worker lane without widening the player's existing floor boundary.
 block(-4,-15.85,2.35,1.15,1.9);
 // Physical end stop: inner face z=-10.9; parcel leading face stops at -10.86.
 k.box(1.28,.28,.10,P.line,10.5,1.17,-10.95);
 for(const x of [9.86,11.14])k.box(.08,.65,.13,P.frame,x,.95,-10.95);
 k.stripe(10.5,-12.1,1.5,.09,P.line);
 for(const [x,z] of [[2,-12],[19,-10]]){pallet(k,x,z);block(x,z,1.3,1.15,1.5);for(const dx of [-1,1])k.stripe(x+dx,z,.07,2.7);k.stripe(x,z+1.3,2.1,.07);}
 for(const [x,z] of [[-18.5,10],[-18.5,11.3],[-11.2,10]]){pallet(k,x,z);block(x,z,1.3,1.1,.55);}
 // Forklift staging is beside the storage aisle, separated from the outbound pedestrian loop.
 forklift(k,-7,1);block(-7,.6,3.2,3.5,2.9);pallet(k,-7,-2.5,{stack:2});block(-7,-2.5,1.3,1.1);
 for(const x of [-9,-5])k.stripe(x,1,.07,7);k.stripe(-7,4.5,4,.07);
 for(const [x,z] of [[1,-13],[3,-13],[18,-11.4],[20,-11.4]]){k.cyl(.065,.95,P.line,x,.59,z);block(x,z,.16,.16,1.1);}
 // Same parcel dimensions/colors. Each parcel now has an independent full-route state.
 const crateRoot=new T.Group();world.add(crateRoot);dynamic.add(crateRoot);
 const boxes=Array.from({length:10},(_,i)=>k.foodCargo.playable(i,i%2?'red':'blue',crateRoot));
 const inbound=createInbound(k,crateRoot,boxes);dynamic.add(inbound.object);
 const features={inbound,pickup:{...workflow.pickup},trucks:workflow.trucks.map(t=>({...t})),boxes,crateRoot};
 // Workbench adjacent to infeed, with scanner/scale: a human-scale task station.
 k.box(2.3,.12,.85,P.wood,-7,1,8.3);for(const dx of [-.95,.95])for(const dz of [-.3,.3])k.box(.085,.9,.085,P.frame,-7+dx,.56,8.3+dz);k.box(.6,.1,.5,P.steel,-6.7,1.13,8.3);k.box(.11,.42,.12,P.dark,-7.75,1.26,8.2);k.box(.38,.3,.08,P.blue,-7.75,1.53,8.2);block(-7,8.3,2.3,.85,1.8);
 // Painted pedestrian lane: entry → storage → infeed → east service aisle → dispatch.
 for(const x of [-16.6,-13.4])k.stripe(x,10,.07,10.4);for(const z of [10.6,13.3])k.stripe(-4,z,19,.075);for(const x of [11.4,14])k.stripe(x,2,.075,18);k.arrow(-15,12);k.arrow(-9,12,Math.PI/2);k.arrow(6,12,Math.PI/2);k.arrow(12.7,3);k.arrow(12.7,-3);
 const office=buildOffice(k,block);
 // Simple packing cart and safety equipment beside the existing workbench.
 const backgroundWorkers=createBackgroundWorkers(k,world,player.avatar,obstacles);dynamic.add(backgroundWorkers.object);
 block(-9,8.4,.9,1.25,1.2); // retain the original cart's reserved footprint

 for(const x of [-20.9,20.9]){k.cyl(.1,.48,P.red,x,.7,15.4);k.box(.05,.13,.05,P.dark,x,.99,15.4);k.box(.25,.3,.03,P.red,x,1.65,15.4);}
 for(const d of workflow.docks)truck(k,d.x,-19.1,d.color==='blue'?P.blue:d.color==='red'?P.red:P.green,{open:false,foldDoors:d.color==='inbound'});
 for(const x of [-6.5,-1.5,3.5,8.5,12.5,17.5])k.box(.09,.01,16,P.line,x,-1.045,-25,world,.001).castShadow=false;
 buildCampus(k,world);
 for(const x of [-29,29])for(const z of [-27,-7,13,38]){k.cyl(.09,7,P.frame,x,2.4,z);k.box(1,.16,.45,P.wallLight,x,5.95,z);const tree=k.group(x+(x<0?-4:4),-1,z+3);k.cyl(.18,2.7,P.wood,0,1.3,0,tree);for(let i=0;i<3;i++){const m=new T.Mesh(new T.IcosahedronGeometry(1.2,1),k.mat(i%2?0x9ab69d:0x8ba991));m.position.set(Math.sin(i*2)*.7,3.2+i*.22,Math.cos(i*2)*.6);tree.add(m);}}

 const hemi=new T.HemisphereLight(0xf4f1e5,0x889b91,1.75),sun=new T.DirectionalLight(0xffedcf,2.25);sun.position.set(-24,38,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:36,bottom:-36,near:1,far:110});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;const indoorFill=new T.DirectionalLight(0xf8efd9,.65);indoorFill.position.set(0,8,4);scene.add(hemi,sun,indoorFill);renderer.toneMappingExposure=1.02;
 const contactShadows=addContactLighting(world,obstacles);dynamic.add(contactShadows);
 const stockRoot=k.foodCargo.flush(world);dynamic.add(stockRoot);
 const before=modelMetrics(world),batch=k.batch(world,dynamic,10);const after=modelMetrics(world);world.add(player.avatar,player.avatarShadow);
 const ray=new T.Ray(),direction=new T.Vector3(),hit=new T.Vector3();
 // Static shell remains visible. Camera contracts against real wall openings and the pitched roof.
 const cameraBoxes=architecture.bounds.map(c=>c.clone()).concat(obstacles.map(o=>{
 const height=o.h;
 return new T.Box3(new T.Vector3(o.x-o.w/2,.11,o.z-o.d/2),new T.Vector3(o.x+o.w/2,height,o.z+o.d/2));
 })).map(b=>b.expandByScalar(.22));
 const view={renderer,camera,scene,world,...player,layout,obstacles,features,office,backgroundWorkers,speedScale:1,carrying:false,metrics:{before,after,batch,architecture:{eaves:architecture.eaves,ridge:architecture.ridge,windows:architecture.windows.length},shadowMap:2048,signAtlasBytes:2048*1024*4*4/3},
 canCarryAt(x,z){return canStandCarrying(x,z,this.avatar.rotation.y,obstacles);},
 canWalk(x,z,r=.26){if(this.carrying)return this.canCarryAt(x,z);return x>-21.6+r&&x<21.6-r&&z>-15.2+r&&z<16.2-r&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);},
 cameraTarget(avatar,rig){return rig.target??{x:avatar.position.x,y:rig.height??1.4,z:avatar.position.z};},
 resolveSolidCamera(camera,target){
 direction.copy(camera.position).sub(target);let allowed=direction.length();ray.set(target,direction.normalize());
 for(const box of cameraBoxes){if(box.containsPoint(target))continue;if(ray.intersectBox(box,hit))allowed=Math.min(allowed,Math.max(.15,target.distanceTo(hit)-.06));}
 camera.position.copy(target).addScaledVector(direction,allowed);camera.position.y=Math.max(.38,camera.position.y);
 // Intersect the continuous sloped ceiling without hiding roof panels.
 const at=t=>target.clone().addScaledVector(direction,t);const under=p=>p.y<=architecture.roofHeight(p.x)-.23;
 if(!under(camera.position)){let lo=0,hi=allowed;for(let n=0;n<18;n++){const mid=(lo+hi)/2;if(under(at(mid)))lo=mid;else hi=mid;}camera.position.copy(at(Math.max(.15,lo)));}
 },
 resolveCamera(camera,target){this.resolveSolidCamera(camera,target);},
 updatePlayerHeight(){player.avatar.position.y=.11;player.avatarShadow.position.set(player.avatar.position.x,.116,player.avatar.position.z);},
 updateAmbient({activeMs=0,playing=false}={}){
 const dt=Math.max(0,activeMs-(this.rollerTime??activeMs))/1000;this.rollerTime=activeMs;
 backgroundWorkers.update(playing?dt:0);
 for(let j=0;j<belts.length;j++){const belt=belts[j],spec=j<3?workflow.belts[j]:{x:-4,z:-16.7,length:1.4,rotation:0},direction=j===2?1:-1;
 const m=new T.Matrix4();belt.phases??=new Float64Array(belt.rollers.count);
 for(let i=0;i<belt.rollers.count;i++){
  const z=-spec.length/2+.18+i*.19,xWorld=spec.x+Math.sin(spec.rotation??0)*z,zWorld=spec.z+Math.cos(spec.rotation??0)*z;
  const blocked=features.conveyorMotion?.waiting.some(b=>Math.hypot(b.x-xWorld,b.z-zWorld)<.49);
  if(!blocked)belt.phases[i]+=dt*direction*(features.conveyorMotion?.speed??.165)/.055;
  // Existing instanced roller transform, phase held independently in occupied stop zones.
  m.makeRotationY(belt.phases[i]);m.setPosition(.997,0,z);belt.rollers.setMatrixAt(i,m);
 }belt.rollers.instanceMatrix.needsUpdate=true;
 }} ,snapshot(){return {position:{x:player.avatar.position.x,z:player.avatar.position.z},hiddenWallSections:0,graphics:{...renderer.info.render},memory:{...renderer.info.memory},metrics:this.metrics};}};
 scene.userData.resourceMetrics=after;
 const owned=ownScene(view,[player.avatar,player.avatarShadow]),dispose=owned.dispose;
 owned.dispose=()=>{dispose();camera.far=previousFar;camera.updateProjectionMatrix();};return owned;
}
