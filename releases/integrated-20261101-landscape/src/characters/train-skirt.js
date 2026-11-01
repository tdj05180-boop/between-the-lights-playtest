import * as T from '../vendor/three.module.min.js';
// The seated copy needs coherent skirt weights. Keep the street model unchanged.
export function fitTrainSkirt(a,mask){
 let m;a.object.traverse(n=>{if(n.isSkinnedMesh)m=n;});const g=m.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,names=m.skeleton.bones.map(b=>b.name.replace(/^mixamorig:?/,'')),hip=names.indexOf('Hips'),left=names.indexOf('LeftUpLeg'),right=names.indexOf('RightUpLeg');
 for(const i of mask.skirt){const y=p.getY(i),x=p.getX(i),lower=1-T.MathUtils.smoothstep(y,.48,.60),side=T.MathUtils.smoothstep(x,-.045,.045);si.setXYZW(i,hip,left,right,0);sw.setXYZW(i,1-lower,lower*side,lower*(1-side),0);}
 si.needsUpdate=sw.needsUpdate=true;
 let done=false;a.finalizeTrainClothing=()=>{
  if(done)return;done=true;a.object.updateMatrixWorld(true);m.skeleton.update();
  const points=[],v=new T.Vector3(),original=new T.Vector3(),target=new T.Vector3(),matrix=new T.Matrix4(),part=new T.Matrix4();
  for(const i of mask.body){m.getVertexPosition(i,v);m.localToWorld(v);a.object.worldToLocal(v);if(v.y>.48&&v.y<.90&&Math.abs(v.x)<.24&&v.z>-.02&&v.z<.44)points.push(v.clone());}
  let adjusted=0;
  for(const i of mask.skirt){const front=T.MathUtils.smoothstep(p.getZ(i),-.012,.045);if(front<.001)continue;
   m.getVertexPosition(i,v);m.localToWorld(v);a.object.worldToLocal(v);
   // Hold the front hem over the thighs in this fixed seated pose.
   const length=1-T.MathUtils.smoothstep(p.getY(i),.45,.62);
   v.z=T.MathUtils.lerp(v.z,.075+Math.max(0,.62-p.getY(i))*1.85,front*length);
   let surface=-Infinity;
   for(const b of points)if(Math.abs(b.x-v.x)<.022&&Math.abs(b.z-v.z)<.022)surface=Math.max(surface,b.y);
   target.copy(v);if(Number.isFinite(surface)&&surface+.012>v.y)target.y+=(surface+.016-v.y)*front;
   a.object.localToWorld(target);m.worldToLocal(target);target.applyMatrix4(m.bindMatrixInverse.clone().invert());
   matrix.elements.fill(0);for(let j=0;j<4;j++){const w=sw.getComponent(i,j);part.fromArray(m.skeleton.boneMatrices,si.getComponent(i,j)*16);for(let k=0;k<16;k++)matrix.elements[k]+=part.elements[k]*w;}
   target.applyMatrix4(matrix.invert()).applyMatrix4(m.bindMatrix.clone().invert());p.setXYZ(i,target.x,target.y,target.z);adjusted++;
  }
  p.needsUpdate=true;a.object.userData.trainSkirtContactVertices=adjusted;
 };

 const bag=new Set(mask.bag),old=g.index,keep=[];for(let i=0;i<old.count;i+=3){const a=old.getX(i),b=old.getX(i+1),c=old.getX(i+2);if(bag.has(a)&&bag.has(b)&&bag.has(c))continue;keep.push(a,b,c);}g.setIndex(keep);
}
