import {T} from '../experiments/spaces/kit.js';
import {cablePath} from './furniture-cable.js';

// 2019 visuals only. Original collision boxes, mission papers and lights stay in space.js.
export function officeFurniture2019(k){
 const {world,box,mat}=k,ink=0x303b3a,metal=0x586761,wood=0x8d7b61,paper=0xaaa797;
 const cube=new T.BoxGeometry(1,1,1),details={monitors:[],cables:[],desks:[],chairs:[],cabinets:[]};
 const screenMaterial=new T.MeshStandardMaterial({color:0x101516,roughness:.24,metalness:.10,emissive:0x000000});
 const b=(p,w,h,d,c,x,y,z)=>box(w,h,d,c,x,y,z,p);
 const flat=(p,w,h,d,c,x,y,z)=>{const o=new T.Mesh(cube,mat(c));o.scale.set(w,h,d);o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;p.add(o);return o;};
 const group=(x,z,angle=0)=>{const p=new T.Group();p.position.set(x,0,z);p.rotation.y=angle;world.add(p);return p;};
 const cylinder=(p,r,h,c,x,y,z)=>{const o=new T.Mesh(new T.CylinderGeometry(r,r,h,8),mat(c));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
 function rod(p,a,b,r=.012,c=metal){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const n=cylinder(p,r,delta.length(),c,0,0,0);n.position.copy(start.add(end).multiplyScalar(.5));n.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return n;}
 function wire(p,name,points){
  const curve=cablePath(points),o=new T.Mesh(new T.TubeGeometry(curve,40,.0055,4,false),mat(ink));o.castShadow=false;o.receiveShadow=true;o.name='2019-cable-'+name;p.add(o);
  details.cables.push({name,desk:[p.position.x,p.position.z],anchors:points,samples:curve.getPoints(200).map(v=>v.toArray())});
 }
 function stack(p,x,y,z,n=3){for(let i=0;i<n;i++)flat(p,.25,.01,.32,paper,x+(i%2)*.009,y+.005+i*.011,z);flat(p,.18,.003,.015,metal,x,y+n*.011+.002,z-.07);}
 function tray(p,x,z,n){for(let j=0;j<2;j++){b(p,.33,.015,.39,metal,x,1.06+j*.075,z);for(const s of [-1,1])flat(p,.012,.05,.39,metal,x+s*.16,1.087+j*.075,z);flat(p,.33,.05,.014,metal,x,1.087+j*.075,z-.19);}stack(p,x,1.152,z,n);}
 function chair(x,z,i){
  // Keep every caster and arm within the original .56 x .58 collider.
  const p=group(x,z,[-.035,.025,.04,-.025][i]);p.name='2019-chair-'+i;
  cylinder(p,.035,.33,metal,0,.375,0);
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5,xx=Math.sin(a)*.215,zz=Math.cos(a)*.215;rod(p,[0,.24,0],[xx,.20,zz],.017);const wheel=cylinder(p,.032,.038,ink,xx,.174,zz);wheel.rotation.z=Math.PI/2;}
  b(p,.46,.095,.43,metal,0,.58,0);b(p,.40,.028,.37,ink,0,.518,0);
  const back=b(p,.46,.48,.065,ink,0,.907,.218);back.rotation.x=.055;
  b(p,.40,.39,.042,0x54635b,0,.912,.169);b(p,.37,.065,.025,metal,0,.766,.144);
  for(const side of [-1,1]){rod(p,[side*.219,.59,.08],[side*.224,.76,.06],.012);b(p,.049,.035,.25,ink,side*.237,.778,.008);}
  p.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(p,true);details.chairs.push({x,z,min:bb.min.toArray(),max:bb.max.toArray()});
 }
 function workstation(x,z,i){
  const p=group(x,z);p.name='2019-desk-'+i;
  b(p,2.4,.12,1.1,wood,0,.98,0);b(p,2.35,.025,1.05,0x685e4f,0,.911,0);
  for(const dx of [-1.05,1.05]){for(const dz of [-.42,.42]){b(p,.065,.77,.065,metal,dx,.525,dz);b(p,.086,.033,.086,ink,dx,.15,dz);}b(p,.062,.062,.86,metal,dx,.87,0);}
  b(p,2.08,.05,.065,metal,0,.88,-.40);b(p,1.91,.24,.025,0x716d5d,0,.72,-.32);
  // Original monitor centre, width, height and orientation, with a finished back.
  b(p,.34,.023,.25,metal,0,1.052,-.15);rod(p,[0,1.067,-.19],[0,1.31,-.23],.025);
  b(p,.77,.48,.09,ink,0,1.44,-.2);b(p,.47,.29,.034,0x3c4745,0,1.44,-.258);
  const screen=new T.Mesh(new T.PlaneGeometry(.677,.367),screenMaterial);screen.position.set(0,1.454,-.153);screen.name='2019-monitor-off-'+i;p.add(screen);
  flat(p,.705,.025,.017,metal,0,1.231,-.144);
  // Unlit power button and rear ventilation / plugged sockets, no LEDs or screen texture.
  flat(p,.015,.007,.008,ink,.306,1.232,-.132);
  for(let j=0;j<8;j++)flat(p,.040,.008,.004,ink,-.19+j*.055,1.615,-.247);
  const ports={data:[-.10,1.32,-.297],power:[.12,1.32,-.297]};
  for(const a of Object.values(ports))b(p,.037,.024,.025,ink,a[0],a[1],a[2]+.012);
  details.monitors.push({index:i,position:[x,1.44,z-.2],screenColor:screenMaterial.color.getHex(),emissive:screenMaterial.emissive.getHex(),hasTexture:!!screenMaterial.map});
  b(p,.57,.032,.20,0x66746c,0,1.063,.28);
  for(let row=0;row<4;row++)for(let col=0;col<12;col++)flat(p,.034,.008,.028,0x929b8c,-.25+col*.045,1.084,.212+row*.038);
  flat(p,.21,.008,.026,0x929b8c,-.04,1.085,.363);
  b(p,.235,.004,.255,0x45534e,.45,1.043,.28);
  const mouse=new T.Mesh(new T.SphereGeometry(1,10,6),mat(0x68756d));mouse.scale.set(.044,.027,.068);mouse.position.set(.44,1.071,.28);p.add(mouse);flat(p,.005,.004,.026,ink,.44,1.098,.266);
  const tx=x<0?-.83:.83,tz=-.02;
  b(p,.29,.54,.43,ink,tx,.425,tz);b(p,.263,.49,.018,metal,tx,.427,tz+.225);
  for(let j=0;j<7;j++)flat(p,.17,.012,.007,ink,tx,.28+j*.022,tz+.238);
  b(p,.18,.031,.008,ink,tx,.625,tz+.237);flat(p,.018,.018,.008,0x879288,tx-.09,.61,tz+.241);
  for(let j=0;j<2;j++)flat(p,.032,.012,.007,ink,tx+.058,j*.032+.585,tz+.241);
  for(const dx of [-.10,.10])b(p,.045,.026,.33,metal,tx+dx,.145,tz);
  b(p,.255,.47,.013,metal,tx,.425,tz-.219);
  for(let j=0;j<6;j++)flat(p,.15,.009,.006,ink,tx,.37+j*.022,tz-.229);
  const pc={data:[tx,.566,tz-.251],power:[tx,.30,tz-.251]};
  for(const a of Object.values(pc))b(p,.038,.025,.032,ink,a[0],a[1],a[2]+.016);
  // A flush floor socket under the desk supplies a plugged-in strip; no new wall opening.
  const sx=tx*.44,sz=-.20;
  b(p,.45,.052,.11,0xa7aa99,sx,.168,sz);
  const plugs=[sx-.135,sx+.02];for(const px of plugs){flat(p,.062,.006,.07,metal,px,.197,sz);b(p,.044,.03,.044,ink,px,.215,sz);}
  const supplySide=tx<0?1:-1,fx=sx+supplySide*.21;
  flat(p,.12,.012,.13,metal,fx,.142,.08);b(p,.058,.018,.062,0xaaa99a,fx,.157,.08);b(p,.043,.029,.042,ink,fx,.18,.08);
  wire(p,'monitor-data',[ports.data,[-.10,1.28,-.37],[-.10,1.14,-.62],[-.10,.56,-.62],[tx,.55,-.62],[tx,.566,-.33],pc.data]);
  wire(p,'monitor-power',[ports.power,[.12,1.27,-.39],[.16,1.13,-.66],[.16,.38,-.66],[plugs[0],.30,-.51],[plugs[0],.25,sz],[plugs[0],.231,sz]]);
  wire(p,'tower-power',[pc.power,[tx,.30,-.38],[tx*.75,.26,-.39],[plugs[1],.253,sz],[plugs[1],.231,sz]]);
  wire(p,'strip-supply',[[sx+supplySide*.226,.168,sz],[sx+supplySide*.32,.163,sz],[sx+supplySide*.35,.157,.015],[fx,.20,.08],[fx,.195,.08]]);
  if(i===0||i===2)tray(p,-.84,.12,i===0?4:2);else stack(p,-.84,1.042,.12,2);
  if(i===1){b(p,.27,.028,.34,0x687970,.83,1.06,.16);flat(p,.04,.005,.31,0x9b9987,.76,1.077,.16);}else if(i===3)stack(p,.84,1.042,.12,3);
  if(i!==2){cylinder(p,.044,.12,metal,-.60,1.105,-.30);for(let j=0;j<3;j++)rod(p,[-.62+j*.018,1.10,-.30],[-.615+j*.018,1.23+(j%2)*.025,-.30],.004,j%2?0x8d7764:ink);}
  flat(p,.14,.008,.14,0xa9a48a,i%2?-.39:.7,1.046,.28);
  details.desks.push({x,z,w:2.4,d:1.1});chair(x+(x<0?-.25:.25),z+.95,i);
 }
 function cabinet(x,z,i){
  const p=group(x,z,x<0?Math.PI/2:-Math.PI/2);p.name='2019-cabinet-'+i;
  const w=1.25,d=.57;
  b(p,w, .065,d,metal,0,.1525,0);b(p,w,.065,d,metal,0,2.8875,0);
  for(const s of [-1,1])b(p,.05,2.67,d,metal,s*.60,1.52,0);
  b(p,1.15,2.67,.028,0x3a4943,0,1.52,-.267);
  const levels=[.22,.79,1.49,2.19];
  for(let row=0;row<4;row++){
   const y=levels[row];b(p,1.15,.055,.53,wood,0,y-.0275,0);
   const variant=(i+row)%3;
   if(variant===0){
    for(let j=0;j<5;j++){const xx=-.43+j*.176,h=.33+(j%3)*.048,color=[0x68796d,0x928c74,0x79858a][(i+j)%3];b(p,.13,h,.36,color,xx,y+h/2,-.025);flat(p,.068,.115,.004,paper,xx,y+h*.57,.158);flat(p,.038,.008,.005,metal,xx,y+h*.57,.163);flat(p,.025,.025,.006,ink,xx,y+.065,.164);}
   }else if(variant===1){
    for(const [j,xx] of [[0,-.30],[1,.28]]){const hh=j?.29:.34;b(p,.45,hh,.40,0x938c79,xx,y+hh/2,0);b(p,.47,.032,.42,0xa29b86,xx,y+hh+.016,0);flat(p,.15,.07,.006,paper,xx,y+hh*.58,.203);flat(p,.07,.013,.007,ink,xx,y+hh*.58,.207);}
   }else{
    for(let j=0;j<4;j++){flat(p,.44,.024,.36,j%2?paper:0x7e8a7d,-.28+j%2*.012,y+.014+j*.026,-.02);}
    flat(p,.05,.004,.37,metal,-.28,y+.106,-.02);
    for(let j=0;j<3;j++){const xx=.16+j*.12;b(p,.085,.32+j*.035,.34,[0x847d6d,0x6f8175,0x949885][j],xx,y+.16+j*.0175,-.03);flat(p,.042,.10,.006,paper,xx,y+.19,.143);}
   }
  }
  p.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(p,true);details.cabinets.push({x,z,min:bb.min.toArray(),max:bb.max.toArray()});
 }
 world.userData.officeFurniture2019=details;
 return {workstation,cabinet,details};
}
