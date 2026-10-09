import * as T from '../vendor/three.module.min.js';

// Shared presentation: target name/action/ID and one world-space highlight.
// Input ownership remains with the runtime, not this UI.
export function createInteractionPrompt(ctx,scene){
 const el=document.createElement('output');el.className='interaction-prompt';el.hidden=true;el.setAttribute('aria-live','polite');ctx.mount(document.body,el);
 const geometry=new T.TorusGeometry(.38,.014,5,40),material=new T.MeshBasicMaterial({color:0xffe6a9,transparent:true,opacity:.86,depthTest:true});
 const ring=new T.Mesh(geometry,material);ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
 const box=new T.BoxGeometry(1,1,1),edges=new T.EdgesGeometry(box),lineMaterial=new T.LineBasicMaterial({color:0xffe6a9,transparent:true,opacity:.8});box.dispose();
 const outline=new T.LineSegments(edges,lineMaterial);outline.visible=false;scene.add(outline);
 ctx.own(()=>{ring.removeFromParent();outline.removeFromParent();geometry.dispose();material.dispose();edges.dispose();lineMaterial.dispose();});
 return {show(target){
  el.hidden=!target;ring.visible=!!target;outline.visible=!!target?.outline;
  if(!target){delete el.dataset.targetId;return;}
  const mobile=document.body.dataset.mobile==='true';el.dataset.targetId=String(target.id);
  el.textContent=`${target.name} — ${mobile?'행동 버튼':'[E]'} ${target.action}`;
  ring.position.set(target.x,target.highlightY??.13,target.z);ring.scale.setScalar(target.highlightScale??1);
  if(target.outline){const o=target.outline;outline.position.set(target.x,o.y,target.z);outline.scale.set(o.width,o.height,o.depth);outline.rotation.y=target.yaw??0;}
 },element:el};
}
