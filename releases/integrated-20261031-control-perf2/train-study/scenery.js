import {T} from '../experiments/spaces/kit.js';
// Train-only daylight adaptation of agency/night-city's podium, facade transforms,
// ribbon glazing, floor bands and roof setbacks. One continuous route, no swapping.
export function createScenery(k){
 const near=new T.Group(),far=new T.Group(),urban=new T.Group(),mountains=new T.Group();
 for(const g of [near,far,urban,mountains]){k.world.add(g);k.dynamic.add(g);}
 const boxGeo=new T.BoxGeometry(1,1,1),crownGeo=new T.IcosahedronGeometry(1,1);
 const roofGeo=new T.BufferGeometry();const rv=[-.5,0,-.5,.5,0,-.5,0,1,-.5,-.5,0,.5,.5,0,.5,0,1,.5];roofGeo.setAttribute('position',new T.Float32BufferAttribute(rv,3));roofGeo.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);roofGeo.computeVertexNormals();
 const material=new T.MeshStandardMaterial({roughness:.92}),batches=new Map(),buildings=[],fields=[];
 const random=n=>{const q=Math.sin(n*127.13+78.23)*43758.5453;return q-Math.floor(q);};
 function part(group,w,h,d,color,x,y,z,kind='box',ry=0){
  const key=[group.uuid,Math.floor(z/40),kind].join('/');if(!batches.has(key))batches.set(key,{group,kind,items:[]});batches.get(key).items.push({w,h,d,color,x,y,z,ry});
 }
 const b=(g,w,h,d,c,x,y,z)=>part(g,w,h,d,c,x,y,z);
 // Continuous rail verge and service streets, with visible junction gaps between blocks.
 b(near,180,.15,680,0xb7c4b1,0,-.30,-180);
 for(const side of [-1,1]){
  b(near,3,.09,670,0x959c91,side*3,-.1,-180);for(const dx of [-.65,.65])b(near,.08,.05,670,0x737f7b,side*3+dx,-.035,-180);
  b(near,3.8,.045,650,0x919a98,side*8.2,-.15,-180);
  b(near,1.7,.10,650,0xc4c9bc,side*11.2,-.15,-180);
  for(const x of [side*6.22,side*10.18])b(near,.12,.13,650,0xd0d0bd,x,-.07,-180);
  for(let q=-135;q<450;q+=5.8)b(near,.09,.008,2,0xe6dfc4,side*8.2,-.122,-q);
  for(let q=-120;q<450;q+=52){b(near,52,.04,5,0x929d9b,side*35,-.12,-q);for(const dq of [-2.6,2.6])b(near,50,.08,.12,0xc4cbbb,side*35,-.08,-q+dq);}
  // Sparse verge, trees and utility poles share world speed with all buildings.
  for(let i=0;i<46;i++){
   const q=-125+i*12.8,z=-q,city=Math.max(1-T.MathUtils.smoothstep(q,35,95),T.MathUtils.smoothstep(q,175,285)),x=side*(5.1+random(i+side)*.35);
   if(i%3===0){b(near,.12,5.5,.12,0x8f9691,x,2.45,z);b(near,1.3,.09,.10,0x778581,x,5.1,z);for(const off of [-.5,0,.5])b(near,.018,.018,38.4,0x76817c,x+off,5.2,z-19.2);}
   else if(random(i*7+side)>.18+city*.25){b(near,.12,1.65,.12,0x8d826f,x,.58,z);part(near,.7+random(i)*.4,1.0+random(i+3)*.4,.8,city>.5?0x87a28d:0x92aa8c,x,1.8,z,'crown');part(near,.65,.85,.65,0xa2b595,x+.36,2.1,z+.1,'crown');}
   // Low permeable fencing, never a wall across the window.
   b(near,.06,.62,.06,0x9caaa0,side*4.75,.22,z);b(near,.035,.045,12.8,0xa8b4a7,side*4.75,.47,z-6.4);b(near,.035,.045,12.8,0xa8b4a7,side*4.75,.17,z-6.4);
  }
 }
 function building(x,z,w,d,h,style,lod,seed){
  const g=lod===2?far:urban,body=[0xc6c6b7,0xb2c1bf,0xccbcaa,0xa9b9bd,0xd0cec0][style],trim=lod===2?0xb8c8c5:0xdce0d2,glass=lod===2?0x9eb7b8:0x819fa5,base=-.1;
  buildings.push({x,z,w,d,h,style,lod});b(g,w,h,d,body,x,base+h/2,z);b(g,w+.2,.16,d+.2,trim,x,base+h+.08,z);
  if(lod===2){b(g,w*.53,h*.13,d*.6,body,x+w*.1,base+h*1.065,z);for(let y=2;y<h-1;y+=3.5)b(g,.04,.75,d*.78,glass,x-Math.sign(x)*(w/2+.03),y,z);return;}
  b(g,w+.25,.17,d+.25,trim,x,h>=3.6&&h<4.6?h-.12:Math.min(2.55,h-.12),z);
  if(h<5.8&&style%2===0){part(g,w+.6,1.1,d+.6,0x9c9180,x,base+h+.16,z,'roof');}
  else{b(g,w*.42,.9,d*.40,body,x+w*.12,base+h+.6,z-.2);for(const s of [-1,1]){b(g,w,.25,.09,trim,x,base+h+.22,z+s*d/2);b(g,.09,.25,d,trim,x+s*w/2,base+h+.22,z);}if(lod===0)b(g,.8,.4,.6,0x929f98,x-w*.26,base+h+.4,z+.35);}
  // Three visible facades. Back face is outside the fixed cutscene's sightline.
  for(const face of [Math.sign(x)>0?3:1,0,2]){
   const ry=face*Math.PI/2,span=face%2?d:w,depth=face%2?w:d;
   const fb=(ww,hh,dd,c,u,y,o=0)=>part(g,ww,hh,dd,c,x+Math.cos(ry)*u+Math.sin(ry)*(depth/2+o),y,z-Math.sin(ry)*u+Math.cos(ry)*(depth/2+o),'box',ry);
   // Recessed, layered glazing is enough at the fixed train viewing distance.
   // Rails sit in front of the pane; sill supports connect back to the facade.
   const window=(u,y,ww,hh,index,balcony=false)=>{
    const mode=(Math.abs(seed)+index+face)%4,frame=style===2?0xb2b7a7:0xcdd5cc;
    fb(ww+.16,hh+.16,.12,frame,u,y,.07);
    fb(ww,hh,.025,[0x91a8a9,0xadc0b9,0xa6b6b2,0x869fa2][mode],u,y,.135);
    fb(.045,hh,.065,frame,u+ww*.08,y,.17);
    if(mode===0||mode===2){
     fb(ww*.89,hh*.22,.012,0xbcc6bb,u,y+hh*.32,.152);
     for(let slat=0;slat<3;slat++)fb(ww*.89,.016,.014,0xa7b4ac,u,y+hh*(.25+slat*.07),.16);
    }else fb(ww*.18,hh*.9,.014,mode===1?0xd2cbb9:0xbac4b8,u-ww*.34,y,.152);
    fb(ww+.22,.065,balcony?.49:.26,frame,u,y-hh/2-.08,.11);
    if(balcony){
     const by=y-hh/2+.17;
     for(const dy of [-.14,.14])fb(ww+.13,.038,.045,0x8e9e98,u,by+dy,.34);
     for(let rail=-2;rail<=2;rail++)fb(.028,.28,.035,0x8e9e98,u+rail*ww*.22,by,.34);
     for(const dx of [-ww/2,ww/2])fb(.04,.28,.24,0x8e9e98,u+dx,by,.24);
    }
   };
   // Transitional low buildings stay single-storey until a full upper storey fits.
   const rows=h<4.6?0:Math.max(1,Math.floor((h-2.6)/2.2)),step=rows?(h-2.5)/rows:0;
   if(h>=3.6&&!rows)window(0,h-.62,span*.58,.38,0); // High transom, not a squeezed second floor.
   for(let row=0;row<rows;row++){
    const yy=2.55+(row+.48)*step;fb(span+.06,.12,.14,trim,0,yy-step*.45,.035);
    if(style===1||style===3||lod===1&&style===0){
     for(let col=0;col<4;col++)window((col-1.5)*(span-.5)/4,yy,(span-.5)/4-.09,step*.6,row*4+col);
     if(style===3&&row===0)fb(.20,h-2.6,.18,body,span*.12,(h+2.6)/2,.17);
    }else for(let col=0;col<3;col++)window((col-1)*span*.30,yy,span*.24,step*.62,row*3+col,style===2);
   }
   if(lod===0&&h<3.6&&style%2===0){
    for(const u of [-span*.28,span*.28])window(u,1.42,span*.17,.78,2);
    fb(.86,2.04,.12,trim,0,.94,.07);fb(.73,1.90,.025,0x897e6b,0,.94,.14);
    fb(.50,.58,.02,0xa4b9b2,0,1.43,.16);fb(.035,.15,.07,trim,.24,1.0,.19);
    fb(1.13,.10,.40,0xb6baa9,0,-.015,.15);
   }else if(lod===0){
    const door=style%2?-.26*span:.27*span,shopColor=[0x819580,0x9c8b70,0xa47e6f,0x789299,0xa39a7b][style];
    fb(span-.28,2.02,.12,0x5e736f,0,1.01,.08);
    fb(span-.43,1.85,.025,0x9bb3af,0,1.03,.149);
    // Quiet lower panels/curtains differ between storefront types.
    fb(span-.43,style===1?.24:.57,.02,style===1?0xb5c3b4:0xbabca9,0,style===1?1.78:.37,.165);
    for(const u of [door-.43,door+.43])fb(.055,1.94,.065,0x718780,u,1.01,.19);
    fb(.035,.28,.065,trim,door+.29,1.02,.20);
    for(const u of [-span*.32,0,span*.32])if(Math.abs(u-door)>.55)fb(.045,1.90,.055,0x718780,u,1.02,.185);
    fb(span-.18,.29,.14,shopColor,0,2.20,.12);
    if(style%2===0){fb(span-.10,.075,.68,shopColor,0,1.96,.36);fb(span-.10,.13,.045,shopColor,0,1.91,.68);}
   }
   else fb(span-.55,1.65,.07,glass,0,1.0,.045);
  }
 }
 // Continuous symbolic journey: departure city -> outskirts/countryside -> arrival city.
 // Route coordinates, not timed visibility toggles, separate the three regions.
 for(const side of [-1,1]){
  // Fields sit behind the house plots (which end before |x|=29), not beneath them.
  // Start with a small distant plot, then broaden nearer plots along the route:
  // departure -> housing/verge buffer -> farmland, with no timed spawn or fade.
  const plots=[
   {q:112,x:49,w:10,d:14,color:0xb2be9f},
   {q:128,x:45,w:18,d:14,color:0xaebc99},
   {q:157,x:44,w:24,d:22,color:0xa8b78c},
   {q:179,x:43,w:22,d:14,color:0xb9bd91}
  ];
  for(const plot of plots){
   const {q,w,d,color}=plot,x=side*plot.x,z=-q;
   fields.push({x,z,w,d});
   b(urban,w,.025,d,color,x,-.205,z);
   const rows=Math.floor((d/2-1)/2.5);
   for(let f=-rows;f<=rows;f++)b(urban,w-2,.018,.13,0x9aa987,x,-.185,z+f*2.5);
   b(urban,w+.4,.07,.28,0xb1ac88,x,-.17,z+d/2+.3);
   b(urban,.35,.03,d,0x9eafb0,x+side*(w/2+.4),-.18,z);
  }
  // Existing field-edge trees retain their positions.
  for(const q of [78,130]){const tx=side*62;b(urban,.15,2.2,.15,0x9a8b75,tx,.85,-q);part(urban,2.1,1.8,1.8,0x9aae8c,tx,2.8,-q,'crown');}
  for(let i=0,q=-110;q<435;i++,q+=q<45?18:q<190?32:18){
   if(Math.abs(((q+146)%52+52)%52-26)<6.2)continue;
   const departure=1-T.MathUtils.smoothstep(q,35,95),arrival=T.MathUtils.smoothstep(q,175,285),mix=Math.max(departure,arrival),seed=i+side*53;
   const style=mix<.2?(i%2)*2:(i+(side>0?2:0))%5;
   const h=2.35+random(seed)*.65+mix*(2.2+random(seed+5)*3.4),x=side*(20+random(seed+2)*5),z=-q;
   building(x,z,4.5+random(seed+3)*2.1,4.5+random(seed+4)*2.0,h,style,0,seed);
   b(urban,7,.035,8,0xc8cbbc,x,-.17,z);b(urban,Math.abs(x)-12,.035,1.3,0xc9ccbd,side*(12+Math.abs(x))/2,-.14,z);
   if(q>75&&q<180){for(const dz of [-3.9,3.9]){b(urban,6,.42,.12,0xb2b4a0,x,.04,z+dz);part(urban,1.8,.6,1.0,0x9baa89,x-side*2.4,.30,z+dz,'crown');}part(urban,1.6,2.0,1.5,0x9aae8e,side*13,1.7,z-5,'crown');b(urban,.13,1.7,.13,0x9c8c72,side*13,.55,z-5);}
  }
  for(let i=0,q=-100;q<435;i++,q+=q<70?21:q<200?32:18){
   const mix=Math.max(1-T.MathUtils.smoothstep(q,20,85),T.MathUtils.smoothstep(q,200,295)),seed=i*3+side*17;
   if(q>85&&q<195)continue;
   if(Math.abs(((q+153)%52+52)%52-26)<6.3)continue;
   building(side*(36+random(seed)*6),-q-7,6+random(seed+1)*2.5,7,3.2+mix*(9+random(seed+2)*11),(i+2)%5,1,seed);
  }
  for(let i=0,q=-110;q<445;i++,q+=22){if(q>35&&q<225)continue;if(Math.abs(((q+146)%52+52)%52-26)<7.8)continue;const mix=Math.max(1-T.MathUtils.smoothstep(q,-10,45),T.MathUtils.smoothstep(q,225,305));building(side*(58+random(i+side)*10),-q,8+random(i)*4,10,4+mix*(12+random(i+8)*17),(i+1)%5,2,i);}
  // Outskirts overpass arrives after the extended countryside, never through cabin.
  const x=side*8.2,z=-157;b(near,5.6,.16,1.35,0xb2bdb8,x,3.6,z);for(const xx of [-2.55,2.55])b(near,.22,3.75,.26,0xa1aea8,x+xx,1.7,z);for(const dz of [-.68,.68]){b(near,5.6,.65,.06,0xc0c9bc,x,3.98,z+dz);}
 }
 // Low, distant irregular terrain; no close broad green ridge at window height.
 for(const side of [-1,1])for(let i=0;i<17;i++)part(mountains,22,2.3+random(i)*2.5,29,0xbdcdc2,side*(90+i%2*10),-.8,-480+i*40,'crown');
 const matrix=new T.Matrix4(),position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3();
 for(const {group,kind,items}of batches.values()){
  const mesh=new T.InstancedMesh(kind==='box'?boxGeo:kind==='roof'?roofGeo:crownGeo,material,items.length);mesh.castShadow=false;mesh.receiveShadow=false;
  items.forEach((v,i)=>{position.set(v.x,v.y,v.z);scale.set(v.w,v.h,v.d);quaternion.setFromAxisAngle(new T.Vector3(0,1,0),v.ry);matrix.compose(position,quaternion,scale);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new T.Color(v.color));});mesh.computeBoundingSphere();group.add(mesh);
 }
 k.scene.userData.trainScenery={buildings,fields,instances:[...batches.values()].reduce((n,b)=>n+b.items.length,0),drawBatches:batches.size,routeTravel:279.5,route:'symbolic city / countryside / city; no named origin',looping:false,nearDetail:'framed facade / podium / roof',farDetail:'mass + sparse ribbons'};
 return {near,far,urban,mountains,update(t){const distance=t<3?13*t*t/6:13*(t-1.5);for(const g of [near,far,urban,mountains])g.position.z=distance;return {distance,cityBlend:T.MathUtils.smoothstep(t,8,21),nearZ:distance,farZ:distance,mountainZ:distance};}};
}
