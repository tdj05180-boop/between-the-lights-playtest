import * as T from '../vendor/three.module.min.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {planStorey} from './interior-plan.js';
import {bevelBox} from './pastel-shapes.js';

// Visual rooms only. Local +Z is the street; the floor and furniture behind each
// storefront share ONE coordinate system, independent of door/window sill height.
// No player colliders, interactions, imported assets or point lights are added.
const materials=new Map(),geometries=new Map();
function material(color,night=false,metal=false){
 const key=[color,night,metal].join('/');
 if(!materials.has(key))materials.set(key,night?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,roughness:metal?.48:.83,metalness:metal?.25:0}));
 return materials.get(key);
}
export function roomBuilder(parent,{night=false}={}){
 const box=(w,h,d,c,x,y,z,r=0)=>{
  // City-window furniture is viewed from tens of metres away; bevels on every
  // curtain/book would multiply triangles without changing the visible outline.
  if(night)r=0;
  const key=[w,h,d,r].join('/');if(!geometries.has(key))geometries.set(key,r?bevelBox(w,h,d,r):new T.BoxGeometry(w,h,d));
  const n=new T.Mesh(geometries.get(key),material(c,night));n.position.set(x,y,z);n.castShadow=false;n.receiveShadow=false;parent.add(n);return n;
 };
 const cylinder=(r,h,c,x,y,z)=>{const key=`c/${r}/${h}`;if(!geometries.has(key))geometries.set(key,new T.CylinderGeometry(r,r,h,12));const n=new T.Mesh(geometries.get(key),material(c,night));n.position.set(x,y,z);parent.add(n);return n;};
 return {box,cylinder};
}

