// Displays immutable receipts from the existing scorer; never calculates a game score.
export class PartResults {
 constructor({pause,resume,canConfirm=()=>true}){
  Object.assign(this,{pause,resume,canConfirm});this.pending=null;
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./part-results.css',import.meta.url).href;document.head.append(style);
  this.el=document.createElement('section');this.el.id='partResultOverlay';this.el.hidden=true;this.el.setAttribute('role','dialog');this.el.setAttribute('aria-modal','true');this.el.setAttribute('aria-labelledby','partResultTitle');
  this.el.innerHTML='<div class="part-result-card"><p class="part-result-eyebrow">한 걸음의 기록</p><h2 id="partResultTitle"></h2><p class="part-result-earned"><strong id="partResultScore"></strong><span> / <span id="partResultMax"></span>점</span></p><div class="part-result-total"><span>지금까지 누적 점수</span><strong id="partResultTotal"></strong></div><p id="partResultCount"></p><p class="part-result-note">확인하는 동안 기록 시간은 멈춰 있습니다.</p><button id="nextPartBtn" type="button">다음 파트로 <span aria-hidden="true">→</span></button></div>';
  document.body.append(this.el);this.button=this.el.querySelector('button');
  this.button.addEventListener('click',()=>this.confirm());
  this.key=e=>{if(!this.pending||!this.canConfirm())return;e.stopImmediatePropagation();if(e.code==='Tab'){e.preventDefault();this.button.focus();}else if(['Enter','Space'].includes(e.code)){e.preventDefault();if(!e.repeat)this.confirm();}};
  this.focus=e=>{if(this.pending&&this.canConfirm()&&!this.el.contains(e.target))this.button.focus();};
 }
 get active(){return !!this.pending;}
 show(receipt){
  if(!receipt)return Promise.resolve(true);if(this.pending)return this.pending.promise;
  const text=(id,value)=>this.el.querySelector('#'+id).textContent=value;
  text('partResultTitle',receipt.label);text('partResultScore',receipt.score.toLocaleString('ko-KR'));text('partResultMax',receipt.maxScore.toLocaleString('ko-KR'));text('partResultTotal',receipt.total.toLocaleString('ko-KR')+'점');text('partResultCount',`${receipt.completed} / ${receipt.partCount}개 파트 완료`);
  const previousFocus=document.activeElement,inert=[...document.body.children].filter(el=>el!==this.el&&!['pauseOverlay','loadError','help'].includes(el.id)).map(el=>[el,el.inert]);
  let resolve;const promise=new Promise(r=>resolve=r);this.pending={receipt,promise,resolve,previousFocus,inert};
  this.pause('part-result');for(const [el]of inert)el.inert=true;
  document.body.dataset.partResult='true';this.el.hidden=false;this.button.disabled=false;
  window.addEventListener('keydown',this.key,true);document.addEventListener('focusin',this.focus);this.button.focus();return promise;
 }
 confirm(){if(!this.pending||!this.canConfirm())return;this.close(true);}
 close(confirmed=false){
  const pending=this.pending;if(!pending)return;this.pending=null;this.button.disabled=true;this.el.hidden=true;
  window.removeEventListener('keydown',this.key,true);document.removeEventListener('focusin',this.focus);delete document.body.dataset.partResult;
  for(const [el,value]of pending.inert)el.inert=value;
  this.resume('part-result');if(pending.previousFocus?.isConnected)pending.previousFocus.focus();pending.resolve(confirmed);
 }
 snapshot(){return this.pending?{...this.pending.receipt,waiting:true}:null;}
}
