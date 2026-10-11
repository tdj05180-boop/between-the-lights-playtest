// Scene-owned subtitle and rejected-movement observer; never changes walkability.
export function boundaryDialogue(scene,avatar){
 const node=document.createElement('div');node.id='seoulBoundaryThought';node.setAttribute('role','status');node.setAttribute('aria-live','polite');
 const style=document.createElement('style');style.textContent=`#seoulBoundaryThought{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + clamp(116px,19vh,156px));transform:translate(-50%,5px);max-width:calc(100vw - 36px);width:max-content;box-sizing:border-box;padding:11px 20px;background:#315247ed;color:#fff6df;border-radius:4px;font:500 13px/1.6 system-ui;text-align:center;pointer-events:none;opacity:0;z-index:25;transition:opacity .25s,transform .25s;touch-action:manipulation}#seoulBoundaryThought[data-visible="true"]{opacity:1;transform:translate(-50%,0)}@media(max-width:600px){#seoulBoundaryThought{font-size:12px;padding:9px 14px;max-width:calc(100vw - 28px)}}`;
 document.head.append(style);document.body.append(node);
 let attempted=false,armed=true,clock=0,last=-100,visibleUntil=-1;const repeats=new Map();
 const line=count=>count===0?'지금은 이쪽이 아니야. 먼저 할 일이 있어.':count<3?'아직 찾아야 할 빛이 남았다. 돌아가자.':'이제 헤맬 필요는 없어. 저 문으로 가자.';
 return {
  observe(x,z,r,allowed){const p=avatar.position,dx=x-p.x,dz=z-p.z;if(!allowed&&Math.hypot(dx,dz)<.3&&((Math.abs(x)>=14-r&&dx*p.x>0&&Math.abs(dz)<1e-5)||(Math.abs(z)>=11-r&&dz*p.z>0&&Math.abs(dx)<1e-5)))attempted=true;},
  tick(dt,playing){const attempt=attempted;attempted=false;if(!playing)return;clock+=dt;const p=avatar.position,state=scene.userData.experiment;if(Math.abs(p.x)<12.6&&Math.abs(p.z)<9.6)armed=true;
   const blocked=state?.returning||state?.completed||state?.phase==='knocking';if(blocked||clock>=visibleUntil)node.dataset.visible='false';
   if(!attempt||!armed||blocked||clock-last<8)return;const message=line(state?.collected?.length??0);if(clock-(repeats.get(message)??-100)<20)return;
   armed=false;last=clock;repeats.set(message,clock);visibleUntil=clock+2.5;node.textContent=message;node.dataset.visible='true';
  },dispose(){node.remove();style.remove();}
 };
}
