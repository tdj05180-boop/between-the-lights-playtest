import {T} from '../experiments/spaces/kit.js';
// Seoul-only, restrained daylight sign family. No emissive material or light.
export function shopSigns(k){
 const geo=new T.BoxGeometry(1,1,1),records=[];
 const styles=[
 ['온유문고',0xdcd7c6,0x52625b,'frame'],['모퉁이 커피',0x52685d,0xeee4cc,'wood'],
 ['다온약국',0xe2dfd1,0x5e7c68,'frame'],['한결부동산',0x657d8a,0xeee6cf,'frame'],
 ['새로운 시작',0x526d70,0xeee4ca,'frame'],['봄날사진관',0x5d6264,0xe9dfc9,'slim'],
 ['늘봄꽃집',0x829483,0xf0e7d3,'wood'],['가온안경',0xdad7cd,0x596970,'slim'],
 ['윤슬베이커리',0xa48b70,0xf0e6d0,'awning'],['동네세탁소',0xd9e0dc,0x607c88,'frame'],
 ['정다운식탁',0x997467,0xf1e4cf,'frame'],['여유공방',0x897e6c,0xe8e0ca,'wood'],
 ['한빛문구',0xc2ae79,0x516775,'slim'],['소담분식',0xa17a69,0xf3e6d2,'awning']];
 function add(x,z,d,slot,destination=false){
  const [name,color,ink,kind]=styles[slot],root=new T.Group();root.position.set(x,0,z+(z<0?1:-1)*d/2);if(z>0)root.rotation.y=Math.PI;k.world.add(root);
  const b=(w,h,depth,c,xx,y,zz)=>{const m=new T.Mesh(geo,k.mat(c));m.scale.set(w,h,depth);m.position.set(xx,y,zz);m.receiveShadow=true;root.add(m);return m;};
  function text(value,w,h,xx,y,zz,ry=0){const cv=document.createElement('canvas');cv.width=512;cv.height=96;const g=cv.getContext('2d');g.fillStyle='#'+ink.toString(16).padStart(6,'0');g.font='600 57px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(value,256,50,470);const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,transparent:true,alphaTest:.1,roughness:.86}));m.position.set(xx,y,zz);m.rotation.y=ry;m.receiveShadow=true;root.add(m);}
  const width=destination?2.65:kind==='wood'?4.25:kind==='slim'?4.3:5.65;
  const height=destination?.38:kind==='slim'?.38:.50,y=destination?3.16:2.98;
  b(width,height,.17,kind==='wood'?0x766857:0x526568,0,y,.20);
  b(width-.12,height-.10,.035,color,0,y,.302);
  if(kind==='wood')for(const u of [-1.6,1.6])b(.028,height-.12,.018,0xb1a38c,u,y,.329);
  text(name,destination?2.3:Math.min(width-.4,3.8),destination?.31:.39,0,y,.33);
  // A modest canopy valance differentiates bakery/snack frontages.
  if(kind==='awning'){b(6.42,.18,.045,color,0,3.31,.715);for(const u of [-2.85,2.85])b(.16,.18,.02,0xd9cbb4,u,3.31,.75);}
  // Blade signs: compact, two-sided, above pedestrian head height.
  if(slot===1||slot===6||slot===10){b(.07,.08,.76,0x5e706b,2.64,3.36,.45);b(.12,.48,.58,color,2.64,3.05,.66);const word=slot===1?'커피':slot===6?'꽃':'식탁';text(word,.49,.28,2.707,3.05,.66,Math.PI/2);text(word,.49,.28,2.573,3.05,.66,-Math.PI/2);}
  root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root);records.push({name,slot,kind,destination,min:bounds.min.toArray(),max:bounds.max.toArray(),color:color.toString(16)});
 }
 return {add,records};
}
