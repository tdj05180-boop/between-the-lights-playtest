import {panel,press} from '../ui.js';
import {ManagementState} from '../management-state.js';
export function transfer(state,index,delta){if(delta===1&&state.pool>0){state.pool--;state.riders[index]++;return true;}if(delta===-1&&state.riders[index]>0){state.pool++;state.riders[index]--;return true;}return false;}
export const management={input:{movement:true,camera:true,interaction:true},create(ctx,c){
 const {view,scene}=ctx.world();view.features.focus.active=true;const state=new ManagementState(c);
 const ui=panel(ctx,'management','권역 관리 · 네 곳의 균형','−로 대기 인력을 확보하고 +로 재배치하세요. 모든 권역을 안전 구간에서 연속 20초 유지합니다.');
 const grid=document.createElement('div');grid.className='region-grid';ui.content.append(grid);
 const cards=['A','B','C','D'].map((name,i)=>{const card=document.createElement('article');card.innerHTML=`<h3>${name} 권역</h3><progress max="100"></progress><p></p><div></div>`;for(const delta of [-1,1]){const b=document.createElement('button');b.textContent=delta===1?'+':'−';b.setAttribute('aria-label',name+(delta===1?' 인력 추가':' 인력 회수'));press(ctx,b,()=>transfer(state,i,delta));card.querySelector('div').append(b);}grid.append(card);return card;});
 return {...ui,update(){const ms=ctx.elapsedMs();state.advance(ms);const {loads,risks,safeMs}=state,demand=state.demand();for(let i=0;i<4;i++){const card=cards[i];card.querySelector('progress').value=loads[i];card.querySelector('p').textContent=`인력 ${state.riders[i]} · 수요 ${demand[i]} · 부담 ${Math.round(loads[i])}%`;card.dataset.danger=String(loads[i]>c.safeLimit);}
 ui.status.textContent=`대기 인력 ${state.pool} · 안전 유지 ${(safeMs/1000).toFixed(1)}/20초 · 위험 진입 ${risks}`;scene.userData.experiment={kind:'management',riders:[...state.riders],pool:state.pool,loads:[...loads],demand:[...demand],safeMs,risks};if(state.failed)ctx.finish({status:'failure',reason:'overload'});else if(safeMs>=c.safeMs)ctx.finish({status:'success',metrics:{risks,elapsedMs:ms}});},dispose(){view.features.focus.active=false;delete scene.userData.experiment;}};
}};
