import {createImprovedWorld} from '../models/improved-world.js';
import {disposeObject,objectResources} from '../models/resources.js';
import {canWalkLegacy} from '../flow.js';

export function ownScene(view,borrowed=[],sharedResources=new Set()){
  let disposed=false;
  view.dispose=()=>{if(disposed)return;disposed=true;const preserve=new Set(sharedResources);for(const node of borrowed){for(const set of Object.values(objectResources(node)))for(const resource of set)preserve.add(resource);node.removeFromParent();}
    view.scene.traverse(n=>{if(n.isLight)n.shadow?.dispose();});
    disposeObject(view.scene,{preserve});view.scene.clear();
  };
  return view;
}
export const legacyRoom={
  legacyGames:true,spawn:{x:.25,z:3.05},cameraPresets:null,
  create({canvas,renderer,camera,player}){
    const v=createImprovedWorld(canvas,{renderer,camera,player});v.canWalk=canWalkLegacy;
    ownScene(v,[v.avatar,v.avatarShadow]);const dispose=v.dispose;
    v.dispose=()=>{for(const crate of v.crates)if(crate.parent===v.carryAnchor)v.world.add(crate);dispose();};
    return v;
  }
};