export function interiorTrade(name='',fallback=12){
 const rules=[[/구두|열쇠|수리/,18],[/반찬|도시락/,19],[/인쇄|복사/,20],[/옷방|의류|양품/,21],[/슈퍼|마트|편의/,16],[/미용|이발|헤어/,17],[/문고|책방|문구/,0],[/커피|카페|찻집/,1],[/약국/,2],[/부동산/,3],[/사진/,4],[/꽃|화원/,5],[/안경/,6],[/빵|베이커리/,7],[/세탁|수선/,8],[/분식|식당|식탁|밥집|국수|김밥/,9],[/공방|철물|잡화|살림/,10],[/휴대폰|통신/,11]];
 return rules.find(([r])=>r.test(name))?.[1]??fallback;
}
export function addShopRoom(parent,{width,height=2.48,depth=2.55,floor=.21,doorX=0,type=12,variant=0,era=2019,night=false,name='',sideWalls=true}={}){
 type=interiorTrade(name,type);
 const signature=[...String(name)].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,Math.abs(Math.round(variant)));
 variant=signature%12;
 const root=new T.Group();root.name='VisibleShopInterior';parent.add(root);root.position.y=floor;
 const {box:b,cylinder:cy}=roomBuilder(root,{night}),w=width-.18,h=height,dep=depth-.10;
 const old=era===2003,wall=(old?[0xc4b79e,0xbebca9,0xc9bbaa]:[0xc6c8b9,0xcbbfab,0xc0cbc5,0xc7c3b4])[variant%(old?3:4)],wood=old?[0x93754e,0x8d795c,0xa48d69][variant%3]:[0x9c8664,0xa39980,0x8a806e][variant%3],metal=0x586866;
 const side=doorX>=0?-1:1; // Keep the entry aisle free; display/work zone opposite it.
 const rear=-dep+.12,workX=side*Math.min(w*.27,1.5);
 b(w,.10,dep,old?0xaaa08a:0xb2b7ad,0,-.05,-dep/2);
 b(w,.09,dep,old?0xd1c5ad:0xdedbd0,0,h,-dep/2);
 b(w,h,.12,wall,0,h/2,-dep);
 if(sideWalls)for(const s of [-1,1]){b(.10,h,dep,wall,s*w/2,h/2,-dep/2);b(.035,.11,dep,wood,s*(w/2-.063),.09,-dep/2);}
 b(w,.11,.04,wood,0,.09,rear-.025);
 // Tile and timber bays follow the whole shop, rather than restarting at each pane.
 if([2,7,9,19].includes(type)){
  for(let z=-.38;z>-dep;z-=.48)b(w,.002,.008,0x989f95,0,.002,z);
  for(let x=-w/2+.48;x<w/2;x+=.48)b(.008,.002,dep,0x989f95,x,.002,-dep/2);
 }else if([0,1,3,17].includes(type))for(let x=-w/2+.24;x<w/2;x+=.24)b(.007,.002,dep,old?0x978b73:0xa0a397,x,.002,-dep/2);
 // A rear doorway/store-room opening is asymmetric and has real depth.
 const backDoorX=-side*(w/2-.48);
 if([0,10,12,16].includes(type)){
  b(.70,1.95,.055,old?0x897e68:0x84918b,backDoorX,1.01,rear-.037);
  for(const s of [-1,1])b(.042,1.99,.09,wood,backDoorX+s*.37,1.01,rear+.018);
  b(.78,.045,.09,wood,backDoorX,2.02,rear+.018);b(.024,.18,.045,metal,backDoorX+.24,1.03,rear+.032);
 }
 const table=(x,z,ww=.85,dd=.66,y=.76)=>{
  b(ww,.065,dd,wood,x,y,z,.018);
  for(const sx of [-1,1])for(const sz of [-1,1])b(.04,y-.04,.04,metal,x+sx*(ww/2-.07),(y-.04)/2,z+sz*(dd/2-.07));
 };
 const chair=(x,z,ry=0)=>{const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);const {box}=roomBuilder(g,{night});box(.37,.065,.39,wood,0,.45,0,.028);const back=box(.36,.29,.035,wood,0,.63,-.17,.024);back.rotation.x=-.08;for(const sx of [-1,1])for(const sz of [-1,1])box(.027,.42,.027,metal,sx*.145,.21,sz*.145);};
 const stool=(x,z)=>{cy(.18,.06,wood,x,.48,z);for(const dx of [-.12,.12])for(const dz of [-.12,.12])b(.025,.45,.025,metal,x+dx,.225,z+dz);};
 const shelf=(x,z,ww=1.35,hh=1.72,kind='files')=>{
  const dd=.31;b(ww,hh,.045,wood,x,hh/2,z-.13);
  for(const s of [-1,1])b(.045,hh,dd,wood,x+s*ww/2,hh/2,z);
  for(let row=0;row<4;row++){
   const yy=.13+row*(hh-.18)/4;b(ww,.036,dd,wood,x,yy,z);
   for(let col=0;col<Math.max(3,Math.floor(ww/.18));col++){
    const xx=x-ww/2+.12+col*.18,sz=kind==='boxes'?.14:.08,hh2=kind==='boxes'?.16:.24+(col%3)*.025;
    b(sz,hh2,.17,[0x8e9c88,0xaf9678,0x708b91,0xc0b69e][(col+row+variant)%4],xx,yy+.018+hh2/2,z+.024,.006);
    if(kind==='files')b(sz*.5,.024,.006,0xd9d4c3,xx,yy+.15,z+.113);
   }
  }
 };
 const counter=(x,z,ww=1.25)=>{b(ww-.08,.08,.48,metal,x,.04,z);b(ww,.87,.56,old?0x9c8d73:0x929f92,x,.47,z,.02);b(ww+.07,.045,.61,wood,x,.93,z,.012);for(const dx of [-ww*.25,ww*.25])b(.01,.72,.012,metal,x+dx,.50,z+.282);};
 const screen=(x,z)=>{b(.30,.22,.045,0x475855,x,1.16,z,.012);b(.25,.16,.008,0x879d9a,x,1.17,z+.027);b(.035,.10,.04,metal,x,1.02,z);b(.18,.025,.14,metal,x,.965,z);};
 const plant=(x,z,r=.15)=>{cy(r,.30,0x9a876b,x,.15,z);cy(.014,.40,0x6a7859,x,.38,z);for(const s of [-1,0,1]){const geoKey='leaf';if(!geometries.has(geoKey))geometries.set(geoKey,new T.SphereGeometry(1,10,6));const leaf=new T.Mesh(geometries.get(geoKey),material(0x778f69,night));leaf.scale.set(.07,.22,.022);leaf.position.set(x+s*.08,.52+Math.abs(s)*.035,z+s*.025);leaf.rotation.z=-s*.5;root.add(leaf);}};
 const pendant=(x,z)=>{b(.016,.33,.016,metal,x,h-.18,z);cy(.17,.09,old?0xc6b398:0xcbbf9d,x,h-.40,z);cy(.135,.012,night?0xf1dbac:0xe5ddc3,x,h-.45,z);};
 if(type===0||type===10||type===12){
  shelf(workX,rear+.21,Math.min(2,w*.45),1.9,type===10?'boxes':'files');
  counter(-side*w*.19,-1.33,.91);if(type===0)screen(-side*w*.19,-1.40);
  if(w>4.8)shelf(side*w*.34,-1.10,.83,1.13,'boxes');
 }else if(type===1||type===9){
  // Tea shop / café: rear preparation counter; restaurant: dining along one side.
  counter(-side*w*.20,rear+.38,Math.min(1.8,w*.36));
  if(type===1){b(.42,.37,.31,0x697470,-side*w*.20,1.14,rear+.36,.025);for(const q of [-.14,.14])cy(.045,.075,0xd7d2bd,-side*w*.20+q,.99,rear+.58);}
  else {const cx=-side*w*.20;b(1.35,.68,.025,0xb9c4bc,cx,1.34,rear+.035);b(1.20,.14,.35,metal,cx,1.74,rear+.205);b(.26,Math.max(.10,h-1.82),.22,0x8c9b92,cx,(h+1.82)/2,rear+.145);for(let j=0;j<5;j++)b(.14,.02,.014,0x394d49,cx-.43+j*.21,1.73,rear+.385);for(const q of [-.35,.15]){cy(.115,.012,0x4b5c59,cx+q,.964,rear+.40);cy(.09,.12,0x85928c,cx+q,1.03,rear+.40);}b(.32,.07,.17,0xc2c5b4,cx+.36,.997,rear+.53);
   for(let j=0;j<3;j++){const xx=workX+(j-1)*.30;b(.22,.42,.025,wood,xx,1.62,rear+.02);b(.18,.37,.008,0xd9d1bb,xx,1.62,rear+.038);for(let line=0;line<3;line++)b(.105,.016,.004,0x7f8b79,xx,1.70-line*.065,rear+.045);}
  }
  const dining=w>5?[workX,workX-side*1.35]:[workX];
  for(const [i,x]of dining.entries()){
   if(type===1&&variant%2){cy(.42,.06,wood,x,.78,-1.04);cy(.045,.72,metal,x,.36,-1.04);cy(.25,.035,metal,x,.0175,-1.04);chair(x,-1.61);chair(x,-.46,Math.PI);}
   else{table(x,-1.07,type===9?.88:.74,.68);chair(x,-1.64);if(type===9&&i===0)stool(x,-.49);else chair(x,-.49,Math.PI);}
   if(type===1)pendant(x,-1.04);
   cy(.08,.025,0xd6d4bd,x,.825,-1.07);
   if(type===9){b(.07,.095,.07,0x746555,x+.27,.84,-1.11,.01);b(.10,.08,.07,0xc5beab,x-.27,.84,-1.16,.008);}
  }
 }else if(type===2||type===6||type===11){
  const cx=doorX===0?workX:0,cw=Math.min(doorX===0?w*.38:2.8,w*.64);
  counter(cx,-1.18,cw);screen(cx+cw*.28,-1.25);
  if(type===2)shelf(workX,rear+.21,Math.min(2,w*.42),1.85,'boxes');
  else if(type===6){
   b(Math.min(2,w*.48),1.15,.045,0xc1c9bd,workX,1.33,rear+.03);
   const key='spectacle-lens';if(!geometries.has(key))geometries.set(key,new T.TorusGeometry(.035,.006,4,10));
   for(let row=0;row<3;row++)for(let j=0;j<4;j++){const xx=workX-.51+j*.34,yy=.97+row*.31;b(.24,.025,.18,wood,xx,yy-.06,rear+.11);for(const dx of [-.043,.043]){const n=new T.Mesh(geometries.get(key),material(metal,night));n.position.set(xx+dx,yy,rear+.20);root.add(n);}b(.025,.007,.007,metal,xx,yy,rear+.20);}
  }else{b(Math.min(2,w*.48),.64,.055,0x697e83,workX,1.56,rear+.035);for(let j=0;j<4;j++){const xx=cx-cw*.32+j*cw*.20;b(.14,.035,.15,0xdadbcf,xx,.965,-1.06);b(.075,.14,.015,0x384f55,xx,1.04,-1.1,.007);b(.057,.105,.005,0xa1b3b3,xx,1.05,-1.089);}}
 }else if(type===3){
  table(workX,-1.42,1.25,.67);chair(workX,rear+.45);b(.30,.23,.04,0x637a7b,workX,.92,-1.53);b(.035,.08,.03,metal,workX,.81,-1.53);
  for(let col=0;col<3;col++)for(let row=0;row<2;row++){b(.36,.39,.022,0xe1ddc7,side*w*.25+(col-1)*.43,1.16+row*.46,rear+.024);b(.25,.025,.005,0x869b90,side*w*.25+(col-1)*.43,1.21+row*.46,rear+.039);}
  plant(-side*w*.34,-1.62);
 }else if(type===4){
  b(Math.min(1.8,w*.42),1.95,.035,0xb1a59b,workX,1.04,rear+.025);counter(-side*w*.23,-1.33,.9);b(.22,.19,.16,0x435651,-side*w*.23,1.05,-1.33);chair(workX,-1.35);
 }else if(type===5){
  for(let j=0;j<4;j++)plant(workX+side*(j%2)*.38,-.63-Math.floor(j/2)*.52,.13);counter(-side*w*.2,rear+.45,1.13);shelf(workX,rear+.19,.92,1.44,'boxes');
 }else if(type===7){
  counter(0,-1.13,Math.min(2.65,w*.6));shelf(workX,rear+.22,1.35,1.65,'boxes');for(let j=0;j<5;j++){cy(.09,.035,0xc1a372,-.68+j*.3,.985,-1.04);}
 }else if(type===16){
  shelf(workX,rear+.23,Math.min(2.1,w*.43),1.86,'boxes');counter(-side*w*.23,-1.22,.90);
  b(.65,1.78,.48,0xbbc5bd,side*(w/2-.47),.94,-1.10,.025);b(.54,1.39,.025,0x698984,side*(w/2-.47),1.05,-.843);
  for(let j=0;j<3;j++){b(.49,.025,.032,0xc7ceba,side*(w/2-.47),.54+j*.43,-.82);for(let q=0;q<3;q++)b(.08,.20,.028,[0xc5af78,0x8fac98,0xba9583][q],side*(w/2-.47)+(q-1)*.14,.68+j*.43,-.816);}
 }else if(type===17){
  for(const x of w>5?[workX,workX-side*1.45]:[workX]){
   b(.81,1.16,.045,wood,x,1.37,rear+.035,.018);b(.72,1.05,.009,0x91aaa8,x,1.38,rear+.064);
   table(x,rear+.31,.85,.41,.79);
   // Hydraulic styling chair faces its mirror, with a footrest and padded arms.
   cy(.23,.035,metal,x,.0175,-1.18);cy(.045,.42,metal,x,.23,-1.18);
   b(.44,.10,.43,0x576c66,x,.49,-1.18,.04);b(.43,.38,.08,0x657a70,x,.74,-.98,.035);
   for(const side of [-1,1]){b(.032,.15,.17,metal,x+side*.25,.59,-1.17);b(.065,.055,.34,0x576c66,x+side*.25,.69,-1.18,.023);}
   b(.32,.025,.15,metal,x,.18,-1.58);b(.035,.28,.035,metal,x,.32,-1.50);
   b(.10,.17,.09,0xa9b8a6,x+.22,.90,rear+.31,.01);
  }
  counter(-side*w*.27,-1.38,.65);
 }else if(type===18||type===20){
  table(workX,-1.29,Math.min(1.55,w*.4),.66,.86);
  if(type===18){b(1.20,.70,.035,0x9f9e88,workX,1.38,rear+.02);for(let j=0;j<5;j++){b(.018,.14,.015,metal,workX-.43+j*.21,1.36+(j%2)*.18,rear+.05);b(.055,.055,.014,0x7a8476,workX-.43+j*.21,1.45+(j%2)*.18,rear+.052);}b(.26,.16,.18,0x6e827d,workX,.973,-1.27,.025);
   if(/구두/.test(name)){const key='shoe-upper';if(!geometries.has(key))geometries.set(key,new T.SphereGeometry(1,10,6));for(const dz of [-.075,.075]){b(.23,.02,.082,0x53625a,workX+.35,.905,-1.24+dz,.012);const shoe=new T.Mesh(geometries.get(key),material(0x776550,night));shoe.scale.set(.11,.043,.039);shoe.position.set(workX+.35,.931,-1.24+dz);root.add(shoe);b(.07,.06,.075,0x776550,workX+.29,.944,-1.24+dz,.016);}}
  }
  else{b(.62,.40,.48,0xc3c7b9,workX,1.09,-1.32,.025);b(.58,.045,.44,0x657b76,workX,1.313,-1.32,.015);b(.40,.038,.012,0x526863,workX,1.10,-1.073);b(.35,.018,.21,0xe0dfcf,workX,1.08,-.975);b(.21,.06,.09,0x7c918a,workX+.14,1.28,-1.045,.008);b(.11,.034,.006,0xa4c1b4,workX+.14,1.284,-.996);for(const yy of [.955,1.0])b(.47,.009,.01,0x8d9d94,workX,yy,-1.071);}
  shelf(-side*w*.28,rear+.19,Math.min(1.12,w*.29),1.78,'boxes');
 }else if(type===19){
  const cx=side*w*.13,ww=Math.min(2.4,w*.55);counter(cx,-1.05,ww);
  for(let row=0;row<2;row++)for(let j=0;j<4;j++){const x=cx-ww*.36+j*ww*.24,z=-1.20+row*.24;b(ww*.20,.032,.19,0xc7c9ba,x,.965,z,.009);b(ww*.16,.028,.14,[0x8c9c6e,0xa4825f,0xbd9d6d,0xa0aa8b][j],x,.992,z,.01);}
  b(Math.min(1.8,w*.43),.57,.027,0xd0cfc0,workX,1.40,rear+.028);shelf(workX,rear+.22,Math.min(1.8,w*.4),.91,'boxes');
 }else if(type===21){
  const railW=Math.min(3.0,w*.46),rz=rear+.36;
  for(const dx of [-railW/2,railW/2]){b(.028,1.88,.028,metal,workX+dx,.94,rz);b(.15,.025,.44,metal,workX+dx,.0125,rz);}
  b(railW,.028,.028,metal,workX,1.88,rz);
  for(let j=0;j<4;j++){const xx=workX-railW*.34+j*railW*.23,col=[0xa99d8b,0x7e9291,0xb2ad9a,0x8c8f83][j];b(.015,.15,.018,metal,xx,1.79,rz);b(.23,.43,.075,col,xx,1.51,rz,.035);for(const side of [-1,1]){const sleeve=b(.09,.24,.07,col,xx+side*.14,1.58,rz,.02);sleeve.rotation.z=side*.25;}}
  table(-side*w*.23,-1.25,.94,.58,.79);for(let j=0;j<3;j++)b(.34,.047,.27,[0x929e96,0xc3b7a0,0xa5a68f][j],-side*w*.23,.848+j*.05,-1.25,.016);
  b(.63,1.49,.042,wood,-side*w*.28,1.22,rear+.026);b(.55,1.39,.008,0x9fb1ab,-side*w*.28,1.22,rear+.053);
 }else if(type===8){
  // Pressed clothes, a rail and sorting bench make laundry distinct from retail.
  const railW=Math.min(2,w*.5);b(railW,.025,.025,metal,workX,1.8,rear+.38);
  for(let j=0;j<6;j++){const xx=workX-railW*.42+j*railW*.16;b(.012,.11,.025,metal,xx,1.74,rear+.38);b(.20,.53,.085,[0x889990,0xb9b4a1,0x85969b][j%3],xx,1.43,rear+.38,.022);}
  table(-side*w*.22,-1.12,.95,.63,.84);for(let j=0;j<3;j++)b(.32,.045,.22,0xc0bcac,-side*w*.22,.91+j*.048,-1.12,.012);
 }
 // A quiet ceiling fixture and a wall return, not repeated miniature full rooms.
 if(type!==1){b(Math.min(1.12,w*.3),.055,.23,0xb2b7aa,0,h-.055,-dep*.50);b(Math.min(1.02,w*.28),.018,.17,night?0xe9d8b0:0xe0dfcc,0,h-.09,-dep*.50);}
 root.userData.visibleRoom={width:w,height:h,depth:dep,floor,doorX,type,variant,era,night,name};return root;
}

