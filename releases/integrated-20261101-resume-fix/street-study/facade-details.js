import {openNeighbourInterior} from './interior-depth.js';
import * as T from '../src/vendor/three.module.min.js';
import {retailType} from '../seoul-study/retail-fronts.js';

// Building-local joinery. All measurements are metres; placements and footprints
// belong to the original neighbourhood generators, not this visual layer.
export function neighbourhoodWindow(parent,box,x,y,z,w=1.1,h=1.25,rot=0){
 const p=new T.Group();p.position.set(x,y,z);p.rotation.y=rot;parent.add(p);
 const trim=0xe9dfc8,frame=0x75867c;
 box(p,w+.14,h+.14,.075,trim,0,0,0);
 const glass=box(p,w,h,.028,0x779791,0,0,.044);glass.name='2003-upper-glazing';
 for(const s of [-1,1])box(p,.055,h+.08,.095,frame,s*(w/2+.012),0,.043);
 for(const s of [-1,1])box(p,w+.08,.055,.095,frame,0,s*(h/2+.012),.043);
 box(p,.034,h,.058,frame,0,0,.058);
 box(p,w+.24,.075,.20,trim,0,-h/2-.076,.045);
 // A narrow head drip projects just beyond the sash, not a heavy picture frame.
 box(p,w+.20,.045,.16,trim,0,h/2+.068,.035);
 return p;
}

export function neighbourhoodShop(parent,box,b,index=0){
 const type=b.sign?retailType(b.sign):[9,8,0,12,10][Math.abs(index)%5];
 const width=b.w-.78,front=b.d/2,base=.22,top=2.36,doorW=.94;
 const doorSide=[0,8,10].includes(type)?-1:1,doorX=doorSide*(width/2-doorW/2),left=-width/2,right=width/2;
 const sill=type===9?.52:type===0?.58:type===8?.82:type===4?.85:.70;
 const frame=[0x71817b,0x817462,0x6d827b][type%3],p=new T.Group();p.name='2003-neighbour-shop';p.position.z=front;parent.add(p);
 const part=(w,h,d,c,x,y,z=.12)=>box(p,w,h,d,c,x,y,z);
 const pane=(a,c,door=false)=>{
  const lo=door?base+.035:sill,hi=top-.05;
  const glass=part(c-a-.04,hi-lo,.025,0x779791,(a+c)/2,(hi+lo)/2,.113);
  glass.name='2003-connected-neighbour-glass';glass.userData.streetGlazing={tile:type,a:(a-left)/width,b:(c-left)/width,bottom:(lo-base)/(top-base),top:(hi-base)/(top-base)};
  for(const edge of [a,c])part(.067,top-base,.105,frame,edge,(top+base)/2);
  for(const yy of [lo,hi])part(c-a,.058,.105,frame,(a+c)/2,yy);
  if(!door)part(c-a,lo-base,.095,b.c,(a+c)/2,(lo+base)/2,.074);
  if(door){const hx=(a+c)/2-doorSide*.26;part(.025,.31,.024,0xb4b3a0,hx,1.13,.188);for(const yy of [.997,1.263])part(.030,.026,.062,0xb4b3a0,hx,yy,.163);part(c-a,.05,.075,frame,(a+c)/2,.66);}
 };
 const da=doorX-doorW/2,db=doorX+doorW/2;
 if(da-left>.1)pane(left,da);pane(da,db,true);if(right-db>.1)pane(db,right);
 part(width+.12,.085,.15,frame,0,top,.10);part(width+.16,.07,.31,0xc3baa7,0,.18,.085);
 if([9,0].includes(type)){
  const displayWidth=width-doorW,cx=-doorSide*doorW/2;
  // One shop, one connected room. The display division does not restart its UV.
  if(displayWidth>3)part(.038,top-sill,.075,frame,cx,(top+sill)/2);
 }
 if([9,1].includes(type)){
  const aw=part(width,.085,.62,type===9?0xa68e79:0x8a9b7d,0,2.44,.30);aw.rotation.x=.12;
  for(const s of [-1,1]){part(.035,.23,.055,frame,s*(width/2-.06),2.31,.13);part(.035,.05,.42,frame,s*(width/2-.06),2.23,.30);}
 }else if([8,10].includes(type)){
  // A short raised shutter/header is plausible for a workshop or laundry.
  part(width+.09,.14,.18,frame,0,2.42,.12);
  for(let j=0;j<3;j++)part(width,.014,.016,0xa6aba1,0,2.37+j*.035,.215);
 }
 openNeighbourInterior(parent,b,p,type,doorX);
 return {type,doorX,doorW,sill};
}
