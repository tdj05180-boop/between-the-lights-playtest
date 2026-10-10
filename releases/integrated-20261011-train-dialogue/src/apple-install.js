import {appleInstallMode,isStandalone} from './systems/webapp-mode.js';
const key='between-lights:apple-install-dismissed';

export function bindAppleInstall({win=window,doc=document,storage,mode}={}){
 const welcome=doc.getElementById('welcome');if(!welcome)return ()=>{};
 // On the hosted release, use the stable repository root so installed shortcuts
 // follow future release redirects. Local copies use their own project root.
 const root=win.location.pathname.startsWith('/between-the-lights-playtest/')
  ?new URL('/between-the-lights-playtest/',win.location.href):new URL('../',import.meta.url);
 for(const [id,path] of [['appManifest','manifest.webmanifest'],['appTouchIcon','pwa/apple-touch-icon.png']]){
  const link=doc.getElementById(id);if(link)link.href=new URL(path,root).href;
 }
 try{storage??=win.sessionStorage;}catch{}
 let dismissed=false;try{dismissed=storage?.getItem(key)==='1';}catch{}
 const kind=mode??appleInstallMode(win.navigator,isStandalone(win));
 if(!kind||dismissed)return ()=>{};
 const card=doc.createElement('aside');card.id='appleInstallHint';card.className='apple-install-hint';card.setAttribute('aria-label','iPhone·iPad 사용자 안내');
 const title=doc.createElement('strong');title.textContent='iPhone·iPad 사용자 안내';
 const copy=doc.createElement('p');copy.textContent=kind==='safari'
  ?"더 넓은 화면으로 플레이하려면 Safari의 공유 메뉴에서 '홈 화면에 추가'를 선택하세요."
  :'홈 화면에 추가하려면 이 페이지를 Safari에서 열어 주세요.';
 const optional=doc.createElement('p');optional.className='install-optional';optional.textContent='설치하지 않아도 바로 플레이할 수 있습니다.';
 const close=doc.createElement('button');close.type='button';close.className='install-dismiss';close.textContent='×';close.setAttribute('aria-label','홈 화면 안내 닫기');
 const dismiss=()=>{dismissed=true;card.remove();try{storage?.setItem(key,'1');}catch{}};
 close.addEventListener('click',dismiss);card.append(title,copy,optional,close);welcome.append(card);
 const media=win.matchMedia?.('(display-mode: standalone)');
 const sync=()=>{if(isStandalone(win))card.remove();};media?.addEventListener?.('change',sync);
 return ()=>{close.removeEventListener('click',dismiss);media?.removeEventListener?.('change',sync);card.remove();};
}

if(typeof document!=='undefined'&&document.getElementById('appManifest'))bindAppleInstall();
