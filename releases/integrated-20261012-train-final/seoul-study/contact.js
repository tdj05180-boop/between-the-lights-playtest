import {carContactTime} from './traffic.js';

// Include mirrors/body bevels and the character's arms, not just its foot collider.
export const CONTACT={carX:2.32,carZ:1.04,playerRadius:.43};
const shape={x:CONTACT.carX,z:CONTACT.carZ},r=CONTACT.playerRadius;
export const contactTime=(p,previous,car)=>carContactTime(p,previous,car,r,shape);

// Lateral separation is retired; only the accepted swept hit envelope remains.
