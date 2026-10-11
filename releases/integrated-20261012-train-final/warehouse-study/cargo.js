// Truck deck top: -1.04 + 1.28 + .035 = .275m. Parcel half-height: .215m.

export const LOAD_SECONDS=1;
export function cargoSlot(truck,index){
 if(index<0||index>=12)throw Error('Truck cargo slots exhausted');
 return {x:truck.x+(index%3-1)*.62,y:.49+(Math.floor(index/3)%2)*.445,z:-17.65-Math.floor(index/6)*.62};
}
// Lift above the dock bollards and existing cargo, align with the opening, enter, lower.
export function loadPosition(from,to,progress){
 const points=[from,{x:from.x,y:2.05,z:from.z},{x:to.x,y:2.05,z:from.z},{x:to.x,y:2.05,z:to.z},to];
 const segment=Math.min(3,Math.floor(Math.min(1,progress)*4)),u=Math.min(1,progress)*4-segment,t=u*u*(3-2*u),a=points[segment],b=points[segment+1];
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
}

