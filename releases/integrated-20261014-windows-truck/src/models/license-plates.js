import * as T from '../vendor/three.module.min.js';
import {plateRegistrations} from './license-plate-rules.js';
import {plateGlyphs} from './license-plate-glyphs.js';

const paths=new Map();
function glyph(ctx,char,x,y,w,h){
 const g=plateGlyphs[char];if(!g)throw Error('Missing plate glyph '+char);
 if(!paths.has(char))paths.set(char,new Path2D(g.path));
 const [x0,y0,x1,y1]=g.bounds;ctx.save();ctx.translate(x,y+h);ctx.scale(w/(x1-x0),-h/(y1-y0));ctx.translate(-x0,-y0);ctx.fill(paths.get(char));ctx.restore();
}
function text(ctx,value,x,y,w,h,gap=.12){
 const unit=w/(value.length+(value.length-1)*gap);
 [...value].forEach((ch,i)=>glyph(ctx,ch,x+i*unit*(1+gap),y,unit,h));
}
function paint(ctx,p,x,y){
 // Tiles include four pixels of gutter to keep mip levels from sampling neighbors.
 ctx.save();ctx.translate(x+4,y+4);const w=248,h=p.era===2003?120:56;
 ctx.fillStyle=p.era===2003?'#326f57':'#eeeee5';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle=p.era===2003?'#d6e3d7':'#535c5d';ctx.lineWidth=1.3;ctx.strokeRect(2,2,w-4,h-4);
 if(p.era===2003){
  ctx.fillStyle='#f5f5e8';text(ctx,'부산'+p.prefix,57,13,134,25,.20);
  text(ctx,p.letter+p.serial,15,53,218,51,.13);
  for(const px of [48,200]){ctx.beginPath();ctx.arc(px,16,3.1,0,Math.PI*2);ctx.fill();}
 }else{
  const film=p.style==='kor-film';
  if(film){
   const grad=ctx.createLinearGradient(3,0,27,h);grad.addColorStop(0,'#264f7a');grad.addColorStop(.45,'#5280a0');grad.addColorStop(1,'#263665');ctx.fillStyle=grad;ctx.fillRect(3,3,23,h-6);
   ctx.strokeStyle='#bbcddd';ctx.lineWidth=.55;ctx.beginPath();ctx.arc(14.5,16,8,0,Math.PI*2);ctx.stroke();
   // Muted blue/silver taegeuk, kept small like the reference's security emblem.
   ctx.fillStyle='#b9ced9';ctx.beginPath();ctx.arc(14.5,16,6,0,Math.PI);ctx.arc(11.5,16,3,Math.PI,0,true);ctx.arc(17.5,16,3,Math.PI,0);ctx.fill();
   ctx.fillStyle='#e3eced';text(ctx,'KOR',5,37,19,9,.15);
  }else{
   for(const px of [10,w-10]){ctx.fillStyle='#abb2b0';ctx.beginPath();ctx.arc(px,28,2.1,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#667270';ctx.beginPath();ctx.moveTo(px-1.1,28);ctx.lineTo(px+1.1,28);ctx.stroke();}
  }
  ctx.fillStyle='#171b1a';const start=film?33:23,end=film?239:225;
  const value=p.prefix+p.letter+p.serial,unit=(end-start)/(value.length+.44);
  [...value].forEach((ch,i)=>glyph(ctx,ch,start+i*unit+(i>p.prefix.length?unit*.44:0),10,unit*.86,36));
 }
 ctx.restore();
}
function plateMaterial(texture){
 const material=new T.MeshStandardMaterial({map:texture,color:0xffffff,roughness:.54,metalness:.08});
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec4 plateRect;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * plateRect.zw + plateRect.xy;\n#endif');
 };
 material.customProgramCacheKey=()=> 'korean-plate-atlas-v1';return material;
}
export function createPlateFleet(era,ids){
 const registrations=plateRegistrations(era,ids),columns=Math.min(4,Math.max(1,ids.length)),tileH=era===2003?128:64;
 const canvas=document.createElement('canvas');canvas.width=columns*256;canvas.height=2**Math.ceil(Math.log2(Math.max(tileH,Math.ceil(ids.length/columns)*tileH)));
 const ctx=canvas.getContext('2d');ctx.fillStyle=era===2003?'#326f57':'#eeeee5';ctx.fillRect(0,0,canvas.width,canvas.height);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const material=plateMaterial(texture),holderMaterial=new T.MeshStandardMaterial({color:0x555e5d,roughness:.7});
 const geometry=new T.PlaneGeometry(registrations[0]?.width??.52,registrations[0]?.height??.11);
 const holderGeometry=new T.BoxGeometry((registrations[0]?.width??.52)+.012,(registrations[0]?.height??.11)+.009,.020);
 const plates=registrations.map((registration,i)=>{
  const x=i%columns*256,y=Math.floor(i/columns)*tileH;paint(ctx,registration,x,y);
  const rect=[(x+4)/canvas.width,1-(y+tileH-4)/canvas.height,248/canvas.width,(tileH-8)/canvas.height];
  const faceGeometry=geometry.clone();faceGeometry.setAttribute('plateRect',new T.Float32BufferAttribute([...rect,...rect,...rect,...rect],4));
  return {registration,rect,geometry:faceGeometry,holderGeometry,material,holderMaterial};
 });
 texture.needsUpdate=true;return {plates,texture,material,holderMaterial};
}
export function attachLicensePlates(root,plate,{independentFade=false}={}){
 if(!plate)throw Error('Every passenger car requires a plate allocation');
 if(root.userData.licensePlate)throw Error('Plate already attached');
 const {registration,geometry,holderGeometry}=plate;
 const material=independentFade?plateMaterial(plate.material.map):plate.material;
 const holderMaterial=independentFade?plate.holderMaterial.clone():plate.holderMaterial;
 root.userData.licensePlate={...registration};
 for(const end of [1,-1]){
  const face=new T.Mesh(geometry,material),holder=new T.Mesh(holderGeometry,holderMaterial),side=end===1?'front':'rear';
  face.name='license-plate/'+side;holder.name='license-plate-holder/'+side;
  face.rotation.y=holder.rotation.y=end*Math.PI/2;
  face.position.set(end*2.079,.69,0);holder.position.set(end*2.068,.69,0);
  face.userData.licensePlatePart='face';holder.userData.licensePlatePart='holder';
  face.userData.licensePlate={...registration,side,rect:plate.rect};holder.userData.licensePlate={...registration,side};
  root.add(holder,face);
 }
}
// The 2026 fleet already uses instancing. Two shared batches handle ALL front and
// rear plates, with a per-instance atlas rectangle, rather than 18 new materials.
export function instanceLicensePlates(world,dynamic,models){
 const batches=[];
 for(const part of ['holder','face']){
  const nodes=[];for(const model of models)model.root.traverse(n=>{if(n.userData.licensePlatePart===part)nodes.push(n);});
  if(!nodes.length)continue;
  const geometry=nodes[0].geometry.clone();
  if(part==='face')geometry.setAttribute('plateRect',new T.InstancedBufferAttribute(new Float32Array(nodes.flatMap(n=>n.userData.licensePlate.rect)),4));
  const mesh=new T.InstancedMesh(geometry,nodes[0].material,nodes.length);mesh.name='license-plates/instanced-'+part;mesh.frustumCulled=false;
  mesh.userData.licensePlateInstances=nodes.map(n=>({...n.userData.licensePlate}));world.add(mesh);dynamic.add(mesh);batches.push({mesh,nodes});
 }
 return {batches,update(){for(const {mesh,nodes} of batches){nodes.forEach((n,i)=>mesh.setMatrixAt(i,n.matrixWorld));mesh.instanceMatrix.needsUpdate=true;}}};
}
