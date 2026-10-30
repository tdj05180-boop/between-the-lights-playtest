import {openMainInterior,finishMainUpperRooms} from './interior-depth.js';
import {batchInteriorVisuals} from '../src/models/visible-interiors.js';
import * as T from '../src/vendor/three.module.min.js';
import {bevelBox} from '../src/models/pastel-shapes.js';
import {mergeGeometries} from '../src/vendor/BufferGeometryUtils.js';
import {drawInterior,retailType} from '../seoul-study/retail-fronts.js';
import {streetTrees,utilityRows} from './environment-props.js';

export function streetShopfront(world,b,index,box){
 // A modest timber/aluminium shopfront, fitted within the existing solid shell.
 // Door and display glass share the same room mapping in finishStreet below.
 const left=b.x-b.w/2+.34,right=b.x+b.w/2-.34,door=right-.98;
 const sill=index===0?.63:index===1?.40:index===3?.32:.80,top=2.43,base=.25;
 const frame=index===1?0x6b8071:index===3?0x8c776a:0x71817b;
 const part=(w,h,d,c,x,y,z)=>box(w,h,d,c,x,y,z,world,.009);
 // Continuous upper rail and two jambs; no detached decorative frame in front.
 part(right-left+.09,.095,.13,frame,(left+right)/2,top,-.845);
 for(const x of [left,door,right])part(.065,top-base,.13,frame,x,(top+base)/2,-.845);
 const pane=(a,c,low)=>{
  const n=part(c-a-.045,top-low-.06,.028,0x809f9d,(a+c)/2,(low+top)/2,-.866);
  n.name='2003-connected-shop-glass';
  part(c-a,.065,.13,frame,(a+c)/2,low,-.845);
 };
 pane(left,door,sill);pane(door,right,base+.06);
 if(sill>base)part(door-left,sill-base,.10,0xc9c1ab,(left+door)/2,(base+sill)/2,-.90);
 const hx=door+.16;part(.026,.31,.025,0xa8aaa0,hx,1.20,-.776);
 for(const y of [1.07,1.33])part(.030,.025,.081,0xa8aaa0,hx,y,-.81);
 part(.90,.045,.065,frame,(door+right)/2,.72,-.845);
 part(right-left+.10,.065,.30,0xb9b7a8,(left+right)/2,.22,-.89);
 if(door-left>2.45)part(.035,top-sill,.09,frame,(left+door)/2,(sill+top)/2,-.853);
 if(index===4){
  // Fixed transom grille belongs to the workshop facade, above eye height.
  part(door-left,.045,.08,frame,(left+door)/2,2.1,-.853);
  for(let x=left+.20;x<door;x+=.34)part(.022,.30,.05,frame,x,2.26,-.853);
 }
 openMainInterior(world,b,index);
}

