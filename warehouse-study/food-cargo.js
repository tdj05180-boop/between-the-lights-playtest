import {T,P} from './geometry.js';
import {bevelBox} from '../src/models/pastel-shapes.js';

// Visual envelope remains the original 0.50 × 0.43 × 0.42 m. Gameplay never reads this geometry.
export function createFoodCargo(k){
 const sack=new T.SphereGeometry(1,20,12),p=sack.attributes.position;
 const signed=(v,n)=>Math.sign(v)*Math.pow(Math.abs(v),n);
 for(let i=0;i<p.count;i++){const y=p.getY(i),r=Math.sqrt(Math.max(0,1-y*y)),bulge=.82+.18*r;p.setXYZ(i,.25*signed(p.getX(i),.45)*bulge,.215*y,.21*signed(p.getZ(i),.55)*bulge);}
 sack.computeVertexNormals();sack.computeBoundingBox();
 const box=bevelBox(.5,.43,.42,.025),tape=bevelBox(.07,.012,.418,.003),seam=bevelBox(.30,.012,.055,.005);
 function label(rice){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.clearRect(0,0,256,256);
  if(!rice){g.fillStyle='#eee3c8';g.fillRect(0,0,256,256);}g.strokeStyle=g.fillStyle=rice?'#f4e8c4':'#69744c';g.lineWidth=7;g.lineCap='round';
  if(rice){g.beginPath();g.moveTo(85,124);g.quadraticCurveTo(103,72,145,22);g.stroke();for(let i=0;i<5;i++){const x=105+i*8,y=91-i*13;for(const side of [-1,1]){g.save();g.translate(x+side*10,y);g.rotate(side*.65);g.beginPath();g.ellipse(0,0,7,15,0,0,Math.PI*2);g.fill();g.restore();}}}
  else{g.fillStyle='#9c743f';g.beginPath();g.moveTo(70,52);g.lineTo(105,60);g.lineTo(80,127);g.closePath();g.fill();g.strokeStyle='#698056';g.beginPath();g.moveTo(85,60);g.lineTo(66,31);g.moveTo(87,59);g.lineTo(105,31);g.stroke();g.fillStyle='#75905d';for(const [x,y,r] of [[161,83,34],[139,94,24],[181,96,21]]){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}}
  g.fillStyle=rice?'#f4e8c4':'#625e47';g.font=`bold ${rice?84:57}px sans-serif`;g.textAlign='center';g.fillText(rice?'쌀':'식자재',128,217);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return k.mat(0xffffff,{map,transparent:rice,roughness:.95,depthWrite:!rice});
 }
 const riceLabel=label(true),foodLabel=label(false),ricePatch=new T.PlaneGeometry(.26,.28,8,8),rp=ricePatch.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),r=Math.sqrt(Math.max(0,1-(y/.215)**2)),b=.82+.18*r,w=.25*Math.pow(r,.45)*b;rp.setZ(i,.21*Math.pow(r,.55)*b*Math.pow(Math.max(0,1-Math.pow(Math.abs(x)/w,2/.45)),.55/2)+.0015);}
 ricePatch.computeVertexNormals();const foodPatch=new T.PlaneGeometry(.26,.25);foodPatch.translate(0,0,.216);
 const background=[];
 function parts(kind,color){return kind==='rice'?[{g:sack,m:k.mat(color)},{g:ricePatch,m:riceLabel},{g:seam,m:k.mat(color),y:.203},{g:seam,m:k.mat(color),y:-.203}]:[{g:box,m:k.mat(color)},{g:foodPatch,m:foodLabel},{g:tape,m:k.mat(P.wallLight),y:.219}];}
 function make(parts,parent){return parts.map(v=>{const m=new T.Mesh(v.g,v.m);m.position.y=v.y??0;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;});}
 function playable(id,color,parent){
  const model=k.group(0,0,0,parent),blue=k.group(0,0,0,model),red=k.group(0,0,0,model);model.name='FoodCargo-'+id;
  const blueParts=make(parts('rice',P.blue),blue),redParts=make(parts('food',P.red),red);
  const item={id,color,model,body:null,setColor(c){this.color=c;blue.visible=c==='blue';red.visible=c==='red';this.body=c==='blue'?blueParts[0]:redParts[0];model.userData.cargoKind=c==='blue'?'rice':'food';model.userData.cargoId=id;}};
  item.setColor(color);return item;
 }
 function stock(parent,kind,x,y,z,variation=0){const anchor=k.group(x,y,z,parent);anchor.rotation.y=(variation%3-1)*.09;anchor.scale.set(1.05+(variation%2)*.035,kind==='rice'?.72:1,1.04);background.push({anchor,kind,color:kind==='rice'?[0xe8dfc5,0xd7cab0][variation%2]:[0xc8b18c,0xbba17b,0xd4c29e][variation%3]});return anchor;}
 function flush(world){
  world.updateMatrixWorld(true);const root=new T.Group();root.name='BackgroundFoodStock';world.add(root);const buckets=new Map(),inverse=world.matrixWorld.clone().invert();
  for(const item of background)for(const part of parts(item.kind,item.color)){const key=part.g.uuid+part.m.uuid;if(!buckets.has(key))buckets.set(key,{...part,matrices:[]});const matrix=inverse.clone().multiply(item.anchor.matrixWorld).multiply(new T.Matrix4().makeTranslation(0,part.y??0,0));buckets.get(key).matrices.push(matrix);}
  for(const v of buckets.values()){const m=new T.InstancedMesh(v.g,v.m,v.matrices.length);v.matrices.forEach((x,i)=>m.setMatrixAt(i,x));m.castShadow=true;m.receiveShadow=true;root.add(m);}
  root.userData.inventory={rice:background.filter(x=>x.kind==='rice').length,food:background.filter(x=>x.kind==='food').length};return root;
 }
 return {playable,stock,flush};
}
