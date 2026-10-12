import {T} from '../experiments/spaces/kit.js';

// Seoul's non-playable parcels only. Reuse the approved daytime palette and
// facade proportions; no colliders, lighting, gameplay objects or tree changes.
const shops=[
 ['골목분식',0],['작은밥집',1],['뜰안커피',2],['이웃부동산',3],
 ['반듯세탁',3],['종이문구',4],['소소잡화',4],['동네휴대폰',3],
 ['온기국수',0],['아침빵집',4],['정갈반찬',1],['느린찻집',2],
 ['마루수선',4],['나무꽃방',2],['바른안경',3],['한끼식당',1],
 ['오후사진',3],['알뜰철물',4],['창가미용실',0],['다락책방',2],
 ['맑은세탁',3],['햇살도시락',1],['길목김밥',0],['작은열쇠',4],
 ['마을인쇄',3],['살림가게',4],['푸른수선',2],['담소커피',2],
 ['고운옷방',0],['소금식당',1],['채움문구',4],['이음통신',3],
 ['다정반찬',1],['옆집공방',4],['정원꽃집',2],['모래사진관',3],
 ['찬찬분식',0],['골목구두',4]
];
const signColors=[0xa17a69,0x987768,0x60796c,0x718790,0xb3a180];

export function backgroundBuildings(k,{geo,records,signs,walls,glass,trim}){
 let serial=0;
 return function make(x,z,index,options={}){
  const slot=serial++,variant=(index+(x<0?2:0)+(z>0?3:0)+Math.round(Math.abs(z)))%6;
  const w=(options.w??9)-[.35,.7,1.05][variant%3],d=options.d??7;
  const h=(options.h??(12+(index%5)*3.1))-[0,.6,.3,1.1,.4,.8][variant];
  const style=(index+(z>0?1:0))%4,body=walls[style],frames=trim[style],base=.15;
  const root=new T.Group();root.name='SeoulBackgroundBuilding';root.position.set(x,0,z);k.world.add(root);
  const b=(ww,hh,dd,c,xx,yy,zz,ry=0)=>{
   const m=new T.Mesh(geo,k.mat(c));m.scale.set(ww,hh,dd);m.position.set(xx,yy,zz);m.rotation.y=ry;
   m.castShadow=false;m.receiveShadow=true;root.add(m);return m;
  };
  b(w,h,d,body,0,base+h/2,0);
  b(w+.12,.20,d+.12,frames,0,3.24,0);b(w+.20,.18,d+.20,frames,0,base+h+.10,0);
  for(const side of [-1,1]){
   b(w-.08,.30,.10,frames,0,base+h+.31,side*(d/2-.06));
   b(.10,.30,d-.08,frames,side*(w/2-.06),base+h+.31,0);
  }
  // The established stepped roof silhouette stays modest and varies by parcel.
  if(variant!==2){
   const rw=w*(variant===4?.37:.46),rh=variant===1?1.35:.8,rx=(variant%2?-.12:.12)*w;
   b(rw,rh,d*.40,body,rx,base+h+rh/2+.2,-.25);
   b(rw+.14,.12,d*.44,frames,rx,base+h+rh+.24,-.25);
  }
  const floors=Math.max(2,Math.floor((h-3.5)/2.7)),step=(h-3.6)/floors;
  const [shop,trade]=shops[slot],signColor=signColors[trade];
  for(let side=0;side<4;side++){
   const ry=side*Math.PI/2,span=side%2?d:w,depth=side%2?w:d,front=side===(z<0?0:2);
   const fb=(ww,hh,dd,c,u,y,o=0)=>b(ww,hh,dd,c,Math.cos(ry)*u+Math.sin(ry)*(depth/2+o),y,-Math.sin(ry)*u+Math.cos(ry)*(depth/2+o),ry);
   const cols=variant===2?3:Math.max(2,Math.floor((span-.65)/(variant===4?2.5:2.05))),pitch=(span-.8)/cols;
   for(let row=0;row<floors;row++){
    const yy=3.7+step*(row+.48),hh=step*(variant===2?.68:.60);
    if(variant!==2&&variant!==4)fb(span+.06,.12,.13,frames,0,yy-step*.46,.03);
    for(let col=0;col<cols;col++){
     const u=-span/2+.4+pitch*(col+.5),ww=pitch*(variant===2?.62:variant===1?.84:.74);
     fb(ww+.13,hh+.13,.12,frames,u,yy,.065);
     fb(ww,hh,.028,glass[(style+(row%3===0?1:0))%3],u,yy,.137);
     if(variant===1||variant===5)fb(.045,hh,.045,frames,u,yy,.172);
     if(front&&variant%2===0)fb(ww+.16,.06,.21,frames,u,yy-hh/2-.10,.075);
    }
   }
   for(const sign of [-1,1])fb(.18,h-3,.18,frames,sign*(span/2-.13),(h+3)/2,.015);
   if(front){
    // Three framed bays: alternate the door bay rather than repeat a center door.
    const bays=[-span*.30,0,span*.30],doorBay=[1,0,2,1,2,0][variant],bayWidth=span*.265;
    for(let bay=0;bay<3;bay++){
     const u=bays[bay],door=bay===doorBay,ww=door?1.12:bayWidth;
     fb(ww+.14,2.37,.13,0x455d61,u,1.43,.075);
     fb(ww-.05,2.14,.028,0x829c9d,u,1.45,.158);
     if(door){fb(.035,.39,.07,frames,u+.32,1.34,.212);fb(1.30,.07,.27,frames,u,.195,.09);}
     else{fb(.045,2.15,.055,frames,u,1.45,.186);fb(ww,.075,.18,frames,u,.36,.07);}
    }
    const signWidth=Math.min(span-.55,trade===2?4.5:trade===3?5.2:5.8),signHeight=trade===3?.40:.50,signY=2.98;
    fb(signWidth,signHeight,.16,0x526568,0,signY,.19);
    fb(signWidth-.12,signHeight-.09,.035,signColor,0,signY,.29);
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
    const g=canvas.getContext('2d');g.fillStyle=trade===4?'#435b5a':'#eee6d1';g.font='600 56px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(shop,256,49,460);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const lettering=new T.Mesh(new T.PlaneGeometry(Math.min(signWidth-.35,3.8),.38),new T.MeshStandardMaterial({map,transparent:true,alphaTest:.1,roughness:.86}));
    lettering.position.set(Math.sin(ry)*(depth/2+.318),signY,Math.cos(ry)*(depth/2+.318));lettering.rotation.y=ry;root.add(lettering);
    if(trade===0||trade===1||trade===2){
     const awningWidth=trade===2?Math.min(span-.4,4.9):span-.4;
     fb(awningWidth,.09,.58,signColor,0,3.40,.27);fb(awningWidth,.14,.035,signColor,0,3.31,.57);
    }
    signs.records.push({name:shop,slot,kind:trade===3?'slim':trade===2?'wood':'frame',background:true,x,z,color:signColor.toString(16)});
   }else{
    // Side faces remain readable from the junction, without extra shop signs.
    const count=Math.max(2,Math.floor(span/2.4)),pitch=span/count;
    for(let i=0;i<count;i++){
     const u=-span/2+pitch*(i+.5);fb(pitch*.67,1.65,.12,frames,u,1.53,.06);fb(pitch*.60,1.48,.025,glass[style%3],u,1.55,.135);
    }
   }
  }
  root.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(root,true);
  records.push({x,z,w,d,h,style,background:true,variant,floors,shop,min:bb.min.toArray(),max:bb.max.toArray()});
 };
}
