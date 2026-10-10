import * as T from '../../src/vendor/three.module.min.js';
import {bevelBox,material,mesh,modelMetrics} from '../../src/models/pastel-shapes.js';
import {batchStatic} from '../../src/models/static-batch.js';
import {addNeighbourhood,surroundingObstacles} from '../../street-study/architecture.js';
import {createShutterMotion,shutterSlatPose} from '../../street-study/shutter-motion.js';
import {createStreetResident} from '../../street-study/resident.js';
import {addRoadDetails,createStreetTraffic} from '../../street-study/traffic-models.js';
import {observations} from '../../street-study/observations.js';
import {createInteractionPrompt} from '../../src/systems/interaction-prompt.js';
import {ownScene} from '../../src/spaces/legacy-room.js';

export const buildings=[
 {x:-10,w:4,h:4.65,color:0xc5b19e,roof:'gable',sign:'모퉁이 책방'},
 {x:-5.5,w:4.7,h:5.5,color:0xa7bbad,roof:'parapet',sign:'작은 찻집'},
 {x:0,w:5.9,h:4.6,color:0xe0c9a5,roof:'gable',sign:'오늘의 가게',hero:true},
 {x:5.45,w:4.7,h:5.15,color:0xc6b1ab,roof:'parapet',sign:'동네 꽃집'},
 {x:10,w:4,h:4.5,color:0xb0bdc5,roof:'gable',sign:'생활 공방'}
];
export const obstacles=[
 ...surroundingObstacles,
 ...buildings.map(b=>({x:b.x,z:-3,w:b.w,d:4,h:b.h+1})),
 ...[-10.9,9.6].map(x=>({x,z:2.4,w:1.05,d:1.05,h:3.3})),
 {x:5.8,z:2.4,w:2.0,d:.8,h:1.1},{x:-5.8,z:2.5,w:.85,d:.7,h:1.2},
 {x:3.15,z:0,w:.7,d:.8,h:.8},{x:-3.1,z:0,w:.7,d:.8,h:.8},
 ...[-8,8].map(x=>({x,z:3.25,w:.35,d:.35,h:3.7})),
 {x:-2.05,z:.6,w:.52,d:.52,h:1.6}
];
export function canWalkStreet(x,z,r=.26){return x>=-25+r&&x<=25-r&&z>=-.82+r&&z<=13.2-r&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);}

