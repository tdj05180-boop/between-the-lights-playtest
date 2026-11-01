import {T,P} from './geometry.js';
export function warehouseForklift(k,x,z){
 const g=k.group(x,.07,z);g.name='WarehouseForklift';g.rotation.y=-.7;
 const b=(w,h,d,c,x,y,z,r=.025)=>k.box(w,h,d,c,x,y,z,g,r);
 // Sloping pressed-steel hood, not a rectangular timber block. The profile
 // stays inside the old body envelope and leaves the original wheels in place.
 const profile=new T.Shape();profile.moveTo(-.87,.46);profile.lineTo(.87,.46);profile.lineTo(.87,.83);profile.quadraticCurveTo(.87,.95,.69,.96);profile.lineTo(-.66,.985);profile.quadraticCurveTo(-.87,.985,-.87,.82);profile.closePath();
 const bodyGeo=new T.ExtrudeGeometry(profile,{depth:1.12,steps:1,curveSegments:5,bevelEnabled:true,bevelThickness:.03,bevelSize:.02,bevelSegments:2});
 const bp=bodyGeo.attributes.position;for(let i=0;i<bp.count;i++){const u=bp.getX(i),v=bp.getY(i),w=bp.getZ(i);bp.setXYZ(i,w-.56,v,-u);}bodyGeo.computeVertexNormals();bodyGeo.clearGroups();
 const bodyMat=new T.MeshStandardMaterial({color:0xa69468,roughness:.56,metalness:.16}),body=new T.Mesh(bodyGeo,bodyMat);body.castShadow=body.receiveShadow=true;g.add(body);
 b(1.2,.61,.64,P.green,0,.91,.74,.14);
 for(const side of [-1,1]){
  b(.025,.27,.63,0x9b885f,side*.59,.80,.03,.012);
  b(.18,.035,.38,P.dark,side*.51,.52,-.14,.008);
  for(let j=0;j<4;j++)b(.15,.009,.016,P.steel,side*.51,.542,-.26+j*.073,.002);
  b(.018,.021,.42,P.frame,side*.60,.958,.04,.004);
 }
 b(1.08,.07,.65,P.dark,0,1.055,-.28);b(.65,.075,.43,P.frame,0,1.09,.28);
 for(const dx of [-.53,.53])for(const dz of [-.55,.65]){
  const w=k.cyl(.31,.22,P.rubber,dx,.35,dz,g,20);w.rotation.z=Math.PI/2;
  const rim=k.cyl(.16,.025,P.steel,dx+Math.sign(dx)*.116,.35,dz,g,12);rim.rotation.z=Math.PI/2;
  const hub=k.cyl(.07,.045,P.dark,dx+Math.sign(dx)*.13,.35,dz,g,10);hub.rotation.z=Math.PI/2;
 }
 b(.57,.14,.50,P.dark,0,1.18,.08,.055);const back=b(.56,.54,.12,P.dark,0,1.48,.35,.045);back.rotation.x=-.1;
 for(const dx of [-.5,.5])for(const dz of [-.45,.58])b(.065,1.5,.065,P.frame,dx,1.9,dz,.009);
 // Open overhead guard, supported by the four existing uprights.
 for(const dx of [-.59,.59])b(.075,.095,1.5,P.frame,dx,2.7,.05,.012);
 for(const dz of [-.68,.78])b(1.23,.095,.075,P.frame,0,2.7,dz,.012);
 for(const dx of [-.36,-.12,.12,.36])b(.045,.055,1.39,P.frame,dx,2.71,.05,.008);
 const column=k.beam([0,1.10,-.42],[0,1.50,-.52],.07,.07,P.dark,g);
 const steering=new T.Mesh(new T.TorusGeometry(.18,.018,6,20),k.mat(P.rubber));steering.rotation.x=Math.PI/2-.35;steering.position.set(0,1.52,-.525);g.add(steering);
 for(const a of [0,Math.PI*.67,Math.PI*1.33])k.beam([0,1.52,-.525],[Math.cos(a)*.16,1.52+Math.sin(a)*.055,-.525+Math.sin(a)*.15],.018,.018,P.dark,g);
 for(const dx of [.28,.37]){k.beam([dx,1.13,-.18],[dx,1.39,-.28],.025,.025,P.steel,g);const knob=new T.Mesh(new T.SphereGeometry(.038,8,6),k.mat(P.dark));knob.position.set(dx,1.4,-.28);g.add(knob);}
 b(.68,.18,.07,P.frame,0,1.33,-.61);b(.22,.075,.012,P.wallLight,-.1,1.35,-.568,.004);
 for(const dx of [-.45,.45]){b(.12,2.5,.12,P.dark,dx,1.35,-1,.009);b(.045,2.32,.035,P.steel,dx,1.35,-1.078,.004);b(.18,.075,1.2,P.steel,dx,.24,-1.6,.012);}
 b(1.05,.28,.14,P.dark,0,.52,-1.08,.01);
 const ram=k.cyl(.055,1.35,P.steel,0,1.30,-.96,g,12);k.cyl(.085,.8,P.dark,0,.67,-.96,g,12);
 for(const dx of [-.22,.22])b(.018,1.98,.02,P.steel,dx,1.30,-1.095,.003);
 for(let y=.48;y<1.12;y+=.13)b(1.0,.035,.035,P.frame,0,y,-1.115,.005);
 // Rear cooling slots, restrained counterweight and supported work lights.
 for(let i=0;i<5;i++)b(.48,.018,.018,P.dark,0,.77+i*.055,1.064,.004);
 for(const dx of [-.46,.46]){b(.17,.13,.12,P.dark,dx,2.68,-.76,.022);b(.13,.085,.015,P.wallLight,dx,2.68,-.828,.016);}
 k.cyl(.055,.10,P.steel,.40,2.795,.50,g,10);k.cyl(.07,.12,0xc5a46b,.40,2.9,.50,g,12);
 g.userData.structure={wheelBottom:.11,forkBottom:.2725,unchangedReservedFootprint:true};return g;
}