export function addUpperRoom(parent,{width,height,depth=1.30,mode=0,variant=0,night=false,
 floor=-height/2-.72,ceiling=height/2+.28,enclosed=true,furnished=true}={}){
 const room=new T.Group();room.name='UpperWindowRoom';parent.add(room);
 const {box:b}=roomBuilder(room,{night}),w=width+.10,d=depth,v=Math.abs(Math.round(variant))%6,side=v%2?1:-1;
 const clear=ceiling-floor;
 // A window is an opening in a storey, not a room whose floor starts at its sill.
 // Building callers supply shared floor/ceiling planes and keep adjacent bays open.
 if(enclosed){
  b(w,.06,d,0xa7a89a,0,floor-.03,-d/2);b(w,.06,d,0xc6c4b4,0,ceiling+.03,-d/2);
  b(w,clear,.05,0xb8bcac,0,(floor+ceiling)/2,-d);
  for(const s of [-1,1])b(.05,clear,d,0xb4b6a9,s*w/2,(floor+ceiling)/2,-d/2);
 }
 const furniture=new T.Group();furniture.name='UpperFurniture';room.add(furniture);
 const f=roomBuilder(furniture,{night}).box;
 if(furnished&&mode===1){
  const deskW=Math.min(w*.68,1.25),deskX=side*w*.06,deskY=floor+.74,deskZ=-Math.min(.60,d-.33);
  f(deskW,.045,.47,0x9d9175,deskX,deskY,deskZ);
  for(const sx of [-1,1])for(const sz of [-1,1])f(.032,.7175,.032,0x74837d,deskX+sx*(deskW/2-.065),floor+.35875,deskZ+sz*.18);
  if(v%3!==2){
   const mx=deskX+side*.10;f(.28,.21,.042,0x586e73,mx,deskY+.205,deskZ-.08);
   f(.034,.10,.035,0x687d79,mx,deskY+.075,deskZ-.08);f(.18,.025,.12,0x687d79,mx,deskY+.035,deskZ-.08);
  }else for(let j=0;j<3;j++)f(deskW*.31,.018,.19,0xd3d2c2,deskX,deskY+.0315+j*.018,deskZ);
  // No cabinet through the desk: storage sits behind it, at a separate depth.
  if(d>1.65){const ch=Math.min(1.35,clear-.2);f(Math.min(w*.44,.74),ch,.22,0xa3a998,0,floor+ch/2,-d+.17);}
 }else if(furnished&&mode===2){
  if(v%3!==2){
   const sw=Math.min(w*.60,1.15),sz=-Math.min(.68,d-.35);
   f(sw,.22,.48,[0x929f93,0xa49a87,0x8c9c9f][v%3],0,floor+.34,sz,.04);
   f(sw,.45,.09,0xadb5a3,0,floor+.565,sz-.195,.02);
   for(const sx of [-1,1])for(const zz of [-1,1])f(.045,.23,.045,0x778477,sx*(sw/2-.06),floor+.115,sz+zz*.17);
  }else{const ch=Math.min(1.38,clear-.22);f(Math.min(w*.46,.78),ch,.25,0x9f967d,0,floor+ch/2,-Math.min(d-.17,1.05));}
 }
 if(mode===2){
  const top=Math.min(ceiling-.08,height/2+.12),bottom=Math.max(floor+.08,-height/2-.30),ch=top-bottom;
  for(const s of [-1,1])for(let j=0;j<(s===side&&v>=3?5:2);j++)b(w*.075,ch,.045,[0xcac4b1,0xc0c7ba,0xbcb7a7][v%3],s*(w*.43-j*w*.06),(top+bottom)/2,(enclosed?-.10:-.36)-(j%2)*.035,.012);
 }else if(mode===0){
  // Actual blind slats stay inside the opening; no floating reflection strokes.
  const top=height/2-.035,bottom=v%3===1?-height*.16:-height/2+.08;
  for(let y=bottom;y<top-.045;y+=.105){const slat=b(width-.025,.074,.055,v%2?0xb9c3b9:0xc8c3b2,0,y,enclosed?-.11:-.32);slat.rotation.x=v%3===2?.48:.16;}
  b(width,.045,.07,0x929f95,0,top,enclosed?-.11:-.32);b(width-.025,.035,.07,0x929f95,0,bottom-.035,enclosed?-.11:-.32);
 }
 room.userData.visibleRoom={width:w,height:clear,depth:d,mode,variant,night,floor,ceiling,enclosed};return room;
}