export const streetSpace={
 spawn:{x:-1.4,z:2.0},
 interactions:[{id:'shopkeeper',kind:'npc',x:-2.05,z:.9,y:1.8,radius:1.6,label:'가게 앞 안내인'},
  {id:'shutter',kind:'object',x:0,z:-.1,y:1.55,radius:1.7,label:'셔터 올리기'}],
 cameraPresets:{free:{yaw:0,pitch:Math.PI/12,distance:3.8},close:{yaw:.15,pitch:.48,distance:10},wide:{yaw:.12,pitch:.7,distance:29},fixed:{yaw:.18,pitch:.6,distance:20}},
 create({renderer,camera,player,scope,controls}){
  const scene=new T.Scene();scene.background=new T.Color(0xe5e9e0);scene.fog=new T.Fog(0xe5e9e0,65,155);
  const previousFar=camera.far,previousFov=camera.fov;camera.far=250;camera.fov=60;camera.updateProjectionMatrix();scope.own(()=>{camera.far=previousFar;camera.fov=previousFov;camera.updateProjectionMatrix();});
  const world=new T.Group();scene.add(world);
  const palette={cream:0xe5dbc2,trim:0xf1e6cf,dark:0x536c64,glass:0x809f9d,wood:0xa68e6e,paving:0xcacabb,road:0x9ca6a5,leaf:0x89a47c,leaf2:0xb0be8b,metal:0x728580,brick:0xb4a58f};
  const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,material(c));return mats.get(c);}
  function box(w,h,d,c,x,y,z,parent=world,r=.018){return mesh(parent,bevelBox(w,h,d,r),mat(c),x,y,z);}
  function cyl(rt,rb,h,c,x,y,z,parent=world,n=10){return mesh(parent,new T.CylinderGeometry(rt,rb,h,n),mat(c),x,y,z);}
  function bar(a,b,r,c){const end=new T.Vector3(...b),start=new T.Vector3(...a),delta=end.clone().sub(start);const m=cyl(r,r,delta.length(),c,0,0,0);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
  const base=box(340,.5,340,0xc6cebb,0,-.33,1.5);base.castShadow=false;
  box(300,.12,4.5,palette.road,0,-.07,6.05).castShadow=false;
  // Cross streets cut through the pavement instead of disappearing under a continuous slab.
  for(const [left,right]of [[-150,-33],[-27,27],[33,150]]){
   const width=right-left,x=(left+right)/2;
   box(width,.16,4.8,palette.paving,x,.025,1.45).castShadow=false;
   box(width,.14,.24,palette.trim,x,.045,3.75).castShadow=false;
   box(width,.16,4.5,palette.paving,x,.025,10.45).castShadow=false;
   box(width,.14,.24,palette.trim,x,.045,8.3).castShadow=false;
  }
  // Paving seams and curb joints share batches; no individual tile draw calls.
  for(let x=-24.5;x<25;x+=1){box(.018,.006,4.3,0xb9bdaf,x,.11,1.5).castShadow=false;box(.018,.014,.25,0xacb29f,x,.122,3.75).castShadow=false;}
  for(let z=-.5;z<3.7;z+=.72)box(50,.006,.016,0xb9bdaf,0,.11,z).castShadow=false;
  const roadSignals=addRoadDetails(world);
  // Sign atlas: one modest texture shared by all five shopfronts.
  const cv=document.createElement('canvas');cv.width=2048;cv.height=64;const g=cv.getContext('2d');
  g.fillStyle='#eee5cf';g.fillRect(0,0,2048,64);g.textAlign='center';g.textBaseline='middle';
  buildings.forEach((b,i)=>{g.fillStyle=i===2?'#476c5a':'#65786a';g.fillRect(i*409.6+3,2,403,60);g.fillStyle='#f7efd9';g.font='bold 30px system-ui';g.fillText(b.sign,i*409.6+204.8,24);g.font='12px system-ui';g.fillText(i===2?'작은 하루를 여는 곳':'우리 동네',i*409.6+204.8,51);});
  const atlas=new T.CanvasTexture(cv);atlas.colorSpace=T.SRGBColorSpace;const signMat=material(0xffffff,{map:atlas});
  function sign(i,w,y,x){box(w+.18,.59,.14,palette.wood,x,y,-.64);const geo=new T.PlaneGeometry(w,.48),uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,(i+uv.getX(j))*.2,uv.getY(j));const m=mesh(world,geo,signMat,x,y,-.556);m.castShadow=false;}
  function facadeWindow(x,y,w=1.1,h=1.25){box(w+.18,h+.18,.13,palette.trim,x,y,-.935);box(w,h,.05,palette.glass,x,y,-.845);box(w,.038,.07,palette.trim,x,y,-.798);box(.046,h,.07,palette.trim,x,y,-.797);box(w+.32,.09,.32,palette.cream,x,y-h/2-.12,-.82);
   box(w*.65,.05,.013,0xbfd1c4,x-w*.08,y+h*.26,-.812).castShadow=false;
  }
  for(const [i,b]of buildings.entries()){
   if(!b.hero)box(b.w,b.h,4,b.color,b.x,b.h/2+.11,-3);
   else{
    // Hollow ground floor; the rolling shutter reveals a real interior.
    box(b.w,1.65,4,b.color,b.x,3.885,-3);
    box(b.w,.16,4,0xb8a88c,0,.15,-3);box(b.w,.16,4,palette.cream,0,2.97,-3);
    for(const x of [-2.83,2.83])box(.24,2.8,4,b.color,x,1.54,-3);
    box(b.w,2.8,.22,b.color,0,1.54,-4.9);
    for(const x of [-2.38,2.38])box(1.0,2.8,.23,b.color,x,1.54,-1);
    // Side display window: opaque glass with an inset interior behind it.
    box(.65,1.3,.045,palette.glass,2.32,1.6,-.855);
    for(const x of [1.96,2.68])box(.065,1.45,.10,palette.trim,x,1.6,-.80);
    for(const y of [.88,2.32])box(.78,.065,.10,palette.trim,2.32,y,-.80);
    for(const x of [-2,2]){for(const y of [.45,1.1,1.75])box(1,.1,.65,palette.wood,x,y,-4.22);for(const dx of [-.48,.48])box(.065,1.9,.6,palette.dark,x+dx,1.05,-4.22);}
    box(1.6,.8,.65,palette.wood,.75,.62,-2.8);box(1.72,.1,.75,palette.cream,.75,1.07,-2.8);
    for(const [x,z,y]of [[-1.6,-3.2,.505],[-2,-4.2,.775],[1.8,-4.2,1.425]]){box(.55,.55,.48,0xb4a080,x,y,z);box(.08,.018,.49,palette.cream,x,y+.28,z);}
    box(1.2,.06,.3,palette.cream,0,2.86,-2.8);
   }
   box(b.w+.12,b.hero?.12:.26,4.12,palette.brick,b.x,b.hero?.07:.24,-3);
   box(b.w+.2,.17,4.2,palette.trim,b.x,b.h+.11,-3);
   if(b.roof==='gable'){
    const slope=.38,half=2.2,roofY=b.h+.18;
    for(const side of [-1,1]){const roof=box(b.w+.35,.16,half/Math.cos(slope),palette.wood,b.x,roofY+Math.sin(slope)*half*.5,-3+side*half*.5);roof.rotation.x=side*slope;}
    box(b.w+.4,.15,.2,palette.dark,b.x,roofY+Math.sin(slope)*half,-3);
    const shape=new T.Shape();shape.moveTo(-2,0);shape.lineTo(2,0);shape.lineTo(0,Math.sin(slope)*half);shape.closePath();
    const geometry=new T.ShapeGeometry(shape),gableMat=material(b.color,{side:T.DoubleSide});
    for(const side of [-1,1]){const end=mesh(world,geometry,gableMat,b.x+side*b.w/2,roofY,-3);end.rotation.y=Math.PI/2;}

   }else{box(b.w,.38,.22,b.color,b.x,b.h+.37,-1.06);box(b.w,.38,.22,b.color,b.x,b.h+.37,-4.94);for(const s of [-1,1])box(.22,.38,4,b.color,b.x+s*(b.w/2-.1),b.h+.37,-3);box(b.w+.15,.08,.3,palette.cream,b.x,b.h+.59,-1.06);}
   for(const s of [-1,1]){box(.15,b.h,.15,palette.trim,b.x+s*(b.w/2-.12),b.h/2+.11,-.91);facadeWindow(b.x+s*b.w*.24,b.h-.9,b.hero?.9:1.05,.95);}
   sign(i,b.hero?3.3:b.w-.6,2.95,b.x);
   if(!b.hero){
    box(b.w-.54,2.3,.06,palette.dark,b.x,1.35,-.92);box(b.w-.78,2.1,.035,palette.glass,b.x,1.35,-.872);
    box(.06,2.18,.08,palette.cream,b.x+.43,1.35,-.82);box(b.w-.65,.065,.08,palette.cream,b.x,.33,-.82);
    box(.055,.26,.065,palette.wood,b.x+.28,1.2,-.762);
    if(i===1||i===3)for(let stripe=0;stripe<8;stripe++){const awning=box((b.w-.2)/8,.065,.9,stripe%2?palette.trim:(i===1?0x7f9c87:0xba9289),b.x-b.w/2+.1+(stripe+.5)*(b.w-.2)/8,2.63,-.42);awning.rotation.x=.15;box((b.w-.2)/8,.18,.06,stripe%2?palette.trim:(i===1?0x7f9c87:0xba9289),awning.position.x,2.48,.03);}
   }
  }
  // Central facade has a deep frame, inset closed backing and a real rolling slat assembly.
  box(3.32,.12,.38,palette.wood,0,.14,-.82);
  for(const x of [-1.78,1.78])box(.26,2.57,.4,palette.wood,x,1.395,-.86);
  for(const x of [-1.61,1.61])box(.13,2.61,.21,palette.trim,x,1.4,-.66);
  box(3.52,.39,.51,palette.cream,0,2.67,-.7);box(3.55,.06,.54,palette.wood,0,2.89,-.7);
  const shutter=createShutterMotion();scene.userData.shutter=shutter;
  const slatGeo=bevelBox(3.04,.137,.08,.012),slatMat=material(0x91a294,{metalness:.16,roughness:.65});
  const slats=new T.InstancedMesh(slatGeo,slatMat,18);slats.castShadow=true;slats.receiveShadow=true;slats.frustumCulled=false;world.add(slats);
  const rail=new T.Group();world.add(rail);box(3.07,.13,.12,palette.dark,0,0,0,rail);box(.56,.038,.055,palette.cream,0,.016,.081,rail);
  const transform=new T.Object3D();
  function renderShutter(){
   for(let i=0;i<18;i++){const p=shutterSlatPose(.32+i*.14+shutter.aperture);transform.position.set(0,p.y,p.z);transform.rotation.set(-p.a,0,0);transform.scale.setScalar(p.visible?1:0);transform.updateMatrix();slats.setMatrixAt(i,transform.matrix);}
   slats.instanceMatrix.needsUpdate=true;rail.position.set(0,shutter.bottomY,-.65);rail.rotation.set(0,0,0);rail.visible=true;
  }
  function updateShutter(dt){shutter.update(dt);renderShutter();}
  const setProgress=shutter.setProgress;shutter.setProgress=value=>{setProgress(value);renderShutter();};renderShutter();
  const npc=createStreetResident();npc.object.position.set(-2.05,.11,.6);npc.object.rotation.y=.15;world.add(npc.object);
  function planter(x,z){cyl(.36,.29,.45,0xb7977e,x,.335,z);cyl(.39,.39,.08,palette.cream,x,.59,z);cyl(.32,.32,.03,0x736451,x,.632,z);for(let j=0;j<4;j++){const leaf=mesh(world,new T.IcosahedronGeometry(.24,0),mat(j%2?palette.leaf:palette.leaf2),x+Math.sin(j*2.4)*.15,.85+j*.04,z+Math.cos(j*2.4)*.15);leaf.scale.set(.8,1.5,.65);}}
  planter(-3.1,0);planter(3.15,0);
  for(const x of [-10.9,9.6]){box(1.08,.22,1.08,palette.brick,x,.18,2.4);cyl(.11,.17,2.25,palette.wood,x,1.24,2.4);for(const [dx,dy,dz,s]of [[0,2.7,0,.9],[-.4,2.4,.15,.64],[.4,2.5,-.1,.7]]){const leaf=mesh(world,new T.IcosahedronGeometry(s,1),mat(dx<0?palette.leaf2:palette.leaf),x+dx,dy,2.4+dz);leaf.scale.set(1,.95,.86);} }
  for(const x of [-8,8]){cyl(.11,.17,.23,palette.dark,x,.225,3.25);cyl(.045,.07,3.4,palette.dark,x,1.87,3.25);bar([x,3.51,3.25],[x+.46,3.51,3.25],.045,palette.dark);cyl(.27,.12,.18,palette.dark,x+.46,3.42,3.25);cyl(.13,.13,.14,palette.cream,x+.46,3.3,3.25);}
  for(const x of [5.1,6.5]){box(.10,.52,.7,palette.dark,x,.36,2.4);bar([x,.3,2.65],[x,1.02,2.78],.045,palette.dark);}
  for(let i=0;i<4;i++)box(2,.065,.13,palette.wood,5.8,.65,2.13+i*.16);for(let i=0;i<3;i++)box(2,.11,.07,palette.wood,5.8,.78+i*.15,2.76);
  for(const x of [-6.12,-5.48]){const leg=box(.045,1,.05,palette.wood,x,.59,2.5);leg.rotation.x=-.12;}box(.7,.64,.075,palette.dark,-5.8,.88,2.45);for(let i=0;i<3;i++)box(.42-i*.05,.025,.008,palette.cream,-5.8,1.03-i*.11,2.408);
  const surroundings=addNeighbourhood(world,scene);
  const activeObstacles=[...obstacles,...surroundings.additionalObstacles,{x:2.3,z:.35,w:.66,d:.62,h:.8},{x:6.8,z:10.6,w:.5,d:.5,h:1.7}];
  const neighbour=createStreetResident('neighbour');neighbour.object.position.set(6.8,.11,10.6);neighbour.object.rotation.y=Math.PI;world.add(neighbour.object);
  box(.62,.6,.57,0xb4a080,2.3,.41,.35);box(.065,.016,.59,palette.cream,2.3,.72,.35);
  // Recessed rear windows and roof returns complete the retained north facades.
  for(const b of buildings)for(const side of [-1,1]){
   box(.10,1.2,1.0,palette.trim,b.x+side*(b.w/2+.03),b.h-1.1,-3);
   box(.12,1.04,.84,palette.glass,b.x+side*(b.w/2+.07),b.h-1.1,-3);
   box(.13,.08,1.16,palette.wood,b.x+side*(b.w/2+.07),b.h-1.77,-3);
  }
  for(const b of buildings){box(1.2,1.3,.13,palette.trim,b.x,b.h-1.1,-5.04);box(1.04,1.12,.06,palette.glass,b.x,b.h-1.1,-5.12);}
  // The walking limits lie before distant intersections; planting/rail returns mark the edge.
  const edgePlanters=[];
  for(const x of [-25,25])for(const z of [.9,11.3]){box(.5,.25,2.2,palette.brick,x,.22,z);box(.48,.45,2.1,palette.leaf,x,.56,z);edgePlanters.push({x,z,w:.5,d:2.2,h:.8});}
  const prompt=createInteractionPrompt({own:fn=>scope.own(fn),mount:(parent,node)=>{parent.appendChild(node);scope.own(()=>node.remove());return node;}},scene);
  const observed=[];
  const metricsBefore=modelMetrics(world);
  const originals=new Set();world.traverse(n=>{if(n.material&&!Array.isArray(n.material))originals.add(n.material);});
  const batch=batchStatic(world,new Set([slats,rail,npc.object,neighbour.object]),{cellSize:8}),metricsAfter=modelMetrics(world);
  const retained=new Set();world.traverse(n=>{for(const m of Array.isArray(n.material)?n.material:[n.material])if(m)retained.add(m);});for(const m of originals)if(!retained.has(m))m.dispose();
  // Dynamic actors are installed after static batching; their local collisions never affect other spaces.
  const traffic=createStreetTraffic(world,player,[...activeObstacles,...edgePlanters]);
  scene.add(new T.HemisphereLight(0xf4f1e5,0x8d9c88,1.5));
  const sun=new T.DirectionalLight(0xffedcf,2.0);sun.position.set(-15,27,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-30,right:30,top:25,bottom:-25,near:.5,far:90});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;scene.add(sun);
  const fill=new T.DirectionalLight(0xd9edf0,.35);fill.position.set(10,8,-5);scene.add(fill);
  world.add(player.avatar,player.avatarShadow);updateShutter(0);
  const focusPos=new T.Vector3(2.8,2.45,5.9),focusTarget=new T.Vector3(0,1.55,-.6),direction=new T.Vector3(),hit=new T.Vector3(),ray=new T.Ray();
  const cameraBoxes=activeObstacles.filter(o=>o.h>2.5).map(o=>new T.Box3(new T.Vector3(o.x-o.w/2-.25,0,o.z-o.d/2-.25),new T.Vector3(o.x+o.w/2+.25,o.h+.2,o.z+o.d/2+.25)));
  let focusBlend=0;
  const view={renderer,camera,scene,world,...player,canWalk(x,z,r=.26){return canWalkStreet(x,z,r)&&!traffic.blocksPlayer(x,z,r)&&!surroundings.additionalObstacles.concat([{x:2.3,z:.35,w:.66,d:.62},{x:6.8,z:10.6,w:.5,d:.5}]).some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);},
   optionalTargets:()=>observations,
   interactOptional(id){const t=observations.find(o=>o.id===id);if(!t)return;observed.push(id);controls.notify(t.text);},
   showInteraction(target){prompt.show(target?{...target,name:target.name??(target.id==='shutter'?'가게 셔터':target.label),action:target.action??(target.id==='shutter'?'열기':'대화하기')}:null);},
   cameraTarget(avatar,rig){return rig.target??{x:avatar.position.x,y:rig.height??1.4,z:avatar.position.z};},
   resolveCamera(cam,target,dt){focusBlend=T.MathUtils.damp(focusBlend,shutter.focus?1:0,6,dt);cam.position.lerp(focusPos,focusBlend);target.lerp(focusTarget,focusBlend);
    direction.copy(cam.position).sub(target);let distance=direction.length();ray.set(target,direction.normalize());
    for(const bounds of cameraBoxes)if(!bounds.containsPoint(target)&&ray.intersectBox(bounds,hit))distance=Math.min(distance,Math.max(.15,hit.distanceTo(target)-.06));
    cam.position.copy(target).addScaledVector(direction,distance);
   },
   updateAmbient({dt,elapsed,playing}){updateShutter(dt);npc.update({dt,speed:0,moving:false,elapsed,carrying:false});neighbour.update({dt,speed:0,moving:false,elapsed,carrying:false});traffic.update(playing?dt:0);roadSignals.update(traffic.snapshot().time);},
   updatePlayerHeight(dt){const z=player.avatar.position.z,floor=.11-.12*T.MathUtils.smoothstep(z,3.55,3.95)+.12*T.MathUtils.smoothstep(z,8.05,8.45);player.avatar.position.y=T.MathUtils.lerp(player.avatar.position.y,floor,dt*10);player.avatarShadow.position.set(player.avatar.position.x,floor+.006,z);}
  };
  scene.userData.streetMetrics={before:metricsBefore,after:metricsAfter,batch,buildings:buildings.length+surroundings.buildingCount,shadowMap:1024,atlasBytes:Math.ceil((2048*64+1024*512+16*256)*4*4/3)};
  const frames=[];let previousFrame=0;
  const ambient=view.updateAmbient;view.updateAmbient=state=>{ambient(state);const now=performance.now();if(state.dt>0&&previousFrame&&frames.length<240)frames.push(now-previousFrame);previousFrame=now;};
  // Read-only, test-only measurements; never used to drive the game clock or movement.
  const diagnostic=()=>({traffic:traffic.snapshot(),shutter:{progress:shutter.progress,target:shutter.target,focus:shutter.focus,bottomY:rail.position.y,aperture:shutter.aperture,openingFraction:shutter.openingFraction,direction:shutter.direction,contacts:shutter.contacts,closing:shutter.closing,closed:shutter.progress===0},observed:[...observed],...scene.userData.streetMetrics,render:{...renderer.info.render},memory:{...renderer.info.memory},camera:camera.position.toArray(),cameraInside:cameraBoxes.some(b=>b.containsPoint(camera.position)),frameMs:[...frames]});
  window.streetStatus=diagnostic;scope.own(()=>{if(window.streetStatus===diagnostic)delete window.streetStatus;});
  scope.own(()=>{slats.dispose();});
  return ownScene(view,[player.avatar,player.avatarShadow]);
 }
};

