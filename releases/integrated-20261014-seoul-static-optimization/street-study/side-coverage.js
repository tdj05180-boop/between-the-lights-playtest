import * as T from '../src/vendor/three.module.min.js';
import {sideCoverageLayout} from './side-coverage-layout.js';
import {neighbourhoodWindow,neighbourhoodShop} from './facade-details.js';

// Background-only meshes: no gameplay colliders, lights or additional shadows.
// The caller's existing static spatial batching also batches these meshes.
export function addSideCoverage(world){
 const palette=[0xc4b5a8,0xb3c2bb,0xd2c3a8,0xb9bec8,0xc9b3aa,0xc4c6b7];
 const materials=new Map(),cube=new T.BoxGeometry(1,1,1),records=[];
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.88}));return materials.get(c);};
 const box=(p,w,h,d,c,x,y,z)=>{const n=new T.Mesh(cube,mat(c));n.scale.set(w,h,d);n.position.set(x,y,z);n.castShadow=false;n.receiveShadow=true;p.add(n);return n;};
 const trim=0xe9dfc8,glass=0x779791,metal=0x647a71,roof=0x9b897d;
 for(const [i,b] of sideCoverageLayout.entries()){
  const p=new T.Group();p.name='SideCoverage-'+b.id;p.position.set(b.x,0,b.z);world.add(p);
  const sideways=Math.abs(b.x)>35;
  p.rotation.y=sideways?(b.x<0?Math.PI/2:-Math.PI/2):0;
  const W=sideways?b.visualDepth:b.visualWidth,D=sideways?b.visualWidth:b.visualDepth;
  const w=W-.7,d=D-1.05,h=b.visualHeight,c=palette[i%palette.length],pitched=i%3===0||i%5===2;
  const roofHeight=pitched?.72:.56,wall=h-roofHeight;
  box(p,w,wall,d,c,0,wall/2,0);
  box(p,w+.12,.26,d+.12,0xaea99a,0,.13,0);
  const floors=h>=9?3:2;
  for(let f=1;f<floors;f++)box(p,w+.18,.13,d+.18,trim,0,wall*f/floors,0);
  // Four complete facades: side views never expose a bare or missing back wall.
  for(let face=0;face<4;face++){
   const facade=new T.Group();p.add(facade);facade.rotation.y=face*Math.PI/2;
   const fw=face%2?d:w,depth=face%2?w:d,cols=Math.max(2,Math.floor(fw/1.65));
   for(let floor=1;floor<floors;floor++)for(let k=0;k<cols;k++){
    const x=(k-(cols-1)/2)*fw/(cols+.35),y=wall*(floor+.48)/floors,ww=Math.min(1.28,fw/(cols+1));
    neighbourhoodWindow(facade,box,x,y,depth/2+.025,ww,1.16);
   }
   if(face!==0){for(const x of [-fw*.24,fw*.24])box(facade,.75,1.05,.04,glass,x,1.62,depth/2+.025);}
  }
  const front=d/2;
  neighbourhoodShop(p,box,{w,d,c},i);
  box(p,w*.82,.34,.14,i%2?metal:roof,0,2.72,front+.1);
  if(pitched){
   const half=(d+.35)/2,rise=.55,angle=Math.atan2(rise,half),length=Math.hypot(half,rise);
   for(const side of [-1,1]){const slab=box(p,w+.38,.12,length,roof,0,wall+.08+rise/2,side*half/2);slab.rotation.x=side*angle;}
   const shape=new T.Shape();shape.moveTo(-half,0);shape.lineTo(half,0);shape.lineTo(0,rise);shape.closePath();
   const g=new T.ShapeGeometry(shape);
   for(const side of [-1,1]){const n=new T.Mesh(g,new T.MeshStandardMaterial({color:c,roughness:.88,side:T.DoubleSide}));n.rotation.y=Math.PI/2;n.position.set(side*w/2,wall+.05,0);p.add(n);}
   box(p,w+.4,.12,.18,metal,0,h-.06,0);
  }else{
   box(p,w+.28,.13,d+.28,trim,0,wall+.065,0);
   for(const side of [-1,1]){box(p,w+.1,.42,.12,c,0,h-.21,side*(d/2+.02));box(p,.12,.42,d+.1,c,side*(w/2+.02),h-.21,0);}
   box(p,1.1,.36,.9,metal,-w*.2,wall+.31,-d*.15);
  }
  // Diagnostics remain useful before static batching; no per-frame work.
  p.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(p,true);
  records.push({id:b.id,rotationY:p.rotation.y,min:bounds.min.toArray(),max:bounds.max.toArray()});
 }
 world.userData.sideCoverage=records;
 return records;
}
