const $=id=>document.getElementById(id);
export function createAudio(isPaused,isStarted,{musicActive=isStarted}={}){
let musicGain=null,bgmVolume=.24,sfxVolume=.65,unlocked=false,fadeUntil=0;
let audioCtx=null,master=null,musicTimer=null,muted=true,noteIndex=0;
function tone(freq,vol=.06,length=.35,type='sine',delay=0,music=false){if(!audioCtx||muted)return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();if(!music)vol*=sfxVolume/.65;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g);g.connect(music?musicGain:master);o.start(t);o.stop(t+length+.04)}
function initAudio(){if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioCtx=new C();master=audioCtx.createGain();master.gain.value=.6;master.connect(audioCtx.destination);musicGain=audioCtx.createGain();musicGain.gain.value=1;musicGain.connect(master);musicTimer=setInterval(()=>{if(document.hidden||isPaused()||!musicActive()||muted)return;const notes=[261.63,329.63,392,329.63,220,293.66,349.23,293.66];tone(notes[noteIndex%8],.018,2.5,'sine',0,true);if(noteIndex%4===0)tone(notes[noteIndex%8]/2,.022,3.8,'sine',0,true);noteIndex++},720)}audioCtx.resume().catch(()=>{});if(!unlocked){muted=false;unlocked=true;}updateSound()}
function updateSound(){$('soundState').textContent=muted?'OFF':'ON';$('soundBtn').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');if(master)master.gain.setTargetAtTime(muted?0:.6,audioCtx.currentTime,.08)}
function chime(){tone(523.25,.045,.8);tone(659.25,.034,.8,'sine',.12);tone(783.99,.026,1.15,'sine',.25)}

return {tone,chime,start:initAudio,
setVolume(kind,value){if(kind==='bgm'){bgmVolume=Number(value);if(musicGain&&!fadeUntil)musicGain.gain.value=bgmVolume/.24;}else sfxVolume=Number(value);},
fadeMusic(value,seconds=1){if(!audioCtx)return;const t=audioCtx.currentTime;musicGain.gain.cancelScheduledValues(t);musicGain.gain.setValueAtTime(musicGain.gain.value,t);musicGain.gain.linearRampToValueAtTime(value*bgmVolume/.24,t+seconds);fadeUntil=t+seconds;},
snapshot(){return {unlocked,muted,musicActive:musicActive(),musicGain:musicGain?.gain.value??0,context:audioCtx?.state??'locked',time:audioCtx?.currentTime??0,bgmVolume,sfxVolume,noteIndex};},
dispose(){clearInterval(musicTimer);audioCtx?.close();},toggle(){if(!audioCtx)initAudio();else{muted=!muted;audioCtx.resume().catch(()=>{});updateSound()}},pause(value){if(!audioCtx)return;if(value)audioCtx.suspend().catch(()=>{});else if(!muted)audioCtx.resume().catch(()=>{});}};
}
