import {kit,T,C} from '../experiments/spaces/kit.js';
import {modernCar,copyCar,poseCar} from './car.js';
import {ROAD,LIGHTS,createTraffic,advanceTraffic,signalAt} from './traffic.js';
export const seoulCity={spawn:{x:-11,z:8.7},create(ctx){
 const k=kit(ctx,{w:28,d:22,indoor:false}),{box,block,world,scene}=k;
 scene.background=new T.Color(0xd5dfe2);scene.fog=new T.Fog(0xd5dfe2,48,110);
 scene.children.filter(n=>n.isLight).forEach(n=>{if(n.isHemisphereLight){n.intensity=1.65;n.groundColor.setHex(0x899394);}else{n.intensity=1.9;n.position.set(-12,22,9);}});
 box(270,.06,48,0xb9c3c2,0,.07,0).castShadow=false;
 box(270,.025,13.6,0x626d74,0,.105,0).castShadow=false;
 function roadStrip(w,h,d,color,y,z,gap=4.2){
  let start=-135;for(const c of [...ROAD.crossings,135+gap]){const end=c-gap;if(end>start)box(end-start,h,d,color,(start+end)/2,y,z).castShadow=false;start=c+gap;}
 }
 for(const crossing of ROAD.crossings){box(8.4,.025,48,0x626d74,crossing,.105,0).castShadow=false;}
 for(const side of [-1,1]){
  roadStrip(270,.06,4.5,0xc5c9c1,.115,side*9.1);
  roadStrip(270,.095,.15,0xe1dfd0,.125,side*6.87);
  roadStrip(270,.012,.08,0xf0e8ce,.126,side*6.55,8.5);
  roadStrip(270,.01,.09,0xd7b750,.125,side*.11,4.2);
  for(let x=-126;x<=126;x+=6)if(ROAD.crossings.every(c=>Math.abs(x-c)>9))box(2.7,.01,.11,0xe1dfd5,x,.125,side*3.4).castShadow=false;
  for(let x=-120;x<=120;x+=3)if(ROAD.crossings.every(c=>Math.abs(x-c)>4.3))box(.025,.006,4.2,0xaeb7b1,x,.148,side*9.1).castShadow=false;
 }
 const signals=[];
 function pedestrianIcon(walking){const cv=document.createElement('canvas');cv.width=cv.height=96;const g=cv.getContext('2d');g.fillStyle='#ffffff';g.beginPath();g.arc(48,18,8,0,Math.PI*2);g.fill();g.strokeStyle='#ffffff';g.lineWidth=9;g.lineCap='round';g.lineJoin='round';g.beginPath();if(walking){g.moveTo(48,32);g.lineTo(42,53);g.lineTo(26,80);g.moveTo(43,53);g.lineTo(66,77);g.moveTo(46,34);g.lineTo(31,46);g.lineTo(24,60);g.moveTo(46,35);g.lineTo(60,49);g.lineTo(73,49);}else{g.moveTo(48,31);g.lineTo(48,56);g.moveTo(33,53);g.lineTo(33,34);g.lineTo(63,34);g.lineTo(63,53);g.moveTo(41,55);g.lineTo(41,80);g.moveTo(55,55);g.lineTo(55,80);}g.stroke();const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;return texture;}
 const pedMaps=[pedestrianIcon(false),pedestrianIcon(true)];
 function signalLamp(x,y,z,dir){const rim=k.cyl(.20,.11,0x202b2e,x,y,z);rim.rotation.z=Math.PI/2;const m=new T.Mesh(new T.CircleGeometry(.155,16),new T.MeshBasicMaterial({color:0x263531}));m.rotation.y=-dir*Math.PI/2;m.position.set(x-dir*.07,y,z);world.add(m);k.dynamic.add(m);box(.25,.065,.43,0x28393b,x-dir*.07,y+.21,z);return m;}
 // Reuse the Korean signal models at the background junctions only.
 function signalHead(crossing,dir,axis){
  const first=world.children.length,poleX=-dir*(axis?12.1:9.3),poleZ=dir*(axis?4.65:7.35),laneZ=dir*(axis?2.4:3.6);
  k.cyl(.085,5.2,0x617278,poleX,2.71,poleZ);
  box(.11,.12,axis?3.4:4.6,0x65757b,poleX,5.38,(poleZ+laneZ)/2);box(.24,.58,1.90,0x26383b,poleX,5.1,laneZ);
  const lamps=['red','amber','green'].map((_,i)=>signalLamp(poleX-dir*.15,5.1,laneZ+(i-1)*.58*dir,dir));
  box(.49,1.03,.30,0x29383b,poleX,2.72,poleZ);
  const ped=pedMaps.map((map,i)=>{const m=new T.Mesh(new T.PlaneGeometry(.40,.40),new T.MeshBasicMaterial({map,color:0x25332e,transparent:true,depthWrite:false}));m.position.set(poleX,2.96-i*.48,poleZ-dir*.158);if(dir>0)m.rotation.y=Math.PI;world.add(m);k.dynamic.add(m);return m;});
  for(const n of world.children.slice(first)){if(axis){n.position.applyAxisAngle(new T.Vector3(0,1,0),Math.PI/2);n.rotateOnWorldAxis(new T.Vector3(0,1,0),Math.PI/2);}n.position.x+=crossing;}
  signals.push({lamps,ped,axis});
 }
 for(const crossing of ROAD.crossings){
  for(const dir of [-1,1]){
   // Main-road crossings sit outside the junction, with approach stop lines upstream.
   for(let z=-6.4;z<6.7;z+=.72)box(3.4,.012,.38,0xece9db,crossing-dir*6.5,.139,z).castShadow=false;
   box(.17,.012,6.65,0xf0ead8,crossing-dir*8.75,.14,dir*3.4).castShadow=false;
   for(let x=-3.8;x<4.0;x+=.72)box(.38,.012,3.4,0xece9db,crossing+x,.139,dir*9.3).castShadow=false;
   box(4.05,.012,.17,0xf0ead8,crossing-dir*2.1,.14,dir*11.55).castShadow=false;
   for(const offset of [-.11,.11])box(.09,.012,11.9,0xd7b750,crossing+offset,.13,dir*18.05).castShadow=false;
   signalHead(crossing,dir,false);signalHead(crossing,dir,true);
  }
 }
 const colors=[0xb6c4c5,0xa7b7ba,0xc4bbae,0x9daeb4,0xb5b7ae];
 function building(x,z,index,background=false){const h=background?12+(index%5)*3.1:10+(index%4)*3.2,w=background?9:6.8,d=7,side=z<0?1:-1,front=z+side*d/2,entrance=!background&&z<0&&Math.abs(x-8.2)<.1;
  if(entrance){const wing=(w-2.2)/2;for(const sign of [-1,1])box(wing,3.15,d,colors[index%5],x+sign*(1.1+wing/2),1.725,z);box(w,h-3.15,d,colors[index%5],x,.15+3.15+(h-3.15)/2,z);
   // The facade has a real opening: recessed vestibule, side returns and threshold.
   box(2.2,.10,1.02,0xc5c4b5,x,.18,front-.40);for(const sign of [-1,1])box(.12,2.96,.86,0x788b8e,x+sign*1.04,1.65,front-.34);
   box(2.2,.13,.90,0xc2c9bf,x,3.07,front-.32);box(1.96,2.76,.13,0x344d56,x,1.59,front-.78);box(1.64,2.43,.05,0x7f9699,x,1.58,front-.695);
   for(const sign of [-1,1])box(.095,2.87,.16,0xd3c5a6,x+sign*.93,1.60,front-.68);box(1.96,.09,.16,0xd3c5a6,x,3.00,front-.68);box(.05,.42,.13,0xe5d9bd,x+.64,1.43,front-.59);
   box(1.62,.05,.06,0x526a70,x,1.0,front-.66);k.label('새로운 시작',x,3.02,front+.17,2.15,'#425a63');
  }else box(w,h,d,colors[index%5],x,.15+h/2,z);
  box(w+.25,.24,d+.25,0x74868a,x,h+.25,z);if(!entrance)box(w,.32,.25,0xd9d8c8,x,3.22,front+.08*side);
  if(!background){block(x,z,w,d,h);for(const dx of [-2.5,0,2.5]){if(entrance&&dx===0)continue;box(1.9,2.7,.08,0x4d6871,x+dx,1.6,front+.055*side);box(.045,2.72,.12,0xa4b4b5,x+dx,1.6,front+.12*side);}box(w,.20,.72,0x617980,x,3.5,front+.32*side);
   if(!entrance){const label=k.label(['커피 & 베이커리','WORK SPACE','동네 서점','LIVING','SEOUL OFFICE'][index%5],x,3.02,front+.18*side,4.6,'#425a63');if(side<0)label.rotation.y=Math.PI;}}
  for(let y=4.3;y<h-1;y+=2.05)for(let dx=-w/2+1;dx<w/2;dx+=2.2){box(1.34,1.26,.08,0x66828a,x+dx,y,front+.065*side);box(1.48,.065,.2,0xc7d0cc,x+dx,y-.66,front+.12*side);}
  if(index%2===0)box(w*.64,.55,d*.6,0x839497,x,h+.65,z);
 }
 for(const side of [-1,1])for(let i=0;i<7;i++)building((i-3)*8.2,side*15,i+(side>0?3:0));
 for(const side of [-1,1])for(let i=0;i<5;i++){building(-42-i*12,side*17,i+4,true);building(42+i*12,side*17,i+7,true);}
 for(const side of [-1,1])for(const x of [-23,-14,1,15,26]){
  const z=side*10;k.cyl(.14,2.8,0x827f68,x,1.52,z);for(let j=0;j<3;j++){const m=new T.Mesh(new T.IcosahedronGeometry(1.03,1),k.mat(j%2?0x879d87:0x789181));m.position.set(x+(j-1)*.44,3.35+j*.24,z);m.scale.y=1.2;world.add(m);}block(x,z,.65,.65,4.7);box(1.55,.08,1.55,0x9aa598,x,.16,z);
 }
 for(const side of [-1,1])for(const x of [-18,4,20]){const z=side*9.8;box(1.8,.1,.48,0x919a88,x,.61,z);for(const dx of [-.68,.68])box(.08,.46,.36,0x5b7177,x+dx,.37,z);box(1.8,.44,.075,0x919a88,x,.87,z+side*.23);block(x,z,1.85,.65,1.12);}
 const exit={x:8.2,z:-10.2,y:1.3};
 const exitGlow=new T.Group();exitGlow.position.set(exit.x,.17,exit.z);world.add(exitGlow);k.dynamic.add(exitGlow);exitGlow.visible=false;
 const exitRing=new T.Mesh(new T.TorusGeometry(.65,.045,6,32),new T.MeshBasicMaterial({color:0xffdf98}));exitRing.rotation.x=Math.PI/2;exitGlow.add(exitRing);
 const exitBeam=new T.Mesh(new T.CylinderGeometry(.18,.48,2.7,10,1,true),new T.MeshBasicMaterial({color:0xffe7b5,transparent:true,opacity:.17,depthWrite:false,side:T.DoubleSide}));exitBeam.position.y=1.35;exitGlow.add(exitBeam);
 // Twenty vehicles across the full background loop; only four shared model variants.
 const templates=[0xc1c8c6,0x738d98,0xb4a693,0x78817d].map((color,i)=>modernCar(color,i===3));
 // Keep prototypes unposed: never clone an already rotated, live vehicle.
 const cars=createTraffic().map(c=>{const model=copyCar(templates[c.variant]);world.add(model.root);k.dynamic.add(model.root);poseCar(model,c);return {...c,model};});
 const lights=LIGHTS.map(l=>{const root=new T.Group();root.position.set(l.x,.16,l.z);world.add(root);k.dynamic.add(root);
  const ring=new T.Mesh(new T.TorusGeometry(.52,.027,6,28),new T.MeshBasicMaterial({color:0xf8de9f}));ring.rotation.x=Math.PI/2;root.add(ring);
  const gem=new T.Mesh(new T.OctahedronGeometry(.22),new T.MeshStandardMaterial({color:0xffe7ad,emissive:0xf1c363,emissiveIntensity:.75,roughness:.55}));gem.position.y=.68;root.add(gem);
  const beam=new T.Mesh(new T.CylinderGeometry(.055,.26,1.65,10,1,true),new T.MeshBasicMaterial({color:0xffdf98,opacity:.13,transparent:true,depthWrite:false,side:T.DoubleSide}));beam.position.y=.83;root.add(beam);return {...l,model:root,gem};});
 const f={cars,lights,exit,exitGlow,returnPlayer(p){ctx.controls.respawn(p);},signal:signalAt(0),reaction:0,events:[],emit(type,detail={}){const e={type,...detail};this.events.push(e);if(this.events.length>24)this.events.shift();scene.dispatchEvent({type:'seoul-audio-event',detail:e});}};
 let trafficMs=0;const v=k.finalize({features:f,updateAmbient({dt}){if(dt<=0)return;trafficMs+=dt*1000;f.signal=advanceTraffic(cars,dt,trafficMs);
  f.resolveTraffic?.();
  for(const car of cars)poseCar(car.model,f.trafficPresentation?.get(car.id)??car);
  for(const s of signals){s.lamps.forEach((m,i)=>m.material.color.setHex(['red','amber','green'][i]===(s.axis?f.signal.crossCar:f.signal.car)?[0xf25c4b,0xffb844,0x4ce388][i]:0x283b40));s.ped[0].material.color.setHex(f.signal.pedestrian?0x25302c:0xff5547);s.ped[1].material.color.setHex(f.signal.pedestrian?0x57eb91:0x25302c);}
  for(const l of lights){l.gem.rotation.y=trafficMs*.001;l.gem.position.y=.68+Math.sin(trafficMs*.002)*.09;}
  for(const b of ctx.player.playerView.adapter?.skeleton?.bones??[])if(b.name==='head')b.rotation.x+=f.reaction*.18;
 }});return v;
}};
