import {T,P} from './geometry.js';
// Six low-detail buildings with coherent envelopes, loading aprons and street connections.
export function buildCampus(k,world){
 for(const z of [-40,29]){k.box(220,.03,10,0x81938a,0,-1.035,z,world,.001);for(let x=-100;x<=100;x+=5)k.box(2,.015,.12,P.line,x,-1.009,z,world,.001);}
 for(const x of [-32,32])k.box(8,.025,96,P.road,x,-1.035,-7,world,.001);
 const buildings=[[-53,-5,25,48,9,P.wall,Math.PI/2],[53,-5,25,48,10,0xbecbbd,-Math.PI/2],[-18,-65,42,22,10,0xc3cdbf,0],[34,-66,25,24,8,0xb4c3bc,0],[-37,54,38,24,9,0xc9cbb9,Math.PI],[18,55,40,26,10,0xb6c6c1,Math.PI]];
 for(const [x,z,w,d,h,c,angle] of buildings){const g=k.group(x,-1.04,z);g.rotation.y=angle;
  // Side buildings face the campus loop; local frontage width follows their long side.
  const width=Math.abs(angle)===Math.PI/2?d:w,depth=Math.abs(angle)===Math.PI/2?w:d;
  k.box(width,h,depth,c,0,h/2,0,g,.015);k.box(width+.12,1.25,depth+.12,P.frame,0,.63,0,g,.012);
  const rise=2.2,slope=Math.atan2(rise,width/2),roofLength=Math.hypot(width/2+.5,rise);
  for(const side of [-1,1]){const r=k.box(roofLength,.2,depth+1.1,P.steel,side*(width/4+.2),h+rise/2,0,g,.01);r.rotation.z=-side*slope;k.box(.18,.25,depth+1.2,P.wallLight,side*(width/2+.45),h-.03,0,g);}
  const shape=new T.Shape().moveTo(-width/2,0).lineTo(0,rise).lineTo(width/2,0).closePath();
  for(const face of [-1,1]){const m=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false}),k.mat(c));m.position.set(0,h,face*depth/2);g.add(m);}
  for(const px of [-width/2,width/2]){k.box(.18,h,.24,P.wallLight,px,h/2,depth/2+.08,g);k.cyl(.075,h,P.steel,px-.25,h/2,depth/2+.24,g);}
  for(let px=-width/2+4;px<width/2-2;px+=8){k.box(3.8,4,.1,P.dark,px,2.2,depth/2+.08,g);k.box(3.45,3.7,.13,0xa7b4a7,px,2.2,depth/2+.17,g);for(let y=.5;y<4;y+=.35)k.box(3.4,.025,.05,P.steel,px,y,depth/2+.25,g);k.box(4.5,.15,1.2,P.frame,px,4.45,depth/2+.4,g);k.box(4.1,.16,1.7,P.wallLight,px,.08,depth/2+.8,g);k.box(3.2,1.35,.08,P.glass,px,h-1.8,depth/2+.07,g);k.box(.065,1.38,.16,P.wallLight,px,h-1.8,depth/2+.13,g);for(const y of [h-2.52,h-1.08])k.box(3.3,.07,.16,P.wallLight,px,y,depth/2+.13,g);}
  const doorX=width/2-1.3;k.box(1,2.3,.12,P.frame,doorX,1.2,depth/2+.1,g);k.box(.75,.8,.03,P.glass,doorX,1.82,depth/2+.18,g);k.box(.12,.07,.04,P.line,doorX-.3,1.2,depth/2+.21,g);
  // Loading apron reaches the through-road; no fence across dock access.
  k.box(width+2,.02,9,P.road,0,.015,depth/2+4.5,g,.001);for(let px=-width/2+2;px<width/2;px+=5)k.box(.08,.012,7,P.line,px,.032,depth/2+3.8,g,.001);
 }
 // Gate openings align with incoming/outgoing trucks and the southern pedestrian entrance.
 for(const z of [-35,23])for(let x=-27;x<27;x+=3){if(z<0&&x>-10&&x<21||z>0&&x>-22&&x<-12)continue;k.cyl(.06,1.8,P.frame,x,-.12,z);for(const y of [-.7,.5])k.beam([x,y,z],[x+3,y,z],.055,.055,P.frame);}
 // Three continuous, irregular terrain ribbons. Ridge silhouette varies smoothly around 360 degrees.
 for(let layer=0;layer<3;layer++){
  const N=128,positions=[],indices=[],radius=100+layer*19;
  const heights=a=>8+layer*3+4*Math.sin(a*3+.7)+2.8*Math.sin(a*7+layer*.8)+1.1*Math.cos(a*13);
  for(let row=0;row<3;row++)for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,r=radius+row*13+Math.sin(a*5)*3,y=row===0?-1.4:row===1?heights(a):heights(a)*.38-1;positions.push(Math.sin(a)*r,y,Math.cos(a)*r);}
  for(let row=0;row<2;row++)for(let i=0;i<N;i++){const a=row*(N+1)+i,b=a+N+1;indices.push(a,b,a+1,a+1,b,b+1);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const ridge=new T.Mesh(geometry,k.mat([0xa5bca8,0xb3c5b7,0xc2cec4][layer],{side:T.DoubleSide,flatShading:false}));ridge.castShadow=false;ridge.receiveShadow=true;ridge.name='ContinuousRidge-'+layer;world.add(ridge);
 }
}
