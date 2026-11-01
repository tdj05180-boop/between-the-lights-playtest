// Seoul: retain every visible mesh, material, shadow and gameplay object.
export function prepareOptimizer(v){
 const dynamic=new Set([v.avatar,v.avatarShadow,v.features.exitGlow,...v.features.cars.map(c=>c.model.root),...v.features.lights.map(l=>l.model)]);
 const transforms=[],empty=[];let enabled=false;
 v.scene.updateMatrixWorld(true);
 function scan(n){
  if(dynamic.has(n))return;
  for(const child of [...n.children])scan(child);
  if(n!==v.world){transforms.push([n,n.matrixAutoUpdate,n.matrixWorldAutoUpdate]);}
 }
 scan(v.world);
 function prune(n){if(dynamic.has(n))return;for(const c of [...n.children])prune(c);if(n!==v.world&&n.isGroup&&!n.children.length){empty.push([n,n.parent,n.parent.children.indexOf(n)]);n.removeFromParent();}}
 const carLocals=[];
 for(const car of v.features.cars)car.model.root.traverse(n=>{if(n!==car.model.root&&n.name!=='rolling-wheel')carLocals.push([n,n.matrixAutoUpdate]);});
 function set(on){
  if(enabled===on)return;enabled=on;
  if(on){
   v.scene.updateMatrixWorld(true);prune(v.world);
   for(const [n]of transforms){n.updateMatrix();n.matrixAutoUpdate=false;n.matrixWorldAutoUpdate=false;}
   for(const [n]of carLocals){n.updateMatrix();n.matrixAutoUpdate=false;}
  }else{
   for(const [n,p,i]of [...empty].reverse()){p.add(n);const j=p.children.indexOf(n);p.children.splice(j,1);p.children.splice(i,0,n);}empty.length=0;
   for(const [n,a,w]of transforms){n.matrixAutoUpdate=a;n.matrixWorldAutoUpdate=w;}
   for(const [n,a]of carLocals)n.matrixAutoUpdate=a;
   v.scene.updateMatrixWorld(true);
  }
 }
 function audit(){let nodes=0,meshes=0,emptyGroups=0,automaticLocal=0,automaticWorld=0;v.scene.traverse(n=>{nodes++;meshes+=!!n.isMesh;emptyGroups+=!!(n.isGroup&&!n.children.length);automaticLocal+=!!n.matrixAutoUpdate;automaticWorld+=!!n.matrixWorldAutoUpdate;});return {enabled,nodes,meshes,emptyGroups,automaticLocal,automaticWorld,removedEmptyGroups:empty.length,frozenStaticNodes:enabled?transforms.length:0};}
 return {set,audit};
}
