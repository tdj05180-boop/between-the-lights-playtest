import {nightInteriors} from './night-interiors.js';
import {backgroundTraffic} from './background-traffic.js';
import {cityLayout} from './city-layout.js';
import {depthBuildings,depthBuildingParts} from './depth-city.js';
import {T} from '../experiments/spaces/kit.js';
import {lightNightStreet} from './streetlight-lighting.js';

// Scenery only: no player collisions or input. Traffic consumes the existing active clock.
// Metres; this window overlooks a fourth-floor business district, not a wall of towers.
export function createNightCity(world,dynamic,camera){
 // Comparison layout: translate the north city as a single rigid district.
 // Local lane/signalling coordinates are unchanged; the office block stays fixed.
 const interiors=nightInteriors(world);
 const districtX=22;let offsetX=districtX;
 const ground=-11.8, batches=new Map(), matrix=new T.Matrix4(), quat=new T.Quaternion(), scale=new T.Vector3(), pos=new T.Vector3();
 const boxGeo=new T.BoxGeometry(1,1,1), planeGeo=new T.PlaneGeometry(1,1),crownGeo=new T.SphereGeometry(1,12,8);
 // Shared crown silhouette; retain every instance's approved position and scale.
 const cp=crownGeo.attributes.position;
 for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),f=.98+.02*Math.sin(Math.atan2(z,x)*3+y*4);cp.setXYZ(i,x*f,y,z*f);}
 crownGeo.computeVertexNormals();
 const shade=[];for(let face=0;face<6;face++)for(let j=0;j<4;j++){const s=[.73,.57,1,.4,.91,.63][face];shade.push(s,s,s);}
 boxGeo.setAttribute('color',new T.Float32BufferAttribute(shade,3));
 const crownColors=[];for(let i=0;i<crownGeo.attributes.position.count;i++){const k=.7+.3*(crownGeo.attributes.position.getY(i)+1)/2;crownColors.push(k,k,k);}crownGeo.setAttribute('color',new T.Float32BufferAttribute(crownColors,3));
 const solidMat=new T.MeshBasicMaterial({vertexColors:true}),glowMat=new T.MeshBasicMaterial({side:T.FrontSide});
 const color=new T.Color(),axis=new T.Vector3(0,1,0);
 // A low-poly sky volume grades into the existing fog; the city itself remains full 3D.
 // Render the sky behind the city, never as an opaque 110m wall. Fog is mixed
 // after tone mapping, so the sky must bypass ACES to match its horizon colour.
 const skyGeo=new T.SphereGeometry(110,24,12),skyPos=skyGeo.attributes.position,skyColors=[];
 const horizon=new T.Color(0x1c293b),zenith=new T.Color(0x182538);
 for(let i=0;i<skyPos.count;i++){const c=horizon.clone().lerp(zenith,Math.min(1,Math.max(0,(skyPos.getY(i)-20)/55)));skyColors.push(c.r,c.g,c.b);}
 skyGeo.setAttribute('color',new T.Float32BufferAttribute(skyColors,3));
 const sky=new T.Mesh(skyGeo,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,fog:false,toneMapped:false,depthWrite:false,depthTest:false}));sky.name='2026Night/sky';sky.renderOrder=-100;sky.position.set(0,-12,-12);world.add(sky);
 function item(glow,w,h,d,c,x,y,z,ry=0,crown=false){
  x+=offsetX;
  if(activeBuilding){const cs=Math.abs(Math.cos(ry)),sn=Math.abs(Math.sin(ry));buildingParts.push({id:activeBuilding,x,z,w:w*cs+(glow?0:d)*sn,d:w*sn+(glow?0:d)*cs});}
  // Three spatial bands retain useful frustum culling; only two shared materials.
  const band=z> -44?'near':z> -77?'middle':'far',sector=x< -25?'left':x>25?'right':'centre',key=band+sector+(crown?'foliage':glow?'lit':'solid');
  if(!batches.has(key))batches.set(key,{glow,crown,items:[]});
  batches.get(key).items.push({w,h,d,c,x,y,z,ry});
 }
 const b=(w,h,d,c,x,y,z,ry=0)=>item(false,w,h,d,c,x,y,z,ry);
 const pane=(w,h,c,x,y,z,ry=0)=>item(true,w,h,1,c,x,y,z,ry);
 const hash=(a,b=0,c=0)=>{const n=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return n-Math.floor(n);};
 const palette=[0x586575,0x667579,0x746f70,0x4a6073,0x6e787c];
 const glass=[0x233d50,0x2e4756,0x354a59];
 const warm=[0xc0aa7f,0xe0c398,0xaebdaf,0x9bafa9,0x746f65];
 let buildingCount=0;const footprints=[], buildingParts=[];let activeBuilding=null;
 function building({x,z,w,d,h,style=0,seed=0,far=false}){
  buildingCount++;footprints.push({x:x+offsetX,z,w:w+.9,d:d+.8});const base=ground,body=far?0x3e5064:palette[style%palette.length],frame=far?0x586276:style===2?0x928274:0x80908f;
  const detailed=!far&&Math.abs(x)<106;
  const rooms=detailed?interiors.building({x:x+offsetX,z,w,d,h,base,body,style,seed}):null;
  if(!detailed)b(w,h,d,body,x,base+h/2,z);
  // Ground-floor podium + real depth of roof parapets and recessed services.
  if(!detailed)b(w+.65,2.8,d+.55,far?0x354958:0x465159,x,base+1.4,z);
  b(w+.9,.27,d+.8,frame,x,base+2.9,z);
  b(w+.35,.24,d+.35,frame,x,base+h+.12,z);
  const setback=style===1||style===3, crownH=setback?2.7:1.05;
  b(w*.54,crownH,d*.57,body,x+w*.09,base+h+crownH/2+.23,z-.35);
  b(w*.60,.22,d*.63,frame,x+w*.09,base+h+crownH+.25,z-.35);
  if(!far){
   b(w-.5,.38,.14,frame,x,base+h+.36,z+d/2-.12);
   for(const s of [-1,1])b(.14,.38,d-.4,frame,x+s*(w/2-.12),base+h+.36,z);
   for(let j=0;j<2;j++){b(.9,.55,.85,0x53636d,x-w*.25+j*1.2,base+h+.52,z+d*.1);for(let k=0;k<3;k++)b(.68,.025,.055,0x89928e,x-w*.25+j*1.2,base+h+.807,z+d*.1-.23+k*.2);}
   if(style===0||style===4){
    // Recessed roof terrace and open louvers give low buildings an individual silhouette.
    const tx=x-w*.27,tz=z+d*.21;
    for(const s of [-1,1])for(const t of [-1,1])b(.11,1.1,.11,frame,tx+s*w*.17,base+h+.78,tz+t*.65);
    for(let j=0;j<6;j++)b(w*.39,.065,.13,frame,tx,base+h+1.35,tz-.65+j*.26);
    b(w*.39,.25,.55,0x59676c,tx,base+h+.36,z+d/2-.55);
    b(w*.36,.29,.43,0x354f48,tx,base+h+.62,z+d/2-.55);
   }
  }
  const floors=Math.max(2,Math.floor((h-3.5)/2.5)),step=(h-3.6)/floors;
  // All four facades exist, so an oblique look never reveals an unfinished backside.
  for(let side=0;side<4;side++){
   const ry=side*Math.PI/2,span=side%2?d:w,depth=side%2?w:d;
   const face=(u,y,offset=0)=>[x+Math.cos(ry)*u+Math.sin(ry)*(depth/2+offset),y,z-Math.sin(ry)*u+Math.cos(ry)*(depth/2+offset)];
   const fb=(ww,hh,dd,c,u,y,o=0)=>b(ww,hh,dd,c,...face(u,y,o),ry);
   const fp=(ww,hh,c,u,y,o)=>pane(ww,hh,c,...face(u,y,o),ry);
   // Ribbon glazing / curtain wall / paired recessed windows have different rhythms.
   if(!detailed&&(style===1||style===3))fb(span-.55,h-3.8,.08,glass[style%3],0,base+3+(h-3.8)/2,.045);
   const cols=Math.max(3,Math.floor(span/(style===2?2.05:1.55))),pitch=(span-.75)/cols;
   for(let row=0;row<floors;row++){
    const yy=base+3.4+row*step+step*.44;
    if(style!==1)fb(span+.15,.16,.19,frame,0,yy-step*.48,.08);
    if(!far&&style===4&&row%3===0)fp(span*.72,.07,0xbaad87,0,yy-step*.48-.11,.185);
    if(!detailed&&(style===0||style===4))fb(span-.65,step*.66,.07,glass[style%3],0,yy,.035);
    for(let col=0;col<cols;col++){
     const u=-span/2+.375+pitch*(col+.5),ww=pitch*(style===2?.64:.82),hh=step*(style===1?.79:.61);
     if(style===2&&!detailed)fb(ww+.22,hh+.21,.16,frame,u,yy,.045);
     const r=hash(seed*7+side,row,col),lit=r>(far?.55:.34)&&!((row+seed)%5===0&&col<cols*.5);
     if(detailed&&lit){
      rooms.window(side,u,yy,ww,hh,(row+seed+side)%4===0?0:style===2?2:1);
      for(const q of [-1,1]){fb(.055,hh+.10,.13,frame,u+q*(ww/2+.015),yy,.19);fb(ww+.12,.055,.13,frame,u,yy+q*(hh/2+.015),.19);}
     }else {fp(ww,hh,glass[(row+seed)%3],u,yy,.187);}
     if(lit&&!detailed){
      fp(ww*.93,hh*.90,warm[Math.floor(hash(seed+row,col,side)*warm.length)],u,yy,.191);
      // Partial blinds and unlit bays break uniform grids without textures or bloom.
      if(!far&&r>.83)fb(ww,.075,.015,frame,u,yy+hh*.17,.206);
     }
     if(!far&&(style===1||style===3)&&row===0)fb(.055,h-3.6,.16,frame,u+pitch/2,base+3+(h-3.6)/2,.22);
    }
   }
   if(!far){
    for(const s of [-1,1])fb(.28,h-3,.37,frame,s*(span/2-.19),base+(h+3)/2,.09);
    if(style===2||style===4)for(let col=1;col<cols;col+=2)fb(.17,h-3,.40,frame,-span/2+.375+pitch*col,base+(h+3)/2,.19);
    if(detailed){
     rooms.shop(side,span);
     // Slim glazing modules share a whole shop/lobby behind them, rather than
     // restarting a room for each pane. Ground-floor proportions differ by style.
     const count=Math.max(3,Math.round(span/(style===2?2.4:1.8))),usable=span-.62;
     for(let j=0;j<=count;j++)fb(.075,2.34,.14,frame,-usable/2+usable*j/count,base+1.35,.30);
     for(const yy of [base+.2,base+2.5])fb(usable,.085,.15,frame,0,yy,.30);
     const doorU=usable*.31;for(const du of [-.09,.09])fb(.025,.32,.06,frame,doorU+du,base+1.15,.39);
     fb(usable,.17,.65,frame,0,base+2.65,.35);
     // Light band only where the business is open, no identical glowing grid.
     if((seed+side)%4===0)fp(usable*.42,.055,0xb6aa88,-usable*.13,base+2.53,.63);
    }else{
    // Recessed lobby and modest retail glazing; no oversized place labels.
    for(let j=0;j<Math.floor(span/2.4);j++){
     const u=-span/2+1.3+j*2.4;fb(1.9,1.9,.10,0x1f3442,u,base+1.45,.31);
     fp(1.68,1.55,0x9b9e85,u,base+1.5,.368);
     fb(.06,1.9,.08,frame,u,base+1.45,.42);
    }
    fb(span*.55,.2,.65,frame,0,base+2.4,.55);
    fp(span*.50,.085,0xc6b48d,0,base+2.27,.89);
    // One legible entrance per frontage, with a threshold and a pair of handles.
    fb(1.35,2.16,.12,0x263b45,0,base+1.17,.43);
    fp(1.13,1.91,0x617e80,0,base+1.2,.501);
    for(const u of [-.1,.1])fb(.035,.35,.06,frame,u,base+1.1,.55);
    fb(1.6,.16,.85,frame,0,base+.16,.65);
    }
   }
   if((seed%3)===1)fp(span*.84,.10,0xadbbba,0,base+h+.10,.205);
  }
  if(rooms)rooms.finish();
  // A shifted upper wing gives selected towers a stepped skyline, not a larger box.
  if(setback){const top=h+crownH+.4;b(w*.28,1.5,d*.28,0x50626e,x+w*.10,base+top+.75,z-.25);}
 }
 // Stage 1 road union: exact supplied dimensions, no traffic logic changes.
 const roads=cityLayout.roads;
 b(540,.8,340,0x293742,0,ground-.41,-80);
 const inside=(x,z,r,pad=0)=>Math.abs(x-r.x)<r.w/2+pad&&Math.abs(z-r.z)<r.d/2+pad;
 const roadAt=(x,z,pad=0)=>roads.some(r=>inside(x,z,r,pad));
 const paving=(x1,x2,z1,z2)=>b(x2-x1,.18,z2-z1,0x505d64,(x1+x2)/2,ground+.10,(z1+z2)/2);
 // Partition continuous ground into road/lot cells: pavements never cross asphalt.
 const xs=[...new Set([-270,270,...roads.flatMap(r=>[r.x-r.w/2,r.x+r.w/2])])].sort((a,b)=>a-b);
 const zs=[...new Set([-250,90,...roads.flatMap(r=>[r.z-r.d/2,r.z+r.d/2])])].sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
  const x=(xs[i-1]+xs[i])/2,z=(zs[j-1]+zs[j])/2;
  if(!roadAt(x,z))paving(xs[i-1],xs[i],zs[j-1],zs[j]);
 }
 for(const r of roads)b(r.w,.06,r.d,0x202b36,r.x,ground+.03,r.z);
 const crossings=[];
 function crossing(x,z,w,d){crossings.push({x,z,w,d});if(w>d){for(let xx=x-w/2+.35;xx<x+w/2;xx+=.8)b(.42,.014,d,0xb9bcb0,xx,ground+.074,z);}else{for(let zz=z-d/2+.35;zz<z+d/2;zz+=.8)b(w,.014,.42,0xb9bcb0,x,ground+.074,zz);}}
 // J1 T-junction: the office forecourt remains a continuous south block.
 crossing(-7,-28,3.6,17.4);crossing(13,-28,3.6,17.4);crossing(3,-41,11.4,3.6);
 crossing(-7,-88,3.6,11.4);crossing(13,-88,3.6,11.4);crossing(3,-98,11.4,3.6);crossing(3,-78,11.4,3.6);
 for(const [x,z,d] of [[-10.3,-23.5,8.4],[16.3,-32.5,8.4],[-10.3,-85,5.4],[16.3,-91,5.4]])b(.3,.014,d,0xb9bcb0,x,ground+.075,z);
 for(const [x,z] of [[0,-44.3],[0,-101.3],[6,-74.7]])b(5.4,.014,.3,0xb9bcb0,x,ground+.075,z);
 const crossingAt=(x,z,pad=0)=>crossings.some(c=>inside(x,z,c,pad));
 const curbXs=[...new Set([...xs,...crossings.flatMap(c=>[c.x-c.w/2-.5,c.x+c.w/2+.5])])].sort((a,b)=>a-b);
 const curbZs=[...new Set([...zs,...crossings.flatMap(c=>[c.z-c.d/2-.5,c.z+c.d/2+.5])])].sort((a,b)=>a-b);
 // Split edges at every intersection; curb ramps leave pedestrian paths open.
 for(const r of roads){
  for(const side of [-1,1]){
   const z=r.z+side*r.d/2;for(let i=1;i<curbXs.length;i++){const lo=Math.max(curbXs[i-1],r.x-r.w/2),hi=Math.min(curbXs[i],r.x+r.w/2);if(hi<=lo)continue;
    const cx=(lo+hi)/2;if(!roadAt(cx,z+side*.1)&&!crossingAt(cx,z,.5))b(hi-lo,.22,.18,0x8c9695,cx,ground+.12,z);
   }
   const x=r.x+side*r.w/2;for(let j=1;j<curbZs.length;j++){const lo=Math.max(curbZs[j-1],r.z-r.d/2),hi=Math.min(curbZs[j],r.z+r.d/2);if(hi<=lo)continue;
    const cz=(lo+hi)/2;if(!roadAt(x+side*.1,cz)&&!crossingAt(x,cz,.5))b(.18,.22,hi-lo,0x8c9695,x,ground+.12,cz);
   }
  }
  const horizontal=r.w>r.d,length=horizontal?r.w:r.d;
  for(let t=-length/2+.5;t<length/2;t+=1){const x=r.x+(horizontal?t:0),z=r.z+(horizontal?0:t);
   if(roads.some(other=>other!==r&&inside(x,z,other,2.5))||crossingAt(x,z,1))continue;
   for(const q of [-.13,.13])b(horizontal?1:.055,.014,horizontal?.055:1,0xae9d6c,x+(horizontal?0:q),ground+.073,z+(horizontal?q:0));
   if(r.id==='A1'&&Math.floor(t/4)%2===0)for(const dz of [-4.75,4.75])b(1,.014,.10,0xadb5b2,x,ground+.073,z+dz);
  }
 }
 // The existing office floor is now supported by lower floors and its own street lobby.
 offsetX=0;
 b(14,11.83,12,0x556873,0,ground+11.83/2,0);
 b(14.4,.30,12.3,0x80908f,0,ground+.22,0);
 for(let level=0;level<3;level++){
  const y=ground+2.3+level*3.15;
  b(14.2,.19,.28,0x7b888d,0,y+1.14,-6.04);
  for(let col=0;col<7;col++){
   const x=-6+col*2;b(1.72,2.05,.08,0x2a4353,x,y,-6.05);
   pane(1.58,1.86,col%3===level%3?0x939e93:0x354f60,x,y,-6.098,Math.PI);
  }
 }
 // North-facing ground-floor doors. The forecourt reaches the public pavement.
 for(const x of [-.66,.66]){b(1.22,2.4,.11,0x263e4b,x,ground+1.4,-6.13);pane(1.08,2.17,0x9caa9e,x,ground+1.43,-6.193,Math.PI);b(.035,.48,.12,0xa4afa7,x*.18,ground+1.4,-6.25);}
 b(3.8,.18,1.8,0x89928b,0,ground+2.85,-6.7);b(4.1,.12,2.2,0x707f83,0,ground+.24,-6.8);
 for(const x of [-2.5,2.5])b(.12,.012,9.8,0x89948d,x,ground+.20,-12.7);
 // Lamps, tree pits and entry courts share the same sidewalk grid.
 offsetX=districtX;
 const lamps=[];
 function lamp(x,z,angle=0){b(.13,4.6,.13,0x566b79,x,ground+2.3,z);b(1.5,.1,.12,0x6f8491,x+Math.cos(angle)*.67,ground+4.6,z-Math.sin(angle)*.67,angle);b(.62,.09,.3,0x526775,x+Math.cos(angle)*1.15,ground+4.56,z-Math.sin(angle)*1.15,angle);lamps.push({x:x+offsetX,z,angle});}
 function tree(x,z,seed){
  // Kerbside planting pit, protective grate and a branching, crown-shaped street tree.
  b(1.3,.06,1.3,0x79857e,x,ground+.23,z);b(1.12,.07,1.12,0x303e3b,x,ground+.265,z);
  for(const d of [-.42,-.21,0,.21,.42])b(.025,.012,1.05,0x59655e,x+d,ground+.307,z);
  b(.19,2.55,.19,0x655f51,x,ground+1.53,z);
  for(const side of [-1,1])b(.10,.9,.12,0x655f51,x+side*.22,ground+2.63,z+side*.12);
  const size=1.25+hash(seed)*.25;
  item(false,size,1.27,size*.9,0x36584f,x,ground+3.53,z,0,true);
  item(false,.9,.85,.92,0x49665a,x-.46,ground+3.21,z+.21,0,true);
 }
 // Reuse the existing trees/lamps, relocated clear of new roads and entrances.
 const trees=[],vehicles=[];
 const clear=(x,z)=>!roadAt(x,z,1.5)&&cityLayout.buildings.every(a=>Math.abs(x-a.x)>a.w/2+2||Math.abs(z-a.z)>a.d/2+2);
 for(let x=-216;x<=216;x+=12)for(const z of [-16,-40,-79,-97]){
  if(Math.abs(x-3)<16||!clear(x,z))continue;
  tree(x,z,x+z);trees.push({x:x+offsetX,z});if(clear(x+5,z))lamp(x+5,z,z===-16||z===-79?Math.PI/2:-Math.PI/2);
 }
 for(const model of cityLayout.buildings){offsetX=model.zone==='south_local'?0:districtX;activeBuilding=model.id;building(model);activeBuilding=null;}
 offsetX=districtX;
 // Distance-authored LOD, added independently of all existing building geometry.
 for(const model of depthBuildings){
  activeBuilding=model.id;buildingCount++;footprints.push({x:model.x+offsetX,z:model.z,w:model.w+.4,d:model.d+.4});
  for(const p of depthBuildingParts(model,ground)){
   if(p.glow)pane(p.w,p.h,p.c,p.x,p.y,p.z,p.ry);
   else b(p.w,p.h,p.d,p.c,p.x,p.y,p.z,p.ry);
  }
  activeBuilding=null;
 }
 // Stage 2 consumes these exact roads; scenery and building coordinates stay fixed.
 // Only signal furniture joins the static batches; vehicle instances stay dynamic.
 const trafficWorld=new T.Group();trafficWorld.name='2026Traffic/comparison-offset';trafficWorld.position.x=districtX;world.add(trafficWorld);
 const districtMatrix=new T.Matrix4().makeTranslation(districtX,0,0);
 const localCamera={projectionMatrix:camera.projectionMatrix,matrixWorldInverse:new T.Matrix4(),updateMatrixWorld(){camera.updateMatrixWorld();this.matrixWorldInverse.copy(camera.matrixWorldInverse).multiply(districtMatrix);}};
 const traffic=backgroundTraffic(trafficWorld,ground,b,dynamic,localCamera);
 let count=0,triangles=0;
 for(const [key,{glow,crown,items}] of batches){
  const mesh=new T.InstancedMesh(glow?planeGeo:crown?crownGeo:boxGeo,glow?glowMat:solidMat,items.length);mesh.name='2026Night/'+key;
  items.forEach((a,i)=>{pos.set(a.x,a.y,a.z);quat.setFromAxisAngle(axis,a.ry);scale.set(a.w,a.h,a.d);matrix.compose(pos,quat,scale);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.setHex(a.c).multiplyScalar(glow?1:.60));});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=false;world.add(mesh);count+=items.length;triangles+=items.length*(glow?2:crown?crownGeo.index.count/3:12);
 }
 const roomStats=interiors.finish();
 world.userData.nightCity={buildings:buildingCount,instances:count,triangles:triangles+skyGeo.index.count/3,drawBatches:batches.size+1,newLights:0,textures:0,roads:roads.map(r=>({...r,x:r.x+districtX})),footprints,buildingParts,vehicles,trees,ground,officeLowerFloors:true,layoutVersion:cityLayout.version,trafficStage:"stage-2-traffic"};
 const illumination=lightNightStreet(world,lamps,world.userData.nightCity.roads,footprints,ground);
 world.userData.nightCity.streetlights=illumination;
 world.userData.nightCity.interiorRooms=roomStats;
 world.userData.nightCity.textures+=illumination.textures;world.userData.nightCity.drawBatches+=illumination.drawCalls;world.userData.nightCity.triangles+=illumination.triangles;
 // Celestial layer: independent of the city's 65–175m ground haze. Keep normal
 // depth testing so buildings/window frames occlude it, never a screen overlay.
 // The local halo veils only nearby sky pixels; no global sky/exposure change.
 const moonCanvas=document.createElement('canvas');moonCanvas.width=moonCanvas.height=128;
 const mc=moonCanvas.getContext('2d'),halo=mc.createRadialGradient(64,64,25,64,64,64);
 halo.addColorStop(0,'rgba(211,222,217,0.12)');halo.addColorStop(.25,'rgba(211,222,217,0.035)');halo.addColorStop(.6,'rgba(211,222,217,0.008)');halo.addColorStop(1,'rgba(211,222,217,0)');mc.fillStyle=halo;mc.fillRect(0,0,128,128);
 const disc=mc.createRadialGradient(61,61,3,64,64,27);
 disc.addColorStop(0,'rgba(225,230,216,1)');disc.addColorStop(.88,'rgba(211,221,207,1)');disc.addColorStop(1,'rgba(202,213,204,0.98)');
 mc.fillStyle=disc;mc.beginPath();mc.arc(64,64,27,0,Math.PI*2);mc.fill();
 const moonTexture=new T.CanvasTexture(moonCanvas);moonTexture.colorSpace=T.SRGBColorSpace;
 const moon=new T.Mesh(new T.PlaneGeometry(10,10),new T.MeshBasicMaterial({map:moonTexture,transparent:true,depthTest:true,depthWrite:false,toneMapped:false,fog:false}));
 moon.name='2026Night/comparison-full-moon';moon.position.set(34,32,-145);world.add(moon);
 world.userData.nightCity.textures++;world.userData.nightCity.drawBatches++;world.userData.nightCity.triangles+=2;
 world.userData.cityComposition={districtOffsetX:districtX,stationarySouthBlock:true,J1:{x:25,z:-28},J2:{x:25,z:-88},C1:{x:25,z:[-207,-28]},moon:{position:moon.position.toArray(),discDiameter:10*54/128,haloDiameter:10},trafficCoordinates:'local; add districtOffsetX for world positions'};
 function update(ms){traffic.update(ms);world.userData.backgroundTraffic=trafficWorld.userData.backgroundTraffic;}
 world.userData.backgroundTraffic=trafficWorld.userData.backgroundTraffic;return {update};
}