// Storey slabs are shared; upper suites are partitioned only after all actual
// facade openings are known. Corner windows can share one room, while separate
// rooms have real party walls and independent baked lighting. Retail is separate.
export function buildingRoomLayout(parent,{width,depth,base,top,night=false,centerX=0,centerZ=0}={}){
 const floors=new Map(),rooms=[],occupied=[],windows=[],root=new T.Group();root.name='BuildingInteriorFloors';root.position.set(centerX,0,centerZ);parent.add(root);
 const {box:b}=roomBuilder(root,{night});
 function add(holder,options,floor,ceiling){
  floor=Math.max(base+.08,floor);ceiling=Math.min(top-.15,ceiling);
  const key=[floor.toFixed(3),ceiling.toFixed(3)].join('/');
  if(!floors.has(key)){
   const slab=b(width-.36,.08,depth-.36,0xaaa99a,0,floor-.04,0),soffit=b(width-.36,.06,depth-.36,0xc6c4b4,0,ceiling+.03,0);
   floors.set(key,{floor,ceiling});slab.name='SharedStoreyFloor';soffit.name='SharedStoreyCeiling';
  }
  // Only the current opening needs world transforms; updating every earlier room here is quadratic.
  holder.updateWorldMatrix(true,false);
  const inv=parent.matrixWorld.clone().invert(),pos=new T.Vector3().setFromMatrixPosition(inv.clone().multiply(holder.matrixWorld));
  const normal=new T.Vector3(0,0,1).transformDirection(inv.clone().multiply(holder.matrixWorld)),onSide=Math.abs(normal.x)>.5;
  const u=onSide?pos.z-centerZ:pos.x-centerX,span=onSide?depth:width;
  const room=addUpperRoom(holder,{...options,night,floor:floor-pos.y,ceiling:ceiling-pos.y,enclosed:false,furnished:options.furnished!==false&&Math.abs(u)<span/2-.9});
  // Resolve adjoining corner furniture at construction time, not every frame.
  // Keep one useful furnishing instead of intersecting copies seen through two panes.
  room.position.z=options.recess??0;
  const furniture=room.getObjectByName('UpperFurniture');
  if(furniture.children.length){
   let placed=false;
   for(const shift of [0,-Math.sign(u)*.3,-Math.sign(u)*.6]){
    furniture.position.x=shift;furniture.updateWorldMatrix(true,true);
    const bounds=new T.Box3().setFromObject(furniture).applyMatrix4(inv),margin=.08;
    const inside=bounds.min.x>=centerX-width/2+.20&&bounds.max.x<=centerX+width/2-.20&&bounds.min.z>=centerZ-depth/2+.20&&bounds.max.z<=centerZ+depth/2-.20;
    const padded=bounds.clone().expandByVector(new T.Vector3(margin,0,margin));
    if(inside&&!occupied.some(b=>b.intersectsBox(padded))){occupied.push(padded);placed=true;if(shift)root.userData.adjustedFurniture=(root.userData.adjustedFurniture||0)+1;break;}
   }
   if(!placed){furniture.removeFromParent();root.userData.cornerDuplicatesOmitted=(root.userData.cornerDuplicatesOmitted||0)+1;}
  }
  windows.push({room,holder,floor,ceiling,key,pos,axis:onSide?'z':'x',u,width:options.width,options});
  rooms.push(room);root.userData.storeys=[...floors.values()];return room;
 }

 function finish({lighting=null}={}){
  if(root.userData.partitioned)return root.userData.plans;
  root.userData.partitioned=true;root.userData.plans=[];
  const toRoot=new T.Matrix4();parent.updateMatrixWorld(true);toRoot.copy(root.matrixWorld).invert();
  function shade(node,state){if(!night||!state)return;node.traverse(n=>{if(!n.isMesh)return;const color=n.material.color.clone().multiplyScalar(state.strength);if(state.warm)color.multiply(new T.Color(1,.94,.79));n.material=material(color.getHex(),true);n.userData.roomSurface=true;});}
  for(const [key,level]of floors){
   const ws=windows.filter(w=>w.key===key),plan=planStorey(width,depth,ws),floor=level.floor,ceiling=level.ceiling,clear=ceiling-floor;
   const row=root.userData.plans.length;
   const states=new Map(plan.cells.map(c=>[c.id,lighting?.(row,c)]));
   // Retain one floor/ceiling group per storey; panels get their room's baked light.
   if(night)for(const node of [...root.children])if((node.name==='SharedStoreyFloor'&&Math.abs(node.position.y-(floor-.04))<.001)||(node.name==='SharedStoreyCeiling'&&Math.abs(node.position.y-(ceiling+.03))<.001))node.removeFromParent();
   const slabs=new T.Group(),ceilings=new T.Group();slabs.name='SharedStoreyFloor';ceilings.name='SharedStoreyCeiling';if(night)root.add(slabs,ceilings);
   const partitions=[];
   for(const c of plan.cells){
    const state=states.get(c.id),cellGroup=new T.Group();cellGroup.name='StoreySuite';cellGroup.userData.suite={...c,floor,ceiling,state};root.add(cellGroup);
    const bb=roomBuilder(cellGroup,{night}).box,ww=c.x1-c.x0,dd=c.z1-c.z0,cx=(c.x0+c.x1)/2,cz=(c.z0+c.z1)/2;
    if(night){const slab=bb(ww,.08,dd,0xaaa99a,cx,floor-.04,cz),soffit=bb(ww,.06,dd,0xc6c4b4,cx,ceiling+.03,cz);shade(slab,state);shade(soffit,state);slabs.add(slab);ceilings.add(soffit);}
    // Each room owns the inward half of a party wall, allowing genuinely separate lights.
    for(const [axis,position,interior]of [['x',c.x0,c.ix>0],['x',c.x1,c.ix<plan.xs.length-2],['z',c.z0,c.iz>0],['z',c.z1,c.iz<plan.zs.length-2]]){
     if(!interior)continue;const isX=axis==='x',low=position===(isX?c.x0:c.z0),offset=(low?1:-1)*plan.wall/4;
     const n=bb(isX?plan.wall/2:ww,clear,isX?dd:plan.wall/2,0xb6b9ab,isX?position+offset:cx,(floor+ceiling)/2,isX?cz:position+offset);n.name='RoomPartition';partitions.push(n);
     // A closed interior door gives rooms a credible connection; no fake rear windows.
     const dh=Math.min(1.98,clear-.14),dw=Math.min(.78,(isX?dd:ww)*.35),doorAt=isX?cz:cx,face=position+(low?1:-1)*(plan.wall/2+.009);
     const door=bb(isX?.018:dw,dh,isX?dw:.018,0x8d9587,isX?face:doorAt,floor+dh/2,isX?doorAt:face);door.name='ClosedInteriorDoor';
     // A single closed-door panel is sufficient at street viewing distance.
     // Repeated tiny frame/handle meshes on unseen partitions waste mobile budget.
    }
    shade(cellGroup,state);
   }
   for(const w of ws){
    const px=w.pos.x-centerX,pz=w.pos.z-centerZ,c=plan.cellAt(px,pz),state=states.get(c.id);
    w.room.userData.suite={id:c.id,storey:row,...c,state};
    const furniture=w.room.getObjectByName('UpperFurniture');
    if(state&&!state.lit&&furniture)furniture.removeFromParent();
    if(furniture?.parent&&furniture.children.length){
     furniture.updateWorldMatrix(true,true);const bb=new T.Box3().setFromObject(furniture).applyMatrix4(toRoot),gap=.09;
     if(bb.min.x<c.x0+gap||bb.max.x>c.x1-gap||bb.min.z<c.z0+gap||bb.max.z>c.z1-gap){furniture.removeFromParent();root.userData.partitionFurnitureOmitted=(root.userData.partitionFurnitureOmitted||0)+1;}
    }
    shade(w.room,state);
   }
   root.userData.plans.push({floor,ceiling,xs:plan.xs,zs:plan.zs,cells:plan.cells.map(c=>({...c,state:states.get(c.id)})),windows:ws.map(w=>({x:w.pos.x-centerX,z:w.pos.z-centerZ,y:w.pos.y,width:w.width,axis:w.axis,u:w.u,suite:w.room.userData.suite.id}))});
  }
  return root.userData.plans;
 }
 return {add,finish,root,rooms};

}
// Closed building shell with true rectangular openings. Floors, corners and rear
// faces remain solid; furniture is never hidden inside an old solid box.
export function facadeShell(w,h,d,base,openings,thickness=.18){
 const parts=[],put=(ww,hh,dd,x,y,z,ry=0)=>{if(Math.min(ww,hh,dd)<.0001)return;const g=new T.BoxGeometry(ww,hh,dd);g.rotateY(ry);g.translate(x,y,z);parts.push(g);};
 for(let side=0;side<4;side++){
  const span=side%2?d:w,dep=side%2?w:d,ry=side*Math.PI/2,cuts=openings.filter(o=>o.side===side);
  const xs=[...new Set([-span/2,span/2,...cuts.flatMap(o=>[Math.max(-span/2,o.a),Math.min(span/2,o.b)])])].sort((a,b)=>a-b);
  const ys=[...new Set([base,base+h,...cuts.flatMap(o=>[Math.max(base,o.low),Math.min(base+h,o.high)])])].sort((a,b)=>a-b);
  for(let iy=1;iy<ys.length;iy++){
   const lo=ys[iy-1],hi=ys[iy],y=(lo+hi)/2;let run=null;
   const flush=end=>{if(run===null)return;const u=(run+end)/2,v=dep/2-thickness/2;put(end-run,hi-lo,thickness,Math.cos(ry)*u+Math.sin(ry)*v,y,-Math.sin(ry)*u+Math.cos(ry)*v,ry);run=null;};
   for(let ix=1;ix<xs.length;ix++){
    const a=xs[ix-1],b=xs[ix],u=(a+b)/2;
    if(cuts.some(o=>u>o.a&&u<o.b&&y>o.low&&y<o.high))flush(a);else if(run===null)run=a;
   }
   flush(xs.at(-1));
  }
 }
 put(w,.14,d,0,base-.07,0);put(w,.14,d,0,base+h-.07,0);
 const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());return merged;
}

