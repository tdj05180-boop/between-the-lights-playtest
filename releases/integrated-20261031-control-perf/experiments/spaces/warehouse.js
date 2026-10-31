import {kit,C,T} from './kit.js';
export const warehouse={spawn:{x:0,z:4},create(ctx){
 const k=kit(ctx,{w:15,d:13});k.label('분류 · 색상에 맞는 트럭',0,3,-6.2,4.5);
 const pickup={x:0,z:1.3},trucks=[{x:-3.8,z:-1.2,color:'blue'},{x:3.8,z:-1.2,color:'red'}];
 k.box(2,.28,3,C.metal,0,.85,0);k.box(1.75,.07,3,0x586a66,0,1.025,0);k.block(0,-.2,2,2.3);
 const rollers=new T.InstancedMesh(new T.BoxGeometry(1.75,.025,.025),k.mat(C.cream),12),matrix=new T.Matrix4();k.world.add(rollers);k.dynamic.add(rollers);
 for(const x of [-6.35,6.35]){for(const z of [-5,-2]){k.box(.08,2.8,.08,C.dark,x-.36,1.5,z);k.box(.08,2.8,.08,C.dark,x+.36,1.5,z);}for(const y of [.45,1.45,2.45]){k.box(.85,.08,3.3,C.wood,x,y,-3.5);for(const z of [-4.5,-3.5,-2.5]){const b=k.carton(C.cream);b.position.set(x,y+.26,z);}}k.block(x,-3.5,.9,3.4);}
 for(const t of trucks){const c=t.color==='blue'?C.blue:C.red;k.box(2.7,2.2,3,c,t.x,1.55,-3.6);k.box(2.3,1.7,.08,0x555f5b,t.x,1.55,-2.05);k.box(2.7,.22,.7,C.metal,t.x,.47,-1.7);k.block(t.x,-3.3,2.7,3.2);k.label(t.color==='blue'?'1 · 파란 상자':'2 · 빨간 상자',t.x,2.9,-1.97,2.5);for(const dx of [-1.3,1.3]){const wheel=k.cyl(.43,.18,C.dark,t.x+dx,.56,-3.5);wheel.rotation.z=Math.PI/2;}}
 for(const t of trucks){const c=t.color==='blue'?C.blue:C.red;k.box(2.15,1.6,1.2,c,t.x,1.2,-5.65);k.box(1.85,.62,.06,C.glass,t.x,1.52,-6.27);k.box(.06,.65,.75,C.glass,t.x+1.1,1.5,-5.8);k.box(.06,.65,.75,C.glass,t.x-1.1,1.5,-5.8);k.box(.045,1.68,.07,C.metal,t.x,1.55,-1.98);for(const dx of [-.95,.95]){k.box(.12,.26,.1,C.metal,t.x+dx,1.4,-1.95);k.box(.22,.13,.08,C.red,t.x+dx,.7,-1.94);}k.block(t.x,-5.65,2.2,1.2);}
 const crateRoot=new T.Group();k.world.add(crateRoot);k.dynamic.add(crateRoot);const boxes=Array.from({length:10},(_,i)=>{const model=k.carton(i%2?C.red:C.blue,crateRoot);model.visible=false;return {id:i,color:i%2?'red':'blue',model};});
 k.plant(-6,4);k.plant(6,4);const features={pickup,trucks,boxes,crateRoot};k.scene.userData.experiment={kind:'warehouse'};return k.finalize({features,updateAmbient({activeMs}){for(let j=0;j<12;j++){matrix.makeTranslation(0,1.08,((j*.25+activeMs*.0005)%3)-1.5);rollers.setMatrixAt(j,matrix);}rollers.instanceMatrix.needsUpdate=true;}});
}};
