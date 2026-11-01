import {P,T} from './geometry.js';
import {addWarehouseOfficeFurniture} from './office-furniture.js';
import {addOfficeDoorNotice,addOfficeFileShelf,addOfficeExtinguisher} from './office-details.js';
// Segmented walls with genuine openings. Interior is visual-only, never an extra quest area.
export function buildOffice(k,block){
 const g=k.group(),x=19.5,z=10.7,w=4.4,d=8,bottom=1.1,top=2.8,h=3.35;
 const wall=(a,b,c,px,py,pz)=>k.box(a,b,c,P.wallLight,px,py,pz,g,.015);
 wall(.16,h,d,21.7,h/2+.11,z);wall(w,h,.16,x,h/2+.11,6.7);wall(w,h,.16,x,h/2+.11,14.7);
 // West wall: 2 real windows and a framed glazed door near the pedestrian lane.
 wall(.16,bottom,5.8,17.3,bottom/2+.11,9.6);wall(.16,h-top,8,17.3,(h+top)/2+.11,z);
 // Close the missing lower return beside the door, without changing its opening.
 wall(.16,bottom,.7,17.3,bottom/2+.11,14.35);
 for(const [cz,depth] of [[6.95,.5],[9.625,.45],[12.275,.45],[14.35,.7]])wall(.16,top-bottom,depth,17.3,(bottom+top)/2+.11,cz);
 const glass=new T.MeshStandardMaterial({color:0xc7e3dc,transparent:true,opacity:.12,roughness:.32,depthWrite:false,side:T.DoubleSide});
 for(const cz of [8.3,10.95]){for(const edge of [cz-1.1,cz+1.1])k.box(.23,1.85,.085,P.frame,17.3,2.06,edge,g);for(const y of [1.21,2.91])k.box(.27,.095,2.28,P.frame,17.3,y,cz,g);k.box(.36,.09,2.4,P.wallLight,17.3,1.14,cz,g);k.box(.2,1.64,.045,P.frame,17.3,2.06,cz,g);const p=k.box(.012,1.62,2.13,glass,17.3,2.06,cz,g,.001);p.castShadow=p.receiveShadow=false;}
 // Door opening z=12.5..14.0, frame, translucent leaf, handle and threshold.
 for(const pz of [12.5,14])k.box(.23,2.8,.1,P.frame,17.3,1.51,pz,g);k.box(.23,.12,1.6,P.frame,17.3,2.92,13.25,g);
 k.box(.11,.7,1.36,P.frame,17.3,.49,13.25,g);const door=k.box(.016,1.95,1.32,glass,17.3,1.84,13.25,g,.001);door.castShadow=false;k.box(.19,.035,.22,P.steel,17.17,1.16,12.7,g);k.box(.42,.04,1.7,P.steel,17.3,.13,13.25,g);
 // Glazing beads join the retained pane to the jambs, lower panel and lintel.
 for(const pz of [12.575,13.925])k.box(.06,2.06,.07,P.frame,17.3,1.85,pz,g,.008);
 for(const y of [.85,2.835])k.box(.06,.07,1.4,P.frame,17.3,y,13.25,g,.008);
 k.box(4.3,.03,7.9,0xd8cfb4,x,.135,z,g);k.box(4.7,.2,8.3,P.frame,x,3.57,z,g);
 // Thin perimeter closure seals the former 1 cm wall-to-roof seam.
 for(const px of [17.3,21.7])wall(.16,.03,8,px,3.465,z);
 for(const pz of [6.7,14.7])wall(w,.03,.16,x,3.465,pz);
 addOfficeDoorNotice(k,g);
 // Two modest workstations face the windows; the glazed doorway stays clear.
 addWarehouseOfficeFurniture(k,g);
 addOfficeFileShelf(k,g);
 addOfficeExtinguisher(k,g);
 const lamp=new T.MeshStandardMaterial({color:0xfff2d9,emissive:0xffe9c2,emissiveIntensity:.7});k.box(1.7,.06,.5,lamp,x,3.42,z,g);
 block(x,z,4.6,8.3,3.7);return {windowRays:[{x:17.3,y:2,z:8.7},{x:17.3,y:2,z:11.25}],interior:{minX:17.4,maxX:21.6}};
}