export function interiorGlass(night=false){
 const key='glass/'+night;
 if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:night?0x91aeb5:0xc0d6d4,transparent:true,opacity:night?.12:.15,roughness:.23,metalness:.12,depthWrite:false,side:T.DoubleSide,forceSinglePass:true}));
 return materials.get(key);
}

// Transparent panes share material and spatial batches, rather than a draw call
// for every window. Night rooms use baked colour, keeping the city light budget.
export function batchInteriorVisuals(root,{glassOnly=false}={}){
 root.updateMatrixWorld(true);const inv=root.matrixWorld.clone().invert(),buckets=new Map();
 root.traverse(n=>{if(!n.isMesh||n.isInstancedMesh||Array.isArray(n.material))return;const m=n.material;
  if(!(m===interiorGlass(false)||m===interiorGlass(true)||!glassOnly&&m.isMeshBasicMaterial&&n.parent?.userData.interiorBatch))return;
  const p=n.getWorldPosition(new T.Vector3());const key=[m.uuid,Math.floor(p.x/14),Math.floor(p.z/14)].join('/');if(!buckets.has(key))buckets.set(key,{m,nodes:[]});buckets.get(key).nodes.push(n);
 });
 for(const {m,nodes}of buckets.values()){
  const gs=nodes.map(n=>{const g=n.geometry.clone();g.applyMatrix4(inv.clone().multiply(n.matrixWorld));return g.index?g.toNonIndexed():g;});
  const merged=mergeGeometries(gs);gs.forEach(g=>g.dispose());if(!merged)continue;const mesh=new T.Mesh(merged,m);mesh.name='InteriorGlassBatch';root.add(mesh);nodes.forEach(n=>n.removeFromParent());
 }
}
