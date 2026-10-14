import {T} from '../experiments/spaces/kit.js';
import {shopSigns} from './shop-signs.js';
import {backgroundBuildings} from './background-buildings.js';

// Seoul scenery only. Adapted from agency-study/night-city.js: four-sided facade
// transforms, floor bands, recessed glazing, corner piers, roof parapets and podiums.
// Daylight standard materials, no night glow or new lights. Batched by the existing kit.
export function dayBuildings(k){
 const geo=new T.BoxGeometry(1,1,1),records=[],signs=shopSigns(k);
 const walls=[0xc8c4b6,0xb0bdbe,0xb7b5ac,0xa9b5b7],glass=[0x64858d,0x728e92,0x819899],trim=[0xe0ddd0,0xcbd0c8,0xc9c5b9,0xd5d9d0];
 const backdrop=backgroundBuildings(k,{geo,records,signs,walls,glass,trim});

 function make(x,z,index,background=false,options={}){
  if(background)return backdrop(x,z,index,options);
  const w=options.w??(background?9:6.8),d=options.d??7,h=options.h??(background?12+(index%5)*3.1:10+(index%4)*3.2),style=index%4,base=.15;
  const root=new T.Group();root.position.set(x,0,z);k.world.add(root);const frames=trim[style],body=walls[style];
  const b=(ww,hh,dd,c,xx,yy,zz,ry=0)=>{const n=new T.Mesh(geo,k.mat(c));n.scale.set(ww,hh,dd);n.position.set(xx,yy,zz);n.rotation.y=ry;n.castShadow=!background;n.receiveShadow=true;root.add(n);return n;};
  b(w,h,d,body,0,base+h/2,0);b(w+.24,.22,d+.24,frames,0,3.24,0);b(w+.28,.22,d+.28,frames,0,base+h+.10,0);
  // Stepped roof housing and open parapets, never an oversized single roof box.
  b(w*.44,style===1?1.8:.9,d*.43,body,w*.12,base+h+(style===1?.9:.45)+.22,-.35);
  b(w*.48,.13,d*.47,frames,w*.12,base+h+(style===1?1.8:.9)+.24,-.35);
  for(const side of [-1,1]){b(w-.12,.35,.12,frames,0,base+h+.36,side*(d/2-.08));b(.12,.35,d-.12,frames,side*(w/2-.08),base+h+.36,0);}
  if(!background){b(.85,.5,.7,0x89958f,-w*.28,base+h+.47,.3);for(let j=0;j<4;j++)b(.68,.025,.07,0x657779,-w*.28,base+h+.73,.04+j*.16);}
  const floors=Math.max(2,Math.floor((h-3.5)/2.7)),step=(h-3.6)/floors;
  for(let side=0;side<4;side++){
   const ry=side*Math.PI/2,span=side%2?d:w,depth=side%2?w:d;
   const fb=(ww,hh,dd,c,u,y,o=0)=>b(ww,hh,dd,c,Math.cos(ry)*u+Math.sin(ry)*(depth/2+o),y,-Math.sin(ry)*u+Math.cos(ry)*(depth/2+o),ry);
   const cols=Math.max(2,Math.floor(span/2.1)),pitch=(span-.8)/cols;
   if(style===1)fb(span-.6,h-3.7,.07,glass[1],0,3.4+(h-3.7)/2,.038);
   for(let row=0;row<floors;row++){
    const yy=3.7+step*(row+.48);
    fb(span+.10,.14,.17,frames,0,yy-step*.46,.05);
    if(background){fb(span-.65,step*.56,.075,glass[(row+index)%3],0,yy,.06);continue;}
    for(let col=0;col<cols;col++){
     const u=-span/2+.4+pitch*(col+.5),ww=pitch*(style===2?.70:.88),hh=step*.62;
     fb(ww+.17,hh+.17,.16,frames,u,yy,.08);fb(ww,hh,.035,glass[(row+col+index)%3],u,yy,.175);
     fb(.045,hh,.08,frames,u,yy,.205);fb(ww+.25,.08,.32,frames,u,yy-hh/2-.10,.13);
     if((col+row+index)%5===0)fb(ww,.18,.018,0xb4c1bd,u,yy+hh/2-.11,.198);
    }
   }
   for(const sign of [-1,1])fb(.22,h-3,.24,frames,sign*(span/2-.13),(h+3)/2,.06);
   if(style===1&&!background)for(let c=1;c<cols;c++)fb(.09,h-3.4,.25,frames,-span/2+.4+pitch*c,(h+3.4)/2,.16);
   // Street frontage: glass bays sit within thick piers; separate framed entrance.
   const front=side===(z<0?0:2);
   if(front&&!background){
    for(const u of [-span*.29,span*.29]){fb(span*.31,2.1,.12,0x405d65,u,1.5,.075);fb(span*.28,1.90,.035,0x829c9d,u,1.53,.15);fb(span*.31,.08,.2,frames,u,.44,.10);fb(.055,1.92,.07,frames,u,1.53,.19);}
    fb(1.12,2.43,.15,0x455d61,0,1.40,.08);fb(.92,2.21,.035,0x6f8c8e,0,1.41,.17);fb(.035,.40,.09,frames,.31,1.36,.23);fb(1.28,.08,.32,frames,0,.20,.11);
    signs.add(x,z,d,Math.round(x/8.2)+3+(z>0?7:0));
    const canopy=style===1?2.0:span-.32;
    fb(canopy,.10,.70,[0x7d9588,0xa38b74,0x6e8794,0x93867e][style],0,3.40,.34);
    fb(canopy,.18,.05,[0x7d9588,0xa38b74,0x6e8794,0x93867e][style],0,3.31,.68);
   }else{
    fb(span-.75,1.70,.08,glass[index%3],0,1.55,.05);if(!background)fb(.08,1.75,.12,frames,0,1.55,.10);
   }
  }
  root.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(root,true);
  records.push({x,z,w,d,h,style,background,min:bb.min.toArray(),max:bb.max.toArray()});
  if(!background)k.block(x,z,w,d,h);
 }
 return {make,records,signs};
}

