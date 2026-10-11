// Stage 3 scenery only. Existing roads, 72 buildings and traffic are immutable.
// Footprints include the small podium/roof overhang; C1's -6..12 corridor stays open.
export const depthBuildings = [
 ['M01',-15,-103,12,8,17,0], ['M02',-13,-118,10,15,24,1],
 ['M03',-11.5,-140,6,12,29,2], ['M04',18,-130,8,12,27,0],
 ['M05',18,-144,8,7,22,1], ['M06',-42,-120,12,8,23,2],
 ['M07',-69,-125,10,10,21,0], ['M08',43,-124,9,11,25,1],
 ['M09',68,-118,12,11,28,2], ['M10',84,-137,10,15,24,0],
 ['M11',-110,-143,10,8,22,1], ['M12',110,-111,12,13,26,2],
 ['M13',137,-118,12,17,31,0], ['M14',-146,-125,12,17,28,1],
 // North of A3: staggered, sparse volumes; no facade detail beyond the fog range.
 ['F01',-15,-171,13,14,35,0], ['F02',23,-173,16,16,38,1],
 ['F03',-40,-175,18,14,30,2], ['F04',51,-173,15,14,32,0],
 ['F05',-69,-173,14,14,37,1], ['F06',80,-175,17,15,34,2],
].map(([id,x,z,w,d,h,style])=>({id,x,z,w,d,h,style,far:id[0]==='F'}));

// Emit shared unit boxes and planes, with full depth and four finished sides.
// Dark glass is one strip per floor, lit bays are sparse; no stacked unlit windows,
// window frames, roof equipment, textures, shadows, lights or camera-facing billboards.
export function depthBuildingParts(m,ground=-11.8){
 const {x,z,w,d,h,style,far,id}=m,parts=[],seed=Number(id.slice(1));
 const bodies=far?[0x39485c,0x3c4b5e,0x3a4959]:[0x465968,0x52616d,0x59626b];
 const body=bodies[style],frame=far?0x4a5768:0x687681,glass=far?0x304052:0x293f50;
 const warm=far?[0x6a716e,0x74786e]:[0x9e997e,0xb5a786,0x879b9b];
 const box=(w,h,d,c,x,y,z,ry=0)=>parts.push({id,w,h,d,c,x,y,z,ry,glow:false});
 const pane=(w,h,c,x,y,z,ry=0)=>parts.push({id,w,h,d:0,c,x,y,z,ry,glow:true});
 const rand=(a,b)=>{const v=Math.sin(seed*19.71+a*37.3+b*113.1)*43758.54;return v-Math.floor(v);};
 box(w,h,d,body,x,ground+h/2,z);
 box(w+.4,2.7,d+.4,far?body:0x405360,x,ground+1.35,z);
 box(w+.4,.24,d+.4,frame,x,ground+h+.12,z);
 const rh=style===1?2.8:1.4;
 box(w*(style===2?.35:.62),rh,d*.58,body,x+w*.07,ground+h+rh/2+.24,z-.25);
 if(!far)box(w+.4,.22,d+.4,frame,x,ground+2.8,z);
 for(let side=0;side<4;side++){
  const ry=side*Math.PI/2,span=side%2?d:w,depth=side%2?w:d;
  const p=(u,y,o)=>[x+Math.cos(ry)*u+Math.sin(ry)*(depth/2+o),y,z-Math.sin(ry)*u+Math.cos(ry)*(depth/2+o)];
  // At distant depth only a few dim bays on the southern/east/west elevations.
  // Rear mass remains complete; no unseen far-north light geometry.
  if(far){if(side===2)continue;for(let row=0;row<3;row++)for(let col=0;col<3;col++)if(rand(row+side*5,col)>.55)pane(span*.11,.8,warm[(row+col)%2],...p((col-1)*span*.26,ground+7+row*(h-10)/3,.02),ry);continue;}
  const floors=Math.floor((h-3)/3),cols=Math.max(2,Math.floor(span/2.8)),pitch=(span-.8)/cols;
  for(let row=0;row<floors;row++){
   const yy=ground+4.2+row*3;
   box(span-.5,1.65,.035,glass,...p(0,yy,.022),ry);
   if(style===0&&row%2===0)box(span+.2,.13,.10,frame,...p(0,yy-1.2,.05),ry);
   for(let col=0;col<cols;col++)if(rand(row+side*9,col)>.48)
    pane(pitch*(style===2?.57:.79),1.15,warm[(row+col+side)%3],...p((col-(cols-1)/2)*pitch,yy,.045),ry);
  }
  // Small ground-floor lobby reads as a street frontage without separate signage.
  box(span*.64,1.8,.04,glass,...p(0,ground+1.35,.025),ry);
  pane(1.1,1.55,0x667d80,...p(0,ground+1.25,.048),ry);
  if(style===1)for(const u of [-span*.38,span*.38])box(.12,h-3,.09,frame,...p(u,ground+(h+3)/2,.05),ry);
 }
 return parts;
}

