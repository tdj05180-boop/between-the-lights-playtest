import {T} from '../experiments/spaces/kit.js';
import {addShopRoom,interiorGlass} from '../src/models/visible-interiors.js';

// The name is the authoritative approved sign text, not a randomly assigned shop.
export function retailType(name=''){
 const rules=[/문고|책방|문구|인쇄/,/커피|카페|찻집/,/약국/,/부동산/,/사진/,/꽃/,/안경/,/빵|베이커리/,/세탁|수선|구두|열쇠/,/분식|식당|식탁|밥집|국수|반찬|도시락|김밥/,/공방|철물|잡화|살림/,/휴대폰|통신/];
 const t=rules.findIndex(r=>r.test(name));return t<0?12:t;
}
export function drawInterior(g,t){
 const rect=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
 const line=(c,p,w=2)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const ellipse=(c,x,y,a,b)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,a,b,0,0,Math.PI*2);g.fill();};
 // One continuous room across a storefront, later cropped by each connected bay.
 rect('#b6c0b6',0,0,256,256);rect('#d4d2bc',0,0,256,39);rect('#9aa99e',0,210,256,46);
 rect('#c3c8b6',9,43,239,154);line('#a1afa2',[[0,210],[256,210]]);
 if(t===0){for(let y=82;y<202;y+=34){rect('#907f67',13,y,151,4);for(let x=17;x<159;x+=10)rect(['#9f9c7d','#6f8d85','#b4a387'][Math.floor(x/10)%3],x,y-26,7,25);}rect('#a19678',182,179,57,31);}
 if(t===1){rect('#8f967c',143,154,107,58);rect('#c9b68f',138,150,118,6);rect('#697d79',170,118,42,30);ellipse('#b69e76',59,184,34,8);line('#7b8778',[[59,185],[59,218]],4);rect('#7f9483',20,180,9,36);rect('#a2ad93',17,159,15,25);line('#878f80',[[42,37],[42,82],[73,82]],2);ellipse('#d8c6a0',59,83,20,5);}
 if(t===2){for(let y=86;y<146;y+=23){rect('#b4bda9',23,y,123,3);for(let x=27;x<141;x+=14)rect(['#d1d0b7','#9eafa4','#b0b39b'][Math.floor(x/14)%3],x,y-17,10,17);}rect('#bec7b0',10,159,220,53);rect('#e0dec4',8,155,225,6);rect('#6e8682',187,131,27,22);}
 if(t===3){rect('#aeb6a3',137,168,103,38);rect('#6f8784',179,137,28,27);for(let row=0;row<3;row++)for(let col=0;col<3;col++){rect('#d7d5bf',19+col*32,69+row*36,25,29);rect('#9baaa0',23+col*32,74+row*36,17,2);rect('#adb8aa',23+col*32,81+row*36,12,2);}}
 if(t===4){rect('#969f96',22,60,85,136);rect('#cbd0bc',28,65,73,124);rect('#a5aaa0',43,83,43,91);rect('#a0927b',154,173,84,40);rect('#77897f',189,142,19,18);}
 if(t===5){for(const [x,y] of [[34,184],[77,173],[119,190],[191,163]]){rect('#ac9a7c',x-9,y,18,25);ellipse('#6f9678',x-8,y-16,13,26);ellipse('#89a486',x+7,y-24,12,24);ellipse('#b6ae93',x,y-45,9,7);}rect('#a19a81',163,190,81,15);}
 if(t===6){for(let y=99;y<156;y+=39){rect('#adbaac',16,y,150,4);for(let x=32;x<156;x+=36){g.strokeStyle='#758b88';g.lineWidth=2;g.strokeRect(x-9,y-14,8,5);g.strokeRect(x+2,y-14,8,5);line('#758b88',[[x-1,y-12],[x+2,y-12]],1);}}rect('#a6b6ad',164,170,75,42);rect('#d3d5c1',161,167,81,5);}
 if(t===7){rect('#9c9075',9,166,235,48);rect('#93aaa7',13,132,227,31);for(let x=25;x<233;x+=30){ellipse('#bfa780',x,154,12,5);ellipse('#cbb991',x+4,143,8,4);}rect('#d8c4a0',8,164,237,5);}
 if(t===8){line('#7e938b',[[21,75],[230,75]],3);for(let x=42;x<225;x+=31){line('#829b92',[[x,75],[x-12,98],[x+12,98],[x,75]],2);rect(['#98aaa0','#b2b9ac','#8fa39f'][Math.floor(x/31)%3],x-11,99,23,66);}rect('#bbc4b4',9,175,79,38);}
 if(t===9){rect('#b2b8a2',161,123,86,91);rect('#ccc1a1',157,120,94,6);for(const x of [37,109]){rect('#ac9976',x-24,167,51,6);line('#82907c',[[x,173],[x,216]],4);rect('#929c82',x-28,179,7,29);rect('#929c82',x+25,179,7,29);}}
 if(t===10){rect('#938e72',20,169,133,39);rect('#bdad87',15,164,145,6);rect('#a9b49f',175,61,57,128);for(let y=89;y<184;y+=27){rect('#8a998b',179,y,49,3);for(let x=182;x<225;x+=17)rect('#b9b298',x,y-19,12,18);}}
 if(t===11){rect('#b2beb5',14,159,228,54);rect('#d5d9c5',10,155,235,6);for(let x=37;x<237;x+=47){rect('#718b91',x,128,11,20);rect('#a1b2af',x+2,130,7,14);}rect('#9cafa9',105,63,88,39);}
 if(t===12){rect('#a9b3a2',152,155,84,56);rect('#bbb9a0',147,151,94,6);rect('#a3b6aa',28,77,67,89);}
 if(t===13){rect('#98aaa1',52,163,151,7);rect('#829995',83,134,26,24);rect('#bdc6b6',0,0,256,58);}
 if(t===14){rect('#b0c0bb',0,0,256,256);for(let y=4;y<235;y+=13)rect('#cbd2c3',0,y,256,7);}
 if(t===15){rect('#9cbbbF',0,0,256,256);const grad=g.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#b9d0d3');grad.addColorStop(.6,'#a1b8b7');grad.addColorStop(1,'#8daaa9');g.fillStyle=grad;g.fillRect(0,0,256,256);}
 // Privacy differs by business, instead of exposing every room like a display case.
 const privateShop=[3,4,8,12].includes(t),sky=g.createLinearGradient(0,0,65,256);
 sky.addColorStop(0,'#c3dce0a0');sky.addColorStop(.52,privateShop?'#c9d8ce80':'#c9d8ce40');sky.addColorStop(1,privateShop?'#a4bfbb72':'#a4bfbb38');g.fillStyle=sky;g.fillRect(0,0,256,256);
 if(privateShop)rect('#c6d1c183',0,142,256,114);
 g.fillStyle='#e7f0e420';g.beginPath();g.moveTo(26,0);g.lineTo(50,0);g.lineTo(188,256);g.lineTo(164,256);g.fill();
}

