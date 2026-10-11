import {workflow} from './workflow-layout.js';
import {T,P} from './geometry.js';
// Environment-only shell. Facility anchors and playable collision footprint stay in space.js.
export function buildArchitecture(k,world,block){
 const bounds=[],windows=[],glass=new T.MeshStandardMaterial({color:0xc7e3dc,transparent:true,opacity:.16,roughness:.32,metalness:0,depthWrite:false,side:T.DoubleSide});
 const wall=(w,h,d,x,y,z)=>{const m=k.box(w,h,d,P.wall,x,y,z,world,.025);bounds.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));return m;};
 const wallHeight=8.4,windowBottom=3.6,windowTop=6.2;
 // Segmented masonry creates actual openings: there is no backing wall behind the glazing.
 for(const x of [-22,22]){
  wall(.34,windowBottom,34,x,windowBottom/2,0);wall(.34,wallHeight-windowTop,34,x,(wallHeight+windowTop)/2,0);
  let previous=-17;for(const z of [-12,-4,4,12]){const left=z-2.6,right=z+2.6;if(left>previous)wall(.34,2.6,left-previous,x,4.9,(left+previous)/2);previous=right;
   windows.push({axis:'x',x,z,bottom:windowBottom,top:windowTop,width:5.2});
   for(const edge of [left,right])k.box(.46,2.76,.12,P.frame,x,4.9,edge);for(const y of [3.6,6.2])k.box(.48,.14,5.4,P.frame,x,y,z);
   k.box(.58,.12,5.6,P.wallLight,x,3.49,z);for(const dz of [-.87,.87])k.box(.4,2.5,.06,P.frame,x,4.9,z+dz);k.box(.4,.065,5.1,P.frame,x,4.93,z);
   const pane=k.box(.015,2.45,5.02,glass,x,4.9,z,world,.001);pane.castShadow=false;pane.receiveShadow=false;
  }if(previous<17)wall(.34,2.6,17-previous,x,4.9,(17+previous)/2);
  k.box(.45,.3,34.3,P.frame,x,.3,0);k.box(.5,.3,34.4,P.frame,x,8.35,0);
 }
 // North loading apertures are retained at x=6 and 15.
 for(const [x,w] of [[-14,16],[1,6],[10.5,5],[19.5,5]])wall(w,8.4,.34,x,4.2,-17);
 for(const {x,color} of workflow.docks){wall(4,3.6,.34,x,6.6,-17);k.sign(color==='inbound'?0:color==='blue'?4:5,3,.7,x,5.65,-16.78);for(const dx of [-1.9,1.9]){k.box(.25,4.65,.48,P.dark,x+dx,2.42,-16.93);k.box(.13,4.2,.08,P.steel,x+dx,2.45,-16.65);for(let y=.4;y<1.4;y+=.25)k.box(.35,.12,.35,P.line,x+dx,y,-16.6);}k.box(3.95,.35,.5,P.dark,x,4.75,-16.95);for(let j=0;j<8;j++)k.box(3.6,.065,.22,P.steel,x,4.45+j*.047,-16.86);k.box(3.2,.07,1.4,P.steel,x,.13,-16.6);for(let j=0;j<7;j++){const m=k.stripe(x-1.45+j*.45,-15.85,.13,.8,P.line);m.rotation.y=-.45;}for(const dx of [-1.5,1.5]){k.cyl(.055,.9,P.line,x+dx,.61,-15.4);block(x+dx,-15.4,.11,.11,1.06);if(color!=='inbound')k.beam([x+dx,.94,-15.4],[x+dx,.94,-16.15],.025,.025,P.red);} /* Side rails leave the central cargo opening clear. */}
 // South facade: entry aperture, upper wall, and real eye-level outlook windows.
 wall(3,8.4,.34,-20.5,4.2,17);wall(4,4.9,.34,-17,5.95,17);
 wall(37,2.5,.34,3.5,1.25,17);wall(37,3.4,.34,3.5,6.7,17);
 let previous=-15;for(const x of [-10,-2,6,14]){const left=x-2.6,right=x+2.6;if(left>previous)wall(left-previous,2.5,.34,(previous+left)/2,3.75,17);previous=right;windows.push({axis:'z',x,z:17,bottom:2.5,top:5,width:5.2});
  for(const edge of [left,right])k.box(.12,2.64,.48,P.frame,edge,3.75,17);for(const y of [2.5,5])k.box(5.42,.14,.48,P.frame,x,y,17);k.box(5.55,.12,.58,P.wallLight,x,2.39,17);for(const dx of [-.87,.87])k.box(.065,2.4,.4,P.frame,x+dx,3.75,17);const pane=k.box(5.04,2.36,.015,glass,x,3.75,17,world,.001);pane.castShadow=false;pane.receiveShadow=false;
 }wall(22-previous,2.5,.34,(22+previous)/2,3.75,17);
 k.box(3.8,.23,2.4,P.frame,-17,3.45,17.7);for(const x of [-18.7,-15.3])k.box(.12,3.3,.12,P.frame,x,1.7,18.3);k.sign(10,3,.65,-17,3.1,16.76).rotation.y=Math.PI;
 // Landing and exterior steps connect the +0.11 floor with the -1.04 paved yard.
 k.box(4.1,1.15,2.8,P.wallLight,-17,-.465,18.5);for(let i=0;i<5;i++)k.box(3.7,1.15-(i+1)*.19,.45,P.wallLight,-17,(-1.04+.11-(i+1)*.19)/2,20.1+i*.45);
 for(const x of [-18.85,-15.15]){for(const z of [17.6,19.7])k.cyl(.045,1.1,P.frame,x,.66,z);k.beam([x,1.16,17.4],[x,1.16,19.9],.05,.05,P.frame);k.beam([x,1.16,19.9],[x,.21,22.3],.05,.05,P.frame);}
 for(const x of [-18.2,-15.8])k.cyl(.055,.9,P.line,x,.61,16.3);k.beam([-18.2,.91,16.3],[-15.8,.91,16.3],.027,.027,P.line);
 // Five portal frames, attached baseplates, horizontal ties and alternating truss diagonals.
 for(const z of [-15,-7,1,9,16]){for(const x of [-21.5,21.5]){k.box(.4,8.3,.4,P.frame,x,4.26,z);k.box(.68,.22,.68,P.steel,x,.22,z);k.box(.7,.13,.66,P.steel,x,8.35,z);for(const dx of [-.23,.23])for(const dz of [-.23,.23])k.cyl(.034,.06,P.dark,x+dx,.365,z+dz);block(x,z,.65,.65,8.5);}
  k.beam([-21.5,8.25,z],[21.5,8.25,z],.19,.24,P.frame);k.beam([-21.5,8.4,z],[0,11.35,z],.23,.25,P.frame);k.beam([0,11.35,z],[21.5,8.4,z],.23,.25,P.frame);
  for(let x=-21;x<20;x+=3.5){const x2=x+3.5,peak=t=>11.35-Math.abs(t)/21.5*2.95;k.beam([x,8.3,z],[x,peak(x),z],.075,.08,P.steel);k.beam([x,8.3,z],[x2,peak(x2),z],.075,.08,P.steel);}
 }
 // Continuous sloped roof, overhang, ridge cap and longitudinal purlins.
 const slope=3/22,angle=Math.atan(slope),length=Math.hypot(22.75,22.75*slope);
 for(const side of [-1,1]){const roof=k.box(length,.2,35.8,0xd9dfd0,side*11.375,11.4-11.375*slope,0,world,.018);roof.rotation.z=-side*angle;for(let x=3;x<=21;x+=3)k.box(.14,.2,35.2,P.steel,side*x,11.4-x*slope-.28,0);for(let z=-17.5;z<=17.5;z+=2.5)k.beam([side*.12,11.54,z],[side*22.65,8.46,z],.035,.04,0xc2cec0);k.box(.32,.3,35.9,P.frame,side*22.7,8.23,0);}
 k.box(.35,.22,35.9,P.wallLight,0,11.52,0);
 const shape=new T.Shape().moveTo(-22,8.4).lineTo(0,11.4).lineTo(22,8.4).closePath();
 for(const z of [-17.17,16.83]){const g=new T.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:false});const m=new T.Mesh(g,k.mat(P.wall));m.position.z=z;m.castShadow=m.receiveShadow=true;world.add(m);for(const dx of [-2,2]){k.box(1.4,.85,.08,P.frame,dx,9.2,z+(z<0?-.05:.4));for(let y=8.9;y<9.6;y+=.13)k.box(1.25,.05,.12,P.steel,dx,y,z+(z<0?-.1:.45));}}
 // Luminaires hang from the ties. Emissive diffusers cost no shadow maps.
 const lampMat=new T.MeshStandardMaterial({color:0xfff4d5,emissive:0xffe6b2,emissiveIntensity:.6,roughness:.6});
 for(const z of [-11,-3,5,13])for(const x of [-12,0,12]){for(const dx of [-.7,.7])k.beam([x+dx,11.1-Math.abs(x+dx)*3/22,z],[x+dx,7.65,z],.022,.022,P.dark);k.box(2,.15,.52,P.frame,x,7.56,z);k.box(1.84,.035,.39,lampMat,x,7.463,z,world,.01);k.beam([x,8.24,z],[x,8.24,z<9?z+4:9],.035,.035,P.dark);}
 for(const x of [-22.7,22.7])for(const z of [-16.6,16.6]){k.cyl(.095,8.8,P.steel,x,3.8,z);k.box(.35,.25,.4,P.frame,x,8.3,z);}
 return {bounds,windows,eaves:8.4,ridge:11.4,roofHeight:(x)=>11.3-Math.abs(x)*slope};
}
export function installSky(scene){
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,depthTest:true,toneMapped:false,uniforms:{top:{value:new T.Color(0x94bdcd)},horizon:{value:new T.Color(0xe7ecdf)}},vertexShader:`varying vec3 direction;void main(){direction=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p;gl_Position.z=p.w*.99999;}`,fragmentShader:`varying vec3 direction;uniform vec3 top;uniform vec3 horizon;void main(){vec3 d=normalize(direction);float h=clamp(d.y,0.,1.);vec3 c=mix(horizon,top,pow(h,.55));float band=smoothstep(.06,.18,h)*(1.-smoothstep(.5,.72,h));float n=sin(d.x*16.+sin(d.z*18.))*sin(d.z*13.+d.x*7.);float cloud=smoothstep(.34,.85,n)*band*.28;c=mix(c,vec3(.95,.97,.91),cloud);gl_FragColor=vec4(c,1.);#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
 const sky=new T.Mesh(new T.SphereGeometry(180,32,16),material);sky.name='PastelSky';sky.renderOrder=-100;sky.frustumCulled=false;scene.add(sky);return sky;
}
export function mountSigns(k){
 // Suspend zone signs from a steel rail carried by the portal frames, not empty air.
 for(const [id,w,x,y,z] of [[0,4,-15,6,5.2],[1,3.8,10.5,3.5,-10.8],[2,4,10.5,5.8,-15.3]]){k.sign(id,w,.75,x,y,z);k.box(w+.08,.82,.075,P.frame,x,y,z-.055);const supportZ=z<0?-15:z===5.2?1:9;for(const dx of [-w*.36,w*.36]){k.beam([x+dx,y+.39,z],[x+dx,8.2,z],.025,.025,P.steel);k.beam([x+dx,8.2,z],[x+dx,8.2,supportZ],.055,.06,P.steel);}}
 k.sign(3,4,.75,10.5,6.6,-16.77);k.box(4.08,.83,.07,P.frame,10.5,6.6,-16.84);
 // Workbench label has a backplate and two uprights anchored to the table.
 k.sign(14,2,.5,-7,1.85,8.35);k.box(2.05,.55,.045,P.frame,-7,1.85,8.29);for(const x of [-7.85,-6.15])k.box(.04,.72,.04,P.steel,x,1.36,8.29);
 // Direction sign is on the wall at the entrance, not at head-height in the walking lane.
 k.sign(6,2.8,.55,-13,2.1,16.77).rotation.y=Math.PI;k.box(2.87,.61,.05,P.frame,-13,2.1,16.83);
}

export function addContactLighting(world,obstacles){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(30,55,43,.22)');gradient.addColorStop(.55,'rgba(30,55,43,.14)');gradient.addColorStop(1,'rgba(30,55,43,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const tex=new T.CanvasTexture(canvas),material=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),material,obstacles.length);mesh.name='StaticContactShadows';const matrix=new T.Matrix4(),rotation=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
 obstacles.forEach((o,i)=>{matrix.compose(new T.Vector3(o.x,.113,o.z),rotation,new T.Vector3(o.w+1.1,o.d+1.1,1));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;world.add(mesh);return mesh;
}

