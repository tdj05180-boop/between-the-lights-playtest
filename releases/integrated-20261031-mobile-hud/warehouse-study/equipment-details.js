import {P,T} from './geometry.js';

// Stationary equipment only. Belt rollers, parcel routes and collision envelopes
// remain owned by props.js and space.js.
export function rackFrame(k,g,length,height){
 const beamColor=0xa8946f;
 for(const dz of [-length/2,0,length/2])for(const dx of [-.85,.85]){
  k.box(.13,height,.13,P.frame,dx,height/2+.1,dz,g,.009);
  k.box(.34,.1,.34,P.dark,dx,.16,dz,g,.012);
  for(const ox of [-.115,.115])for(const oz of [-.115,.115])k.cyl(.023,.025,P.steel,dx+ox,.2225,dz+oz,g,6);
  // The punched column and beam locking plates read as one assembled frame.
  for(const y of [.5,2.2,3.9]){
   k.box(.16,.29,.027,beamColor,dx,y,dz+(dz<=0?1:-1)*.071,g,.003);
   for(const dy of [-.065,.065])k.box(.018,.029,.006,P.dark,dx,y+dy,dz+(dz<=0?1:-1)*.087,g,.002);
  }
 }
 for(const y of [.5,2.2,3.9]){
  for(const side of [-1,1]){
   // A thin steel web with two returned flanges, instead of a solid wooden bar.
   k.box(.035,.20,length,beamColor,side*.815,y,0,g,.004);
   for(const dy of [-.087,.087])k.box(.12,.026,length,beamColor,side*.785,y+dy,0,g,.003);
  }
  for(const dz of [-length/2+.08,0,length/2-.08])k.box(1.5,.07,.10,P.steel,0,y-.013,dz,g,.006);
 }
 // End frames leave the longitudinal loading openings unobstructed.
 for(const dz of [-length/2,length/2]){
  for(const y of [.39,2.08,3.78,height-.15])k.box(1.6,.065,.07,P.frame,0,y,dz,g,.004);
  const levels=[.39,2.08,3.78,height-.15];
  for(let i=0;i<levels.length-1;i++)k.beam([i%2?.78:-.78,levels[i],dz],[i%2?-.78:.78,levels[i+1],dz],.045,.035,P.steel,g);
 }
}

export function conveyorDrive(k,g){
 // Enclosed geared drive in the existing motor footprint; no exposed shaft
 // stretches across the pedestrian lane.
 k.box(.42,.40,.60,P.blue,-.9,.6,0,g,.045);
 k.box(.45,.045,.66,P.steel,-.9,.378,0,g,.008);
 k.box(.08,.22,.40,P.frame,-.69,.69,0,g,.012);
 for(const z of [-.24,.24])k.beam([-.62,.80,z],[-.9,.377,z],.045,.055,P.frame,g);
 const motor=k.cyl(.14,.5,P.dark,-1.14,.6,0,g,16);motor.rotation.x=Math.PI/2;
 for(const z of [-.25,.25]){const cap=k.cyl(.145,.035,P.steel,-1.14,.6,z,g,16);cap.rotation.x=Math.PI/2;}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const fin=k.box(.012,.035,.40,P.dark,-1.14+Math.sin(a)*.142,.6+Math.cos(a)*.142,0,g,.002);fin.rotation.z=-a;}
 for(const z of [-.21,.21])k.box(.08,.105,.055,P.frame,-1.14,.4075,z,g,.005);
 for(const dx of [-1.02,-.77])for(const dz of [-.24,.24])k.cyl(.018,.018,P.dark,dx,.409,dz,g,6);
}

export function inspectionWorkbench(k){
 const g=k.group(-7,0,8.3);g.name='warehouse-inspection-workbench';
 k.box(2.3,.12,.85,P.wood,0,1,0,g,.025);
 for(const dx of [-.95,.95])for(const dz of [-.3,.3]){
  k.box(.085,.9,.085,P.frame,dx,.56,dz,g,.008);
  k.box(.105,.028,.105,P.dark,dx,.124,dz,g,.006);
 }
 for(const dz of [-.3,.3])k.box(1.9,.065,.06,P.frame,0,.88,dz,g,.006);
 for(const dx of [-.95,.95]){k.box(.07,.065,.61,P.frame,dx,.88,0,g,.006);k.box(.07,.07,.61,P.frame,dx,.32,0,g,.006);}
 k.box(1.9,.05,.045,P.frame,0,.32,-.3,g,.004);
 // Low parcel scale: four feet sit on the retained tabletop.
 for(const dx of [.09,.51])for(const dz of [-.17,.17])k.box(.05,.025,.05,P.dark,dx,1.0725,dz,g,.004);
 k.box(.60,.065,.50,P.steel,.3,1.1165,0,g,.02);
 k.box(.57,.018,.44,P.wallLight,.3,1.158,0,g,.012);
 k.box(.27,.035,.012,P.dark,.3,1.12,.253,g,.003);
 // Existing terminal position, with a legible bezel and tilted LCD inset.
 k.box(.23,.025,.19,P.dark,-.75,1.0725,-.1,g,.012);
 k.box(.085,.36,.085,P.frame,-.75,1.26,-.1,g,.009);
 const head=k.group(-.75,1.50,-.1,g);head.rotation.x=-.08;
 k.box(.38,.245,.085,P.dark,0,0,0,head,.022);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');
 c.fillStyle='#658179';c.fillRect(0,0,256,128);c.fillStyle='#d7dfc2';c.font='20px monospace';c.fillText('WEIGHT / kg',14,28);c.font='42px monospace';c.fillText('0.000',27,84);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const lcd=new T.Mesh(new T.PlaneGeometry(.315,.163),new T.MeshStandardMaterial({map,roughness:.58}));lcd.position.set(0,.01,.0435);head.add(lcd);
 for(const x of [-.12,-.05,.02,.09])k.box(.029,.013,.008,P.wallLight,x,-.096,.045,head,.003);
 // An attached cord runs down the stand, then stays under the table lip.
 const path=new T.CatmullRomCurve3([[-.75,1.42,-.15],[-.75,1.20,-.16],[-.77,1.073,-.18],[-.96,1.068,-.35],[-.99,.84,-.38]].map(a=>new T.Vector3(...a)));
 const cord=new T.Mesh(new T.TubeGeometry(path,18,.006,4,false),k.mat(P.dark));g.add(cord);
 k.box(.16,.09,.035,P.dark,-.99,.85,-.385,g,.008);
 return g;
}
