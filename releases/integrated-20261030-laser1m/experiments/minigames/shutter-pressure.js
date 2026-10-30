// Approved local v4: fixed maximum lifting effort, continuous pressure, and
// progressive load over the final five/three seconds. No scripted height curve.
export function createShutterPressure({maxMs,graceMs}){
 let amount=.5,time=0,done=false,taps=0,effort=0;
 const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
 function advance(ms){
  if(done)return;
  const end=Math.max(time,Math.min(ms,maxMs));
  while(time<end&&!done){
   const dt=Math.min(1000/240,end-time)/1000,t=(time+dt*500)/1000;
   const decay=Math.exp(-dt/.35),average=effort*.35*(1-decay)/dt;
   const weight=.23+.010+.27*(t/(maxMs/1000))+.30*smooth((amount-.35)/.55)+.30*smooth((t-(maxMs/1000-5))/5)+.055*smooth((t-(maxMs/1000-3))/3);
   amount=Math.max(0,Math.min(.95,amount+(.72*average-weight)*dt));
   effort*=decay;time+=dt*1000;
   if(amount===0&&time>=graceMs)done=true;
  }
  if(time>=maxMs)done=true;
 }
 return {advance,tap(ms){advance(ms);if(!done){effort=Math.min(1,effort+.40);taps++;}},get state(){return {amount,time,done,taps,effort};}};
}
