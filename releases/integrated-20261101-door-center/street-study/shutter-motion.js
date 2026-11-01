// Presentation only: effort, score and all minigame deadlines stay in life-shutter.
export const SHUTTER={sillY:.20,railHalf:.065,travel:1.65,openingTop:2.475,damping:7};
const clamp=v=>Math.max(0,Math.min(1,v));
export function createShutterMotion(){
 let contactLatched=false;
 const s={progress:0,target:0,focus:false,closing:false,direction:'idle',contacts:0,
  bottomY:SHUTTER.sillY+SHUTTER.railHalf,aperture:0,openingFraction:0};
 function pose(previous,dt){
  s.aperture=s.progress*SHUTTER.travel;s.bottomY=SHUTTER.sillY+SHUTTER.railHalf+s.aperture;
  s.openingFraction=s.aperture/(SHUTTER.openingTop-SHUTTER.sillY);
  const velocity=dt>0?(s.progress-previous)*SHUTTER.travel/dt:0;
  s.direction=Math.abs(velocity)<.006?'idle':velocity>0?'up':'down';
  if(!s.closing)contactLatched=false;
  if(s.closing&&s.progress===0&&!contactLatched){s.contacts++;contactLatched=true;}
 }
 s.update=dt=>{if(dt<=0)return;const previous=s.progress;s.progress+=(clamp(s.target)-s.progress)*(1-Math.exp(-SHUTTER.damping*dt));if(Math.abs(s.progress-clamp(s.target))<.0005)s.progress=clamp(s.target);pose(previous,dt);};
 s.setProgress=value=>{const previous=s.progress;s.progress=clamp(value);pose(previous,0);};
 return s;
}
// The return bend stays inside the existing opaque head box (not through the shop wall).
export function shutterSlatPose(y){const h=2.58,r=.10,a=Math.max(0,Math.min(Math.PI,(y-h)/r));return y<=h?{y,z:-.65,a:0,visible:true}:{y:h+Math.sin(a)*r,z:-.75+Math.cos(a)*r,a,visible:(y-h)/r<Math.PI};}
