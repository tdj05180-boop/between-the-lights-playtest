export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function scoreRound(id,m,c){
 let value=0;
 if(id==='shutter')value=m.survivedMs/c.maxMs;
 if(id==='sorting')value=c.accuracyWeight*(m.correct/c.count)+(1-c.accuracyWeight)*clamp((c.slowMs-m.elapsedMs)/(c.slowMs-c.fastMs));
 if(id==='office')value=c.avoidanceWeight*clamp(1-m.hits/c.hitLimit)+(1-c.avoidanceWeight)*clamp((c.slowMs-m.elapsedMs)/(c.slowMs-c.fastMs));
 if(id==='dispatch')value=c.efficiencyWeight*m.efficiency+(1-c.efficiencyWeight)*clamp((c.slowMs-m.elapsedMs)/(c.slowMs-c.fastMs));
 if(id==='management')value=1-m.risks*c.riskPenalty-Math.max(0,(m.elapsedMs-c.safeMs)/1000)*c.delayPenalty;
 return Math.round(clamp(value)*c.maxScore);
}
export function better(a,b){return !b||a.total>b.total||a.total===b.total&&a.elapsedMs<b.elapsedMs;}
export function createSession(config,{full=true,storageKey='between-lights:life-experiment-v1:best'}={}){
 const scores=new Map(),key=storageKey;
 return {recordPrefix:'between-lights:life-experiment-v1',scores,onReset(){scores.clear();document.getElementById('roundResults')?.remove();},
  onResult(result,q){
   const id=q.scoreRound;if(!id||!result.metrics||result.status!=='success'||scores.has(id))return null;
   const c=config[id];if(!c)throw Error(`점수 파트 설정 없음: ${id}`);
   const score=scoreRound(id,result.metrics,c);scores.set(id,score);
   return Object.freeze({id,label:c.label,score,maxScore:c.maxScore,total:[...scores.values()].reduce((a,b)=>a+b,0),completed:scores.size,partCount:Object.keys(config).length});
  },
  onFinish(time){
   const rows=Object.entries(config),total=[...scores.values()].reduce((a,b)=>a+b,0),complete=full&&rows.every(([id])=>scores.has(id));
   const record={total,elapsedMs:time.elapsedMs,interrupted:time.interrupted,scores:Object.fromEntries(scores)};let best=null,saved=false;
   try{best=JSON.parse(localStorage.getItem(key));if(!best||!Number.isFinite(best.total)||!Number.isFinite(best.elapsedMs))best=null;if(complete&&better(record,best)){localStorage.setItem(key,JSON.stringify(record));best=record;saved=true;}}catch{}
   document.getElementById('roundResults')?.remove();const panel=document.createElement('div');panel.id='roundResults';
   panel.innerHTML='<h3>파트별 점수</h3>'+rows.map(([id,c],i)=>`<div class="score-row" data-round="${id}"><span>${i+1}. ${c.label}</span><strong>${scores.has(id)?scores.get(id):'미진행'} / ${c.maxScore}</strong></div>`).join('')+`<p class="score-total">총점 ${total} / ${rows.reduce((s,[,c])=>s+c.maxScore,0)}점</p><p>${scores.size} / ${rows.length}개 파트 완료</p><p>${complete?'전체 플레이':'챕터 테스트 · 개인 최고 기록에 반영하지 않음'}</p><p>${best?`이 브라우저 최고 ${best.total}점 · ${(best.elapsedMs/1000).toFixed(1)}초`:'저장된 개인 최고 기록 없음'}${saved?' · 새 기록!':''}</p>`;
   document.querySelector('#ending .ending-card').insertBefore(panel,document.querySelector('#ending .end-buttons'));
   document.getElementById('saveStatus').textContent=complete?'점수 우선 · 동점이면 더 짧은 시간. 중단 이력으로 기록을 무효 처리하지 않습니다.':'중간 챕터 테스트 기록입니다.';
   window.experimentResult={...record,complete,best};
  }
 };
}
