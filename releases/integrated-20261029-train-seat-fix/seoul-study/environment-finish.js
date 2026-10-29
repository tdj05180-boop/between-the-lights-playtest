import {addUpperRoom,facadeShell,interiorGlass,batchInteriorVisuals} from '../src/models/visible-interiors.js';
import {retailType,drawInterior,buildRetailFront} from './retail-fronts.js';
import {T} from '../experiments/spaces/kit.js';
import {mergeGeometries,mergeVertices} from '../src/vendor/BufferGeometryUtils.js';
import {bevelBox} from '../src/models/pastel-shapes.js';
import {batchStatic} from '../src/models/static-batch.js';
import {openDestinationInterior} from './destination-interior.js';

// Seoul-only visual finish. Original parcels, signs, colliders and traffic stay authoritative.
// Textures are original procedural drawings; no external assets or live reflection passes.
export function environmentFinish(k){
 const textures=new Map(),materials=new Map();
 const stats={facades:0,windows:0,shopWindows:0,trees:0,proceduralTextures:0,storefronts:[]};
 function canvasTexture(key,draw,size=256){
  if(textures.has(key))return textures.get(key);
  const cv=document.createElement('canvas');cv.width=cv.height=size;draw(cv.getContext('2d'),size);
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
  textures.set(key,t);stats.proceduralTextures++;return t;
 }
 function surface(kind){return canvasTexture(kind,(g,s)=>{
  g.fillStyle='#eeede9';g.fillRect(0,0,s,s);let seed=271;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<6500;i++){const v=150+rnd()*90;g.fillStyle=`rgba(${v},${v},${v},${kind==='road'?.22:.10})`;g.fillRect(rnd()*s,rnd()*s,1,1);}
  if(kind==='paving'||kind==='brick'){
   const h=kind==='brick'?32:64;
   for(let y=0;y<256;y+=h)for(let x=-64;x<256;x+=128){const xx=x+((y/h)%2)*64;
    g.fillStyle=`rgba(100,104,99,${.025+rnd()*.045})`;g.fillRect(xx,y,128,h);
    g.strokeStyle='#b6b9af';g.lineWidth=1;g.strokeRect(xx+.5,y+.5,127,h-1);
    g.strokeStyle='#ffffff99';g.beginPath();g.moveTo(xx+2,y+h-2);g.lineTo(xx+126,y+h-2);g.stroke();
   }
  }
 });}
 function mat(color,kind='plaster'){
  const key=color+'/'+kind;if(materials.has(key))return materials.get(key);
  const map=surface(['metal','stone'].includes(kind)?'plaster':kind);map.wrapS=map.wrapT=T.RepeatWrapping;
  const m=new T.MeshStandardMaterial({color,map,roughness:kind==='metal'?.48:.88,metalness:kind==='metal'?.25:0});
  materials.set(key,m);return m;
 }
 function worldUV(geo,unit=2){const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.setXY(i,ay>.7?p.getX(i)/unit:ax>.7?p.getZ(i)/unit:p.getX(i)/unit,ay>.7?p.getZ(i)/unit:p.getY(i)/unit);}return geo;
 }
 // Sixteen shared shallow interior cards: shop, office and curtained upper floor.
 // Opaque room/reflection composites avoid transparent overdraw and black windows.
 const atlas=canvasTexture('daylight-interiors',(g)=>{
  for(let tile=0;tile<16;tile++){g.save();g.translate((tile%4)*256,Math.floor(tile/4)*256);drawInterior(g,tile);g.restore();}
 },1024);
 function glassGeometry(w,h,d,tile,a=0,b=1,bottom=0,top=1){
  const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv,p=g.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,((tile%4)+(a+(p.getX(i)/w+.5)*(b-a))*.984+.008)/4,(3-Math.floor(tile/4)+(bottom+(p.getY(i)/h+.5)*(top-bottom))*.984+.008)/4);return g;
 }
 const glazing=new T.MeshStandardMaterial({color:0xffffff,map:atlas,roughness:.38,metalness:.08});
 const glassColors=new Set([0x64858d,0x728e92,0x819899,0x829c9d,0x6f8c8e,0x7f9699,0x66828a,0x4d6871]);
 function dimensions(n){n.geometry.computeBoundingBox();return n.geometry.boundingBox.getSize(new T.Vector3()).multiply(n.scale);}
 function box(parent,w,h,d,material,pos,rotation){const n=new T.Mesh(new T.BoxGeometry(w,h,d),material);n.position.copy(pos);n.rotation.copy(rotation);n.receiveShadow=true;n.castShadow=false;parent.add(n);return n;}
 function facade(root){
  let windows=0;const scenery=k.world.userData.seoulScenery;
  const record=root===k.world?null:scenery.buildings.find(r=>Math.abs(r.x-root.position.x)<.001&&Math.abs(r.z-root.position.z)<.001);
  const hasFront=!!record,facing=root.position.z<0?1:-1;
  const sign=record?(record.background?scenery.signs.find(s=>s.background&&s.x===record.x&&s.z===record.z):scenery.signs.find(s=>!s.background&&s.slot===Math.round(record.x/8.2)+3+(record.z>0?7:0))):null;
  const letters=[],openings=[];
  if(record)openings.push({side:facing>0?0:2,a:-record.w/2+.22,b:record.w/2-.22,low:.21,high:2.72});
  if(record)for(const pane of root.children){
   if(!pane.isMesh||Array.isArray(pane.material)||pane.material.map)continue;const sz=dimensions(pane);
   if(!glassColors.has(pane.material.color.getHex())||sz.x<=.45||sz.y<=.4||sz.z>=.13||pane.position.y<3.05)continue;
   const side=(Math.round(pane.rotation.y/(Math.PI/2))+4)%4,u=side===0?pane.position.x:side===2?-pane.position.x:side===1?-pane.position.z:pane.position.z;
   openings.push({side,a:u-sz.x/2-.012,b:u+sz.x/2+.012,low:pane.position.y-sz.y/2-.012,high:pane.position.y+sz.y/2+.012});
  }
  if(hasFront){for(const n of [...root.children]){
   if(!n.isMesh)continue;const size=dimensions(n);
   if(n.position.z*facing>record.d/2-.22&&n.position.y<3.59&&size.y<3.2){
    if(n.material.map&&Math.abs(n.position.y-2.98)<.1)letters.push(n);
    else n.removeFromParent();
   }
  }}
  if(record)for(const n of [...root.children]){
   if(!n.isMesh||Array.isArray(n.material)||n.material.map)continue;
   const sz=dimensions(n),side=(Math.round(n.rotation.y/(Math.PI/2))+4)%4;
   if(glassColors.has(n.material.color.getHex())&&sz.y>3){n.removeFromParent();continue;}
   const u=side===0?n.position.x:side===2?-n.position.x:side===1?-n.position.z:n.position.z;
   if(sz.z<.20&&openings.some(o=>o.side===side&&o.low>3&&Math.abs((o.a+o.b)/2-u)<.03&&Math.abs((o.low+o.high)/2-n.position.y)<.03&&sz.x>o.b-o.a+.08&&sz.x<o.b-o.a+.3&&sz.y>o.high-o.low+.08&&sz.y<o.high-o.low+.3))n.removeFromParent();
  }
  for(const n of [...root.children]){
   if(!n.isMesh||Array.isArray(n.material)||n.material.map)continue;
   const s=dimensions(n),c=n.material.color.getHex();
   if(hasFront&&n.position.y<3&&s.x>.8&&s.y>1&&s.z<.18&&[0x405d65,0x455d61].includes(c)&&Math.cos(n.rotation.y)*facing>.9){n.position.addScaledVector(new T.Vector3(0,0,1).applyEuler(n.rotation),-.55);}
   if(s.x>1&&s.y>3&&s.z>2){
    if(hasFront&&n.position.y<s.y/2+.3){
     const shell=facadeShell(s.x,s.y,s.z,n.position.y-s.y/2,openings);shell.translate(-n.position.x,-n.position.y,-n.position.z);n.geometry=worldUV(shell);
    }else n.geometry=worldUV(bevelBox(s.x,s.y,s.z,.055));n.scale.setScalar(1);
    n.material=mat(c,Math.round(Math.abs(root.position.x))%3===0?'brick':'plaster');
   }else if(glassColors.has(c)&&s.y>3){n.material=mat(0x98aba9,'metal');
   }else if(glassColors.has(c)&&s.x>.45&&s.y>.4&&s.z<.13){
    const shop=n.position.y<3.05;
    const phase=(windows+Math.floor(n.position.y)+Math.round(Math.abs(root.position.x)))%5;
    const tile=shop?(sign?retailType(sign.name):12):phase===0?13:phase===1||phase===2?14:15;
    // Ground-floor door and window cards share a floor/ceiling reference even
    // when the original opening heights differ (including the destination door).
    const bottom=shop?(n.position.y-s.y/2-.21)/2.84:0,top=shop?(n.position.y+s.y/2-.21)/2.84:1;
    const g=glassGeometry(s.x,s.y,s.z,tile,0,1,bottom,top);
    n.geometry=g;n.scale.setScalar(1);n.material=glazing;n.receiveShadow=false;n.castShadow=false;
    if(record&&!shop){
     const mode=phase===0?1:phase===1||phase===2?0:2;
     const holder=new T.Group();holder.position.copy(n.position);holder.rotation.copy(n.rotation);holder.translateZ(-.06);root.add(holder);
     addUpperRoom(holder,{width:s.x,height:s.y,depth:mode===0?.24:1.32,mode,variant:windows*7+Math.floor(n.position.y)*3+Math.round(root.position.x*11+root.position.z*5)});
     n.geometry=new T.PlaneGeometry(s.x,s.y);n.material=interiorGlass();
    }
    const normal=new T.Vector3(0,0,1).applyEuler(n.rotation),right=new T.Vector3(1,0,0).applyEuler(n.rotation);
    const frame=mat(shop?0x647670:0xd4d6c9,'metal');
    for(const sign of [-1,1]){
     box(root,.045,s.y+.1,.08,frame,n.position.clone().addScaledVector(right,sign*(s.x/2+.015)).addScaledVector(normal,s.z/2-.015),n.rotation);
     box(root,s.x+.1,.045,.08,frame,n.position.clone().add(new T.Vector3(0,sign*(s.y/2+.015),0)).addScaledVector(normal,s.z/2-.015),n.rotation);
    }
    if(s.x>1.5)box(root,.032,s.y,.06,frame,n.position.clone().addScaledVector(right,s.x*.19).addScaledVector(normal,s.z/2+.0125),n.rotation);
    box(root,s.x+.18,.065,.27,mat(0xbac1b7,'stone'),n.position.clone().add(new T.Vector3(0,-s.y/2-.09,0)).addScaledVector(normal,.07),n.rotation);
    windows++;stats.windows++;if(shop)stats.shopWindows++;
   }
  }
  if(record&&sign){
   const design=buildRetailFront(k,root,record,sign,mat,glazing,glassGeometry);stats.storefronts.push(design);
   // Preserve original lettering, including names and fonts. Only its display size changes.
   if(!record.background){const sg=k.world.children.find(n=>n.isGroup&&n!==root&&Math.abs(n.position.x-record.x)<.001&&Math.abs(n.position.z-(record.z+facing*record.d/2))<.001);
    if(sg)for(const n of [...sg.children]){if(!n.isMesh)continue;const size=dimensions(n);
     if(n.material.map&&Math.abs(n.position.y-2.98)<.1)letters.push(n);
     else if(size.x>2||Math.abs(n.position.y-2.98)<.1&&Math.abs(n.position.x)<2.1)n.removeFromParent();
    }
   }
   for(const n of letters){const old=n.geometry.parameters.width;n.scale.x=Math.min(design.signWidth-.23,3.8)/old;n.scale.y=(design.signHeight-.08)/(n.geometry.parameters.height||.38);n.position.y=design.signY;}
  }
  if(windows)stats.facades++;
 }
 function finish(){
  // Groups own all 51 generated parcels; the destination frontage is authored in world.
  for(const root of k.world.children.filter(n=>n.isGroup))facade(root);
  facade(k.world);
  openDestinationInterior(k.world);
  for(const n of [...k.world.children]){
   if(!n.isMesh||Array.isArray(n.material)||n.material.map)continue;
   const s=dimensions(n),p=n.position;
   const road=p.y<.13&&s.y<.08&&(s.x>100&&s.z>10||s.x>8&&s.z>40);
   const paving=Math.abs(Math.abs(p.z)-9.1)<.01&&s.x>4&&s.z>4&&s.y<.1;
   const curb=Math.abs(Math.abs(p.z)-6.87)<.01&&s.z<.2&&s.x>5;
   if(n.geometry.type==='CylinderGeometry'&&s.y>4.9&&s.x<.3){n.material=mat(0x768587,'metal');const collar=new T.Mesh(new T.CylinderGeometry(.115,.15,.28,12),mat(0x7f8d86,'metal'));collar.position.set(p.x,.28,p.z);collar.receiveShadow=true;k.world.add(collar);}
   if(road||paving||curb){n.geometry=worldUV(new T.BoxGeometry(s.x,s.y,s.z),road?2:paving?1.6:.9);n.scale.setScalar(1);n.material=mat(road?0x778088:paving?0xcecfc2:0xd6d6c6,road?'road':paving?'paving':'stone');}
  }
  k.world.userData.seoulFinish=stats;
  // Larger Seoul-only static cells keep the extended street affordable. Mark the
  // finished batches as exclusions so kit.finalize does not rebake vertex colours.
  batchInteriorVisuals(k.world,{glassOnly:true});
  batchStatic(k.world,k.dynamic,{cellSize:18});
  for(const n of k.world.children)if(n.name==='StaticPastelBatch')k.dynamic.add(n);
 }
 function tree(x,z){
  stats.trees++;const root=new T.Group();root.position.set(x,0,z);k.world.add(root);
  const bark=mat(0x8b8472,'plaster');
  const branch=(a,b,r1,r2)=>{const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va);const n=new T.Mesh(new T.CylinderGeometry(r2,r1,v.length(),9),bark);n.position.copy(va.add(vb).multiplyScalar(.5));n.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());n.castShadow=n.receiveShadow=true;root.add(n);};
  branch([0,.16,0],[.045,2.95,.03],.14,.073);
  branch([.01,1.9,0],[-.60,3.16,.06],.077,.024);branch([.02,2.15,0],[.53,3.49,-.12],.068,.024);
  const clusters=[[-.46,3.22,.05,.83,.98,.77],[.44,3.48,-.06,.88,1.08,.79],[0,3.94,.07,.73,.90,.72],[-.58,3.79,-.10,.63,.74,.65],[.03,3.21,.35,.85,.73,.63]];
  const leaves=[];
  for(const [i,[cx,cy,cz,sx,sy,sz]] of clusters.entries()){
   const g=mergeVertices(new T.IcosahedronGeometry(1,2)),p=g.attributes.position,colors=[];
   const col=new T.Color([0x8da58b,0x7f9b81,0x9cb18e,0x87a082,0x78947c][i]);
   for(let j=0;j<p.count;j++){const v=new T.Vector3().fromBufferAttribute(p,j);const q=1+.045*Math.sin(v.x*8+v.y*6+v.z*7+i);p.setXYZ(j,v.x*q,v.y*q,v.z*q);const c=col.clone().multiplyScalar(.91+.10*(v.y+1)/2);colors.push(c.r,c.g,c.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
   g.scale(sx,sy,sz);g.translate(cx,cy,cz);leaves.push(g);
  }
  const foliage=new T.Mesh(mergeGeometries(leaves),new T.MeshStandardMaterial({vertexColors:true,roughness:.96}));foliage.castShadow=foliage.receiveShadow=true;root.add(foliage);k.dynamic.add(foliage);for(const g of leaves)g.dispose();

  const base=new T.Mesh(new T.BoxGeometry(.95,.035,.95),mat(0x9aa394,'stone'));base.position.y=.16;base.receiveShadow=true;root.add(base);
  for(const side of [-1,1])for(let j=-2;j<=2;j++){const grate=new T.Mesh(new T.BoxGeometry(.055,.008,.30),mat(0x657a6a,'metal'));grate.position.set(j*.135,.183,side*.26);root.add(grate);}
 }
 return {finish,tree};
}
