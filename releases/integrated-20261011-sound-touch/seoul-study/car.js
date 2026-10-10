import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../src/models/pastel-shapes.js';
import {batchStatic} from '../src/models/static-batch.js';
function kit(root){
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,material(c));return mats.get(c);};
 const box=(w,h,d,c,x,y,z,p=root,r=.02)=>mesh(p,bevelBox(w,h,d,r),mat(c),x,y,z);
 const bar=(a,b,r,c,p=root)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);const m=mesh(p,new T.CylinderGeometry(r,r,v.length(),8),mat(c));m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;};
 return {mat,box,bar};
}
export function modernCar(color,estate=false){
 const root=new T.Group();root.name=estate?'SeoulCrossover':'SeoulFastback';const {mat,box,bar}=kit(root),wheels=[];
 // Both authored shapes have their windshield/headlights at local +X.
 root.userData.forwardAxis=[1,0,0];
 const s=new T.Shape();s.moveTo(-2,.47);s.lineTo(-1.61,.47);s.absarc(-1.22,.47,.39,Math.PI,0,true);s.lineTo(.83,.47);s.absarc(1.22,.47,.39,Math.PI,0,true);s.lineTo(2,.47);s.quadraticCurveTo(2.06,.7,1.93,.86);s.lineTo(.93,.96);s.lineTo(.40,1.47);s.quadraticCurveTo(.32,1.54,.20,1.54);s.lineTo(estate?-1.10:-.72,1.54);s.lineTo(estate?-1.68:-1.3,1.0);s.lineTo(-1.91,.94);s.quadraticCurveTo(-2.06,.8,-2,.47);
 const body=new T.ExtrudeGeometry(s,{depth:1.51,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,steps:1,curveSegments:7});body.translate(0,0,-.755);mesh(root,body,mat(color));
 const glass=0x526d72;
 const cv=document.createElement('canvas');cv.width=cv.height=64;const gc=cv.getContext('2d'),gradient=gc.createLinearGradient(0,0,0,64);gradient.addColorStop(0,'#c4dadb');gradient.addColorStop(.44,'#688b96');gradient.addColorStop(.48,'#456573');gradient.addColorStop(1,'#304a56');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);gc.fillStyle='#e4f0e633';gc.beginPath();gc.moveTo(5,0);gc.lineTo(20,0);gc.lineTo(52,64);gc.lineTo(37,64);gc.fill();const glassMap=new T.CanvasTexture(cv);glassMap.colorSpace=T.SRGBColorSpace;
 const glassMat=material(0xffffff,{map:glassMap,side:T.DoubleSide,roughness:.18,metalness:.32});
 const trim=0x60716d,cream=0xe8e1c8;
 function panel(points,c){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geometry.setIndex([0,1,2,0,2,3]);geometry.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geometry.computeVertexNormals();const m=mesh(root,geometry,glassMat);for(let i=0;i<4;i++)bar(points[i],points[(i+1)%4],.012,0x41535a);return m;}
 for(const side of [-1,1]){
  const z=side*.808;
  panel([[.37,1.44,z],[.83,1.01,z],[-.12,1.01,z],[-.12,1.44,z]],glass);
  panel([[-.23,1.44,z],[-.23,1.01,z],[estate?-1.51:-1.22,1.01,z],[estate?-1.06:-.71,1.44,z]],glass);
  bar([-.18,.56,z],[ -.18,1.46,z],.013,trim);bar([.88,.53,z],[.88,.97,z],.013,trim);
  box(.20,.045,.035,cream,-.31,.93,z);box(.2,.045,.035,cream,.65,.93,z);
  box(.28,.11,.20,color,.62,1.02,side*.90,root,.045);
  box(3.08,.07,.035,trim,0,.55,side*.812);
  for(const x of [-1.22,1.22]){
   const wheel=new T.Group();wheel.name='rolling-wheel';root.add(wheel);wheel.position.set(x,.345,side*.80);wheels.push(wheel);
   const tire=mesh(wheel,new T.CylinderGeometry(.345,.345,.18,16),mat(0x424b4c));tire.rotation.x=Math.PI/2;
   const hub=mesh(wheel,new T.CylinderGeometry(.205,.205,.19,12),mat(0xb6bcb5));hub.rotation.x=Math.PI/2;
   for(let n=0;n<5;n++){const a=n*Math.PI*2/5;bar([Math.sin(a)*.06,Math.cos(a)*.06,side*.104],[Math.sin(a)*.175,Math.cos(a)*.175,side*.104],.016,trim,wheel);}
  }
 }
 panel([[.49,1.495,-.68],[.49,1.495,.68],[1.00,1.04,.71],[1.00,1.04,-.71]],glass);
 for(const side of [-1,1])bar([1.008,1.047,side*.10],[.97,1.083,side*.54],.009,trim);
 // Follow the actual rear body slope, outside its 45 mm bevel, including the upper edge.
 const rearRoofX=estate?-1.10:-.72,rearBaseX=estate?-1.68:-1.30;
 const rearGlassX=y=>rearRoofX+(1.54-y)/.54*(rearBaseX-rearRoofX)-.075;
 panel([[rearGlassX(1.50),1.50,.66],[rearGlassX(1.50),1.50,-.66],[rearGlassX(1.07),1.07,-.7],[rearGlassX(1.07),1.07,.7]],glass);
 for(const end of [-1,1]){box(.07,.13,1.45,trim,end*2,.51,0);box(.025,.13,.40,cream,end*2.045,.69,0);for(const z of [-.55,.55])box(.055,.16,.31,end>0?0xf0e5b8:0xae716c,end*1.995,.80,z,root,.03);}
 for(let i=0;i<4;i++)box(.05,.018,.51,trim,2.03,.64+i*.045,0);
 // Slim full-width LED signatures and lower fastback roof; retain visible glass surfaces.
 for(const side of [-1,1])box(.065,.045,.48,0xffefd0,2.04,.87,side*.48);
 box(.06,.045,1.33,0xbd675f,-2.04,.87,0);
 root.updateMatrixWorld(true);const point=new T.Vector3();
 root.traverse(n=>{if(n.isMesh&&!wheels.some(w=>{let p=n.parent;while(p){if(p===w)return true;p=p.parent;}return false;})){const a=n.geometry.attributes.position,inverse=n.matrixWorld.clone().invert();for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld);if(point.y>1)point.y=1+(point.y-1)*.78;point.applyMatrix4(inverse);a.setXYZ(i,point.x,point.y,point.z);}a.needsUpdate=true;n.geometry.computeVertexNormals();n.geometry.computeBoundingSphere();}});
 root.scale.x=1.075;
 for(const wheel of wheels)batchStatic(wheel,new Set());
 batchStatic(root,new Set(wheels));
 return {root,update(distance){for(const w of wheels)w.rotation.z=-distance/.345;}};
}
// Copies share immutable mesh buffers/materials, with independent wheel transforms.
export function copyCar(template){const root=template.root.clone(true),wheels=[];root.position.set(0,0,0);root.rotation.set(0,0,0);root.updateMatrix();root.traverse(n=>{if(n.name==='rolling-wheel')wheels.push(n);});return {root,update(distance){for(const w of wheels)w.rotation.z=-distance/.345;}};}
export function poseCar(model,car){const [fx,,fz]=model.root.userData.forwardAxis,localHeading=Math.atan2(-fz,fx);model.root.rotation.set(0,(car.dir<0?Math.PI:0)-localHeading,0);model.root.position.set(car.x,.13,car.z);model.update(car.distance);}
