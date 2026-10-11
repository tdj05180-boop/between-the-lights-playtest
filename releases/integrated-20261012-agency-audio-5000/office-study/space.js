import {kit,T,C} from '../experiments/spaces/kit.js';
import {ROOM,DESKS,PAPERS,EXIT,LASERS,laserPosition} from './layout.js';
export const office2019={spawn:{x:0,z:4.4},create(ctx){
 const k=kit(ctx,{w:ROOM.w,d:ROOM.d,indoor:false}),{world,scene,box,block}=k;
 scene.background=new T.Color(0x242c30);scene.fog=new T.Fog(0x242c30,23,48);
 scene.children.filter(n=>n.isLight).forEach(n=>{if(n.isHemisphereLight){n.intensity=.85;n.color.setHex(0xb9cccf);n.groundColor.setHex(0x4a4440);}else{n.intensity=.9;n.position.set(1,9,4);}});
 box(12,.035,15,0x515852,0,.11,0);
 for(let x=-5.4;x<6;x+=1.2)box(.012,.008,15,0x414941,x,.134,0);
 for(let z=-6.8;z<7.5;z+=1.2)box(12,.008,.012,0x414941,0,.134,z);
 for(const x of [-3.1,3.1]){const lamp=new T.PointLight(0xffd4a0,8,9,2);lamp.position.set(x,2.65,-.8);scene.add(lamp);}
 const wall=0x71817a,trim=0x455851,wood=0x8d7b61;
 for(const x of [-6,6]){box(.22,4.2,15,wall,x,2.21,0);block(x,0,.22,15,4.31);box(.27,.16,15,trim,x,.21,0);}
 box(12,4.2,.22,wall,0,2.21,7.5);block(0,7.5,12,.22,4.31);
 for(const x of [-3.55,3.55]){box(4.9,4.2,.22,wall,x,2.21,-7.5);block(x,-7.5,4.9,.22,4.31);}
 box(2.2,1.3,.22,wall,0,3.66,-7.5);box(12.25,.16,15.25,0x59675f,0,4.39,0);
 for(const x of [-4,0,4])box(.065,.045,15,trim,x,4.28,0);
 for(const z of [-5,-1,3,6])box(12,.045,.065,trim,0,4.28,z);
 const lit=new T.MeshBasicMaterial({color:0xffd9a1});
 const basic=(w,h,d,mat,x,y,z,parent=world)=>{const m=box(w,h,d,0xffffff,x,y,z,parent);m.material=mat;m.castShadow=false;return m;};
 const glowData=new Uint8Array(32*32*4);for(let j=0;j<32;j++)for(let i=0;i<32;i++){const a=(j*32+i)*4,fade=Math.sin(Math.PI*i/31)*Math.sin(Math.PI*j/31);glowData.set([255,255,255,Math.round(255*fade*fade)],a);}const glowTexture=new T.DataTexture(glowData,32,32);glowTexture.needsUpdate=true;
 function glow(color,opacity,w,d,x,y,z,parent=world){const m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({color,map:glowTexture,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);return m;}
 for(const [x,z] of [[-3,-1],[3,-5],[0,5.8]]){box(1.4,.08,.4,trim,x,4.15,z);basic(1.24,.025,.29,lit,x,4.1,z);}
 function stack(x,y,z){for(let i=0;i<4;i++)box(.32,.022,.40,0xc5beaa,x+(i%2)*.025,y+i*.027,z);box(.2,.008,.015,trim,x,y+.092,z);}
 for(const [i,[x,z]] of DESKS.entries()){
  box(2.4,.12,1.1,wood,x,.98,z);for(const dx of [-1.05,1.05])for(const dz of [-.42,.42])box(.07,.86,.07,trim,x+dx,.52,z+dz);block(x,z,2.4,1.1,1.1);
  box(.34,.035,.25,trim,x,1.06,z-.15);box(.055,.23,.07,trim,x,1.19,z-.2);box(.77,.48,.09,0x34413f,x,1.44,z-.2);basic(.68,.39,.015,new T.MeshBasicMaterial({color:i%2?0x4d6c66:0x83988c}),x,1.44,z-.147);
  box(.57,.035,.20,0xa6ab97,x,1.064,z+.28);for(let j=-2;j<=2;j++)box(.07,.007,.012,trim,x+j*.095,1.085,z+.28);
  stack(x-.85,1.058,z+.12);stack(x+.85,1.058,z-.2);
  const cx=x+(x<0?-.25:.25),cz=z+.95;box(.5,.1,.48,trim,cx,.58,cz);box(.5,.52,.065,trim,cx,.88,cz+.21);k.cyl(.045,.40,C.metal,cx,.33,cz);box(.64,.05,.08,trim,cx,.16,cz);box(.08,.05,.6,trim,cx,.16,cz);block(cx,cz,.56,.58,1.16);
  const lx=x+(x<0?1:-1)*.83;box(.20,.045,.20,trim,lx,1.07,z-.32);k.cyl(.024,.38,trim,lx,1.28,z-.32);box(.35,.06,.24,trim,lx,1.47,z-.26);basic(.29,.012,.18,lit,lx,1.43,z-.23);glow(0xffc879,.14,.85,.8,lx,1.047,z);
 }
 for(const x of [-5.63,5.63])for(const z of [-4.2,0,4.4]){
  box(.57,2.8,1.25,trim,x,1.52,z);block(x,z,.57,1.25,2.92);
  for(const y of [.75,1.45,2.15]){box(.6,.08,1.21,wood,x,y,z);for(let j=0;j<5;j++)box(.44,.43,.15,[0x928c74,0x68796d,0x9b9987][j%3],x+(x<0?.05:-.05),y+.27,z-.46+j*.23);}
 }
 for(const x of [-5.86,5.86])for(const z of [-2.4,2.2]){box(.06,1.15,2,trim,x,2.95,z);for(let j=0;j<9;j++)box(.08,.065,1.88,0x9a9e8a,x+(x<0?.04:-.04),2.46+j*.116,z);}
 k.label('2019 · 서류 보관실',0,3.4,-7.32,3.2);
 for(const x of [-1.12,1.12])box(.12,2.95,.30,trim,x,1.59,-7.48);box(2.36,.12,.30,trim,0,3.02,-7.48);
 const hinge=new T.Group();hinge.position.set(-1.04,.13,-7.42);world.add(hinge);k.dynamic.add(hinge);
 box(2.08,2.79,.11,0x788a7d,1.04,1.395,0,hinge);box(1.62,1.24,.025,0x4a625e,1.04,1.8,.07,hinge);box(.09,.20,.13,0xd5c797,1.82,1.15,.13,hinge);
 const exitGlow=glow(0xffd68a,0,2.05,1.2,0,.153,-6.63);exitGlow.visible=false;k.dynamic.add(exitGlow);
 const papers=PAPERS.map(p=>{const g=new T.Group();g.position.set(p.x,.138,p.z);world.add(g);k.dynamic.add(g);box(.25,.005,.34,0xeee4c5,0,0,0,g);
  const c=document.createElement('canvas');c.width=256;c.height=320;const a=c.getContext('2d');a.fillStyle='#efe7ce';a.fillRect(0,0,256,320);a.fillStyle='#374947';a.font='bold 32px sans-serif';a.textAlign='center';a.fillText(p.name,128,62);for(let j=0;j<7;j++)a.fillRect(30,103+j*23,j%3===0?130:190,3);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(.25,.34),new T.MeshBasicMaterial({map:tex}));m.rotation.x=-Math.PI/2;m.position.y=.0035;g.add(m);
  // Unlit printed paper surface only: no floor halo, luminous frame or light source.
  return {...p,y:.19,model:g};});
 const hazards=LASERS.map(l=>{const g=new T.Group();g.position.y=.158;if(l.axis==='z')g.rotation.y=Math.PI/2;world.add(g);k.dynamic.add(g);
  const red=new T.MeshBasicMaterial({color:0xff171e}),core=new T.MeshBasicMaterial({color:0xff6962});
  // Rendering is continuous. Only collision uses the furniture-masked intervals in layout.js.
  // Opaque furniture naturally occludes this floor-level beam through normal depth testing.
  basic(l.width,.022,l.thickness,red,0,0,0,g);basic(l.width,.023,.065,core,0,.002,0,g);
  glow(0xff0808,.32,l.width,l.thickness+.24,0,-.011,0,g);glow(0xff0808,.07,l.width,l.thickness+.46,0,-.019,0,g);
  function setPosition(pos){g.position.x=pos.x;g.position.z=pos.z;}
  setPosition(laserPosition(l,0));return {...l,model:g,setPosition};});
 const f={papers,hazards,exit:{...EXIT},door:hinge,exitGlow,reaction:0,events:[],emit(type,detail={}){const event={type,...detail};this.events.push(event);if(this.events.length>32)this.events.shift();scene.dispatchEvent({type:'office-audio-event',detail:event});},setDoor(t){hinge.rotation.y=Math.PI*.48*t;},unlock(){exitGlow.visible=true;exitGlow.material.opacity=.48;}};
 const v=k.finalize({features:f});
 const originalResolve=v.resolveCamera,ray=new T.Ray(),direction=new T.Vector3(),hit=new T.Vector3();
 const ceiling=new T.Box3(new T.Vector3(-6.15,4.20,-7.65),new T.Vector3(6.15,4.52,7.65));
 const cameraSolids=[ceiling,new T.Box3(new T.Vector3(-6.3,0,-7.7),new T.Vector3(-5.88,4.5,7.7)),new T.Box3(new T.Vector3(5.88,0,-7.7),new T.Vector3(6.3,4.5,7.7)),new T.Box3(new T.Vector3(-6.3,0,7.38),new T.Vector3(6.3,4.5,7.7)),new T.Box3(new T.Vector3(-6.3,0,-7.7),new T.Vector3(6.3,4.5,-7.38)),new T.Box3(new T.Vector3(-1.2,0,-7.64),new T.Vector3(1.2,4.4,-7.25)),...DESKS.map(([x,z])=>new T.Box3(new T.Vector3(x-1.25,0,z-.6),new T.Vector3(x+1.25,1.77,z+.6)))];
 v.resolveCamera=(camera,target)=>{originalResolve(camera,target);direction.copy(camera.position).sub(target);let dist=direction.length();ray.set(target,direction.normalize());for(const solid of cameraSolids)if(!solid.containsPoint(target)&&ray.intersectBox(solid,hit))dist=Math.min(dist,Math.max(.12,target.distanceTo(hit)-.15));camera.position.copy(target).addScaledVector(direction,dist);};
 v.updateAmbient=({dt})=>{if(dt<=0)return;const bones=ctx.player.playerView.adapter?.skeleton?.bones??[];for(const b of bones){if(b.name==='head')b.rotation.x+=f.reaction*.23;if(b.name.startsWith('shoulder'))b.rotation.x-=f.reaction*.18;}};return v;
}};
