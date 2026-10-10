import {kit,C,T} from './kit.js';
import {office2019} from '../../office-study/space.js';
export function officeSpace(agency=false){if(!agency)return office2019;return {spawn:{x:0,z:4.4},create(ctx){
 const k=kit(ctx,{w:15,d:13});for(const [x,z] of [[-4,-3],[0,-3],[4,-3],[-4,1],[4,1]])k.desk(x,z);k.plant(-6,4.8);k.plant(6,-5);k.label(agency?'2026 · 함께 움직이는 하루':'2019 · 남겨진 서류',0,3,-6.22,4.6);
 const papers=[[-5.8,2.8],[-1.8,-1],[5.8,2.8],[2,-4.8],[-5.8,-4.8]].map(([x,z],i)=>{const m=k.box(.45,.04,.58,C.cream,x,.25,z);k.dynamic.add(m);return {x,z,id:i,model:m};});
 const hazards=[0,1].map(i=>{const m=new T.Mesh(new T.CircleGeometry(.72,24),new T.MeshBasicMaterial({color:0xc36157,transparent:true,opacity:.46,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.12;k.world.add(m);k.dynamic.add(m);return m;});
 if(agency){for(const p of papers)p.model.visible=false;for(const h of hazards)h.visible=false;k.label('600명 이상의 라이더와 함께',0,2.25,-6.16,4.7);}
 const focus={active:false};const features={papers,hazards,exit:{x:6,z:5},computer:{x:0,z:-1.5},focus};
 k.box(1.1,.08,1,C.green,6,.13,5);k.label(agency?'대리점':'다음 길',6,1,5,1.2);
 const v=k.finalize({features});const resolve=v.resolveCamera;let blend=0;v.resolveCamera=(camera,target,dt)=>{resolve(camera,target);blend=T.MathUtils.damp(blend,focus.active?1:0,4,dt);camera.position.lerp(new T.Vector3(1.3,2.5,.4),blend);target.lerp(new T.Vector3(0,1.3,-3),blend);};return v;
}};}
