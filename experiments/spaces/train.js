import {kit,C,T} from './kit.js';
export const train={spawn:{x:0,z:1},create(ctx){
 const k=kit(ctx,{w:9,d:7,indoor:false});k.box(9,3.2,.16,C.cream,0,1.7,-3.5);k.box(9,.4,.15,C.blue,0,.5,-3.35);k.label('서울로 가는 길 · 상징적 장면',0,2.8,-3.35,5);
 for(const x of [-3,0,3]){k.box(2.55,1.4,.15,C.dark,x,1.75,-3.3);k.box(2.35,1.2,.1,0xc7dbd4,x,1.75,-3.18);k.box(2.4,.15,.3,C.wood,x,1.03,-3.08);}
 const scenery=new T.Group();k.world.add(scenery);k.dynamic.add(scenery);for(let i=0;i<15;i++){const m=k.box(.15+(i%3)*.1,.2+(i%4)*.15,.025,i%2?C.green:C.blue,-4.3+i*.61,1.7,-3.105,scenery);m.userData.start=m.position.x;}
 for(const x of [-2.7,2.7]){k.box(1.6,.3,1,C.blue,x,.65,.2);k.box(1.6,1.1,.22,C.blue,x,1.25,-.35);k.box(1.75,.15,1.2,C.metal,x,.43,.2);k.block(x,.2,1.7,1.4);}
 k.box(.65,.7,.3,C.wood,1,.49,1.2);const start=ctx.clock.elapsed();return k.finalize({updateAmbient(){const t=(ctx.clock.elapsed()-start)/1000;for(const m of scenery.children)m.position.x=((m.userData.start+4.5+t*.6)%9)-4.5;},resolveCamera(camera,target){const t=(ctx.clock.elapsed()-start)/1000;camera.position.set(7+Math.sin(t*.16)*.45,4.3,7);target.set(0,1.3,-1.2);}});
}};
