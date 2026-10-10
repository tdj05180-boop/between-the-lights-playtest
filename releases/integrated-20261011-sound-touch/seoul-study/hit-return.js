// Active GameTime supplied by the minigame, never independent wall time.
export const HIT_RETURN={flinchMs:100,fadeOutMs:400,settleMs:650,fadeInMs:300,immuneMs:1000};
const smooth=t=>t*t*(3-2*t);
export function returnFrame(age){
 const {flinchMs:a,fadeOutMs:b,settleMs:c,fadeInMs:d}=HIT_RETURN;
 age=Math.max(0,age);const moveAt=a+b,lightAt=moveAt+c,end=lightAt+d;
 const opacity=age<a?0:age<moveAt?smooth((age-a)/b):age<lightAt?1:age<end?1-smooth((age-lightAt)/d):0;
 return {phase:age<a?'flinch':age<moveAt?'fade-out':age<lightAt?'covered':age<end?'fade-in':'done',opacity,relocate:age>=moveAt,done:age>=end,reaction:age<moveAt?Math.sin(Math.PI*Math.min(1,age/250)):0};
}
