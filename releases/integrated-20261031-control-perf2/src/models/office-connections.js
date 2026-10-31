import * as T from '../vendor/three.module.min.js';

// Visual connectors only: local coordinates, metres. No collision/gameplay changes.
// A socket's local +Y is its outward normal; returned anchors are cable exits.
export function officeConnections(k,parent){
 const root=new T.Group();root.name='office-connections';parent.add(root);
 const records={power:[],data:[],cables:[]};root.userData.connections=records;
 const colors={case:0xa4aaa0,face:0xd0d0bf,dark:0x303b3a,contact:0x8a918a,lan:0x647d7c};
 function mesh(p,g,c,x=0,y=0,z=0){const o=new T.Mesh(g,k.mat(c));o.position.set(x,y,z);o.receiveShadow=true;p.add(o);return o;}
 const box=(p,w,h,d,c,x=0,y=0,z=0)=>mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);
 const cyl=(p,r,h,c,x=0,y=0,z=0)=>mesh(p,new T.CylinderGeometry(r,r,h,12),c,x,y,z);
 function socket(p,x,y,z){
  const g=new T.Group();g.position.set(x,y,z);p.add(g);
  box(g,.058,.007,.058,colors.face,0,-.0035,0);
  const rim=mesh(g,new T.TorusGeometry(.0215,.003,5,16),colors.face);rim.rotation.x=Math.PI/2;
  cyl(g,.019,.002,colors.case,0,-.002,0);
  for(const dx of [-.0095,.0095])cyl(g,.0025,.001,colors.dark,dx,-.0005,0);
  for(const s of [-1,1])box(g,.009,.006,.0025,colors.contact,0,.001,s*.019);
  return g;
 }
 function plug(g){
  // Seated round nose and both embedded pins, with visible side earth contacts.
  cyl(g,.0165,.014,colors.dark,0,.006,0);
  for(const dx of [-.0095,.0095])cyl(g,.002,.012,colors.contact,dx,-.004,0);
  for(const s of [-1,1])box(g,.007,.012,.002,colors.contact,0,.006,s*.0165);
  cyl(g,.019,.021,colors.dark,0,.019,0);cyl(g,.0055,.017,colors.dark,0,.037,0);
  return g.localToWorld(new T.Vector3(0,.0455,0));
 }
 function power(p,x,y,z,label){const g=socket(p,x,y,z);root.updateMatrixWorld(true);const exit=root.worldToLocal(plug(g)).toArray();records.power.push({label,center:root.worldToLocal(g.localToWorld(new T.Vector3())).toArray(),exit});return exit;}
 function rj45(p,position,normal=[0,1,0],label='LAN'){
  const g=new T.Group();g.position.set(...position);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...normal));p.add(g);
  box(g,.026,.009,.023,colors.face,0,-.0045,0);box(g,.017,.001,.014,colors.dark,0,.0005,0);
  for(let i=0;i<8;i++)box(g,.001,.001,.004,colors.contact,-.00525+i*.0015,.0012,-.004);
  box(g,.013,.014,.010,0x89948d,0,.009,0);box(g,.005,.009,.002,colors.face,0,.007,.006);
  box(g,.010,.012,.009,colors.lan,0,.021,0);cyl(g,.004,.009,colors.lan,0,.030,0);
  root.updateMatrixWorld(true);const exit=root.worldToLocal(g.localToWorld(new T.Vector3(0,.0345,0))).toArray();records.data.push({label,exit});return exit;
 }
 function floorBox(x,z,count=2,y=.133){
  const p=new T.Group();p.position.set(x,y,z);root.add(p);const w=count*.075+.067,d=.125;
  box(p,w,.022,d,colors.case,0,.011,0);box(p,w-.009,.003,d-.009,colors.face,0,.0235,0);
  const outlets=[];for(let i=0;i<count;i++)outlets.push(power(p,-w/2+.039+i*.075,.027,0,'floor-'+i));
  // Separate data compartment: never share a power socket with a network plug.
  box(p,.003,.003,d-.014,colors.case,w/2-.054,.026,0);
  const lan=rj45(p,[w/2-.026,.027,0],[0,1,0],'floor-RJ45');
  for(const dx of [-1,1])for(const dz of [-1,1])cyl(p,.002,.002,colors.contact,dx*(w/2-.006),.026,dz*(d/2-.006));
  return {power:outlets,lan};
 }
 function strip(x,z,count=3){
  const p=new T.Group();p.position.set(x,.133,z);root.add(p);const w=count*.077+.029;
  box(p,w,.039,.075,colors.face,0,.0195,0);
  const outlets=[];for(let i=0;i<count;i++)outlets.push(power(p,(i-(count-1)/2)*.077,.041,0,'strip-'+i));
  box(p,.013,.020,.016,colors.dark,-w/2-.006,.020,0);
  return {power:outlets,supply:[x-w/2-.012,.153,z]};
 }
 function cable(name,points,path,r=.0045,color=colors.dark){
  const curve=path(points),o=mesh(root,new T.TubeGeometry(curve,64,r,5,false),color);o.name='office-wire-'+name;
  records.cables.push({name,anchors:points,radius:r,samples:curve.getPoints(300).map(v=>v.toArray())});return o;
 }
 return {root,records,floorBox,strip,rj45:(pos,normal,label)=>rj45(root,pos,normal,label),cable};
}
