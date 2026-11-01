import * as T from '../vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../models/pastel-shapes.js';
import {batchStatic} from '../models/static-batch.js';
function kit(root){
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,material(c));return mats.get(c);};
 const box=(w,h,d,c,x,y,z,p=root,r=.02)=>mesh(p,bevelBox(w,h,d,r),mat(c),x,y,z);
 const bar=(a,b,r,c,p=root)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);const m=mesh(p,new T.CylinderGeometry(r,r,v.length(),8),mat(c));m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;};
 return {mat,box,bar};
}
export function bicycleModel(){
 const root=new T.Group(),{mat,box,bar}=kit(root),wheels=[],pedals=[],crank=new T.Group();root.name='SlowSidewalkBicycle';
 const rear=[0,.36,-.65],front=[0,.36,.67],pedal=[0,.39,-.06],seat=[0,.95,-.26],head=[0,.98,.39];
 // Same wheelbase and axle centres; tubing now supports both sides of each wheel.
 const tubing=(points,r,color)=>mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),mat(color));
 bar(pedal,seat,.026,0x526f65);
 // Low step-through rails follow the period utility-bike silhouette.
 tubing([[0,.88,-.24],[0,.65,-.06],[0,.63,.13],[0,.77,.27],[0,.93,.37]],.025,0x526f65);
 tubing([[0,.39,-.06],[0,.45,.13],[0,.67,.27],[0,.90,.365]],.031,0x526f65);
 bar([0,.9,.365],[0,1.02,.405],.039,0x526f65);
 for(const side of [-1,1]){const dropout=[side*.07,.36,-.65],frontDrop=[side*.07,.36,.67];bar([side*.055,.39,-.06],dropout,.016,0x526f65);bar([side*.036,.91,-.26],dropout,.014,0x526f65);bar([side*.055,.9,.39],[side*.07,.58,.56],.023,0x526f65);bar([side*.07,.58,.56],frontDrop,.020,0x526f65);}
 bar([-.07,.88,.405],[.07,.88,.405],.023,0x738079);
 bar([0,.9,-.26],[0,1,-.26],.019,0x9ca6a0);
 // Low-cost fixed chain loop and sprockets, aligned with the rotating cranks.
 function gear(z,y,r){const m=mesh(root,new T.CylinderGeometry(r,r,.012,20),mat(0x66706a),-.099,y,z);m.rotation.z=Math.PI/2;return m;}
 gear(-.06,.39,.10);gear(-.65,.36,.047);
 const chain=[];for(let i=0;i<=12;i++){const t=Math.PI/2-i*Math.PI/12;chain.push(new T.Vector3(-.113,.39+Math.sin(t)*.105,-.06+Math.cos(t)*.105));}for(let i=0;i<=12;i++){const t=-Math.PI/2-i*Math.PI/12;chain.push(new T.Vector3(-.113,.36+Math.sin(t)*.052,-.65+Math.cos(t)*.052));}chain.push(chain[0].clone());const curve=new T.CatmullRomCurve3(chain,false,'centripetal');mesh(root,new T.TubeGeometry(curve,40,.005,4,false),mat(0x49524d));
 for(const [z,mount]of [[.51,.55],[-.49,-.466]]){for(const side of [-1,1]){bar([side*.06,.60,mount],[side*.06,.70,z],.008,0x89948d);bar([side*.022,.62,z],[side*.06,.62,z],.008,0x89948d);box(.010,.025,.045,0x414a45,side*.022,.62,z);}bar([-.06,.70,z],[.06,.70,z],.004,0x747e72);}
 const cable=new T.CatmullRomCurve3([new T.Vector3(-.17,1.13,.46),new T.Vector3(-.10,1.04,.60),new T.Vector3(-.045,.76,.52),new T.Vector3(-.05,.70,.51)]);mesh(root,new T.TubeGeometry(cable,14,.004,4,false),mat(0x3f4943));
 for(const side of [-1,1])bar([side*.17,1.22,.32],[side*.24,1.19,.35],.009,0x8b9690);
 for(const z of [-.65,.67]){const w=new T.Group();root.add(w);w.position.set(0,.36,z);wheels.push(w);const tire=mesh(w,new T.TorusGeometry(.34,.037,8,32),mat(0x343d39));tire.rotation.y=Math.PI/2;
  const rim=mesh(w,new T.TorusGeometry(.305,.012,5,32),mat(0xb4beb8));rim.rotation.y=Math.PI/2;
  for(let n=0;n<16;n++){const t=n*Math.PI/8;bar([0,0,0],[0,Math.sin(t)*.30,Math.cos(t)*.30],.0035,0xbac4ba,w);}
  const hub=mesh(w,new T.CylinderGeometry(.035,.035,.17,8),mat(0x7e8b83));hub.rotation.z=Math.PI/2;
 }
 box(.235,.070,.19,0x474a44,0,1.00,-.30,root,.035);box(.10,.055,.16,0x474a44,0,.995,-.19,root,.025);bar([0,.94,.39],[0,1.22,.42],.025,0x738079);for(const s of [-1,1])tubing([[0,1.20,.42],[s*.10,1.20,.42],[s*.18,1.23,.38],[s*.245,1.22,.29]],.015,0x9da9a1);
 for(const side of [-1,1]){const grip=mesh(root,new T.CylinderGeometry(.022,.022,.12,12),mat(0x343b36),side*.245,1.22,.29);grip.rotation.z=Math.PI/2;}
 root.add(crank);crank.position.set(...pedal);
 for(const side of [-1,1]){bar([side*.135,0,0],[side*.135,side*.155,0],.021,0x839289,crank);pedals.push(box(.13,.04,.10,0x64695d,side*.155,side*.155,0,crank));}
 // Front utility basket: open wire walls/floor, with two rigid head-tube brackets.
 // Entire assembly is batched with the frame; no extra lights or transparent shells.
 const basketColor=0x747a70,basketX=.22,basketBack=.53,basketFront=.87,basketBottom=.97,basketTop=1.25;
 for(const y of [basketBottom,basketTop]){bar([-basketX,y,basketBack],[basketX,y,basketBack],.008,basketColor);bar([-basketX,y,basketFront],[basketX,y,basketFront],.008,basketColor);for(const x of [-basketX,basketX])bar([x,y,basketBack],[x,y,basketFront],.008,basketColor);}
 for(let i=0;i<=8;i++){const x=-basketX+i*basketX/4;for(const z of [basketBack,basketFront])bar([x,basketBottom,z],[x,basketTop,z],.0045,basketColor);bar([x,basketBottom,basketBack],[x,basketBottom,basketFront],.0045,basketColor);}
 for(let i=1;i<6;i++){const z=basketBack+(basketFront-basketBack)*i/6;for(const x of [-basketX,basketX])bar([x,basketBottom,z],[x,basketTop,z],.0045,basketColor);bar([-basketX,basketBottom,z],[basketX,basketBottom,z],.0045,basketColor);}
 for(const y of [1.06,1.15]){for(const z of [basketBack,basketFront])bar([-basketX,y,z],[basketX,y,z],.0045,basketColor);for(const x of [-basketX,basketX])bar([x,y,basketBack],[x,y,basketFront],.0045,basketColor);}
 for(const sign of [-1,1]){bar([sign*.055,1.02,.405],[sign*.13,.97,.59],.011,0x666e66);bar([sign*.055,.90,.39],[sign*.13,.97,.59],.010,0x666e66);}
 // Curved steel mudguards sit clear of the tyre, not solid torus rings.
 for(const axle of [-.65,.67]){const positions=[],indices=[],steps=28;for(let i=0;i<=steps;i++){const t=-1.35+i*2.9/steps;for(const x of [-.053,.053])positions.push(x,.36+.395*Math.cos(t),axle+.395*Math.sin(t));if(i<steps){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const metal=material(0xa7ada2);metal.side=T.DoubleSide;metal.metalness=.35;metal.roughness=.60;mesh(root,geometry,metal);for(const x of [-.053,.053]){const pts=[];for(let i=0;i<=steps;i++){const t=-1.35+i*2.9/steps;pts.push([x,.36+.395*Math.cos(t),axle+.395*Math.sin(t)]);}tubing(pts,.004,0x929c92);}for(const sign of [-1,1])bar([sign*.065,.36,axle],[sign*.053,.543,axle+(axle<0?-.35:.35)],.006,0x939e95);}
 for(const sign of [-1,1]){bar([sign*.055,.75,.47],[sign*.053,.70,.47],.008,0x929c91);bar([sign*.04,.75,-.37],[sign*.053,.70,-.43],.008,0x929c91);}
 // Rear rack stays transfer load to the dropout; its platform clears the mudguard.
 for(const x of [-.12,.12]){bar([x,.84,-.93],[x,.84,-.39],.010,0x929c91);bar([x,.84,-.89],[x*.6,.36,-.65],.008,0x929c91);bar([x,.84,-.42],[x*.5,.88,-.26],.008,0x929c91);}
 for(const z of [-.93,-.77,-.59,-.39])bar([-.12,.84,z],[.12,.84,z],.008,0x929c91);
 for(const x of [-.04,.04])bar([x,.84,-.93],[x,.84,-.39],.007,0x929c91);
 // Cream chain guard covers the upper chain and chainring, while leaving crank clearance.
 const guard=new T.Shape();guard.moveTo(-.06,.515);guard.quadraticCurveTo(.065,.51,.065,.39);guard.quadraticCurveTo(.06,.27,-.06,.27);guard.lineTo(-.65,.295);guard.quadraticCurveTo(-.72,.36,-.65,.425);guard.closePath();const guardGeometry=new T.ExtrudeGeometry(guard,{depth:.014,bevelEnabled:true,bevelSize:.005,bevelThickness:.003,bevelSegments:2,steps:1,curveSegments:12});const guardMesh=mesh(root,guardGeometry,mat(0xb2b0a0),-.105,0,0);guardMesh.rotation.y=-Math.PI/2;
 bar([0,.90,.395],[0,.88,.694],.012,0x737f75);box(.08,.025,.07,0x737f75,0,.88,.68);
 bar([0,.84,-.93],[0,.73,-1.01],.012,0x929c91);box(.08,.10,.018,0x626d63,0,.73,-1.012,root,.008);
 const lamp=mesh(root,new T.CylinderGeometry(.047,.049,.055,16),mat(0x737f75),0,.88,.72);lamp.rotation.x=Math.PI/2;const lens=mesh(root,new T.CircleGeometry(.038,16),mat(0xdcdccb),0,.88,.751);box(.07,.09,.025,0x934841,0,.73,-1.03,root,.008);
 // Folded stand: stays alongside the chainstay while the bike is moving.
 bar([-.08,.39,-.08],[-.10,.41,-.46],.009,0x90978c);
 const rider=null;if(rider){rider.object.scale.setScalar(.96);rider.object.position.set(0,.23,-.19);root.add(rider.object);}
 const bones=Object.fromEntries(rider?rider.skeleton.bones.map(b=>[b.name,b]):[]);
 // Rider legs solve a two-link chain to the moving pedals; hands rest on the bar.
 function leg(side,theta){const hip=bones['hip'+side],knee=bones['knee'+side],foot=bones['foot'+side],L=.365,l=.355;
  const y=(.39+.155*Math.cos(theta)-.23)/.96+.048-.825,z=(-.06+.155*Math.sin(theta)+.19)/.96;
  const distance=Math.min(L+l-.001,Math.hypot(y,z)),bend=Math.PI-Math.acos(T.MathUtils.clamp((L*L+l*l-distance*distance)/(2*L*l),-1,1));
  hip.rotation.x=Math.atan2(-z,-y)-Math.atan2(l*Math.sin(bend),L+l*Math.cos(bend));knee.rotation.x=bend;foot.rotation.x=-hip.rotation.x-bend;
 }
 // No helmet: retain the cyclist’s own short hair.
 batchStatic(root,new Set([...wheels,crank,...(rider?[rider.object]:[])]));
 return {root,update(distance){const angle=distance/.34;wheels.forEach(w=>w.rotation.x=angle);crank.rotation.x=angle*.47;const phase=angle*.47;pedals.forEach(p=>p.rotation.x=-phase);if(rider){leg(1,phase);leg(-1,phase+Math.PI);for(const s of [-1,1]){bones['shoulder'+s].rotation.set(-.62,0,s*.05);bones['elbow'+s].rotation.x=-.63;}bones.body.rotation.x=.10;}}};
}

