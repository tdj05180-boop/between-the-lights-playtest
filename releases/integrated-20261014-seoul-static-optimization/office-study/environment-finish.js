import {T} from '../experiments/spaces/kit.js';
import {bevelBox} from '../src/models/pastel-shapes.js';

// Scene-local finish: shared warehouse furniture, wiring and the exit recess are untouched.
export function finishOffice(k,door){
 const {world,box}=k,maps=new Map(),materials=new Map(),report={surfaces:0,chairSupports:0,chairContours:0,deskEdges:0,fixtureMounts:0};
 const excluded=new Set([...k.dynamic,world.getObjectByName('2019-exit-vestibule')]);
 function texture(kind){
  if(maps.has(kind))return maps.get(kind);
  const c=document.createElement('canvas');c.width=c.height=256;const a=c.getContext('2d');a.fillStyle='#fff';a.fillRect(0,0,256,256);let seed=519;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<3200;i++){a.fillStyle=`rgba(90,90,82,${.015+rnd()*.065})`;a.fillRect(rnd()*256,rnd()*256,1,1);}
  if(kind==='wood')for(let y=0;y<256;y+=5){a.strokeStyle='#65533b12';a.beginPath();a.moveTo(0,y);a.quadraticCurveTo(140,y+3,256,y);a.stroke();}
  if(kind==='ceiling'){a.strokeStyle='#888e8240';a.lineWidth=1;a.strokeRect(0,0,256,128);a.strokeRect(0,128,256,128);for(let i=0;i<140;i++){a.fillStyle='#69756830';a.fillRect(rnd()*256,rnd()*256,1,2);}}
  if(kind==='fabric')for(let y=0;y<256;y+=3){a.fillStyle='#888e8715';a.fillRect(0,y,256,1);}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;maps.set(kind,map);return map;
 }
 const meshes=[];function visit(n){if(excluded.has(n)||n.isSkinnedMesh)return;if(n.isMesh&&!Array.isArray(n.material)&&n.material.isMeshStandardMaterial&&!n.material.map&&!n.material.transparent&&!n.material.emissive.getHex())meshes.push(n);for(const child of n.children)visit(child);}visit(world);
 for(const n of meshes){
  const g=n.geometry;g.computeBoundingBox();const s=g.boundingBox.getSize(new T.Vector3()).multiply(n.scale),c=n.material.color.getHex(),chair=n.parent.name.startsWith('2019-chair-');
  const kind=c===0x515852?'floor':c===0x59675f&&s.x>10?'ceiling':c===0x71817a&&s.y>1?'wall':c===0x8d7b61?'wood':chair&&s.x>.35&&s.y>.05?'fabric':null;
  if(!kind)continue;
  const key=n.material.uuid+kind;let mat=materials.get(key);if(!mat){mat=n.material.clone();mat.map=texture(kind);mat.roughness=kind==='wood'?.66:kind==='floor'?.68:.92;materials.set(key,mat);}n.material=mat;
  const geo=g.clone(),p=geo.attributes.position,norm=geo.attributes.normal,uv=geo.attributes.uv,unit=kind==='ceiling'?1.2:kind==='wood'?.9:kind==='fabric'?.30:1.2;
  for(let i=0;i<p.count;i++){const top=Math.abs(norm.getY(i))>.7,side=Math.abs(norm.getX(i))>.7;uv.setXY(i,(top?p.getX(i)*n.scale.x:side?p.getZ(i)*n.scale.z:p.getX(i)*n.scale.x)/unit,(top?p.getZ(i)*n.scale.z:p.getY(i)*n.scale.y)/unit);}n.geometry=geo;report.surfaces++;
 }
 // Small edge radii catch the existing dim light on cabinet contents without
 // expanding the already checked wall clearance.
 const cabinetEdges=new Map();report.cabinetEdges=0;
 for(const cabinet of world.children.filter(n=>n.name.startsWith('2019-cabinet-'))){
  for(const n of cabinet.children){
   if(!n.isMesh||n.geometry.type!=='BoxGeometry')continue;
   n.geometry.computeBoundingBox();const sz=n.geometry.boundingBox.getSize(new T.Vector3()).multiply(n.scale);
   if(Math.min(sz.x,sz.y,sz.z)<.018)continue;
   const key=[sz.x,sz.y,sz.z].join('/');let geo=cabinetEdges.get(key);
   if(!geo){geo=bevelBox(sz.x,sz.y,sz.z,Math.min(.008,Math.min(sz.x,sz.y,sz.z)*.16));cabinetEdges.set(key,geo);}
   n.geometry=geo;n.scale.setScalar(1);report.cabinetEdges++;
  }
 }
 // Tapered shoulders and a curved lumbar profile stay inside the original
 // chair envelope. This is scene-local: shared warehouse furniture is untouched.
 function backContour(w,h,d){
  const b=Math.min(.009,d*.18),s=new T.Shape();
  s.moveTo(-w*.36,-h/2+b);s.quadraticCurveTo(-w/2+b,-h/2+b,-w/2+b,-h*.24);
  s.lineTo(-w*.45,h*.30);s.quadraticCurveTo(-w*.44,h/2-b,-w*.26,h/2-b);
  s.lineTo(w*.26,h/2-b);s.quadraticCurveTo(w*.44,h/2-b,w*.45,h*.30);
  s.lineTo(w/2-b,-h*.24);s.quadraticCurveTo(w/2-b,-h/2+b,w*.36,-h/2+b);s.closePath();
  const geo=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:2,curveSegments:5,steps:1});geo.translate(0,0,-d/2+b);geo.clearGroups();
  const p=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,p.getZ(i)-.010*Math.max(0,1-(x/(w*.5))**2)*Math.sin((y/h+.5)*Math.PI));uv.setXY(i,x/.3,y/.3);}
  geo.computeVertexNormals();return geo;
 }
 const shell=backContour(.46,.48,.065),cushion=backContour(.40,.39,.042);
 for(const chair of world.children.filter(n=>n.name.startsWith('2019-chair-'))){
  // Backrest now has a visible steel support rooted in the under-seat bracket.
  box(.07,.22,.035,0x586761,0,.65,.215,chair);
  for(const x of [-.17,.17])box(.018,.30,.025,0x303b3a,x,.86,.261,chair);
  const seat=chair.children.find(n=>n.isMesh&&Math.abs(n.position.y-.58)<.0001);
  if(seat)seat.geometry=bevelBox(.46,.095,.43,.04);
  for(const n of chair.children){
   if(n.isMesh&&Math.abs(n.position.y-.907)<.0001){n.geometry.dispose();n.geometry=shell;report.chairContours++;}
   if(n.isMesh&&Math.abs(n.position.y-.912)<.0001){n.geometry.dispose();n.geometry=cushion;}
  }
  report.chairSupports++;
 }
 for(const desk of world.children.filter(n=>n.name.startsWith('2019-desk-'))){
  const top=desk.children.find(n=>n.isMesh&&Math.abs(n.position.y-.98)<.0001);
  if(top){top.geometry.dispose();top.geometry=bevelBox(2.4,.12,1.1,.05);report.deskEdges++;}
 }
 for(const [x,z] of [[-3,-1],[3,-5],[0,5.8]]){
  // Flush mounting brackets bridge the existing 12 cm fixture-to-ceiling gap.
  for(const dx of [-.46,.46])box(.10,.145,.19,0x455851,x+dx,4.245,z);
  for(const dx of [-.61,.61])box(.025,.05,.29,0x68776b,x+dx,4.104,z);
  for(let dx=-.45;dx<=.45;dx+=.18)box(.013,.027,.29,0xb0b3a0,x+dx,4.079,z);
  report.fixtureMounts++;
 }
 // The former two point lights floated at mid-room height and lit the ceiling
 // more strongly than the work surfaces. Anchor the pools below real fixtures.
 const fixturePositions=[[-3,-1],[3,-5],[0,5.8]],oldLights=k.scene.children.filter(n=>n.isPointLight&&Math.abs(n.position.y-2.65)<.001&&Math.abs(n.position.z+.8)<.001);
 oldLights.forEach(light=>light.removeFromParent());
 fixturePositions.forEach(([x,z],i)=>{const light=new T.SpotLight(0xffdfb3,i===2?28:35,10,1.18,.85,2);light.position.set(x,3.98,z);light.target.position.set(x,.15,z);light.castShadow=false;k.scene.add(light,light.target);});
 // A restrained cool window fill separates joinery from the dark wall while
 // retaining the dim investigation atmosphere; no extra shadow maps.
 for(const side of [-1,1]){const fill=new T.SpotLight(0xb8d0d5,7,7,.95,.85,2);fill.position.set(side*5.83,2.95,2.2);fill.target.position.set(side*2.1,.8,1.4);k.scene.add(fill,fill.target);}
 report.lightSources={ceilingFixtures:3,softWindowFill:2,additionalShadowMaps:0};
 // Blind header/side fittings attach to the retained wall; every slat stays put.
 for(const x of [-5.86,5.86])for(const z of [-2.4,2.2]){
  const side=x<0?1:-1;
  box(.12,.085,2.02,0x68796d,x+side*.025,3.525,z);
  for(const dz of [-.98,.98])box(.095,1.14,.035,0x455851,x+side*.015,2.95,z+dz);
  box(.09,.045,1.95,0x68796d,x+side*.032,2.398,z);
 }
 // A supported lever replaces the old block, on the same leaf and latch location.
 const oldHandle=door.children.find(n=>n.material?.color?.getHex()===0xd5c797);
 if(oldHandle){oldHandle.geometry.dispose();oldHandle.removeFromParent();}
 box(.055,.18,.025,0xa9a58d,1.82,1.15,.072,door);
 box(.034,.034,.070,0xa9a58d,1.82,1.15,.108,door);
 box(.18,.033,.033,0xb9b299,1.746,1.15,.142,door);
 for(const y of [.42,2.34])box(.048,.16,.052,0x596b60,.017,y,.045,door);
 report.textures=maps.size;world.userData.officeFinish=report;return report;
}
