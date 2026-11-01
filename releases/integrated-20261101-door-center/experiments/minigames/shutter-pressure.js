// Approved local v4: fixed maximum lifting effort, continuous pressure, and
// Progressive load over the final third/fifth of the round. No scripted height curve.
export function createShutterPressure({maxMs,graceMs}){
 let amount=.5,time=0,done=false,taps=0,effort=0;
 const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
 function advance(ms){
  if(done)return;
  const end=Math.max(time,Math.min(ms,maxMs));
  while(time<end&&!done){
   const dt=Math.min(1000/240,end-time)/1000,t=(time+dt*500)/1000;
   const decay=Math.exp(-dt/.35),average=effort*.35*(1-decay)/dt;
   const progress=t/(maxMs/1000);
   const weight=.23+.010+.27*progress+.30*smooth((amount-.35)/.55)+.30*smooth((progress-2/3)*3)+.055*smooth((progress-.8)*5);
   // Compress the original 15-second height response, retaining real-time tap cadence.
   amount=Math.max(0,Math.min(.95,amount+(.72*average-weight)*dt*(15000/maxMs)));
   effort*=decay;time+=dt*1000;
   if(amount===0&&time>=graceMs)done=true;
  }
  if(time>=maxMs)done=true;
 }
 return {advance,tap(ms){advance(ms);if(!done){effort=Math.min(1,effort+.40);taps++;}},get state(){return {amount,time,done,taps,effort};}};
}
