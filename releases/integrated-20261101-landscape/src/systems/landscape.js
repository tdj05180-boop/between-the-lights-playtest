// One orientation gate for the entire campaign, including body/shadow-root UI.
// No timer or render loop: resize drives detection; the shared clock owns pauses.
export function installLandscapeGate({win=window,doc=document,pause,resume,isPlaying,canResume=()=>true}){
 const el=doc.createElement('section');el.id='orientationGate';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','orientationTitle');
 el.innerHTML='<div class="orientation-card"><span class="orientation-symbol" aria-hidden="true">↻</span><h2 id="orientationTitle"></h2><p id="orientationMessage"></p><button id="orientationContinue" type="button">계속하기</button></div>';
 doc.body.append(el);const title=el.querySelector('h2'),message=el.querySelector('p'),button=el.querySelector('button');
 let held=false,needsConfirm=false,portrait=false,focusBefore=null;
 function render(){
  el.hidden=!held;doc.body.classList.toggle('orientation-blocked',held);
  if(!held)return;
  const touch=win.matchMedia('(any-pointer:coarse)').matches;
  title.textContent=portrait?(touch?'기기를 가로로 돌려주세요':'창을 가로로 넓혀주세요'):'이어서 플레이할까요?';
  message.textContent=portrait?'이 게임은 가로 화면으로 플레이합니다. 진행 중인 게임과 소리는 잠시 멈춥니다.':'준비되면 계속하기를 눌러주세요.';
  button.hidden=portrait;refresh();
 }
 function refresh(){const disabled=portrait||!canResume();if(button.disabled!==disabled)button.disabled=disabled;}
 function release(){held=false;needsConfirm=false;render();resume();if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true});}
 function sync(){
  portrait=win.innerWidth<=win.innerHeight;
  if(portrait){if(!held){held=true;needsConfirm=isPlaying();focusBefore=doc.activeElement;pause();}render();}
  else if(held){if(!needsConfirm){release();}else{render();button.focus({preventScroll:true});}}
 }
 button.addEventListener('click',()=>{if(!portrait&&canResume())release();});
 // Best effort only in supported mobile fullscreen. Safari/PWA uses the gate.
 function tryLock(){if(!doc.fullscreenElement||!win.matchMedia('(any-pointer:coarse)').matches)return;try{const promise=win.screen?.orientation?.lock?.('landscape');promise?.catch(()=>{});}catch{}}
 win.addEventListener('resize',sync);win.addEventListener('orientationchange',sync);doc.addEventListener('fullscreenchange',tryLock);
 sync();return {get blocked(){return held;},sync,refresh,tryLock};
}
