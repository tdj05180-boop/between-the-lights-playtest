// Browser presentation cadence only: no game clock, renderer or animation changes.
export const FPS_STORAGE_KEY='between-the-lights.preferences.fps.v1';
export class FrameCadence {
 constructor(){this.reset();}
 reset(){this.last=null;this.times=[];this.head=0;this.nextPaint=0;}
 sample(now){
  if(!Number.isFinite(now))return null;
  if(this.last===null){this.last=now;this.times.push(now);return null;}
  const ms=now-this.last;if(ms<=0)return null;
  this.last=now;this.times.push(now);
  while(this.head<this.times.length-2&&this.times[this.head]<now-3000)this.head++;
  if(this.head>2048){this.times=this.times.slice(this.head);this.head=0;}
  if(now<this.nextPaint)return null;
  this.nextPaint=now+250;
  const intervals=this.times.length-this.head-1;
  return {fps:1000/ms,average:intervals*1000/(now-this.times[this.head]),ms};
 }
}

export function installFpsMeter(doc=document,win=window){
 const existing=doc.getElementById('fpsPanel');if(existing)return existing.fpsMeter;
 const style=doc.createElement('link');style.rel='stylesheet';style.href=new URL('./fps-meter.css',import.meta.url).href;doc.head.append(style);
 const panel=doc.createElement('aside');panel.id='fpsPanel';panel.hidden=true;
 panel.setAttribute('aria-label','브라우저 화면 갱신 FPS');panel.setAttribute('aria-live','off');
 panel.innerHTML='<div><b data-fps>—</b> FPS <span>평균 <b data-average>—</b></span></div><small data-ms>최근 3초 · 측정 준비</small>';
 doc.body.append(panel);
 const settings=doc.createElement('fieldset');settings.id='fpsSettings';
 settings.innerHTML='<legend>성능 표시</legend><label><input id="fpsToggle" type="checkbox"> FPS 표시 <small>PC · F3</small></label><p>현재 / 최근 3초 평균 · 브라우저 화면 갱신 기준</p>';
 const help=doc.querySelector('#help .help-inner')??doc.querySelector('#help .modal-inner');
 if(help){const controls=help.querySelector('dl');if(controls)controls.after(settings);else help.append(settings);}
 const pauseSettings=doc.createElement('label');pauseSettings.className='fps-pause-setting';pauseSettings.innerHTML='<input type="checkbox"> FPS 표시';doc.querySelector('#pauseOverlay .modal-inner')?.append(pauseSettings);
 const toggle=settings.querySelector('input'),toggles=[toggle,pauseSettings.querySelector('input')],fpsText=panel.querySelector('[data-fps]'),averageText=panel.querySelector('[data-average]'),msText=panel.querySelector('[data-ms]');
 const cadence=new FrameCadence();let enabled=false;
 try{enabled=win.localStorage.getItem(FPS_STORAGE_KEY)==='true';}catch{/* Private/blocked storage: session-only preference. */}
 function reset(){cadence.reset();if(enabled){fpsText.textContent='—';averageText.textContent='—';msText.textContent='최근 3초 · 측정 준비';}}
 function setEnabled(value){enabled=!!value;panel.hidden=!enabled;for(const t of toggles)t.checked=enabled;reset();try{win.localStorage.setItem(FPS_STORAGE_KEY,String(enabled));}catch{}if(enabled)place();}
 function visibleRect(el){if(!el||el.hidden||el.closest('[hidden]'))return null;const s=win.getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return null;const r=el.getBoundingClientRect();return r.width&&r.height?r:null;}
 function place(){
  // Only runs with the 4 Hz text refresh. Never resize/reflow the game UI itself.
  const compact=win.innerWidth<700||!!doc.getElementById('agencyControl')||doc.body.classList.contains('cinematic');
  panel.classList.toggle('fps-compact',compact);
  const css=win.getComputedStyle(panel),inset=side=>Math.max(8,parseFloat(css.getPropertyValue('--fps-'+side))||0),left=inset('left'),right=inset('right'),top=inset('top'),bottom=inset('bottom');
  const w=panel.offsetWidth,h=panel.offsetHeight,v=win.visualViewport;
  const width=Math.min(v?.width??win.innerWidth,doc.documentElement.clientWidth||win.innerWidth),height=Math.min(v?.height??win.innerHeight,doc.documentElement.clientHeight||win.innerHeight);
  const x0=(v?.offsetLeft??0)+left,y0=(v?.offsetTop??0)+top,x1=Math.max(x0,(v?.offsetLeft??0)+width-right-w),y1=Math.max(y0,(v?.offsetTop??0)+height-bottom-h);
  const selector='#timerPanel,.topbar,#hud .quest,#dialogue,.modal:not([hidden]) .modal-inner,.part-result-card,.ending:not([hidden]) .ending-card,#actionControls button,#touchControls,.train-caption,.train-subtitles,#welcome:not([hidden]),#toast.show';
  let boxes=[...doc.querySelectorAll(selector)].map(visibleRect).filter(Boolean);
  const control=doc.getElementById('agencyControl')?.shadowRoot;
  if(control)boxes.push(...[...control.querySelectorAll('.topbar,.left-panel,.right-panel,footer,button,.region-control,.district-label,.compass,.map-legend,.map-scale')].map(visibleRect).filter(Boolean));
  const overlap=(x,y)=>boxes.reduce((n,r)=>n+Math.max(0,Math.min(x+w+4,r.right)-Math.max(x-4,r.left))*Math.max(0,Math.min(y+h+4,r.bottom)-Math.max(y-4,r.top)),0);
  // Prefer upper right; search perimeter when a HUD/modal occupies that corner.
  const positions=[[x1,y0],[x0,y0],[(x0+x1)/2,y0]];
  for(let y=y0+44;y<=y1;y+=44){positions.push([x1,y],[x0,y]);if(control)positions.push([(x0+x1)/2,y]);}
  positions.push([x1,y1],[x0,y1],[(x0+x1)/2,y1]);
  const best=positions.reduce((a,p)=>{const score=overlap(...p);return score<a.score?{p,score}:a;},{p:positions[0],score:Infinity}).p;
  const x=Math.round(best[0])+'px',y=Math.round(best[1])+'px';if(panel.style.left!==x)panel.style.left=x;if(panel.style.top!==y)panel.style.top=y;
 }
 for(const t of toggles)t.addEventListener('change',()=>setEnabled(t.checked));
 const key=e=>{if(e.code!=='F3'||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)setEnabled(!enabled);};
 win.addEventListener('keydown',key,true);
 doc.addEventListener('visibilitychange',reset);win.addEventListener('pageshow',reset);win.addEventListener('pagehide',reset);
 panel.hidden=!enabled;for(const t of toggles)t.checked=enabled;
 const api={get enabled(){return enabled;},setEnabled,tick(now){if(!enabled||doc.hidden)return;const s=cadence.sample(now);if(!s)return;fpsText.textContent=s.fps.toFixed(1);averageText.textContent=s.average.toFixed(1);msText.textContent=s.ms.toFixed(1)+' ms · 최근 3초';place();}};
 panel.fpsMeter=api;return api;
}
