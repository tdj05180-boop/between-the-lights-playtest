import {P,T} from './geometry.js';

// Static dock truck: same cargo box and dock anchors, corrected cab/wheel assembly.
export function warehouseTruck(k,x,z,color,{open=true,foldDoors=false}={},loadPallet){
 const g=k.group(x,-1.04,z);g.name='WarehouseDockTruck';
 const paint=k.mat(color,{roughness:.43,metalness:.16}),metal=k.mat(P.steel,{roughness:.4,metalness:.48});
 const part=(w,h,d,c,x,y,z,p=g,r=.018)=>k.box(w,h,d,c,x,y,z,p,r);
 for(const dx of [-.8,.8])part(.16,.22,8.2,P.dark,dx,.72,-2.8);
 part(2.52,.2,6.5,metal,0,1.14,-1.2);part(2.38,.07,6.35,P.wood,0,1.28,-1.2);
 for(const dx of [-1.26,1.26]){
  part(.09,2.7,6.5,paint,dx,2.65,-1.2);part(.13,.1,6.55,P.wallLight,dx,4.02,-1.2);part(.12,.11,6.55,metal,dx,1.38,-1.2);
  for(let s=-4.25;s<2;s+=.38)part(.018,2.48,.022,P.wallLight,dx*1.041,2.7,s,g,.002);
 }
 part(2.6,.1,6.6,P.wallLight,0,4.05,-1.2);part(2.5,2.65,.08,paint,0,2.68,-4.45);
 const wheelZ=[-6.25,-1.05,.55];
 for(const dx of [-1.17,1.17])for(const dz of wheelZ){
  const wheel=k.cyl(.48,.27,P.rubber,dx,.46,dz,g,24);wheel.name='truck-tyre';wheel.rotation.z=Math.PI/2;
  const rim=k.cyl(.28,.022,P.steel,dx+Math.sign(dx)*.14,.46,dz,g,20);rim.rotation.z=Math.PI/2;
  const hub=k.cyl(.105,.052,P.dark,dx+Math.sign(dx)*.158,.46,dz,g,12);hub.rotation.z=Math.PI/2;
  for(let i=0;i<6;i++){const a=i*Math.PI/3,b=k.cyl(.026,.025,P.dark,dx+Math.sign(dx)*.157,.46+Math.sin(a)*.205,dz+Math.cos(a)*.205,g,7);b.rotation.z=Math.PI/2;}
  const arch=new T.Mesh(new T.TorusGeometry(dz<-4?.58:.555,.07,6,20,Math.PI),paint);arch.rotation.y=Math.PI/2;arch.position.set(Math.sign(dx)*1.27,.5,dz);g.add(arch);
  if(dz>-4)part(.28,.36,.04,P.rubber,dx,.43,dz+.52);
 }
 const cab=k.group(0,0,-5.65,g),shape=new T.Shape(),a=Math.asin(.22/.57);
 // The lower side follows the wheel opening, rather than covering the tyre.
 shape.moveTo(-1.1,.72);shape.lineTo(.6-.57*Math.cos(a),.72);
 for(let i=0;i<=16;i++){const t=Math.PI-a-(Math.PI-2*a)*i/16;shape.lineTo(.6+.57*Math.cos(t),.5+.57*Math.sin(t));}
 shape.lineTo(1.25,.72);shape.lineTo(1.25,1.65);shape.lineTo(.75,3.05);shape.lineTo(-1.1,3.05);shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:2.35,bevelEnabled:true,bevelSize:.035,bevelThickness:.055,bevelSegments:3,steps:1,curveSegments:16});geo.translate(0,0,-1.175);geo.rotateY(Math.PI/2);
 const body=new T.Mesh(geo,paint);body.castShadow=body.receiveShadow=true;cab.add(body);
 const glass=k.mat(0x779497,{roughness:.24,metalness:.16,side:T.DoubleSide});
 function quad(points,mat){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();const n=new T.Mesh(geo,mat);cab.add(n);return n;}
 // Windshield is outside the actual sloping metal face, with attached seals.
 const front=[[-1.035,1.99,-1.183],[1.035,1.99,-1.183],[1.035,2.86,-.872],[-1.035,2.86,-.872]];
 quad(front,glass).name='truck-windshield';
 for(let i=0;i<4;i++)k.beam(front[i],front[(i+1)%4],.045,.035,P.dark,cab);
 for(const dx of [-.68,.38])k.beam([dx,2.005,-1.202],[dx+.32,2.08,-1.175],.022,.02,P.dark,cab);
 // Restrained sky bands read as glass without exposing an empty cab interior.
 quad([[-1.005,2.64,-.954],[1.005,2.64,-.954],[1.005,2.78,-.904],[-1.005,2.78,-.904]],k.mat(0xa4b8b7,{roughness:.4,side:T.DoubleSide}));
 for(const dx of [-1.235,1.235]){
  const points=[[dx,1.93,.85],[dx,1.93,-1.09],[dx,2.84,-.78],[dx,2.84,.85]];quad(points,glass);
  for(let i=0;i<4;i++)k.beam(points[i],points[(i+1)%4],.025,.035,P.dark,cab);
  part(.016,.92,.018,P.dark,dx,1.24,.84,cab,.002);part(.045,.055,.22,P.dark,dx,1.71,.55,cab,.009);
  k.beam([dx,2.08,-.92],[dx+Math.sign(dx)*.20,2.12,-1.01],.037,.037,P.dark,cab);
  part(.11,.32,.20,P.dark,dx+Math.sign(dx)*.22,2.12,-1.01,cab,.03);
  part(.012,.26,.15,glass,dx+Math.sign(dx)*.279,2.12,-1.01,cab,.002);
  part(.25,.095,.48,metal,Math.sign(dx)*1.21,.7,.43,cab,.012);
  for(const sy of [.665,.708])part(.255,.015,.42,P.dark,Math.sign(dx)*1.212,sy,.43,cab,.002);
 }
 part(2.43,.23,.28,P.wallLight,0,.83,-1.25,cab,.045);
 part(1.15,.32,.07,P.dark,0,1.35,-1.295,cab,.02);
 for(const dx of [-.88,.88]){part(.35,.24,.08,P.wallLight,dx,1.3,-1.30,cab,.04);part(.10,.13,.015,0xc5a36c,dx+Math.sign(dx)*.105,1.3,-1.346,cab,.01);}
 for(let i=0;i<4;i++)part(.98,.022,.018,metal,0,1.22+i*.07,-1.335,cab,.004);
 part(2.7,.18,.32,P.dark,0,.91,2.18);
 // The rear underride bar is supported by both chassis rails, not floating
 // beneath the loading deck. Keep the deck, doors and dock clearance intact.
 for(const dx of [-.8,.8])part(.13,.13,1.02,P.dark,dx,.86,1.69).name='truck-rear-bumper-support';
 for(const dx of [-1.1,1.1]){
  part(.22,.14,.04,P.red,dx,1.02,2.36);
  // Folded inbound doors must sit outside the corrugated body, including the
  // locking rods on their inner faces. An offset hinge bridges the old anchor.
  const hingeX=foldDoors?1.44:1.28;
  const door=k.group(dx<0?-hingeX:hingeX,1.4,2.1,g);door.name='truck-cargo-door';door.rotation.y=foldDoors?(dx<0?Math.PI/2:-Math.PI/2):(dx<0?-Math.PI*.82:Math.PI*.82);const sign=dx<0?1:-1;
  part(1.22,2.48,.08,paint,sign*.61,1.24,0,door);
  for(const shift of [.3,.94])part(.045,2.25,.05,P.steel,sign*shift,1.23,.07,door);
  for(const y of [.25,1.2,2.15])part(.2,.12,.13,P.steel,0,y,0,door);
  if(foldDoors)for(const y of [.25,1.2,2.15]){
   part(.23,.10,.14,P.steel,Math.sign(dx)*1.335,1.4+y,2.11);
   const pin=k.cyl(.035,.18,P.steel,Math.sign(dx)*hingeX,1.4+y,2.1,g,10);pin.name='truck-offset-hinge';
  }
 }
 if(open&&loadPallet){const p=loadPallet(k,.02,-2.7,{stack:2,color:P.card,parent:g});p.position.y=1.315-.045;}
 g.userData.structure={wheelZ,frontWheelCabZ:-.6,tyreRadius:.48,tyreBottom:-1.06,roadTop:-1.06,windshieldOutsideBody:true};
 return g;
}
