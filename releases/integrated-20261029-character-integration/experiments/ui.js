export function panel(ctx,id,title,instruction,{world=false}={}){
 const el=document.createElement('section');el.id=id;el.className=world?'experiment-dock':'experiment-panel';el.setAttribute('role','region');el.setAttribute('aria-label',title);
 el.innerHTML=`<header><small>실험용 콘텐츠 · 임시 설정</small><h2>${title}</h2><p>${instruction}</p></header><div class="game-content"></div><output aria-live="polite"></output>`;ctx.mount(document.body,el);
 return {el,content:el.querySelector('.game-content'),status:el.querySelector('output'),pause(){el.hidden=true;},resume(){el.hidden=false;}};
}
export function press(ctx,button,action){
 ctx.listen(button,'pointerdown',e=>{if(e.button!==0)return;e.preventDefault();action();});
 ctx.listen(button,'click',e=>{if(e.detail===0&&!e.pointerType)action();});
 for(const t of ['touchstart','touchmove','touchend','gesturestart','gesturechange','dblclick'])ctx.listen(button,t,e=>{if(e.cancelable)e.preventDefault();},{passive:false});
}
export function actionButton(ctx,ui,label,action,code='KeyE'){
 const b=document.createElement('button');b.id='experimentAction';b.textContent=label;b.className='game-action';ui.content.appendChild(b);press(ctx,b,action);
 ctx.listen(window,'keydown',e=>{if(e.code===code&&!e.repeat){e.preventDefault();action();}});return b;
}
export const near=(a,b,r=1.35)=>Math.hypot(a.x-b.x,a.z-b.z)<r;
