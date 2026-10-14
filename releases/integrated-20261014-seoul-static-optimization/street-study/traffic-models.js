import {sculptedCar} from '../seoul-study/sculpted-car.js';
import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../src/models/pastel-shapes.js';
import {batchStatic} from '../src/models/static-batch.js';
import {createPlateFleet,attachLicensePlates} from '../src/models/license-plates.js';
import {createStreetResident} from './resident.js';
import {ROAD,createTrafficState,signalAt} from './traffic-state.js';

function kit(root){
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,material(c));return mats.get(c);};
 const box=(w,h,d,c,x,y,z,p=root,r=.02)=>mesh(p,bevelBox(w,h,d,r),mat(c),x,y,z);
 const bar=(a,b,r,c,p=root)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);const m=mesh(p,new T.CylinderGeometry(r,r,v.length(),8),mat(c));m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;};
 return {mat,box,bar};
}
function carModel(color,estate=false,plate){
 // Same approved vehicle envelope and axle animation, with curved body panels.
 // Registration remains owned by the 2003 fleet, including its distance fade.
 const model=sculptedCar(color,estate);
 model.root.scale.x=1; // retain 2003's original axle spacing / 4.16m plate envelope
 model.root.name=estate?'TrafficEstate':'TrafficSedan';
 attachLicensePlates(model.root,plate,{independentFade:true});
 return model;
}

function ambientPerson(kind){
 const a=createStreetResident(kind==='walker-south'?'neighbour':'guide'),skin=a.object.getObjectByName('TailoredHumanContinuousSurfaces');
 const colors=kind==='walker-north'?[0x66829e,0x4c677d,0xe2d6bd,0xd5ad89,0x322f2d,0x9c927f,0x64665e]:kind==='walker-south'?[0xb69567,0x997347,0xf0e2c3,0xcba183,0x65473c,0x69757c,0x665d53]:[0x78959a,0x59747a,0xe8dcbf,0xd2ab8d,0x383a36,0x4c5f6a,0x566457];
 colors.forEach((c,i)=>skin.material[i].color.setHex(c));
 // Modify only this actor's independent mesh, not shared player/NPC assets.
 const pos=skin.geometry.attributes.position,indices=skin.geometry.index,done=new Set();
 for(const group of skin.geometry.groups)for(let k=group.start;k<group.start+group.count;k++){
  const i=indices.getX(k);if(done.has(i))continue;done.add(i);let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  if(kind==='walker-north'&&y>1.40)x*=.94;
  if(kind==='walker-south'&&y>.9&&y<1.3){x*=1.06;z*=1.06;}
  if(group.materialIndex===4&&y>1.69)y+=(kind==='walker-north'?.025:-.006);
  pos.setXYZ(i,x,y,z);
 }
 pos.needsUpdate=true;skin.geometry.computeVertexNormals();skin.geometry.computeBoundingSphere();
 a.object.scale.setScalar(kind==='walker-north'?1.04:kind==='walker-south'?.96:1);
 a.object.name='Ambient-'+kind;return a;
}

