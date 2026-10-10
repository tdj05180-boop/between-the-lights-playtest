import {T,P} from './geometry.js';
import {bevelBox} from '../src/models/pastel-shapes.js';

// Visual envelope remains the original 0.50 × 0.43 × 0.42 m. Gameplay never reads this geometry.
export function createFoodCargo(k){
 // A single flattened 20kg-style sack shared by all colors: a loft, not a scaled sphere.
 const halfHeight=.11,halfLength=.25,halfWidth=.151;
 const profile=x=>{const t=Math.abs(x)/halfLength;return {h:halfHeight*(1-.88*Math.pow(t,9)),w:halfWidth*(1-.12*Math.pow(t,7))};};
 const top=(x,z)=>{const {h,w}=profile(x),edge=Math.max(0,1-Math.pow(Math.min(1,Math.abs(z)/w),2/.32));return h*Math.pow(edge,.58/2)+.0025*Math.sin(z*105+x*19)*Math.pow(Math.abs(x)/halfLength,5)*edge;};
 const sack=new T.BufferGeometry(),verts=[],indices=[],uv=[];const rings=24,sides=24;
 for(let i=0;i<=rings;i++){const x=-halfLength+i/rings*halfLength*2,{h,w}=profile(x);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,c=Math.cos(a),sn=Math.sin(a),z=w*Math.sign(c)*Math.pow(Math.abs(c),.32),y=Math.sign(sn)*top(x,z);verts.push(x,y,z);uv.push(i/rings,j/sides);}}
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
 for(const i of [0,rings]){const center=verts.length/3;verts.push(-halfLength+i/rings*halfLength*2,0,0);uv.push(i/rings,.5);for(let j=0;j<sides;j++){const a=i*(sides+1)+j;if(i===0)indices.push(center,a,a+1);else indices.push(center,a+1,a);}}
 sack.setAttribute('position',new T.Float32BufferAttribute(verts,3));sack.setAttribute('uv',new T.Float32BufferAttribute(uv,2));sack.setIndex(indices);sack.computeVertexNormals();sack.computeBoundingBox();
 const box=bevelBox(.5,.43,.42,.025),tape=bevelBox(.07,.012,.418,.003),seam=bevelBox(.012,.014,.261,.003);
 const clothCanvas=document.createElement('canvas');clothCanvas.width=clothCanvas.height=64;const cloth=clothCanvas.getContext('2d');cloth.fillStyle='#888';cloth.fillRect(0,0,64,64);for(let i=0;i<64;i+=4){cloth.fillStyle='#aaa';cloth.fillRect(i,0,1,64);cloth.fillStyle='#707070';cloth.fillRect(0,i,64,1);}const weave=new T.CanvasTexture(clothCanvas);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(6,4);
 function label(rice){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.clearRect(0,0,256,256);
  if(!rice){g.fillStyle='#eee3c8';g.fillRect(0,0,256,256);}g.strokeStyle=g.fillStyle=rice?'#f4e8c4':'#69744c';g.lineWidth=7;g.lineCap='round';
  if(rice){g.beginPath();g.moveTo(85,124);g.quadraticCurveTo(103,72,145,22);g.stroke();for(let i=0;i<5;i++){const x=105+i*8,y=91-i*13;for(const side of [-1,1]){g.save();g.translate(x+side*10,y);g.rotate(side*.65);g.beginPath();g.ellipse(0,0,7,15,0,0,Math.PI*2);g.fill();g.restore();}}}
  else{g.fillStyle='#9c743f';g.beginPath();g.moveTo(70,52);g.lineTo(105,60);g.lineTo(80,127);g.closePath();g.fill();g.strokeStyle='#698056';g.beginPath();g.moveTo(85,60);g.lineTo(66,31);g.moveTo(87,59);g.lineTo(105,31);g.stroke();g.fillStyle='#75905d';for(const [x,y,r] of [[161,83,34],[139,94,24],[181,96,21]]){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}}
  g.fillStyle=rice?'#f4e8c4':'#625e47';g.font=`bold ${rice?84:57}px sans-serif`;g.textAlign='center';g.fillText(rice?'쌀':'식자재',128,217);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return k.mat(0xffffff,{map,transparent:rice,roughness:.95,depthWrite:!rice});
 }
 const riceLabel=label(true),foodLabel=label(false),ricePatch=new T.PlaneGeometry(.34,.235,16,12),rp=ricePatch.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),z=-rp.getY(i);rp.setXYZ(i,x,top(x,z)+.0013,z);}ricePatch.computeVertexNormals();
 const foodPatch=new T.PlaneGeometry(.26,.25);foodPatch.translate(0,0,.216);
 const background=[],clothMaterials=new Map();
 const clothMaterial=color=>{if(!clothMaterials.has(color))clothMaterials.set(color,k.mat(color,{roughness:1,bumpMap:weave,bumpScale:.0006}));return clothMaterials.get(color);};
 function parts(kind,color){return kind==='rice'?[{g:sack,m:clothMaterial(color)},{g:ricePatch,m:riceLabel},{g:seam,m:k.mat(color),x:.244},{g:seam,m:k.mat(color),x:-.244}]:[{g:box,m:k.mat(color)},{g:foodPatch,m:foodLabel},{g:tape,m:k.mat(P.wallLight),y:.219}];}
 function make(parts,parent){return parts.map(v=>{const m=new T.Mesh(v.g,v.m);m.position.set(v.x??0,v.y??0,0);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;});}
 function playable(id,color,parent){
  const model=k.group(0,0,0,parent),blue=k.group(0,0,0,model),red=k.group(0,0,0,model);model.name='FoodCargo-'+id;
  const blueParts=make(parts('rice',P.blue),blue),redParts=make(parts('food',P.red),red);
  const item={id,color,model,body:null,setColor(c){this.color=c;blue.visible=c==='blue';red.visible=c==='red';this.body=c==='blue'?blueParts[0]:redParts[0];model.userData.cargoKind=c==='blue'?'rice':'food';model.userData.cargoId=id;}};
  item.setVisualOffset=y=>{item.visualOffset=y;blue.position.y=y;red.position.y=y;};item.visualHeight=()=>item.color==='blue'?.22:.43;item.setColor(color);item.setVisualOffset(color==='blue'?-.105:0);return item;
 }
 function stock(parent,kind,x,y,z,variation=0){const anchor=k.group(x,y,z,parent);anchor.rotation.y=(variation%3-1)*.09;anchor.scale.set(1.05+(variation%2)*.035,kind==='rice'?.72:1,1.04);background.push({anchor,kind,color:kind==='rice'?[0xe8dfc5,0xd7cab0][variation%2]:[0xc8b18c,0xbba17b,0xd4c29e][variation%3]});return anchor;}
 function flush(world){
  world.updateMatrixWorld(true);const root=new T.Group();root.name='BackgroundFoodStock';world.add(root);const buckets=new Map(),inverse=world.matrixWorld.clone().invert();
  for(const item of background)for(const part of parts(item.kind,item.color)){const key=part.g.uuid+part.m.uuid;if(!buckets.has(key))buckets.set(key,{...part,matrices:[]});const matrix=inverse.clone().multiply(item.anchor.matrixWorld).multiply(new T.Matrix4().makeTranslation(part.x??0,part.y??0,0));buckets.get(key).matrices.push(matrix);}
  for(const v of buckets.values()){const m=new T.InstancedMesh(v.g,v.m,v.matrices.length);v.matrices.forEach((x,i)=>m.setMatrixAt(i,x));m.castShadow=true;m.receiveShadow=true;root.add(m);}
  root.userData.inventory={rice:background.filter(x=>x.kind==='rice').length,food:background.filter(x=>x.kind==='food').length};return root;
 }
 const loadingOffsets=new WeakMap();
 function updatePlacements(items,carryAnchor,loaded=[]){
  // Render-only offsets: logical cargo roots, slots, collision envelopes and IDs never move.
  const previous=new Map(items.map(b=>[b.id,b.visualOffset]));
  for(const item of items)item.setVisualOffset(item.color==='blue'?-.105:0);
  const held=items.filter(b=>b.model.parent===carryAnchor).sort((a,b)=>a.model.position.y-b.model.position.y);let bottom=-.215;
  for(const item of held){item.setVisualOffset(bottom+item.visualHeight()/2-item.model.position.y);bottom+=item.visualHeight()+.012;}
  for(const l of loaded){const item=items.find(b=>b.id===l.id);if(!item)continue;const layer=Math.round((l.slot.y-.49)/.445),target=item.color==='blue'?-.105-layer*.225:0;
   if(!loadingOffsets.has(l)){loadingOffsets.set(l,previous.get(item.id)??0);}
   const t=l.state==='loaded'?1:Math.min(1,l.time/.25);item.setVisualOffset(loadingOffsets.get(l)*(1-t)+target*t);
  }
 }
 return {playable,stock,flush,updatePlacements};
}
