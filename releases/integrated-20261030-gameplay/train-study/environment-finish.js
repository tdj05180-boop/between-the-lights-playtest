import {T} from '../experiments/spaces/kit.js';

export function finishTrain(k,room){
 const maps=new Map(),materials=new Map(),report={surfaces:0,textures:0};
 function texture(kind){
  if(maps.has(kind))return maps.get(kind);
  const c=document.createElement('canvas');c.width=c.height=256;const a=c.getContext('2d');a.fillStyle='#fff';a.fillRect(0,0,256,256);let seed=72;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<3800;i++){a.fillStyle=`rgba(80,90,89,${.02+rnd()*.10})`;a.fillRect(rnd()*256,rnd()*256,1,1);}
  if(kind==='fabric'){
   for(let y=0;y<256;y+=2){a.fillStyle='#71848a0d';a.fillRect(0,y,256,1);}
   for(let x=0;x<256;x+=2){a.fillStyle='#ffffff18';a.fillRect(x,0,1,256);}
   for(let y=0;y<256;y+=24)for(let x=0;x<256;x+=24){a.fillStyle='#6079860c';a.fillRect(x+4,y+6,2,4);a.fillRect(x+16,y+18,2,4);}
  }
  if(kind==='floor')for(let x=0;x<256;x+=16){a.fillStyle='#7a898715';a.fillRect(x,0,1,256);}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;maps.set(kind,map);report.textures++;return map;
 }
 room.traverse(n=>{
  if(!n.isMesh||Array.isArray(n.material)||!n.material.isMeshStandardMaterial||n.material.map||n.material.transparent||n.material.emissive.getHex())return;
  const c=n.material.color.getHex(),kind=[0x718f9e,0x819ca8,0x607f8e,0x809ba8,0xdfe0d1].includes(c)?'fabric':[0xa6ada0,0x6c7f7d].includes(c)?'floor':null;
  if(!kind)return;const key=n.material.uuid+kind;let m=materials.get(key);if(!m){m=n.material.clone();m.map=texture(kind);m.roughness=kind==='fabric'?.94:.76;materials.set(key,m);}n.material=m;
  const geo=n.geometry.clone(),p=geo.attributes.position,a=geo.attributes.normal,u=geo.attributes.uv,unit=kind==='fabric'?.55:1.2;
  for(let i=0;i<p.count;i++){const top=Math.abs(a.getY(i))>.7,side=Math.abs(a.getX(i))>.7;u.setXY(i,(top?p.getX(i):side?p.getZ(i):p.getX(i))/unit,(top?p.getZ(i):p.getY(i))/unit);}n.geometry=geo;report.surfaces++;
 });
 // Thin rails connect the luminous strips and vents to the existing roof skin.
 for(const x of [-.66,.66])k.box(.105,.036,15.8,0xc4ccbe,x,2.812,0,room);
 for(let z=-7;z<=7;z+=1.6)for(const side of [-1,1]){
  k.box(.245,.02,.45,0xc4ccbe,side*.993,2.81,z,room);
 }
 k.world.userData.trainFinish=report;return report;
}
