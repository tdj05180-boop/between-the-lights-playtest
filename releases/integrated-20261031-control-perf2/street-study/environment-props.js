import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../src/models/pastel-shapes.js';

// 2003 only. Preserve the original 28 and phase-one 16; add the phase-two 16 (60 total).
// Source: planning/2003-trees/2003-proposed-tree-coordinates.csv.
// Leave the crossing approaches (|x|=23.5..36.5) and shop entrances open.
export const streetTrees=[
 // Playable main road: shop-side 2 (original pair), opposite sidewalk 2.
 {x:-10.9,z:2.4,scale:1},{x:9.6,z:2.4,scale:1},
 {x:-6.7,z:8.95,scale:.94},{x:16.7,z:8.95,scale:.96},
 // East straight continuation: two on each sidewalk, close to the crossing.
 {x:42.2,z:2.5,scale:.93},{x:55.4,z:2.6,scale:1.02},
 {x:40.5,z:8.95,scale:1.02},{x:51.7,z:8.95,scale:.94},
 // West straight continuation: two on each sidewalk, not beyond the fog.
 {x:-44,z:2.5,scale:.94},{x:-55.5,z:2.6,scale:1},
 {x:-39.4,z:8.95,scale:.97},{x:-54,z:8.95,scale:.94},
 // East junction, north branch: two per outer/inner sidewalk.
 {x:33.95,z:-38.5,scale:.91},{x:33.8,z:-20.5,scale:.96},{x:26.2,z:-30.5,scale:.9},
 {x:26.2,z:-13.4,scale:.94},
 // East junction, south branch: two per outer/inner sidewalk.
 {x:33.8,z:43.7,scale:.95},{x:33.95,z:26,scale:.91},{x:26.2,z:36.8,scale:.92},
 {x:26.2,z:20.6,scale:.94},
 // West junction, north branch: two per outer/inner sidewalk.
 {x:-33.8,z:-21.7,scale:.96},{x:-33.8,z:-39.8,scale:.93},
 {x:-26.05,z:-11.8,scale:.94},{x:-26.05,z:-29.5,scale:.91},
 // West junction, south branch: two per outer/inner sidewalk.
 {x:-33.8,z:27.2,scale:.95},{x:-33.8,z:44.3,scale:.94},
 {x:-26.05,z:21.4,scale:.93},{x:-26.05,z:38.6,scale:.92},
 // Phase one: main-road extensions, A31/A32/A33/A34 and A39/A40/A41/A42.
 {x:-87,z:2.5,scale:.95},{x:-70,z:2.5,scale:.95},
 {x:70,z:2.5,scale:.95},{x:87,z:2.5,scale:.95},
 {x:-83,z:8.95,scale:.95},{x:-67,z:8.95,scale:.95},
 {x:73,z:8.95,scale:.95},{x:90,z:8.95,scale:.95},
 // Phase one: east branches, A45/A47/A49/A51.
 {x:26.2,z:-64,scale:.95},{x:33.8,z:-62,scale:.95},
 {x:26.2,z:62,scale:.95},{x:33.8,z:63,scale:.95},
 // Phase one: west branches, A53/A55/A57/A59.
 {x:-26.05,z:-63,scale:.95},{x:-33.8,z:-64,scale:.95},
 {x:-26.05,z:62,scale:.95},{x:-33.8,z:63,scale:.95},
 // Phase two: main-road extensions, A29/A30/A35/A36 and A37/A38/A43/A44.
 {x:-120,z:2.5,scale:.95},{x:-104,z:2.5,scale:.95},
 {x:103,z:2.5,scale:.95},{x:119,z:2.5,scale:.95},
 {x:-117,z:8.95,scale:.95},{x:-99,z:8.95,scale:.95},
 {x:106,z:8.95,scale:.95},{x:122,z:8.95,scale:.95},
 // Phase two: east branches, A46/A48/A50/A52.
 {x:26.2,z:-86,scale:.95},{x:33.8,z:-85,scale:.95},
 {x:26.2,z:85,scale:.95},{x:33.8,z:84.5,scale:.95},
 // Phase two: west branches, A54/A56/A58/A60.
 {x:-26.05,z:-85,scale:.95},{x:-33.8,z:-86,scale:.95},
 {x:-26.05,z:85.5,scale:.95},{x:-33.8,z:84,scale:.95}
];
// Retain the original bench and one quiet rest spot across the street.
export const streetBenches=[{x:5.8,z:2.4,yaw:0},{x:-13.7,z:8.95,yaw:Math.PI}];
export const streetPropObstacles=[
 ...streetTrees.map(({x,z,scale},i)=>({x,z,w:i<2?1.05:1.08*scale,d:i<2?1.05:1.08*scale,h:i<2?3.3:3.6*scale})),
 ...streetBenches.map(({x,z})=>({x,z,w:2,d:.8,h:1.1}))
];

// Cross-street corner supports are shared with the two main-road runs.
export const utilityRows=[
 {z:3.25,xs:[-143,-127,-111,-95,-79,-63,-47,-33.8,-21.8,-13.5,12.8,21.8,33.8,47,63,79,95,111,127,143]},
 {z:9.15,xs:[-143,-126,-108,-91,-75,-59,-45,-33.8,-23,-3.6,14.6,22,33.8,49,66,82,98,114,130,143]}
];

export function addStreetProps(world){
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,material(c));return mats.get(c);};
 const box=(p,w,h,d,c,x,y,z)=>mesh(p,bevelBox(w,h,d,.018),mat(c),x,y,z);
 const cyl=(p,rt,rb,h,c,x,y,z)=>mesh(p,new T.CylinderGeometry(rt,rb,h,10),mat(c),x,y,z);
 const wood=0xa68e6e,dark=0x536c64,leaf=0x89a47c,leaf2=0xb0be8b;
 const group=(name,x,z)=>{const p=new T.Group();p.name=name;p.position.set(x,0,z);world.add(p);return p;};
 const finish=(p,x,z)=>{if(Math.abs(x)>25||z<-.82||z>13.2)p.traverse(n=>{if(n.isMesh)n.castShadow=false;});};
 for(const {x,z,scale}of streetTrees){
  const p=group('StreetTree',x,z);p.scale.setScalar(scale);
  // Keep the planter underside on the original pavement when varying tree size.
  p.position.y=.07*(1-scale);
  box(p,1.08,.22,1.08,0xb4a58f,0,.18,0);cyl(p,.11,.17,2.25,wood,0,1.24,0);
  for(const [dx,y,dz,s]of [[0,2.7,0,.9],[-.4,2.4,.15,.64],[.4,2.5,-.1,.7]]){
   const n=mesh(p,new T.IcosahedronGeometry(s,1),mat(dx<0?leaf2:leaf),dx,y,dz);n.scale.set(1,.95,.86);
  }
  finish(p,x,z);
 }
 for(const {x,z,yaw}of streetBenches){
  const p=group('StreetBench',x,z);p.rotation.y=yaw;
  for(const dx of [-.7,.7]){
   box(p,.10,.52,.7,dark,dx,.36,0);
   const start=new T.Vector3(dx,.3,.25),end=new T.Vector3(dx,1.02,.38),delta=end.clone().sub(start);
   const leg=cyl(p,.045,.045,delta.length(),dark,0,0,0);leg.position.copy(start.add(end).multiplyScalar(.5));leg.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  }
  for(let i=0;i<4;i++)box(p,2,.065,.13,wood,0,.65,-.27+i*.16);
  for(let i=0;i<3;i++)box(p,2,.11,.07,wood,0,.78+i*.15,.36);
  finish(p,x,z);
 }
}
