import {sculptedCar} from './sculpted-car.js';
import {attachLicensePlates} from '../src/models/license-plates.js';
export function modernCar(color,estate=false){return sculptedCar(color,estate);}
// Copies share immutable mesh buffers/materials, with independent wheel transforms.
export function copyCar(template,plate){const root=template.root.clone(true),wheels=[];root.position.set(0,0,0);root.rotation.set(0,0,0);root.updateMatrix();root.traverse(n=>{if(n.name==='rolling-wheel')wheels.push(n);});attachLicensePlates(root,plate);return {root,update(distance){for(const w of wheels)w.rotation.z=-distance/.345;}};}
export function poseCar(model,car){const [fx,,fz]=model.root.userData.forwardAxis,localHeading=Math.atan2(-fz,fx);model.root.rotation.set(0,(car.dir<0?Math.PI:0)-localHeading,0);model.root.position.set(car.x,.13,car.z);model.update(car.distance);}
