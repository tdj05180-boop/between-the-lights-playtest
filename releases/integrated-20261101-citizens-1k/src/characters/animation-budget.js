import * as T from '../vendor/three.module.min.js';
// Only background pedestrians without shadows use this. Their traffic position
// keeps updating normally; skip expensive skin-pose work outside the camera.
export function budgetBackgroundAnimation(adapter,camera){
 const update=adapter.update,frustum=new T.Frustum(),matrix=new T.Matrix4(),sphere=new T.Sphere(new T.Vector3(),2.2);let pending=0;
 adapter.update=state=>{
  pending+=state.dt||0;camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);
  adapter.object.updateWorldMatrix(true,false);adapter.object.getWorldPosition(sphere.center);sphere.center.y+=.85;
  if(!frustum.intersectsSphere(sphere)&&pending<.25)return;
  update({...state,dt:pending});pending=0;
 };
 return adapter;
}
