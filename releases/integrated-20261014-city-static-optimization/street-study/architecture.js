import {addSideCoverage} from './side-coverage.js';
import {utilityRows} from './environment-props.js';
import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../src/models/pastel-shapes.js';
import {neighbourhoodWindow,neighbourhoodShop} from './facade-details.js';

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
export const utilityXs=utilityRows[0].xs;
export const surroundingObstacles=neighbours.map(b=>({x:b.x,z:b.z,w:b.w,d:b.d,h:b.h+1.3}));
export function addNeighbourhood(world,scene){
 let buildingCount=0;
 const mats=new Map();const m=c=>{if(!mats.has(c))mats.set(c,material(c));return mats.get(c);};
 const box=(p,w,h,d,c,x,y,z,r=.016)=>mesh(p,bevelBox(w,h,d,r),m(c),x,y,z);
 const cyl=(p,r,h,c,x,y,z)=>mesh(p,new T.CylinderGeometry(r,r,h,8),m(c),x,y,z);
 const trim=0xe9dfc8,wood=0x9e8872,glass=0x779791,metal=0x647a71;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const g=canvas.getContext('2d');g.fillStyle='#577468';g.fillRect(0,0,1024,512);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#faf0d5';g.font='bold 46px system-ui';
 neighbours.forEach((b,i)=>g.fillText(b.sign,512,i*64+32));
 const atlas=new T.CanvasTexture(canvas);atlas.colorSpace=T.SRGBColorSpace;const signMaterial=material(0xffffff,{map:atlas});
 function window(p,x,y,z,w=1.1,h=1.25,rot=0){
  return neighbourhoodWindow(p,box,x,y,z,w,h,rot);
 }
 function building(b,i=-1,far=false){
  buildingCount++;
  const p=new T.Group();world.add(p);p.position.set(b.x,0,b.z);p.rotation.y=b.south?Math.PI:0;
  box(p,b.w,b.h,b.d,b.c,0,b.h/2+.1,0);
  box(p,b.w+.12,.3,b.d+.12,wood,0,.27,0);
  const front=b.d/2, floors=Math.max(1,Math.round(b.h/3));
  for(let floor=1;floor<=floors;floor++){
   box(p,b.w+.15,.13,b.d+.15,trim,0,Math.min(b.h,floor*3)+.08,0);
   if(floor>1){const yy=Math.min(floor*3-1.2,b.h-.93);for(const x of [-b.w*.26,b.w*.26])window(p,x,yy,front+.07,1.25,1.4);}
  }
  // Side and back windows remain visible from a freely orbiting camera.
  for(let floor=0;floor<floors;floor++){
   window(p,0,1.8+floor*2.9,-front-.04,1.1,1.15,Math.PI);
   for(const side of [-1,1])window(p,side*(b.w/2+.03),1.8+floor*2.9,0,1,1.2,side*Math.PI/2);
  }
  neighbourhoodShop(p,box,b,i>=0?i:Math.round(Math.abs(b.x+b.z)));
  if(i<0)box(p,b.w-.45,.36,.18,metal,0,2.72,front+.12);
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
   for(const yy of [.55,3.1,b.h-.48])box(p,.075,.034,.18,metal,-b.w/2+.17,yy,front+.07);
  }
  if(far)p.traverse(n=>{if(n.isMesh)n.castShadow=false;});
 }
 neighbours.forEach((b,i)=>building(b,i));
 // Continuations: two cross streets and recessed blocks. Far buildings retain roofs/windows.
 for(const x of [-30,30]){
  box(world,5.8,.12,300,0x9ca6a5,x,-.07,0).castShadow=false;
  const edges=[-150,-.15,2.65,3.8,8.3,9.45,12.25,150];
  for(const side of [-1,1])for(let i=1;i<edges.length;i++){
   const a=edges[i-1],b=edges[i],z=(a+b)/2;if(z>3.8&&z<8.3)continue;
   const ramp=Math.abs(z-1.25)<1.4||Math.abs(z-10.85)<1.4;
   box(world,ramp?.97:1.7,.16,b-a,0xcacabb,x+side*(ramp?4.17:3.8),.025,z).castShadow=false;
   if(!ramp)box(world,.18,.14,b-a,trim,x+side*2.99,.045,z).castShadow=false;
   else{const r=box(world,.83,.035,b-a,0xcacabb,x+side*3.3,.035,z);r.rotation.z=side*.145;r.castShadow=false;}
  }
 }
 const muted=[0xc4c6b7,0xc4b5a8,0xb3c2bb,0xd2c3a8,0xb9bec8,0xc9b3aa];
 for(const [i,x]of [-140,-128,-116,-104,-92,-80,-68,-58,-48,-39,39,49,60,72,84,96,108,120,132,144].entries())for(const south of [false,true]){
  const n=i+(south?3:0);building({x,z:south?17+n%3:-5-n%2,w:6.7+n%4*.55,d:7+n%3,h:5.3+n%5*1.1,c:muted[n%muted.length],roof:n%3?'tile':'terrace',style:n%3,south},-1,true);
 }
 for(const z of [-23,-35,35,47])for(const x of [-20,-10,0,10,20])building({x,z,w:7.8,d:6,h:5.5+Math.abs(x+z)%4,c:z<0?0xb3c2b5:0xcac1ad,roof:Math.abs(x+z)%3?'tile':'terrace',south:z>0},-1,true);
 // Low-cost distant silhouettes enclose every view without expanding the playable rectangle.
 for(const z of [-126,-102,-78,-56,65,88,111,135])for(const x of [-47,-20,0,19,46]){
  const h=6+(Math.abs(x+z)%5),c=muted[Math.abs(x+z)%muted.length];
  const b=mesh(world,new T.BoxGeometry(10,h,9),m(c),x,h/2,z);b.castShadow=false;
  box(world,10.5,.25,9.5,trim,x,h+.13,z).castShadow=false;
  // Same retained envelope, but complete lower/upper facades instead of a blank
  // box with two roof-height panes. Details use the same joinery as nearby shops.
  const p=new T.Group();p.position.set(x,0,z);world.add(p);
  const floors=Math.max(2,Math.floor(h/2.8)),step=h/floors;
  for(let face=0;face<4;face++){
   const f=new T.Group();f.rotation.y=face*Math.PI/2;p.add(f);const span=face%2?9:10,depth=face%2?10:9;
   // These distant volumes are solid: side/rear room pictures have no opening.
   // Retain both the main-street elevation and the elevation facing a cross street.
   // A side of the volume can be a road frontage; do not blank that facade.
   const crossFront=x===0?-1:(x<0?(x<-33.8?1:3):(x<33.8?1:3));
   if(face===(z>0?2:0)||face===crossFront){
    for(let floor=0;floor<floors;floor++)for(const dx of [-span*.27,0,span*.27])window(f,dx,step*(floor+.54),depth/2+.025,1.24,Math.min(1.25,step*.54));
   }else world.userData.closedSideCards=(world.userData.closedSideCards||0)+floors*3;
   for(let floor=1;floor<floors;floor++)box(f,span+.12,.09,.14,trim,0,step*floor,depth/2+.045);
  }
  for(const side of [-1,1])box(p,10,.26,.14,c,0,h+.29,side*4.43);
  p.traverse(n=>{if(n.isMesh)n.castShadow=false;});
 }
 // Cross-street poles connect at the main street corner rather than ending in empty space.
 for(const x of [-33.8,33.8])for(const side of [-1,1]){
  const zs=side<0?[-141,-119,-97,-75,-53,-31,-9,3.25]:[9.15,29,51,73,95,117,139];
  for(const z of zs){
   if(z!==3.25&&z!==9.15)cyl(world,.10,6.1,0xa8a99a,x,3.14,z).castShadow=false;
   box(world,1.4,.09,.13,metal,x,5.6,z).castShadow=false;
   for(const dx of [-.48,.48])cyl(world,.055,.18,trim,x+dx,5.75,z).castShadow=false;
  }
  for(let i=1;i<zs.length;i++)for(const dx of [-.48,.48]){
   const a=zs[i-1],b=zs[i],curve=new T.QuadraticBezierCurve3(new T.Vector3(x+dx,5.83,a),new T.Vector3(x+dx,5.1,(a+b)/2),new T.Vector3(x+dx,5.83,b));mesh(world,new T.TubeGeometry(curve,6,.014,3,false),m(metal)).castShadow=false;
  }
  // Short jumpers join the perpendicular corner arms at their actual insulators.
  const corner=side<0?3.25:9.15;
  for(const offset of [-.48,.48]){
   const curve=new T.QuadraticBezierCurve3(new T.Vector3(x+offset,5.83,corner),new T.Vector3(x+offset,5.7,corner+offset),new T.Vector3(x,5.83,corner+offset));
   mesh(world,new T.TubeGeometry(curve,4,.014,3,false),m(metal)).castShadow=false;
  }
 }
 // Utility lines stay in the two road-side corridors, clear of every building volume.
 for(const {z,xs}of utilityRows)for(const x of xs){
  const distant=Math.abs(x)>25;
  const pole=cyl(world,.10,6.1,0xa8a99a,x,3.14,z);pole.castShadow=!distant;
  const arm=box(world,.13,.09,1.4,metal,x,5.6,z);arm.castShadow=!distant;
  for(const dz of [-.48,0,.48]){const insulator=cyl(world,.055,.18,trim,x,5.75,z+dz);insulator.castShadow=!distant;}
 }
 for(const {z,xs}of utilityRows)for(let i=0;i<xs.length-1;i++)for(const dz of [-.48,.48]){
  const a=xs[i],b=xs[i+1],sag=Math.min(.93,(b-a)*.039);
  const curve=new T.QuadraticBezierCurve3(new T.Vector3(a,5.83,z+dz),new T.Vector3((a+b)/2,5.83-sag,z+dz),new T.Vector3(b,5.83,z+dz));
  const wire=mesh(world,new T.TubeGeometry(curve,Math.abs(a)>25?6:12,.014,3,false),m(metal));wire.castShadow=false;
 }
 // Each distant end terminates at an insulator and drops to a pole-mounted junction box.
 for(const {z,xs}of utilityRows)for(const x of [xs[0],xs.at(-1)]){
  box(world,.34,.48,.2,metal,x,1.6,z+.14).castShadow=false;
  for(const dz of [-.48,.48]){const curve=new T.QuadraticBezierCurve3(new T.Vector3(x,5.83,z+dz),new T.Vector3(x,5.55,z+.12),new T.Vector3(x,1.84,z+.20));mesh(world,new T.TubeGeometry(curve,6,.012,3,false),m(metal)).castShadow=false;}
 }
 // Low background terrain supports the horizon instead of a visible floating base.
 const skyCanvas=document.createElement('canvas');skyCanvas.width=16;skyCanvas.height=256;const skyCtx=skyCanvas.getContext('2d'),gradient=skyCtx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#88b5c8');gradient.addColorStop(.52,'#c9dedb');gradient.addColorStop(.7,'#e5e9e0');gradient.addColorStop(1,'#e5e9e0');skyCtx.fillStyle=gradient;skyCtx.fillRect(0,0,16,256);
 const skyTexture=new T.CanvasTexture(skyCanvas);skyTexture.colorSpace=T.SRGBColorSpace;
 const sky=new T.Mesh(new T.SphereGeometry(180,24,14),new T.MeshBasicMaterial({map:skyTexture,side:T.BackSide,depthWrite:false,fog:false}));sky.renderOrder=-1;scene.add(sky);
 const coverage=addSideCoverage(world);
 return {buildingCount:buildingCount+40+coverage.length,additionalObstacles:utilityRows.flatMap(({z,xs})=>xs.map(x=>({x,z,w:.28,d:.28,h:6.2})))};
}