const designs=[
 // door side, window sill, display fraction, sign fraction, sign height, awning, shutter
 [-1,.55,.82,.79,.43,0,0], [1,.38,.94,.61,.43,1,0], [1,.67,.93,.93,.50,0,0],
 [-1,.85,.72,.79,.43,0,0], [1,.95,.63,.56,.38,0,.15], [-1,.32,.95,.65,.43,1,0],
 [0,.64,.86,.70,.37,0,0], [1,.56,.94,.84,.44,1,0], [-1,.89,.68,.75,.43,0,.20],
 [1,.78,.82,.88,.50,1,0], [-1,.76,.76,.68,.43,0,.16], [0,.66,.90,.85,.38,0,0],
 [1,.82,.74,.65,.43,0,0]
];

export function buildRetailFront(k,root,record,sign,mat,glass,glassGeometry){
 const {w,d,x,z}=record,t=retailType(sign.name),cfg=designs[t],face=z<0?1:-1;
 const [doorSide,sill,glassRatio,signRatio,signHeight,awning,shutter]=cfg;
 const ry=face<0?Math.PI:0,frame=mat([0x697c73,0x766f5d,0x85968c,0x697e82][t%4],'metal');
 const front=new T.Group();root.add(front);front.position.z=face*d/2;front.rotation.y=ry;
 const block=(ww,hh,dd,m,u,y,o)=>{const n=new T.Mesh(new T.BoxGeometry(ww,hh,dd),m);n.position.set(u,y,o);n.receiveShadow=true;front.add(n);return n;};
 const finish=mat(t===0||t===1||t===7?0xb7a98c:0xc5cbbd,'plaster');
 const usable=w-.44,doorW=1.04,doorX=doorSide*(usable/2-doorW/2-.18),base=.21,top=2.70;
 block(usable,.13,.56,finish,0,base,-.14);block(usable,.20,.56,finish,0,top,-.14);
 // A single room coordinate system is cropped by every opening on BOTH axes.
 // The composite is the visible glazing surface; its room drawing is not a
 // second glass pane. Slim joinery intersects this surface instead of floating.
 const glassZ=-.055,roomBottom=base,roomTop=top-.09;
 const pane=(a,b,door=false)=>{
  if(b-a<.15)return;const width=b-a,u=(a+b)/2,low=door?base+.06:sill,high=top-.09;
  const g=new T.PlaneGeometry(width,high-low);
  const n=new T.Mesh(g,interiorGlass());n.name=door?'RetailDoorGlass':'RetailWindowGlass';n.position.set(u,(low+high)/2,glassZ);front.add(n);n.receiveShadow=false;
  if(low>base+.08)block(width,low-base,.45,finish,u,(low+base)/2,-.13);
  // Match the restrained 9–9.5 cm sash / 16 cm depth of the destination entry.
  for(const e of [a,b])block(.095,high-base+.12,.16,frame,e,(high+base)/2,glassZ);
  block(width,.09,.16,frame,u,low,glassZ);block(width,.09,.16,frame,u,high,glassZ);
  if(door){
   const metal=mat(0xc2c8bb,'metal'),hx=u+width*.31;
   block(.028,.38,.024,metal,hx,1.36,.017).name='RetailDoorHandle';
   for(const y of [1.20,1.52])block(.033,.027,.064,metal,hx,y,-.022).name='RetailHandleMount';
   block(width,.045,.06,frame,u,.76,glassZ);
  }else if(width>2.3)block(.032,high-low,.06,frame,u,(low+high)/2,glassZ);
 };
 const room=addShopRoom(front,{width:usable,height:top-base-.09,depth:2.62,floor:base,doorX,type:t,variant:Math.abs(Math.round(x/8.2)),era:2019,name:sign.name});
 room.position.z=glassZ-.045;
 const dl=doorX-doorW/2,dr=doorX+doorW/2;
 pane(dl,dr,true);
 for(const [a,b] of [[-usable/2,dl],[dr,usable/2]]){
  const width=b-a;if(width<.2)continue;
  const opaque=width*(1-glassRatio),outer=a<dl?a:b-opaque;
  if(opaque>.10)block(opaque,top-base,.49,finish,outer+opaque/2,(base+top)/2,-.12);
  pane(a<dl?a+opaque:a,a<dl?b:b-opaque);
 }
 if(shutter){
  const sw=usable*shutter,sx=-doorSide*(usable/2-sw/2);
  block(sw,2.34,.10,mat(0x98a79c,'metal'),sx,1.44,.085);
  for(let y=.34;y<2.57;y+=.115)block(sw,.022,.018,mat(0x7e9288,'metal'),sx,y,.145);
  block(sw+.10,.14,.19,frame,sx,2.64,.12);
 }
 const signWidth=usable*signRatio,signY=2.98,color=parseInt(sign.color,16);
 block(signWidth+.09,signHeight+.08,.15,frame,0,signY,.17);
 block(signWidth,signHeight,.04,mat(color,'plaster'),0,signY,.268);
 if(awning){
  const aw=usable*(t===1?.72:t===5?.64:.98),col=mat(color,'plaster');
  const cloth=block(aw,.065,.71,col,0,3.34,.36);cloth.rotation.x=.09;
  block(aw,.15,.045,col,0,3.225,.72);
  if(t===7||t===9)for(let u=-aw/2+.24;u<aw/2;u+=.47)block(.13,.15,.008,mat(0xd7cfb7,'plaster'),u,3.225,.746);
 }else{block(1.48,.08,.46,frame,doorX,2.79,.26);}
 return {name:sign.name,trade:t,x,z,doorX,glassRatio,shutter:!!shutter,awning:!!awning,signWidth,signHeight,signY};
}
