import {officeConnections} from '../src/models/office-connections.js';
import {T} from '../experiments/spaces/kit.js';
import {batchStatic} from '../src/models/static-batch.js';
import {cablePath} from './cable-path.js';
import {drawOperationsScreen} from './monitor-dashboard.js';
import {bevelBox} from '../src/models/pastel-shapes.js';

// 2026-only visuals. Positions/collision volumes and NPC animation stay in space.js.
export function officeFurniture(k){
 const {world,box,mat}=k;
 const ink=0x34464e,metal=0x677b7b,wood=0xb5a38a,paper=0xf1eee2;
 mat(ink).roughness=.48;mat(metal).roughness=.45;mat(metal).metalness=.22;
 mat(wood).roughness=.74;
 const mesh=(g,m,p,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
 const group=(x,z,angle=0)=>{const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;world.add(g);return g;};
 const b=(p,w,h,d,c,x,y,z)=>box(w,h,d,c,x,y,z,p);
 function rod(p,a,b,r=.018,c=metal){const v=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(v);const o=mesh(new T.CylinderGeometry(r,r,d.length(),8),mat(c),p);o.position.copy(v.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function wire(p,points){
  const curve=cablePath(points);
  const cable=mesh(new T.TubeGeometry(curve,Math.min(64,Math.max(32,points.length*8)),.007,4,false),mat(ink),p);
  cable.name='2026-office-cable';return cable;
 }
 function canvasMaterial(draw,w=512,h=256,screen=false){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({color:0xffffff,map,roughness:screen?.32:.9,emissive:screen?0xffffff:0x000000,emissiveMap:screen?map:null,emissiveIntensity:screen?.18:0});}
 const screens=[0,1,2,3,4].map(kind=>canvasMaterial((g,w,h)=>drawOperationsScreen(g,w,h,kind),768,384,true));
 const board=canvasMaterial((g,w,h)=>{g.fillStyle='#e7e5d9';g.fillRect(0,0,w,h);g.fillStyle='#405a57';g.font='600 22px sans-serif';g.fillText('주간 업무',22,32);g.strokeStyle='#b9c4b9';g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.moveTo(18+i*95,51);g.lineTo(18+i*95,231);g.stroke();}g.font='16px sans-serif';['월','화','수','목','금'].forEach((s,i)=>g.fillText(s,52+i*95,72));for(let i=0;i<7;i++){g.fillStyle=['#d4c797','#acc1b4','#cbb8a8'][i%3];g.fillRect(25+(i%5)*95,88+Math.floor(i/5)*63,75,43);g.fillStyle='#7d8a79';g.fillRect(33+(i%5)*95,99+Math.floor(i/5)*63,48,3);g.fillRect(33+(i%5)*95,110+Math.floor(i/5)*63,34,3);}});
 function panel(p,w,h,x,y,z,m,ry=0){const o=mesh(new T.PlaneGeometry(w,h),m,p,x,y,z);o.rotation.y=ry;o.castShadow=false;return o;}
 function keyboard(p,x,y,z){b(p,.58,.025,.20,ink,x,y,z);for(let row=0;row<4;row++)for(let col=0;col<11;col++)b(p,.035,.007,.029,col%4?0xbac7c2:0x8daba2,x-.245+col*.046,y+.017,z-.071+row*.043);b(p,.22,.008,.028,0xc9d0c7,x,y+.018,z+.079);}
 function monitor(p,x,y,z,kind=0,w=.91){
  b(p,.32,.024,.24,metal,x,y,z+.035);rod(p,[x,y+.02,z],[x,y+.34,z-.04],.031);b(p,.20,.10,.06,ink,x,y+.33,z-.035);
  const screen=new T.Group();screen.position.set(x,y+.56,z);screen.rotation.x=-.045;p.add(screen);
  b(screen,w,.55,.064,ink,0,0,0);b(screen,w-.045,.027,.016,metal,0,-.25,.039);
  panel(screen,w-.07,.46,0,.014,.033,screens[kind]);b(screen,.025,.008,.006,0x9cbeaf,w*.39,-.244,.049);
  // Back shell / mount / ventilation are finished for free camera views.
  b(screen,w*.62,.27,.035,0x43545a,0,-.015,-.048);for(let i=0;i<6;i++)b(screen,.065,.006,.005,0x263b43,-.25+i*.10,.19,-.034);
  const ports={};screen.updateMatrix();
  for(const [name,px] of [['power',.11],['data',.20]]){
   b(screen,.039,.025,.035,ink,px,-.13,-.080);
   ports[name]=new T.Vector3(px,-.13,-.098).applyMatrix4(screen.matrix).toArray();
  }
  return ports;
 }
 function papers(p,x,y,z,variant=0){for(let i=0;i<4;i++){const o=b(p,.27,.009,.35,paper,x+(i%2)*.008,y+i*.009,z);o.rotation.y=variant*.07;}for(let i=0;i<4;i++)b(p,.17-i*.015,.002,.008,0x9dada6,x,y+.035,z-.09+i*.04);}
 function tray(p,x,y,z){for(let j=0;j<2;j++){b(p,.34,.017,.40,metal,x,y+j*.075,z);for(const dx of [-.17,.17])b(p,.014,.06,.4,metal,x+dx,y+.027+j*.075,z);}papers(p,x,y+.091,z);}
 function mug(p,x,y,z,color){const m=mesh(new T.CylinderGeometry(.07,.064,.14,12),mat(color),p,x,y,z);mesh(new T.CylinderGeometry(.053,.053,.004,12),mat(0x594d40),p,x,y+.072,z);const h=mesh(new T.TorusGeometry(.054,.012,5,10),mat(color),p,x+.073,y,z);h.rotation.y=Math.PI/2;return m;}
 function mouse(p,x,y,z){const m=mesh(new T.SphereGeometry(1,10,6),mat(0x667d7a),p,x,y,z);m.scale.set(.047,.028,.072);b(p,.003,.004,.034,ink,x,y+.026,z-.016);}
 function tower(p,x,z){b(p,.23,.50,.41,ink,x,.405,z);b(p,.204,.46,.017,0x536267,x,.405,z+.211);for(let j=0;j<6;j++)b(p,.14,.009,.004,0x2d4148,x,.25+j*.023,z+.223);b(p,.022,.022,.008,0x9fbcb1,x-.065,.586,z+.224);for(const xx of [-.08,.08])b(p,.04,.035,.31,metal,x+xx,.14,z);
  b(p,.18,.43,.012,metal,x,.405,z-.209);
  const ports={data:[]};for(const [name,yy] of [['data',.55],['data',.48],['power',.29]]){b(p,.045,.029,.032,ink,x,yy,z-.229);const pos=[x,yy,z-.247];if(name==='data')ports.data.push(pos);else ports.power=pos;}
  return ports;
 }
 function connectWorkstation(p,monitors,towerPorts,w,d,y){
  const sx=w/2-.63,sz=-.30,c=officeConnections(k,p);
  const manager=monitors.length===2,floor=c.floorBox(sx-.44,-.08,manager?1:2);
  const strip=manager?c.strip(sx,sz,3):null,sockets=strip?.power??floor.power;
  const wire=(p,points,name='video',r=.0045,color=ink)=>c.cable(name,points,cablePath,r,color);
  if(strip){const end=floor.power[0];wire(p,[strip.supply,[sx-.23,.158,sz],[end[0],.158,-.25],[end[0],.24,end[2]],end],'strip-supply');}
  const lan=c.rj45([towerPorts.power[0],.395,-.216],[0,0,-1],'PC-RJ45'),end=floor.lan;
  wire(p,[lan,[lan[0],.395,-.32],[lan[0],.17,-.40],[end[0],.17,-.40],[end[0],.17,-.22],[end[0],.24,end[2]],end],'PC-LAN',.0035,0x647d7c);
  const rear=-d/2-.075;
  monitors.forEach((ports,i)=>{
   for(const kind of ['data','power']){
    const start=ports[kind],side=kind==='data'?0:.032,edge=rear-side;
    const path=[start,[start[0],start[1],start[2]-.055],[start[0],y+.15,edge],[start[0],y-.41,edge]];
    if(kind==='data'){
     const end=towerPorts.data[i];path.push([end[0],y-.41,edge],[end[0],end[1],edge],[end[0],end[1],end[2]-.045],end);
    }else{
     const end=sockets[i];path.push([end[0],y-.41,edge],[end[0],.30,edge],[end[0],.30,end[2]],end);
    }
    wire(p,path,'monitor-'+kind+'-'+i,kind==='data'?.007:.0045);
   }
  });
  const start=towerPorts.power,powerEnd=sockets[monitors.length];wire(p,[start,[start[0],start[1],-.31],[start[0]-.07,.28,-.38],[powerEnd[0],.28,-.38],[powerEnd[0],.28,powerEnd[2]],powerEnd],'tower-power');
 }
 function chair(x,z,angle=0,color=0x627f81){
  const p=group(x,z,angle);rod(p,[0,.18,0],[0,.55,0],.04);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,xx=Math.sin(a)*.25,zz=Math.cos(a)*.25;rod(p,[0,.22,0],[xx,.17,zz],.022);const wheel=mesh(new T.CylinderGeometry(.046,.046,.046,8),mat(ink),p,xx,.145,zz);wheel.rotation.z=Math.PI/2;}
  b(p,.53,.10,.49,color,0,.56,0);b(p,.45,.035,.40,ink,0,.493,0);
  // Gently curved back shell, with distinct inset cushion and lumbar strip.
  const g=bevelBox(.54,.62,.085,.035),a=g.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,a.getZ(i)+.05*(a.getX(i)/.27)**2);g.computeVertexNormals();const back=mesh(g,mat(ink),p,0,.92,-.23);back.rotation.x=-.075;
  b(p,.465,.48,.055,color,0,.944,-.176).rotation.x=-.075;b(p,.40,.065,.062,0x7f9995,0,.745,-.16);
  for(const s of [-1,1]){rod(p,[s*.245,.53,-.06],[s*.26,.77,-.04],.017);b(p,.07,.045,.28,ink,s*.26,.795,.025);}
  return p;
 }
 function workstation(x,z,{manager=false,variant=0}={}){
  const p=group(x,z,manager?Math.PI:0),w=manager?3.5:1.8,d=manager?1.25:.8,y=manager?.94:.9;
  b(p,w,.065,d,wood,0,y,0);b(p,w-.025,.025,d-.02,0x8f8675,0,y-.048,0);
  for(const s of [-1,1]){const xx=s*(w/2-.17);rod(p,[xx,.15,-d*.31],[xx,y-.08,-d*.31],.037);rod(p,[xx,.15,d*.31],[xx,y-.08,d*.31],.037);rod(p,[xx,.16,-d*.35],[xx,.16,d*.35],.03);b(p,.11,.045,d*.8,ink,xx,.135,0);}
  b(p,w-.4,.25,.03,0xb9c6bd,0,y-.21,-d*.36);b(p,w-.52,.06,.16,metal,0,y-.11,-d*.27);
  const top=y+.035;
  // Both screens face the chair, including the manager's rear chair.
  const monitors=manager?[monitor(p,-.60,top,-.30,0),monitor(p,.51,top,-.30,1)]:[monitor(p,variant===1?-.10:0,top,-.14,2+variant,.76)];
  b(p,.88,.005,.34,0x718e87,manager?0:-.08,top+.003,manager?.28:.18);
  keyboard(p,manager?0:-.1,top+.019,manager?.28:.18);mouse(p,manager?.42:.34,top+.027,manager?.28:.20);
  const towerPorts=tower(p,w/2-.33,0);connectWorkstation(p,monitors,towerPorts,w,d,y);
  if(manager){tray(p,1.32,top+.025,.22);mug(p,-1.38,top+.075,.22,0x829d91);papers(p,-1.15,top+.012,-.26);}
  else if(variant===0){mug(p,-.62,top+.075,.22,0xbd9b84);papers(p,.63,top+.012,.12);}
  else if(variant===1){tray(p,.59,top+.025,.1);b(p,.17,.016,.30,0x3c5158,-.60,top+.014,.23);}
  else{papers(p,-.63,top+.012,.12,1);mug(p,.63,top+.075,.20,0x99ada1);}
  const seat=chair(x,manager?z-1.3:z+.9,manager?0:Math.PI,variant===1?0x8b9085:0x627f81);
  if(manager){batchStatic(seat,new Set());k.dynamic.add(seat);}return seat;
 }
 function cabinet(x,z){const p=group(x,z,Math.PI);b(p,1.35,1.12,.5,0xb0bfb5,0,.73,0);b(p,1.39,.065,.54,wood,0,1.325,0);b(p,1.2,.10,.44,metal,0,.19,0);
  for(let i=0;i<3;i++){const y=.41+i*.32;b(p,1.25,.286,.034,0xc6d0c6,0,y,.266);rod(p,[-.15,y+.045,.292],[.15,y+.045,.292],.016);for(const dx of [-.14,.14])rod(p,[dx,y+.045,.28],[dx,y+.045,.319],.011);}
  for(let i=0;i<5;i++){const x=-.49+i*.18,h=.32+(i%2)*.035;b(p,.125,h,.26,[0x758d90,0xbdad91,0x96a99a][i%3],x,1.37+h/2,-.03);b(p,.080,.115,.004,paper,x,1.55,.104);b(p,.025,.025,.006,metal,x,1.43,.107);}papers(p,.48,1.37,.035);
 }
 function finishes(){
  // Subtle 128px woven carpet, repeated; no external assets or additional lights.
  const carpet=canvasMaterial((g,w,h)=>{g.fillStyle='#829392';g.fillRect(0,0,w,h);for(let i=0;i<w;i+=3){g.fillStyle=i%2?'#849493':'#819291';g.fillRect(i,0,1,h);}for(let y=0;y<h;y+=4){g.fillStyle='rgba(221,229,220,.03)';g.fillRect(0,y,w,1);}g.fillStyle='#7c8e8d';g.fillRect(0,0,1,h);g.fillRect(0,0,w,1);},128,128);carpet.map.wrapS=carpet.map.wrapT=T.RepeatWrapping;carpet.map.repeat.set(6,9);
  const floor=panel(world,5.88,8.86,-4,.123,-1.5,carpet);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
  // Staff floor retains light resilient flooring; less contrast in joints than the old planks.
  b(world,7.82,.012,11.78,0xc8c9bb,2.99,.121,0);b(world,5.9,.012,2.8,0xc8c9bb,-4,.121,4.51);
  for(let x=-.8;x<7;x+=1.25)b(world,.008,.003,11.78,0xb9bfb3,x,.129,0);
  for(let z=-5.5;z<6;z+=1.25)b(world,7.82,.003,.008,0xb9bfb3,2.99,.129,z);
  // Wall plinths, ceiling joints and recessed light housings close the architecture visually.
  for(const x of [-6.89,6.89]){b(world,.055,.18,11.82,0x9caea6,x,.24,0);b(world,.12,.12,11.8,0xc6d0c6,x,4.35,0);}
  b(world,13.8,.18,.055,0x9caea6,0,.24,-5.89);
  b(world,9.86,.18,.055,0x9caea6,-2,.24,5.89);b(world,2.25,.18,.055,0x9caea6,5.8,.24,5.89);
  for(let x=-6;x<7;x+=2)b(world,.012,.01,11.8,0xc3cdc6,x,4.408,0).castShadow=false;
  for(let z=-5;z<6;z+=2)b(world,13.8,.01,.012,0xc3cdc6,0,4.408,z).castShadow=false;
  for(const x of [-4,0,4])for(const z of [-3,2]){b(world,1.72,.075,.51,metal,x,4.365,z).castShadow=false;b(world,1.58,.016,.36,0xf5edd6,x,4.317,z).castShadow=false;}
  // One physical pinboard instead of large story text on walls or windows.
  const p=group(-6.855,.1,Math.PI/2);b(p,2.0,1.04,.065,wood,0,2.22,0);panel(p,1.91,.95,0,2.22,.034,board);b(p,1.6,.035,.095,metal,0,1.65,.05);
  for(let i=0;i<3;i++)b(p,.19,.025,.025,[0x425f61,0x9b7768,0x7c8f76][i],-.4+i*.25,1.685,.069);
 }
 return {workstation,cabinet,finishes};
}
