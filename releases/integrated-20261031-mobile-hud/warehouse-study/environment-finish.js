import {T,P} from './geometry.js';

// Warehouse-owned materials: do not alter the shared office models or characters.
export function finishWarehouse(world,excluded){
 const maps=new Map(),materials=new Map(),report={surfaces:0,textures:0};
 function texture(kind){
  if(maps.has(kind))return maps.get(kind);
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,256,256);let seed=391;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<4200;i++){g.fillStyle=`rgba(90,88,79,${.015+rnd()*(kind==='asphalt'?.18:.07)})`;g.fillRect(rnd()*256,rnd()*256,1,1);}
  if(kind==='wood')for(let y=0;y<256;y+=4){g.strokeStyle=`rgba(116,95,67,${.035+rnd()*.07})`;g.beginPath();g.moveTo(0,y);g.quadraticCurveTo(128,y+3,256,y);g.stroke();}
  if(kind==='wall')for(let y=0;y<256;y+=64){g.fillStyle='#929f9320';g.fillRect(0,y,256,1);g.fillStyle='#ffffff80';g.fillRect(0,y+1,256,1);}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;maps.set(kind,t);report.textures++;return t;
 }
 function visit(n){
  if(excluded.has(n)||n.isSkinnedMesh)return;
  if(n.isMesh&&!n.isInstancedMesh&&!Array.isArray(n.material)&&n.material.isMeshStandardMaterial&&!n.material.map&&!n.material.transparent&&!n.material.emissive.getHex()){
   const c=n.material.color.getHex(),g=n.geometry;g.computeBoundingBox();const s=g.boundingBox.getSize(new T.Vector3());
   let kind=c===P.floor?'concrete':c===P.road?'asphalt':c===P.wood&&s.y<.22?'wood':(c===P.wall||c===P.wallLight)&&s.y>2&&Math.max(s.x,s.z)>2?'wall':null;
   if(kind){const key=n.material.uuid+kind;let m=materials.get(key);if(!m){m=n.material.clone();m.map=texture(kind);m.roughness=kind==='concrete'?.76:kind==='wood'?.77:.92;materials.set(key,m);}n.material=m;
    const geo=g.clone(),p=geo.attributes.position,a=geo.attributes.normal,u=geo.attributes.uv,unit=kind==='wood'?1.2:kind==='wall'?4:2;
    for(let i=0;i<p.count;i++){const top=Math.abs(a.getY(i))>.7,side=Math.abs(a.getX(i))>.7;u.setXY(i,(top?p.getX(i):side?p.getZ(i):p.getX(i))/unit,(top?p.getZ(i):p.getY(i))/unit);}n.geometry=geo;report.surfaces++;
   }else if(c===P.steel){const key='steel'+n.material.uuid;if(!materials.has(key)){const m=n.material.clone();m.metalness=.32;m.roughness=.48;materials.set(key,m);}n.material=materials.get(key);}
  }
  for(const child of n.children)visit(child);
 }
 visit(world);world.userData.warehouseFinish=report;return report;
}