function bicycleModel(){
 const root=new T.Group(),{mat,box,bar}=kit(root),wheels=[],pedals=[],crank=new T.Group();root.name='SlowSidewalkBicycle';
 const rear=[0,.36,-.65],front=[0,.36,.67],pedal=[0,.39,-.06],seat=[0,.95,-.26],head=[0,.98,.39];
 for(const [a,b]of [[rear,pedal],[pedal,seat],[seat,rear],[seat,head],[head,pedal],[head,front]])bar(a,b,.032,0x9c8176);
 for(const z of [-.65,.67]){const w=new T.Group();root.add(w);w.position.set(0,.36,z);wheels.push(w);const tire=mesh(w,new T.TorusGeometry(.34,.037,6,20),mat(0x525e58));tire.rotation.y=Math.PI/2;
  for(let n=0;n<10;n++){const t=n*Math.PI/5;bar([0,0,0],[0,Math.sin(t)*.31,Math.cos(t)*.31],.008,0xbac4ba,w);}
  const hub=mesh(w,new T.CylinderGeometry(.035,.035,.17,8),mat(0x7e8b83));hub.rotation.z=Math.PI/2;
 }
 box(.28,.07,.26,0x645c51,0,1.00,-.26,root,.04);bar([0,.94,.39],[0,1.13,.47],.025,0x738079);bar([-.29,1.13,.47],[.29,1.13,.47],.025,0x738079);
 for(const side of [-1,1])box(.13,.045,.065,0x4f5a54,side*.245,1.13,.47);
 root.add(crank);crank.position.set(...pedal);
 for(const side of [-1,1]){bar([side*.09,0,0],[side*.09,side*.155,0],.021,0x839289,crank);pedals.push(box(.13,.04,.10,0x64695d,side*.155,side*.155,0,crank));}
 const rider=ambientPerson('cyclist');rider.object.scale.setScalar(.96);rider.object.position.set(0,.23,-.19);root.add(rider.object);
 const bones=Object.fromEntries(rider.skeleton.bones.map(b=>[b.name,b]));
 // Rider legs solve a two-link chain to the moving pedals; hands rest on the bar.
 function leg(side,theta){const hip=bones['hip'+side],knee=bones['knee'+side],foot=bones['foot'+side],L=.365,l=.355;
  const y=(.39+.155*Math.cos(theta)-.23)/.96+.048-.825,z=(-.06+.155*Math.sin(theta)+.19)/.96;
  const distance=Math.min(L+l-.001,Math.hypot(y,z)),bend=Math.PI-Math.acos(T.MathUtils.clamp((L*L+l*l-distance*distance)/(2*L*l),-1,1));
  hip.rotation.x=Math.atan2(-z,-y)-Math.atan2(l*Math.sin(bend),L+l*Math.cos(bend));knee.rotation.x=bend;foot.rotation.x=-hip.rotation.x-bend;
 }
 // No helmet: retain the cyclist’s own short hair.
 batchStatic(root,new Set([...wheels,crank,rider.object]));
 return {root,update(distance){const angle=distance/.34;wheels.forEach(w=>w.rotation.x=angle);crank.rotation.x=angle*.47;const phase=angle*.47;pedals.forEach(p=>p.rotation.x=-phase);leg(1,phase);leg(-1,phase+Math.PI);for(const s of [-1,1]){bones['shoulder'+s].rotation.set(-.62,0,s*.05);bones['elbow'+s].rotation.x=-.63;}bones.body.rotation.x=.10;}};
}

