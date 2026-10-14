import {T} from '../experiments/spaces/kit.js';
import {bevelBox} from '../src/models/pastel-shapes.js';

// Train-owned reusable seat geometry; the seat anchors and occupied envelopes stay fixed.
export function cabinDetails(k,room){
 const cache=new Map();
 function rounded(w,h,d,r,c,x,y,z,parent){
  const key=[w,h,d,r].join('/');if(!cache.has(key)){
   // Rounded upholstery outline rather than a single flat chamfer on every edge.
   const rr=Math.min(r,w*.3,h*.3),b=Math.min(rr*.35,d*.22),hw=w/2-b,hh=h/2-b,q=Math.min(rr,hw,hh),s=new T.Shape();
   s.moveTo(-hw+q,-hh);s.lineTo(hw-q,-hh);s.quadraticCurveTo(hw,-hh,hw,-hh+q);s.lineTo(hw,hh-q);s.quadraticCurveTo(hw,hh,hw-q,hh);s.lineTo(-hw+q,hh);s.quadraticCurveTo(-hw,hh,-hw,hh-q);s.lineTo(-hw,-hh+q);s.quadraticCurveTo(-hw,-hh,-hw+q,-hh);s.closePath();
   const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:4,steps:1});g.translate(0,0,-d/2+b);g.clearGroups();cache.set(key,g);
  }
  const m=new T.Mesh(cache.get(key),k.mat(c));m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;
 }
 function seat(x,z){
  const s=new T.Group();s.position.set(x,0,z);room.add(s);
  rounded(.54,.16,.55,.045,0x718f9e,0,.52,.02,s);
  rounded(.46,.035,.43,.015,0x819ca8,0,.588,.045,s);
  const back=rounded(.54,.83,.14,.045,0x607f8e,0,.98,-.28,s);back.rotation.x=-.08;
  const cushion=rounded(.44,.64,.075,.03,0x809ba8,0,.98,-.18,s);cushion.rotation.x=-.08;
  rounded(.42,.13,.14,.035,0x718f9e,0,1.31,-.23,s);
  // Headrest cover is a thin textile, not the old large solid cream block.
  rounded(.31,.14,.014,.006,0xdfe0d1,0,1.295,-.148,s);
  // Fine inset seams stay on the upholstery surface, never floating as rods.
  for(const x of [-.17,.17]){const seam=k.box(.003,.43,.003,0x748d98,x,.98+Math.sin(.08)*.039,-.18+Math.cos(.08)*.039,s);seam.rotation.x=-.08;}
  k.box(.40,.055,.40,0x6e817f,0,.402,.015,s);
  for(const dx of [-.17,.17]){k.box(.055,.21,.30,0x899791,dx,.285,-.03,s);k.box(.10,.045,.41,0x667b78,dx,.205,0,s);}
  for(const side of [-1,1]){
   rounded(.075,.055,.43,.021,0x687f80,side*.28,.755,.02,s);
   k.box(.031,.22,.032,0xaab8ac,side*.28,.63,-.11,s);
   k.box(.04,.065,.24,0x899d95,side*.26,.49,-.015,s);
  }
  // Rear tray and magazine pouch have their own thickness and hinge.
  rounded(.35,.28,.036,.015,0xa6b5ae,0,.97,-.383,s);
  k.box(.29,.018,.012,0xd0d6c8,0,1.065,-.406,s);
  for(const x of [-.15,.15])k.box(.04,.045,.035,0x758b87,x,.85,-.40,s);
  rounded(.34,.14,.045,.012,0x78908d,0,.68,-.367,s);
  k.box(.27,.016,.014,0xb6c3b6,0,.744,-.395,s);
 }
 function finish(){
  for(const side of [-1,1]){
   k.box(.045,.10,15.8,0xb2bdaf,side*1.775,.30,0,room);
   for(let i=0;i<10;i++){
    const z=-7.1+i*1.57;
    for(const dz of [-.706,.706])k.box(.11,1.11,.027,0x7d9290,side*1.817,1.665,z+dz,room);
    for(const y of [1.112,2.205])k.box(.11,.028,1.42,0x7d9290,side*1.817,y,z,room);
    // Narrow blind cassette and deep sill, keeping the entire glazing clear.
    rounded(.14,.075,1.40,.02,0xd1d5c7,side*1.755,2.254,z,room);
   }
   for(let z=-6.8;z<7;z+=2.5){
    const support=k.box(.38,.035,.04,0x9cac9f,side*1.52,2.54,z,room);support.rotation.z=side*.37;
    for(const dz of [.11,.46])k.box(.358,.217,.022,0x657c78,side*1.60,2.512,z+dz,room);
    k.box(.14,.025,.04,0xc5ccba,side*1.60,2.64,z+.3,room);
   }
   for(const x of [1.43,1.57,1.70])k.box(.026,.04,15.6,0xb9c5b8,side*x,2.395,0,room);
  }
  for(let z=-7;z<=7;z+=1.6){
   k.box(1.17,.018,.018,0xc6cbbb,0,2.786,z,room);
   for(const side of [-1,1])for(let j=0;j<4;j++)k.box(.014,.016,.40,0xaebbb1,side*(.91+j*.055),2.79,z,room);
  }
  for(const z of [-7.91,7.91]){
   for(const x of [-.635,.635])k.box(.06,2.34,.055,0xe0e2d3,x,1.33,z,room);
   k.box(1.32,.07,.065,0xb5c2b7,0,2.52,z,room);
   k.box(1.32,.032,.14,0x9baaa1,0,.218,z,room);
   k.box(.15,.12,.018,0x607e75,.91,1.63,z-Math.sign(z)*.075,room);
  }
 }
 return {seat,finish};
}
