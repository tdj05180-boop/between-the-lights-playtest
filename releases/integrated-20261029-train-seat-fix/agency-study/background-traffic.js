import {T} from '../experiments/spaces/kit.js';
import {modernCar,copyCar} from '../seoul-study/car.js';
import {createNetwork,leftApproaches,junctions} from './traffic-network.js';
import {trafficPedestrians} from './traffic-pedestrians.js';
import {createPlateFleet,instanceLicensePlates} from '../src/models/license-plates.js';

// Scene-local simulation and materials: Seoul's immutable model buffers are reused.
export function backgroundTraffic(world,ground,box,dynamic,camera,characters){
 const network=createNetwork(),state=network.state;
 const templates=[modernCar(0x81959f),modernCar(0xc0bbae,true),modernCar(0x647789),modernCar(0xaca798,true)];
 const lampGeo=new T.BoxGeometry(.07,.06,.48),front=new T.MeshBasicMaterial({color:0xffedc2,toneMapped:false}),rear=new T.MeshBasicMaterial({color:0xee5946,toneMapped:false});
 for(const model of templates)for(const end of [-1,1])for(const z of [-.48,.48]){const lamp=new T.Mesh(lampGeo,end>0?front:rear);lamp.position.set(end*2.09,.87,z);model.root.add(lamp);}
 const plates=createPlateFleet(2026,state.cars.map(c=>c.id));
 const models=state.cars.map((c,i)=>copyCar(templates[c.id%4],plates.plates[i])),batches=new Map();
 for(const model of models)model.root.traverse(n=>{if(!n.isMesh||n.userData.licensePlatePart)return;const key=n.geometry.uuid+(Array.isArray(n.material)?n.material:[n.material]).map(m=>m.uuid).join('/');if(!batches.has(key))batches.set(key,{geometry:n.geometry,material:n.material,nodes:[]});batches.get(key).nodes.push(n);});
 const plateInstances=instanceLicensePlates(world,dynamic,models);
 for(const b of batches.values()){b.mesh=new T.InstancedMesh(b.geometry,b.material,b.nodes.length);b.mesh.name='2026Traffic/shared-car';b.mesh.frustumCulled=false;world.add(b.mesh);dynamic.add(b.mesh);}
 const heads=[];
 function head(junction,group,x,z,mx,mz,yaw){
  const y=ground+5.1;box(.15,5.5,.15,0x65747c,mx,ground+2.75,mz);
  box(Math.max(.15,Math.abs(mx-x)),.12,Math.max(.15,Math.abs(mz-z)),0x65747c,(mx+x)/2,y+.27,(mz+z)/2);
  const left=leftApproaches[junction].includes(group),types=left?['red','amber','left','green']:['red','amber','green'];
  box(left?2.48:1.9,.59,.28,0x26333c,x,y,z,yaw);
  for(let i=0;i<types.length;i++){const lx=(i-(types.length-1)/2)*.58,lz=.16;heads.push({junction,group,type:types[i],index:i,x:x+Math.cos(yaw)*lx+Math.sin(yaw)*lz,y,z:z-Math.sin(yaw)*lx+Math.cos(yaw)*lz,yaw});}
 }
 // Heads face their actual upstream lanes. J1 deliberately has no south approach.
 head('J1','W',-10.3,-23.25,-10.3,-17.5,-Math.PI/2);
 head('J1','E',16.3,-32.75,16.3,-38.5,Math.PI/2);
 head('J1','N',.5,-44.3,-4.5,-44.3,Math.PI);
 head('J2','W',-10.3,-85.5,-10.3,-80.5,-Math.PI/2);
 head('J2','E',16.3,-90.5,16.3,-95.5,Math.PI/2);
 head('J2','N',.5,-101.3,-4.5,-101.3,Math.PI);
 head('J2','S',5.5,-74.7,10.5,-74.7,0);
 const lights=new T.InstancedMesh(new T.CircleGeometry(.16,12),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),heads.length),dummy=new T.Object3D(),color=new T.Color();
 lights.name='2026Traffic/signal-lamps';lights.frustumCulled=false;world.add(lights);dynamic.add(lights);
 heads.forEach((h,i)=>{dummy.position.set(h.x,h.y,h.z);dummy.rotation.set(0,h.yaw,0);dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix);});
 const arrowShape=new T.Shape();[[-.20,0],[-.02,.15],[-.02,.06],[.19,.06],[.19,-.06],[-.02,-.06],[-.02,-.15]].forEach(([x,y],i)=>i?arrowShape.lineTo(x,y):arrowShape.moveTo(x,y));arrowShape.closePath();
 const arrowHeads=heads.filter(h=>h.type==='left'),arrows=new T.InstancedMesh(new T.ShapeGeometry(arrowShape),new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),arrowHeads.length);arrows.name='2026Traffic/left-arrows';arrows.frustumCulled=false;world.add(arrows);dynamic.add(arrows);
 arrowHeads.forEach((h,i)=>{dummy.position.set(h.x+Math.sin(h.yaw)*.006,h.y,h.z+Math.cos(h.yaw)*.006);dummy.rotation.set(0,h.yaw,0);dummy.updateMatrix();arrows.setMatrixAt(i,dummy.matrix);});
 const pedestrians=trafficPedestrians(world,ground,box,dynamic,state,characters);
 const frustum=new T.Frustum(),vp=new T.Matrix4(),center=new T.Vector3(),sphere=new T.Sphere(center,3),cameraPoint=new T.Vector3();
 function hidden(p){center.set(p.x,ground+1,p.z);cameraPoint.copy(center).applyMatrix4(camera.matrixWorldInverse);return !frustum.intersectsSphere(sphere)||-cameraPoint.z-3>=175;}
 let previous=null;
 function update(ms){const dt=previous===null?0:Math.max(0,(ms-previous)/1000);previous=ms;
  camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(vp);network.advance(dt,hidden);
  state.cars.forEach((c,i)=>{const model=models[i];model.root.position.set(c.x,ground+.075,c.z);model.root.rotation.set(0,Math.atan2(-c.dz,c.dx),0);model.update(c.distance);model.root.updateMatrixWorld(true);});
  for(const b of batches.values()){b.nodes.forEach((n,i)=>b.mesh.setMatrixAt(i,n.matrixWorld));b.mesh.instanceMatrix.needsUpdate=true;}
  plateInstances.update();
  heads.forEach((h,i)=>{const active=state.signals[h.junction][h.group];color.setHex(h.type===active?{red:0xf16b5c,amber:0xf0b44e,green:0x68d79c}[active]:0x17231f);lights.setColorAt(i,color);});lights.instanceColor.needsUpdate=true;
  arrowHeads.forEach((h,i)=>{color.setHex(state.signals[h.junction][h.group]==='green'?0x68d79c:0x24322d);arrows.setColorAt(i,color);});arrows.instanceColor.needsUpdate=true;pedestrians.update(dt);
  world.userData.backgroundTraffic={timeMs:state.time*1000,steps:state.steps,signals:state.signals,cars:state.cars.map(c=>({...c,claim:c.claim?{id:c.claim.id,group:c.claim.group}:null})),events:state.events,recycles:state.recycles,walkers:state.walkers.map(({route,...p})=>p),pedestrianHeads:pedestrians.heads,drawBatches:batches.size+2+plateInstances.batches.length+pedestrians.drawBatches,heads:heads.filter(h=>h.index===0),source:'Seoul shared car models / 2026 lane network',cycleSeconds:Object.fromEntries(junctions.map(j=>[j.id,j.cycle])),leftApproaches,j2OffsetSeconds:17};
 }
 update(0);previous=null;return {update};
}