export function addRoadDetails(world){
 const {box,bar,mat}=kit(world),yellow=0xdbb853,white=0xe9e3cb,dark=0x53665f,lights=[];
 // One continuous solid yellow line per road segment, with legitimate gaps inside junctions.
 for(const [a,b]of [[-150,-36.4],[-23.6,23.6],[36.4,150]])box(b-a,.009,.09,yellow,(a+b)/2,.006,ROAD.center).castShadow=false;
 // Reproduce the supplied blue/white unprotected-left-turn sign as a crisp small atlas.
 const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=640;const ctx=signCanvas.getContext('2d');
 ctx.fillStyle='#0845db';ctx.fillRect(0,0,512,640);ctx.strokeStyle='#fff';ctx.lineWidth=7;ctx.beginPath();ctx.roundRect(11,12,490,616,35);ctx.stroke();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(78,129);ctx.lineTo(175,48);ctx.quadraticCurveTo(197,41,190,65);ctx.lineTo(176,99);ctx.lineTo(329,99);ctx.bezierCurveTo(394,99,436,149,436,209);ctx.lineTo(436,436);ctx.lineTo(373,436);ctx.lineTo(373,215);ctx.quadraticCurveTo(373,161,329,161);ctx.lineTo(178,161);ctx.lineTo(193,194);ctx.quadraticCurveTo(198,218,177,211);ctx.closePath();ctx.fill();
 ctx.font='bold 120px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('비보호',256,545,450);
 const map=new T.CanvasTexture(signCanvas);map.colorSpace=T.SRGBColorSpace;const signMat=material(0xffffff,{map});
 const obstacles=[];const pedestrianLights=[];
 function pedestrian(x,z,rotation){
  const root=new T.Group();root.position.set(x,2.05,z);root.rotation.y=rotation;world.add(root);
  bar([x,.1,z],[x,2.55,z],.045,dark);obstacles.push({x,z,w:.16,d:.16,h:2.6});box(.31,.66,.18,dark,0,0,0,root,.035);
  for(const [i,color]of [0xe26f62,0x70c88d].entries()){
   const cv=document.createElement('canvas');cv.width=64;cv.height=80;const g=cv.getContext('2d');g.clearRect(0,0,64,80);g.strokeStyle=g.fillStyle='#fff';g.lineWidth=8;g.lineCap='round';g.beginPath();g.arc(32,13,7,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(32,26);g.lineTo(32,48);g.moveTo(32,29);g.lineTo(i?16:22,43);g.moveTo(32,29);g.lineTo(i?49:42,39);g.moveTo(32,48);g.lineTo(i?17:25,70);g.moveTo(32,48);g.lineTo(i?49:39,70);g.stroke();
   const texture=new T.CanvasTexture(cv);const m=material(0x2b3935,{map:texture,transparent:true,emissive:color,emissiveMap:texture,emissiveIntensity:0});const icon=mesh(root,new T.PlaneGeometry(.23,.28),m,0,.17-i*.34,.102);icon.castShadow=false;pedestrianLights.push({m,i,color});
  }
 }
 function head(x,z,dir,axis){
  const root=new T.Group();root.position.set(x,4.7,z);root.rotation.y=dir;world.add(root);
  box(1.28,.42,.25,dark,0,0,0,root,.055);
  for(const [i,c]of [0xcf6254,0xe3ab51,0x72b98e].entries()){
   const m=material(0x303e37,{emissive:c,emissiveIntensity:0,roughness:.7});const disc=mesh(root,new T.CylinderGeometry(.125,.125,.035,12),m,-.41+i*.41,0,.15);disc.rotation.x=Math.PI/2;disc.castShadow=false;lights.push({m,axis,index:i,color:c});
   box(.29,.045,.18,dark,-.41+i*.41,.17,.18,root);
  }
  // Mount beside the signal on its existing horizontal arm, toward the supporting pole.
  const signX=axis==='main'?-1.16:1.16,signY=.26;
  bar([signX,signY-.22,0],[signX,signY+.22,0],.028,dark,root);
  for(const y of [signY-.15,signY+.15])box(.13,.055,.10,dark,signX,y,.025,root,.008).castShadow=false;
  // Retain the blue rear face and the original front artwork, size and orientation.
  box(.72,.90,.022,0x0845db,signX,signY,.075,root,.006).castShadow=false;
  const sign=mesh(root,new T.PlaneGeometry(.72,.90),signMat,signX,signY,.09);sign.castShadow=false;
 }
 for(const x of ROAD.junctions){
  for(const side of [-1,1]){
   // Main-road stop lines precede the crossing, with the signal at the far side of the junction.
   const crossX=x+side*ROAD.crossOffset,lineX=x+side*ROAD.stopOffset;
   for(let z=4.02;z<8.1;z+=.53)box(ROAD.crossWidth,.014,.31,white,crossX,.015,z).castShadow=false;
   box(.17,.014,2.10,white,lineX,.017,ROAD.center-side*1.125).castShadow=false;
   const poleX=x+side*3.75,poleZ=side<0?12.6:-.4;obstacles.push({x:poleX,z:poleZ,w:.2,d:.2,h:5});
   bar([poleX,.11,poleZ],[poleX,4.96,poleZ],.065,dark);bar([poleX,4.96,poleZ],[poleX,4.96,ROAD.center+side*1.125],.055,dark);
   head(poleX,ROAD.center+side*1.125,side>0?-Math.PI/2:Math.PI/2,'main');
   const crossZ=side<0?ROAD.northWalk:ROAD.southWalk;
   for(let px=x-2.6;px<x+2.8;px+=.54)box(.31,.014,ROAD.crossWidth,white,px,.015,crossZ).castShadow=false;
   box(2.65,.014,.17,white,x+side*1.45,.017,ROAD.center+side*7.2).castShadow=false;
   const sx=x-side*3.7,sz=ROAD.center+side*3.55;
   bar([sx,.1,sz],[sx,4.96,sz],.06,dark);bar([sx,4.96,sz],[x-side*1.45,4.96,sz],.05,dark);
   head(x-side*1.45,sz,side>0?Math.PI:0,'cross');
  }
  for(const side of [-1,1]){const cx=x+side*ROAD.crossOffset;pedestrian(cx+side*1.58,3.13,0);pedestrian(cx+side*1.58,8.97,Math.PI);const cz=side<0?ROAD.northWalk:ROAD.southWalk;pedestrian(x-3.5,cz+side*1.58,Math.PI/2);pedestrian(x+3.5,cz+side*1.58,-Math.PI/2);}
  for(const [a,b]of [[-150,-.2],[12.3,150]])box(.09,.009,b-a,yellow,x,.006,(a+b)/2).castShadow=false;
 }
 return {obstacles,update(time,override){const phase=override??signalAt(time);for(const l of lights){const on=l.index==={red:0,amber:1,green:2}[phase[l.axis]];l.m.color.setHex(on?l.color:0x303e37);l.m.emissiveIntensity=on?.65:0;}for(const l of pedestrianLights){const on=l.i===0?phase.pedestrian==='red':phase.pedestrian==='green'||phase.pedestrian==='clearance'&&Math.floor(time*3)%2===0;l.m.color.setHex(on?l.color:0x24322d);l.m.emissiveIntensity=on?.85:0;}},lights:lights.length};
}

export function trafficFloor(x,z){
 const main=1-T.MathUtils.smoothstep(Math.abs(z-ROAD.center),2.1,2.9),cross=Math.max(...ROAD.junctions.map(j=>1-T.MathUtils.smoothstep(Math.abs(x-j),2.9,3.7)));
 return .11-.12*Math.max(main,cross);
}
export function createStreetTraffic(world,player,obstacles){
 const root=new T.Group();root.name='StreetTrafficDynamic';world.add(root);const state=createTrafficState();
 const plates=createPlateFleet(2003,state.cars.map(c=>c.id));
 const cars=[carModel(0x9ebdb8,false,plates.plates[0]),carModel(0xd8c5a0,true,plates.plates[1])];cars.forEach(c=>root.add(c.root));
 const actors=state.walkers.map(a=>a.kind==='bike'?bicycleModel():ambientPerson(a.id));actors.forEach(a=>root.add(a.root??a.object));
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const brush=canvas.getContext('2d'),fade=brush.createRadialGradient(16,16,2,16,16,16);fade.addColorStop(0,'rgba(45,60,51,.28)');fade.addColorStop(1,'rgba(45,60,51,0)');brush.fillStyle=fade;brush.fillRect(0,0,32,32);const texture=new T.CanvasTexture(canvas);
 function contact(object,w,d){const shadow=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.007;object.add(shadow);}
 cars.forEach(a=>contact(a.root,4.4,1.9));actors.forEach((a,i)=>contact(a.root??a.object,state.walkers[i].kind==='bike'?.9:.8,state.walkers[i].kind==='bike'?2:.8));
 // Distance fade finishes well before a loop reset. No teleport can be seen from the ±25m play area.
 const sets=[...cars.map(a=>a.root),...actors.map(a=>a.root??a.object)].map(object=>{const materials=new Map();object.traverse(n=>{if(n.isMesh){n.castShadow=false;for(const m of Array.isArray(n.material)?n.material:[n.material]){materials.set(m,m.opacity);m.transparent=true;m.forceSinglePass=true;}}});return {object,materials};});
 function pose(dt){
  for(const [i,c]of state.cars.entries()){cars[i].root.position.set(c.x,0,c.z);cars[i].root.rotation.y=c.dir>0?0:Math.PI;cars[i].update(c.distance);}
  for(const [i,a]of state.walkers.entries()){const v=actors[i],object=v.root??v.object;object.position.set(a.x,trafficFloor(a.x,a.z),a.z);object.rotation.y=a.yaw??a.dir*Math.PI/2;if(a.kind==='bike')v.update(a.distance);else v.update({dt,speed:a.speed});}
  for(const {object,materials}of sets){const d=Math.abs(object.position.x),opacity=1-T.MathUtils.smoothstep(d,91,119);object.visible=opacity>0;for(const [m,base]of materials)m.opacity=base*opacity;}
 }
 pose(0);
 return {root,state,update(dt){state.update(dt,player.avatar.position,obstacles);pose(dt);},blocksPlayer:state.blocksPlayer,snapshot:state.snapshot};
}


