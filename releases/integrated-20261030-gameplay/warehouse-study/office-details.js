import {P,T} from './geometry.js';

// Small, physical paper label on the exterior face of the existing door glass.
export function addOfficeDoorNotice(k,parent){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=224;
 const c=canvas.getContext('2d');c.fillStyle='#e5dfca';c.fillRect(0,0,512,224);
 c.fillStyle='#987464';c.fillRect(12,12,488,4);c.fillRect(12,208,488,4);
 c.textAlign='center';c.textBaseline='middle';c.fillStyle='#48594e';c.font='500 40px system-ui';c.fillText('관계자 외',256,77);
 c.fillStyle='#845b4c';c.font='600 48px system-ui';c.fillText('출입금지',256,149);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const label=new T.Mesh(new T.PlaneGeometry(.55,.24),k.mat(0xffffff,{map,roughness:1}));
 label.name='warehouse-office-door-notice';label.rotation.y=-Math.PI/2;
 label.position.set(17.288,2.23,13.25);label.receiveShadow=true;parent.add(label);
 return label;
}

// Modest wood/painted-metal file storage, retaining the previous shelf's location.
export function addOfficeFileShelf(k,parent){
 const g=k.group(21.15,0,13.1,parent);g.name='warehouse-office-file-shelf';
 const b=(w,h,d,c,x,y,z)=>k.box(w,h,d,c,x,y,z,g,.008);
 for(const x of [-.24,.24])for(const z of [-.79,.79])b(.07,.17,.07,P.frame,x,.235,z);
 b(.055,2.16,1.72,0xa5ac99,.305,1.4,0); // backed cabinet, open toward the windows
 for(const z of [-.84,.84])b(.65,2.16,.055,P.frame,0,1.4,z);
 for(const y of [.34,1.01,1.68,2.43])b(.65,.07,1.74,P.wood,0,y,0);
 const colors=[0x708c88,0xb8ad8d,0x8a9694,0x9a967e];
 for(const [row,positions] of [[.34,[-.66,-.52,-.38,-.24,.12,.26,.4,.54]],[1.01,[-.63,-.49,-.35,-.21]]]){
  for(const [i,z] of positions.entries()){
   const y=row+.035+.23;
   b(.44,.46,.115,colors[i%colors.length],-.04,y,z);
   b(.012,.465,.12,colors[i%colors.length],-.266,y,z); // defined binder spine
   b(.007,.16,.076,0xe0dac5,-.275,y+.05,z);
   b(.008,.012,.045,0x8e9787,-.28,y+.075,z);
   const hole=k.cyl(.014,.008,P.dark,-.28,y-.12,z,g,8);hole.rotation.z=Math.PI/2;
  }
 }
 for(const [y,z,width] of [[1.01,.43,.53],[1.68,-.44,.58],[1.68,.37,.66]]){
  b(.48,.37,width,P.card,-.015,y+.22,z);
  b(.5,.04,width+.025,0xb5a788,-.015,y+.425,z);
  b(.008,.11,width*.45,0xe1dbc5,-.26,y+.23,z);
  b(.012,.025,.11,P.dark,-.267,y+.29,z);
 }
 return g;
}

// Shared equipment body; the existing office installation retains its exact pose.
export function addOfficeExtinguisher(k,parent,{x=20.9,y=.11,z=14.94,wallMounted=true}={}){
 const g=k.group(x,y,z,parent);g.name='warehouse-office-extinguisher';
 const red=0xa76553;
 k.cyl(.115,.03,P.dark,0,.015,0,g,12); // floor contact
 k.cyl(.10,.45,red,0,.255,0,g,12);
 const shoulder=new T.Mesh(new T.CylinderGeometry(.047,.10,.075,12),k.mat(red));shoulder.position.y=.5175;g.add(shoulder);
 k.cyl(.034,.07,P.steel,0,.585,0,g,8);
 k.box(.16,.025,.045,P.dark,-.045,.632,0,g,.006);
 k.box(.12,.016,.035,P.dark,-.036,.663,0,g,.004);
 const gauge=k.cyl(.027,.018,P.steel,0,.591,.04,g,10);gauge.rotation.x=Math.PI/2;
 const dial=k.cyl(.019,.019,0xe0ddc5,0,.591,.05,g,10);dial.rotation.x=Math.PI/2;
 k.box(.11,.19,.014,0xe2d9bd,0,.29,.094,g,.004);
 for(const y of [.245,.28,.32])k.box(.074,.012,.004,0x806f59,0,y,.103,g,.001);
 const path=new T.CatmullRomCurve3([[.035,.61,0],[.135,.57,.01],[.132,.35,.015],[.10,.18,.02]].map(p=>new T.Vector3(...p)));
 const hose=new T.Mesh(new T.TubeGeometry(path,12,.011,5,false),k.mat(P.rubber));g.add(hose);
 // A retaining strap is visibly attached to the office's south wall (z=14.78).
 if(wallMounted){k.box(.08,.24,.024,P.dark,0,.36,-.148,g,.004);
 k.box(.035,.04,.065,P.dark,0,.30,-.116,g,.004);}
 return g;
}
