export function isStandalone(win){
 return !!(win?.navigator?.standalone===true||win?.matchMedia?.('(display-mode: standalone)').matches);
}

// UA hints only select copy; they never gate the game or attempt installation.
export function appleInstallMode(nav,standalone=false){
 const ua=nav?.userAgent??'';
 const apple=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&nav.maxTouchPoints>1);
 if(!apple||standalone)return null;
 const other=/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\/|KAKAOTALK|NAVER|Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(ua);
 const safari=!other&&/Version\/[\d.]+.*Safari\//.test(ua);
 return safari?'safari':'open-safari';
}
