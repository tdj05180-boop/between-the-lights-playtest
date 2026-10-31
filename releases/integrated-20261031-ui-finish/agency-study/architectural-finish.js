import {T} from '../experiments/spaces/kit.js';

// Branch office finishes are contemporary and quiet. The dark city remains the
// focal point; no warehouse cladding or older-office timber panel template.
export function refineAgencyArchitecture(k){
 const {world,box}=k;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const g=canvas.getContext('2d');
 g.fillStyle='#eceee9';g.fillRect(0,0,256,256);
 // Fine pile and quiet tile boundaries avoid the previous oversized plaid.
 for(let i=0;i<256;i+=2){g.fillStyle=i%4?'#5669650b':'#ffffff18';g.fillRect(i,0,1,256);g.fillRect(0,i,256,1);}
 g.fillStyle='#71857c18';g.fillRect(0,0,1,256);g.fillRect(0,0,256,1);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(12,18);map.anisotropy=4;
 const carpet=new T.MeshStandardMaterial({color:0x8f9e97,map,roughness:.96});
 for(const n of [...world.children]){
  if(!n.isMesh||Array.isArray(n.material))continue;
  if(n.position.y===.104&&n.material.color.getHex()===0xc6c5b4)n.removeFromParent();
 }
 const floor=box(13.78,.014,11.78,0xcbd2c9,0,.102,0);floor.castShadow=false;floor.receiveShadow=true;
 const zone=new T.Mesh(new T.PlaneGeometry(5.79,8.78),carpet);zone.rotation.x=-Math.PI/2;zone.position.set(-4,.110,-1.50);zone.receiveShadow=true;world.add(zone);
 // Narrow flush transition at the glass partition; does not create a step.
 box(.024,.006,8.78,0x889994,-1.09,.112,-1.5).castShadow=false;
 box(5.79,.006,.024,0x889994,-4,.112,2.89).castShadow=false;
 for(const x of [-6.89,6.89])box(.028,.12,11.78,0x9dada4,x,.20,0);
 // Side-wall panel seams and soft acoustic ceiling fields, ending at the joinery.
 for(const x of [-6.901,6.901]){
  for(const z of [-4.5,-1.5,1.5,4.5])box(.017,3.91,.012,0xc5cec3,x,2.27,z).castShadow=false;
 }
 const acoustic=new T.MeshStandardMaterial({color:0xd2d8cd,map,roughness:.96});
 for(const x of [-4,2.5]){
  const panel=new T.Mesh(new T.BoxGeometry(x<0?4.9:7.0,.024,9.9),acoustic);panel.position.set(x,4.406,-.30);world.add(panel);
 }
 world.userData.agencyArchitecture={floorZones:2,acousticFields:2,additionalLights:0,collisionChanges:0};
}
