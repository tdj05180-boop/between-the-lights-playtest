import * as T from '../../src/vendor/three.module.min.js';
import {bevelBox,material,mesh,modelMetrics} from '../../src/models/pastel-shapes.js';
import {batchStatic} from '../../src/models/static-batch.js';
import {ownScene} from '../../src/spaces/legacy-room.js';
export {T};
export const C={cream:0xe5dbc2,wood:0xb19a78,dark:0x466c61,green:0x89a693,blue:0x7e9dad,red:0xbe8a7c,glass:0x96b6b5,metal:0x89958c};
export function kit(ctx,{w=14,d=12,indoor=true}={}){
 const scene=new T.Scene();scene.background=new T.Color(0xe5e9df);scene.fog=new T.Fog(0xe5e9df,36,80);const world=new T.Group();scene.add(world);
 const materials=new Map(),dynamic=new Set(),obstacles=[];const mat=c=>{if(!materials.has(c))materials.set(c,material(c));return materials.get(c);};
 const box=(w,h,d,c,x,y,z,parent=world)=>mesh(parent,bevelBox(w,h,d,.025),mat(c),x,y,z);
 const cyl=(r,h,c,x,y,z,parent=world)=>mesh(parent,new T.CylinderGeometry(r,r,h,10),mat(c),x,y,z);
 function label(text,x,y,z,width=2,color='#496c60'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const g=canvas.getContext('2d');g.fillStyle='#eee5cf';g.fillRect(0,0,512,128);g.fillStyle=color;g.font='600 42px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,64);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const m=mesh(world,new T.PlaneGeometry(width,.5),material(0xffffff,{map:tex}),x,y,z);m.castShadow=false;return m;}
 const block=(x,z,w,d,h=1)=>obstacles.push({x,z,w,d,h});
 box(w+.5,.25,d+.5,C.cream,0,-.03,0).castShadow=false;
 for(let i=0;i<d;i++)box(w,.014,.018,0xc6c5b4,0,.104,-d/2+i).castShadow=false;
 if(indoor){box(w,.25,.25,C.wood,0,.26,-d/2);box(w,3.4,.16,0xc7d2c0,0,1.8,-d/2);box(.15,2.8,d,0xd8d5bf,-w/2,1.52,0);for(let i=-2;i<=2;i++){box(1.6,1.1,.12,C.cream,i*2.3,2.5,-d/2+.1);box(1.4,.9,.04,C.glass,i*2.3,2.5,-d/2+.19);box(.05,.9,.05,C.cream,i*2.3,2.5,-d/2+.225);}}
 const hemi=new T.HemisphereLight(0xf4f1e5,0x8d9c88,1.6),sun=new T.DirectionalLight(0xffedcf,2.25);sun.position.set(-7,16,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:16,bottom:-16,near:.5,far:50});sun.shadow.normalBias=.025;scene.add(hemi,sun);
 function desk(x,z){box(1.8,.14,.8,C.wood,x,.9,z);for(const dx of [-.75,.75])for(const dz of [-.3,.3])box(.07,.84,.07,C.dark,x+dx,.49,z+dz);box(.12,.25,.12,C.metal,x,1.08,z-.15);box(.65,.43,.065,C.dark,x,1.37,z-.15);box(.56,.34,.015,C.glass,x,1.37,z-.106);box(.5,.027,.18,C.cream,x,1,z+.2);box(.45,.10,.45,C.green,x,.51,z+.9);for(const dx of [-.18,.18])box(.055,.48,.055,C.dark,x+dx,.28,z+.9);box(.45,.5,.06,C.green,x,.78,z+1.13);block(x,z,1.8,.8);}
 function plant(x,z){cyl(.26,.42,C.wood,x,.32,z);cyl(.28,.07,C.cream,x,.55,z);for(let j=0;j<3;j++){const m=mesh(world,new T.IcosahedronGeometry(.26,0),mat(C.green),x+Math.sin(j*2)*.15,.8+j*.12,z+Math.cos(j*2)*.12);m.scale.set(.8,1.6,.7);}block(x,z,.6,.6);}
 function carton(color,parent=world){const root=new T.Group();parent.add(root);box(.5,.43,.42,color,0,0,0,root);box(.07,.014,.44,C.cream,0,.221,0,root);box(.17,.1,.014,C.cream,0,0,.217,root);return root;}
 function finalize(extra={}){
  const old=new Set();world.traverse(n=>{if(n.material&&!Array.isArray(n.material))old.add(n.material);});batchStatic(world,dynamic,{cellSize:6});const retained=new Set();world.traverse(n=>{for(const m of Array.isArray(n.material)?n.material:[n.material])if(m)retained.add(m);});for(const m of old)if(!retained.has(m))m.dispose();
  world.add(ctx.player.avatar,ctx.player.avatarShadow);const ray=new T.Ray(),dir=new T.Vector3(),hit=new T.Vector3();
  const cameraBlocks=obstacles.filter(o=>o.h>1.3).map(o=>new T.Box3(new T.Vector3(o.x-o.w/2-.2,0,o.z-o.d/2-.2),new T.Vector3(o.x+o.w/2+.2,o.h+.2,o.z+o.d/2+.2)));
  if(indoor)cameraBlocks.push(new T.Box3(new T.Vector3(-w/2-.2,0,-d/2-.2),new T.Vector3(w/2+.2,3.7,-d/2+.2)),new T.Box3(new T.Vector3(-w/2-.2,0,-d/2),new T.Vector3(-w/2+.2,3.12,d/2)));
  const v={renderer:ctx.renderer,camera:ctx.camera,scene,world,...ctx.player,features:{},speedScale:1,carrying:false,
   canWalk(x,z,r=.26){return Math.abs(x)<w/2-r&&Math.abs(z)<d/2-r&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);},
   cameraTarget(avatar,rig){return rig.target??{x:avatar.position.x*.5,y:1.2,z:avatar.position.z*.4};},
   resolveCamera(camera,target){dir.copy(camera.position).sub(target);let distance=dir.length();ray.set(target,dir.normalize());for(const b of cameraBlocks)if(!b.containsPoint(target)&&ray.intersectBox(b,hit))distance=Math.min(distance,Math.max(.8,target.distanceTo(hit)-.2));camera.position.copy(target).addScaledVector(dir,distance);},
   updateAmbient(){},updatePlayerHeight(dt){ctx.player.avatar.position.y=T.MathUtils.lerp(ctx.player.avatar.position.y,.11,dt*10);ctx.player.avatarShadow.position.set(ctx.player.avatar.position.x,.116,ctx.player.avatar.position.z);},...extra};
  scene.userData.resourceMetrics=modelMetrics(world);
  return ownScene(v,[ctx.player.avatar,ctx.player.avatarShadow]);
 }
 return {scene,world,box,cyl,label,desk,plant,carton,block,mat,dynamic,finalize};
}
