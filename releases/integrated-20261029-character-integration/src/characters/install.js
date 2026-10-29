import {budgetBackgroundAnimation} from './animation-budget.js';
import {spaces,appearances} from '../content/registry.js';
import {prepareScene,sceneModels,sceneAppearance,character,bicycle,releaseUnused} from './library.js';
import {cargoSupport} from './adapter.js';
import {installShutterLift} from './shutter.js';
let installed=false;
export function installCharacters(){
 if(installed)return;installed=true;
 for(const [id,key,workwear]of [['hero-2003','hero2003'],['hero-warehouse','hero2003',true],['hero-2019','hero2019'],['hero-2026','hero2026']])appearances.register(id,{create:()=>character(key,{workwear})});
 for(const id of Object.keys(sceneModels)){
  if(!spaces.entries.has(id))continue;
  const entry=spaces.get(id),create=entry.create;
  entry.create=async ctx=>{
   await prepareScene(id);ctx.chapter.appearanceId=sceneAppearance[id];
   if(id==='life-street')ctx.chapter.interactions=ctx.chapter.interactions.map(t=>t.id==='shopkeeper'?{...t,y:2.12}:t);
   const personnel={create(key,options){const a=character(key,options);if(options?.background)budgetBackgroundAnimation(a,ctx.camera);ctx.scope.own(()=>a.dispose());return a;},bicycle(){const b=bicycle();ctx.scope.own(()=>b.dispose());return b;}};
   let v=create({...ctx,characters:personnel});
   if(id==='life-street'){
    const optional=v.optionalTargets;v.optionalTargets=()=>optional().map(t=>t.id==='street-neighbour'?{...t,y:2.15,name:'서형원 교수님',label:'서형원 교수님 · 대화하기'}:t.id==='street-board'?{...t,y:1.55}:t);
    v=installShutterLift(v,ctx);
   }
   let released=false;const ambient=v.updateAmbient;v.updateAmbient=s=>{
    if(!released){releaseUnused(id);released=true;}
    ambient?.call(v,s);
    const a=ctx.player.playerView.adapter;
    if(id==='warehouse-workflow'){
     const anchor=ctx.player.carryAnchor,held=anchor.children.filter(n=>n.userData.cargoKind).sort((x,y)=>x.position.y-y.position.y),stack=held.map(n=>n.userData.cargoKind),kind=stack[0]??'food',grip=cargoSupport(kind,stack);
     anchor.position.y=v.carrying?grip.anchorY:.89;anchor.position.z=v.carrying?grip.anchorZ:.44;a.setCargo?.(kind,stack);
    }
    if(id!=='life-train'&&(id!=='life-agency'||!v.scene.userData.seating||v.scene.userData.seating.phase==='idle'))a.present?.(s);
   };
   v.scene.userData.characterManifest={scene:id,appearance:sceneAppearance[id],models:[...sceneModels[id]]};
   return v;
  };
 }
}