// 2003-owned finishes. All parcels, shop names, tree centres and collision data
// remain in their existing modules. No change to the contemporary Seoul scene.
export function finishStreet(world,excluded){
 finishMainUpperRooms(world);
 const report={surfaces:0,glazing:0,trees:0,lamps:[],textures:0},maps=new Map(),materials=new Map();
 function texture(kind){
  if(maps.has(kind))return maps.get(kind);
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#ffffff';g.fillRect(0,0,256,256);
  // Seeded colour grain is drawn once, never regenerated during camera movement.
  let seed=391;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<3800;i++){g.fillStyle=`rgba(85,80,69,${kind==='asphalt'?.05+rnd()*.15:.015+rnd()*.065})`;g.fillRect(rnd()*256,rnd()*256,1+rnd(),1);}
  if(kind==='stone'||kind==='masonry'){
   const h=kind==='stone'?64:28,w=kind==='stone'?128:64;
   for(let y=0;y<256;y+=h)for(let x=-w;x<256;x+=w){const xx=x+(y/h%2)*w/2;g.fillStyle=`rgba(125,120,110,${rnd()*.055})`;g.fillRect(xx,y,w,h);g.strokeStyle='#bfc0b8';g.lineWidth=1;g.strokeRect(xx,y,w,h);g.strokeStyle='#ffffffa0';g.beginPath();g.moveTo(xx+2,y+h-2);g.lineTo(xx+w-2,y+h-2);g.stroke();}
  }
  if(kind==='timber')for(let y=0;y<256;y+=5){g.strokeStyle=`rgba(105,88,60,${.04+rnd()*.08})`;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(80,y+3,170,y-2,256,y);g.stroke();}
  if(kind==='roof')for(let x=0;x<256;x+=16){const grad=g.createLinearGradient(x,0,x+16,0);grad.addColorStop(0,'#acb0a9');grad.addColorStop(.4,'#ffffff');grad.addColorStop(1,'#d1d0c9');g.fillStyle=grad;g.fillRect(x,0,16,256);for(let y=0;y<256;y+=64){g.fillStyle='#a5aaa340';g.fillRect(x,y,16,2);}}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;maps.set(kind,map);report.textures++;return map;
 }
 function material(original,kind){const key=original.uuid+'/'+kind;if(materials.has(key))return materials.get(key);const m=original.clone();m.map=texture(kind);m.roughness=kind==='roof'?.68:kind==='timber'?.75:.9;m.metalness=kind==='roof'?.12:0;materials.set(key,m);return m;}
 function uvSurface(n,unit){const geo=n.geometry.clone(),p=geo.attributes.position,normal=geo.attributes.normal,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){const x=p.getX(i)*n.scale.x,y=p.getY(i)*n.scale.y,z=p.getZ(i)*n.scale.z,ax=Math.abs(normal.getX(i)),ay=Math.abs(normal.getY(i));uv.setXY(i,(ay>.7?x:ax>.7?z:x)/unit,(ay>.7?z:y)/unit);}n.geometry=geo;
 }
 const atlasCanvas=document.createElement('canvas');atlasCanvas.width=atlasCanvas.height=1024;const ctx=atlasCanvas.getContext('2d');
 for(let tile=0;tile<16;tile++){ctx.save();ctx.translate(tile%4*256,Math.floor(tile/4)*256);drawInterior(ctx,tile);ctx.restore();}
 const atlas=new T.CanvasTexture(atlasCanvas);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;report.textures++;
 const windowMaterial=new T.MeshStandardMaterial({map:atlas,roughness:.40,metalness:.06});
 const glassColors=new Set([0x809f9d,0x779791]);
 const woodColors=new Set([0xa68e6e,0x9e8872,0xb4a080]);
 const plasterColors=new Set([0xc5b19e,0xa7bbad,0xe0c9a5,0xc6b1ab,0xb0bdc5,0xb6c5b3,0xd6bdac,0xcbb9a1,0xc4cdbe,0xd8c7b1,0xb8c6c5,0xcababc,0xc4c6b7,0xc4b5a8,0xb3c2bb,0xd2c3a8,0xb9bec8,0xc9b3aa,0xb3c2b5,0xcac1ad]);
 const mainShops=[[-10,4,'모퉁이 책방'],[-5.5,4.7,'작은 찻집'],[5.45,4.7,'동네 꽃집'],[10,4,'생활 공방']];
 const neighbourTrades=[[-19,-4,8], [18.5,-4,0],[-19,17,10],[-10.5,17,9],[-2.2,17.5,12],[7,17,4],[18,17.5,12]];
 world.updateMatrixWorld(true);const meshes=[];
 function visit(n){if(excluded.has(n)||n.isSkinnedMesh)return;if(n.isMesh&&!n.isInstancedMesh&&!Array.isArray(n.material)&&n.material.isMeshStandardMaterial&&!n.material.map&&!n.material.transparent&&!n.material.emissive.getHex())meshes.push(n);for(const c of n.children)visit(c);}visit(world);
 for(const n of meshes){
  const geo=n.geometry;geo.computeBoundingBox();const s=geo.boundingBox.getSize(new T.Vector3()).multiply(n.scale),c=n.material.color.getHex(),pos=n.getWorldPosition(new T.Vector3());
  if(glassColors.has(c)&&s.y>.7&&Math.min(s.x,s.z)<.16){
   if(n.userData.streetGlazing){
    const spec=n.userData.streetGlazing,g=geo.clone(),p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){const u=spec.a+(p.getX(i)*n.scale.x/s.x+.5)*(spec.b-spec.a),v=spec.bottom+(p.getY(i)*n.scale.y/s.y+.5)*(spec.top-spec.bottom);uv.setXY(i,(spec.tile%4+.008+u*.984)/4,(3-Math.floor(spec.tile/4)+.008+v*.984)/4);}
    n.geometry=g;n.material=windowMaterial;n.receiveShadow=false;report.glazing++;continue;
   }
   const upper=pos.y>3.05,side=s.x<s.z,span=side?s.z:s.x;
   let tile=upper?13+Math.abs(Math.round(pos.x*3+pos.z+pos.y))%3:12;
   const shop=mainShops.find(([x,w])=>Math.abs(pos.x-x)<w/2&&pos.z>-.99&&pos.z<-.70);
   if(shop&&!upper)tile=retailType(shop[2]);
   else if(!upper){const entry=neighbourTrades.find(([x,z])=>Math.abs(pos.x-x)<4.3&&Math.abs(pos.z-z)<5);if(entry)tile=entry[2];}
   const g=geo.clone(),p=g.attributes.position,uv=g.attributes.uv;
   for(let i=0;i<p.count;i++){
    let u=((side?p.getZ(i)*n.scale.z:p.getX(i)*n.scale.x)/span+.5),v=p.getY(i)*n.scale.y/s.y+.5;
    // Connected shop panes crop one world-height room, including narrow doors.
    if(!upper){v=T.MathUtils.clamp((pos.y+p.getY(i)*n.scale.y-.21)/2.20,0,1);if(shop)u=T.MathUtils.clamp((pos.x+p.getX(i)*n.scale.x-shop[0])/(shop[1]-.78)+.5,0,1);}
    uv.setXY(i,(tile%4+.008+u*.984)/4,(3-Math.floor(tile/4)+.008+v*.984)/4);
   }
   n.geometry=g;n.material=windowMaterial;n.receiveShadow=false;report.glazing++;continue;
  }
  let kind=null,unit=2;
  if((c===0x9ca6a5)&&s.y<.3&&Math.max(s.x,s.z)>4){kind='asphalt';unit=1.4;}
  else if(c===0xcacabb&&s.y<.3&&Math.max(s.x,s.z)>2){kind='stone';unit=2.8;}
  else if(plasterColors.has(c)&&s.y>2&&Math.max(s.x,s.z)>3){kind='plaster';unit=1.8;}
  else if(c===0xb4a58f&&s.y<.5&&Math.max(s.x,s.z)>2){kind='masonry';unit=1.5;}
  else if((c===0x9b897d||c===0xa68e6e)&&s.y<.25&&s.z>1.5&&pos.y>4){kind='roof';unit=1.2;}
  else if(woodColors.has(c)&&s.y<.2&&Math.max(s.x,s.z)>.4){kind='timber';unit=1;}
  if(kind){uvSurface(n,unit);n.material=material(n.material,kind);report.surfaces++;}
 }
 // Preserve each approved tree's centre/scale and crown envelope. Smooth, lobed
 // crowns carry directional normals instead of the old triangular polyhedra.
 const crowns=new Map();
 for(const tree of world.children.filter(n=>n.name==='StreetTree')){
  for(const leaf of tree.children.filter(n=>n.geometry?.type==='IcosahedronGeometry')){
   const radius=leaf.geometry.parameters.radius;let g=crowns.get(radius);
   if(!g){
    const parts=[[.22,.14,.12,.73],[-.30,-.15,.05,.66],[.15,-.28,-.30,.55],[-.10,.35,-.20,.59]].map(([x,y,z,r])=>{
     const part=new T.SphereGeometry(radius*r,10,7);part.translate(x*radius,y*radius,z*radius);return part;
    });g=mergeGeometries(parts);parts.forEach(p=>p.dispose());crowns.set(radius,g);
   }
   leaf.geometry=g;
  }report.trees++;
 }
 // Lamps mount below the existing utility wires, using their existing poles.
 // This avoids new supports in walking routes or moving any approved tree.
 const lampMetal=new T.MeshStandardMaterial({color:0x71827c,roughness:.48,metalness:.35});
 const lens=new T.MeshStandardMaterial({color:0xe5e4ce,roughness:.4});
 const add=(g,geo,m,x,y,z)=>{const n=new T.Mesh(geo,m);n.position.set(x,y,z);n.castShadow=false;n.receiveShadow=true;g.add(n);return n;};
 function lamp(x,z,angle){
  const root=new T.Group();root.name='2003-pole-mounted-streetlight';root.position.set(x,0,z);root.rotation.y=angle;world.add(root);
  // Local +Z points over the road; 4.45m lamp stays below the 5.6m cross-arm.
  for(const y of [4.08,4.32])add(root,new T.CylinderGeometry(.115,.115,.055,10),lampMetal,0,y,0);
  const curve=new T.CatmullRomCurve3([[0,4.1,0],[0,4.40,.40],[0,4.48,.95],[0,4.48,1.30]].map(p=>new T.Vector3(...p)));
  add(root,new T.TubeGeometry(curve,8,.034,6,false),lampMetal,0,0,0);
  add(root,bevelBox(.30,.14,.66,.05),lampMetal,0,4.44,1.35);
  add(root,bevelBox(.235,.036,.53,.012),lens,0,4.359,1.35);
  report.lamps.push({x,z,height:4.44,angle,mountedOnExistingPole:true});
 }
 for(const [row,{z,xs}] of utilityRows.entries())for(const [i,x] of xs.entries()){
  if(i%2!==row%2||(row===0&&Math.abs(x)<10)||Math.abs(Math.abs(x)-33.8)<.1)continue;
  if(streetTrees.some(t=>Math.hypot(t.x-x,t.z-z)<1.6))continue;
  lamp(x,z,row?Math.PI:0);
 }
 for(const x of [-33.8,33.8])for(const z of [-119,-75,-31,29,73,117]){
  if(streetTrees.some(t=>Math.hypot(t.x-x,t.z-z)<1.6))continue;
  lamp(x,z,x<0?Math.PI/2:-Math.PI/2);
 }
 batchInteriorVisuals(world,{glassOnly:true});
 world.userData.streetFinish=report;return report;
}
