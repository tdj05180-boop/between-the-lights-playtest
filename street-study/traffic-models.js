import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../src/models/pastel-shapes.js';
import {batchStatic} from '../src/models/static-batch.js';
import {createStreetResident} from './resident.js';
import {ROAD,createTrafficState,signalAt} from './traffic-state.js';

function kit(root){
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,material(c));return mats.get(c);};
 const box=(w,h,d,c,x,y,z,p=root,r=.02)=>mesh(p,bevelBox(w,h,d,r),mat(c),x,y,z);
 const bar=(a,b,r,c,p=root)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);const m=mesh(p,new T.CylinderGeometry(r,r,v.length(),8),mat(c));m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;};
 return {mat,box,bar};
}
function carModel(color,estate=false){
 const root=new T.Group();root.name=estate?'TrafficEstate':'TrafficSedan';const {mat,box,bar}=kit(root),wheels=[];
 const s=new T.Shape();s.moveTo(-2,.47);s.lineTo(-1.61,.47);s.absarc(-1.22,.47,.39,Math.PI,0,true);s.lineTo(.83,.47);s.absarc(1.22,.47,.39,Math.PI,0,true);s.lineTo(2,.47);s.quadraticCurveTo(2.06,.7,1.93,.86);s.lineTo(.93,.96);s.lineTo(.40,1.47);s.quadraticCurveTo(.32,1.54,.20,1.54);s.lineTo(estate?-1.10:-.72,1.54);s.lineTo(estate?-1.68:-1.3,1.0);s.lineTo(-1.91,.94);s.quadraticCurveTo(-2.06,.8,-2,.47);
 const body=new T.ExtrudeGeometry(s,{depth:1.51,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,steps:1,curveSegments:7});body.translate(0,0,-.755);mesh(root,body,mat(color));
 const glass=0x526d72;
 const cv=document.createElement('canvas');cv.width=cv.height=64;const gc=cv.getContext('2d'),gradient=gc.createLinearGradient(0,0,0,64);gradient.addColorStop(0,'#c4dadb');gradient.addColorStop(.44,'#688b96');gradient.addColorStop(.48,'#456573');gradient.addColorStop(1,'#304a56');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);gc.fillStyle='#e4f0e633';gc.beginPath();gc.moveTo(5,0);gc.lineTo(20,0);gc.lineTo(52,64);gc.lineTo(37,64);gc.fill();const glassMap=new T.CanvasTexture(cv);glassMap.colorSpace=T.SRGBColorSpace;
 const glassMat=material(0xffffff,{map:glassMap,side:T.DoubleSide,roughness:.18,metalness:.32});
 const trim=0x60716d,cream=0xe8e1c8;
 function panel(points,c){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geometry.setIndex([0,1,2,0,2,3]);geometry.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geometry.computeVertexNormals();const m=mesh(root,geometry,glassMat);for(let i=0;i<4;i++)bar(points[i],points[(i+1)%4],.012,0x41535a);return m;}
 for(const side of [-1,1]){
  const z=side*.808;
  panel([[.37,1.44,z],[.83,1.01,z],[-.12,1.01,z],[-.12,1.44,z]],glass);
  panel([[-.23,1.44,z],[-.23,1.01,z],[estate?-1.51:-1.22,1.01,z],[estate?-1.06:-.71,1.44,z]],glass);
  bar([-.18,.56,z],[ -.18,1.46,z],.013,trim);bar([.88,.53,z],[.88,.97,z],.013,trim);
  box(.20,.045,.035,cream,-.31,.93,z);box(.2,.045,.035,cream,.65,.93,z);
  box(.28,.11,.20,color,.62,1.02,side*.90,root,.045);
  box(3.08,.07,.035,trim,0,.55,side*.812);
  for(const x of [-1.22,1.22]){
   const wheel=new T.Group();root.add(wheel);wheel.position.set(x,.345,side*.80);wheels.push(wheel);
   const tire=mesh(wheel,new T.CylinderGeometry(.345,.345,.18,16),mat(0x424b4c));tire.rotation.x=Math.PI/2;
   const hub=mesh(wheel,new T.CylinderGeometry(.205,.205,.19,12),mat(0xb6bcb5));hub.rotation.x=Math.PI/2;
   for(let n=0;n<5;n++){const a=n*Math.PI*2/5;bar([Math.sin(a)*.06,Math.cos(a)*.06,side*.104],[Math.sin(a)*.175,Math.cos(a)*.175,side*.104],.016,trim,wheel);}
  }
 }
 panel([[.49,1.495,-.68],[.49,1.495,.68],[1.00,1.04,.71],[1.00,1.04,-.71]],glass);
 for(const side of [-1,1])bar([1.008,1.047,side*.10],[.97,1.083,side*.54],.009,trim);
 const backTop=estate?-1.11:-.73,backBottom=estate?-1.67:-1.29;
 panel([[backTop-.055,1.50,.66],[backTop-.055,1.50,-.66],[backBottom-.06,1.07,-.7],[backBottom-.06,1.07,.7]],glass);
 for(const end of [-1,1]){box(.07,.13,1.45,trim,end*2,.51,0);box(.025,.13,.40,cream,end*2.045,.69,0);for(const z of [-.55,.55])box(.055,.16,.31,end>0?0xf0e5b8:0xae716c,end*1.995,.80,z,root,.03);}
 for(let i=0;i<4;i++)box(.05,.018,.51,trim,2.03,.64+i*.045,0);
 batchStatic(root,new Set(wheels));
 return {root,update(distance){for(const w of wheels)w.rotation.z=-distance/.345;}};
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
  const sign=mesh(root,new T.PlaneGeometry(.72,.90),signMat,0,-.77,.02);sign.castShadow=false;
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
 const cars=[carModel(0x9ebdb8),carModel(0xd8c5a0,true)];cars.forEach(c=>root.add(c.root));
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


