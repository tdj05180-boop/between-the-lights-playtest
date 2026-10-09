import {panel,actionButton,near} from '../ui.js';
export const documents={input:{movement:false,camera:false,interaction:true},create(ctx,c){
 const {view,avatar,scene,playerState}=ctx.world(),f=view.features,collected=new Set();let hits=0,lastHit=-Infinity,slowUntil=0;
 for(const p of f.papers)p.model.visible=true;const ui=panel(ctx,'documents','2019 · 서류를 챙겨 다음 길로','서류 5개 수집 · 붉은 구역은 점프로 피하기',{world:true});
 const button=actionButton(ctx,ui,'서류 줍기 / 나가기',()=>{const p=f.papers.find(p=>!collected.has(p.id)&&near(avatar.position,p,1.05));if(p){collected.add(p.id);p.model.visible=false;}else if(collected.size===5&&near(avatar.position,f.exit,1.2))ctx.finish({status:'success',metrics:{hits,elapsedMs:ctx.elapsedMs()}});});
 function update(){const ms=ctx.elapsedMs();f.hazards.forEach((h,i)=>{h.position.x=Math.sin(ms/1000*(.65+i*.18)+i*2)*5.6;h.position.z=i?2:-1.4;if(ms-lastHit>c.hitCooldownMs&&Math.hypot(avatar.position.x-h.position.x,avatar.position.z-h.position.z)<.91&&playerState().jumpHeight<.2){hits++;lastHit=ms;slowUntil=ms+c.slowMs;}});view.speedScale=ms<slowUntil?c.slowScale:1;
 button.disabled=!f.papers.some(p=>!collected.has(p.id)&&near(avatar.position,p,1.05))&&!(collected.size===5&&near(avatar.position,f.exit,1.2));ui.status.textContent=`서류 ${collected.size}/5 · 위험 접촉 ${hits}${ms<slowUntil?' · 잠시 느려짐':''}${collected.size===5?' · 오른쪽 앞 출구로 이동':''}`;
 scene.userData.experiment={kind:'documents',collected:[...collected],hits,slow:ms<slowUntil,papers:f.papers.filter(p=>!collected.has(p.id)).map(({x,z,id})=>({x,z,id})),exit:f.exit};}
 return {...ui,update,dispose(){view.speedScale=1;delete scene.userData.experiment;}};
}};
