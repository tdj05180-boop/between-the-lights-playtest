import {kit,C,T} from '../experiments/spaces/kit.js';
import {passenger,seatPose} from './passengers.js';
import {createScenery} from './scenery.js';
const HERO={x:-1.30,z:1};
export const train={spawn:HERO,create(ctx){
 const k=kit(ctx,{w:3.75,d:16,indoor:false}),{box,cyl,mat,world,scene}=k;
 scene.background=new T.Color(0xd6e3df);scene.fog=new T.Fog(0xd6e3df,65,155);
 scene.children.filter(n=>n.isLight).forEach(n=>{if(n.isDirectionalLight){n.intensity=1.35;n.castShadow=false;}else n.intensity=1.8;});
 const room=new T.Group();world.add(room);const blue=0x718f9e,trim=0xc4ccbe;
 box(3.75,.12,16,0xa6ada0,0,.14,0,room);box(.72,.018,15.8,0x6c7f7d,0,.212,0,room);
 for(const side of [-1,1]){
  box(.14,.83,16,0xd7d6c7,side*1.88,.61,0,room);box(.15,.09,16,blue,side*1.79,1.04,0,room);
  box(.14,.53,16,0xe3dfd0,side*1.88,2.535,0,room);box(.08,.085,16,trim,side*1.80,2.27,0,room);
  for(let i=0;i<10;i++){const z=-7.1+i*1.57;box(.18,1.23,.15,0xd4d8ca,side*1.85,1.67,z-.76,room);
   box(.25,.05,1.37,0xc0cabb,side*1.75,1.08,z,room);box(.11,.05,1.39,0xc0cabb,side*1.82,2.24,z,room);
   const glass=new T.Mesh(new T.PlaneGeometry(1.38,1.1),new T.MeshStandardMaterial({color:0xb1d4d1,transparent:true,opacity:.065,roughness:.16,depthWrite:false,side:T.DoubleSide}));glass.rotation.y=Math.PI/2;glass.position.set(side*1.86,1.66,z);room.add(glass);
  }
  // Luggage racks are open rails, not a solid wall obscuring the windows.
  box(.48,.035,15.6,trim,side*1.56,2.40,0,room);box(.035,.07,15.6,0x8c9f99,side*1.32,2.42,0,room);
  for(let z=-6.8;z<7;z+=2.5){box(.06,.20,.06,trim,side*1.34,2.51,z,room);box(.35,.21,.55,z<0?0xa19784:0x7c8f8a,side*1.60,2.51,z+.3,room);}
 }
 box(3.88,.16,16.15,0xe2e1d4,0,2.88,0,room);for(const x of [-.66,.66]){const m=box(.065,.026,15.8,0xfff1d0,x,2.783,0,room);m.material=new T.MeshStandardMaterial({color:0xfff2d2,emissive:0xffe9be,emissiveIntensity:.55,roughness:.7});m.castShadow=false;}
 for(const z of [-8,8]){box(1.29,2.72,.13,0xc9d0c7,-1.30,1.47,z,room);box(1.29,2.72,.13,0xc9d0c7,1.30,1.47,z,room);box(1.35,.37,.15,0xd5d9ce,0,2.64,z,room);box(1.20,2.20,.13,0x829a98,0,1.33,z,room);box(.75,1.08,.04,0xa7c1bc,0,1.78,z-Math.sign(z)*.095,room);box(.06,.34,.07,0xd1d5c7,.47,1.3,z-Math.sign(z)*.12,room);}
 const doorLeft=new T.Group(),doorRight=new T.Group();world.add(doorLeft,doorRight);k.dynamic.add(doorLeft);k.dynamic.add(doorRight);
 // Visible sliding door panels at the far vestibule close during the departure cue.
 for(const [i,g]of [doorLeft,doorRight].entries()){box(.57,2.17,.11,0x96aaa4,0,1.32,0,g);box(.40,.98,.03,0xbacbc1,0,1.75,.07,g);g.position.set((i?1:-1)*.64,0,-7.84);}
 for(const z of [-5.4,-3.8,-2.2,-.6,1,2.6,4.2,5.8])for(const x of [-1.30,-.67,.67,1.30]){
  const s=new T.Group();s.position.set(x,0,z);room.add(s);
  box(.54,.16,.55,blue,0,.52,.02,s);const back=box(.53,.83,.15,blue,0,.98,-.27,s);back.rotation.x=-.08;
  box(.34,.17,.16,0xd5dacb,0,1.31,-.24,s);box(.30,.06,.16,0xe5e2d1,0,1.30,-.337,s);
  box(.35,.30,.30,0x899a91,0,.30,-.02,s);for(const side of [-1,1]){box(.052,.07,.48,0x667e7c,side*.28,.75,.035,s);box(.035,.20,.035,0x9fae9f,side*.28,.65,-.12,s);}
  box(.29,.22,.045,0xa5b2a8,0,.91,-.363,s);box(.23,.017,.025,0xd9dfcb,0,.98,-.395,s);
 }
 const people=[
  {x:1.3,z:1,shirt:0x9b7d82,hair:0x3f353b,kind:'reader',scale:.97},
  {x:-1.3,z:-.6,shirt:0xb3a079,hair:0x4b3c30,kind:'phone',scale:1.03},
  {x:.67,z:-2.2,shirt:0x768c9e,hair:0xb2aba0,kind:'elder',scale:.96},
  {x:1.30,z:-3.8,shirt:0x8e9c79,hair:0x4c3932,kind:'window',scale:.94},
  {x:-.67,z:-5.4,shirt:0x998b70,hair:0x6b6359,kind:'rest',scale:1.04}
 ].map(c=>passenger(k,c));
 const scenery=createScenery(k),cameraStart=new T.Vector3(.10,1.87,5.3),cameraNear=new T.Vector3(.04,1.57,2.95);
 const fade=document.createElement('div');fade.className='train-transition';fade.setAttribute('aria-hidden','true');document.body.append(fade);ctx.scope.own(()=>{if(!started){fade.remove();return;}fade.style.opacity='1';fade.classList.add('leaving');fade.addEventListener('animationend',()=>fade.remove(),{once:true});});
 let start=null,started=false,time=0,heroAdapter=null,restorePose=null;
 ctx.scope.own(()=>{document.body.classList.remove('train-cutscene');ctx.player.avatarShadow.visible=true;restorePose?.();});
 const state={kind:'train-cutscene',durationMs:15000,timeMs:0,passengers:5,doorProgress:0};scene.userData.experiment=state;
 function elapsed(){return start===null?0:Math.min(15,(ctx.clock.elapsed()-start)/1000);}
 function poseHero(){const a=ctx.player.playerView.adapter;if(!a.skeleton)return;if(heroAdapter!==a){heroAdapter=a;const bones=a.skeleton.bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone()}));restorePose=()=>{for(const {b,p,q}of bones){b.position.copy(p);b.quaternion.copy(q);}};}seatPose(a,time,'hero');ctx.player.avatar.position.x=HERO.x;ctx.player.avatar.position.z=HERO.z;ctx.player.avatar.rotation.y=0;}
 function pose(t){time=t;const close=T.MathUtils.smoothstep(t,.15,1.3);doorLeft.position.x=-.64+.345*close;doorRight.position.x=.64-.345*close;for(const p of people)p.update(t);poseHero();Object.assign(state,{timeMs:Math.round(t*1000),doorProgress:close,...scenery.update(t)});}
 pose(0);
 const view=k.finalize({cinematic:true,features:{cutscene:state,passengers:people},
  updateAmbient({playing}){
   if(playing&&!started){started=true;start=ctx.clock.elapsed();document.body.classList.add('train-cutscene');ctx.player.avatarShadow.visible=false;scene.dispatchEvent({type:'train-audio-event',detail:{type:'start'}});}
   pose(elapsed());
   if(!started)return;
   const a=T.MathUtils.smoothstep(time,13.8,15);
   fade.style.opacity=String(Math.max(1-T.MathUtils.smoothstep(time,0,.65),a));state.fade=a;
   if(time>=13.4&&!state.fading){state.fading=true;scene.dispatchEvent({type:'train-audio-event',detail:{type:'fade',seconds:1.5}});}
  },
  updatePlayerHeight(){ctx.player.avatar.position.y=.11;},
  resolveCamera(camera,target){const t=elapsed(),blend=T.MathUtils.smoothstep(t,2.5,9);camera.position.copy(cameraStart).lerp(cameraNear,blend);target.set(T.MathUtils.lerp(-.28,-1.17,blend),T.MathUtils.lerp(1.16,1.27,blend),T.MathUtils.lerp(-1.3,1,blend));const city=T.MathUtils.smoothstep(t,9,13);target.x-=city*.24;target.z-=city*.20;},
  exit(){scene.dispatchEvent({type:'train-audio-event',detail:{type:'exit'}});}
 });
 return view;
}};
