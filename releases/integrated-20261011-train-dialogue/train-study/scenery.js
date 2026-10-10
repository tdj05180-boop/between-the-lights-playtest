import {batchStatic} from '../src/models/static-batch.js';
import {T,C} from '../experiments/spaces/kit.js';
export function createScenery(k){
 const near=new T.Group(),far=new T.Group(),urban=new T.Group(),mountains=new T.Group();for(const g of [near,far,urban,mountains]){k.world.add(g);k.dynamic.add(g);}
 // Continuous terrain ridges: distance supplies natural parallax, not a different world speed.
 k.box(160,.15,240,0xb3c0a4,0,-.24,0);for(const side of [-1,1]){
  k.box(3,.09,240,0x8d958b,side*3,-.1,0);for(const dx of [-.65,.65])k.box(.08,.05,240,0x777f7a,side*3+dx,-.035,0);
  for(let layer=0;layer<2;layer++){
   const vertices=[],indices=[],rows=7,columns=151,phase=side*.8+layer*1.7;
   for(let r=0;r<rows;r++)for(let j=0;j<columns;j++){
    const u=r/(rows-1),z=-400+j*4;
    const crest=12+layer*7+4*Math.sin(z*.035+phase)+2.6*Math.sin(z*.071+phase*.6)+1.1*Math.cos(z*.12+phase);
    const slope=Math.pow(Math.sin(Math.PI*u),1.15);
    vertices.push(side*(35+layer*35+u*38),-.3+crest*slope,z);
   }
   for(let r=0;r<rows-1;r++)for(let j=0;j<columns-1;j++){
    const a=r*columns+j,b=a+1,c=a+columns,d=c+1;
    indices.push(...(side>0?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
   const ridge=new T.Mesh(geometry,k.mat(layer?0xb2c5c2:0x9fb7aa));ridge.castShadow=false;ridge.receiveShadow=false;mountains.add(ridge);
  }
 }
 const layers=[];
 function layer(group,count,span,speed,builder){const parts=[];for(let i=0;i<count;i++){const g=new T.Group();group.add(g);g.userData.seed=-span/2+i*span/count;builder(g,i);parts.push(g);}layers.push({parts,span,speed});}
 layer(near,22,160,13,(g,i)=>{const side=i%2?1:-1,x=side*(6.8+(i%3)*1.8);if(i%3===0){k.box(.14,6,.14,0x87918b,x,2.5,0,g);k.box(1.8,.1,.1,0x68746d,x,5.3,0,g);k.box(.026,.026,9,0x65756c,x,5.4,4.5,g);}else{k.cyl(.15,2.5,0x958674,x,.75,0,g);const crown=new T.Mesh(new T.IcosahedronGeometry(1.2,1),k.mat(i%2?0x9aae88:0x839d83));crown.position.set(x,2.4,0);crown.scale.y=1.6;g.add(crown);}});
 layer(far,18,190,13,(g,i)=>{const x=(i%2?1:-1)*(17+i%4*2.5),h=2.5+i%3;building(g,x,h,5,0,i);});
 layer(urban,22,200,13,(g,i)=>{const x=(i%2?1:-1)*(15+i%5*2),h=7+i%5*2.5;building(g,x,h,4,0,i+2);});
 function building(g,x,h,w,z,i){k.box(w,h,4,[0xc7c9bf,0xa8b8b6,0xd8c9b7,0x9eafad][i%4],x,h/2-.15,z,g);k.box(w+.15,.16,4.15,0x839892,x,h-.07,z,g);for(let y=1;y<h-.5;y+=1.6){for(const zz of [-1,1]){const win=k.box(.02,.73,.72,0x829f9f,x-Math.sign(x)*(w/2+.012),y,zz,g);win.castShadow=false;}}}
 for(const l of layers)for(const g of l.parts)batchStatic(g,new Set(),{cellSize:30});
 return {near,far,urban,mountains,update(t){const distance=t<3?13*t*t/6:13*(t-1.5);mountains.position.z=distance;for(const l of layers)for(const g of l.parts)g.position.z=((g.userData.seed+1000+distance*l.speed/13)%l.span)-l.span/2;const blend=T.MathUtils.smoothstep(t,6.5,11.5);for(const [i,g]of urban.children.entries())g.position.z=-180+Math.floor(i/2)*10+distance;return {distance,cityBlend:blend,nearZ:near.children[0].position.z,farZ:far.children[0].position.z,mountainZ:mountains.position.z};}};
}
