// Scene-local transform optimization. Geometry, materials, culling and shadows stay unchanged.
export function optimizeStaticScene(view,dynamicRoots=[]){
 const dynamic=new Set([view.avatar,view.avatarShadow,...dynamicRoots]),transforms=[],empty=[];let enabled=false;
 view.scene.updateMatrixWorld(true);
 function scan(n){if(dynamic.has(n)||n.isSkinnedMesh||n.isBone)return;for(const c of [...n.children])scan(c);if(n!==view.world)transforms.push([n,n.matrixAutoUpdate,n.matrixWorldAutoUpdate]);}
 scan(view.world);
 function prune(n){if(dynamic.has(n)||n.isSkinnedMesh||n.isBone)return;for(const c of [...n.children])prune(c);if(n!==view.world&&n.isGroup&&!n.children.length){empty.push([n,n.parent,n.parent.children.indexOf(n)]);n.removeFromParent();}}
 function set(on){if(enabled===on)return;enabled=on;if(on){view.scene.updateMatrixWorld(true);prune(view.world);for(const [n]of transforms){n.updateMatrix();n.matrixAutoUpdate=false;n.matrixWorldAutoUpdate=false;}}
 else{for(const [n,p,i]of [...empty].reverse()){p.add(n);const j=p.children.indexOf(n);p.children.splice(j,1);p.children.splice(i,0,n);}empty.length=0;for(const [n,a,w]of transforms){n.matrixAutoUpdate=a;n.matrixWorldAutoUpdate=w;}view.scene.updateMatrixWorld(true);}}
 function audit(){let nodes=0,meshes=0,automaticWorld=0;view.world.traverse(n=>{nodes++;meshes+=!!n.isMesh;automaticWorld+=!!n.matrixWorldAutoUpdate;});return {enabled,nodes,meshes,automaticWorld,removedEmptyGroups:empty.length,frozenStaticNodes:enabled?transforms.length:0};}
 return {set,audit};
}
