import {optimizeStaticScene} from '../src/models/static-scene-optimizer.js';
import {refineAgencyArchitecture} from './architectural-finish.js';
import {kit,T,C} from '../experiments/spaces/kit.js';
import {deskPose,deskPoseMetrics} from './desk-pose.js';
import {createSeating} from './seating.js';
import {officeFurniture} from './furniture.js';
import {createNightCity} from './night-city.js';
import {loadInteriorBake} from './baked-interiors.js';
import {createCandidateAvatar} from '../src/models/candidate-avatar.js';
import {finishAgency} from './environment-finish.js';
// Symbolic branch office. Only the manager room is walkable; no changes to 2019.
export const agency={spawn:{x:-4,z:-.8},async create(ctx){
 const interiorBake=await loadInteriorBake();
 const k=kit(ctx,{w:14,d:12,indoor:false}),{box,block,world,scene}=k;
 // This chapter's existing skyline reaches Z=-143m. Fade before physical road ends,
 // with clip headroom; restore the shared camera when this scene is disposed.
 scene.background=new T.Color(0x1c293b);scene.fog=new T.Fog(0x1c293b,65,175);
 const previousFar=ctx.camera.far;ctx.camera.far=200;ctx.camera.updateProjectionMatrix();
 ctx.scope.own(()=>{ctx.camera.far=previousFar;ctx.camera.updateProjectionMatrix();});
 const wall=0xe1e4da,trim=0x748582;
 box(14,.16,12,0xe9e9df,0,4.5,0).castShadow=false;
 scene.add(new T.AmbientLight(0xf4f4e8,.28));
 for(const light of scene.children){if(light.isHemisphereLight)light.intensity=1.15;if(light.isDirectionalLight){light.intensity=1.8;light.color.setHex(0xfff1dc);}}
 for(const x of [-7,7]){box(.18,4.5,12,wall,x,2.3,0);block(x,0,.18,12,4.5);}
 // Staff-side entrance is an opening in the wall, not a door placed on a solid wall.
 // A short, enclosed building corridor is scenery only.
 box(10,4.5,.18,wall,-2,2.3,6);box(2.4,4.5,.18,wall,5.8,2.3,6);
 box(1.6,1.85,.18,wall,3.8,3.625,6);block(0,6,14,.18,4.5);
 box(4,.25,3.6,0xd6d5c8,3.8,-.03,7.8);box(4,.16,3.6,0xe9e9df,3.8,4.5,7.8);
 for(const x of [1.8,5.8])box(.18,4.5,3.6,wall,x,2.3,7.8);
 box(4,4.5,.18,wall,3.8,2.3,9.6);
 box(1.6,.045,.4,0xfff3d1,3.8,4.38,7.8);
 box(14,1.05,.18,wall,0,.6,-6);box(14,.85,.18,wall,0,4.1,-6);block(0,-6,14,.18,4.5);
 for(const x of [-6.9,-3.5,0,3.5,6.9])box(.09,2.8,.2,trim,x,2.55,-6);
 box(14,.08,.22,trim,0,1.15,-5.95);box(14,.08,.22,trim,0,3.68,-5.95);
 const glass=new T.MeshStandardMaterial({color:0xd0e2df,transparent:true,opacity:.065,roughness:.12,metalness:.08,depthWrite:false,side:T.DoubleSide});
 const partitionGlass=glass.clone();partitionGlass.color.setHex(0xbcd9d5);partitionGlass.opacity=.09;
 const highlightCanvas=document.createElement('canvas');highlightCanvas.width=64;highlightCanvas.height=64;
 const hc=highlightCanvas.getContext('2d'),gradient=hc.createLinearGradient(0,0,64,24);
 gradient.addColorStop(0,'rgba(239,255,251,0)');gradient.addColorStop(.35,'rgba(239,255,251,0.045)');gradient.addColorStop(.5,'rgba(239,255,251,0.018)');gradient.addColorStop(1,'rgba(239,255,251,0)');hc.fillStyle=gradient;hc.fillRect(0,0,64,64);
 const highlightTexture=new T.CanvasTexture(highlightCanvas);highlightTexture.colorSpace=T.SRGBColorSpace;
 const highlightMat=new T.MeshBasicMaterial({map:highlightTexture,transparent:true,depthWrite:false,side:T.DoubleSide});
 const edgeMat=new T.LineBasicMaterial({color:0xc5dfda,transparent:true,opacity:.26,depthWrite:false});
 const pane=(w,h,x,y,z,ry=0,partition=false)=>{
  const m=new T.Mesh(new T.PlaneGeometry(w,h),partition?partitionGlass:glass);m.position.set(x,y,z);m.rotation.y=ry;world.add(m);
  if(partition){
   const shine=new T.Mesh(new T.PlaneGeometry(w,h),highlightMat);shine.position.z=.002;m.add(shine);
   const points=[[-w/2+.025,-h/2+.025,.003],[-w/2+.025,h/2-.025,.003],[w/2-.025,h/2-.025,.003],[w/2-.025,-h/2+.025,.003]].map(a=>new T.Vector3(...a));
   m.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(points),edgeMat));
  }
  return m;
 };
 pane(13.8,2.45,0,2.43,-6);
 // 6 x 9m manager room; remaining 114m² is staff desks and entrance circulation.
 // The L-shaped partition meets the window wall and the existing side wall.
 block(-1,-1.5,.16,9,4.5);pane(8.8,4.25,-1,2.25,-1.5,Math.PI/2,true);
 for(const z of [-5.9,-3,.4,2,3])box(.11,4.4,.09,trim,-1,2.25,z);
 box(.14,.08,9,trim,-1,4.38,-1.5);box(.14,.11,9,trim,-1,.22,-1.5);
 // Closed glass door: 1.6m clear opening, reachable on both sides in the floor plan.
 box(.14,.09,1.6,trim,-1,2.65,1.2);box(.16,.42,.06,0xb7b7a2,-1.11,1.25,1.81);
 for(const z of [-4.4,-1.3])box(.04,.08,1.7,0xdce7df,-1.09,1.42,z);
 block(-4,3,6,.16,4.5);pane(5.8,4.25,-4,2.25,3,0,true);
 for(const x of [-6.9,-4,-1])box(.09,4.4,.11,trim,x,2.25,3);
 box(6,.08,.14,trim,-4,4.38,3);box(6,.11,.14,trim,-4,.22,3);
 for(const x of [-5.5,-2.5])box(1.7,.08,.04,0xdce7df,x,1.42,2.91);
 // Exterior office entrance faces the staff circulation area and reveals the corridor.
 for(const x of [3,4.6])box(.12,2.65,.22,trim,x,1.425,6);
 box(1.72,.12,.22,trim,3.8,2.73,6);box(1.48,.07,.2,trim,3.8,.19,6);
 pane(1.46,2.4,3.8,1.45,6,0,true);box(.09,.52,.12,0xb7b7a2,4.37,1.3,5.85);
 box(1.46,.08,.06,0xdce7df,3.8,1.45,5.96);
 const exitSign=k.label('출입구',3.8,2.96,5.86,1.2);exitSign.rotation.y=Math.PI;exitSign.scale.setScalar(.6);
 // Visual furniture replaces the old block models; collision footprints are unchanged.
 const furniture=officeFurniture(k);
 const managerChair=furniture.workstation(-4,-3.1,{manager:true});
 block(-4,-3.1,3.5,1.25,1.05);block(-4,-4.4,.6,.6);
 for(let i=0;i<2;i++){const x=-5.85+i*1.65;furniture.cabinet(x,2.56);block(x,2.56,1.35,.5,1.25);}
 furniture.finishes();
 k.plant(-1.7,2.3);k.plant(1.45,-5.1);
 const staff=[];
 for(let i=0;i<2;i++){
  const x=1.3+i*3.6,z=-2.8,chair=furniture.workstation(x,z,{variant:i});block(x,z,1.8,.8);
  const a=ctx.characters?ctx.characters.create(i?'coworker':'businesswoman',{seated:true}):createCandidateAvatar();
  a.object.position.set(x,.11,ctx.characters?-2.08:z+.81);a.object.rotation.y=Math.PI;
  if(ctx.characters){chair.position.z-=.18;}else{
   a.object.scale.set(i?1.04:.94,i?1:.95,1);
a.object.traverse(n=>{if(n.isSkinnedMesh){n.material[0].color.setHex(i?0xc0a17f:0x7e9f99);n.material[1].color.setHex(i?0x856d57:0x547f79);n.material[4].color.setHex(i?0x74685c:0x393e43);}});
  // Longer back hair on one worker, independent generated model data.
  if(!i){const p=a.geometry.attributes.position;for(const g of a.geometry.groups)if(g.materialIndex===4){const ids=new Set();for(let j=g.start;j<g.start+g.count;j++)ids.add(a.geometry.index.getX(j));for(const id of ids)if(p.getZ(id)<0&&p.getY(id)<1.76)p.setY(id,p.getY(id)-.08);p.needsUpdate=true;}a.geometry.computeVertexNormals();}
  const cap=new T.Mesh(new T.SphereGeometry(.18,14,7,0,Math.PI*2,0,Math.PI/2),k.mat(i?0x74685c:0x393e43));cap.position.set(i?.012:0,.065,-.008);cap.scale.set(i?1.01:1.04, i?.98:1.07,.93);a.skeleton.bones.find(b=>b.name==='head').add(cap);
  }
  world.add(a.object);k.dynamic.add(a.object);staff.push(a);
 }
 // Third workstation uses the existing desk model; keep the central entry route clear.
 furniture.workstation(1.3,1.1,{variant:2});block(1.3,1.1,1.8,.8);
 // Background-only city; indoor materials, lighting and interaction remain unchanged.
 const cityTraffic=createNightCity(world,k.dynamic,ctx.camera,ctx.characters,interiorBake);
 finishAgency(k);
 refineAgencyArchitecture(k);
 const focus={active:false};const v=k.finalize({features:{computer:{x:-4,z:-1.5},focus},updateAmbient({playing,activeMs}){if(!playing)return;cityTraffic.update(activeMs);const t=activeMs/1000;for(let i=0;i<staff.length;i++){const a=staff[i],keyboard={x:1.2+i*3.6,y:ctx.characters?.989:1.003,z:ctx.characters?-2.62:-2.57,facing:-1};deskPose(a,{rootY:(.70-.11)/a.object.scale.y-.777,lean:.25,keyboard,time:t+i*.7});}scene.userData.agency={staff:2,timeMs:activeMs,hands:staff.map((a,i)=>deskPoseMetrics(a,{x:1.2+i*3.6,y:ctx.characters?.989:1.003,z:ctx.characters?-2.62:-2.57,facing:-1}))};}});
 // Keep staff/lobby/corridor background-only even if a movement probe skips a thin panel.
 const baseCanWalk=v.canWalk;v.canWalk=(x,z,r=.26)=>x<-1-.08-r&&z<3-.08-r&&baseCanWalk(x,z,r);
 const baseResolve=v.resolveCamera;v.resolveCamera=(camera,target)=>{baseResolve(camera,target);if(camera.position.y>4.24){const t=(4.24-target.y)/(camera.position.y-target.y);camera.position.lerpVectors(target,camera.position,Math.max(0,t));}};
 // Read-only scene reference for local visual/collision fixtures, as in existing study spaces.
 const seating=createSeating(v,managerChair,ctx.scope);
 v.beforeMinigame=seating.enter;v.afterMinigame=seating.leave;v.updatePresentation=seating.tick;
 const resolveOfficeCamera=v.resolveCamera;v.resolveCamera=(cam,target,dt)=>{resolveOfficeCamera(cam,target,dt);seating.frame(cam,target);};
 v.sceneOptimizer=optimizeStaticScene(v,[...k.dynamic,managerChair,...staff.map(a=>a.object)]);v.sceneOptimizer.set(true);
 window.agencyView=v;return v;
}};
