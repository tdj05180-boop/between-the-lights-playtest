import {panel,actionButton,near} from '../ui.js';
export const sorting={input:{movement:false,camera:false,interaction:true},create(ctx,c){
 const {view,avatar,carryAnchor,scene}=ctx.world(),f=view.features,held=[],done=new Set();let correct=0,closed=false;
 const ui=panel(ctx,'sorting','유통 · 색상 분류','컨베이어에서 상자를 들고 같은 색 트럭에 하나씩 싣기 · 최대 2개',{world:true});
 const button=actionButton(ctx,ui,'상자 들기 / 싣기',act);const released=()=>Math.min(c.count,1+Math.floor(ctx.elapsedMs()/c.releaseMs));
 function act(){if(closed)return;if(near(avatar.position,f.pickup,1.65)&&held.length<2){const b=f.boxes.find(b=>b.id<released()&&!done.has(b.id)&&!held.includes(b));if(b){held.push(b);carryAnchor.add(b.model);b.model.visible=true;b.model.position.set(0,held.length===1?0:.47,0);}}
 else{const truck=f.trucks.find(t=>near(avatar.position,t,1.4));if(truck&&held.length){const b=held.shift();done.add(b.id);if(b.color===truck.color)correct++;f.crateRoot.add(b.model);b.model.visible=false;held.forEach((b,i)=>b.model.position.set(0,i*.47,0));}}
 view.carrying=held.length>0;if(done.size===c.count){closed=true;ctx.finish({status:'success',metrics:{correct,elapsedMs:ctx.elapsedMs()}});}}
 function update(){let waiting=0;for(const b of f.boxes){if(done.has(b.id)||held.includes(b))continue;b.model.visible=b.id<released();const travel=Math.max(0,Math.min(1,(ctx.elapsedMs()-b.id*c.releaseMs)/1800));b.model.position.set((waiting%2-.5)*.57,1.33+Math.floor(waiting/8)*.44,-1.2+travel*(2-Math.floor(waiting%8/2)*.5));if(b.model.visible)waiting++;}
 const truck=f.trucks.find(t=>near(avatar.position,t,1.4));button.disabled=!(held.length&&truck)&&!(held.length<2&&near(avatar.position,f.pickup,1.65)&&f.boxes.some(b=>b.id<released()&&!done.has(b.id)&&!held.includes(b)));
 ui.status.textContent=`완료 ${done.size}/${c.count} · 정확 ${correct} · 운반 ${held.length}/2 · 파랑→1 / 빨강→2`;
 scene.userData.experiment={kind:'sorting',done:done.size,correct,held:held.map(b=>b.color),released:released(),pickup:f.pickup,trucks:f.trucks};if(ctx.elapsedMs()>c.limitMs)ctx.finish({status:'failure',reason:'time'});}
 return {...ui,update,dispose(){view.carrying=false;for(const b of f.boxes){f.crateRoot.add(b.model);b.model.visible=false;}delete scene.userData.experiment;}};
}};
