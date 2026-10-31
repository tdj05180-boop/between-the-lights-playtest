import {T,P} from './geometry.js';
import {mergeGeometries} from '../src/vendor/BufferGeometryUtils.js';

// Industrial construction rather than shopfront decoration. Existing structural
// anchors, vehicle docks, walking clearance and collision boxes are unchanged.
export function refineWarehouseStructure(k,world,scene){
 const stats={steelColumns:0,steelRafters:0,wallPanels:0,roofMaterial:true,interiorLights:4};
 const makeMap=(draw)=>{const c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;};
 const ribs=makeMap(g=>{g.fillStyle='#808080';g.fillRect(0,0,256,256);for(let x=0;x<256;x+=32){const d=g.createLinearGradient(x,0,x+32,0);d.addColorStop(0,'#686868');d.addColorStop(.25,'#b0b0b0');d.addColorStop(.65,'#929292');d.addColorStop(1,'#686868');g.fillStyle=d;g.fillRect(x,0,32,256);}});
 const concrete=makeMap(g=>{g.fillStyle='#eeeae2';g.fillRect(0,0,256,256);let seed=871;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<160;i++){const x=rand()*256,y=rand()*256,r=3+rand()*15,grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,`rgba(87,91,82,${.012+rand()*.025})`);grad.addColorStop(1,'rgba(87,91,82,0)');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);}for(let i=0;i<6500;i++){g.fillStyle=i%2?'#ffffff16':'#686e6410';g.fillRect(rand()*256,rand()*256,1,1);}});concrete.colorSpace=T.SRGBColorSpace;
 const floorMat=new T.MeshStandardMaterial({color:P.floor,map:concrete,roughness:.78});
 const roofMat=new T.MeshStandardMaterial({color:0xd0d8cf,roughness:.71,metalness:.15,bumpMap:ribs,bumpScale:.035});
 const panels=new T.MeshStandardMaterial({color:0xc9cfc1,roughness:.87,bumpMap:ribs,bumpScale:.012});
 for(const n of [...world.children]){
  if(!n.isMesh||n.isInstancedMesh||Array.isArray(n.material))continue;n.geometry.computeBoundingBox();const s=n.geometry.boundingBox.getSize(new T.Vector3()).multiply(n.scale),p=n.position;
  if(n.material.color.getHex()===P.floor&&s.y<.3&&s.x>30){n.material=floorMat;}
  if(Math.abs(Math.abs(p.x)-11.375)<.01&&p.y>9&&s.z>35){n.material=roofMat;}
  if(Math.abs(Math.abs(p.x)-21.5)<.01&&Math.abs(s.y-8.3)<.01&&s.x<.5){
   const gs=[new T.BoxGeometry(.075,s.y,.38),new T.BoxGeometry(.4,s.y,.055),new T.BoxGeometry(.4,s.y,.055)];gs[1].translate(0,0,-.1725);gs[2].translate(0,0,.1725);n.geometry=mergeGeometries(gs);gs.forEach(g=>g.dispose());n.scale.setScalar(1);stats.steelColumns++;
  }
  if(n.material.color.getHex()===P.frame&&s.y>15&&s.x<.25&&s.z<.3){
   const t=.027,gs=[new T.BoxGeometry(t,s.y,s.z),new T.BoxGeometry(s.x,s.y,t),new T.BoxGeometry(s.x,s.y,t)];gs[1].translate(0,0,-(s.z-t)/2);gs[2].translate(0,0,(s.z-t)/2);n.geometry=mergeGeometries(gs);gs.forEach(g=>g.dispose());n.scale.setScalar(1);stats.steelRafters++;
  }
 }
 // Protective masonry below, corrugated insulated cladding above the windows.
 for(const side of [-1,1]){
  const upper=k.box(.025,1.88,33.65,panels,side*21.814,7.23,0,world,.004);upper.castShadow=false;stats.wallPanels++;
  k.box(.028,.64,33.65,0x929f94,side*21.806,.48,0,world,.004).castShadow=false;
  for(let z=-16;z<=16;z+=4){k.box(.038,1.92,.035,P.frame,side*21.789,7.23,z,world,.003).castShadow=false;}
 }
 // The high gable wall reads as assembled cladding with modest expansion joints.
 for(const z of [-16.81,16.81])for(let x=-20;x<=20;x+=4)k.box(.028,2,.025,0xaebaae,x,7.28,z,world,.002).castShadow=false;
 // Light comes from four actual hanging luminaires. Ambient is reduced so racks
 // and work zones have depth; these lights add no shadow-map rendering passes.
 for(const light of scene.children){if(light.isHemisphereLight){light.intensity=1.30;light.color.setHex(0xe7edf0);light.groundColor.setHex(0x8f9282);}if(light.isDirectionalLight&&!light.castShadow)light.intensity=.40;}
 for(const x of [-12,12])for(const z of [-3,13]){const light=new T.SpotLight(0xfff2dc,75,21,1.05,.75,2);light.position.set(x,7.44,z);light.target.position.set(x,.11,z);light.castShadow=false;scene.add(light,light.target);}
 world.userData.warehouseStructure=stats;return stats;
}
