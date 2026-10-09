import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../src/models/pastel-shapes.js';

// Full building volumes around the retained north-side shops. Coordinates are metres.
export const neighbours=[
 {x:-19,z:-4,w:7,d:6,h:8.1,c:0xb6c5b3,sign:'동네 세탁',roof:'terrace'},
 {x:18.5,z:-4,w:8,d:6,h:6.3,c:0xd6bdac,sign:'생활 문구',roof:'tile'},
 {x:-19,z:17,w:7,d:7,h:7.9,c:0xcbb9a1,sign:'골목 철물',roof:'terrace',south:true},
 {x:-10.5,z:17,w:7,d:7,h:6.2,c:0xc4cdbe,sign:'작은 식당',roof:'tile',south:true},
 {x:-2.2,z:17.5,w:7,d:8,h:9.3,c:0xd8c7b1,sign:'우리 슈퍼',roof:'terrace',south:true},
 {x:7,z:17,w:7.2,d:7,h:6.2,c:0xb8c6c5,sign:'동네 사진관',roof:'tile',south:true},
 {x:18,z:17.5,w:8,d:8,h:8,c:0xcababc,sign:'푸른 미용실',roof:'terrace',south:true},
];
// Follow the existing 300m east-west road, beyond the playable ±25m limits.
export const utilityXs=[-143,-127,-111,-95,-79,-63,-47,-36,-23,-12,12,23,36,47,63,79,95,111,127,143];
export const surroundingObstacles=neighbours.map(b=>({x:b.x,z:b.z,w:b.w,d:b.d,h:b.h+1.3}));
export function addNeighbourhood(world,scene){
 const mats=new Map();const m=c=>{if(!mats.has(c))mats.set(c,material(c));return mats.get(c);};
 const box=(p,w,h,d,c,x,y,z,r=.016)=>mesh(p,bevelBox(w,h,d,r),m(c),x,y,z);
 const cyl=(p,r,h,c,x,y,z)=>mesh(p,new T.CylinderGeometry(r,r,h,8),m(c),x,y,z);
 const trim=0xe9dfc8,wood=0x9e8872,glass=0x779791,metal=0x647a71;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const g=canvas.getContext('2d');g.fillStyle='#577468';g.fillRect(0,0,1024,512);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#faf0d5';g.font='bold 46px system-ui';
 neighbours.forEach((b,i)=>g.fillText(b.sign,512,i*64+32));
 const atlas=new T.CanvasTexture(canvas);atlas.colorSpace=T.SRGBColorSpace;const signMaterial=material(0xffffff,{map:atlas});
 function window(p,x,y,z,w=1.1,h=1.25,rot=0){
  const a=new T.Group();a.position.set(x,y,z);a.rotation.y=rot;p.add(a);
  box(a,w+.16,h+.16,.13,trim,0,0,0);box(a,w,h,.04,glass,0,0,.08);
  box(a,.045,h,.06,trim,0,0,.12);box(a,w,.045,.06,trim,0,-.12,.12);
  box(a,w+.26,.10,.27,wood,0,-h/2-.1,.08);
 }
 function building(b,i=-1,far=false){
  const p=new T.Group();world.add(p);p.position.set(b.x,0,b.z);p.rotation.y=b.south?Math.PI:0;
  box(p,b.w,b.h,b.d,b.c,0,b.h/2+.1,0);
  box(p,b.w+.12,.3,b.d+.12,wood,0,.27,0);
  const front=b.d/2, floors=Math.max(1,Math.round(b.h/3));
  for(let floor=1;floor<=floors;floor++){
   box(p,b.w+.15,.13,b.d+.15,trim,0,Math.min(b.h,floor*3)+.08,0);
   if(floor>1){for(const x of [-b.w*.26,b.w*.26])window(p,x,floor*3-1.2,front+.07,1.25,1.4);}
  }
  // Side and back windows remain visible from a freely orbiting camera.
  for(let floor=0;floor<floors;floor++){
   window(p,0,1.8+floor*2.9,-front-.04,1.1,1.15,Math.PI);
   for(const side of [-1,1])window(p,side*(b.w/2+.03),1.8+floor*2.9,0,1,1.2,side*Math.PI/2);
  }
  box(p,b.w-1.1,2.15,.09,metal,0,1.26,front+.055);
  box(p,b.w-1.38,1.94,.05,glass,0,1.28,front+.13);
  for(const x of [-b.w*.22,0,b.w*.22])box(p,.075,2.04,.08,trim,x,1.3,front+.19);
  box(p,.05,.35,.08,wood,.15,1.1,front+.26);
  box(p,b.w-.4,.15,.42,trim,0,.14,front+.17);
  if(i>=0){
   box(p,b.w-.25,.65,.28,wood,0,2.75,front+.18);
   const geo=new T.PlaneGeometry(b.w-.45,.55),uv=geo.attributes.uv;
   for(let j=0;j<uv.count;j++)uv.setY(j,1-(i+1-uv.getY(j))/8);
   mesh(p,geo,signMaterial,0,2.75,front+.33).castShadow=false;
   for(const x of [-b.w*.32,b.w*.32]){box(p,.05,.24,.28,metal,x,3.18,front+.19);box(p,.35,.08,.23,trim,x,3.3,front+.3);}
  }
  if(b.roof==='tile'){
   const angle=.25,half=b.d/2+.24;
   for(const side of [-1,1]){const r=box(p,b.w+.55,.18,half/Math.cos(angle),0x9b897d,0,b.h+.22+Math.sin(angle)*half/2,side*half/2);r.rotation.x=side*angle;}
   box(p,b.w+.6,.2,.26,metal,0,b.h+.23+Math.sin(angle)*half,0);
   // Solid gable ends close the triangular roof volume.
   const shape=new T.Shape();shape.moveTo(-half,0);shape.lineTo(half,0);shape.lineTo(0,Math.sin(angle)*half);shape.closePath();
   const geo=new T.ShapeGeometry(shape),mat=material(b.c,{side:T.DoubleSide});
   for(const side of [-1,1]){const a=mesh(p,geo,mat,side*b.w/2,b.h+.18,0);a.rotation.y=Math.PI/2;}
  }else{
   box(p,b.w+.2,.17,b.d+.2,trim,0,b.h+.17,0);
   for(const s of [-1,1]){box(p,b.w,.45,.2,b.c,0,b.h+.42,s*(b.d/2-.12));box(p,.2,.45,b.d,b.c,s*(b.w/2-.12),b.h+.42,0);}
   if(!far){box(p,1.4,.95,1.3,0xb5c2be,1,b.h+.65,-1);cyl(p,.33,.68,0xd3d5c6,-1,b.h+.6,1);}
  }
  if(!far){
   // Mounted AC with brackets/grille; exposed plumbing anchors the side wall.
   box(p,.88,.56,.42,trim,b.w*.32,3.65,front+.27);
   for(let k=0;k<5;k++)box(p,.63,.022,.035,metal,b.w*.32,3.49+k*.07,front+.5);
   for(const dx of [-.3,.3])box(p,.04,.09,.52,metal,b.w*.32+dx,3.3,front+.2);
   cyl(p,.034,b.h-.25,metal,-b.w/2+.17,b.h/2,front+.14);
  }
  if(far)p.traverse(n=>{if(n.isMesh)n.castShadow=false;});
 }
 neighbours.forEach((b,i)=>building(b,i));
 // Continuations: two cross streets and recessed blocks. Far buildings retain roofs/windows.
 for(const x of [-30,30]){
  box(world,5.8,.12,100,0x9ca6a5,x,-.07,5.5).castShadow=false;
  for(const s of [-1,1])box(world,1.7,.14,100,0xcacabb,x+s*3.8,.0,5.5).castShadow=false;
 }
 for(const x of [-56,-46,-36,36,46,56])for(const south of [false,true])building({x,z:south?18:-5,w:7.8,d:8,h:6+(Math.abs(x)%3)*1.3,c:south?0xc4c6b7:0xc4b5a8,roof:Math.abs(x)%4?'tile':'terrace',south},-1,true);
 for(const z of [-23,-35,35,47])for(const x of [-20,-9,3,15,25])building({x,z,w:7.8,d:6,h:5.5+Math.abs(x)%4,c:z<0?0xb3c2b5:0xcac1ad,roof:Math.abs(x)%2?'tile':'terrace',south:z>0},-1,true);
 // Utility lines stay in the two road-side corridors, clear of every building volume.
 for(const z of [3.25,9.15])for(const x of utilityXs){
  const distant=Math.abs(x)>25;
  const pole=cyl(world,.10,6.1,0xa8a99a,x,3.14,z);pole.castShadow=!distant;
  const arm=box(world,1.4,.09,.13,metal,x,5.6,z);arm.castShadow=!distant;
  for(const dx of [-.48,0,.48]){const insulator=cyl(world,.055,.18,trim,x+dx,5.75,z);insulator.castShadow=!distant;}
 }
 for(const z of [3.25,9.15])for(let i=0;i<utilityXs.length-1;i++)for(const dx of [-.48,.48]){
  const a=utilityXs[i],b=utilityXs[i+1],sag=Math.min(.93,(b-a)*.039);
  const curve=new T.QuadraticBezierCurve3(new T.Vector3(a+dx,5.83,z),new T.Vector3((a+b)/2+dx,5.83-sag,z),new T.Vector3(b+dx,5.83,z));
  const wire=mesh(world,new T.TubeGeometry(curve,Math.abs(a)>25?6:12,.014,3,false),m(metal));wire.castShadow=false;
 }
 // Each distant end terminates at an insulator and drops to a pole-mounted junction box.
 for(const z of [3.25,9.15])for(const x of [utilityXs[0],utilityXs.at(-1)]){
  box(world,.34,.48,.2,metal,x,1.6,z+.14).castShadow=false;
  for(const dx of [-.48,.48]){const curve=new T.QuadraticBezierCurve3(new T.Vector3(x+dx,5.83,z),new T.Vector3(x,5.55,z+.12),new T.Vector3(x,1.84,z+.20));mesh(world,new T.TubeGeometry(curve,6,.012,3,false),m(metal)).castShadow=false;}
 }
 // Parked compact car: joined body, glazed cabin, bumpers, wheels, lamps.
 const car=new T.Group();world.add(car);car.position.set(16,.02,8.15);
 box(car,3.8,.6,1.55,0xadc3bf,0,.65,0,.12);box(car,2.15,.6,1.38,0xadc3bf,-.2,1.13,0,.13);
 for(const s of [-1,1]){box(car,1.7,.38,.028,glass,-.2,1.2,s*.703,.035);box(car,.055,.43,.05,metal,-.3,1.18,s*.73);for(const x of [-1.16,1.15]){const wheel=mesh(car,new T.CylinderGeometry(.32,.32,.17,12),m(0x596461),x,.36,s*.76);wheel.rotation.x=Math.PI/2;}}
 for(const x of [-1.94,1.94]){box(car,.08,.15,1.38,metal,x,.42,0);for(const z of [-.52,.52])box(car,.06,.16,.28,x>0?trim:0xb88076,x,.7,z);}
 // Low background terrain supports the horizon instead of a visible floating base.
 const skyCanvas=document.createElement('canvas');skyCanvas.width=16;skyCanvas.height=256;const skyCtx=skyCanvas.getContext('2d'),gradient=skyCtx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#88b5c8');gradient.addColorStop(.52,'#c9dedb');gradient.addColorStop(.7,'#e5e9e0');gradient.addColorStop(1,'#e5e9e0');skyCtx.fillStyle=gradient;skyCtx.fillRect(0,0,16,256);
 const skyTexture=new T.CanvasTexture(skyCanvas);skyTexture.colorSpace=T.SRGBColorSpace;
 const sky=new T.Mesh(new T.SphereGeometry(180,24,14),new T.MeshBasicMaterial({map:skyTexture,side:T.BackSide,depthWrite:false,fog:false}));sky.renderOrder=-1;scene.add(sky);
 return {buildingCount:neighbours.length+32,additionalObstacles:[{x:16,z:8.15,w:4,d:1.7,h:1.55},...[-23,-12,12,23].flatMap(x=>[3.25,9.15].map(z=>({x,z,w:.28,d:.28,h:6.2})))]};
}
