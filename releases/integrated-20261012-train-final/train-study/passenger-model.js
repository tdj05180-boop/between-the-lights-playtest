import {T} from '../experiments/spaces/kit.js';
import {TailoredMesh} from '../src/models/tailored-mesh.js';

// Passenger-owned geometry only. The protagonist and common avatar source stay unchanged.
const styles={
 reader:{hair:'bob',face:.95,head:.98,neck:.94,top:0x9b7d82,trim:0x80676e,inner:0xddd2bf,pants:0x67646b,skin:0xdab490},
 phone:{hair:'swept',face:.96,head:1,neck:.97,top:0xa89c7d,trim:0x817963,inner:0xd1d3c5,pants:0x58676d,skin:0xd2ab86},
 elder:{hair:'receding',face:1.02,head:.98,neck:1,top:0x7b909e,trim:0x617682,inner:0xd7cbbb,pants:0x72706a,skin:0xcdaa8b},
 window:{hair:'tucked',face:.93,head:.98,neck:.92,top:0x929e84,trim:0x77856d,inner:0xa8b09a,pants:0x626e6e,skin:0xdfbb97},
 rest:{hair:'parted',face:1.01,head:1,neck:1,top:0x978b78,trim:0x746b5f,inner:0xc9c6b8,pants:0x5b6469,skin:0xd1ac89}
};
const profile=[[1.395,.052,.055],[1.44,.126,.111],[1.48,.151,.133],[1.525,.167,.150],[1.56,.174,.157],[1.59,.172,.159],[1.626,.169,.158],[1.664,.168,.154],[1.705,.162,.145],[1.745,.144,.127],[1.778,.112,.097],[1.801,.064,.056],[1.828,0,0]];
function radius(y){let k=0;while(k<profile.length-2&&profile[k+1][0]<y)k++;const a=profile[k],b=profile[k+1],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);return [T.MathUtils.lerp(a[1],b[1],t),T.MathUtils.lerp(a[2],b[2],t)];}
function hairGeometry(kind,head){
 const g=new TailoredMesh(),style=styles[kind].hair,n=32,rings=13;g.begin('contoured scalp, hairline and nape',4);let previous,edge;
 for(let r=0;r<rings;r++){
  const t=r/rings,points=[];
  for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a),front=Math.max(0,s),back=Math.max(0,-s);
   let low=1.59+front*.103-back*.016,volume=.014;
   if(style==='bob'){low=1.465+front*.235-back*.018;volume=.018;}
   if(style==='tucked'){low=1.58+front*.11-back*.045;low+=.018*c;volume=.014;}
   if(style==='swept'){low=1.60+front*(.093+.018*c)-back*.012;volume=.018;}
   if(style==='parted'){low=1.605+front*(.105-.015*c)-back*.01;volume=.013;}
   if(style==='receding'){low=1.605+front*.151-back*.012;volume=.007;}
   // Hairline follows the forehead/temple instead of one horizontal cap edge.
   low+=front*.006*Math.sin(a*3+.7);
   // Follow the scalp with a real shell clearance; asymmetric hairlines give
   // variety without shifting the crown through the underlying head surface.
   const top=1.836, y=low+(top-low)*t;
   let [rx,rz]=radius(Math.max(1.395,y-.009));
   let shell=.014+volume*.35;
   if(y>1.790){const crown=Math.sqrt(Math.max(0,1-((y-1.790)/(top-1.790))**2));rx=.096*crown;rz=.084*crown;shell=0;}
   const bob=style==='bob'?(1-front)*Math.max(0,1-T.MathUtils.smoothstep(y,1.55,1.68)):0;
   points.push([(Math.max(rx,bob*.174)+shell)*c,y,(Math.max(rz,bob*.153)+shell)*s-.002]);
  }
  const ids=g.ring(points,[[head,1]]);if(previous)g.bridge(previous,ids,[0,1.67,0],[0,1.75,0]);else edge=ids;previous=ids;
 }
 g.cap(previous,[0,1.836,-.002],[[head,1]],true);
 // Fine closed edge, not a floating thick wig rim.
 const inside=g.ring(edge.map(i=>{const p=g.p[i];return[p[0]*.965,p[1]+.003,p[2]*.965]}),[[head,1]]);g.bridge(inside,edge,[0,1.6,0],[0,1.61,0]);g.end();return g.geometry();
}
export function polishPassenger(a,kind,hairColor){
 const s=styles[kind],mesh=a.object.getObjectByName('TailoredHumanContinuousSurfaces'),old=mesh.geometry,hair=hairGeometry(kind,a.skeleton.bones.findIndex(b=>b.name==='head'));
 const p=old.attributes.position,kept=Array.from({length:10},()=>[]);
 for(const group of old.groups)for(let j=group.start;j<group.start+group.count;j+=3){
  const ids=[0,1,2].map(n=>old.index.getX(j+n)),v=ids.map(i=>[p.getX(i),p.getY(i),p.getZ(i)]);
  if(group.materialIndex===4){const eyebrow=v.every(([x,y,z])=>Math.abs(x)<.11&&y<1.67&&z>.13);if(!eyebrow)continue;}
  if((kind==='window'||kind==='phone')&&group.materialIndex===1&&v.every(([x,y,z])=>Math.abs(x)<.18&&y>.95&&y<1.36&&z>.10))continue;
  if(kind==='window'&&group.materialIndex===7&&v.every(([x,y,z])=>Math.abs(x)<.06&&y>.95&&z>.1))continue;
  kept[group.materialIndex].push(...ids);
 }
 const offset=p.count,g=new T.BufferGeometry();
 for(const name of ['position','skinIndex','skinWeight']){const a=old.attributes[name],b=hair.attributes[name],array=new a.array.constructor(a.array.length+b.array.length);array.set(a.array);array.set(b.array,a.array.length);g.setAttribute(name,new T.BufferAttribute(array,a.itemSize));}
 kept[4].push(...Array.from(hair.index.array,i=>i+offset));const index=[];for(let m=0;m<10;m++){g.addGroup(index.length,kept[m].length,m);index.push(...kept[m]);}g.setIndex(index);
 // Scale all facial features together; blend through the neck to avoid a seam.
 const gp=g.attributes.position;for(let i=0;i<gp.count;i++){let x=gp.getX(i),y=gp.getY(i),z=gp.getZ(i);const headBlend=T.MathUtils.smoothstep(y,1.36,1.43),neckBlend=T.MathUtils.smoothstep(y,1.30,1.36)*(1-headBlend);x*=1+(s.face-1)*headBlend+(s.neck-1)*neckBlend;z*=1+(s.face-1)*headBlend*.45;if(headBlend)y=1.6+(y-1.6)*s.head;gp.setXYZ(i,x,y,z);}
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData={passenger:kind,hair:s.hair};mesh.geometry=g;a.geometry=g;old.dispose();hair.dispose();
 for(const [i,c]of [[0,s.top],[1,s.trim],[2,s.inner],[3,s.skin],[4,hairColor],[5,s.pants],[6,0x505b59],[7,0xb6b6a6]])mesh.material[i].color.setHex(c);
 return s;
}
