import {CameraRig} from './camera.js';
export const EXPLORATION_CAMERA=Object.freeze({yaw:0,pitch:Math.PI/12,distance:3.8,height:1.4,fov:60});
// Scene-authored cinematics still use CameraRig.select/snapshot/restore.
export class GameplayCamera extends CameraRig {
 constructor(){super();this.commonThirdPerson=true;this.study=true;this.height=1.4;this.fov=60;this.select('free');}
 configure(presets){super.configure(presets);this.presets.free={...EXPLORATION_CAMERA};}
 rotate(dx,dy=0){if(!this.acceptsInput)return;this.yaw+=dx;this.pitch=Math.max(-Math.PI/9,Math.min(5*Math.PI/12,this.pitch+dy));}
 zoom(){} // No player-controlled distance changes, including legacy calls.
 snapshot(){return {...super.snapshot(),height:this.height,fov:this.fov};}
 restore(state){super.restore(state);if(this.mode==='free'){this.distance=3.8;this.height=1.4;this.fov=60;}}
}
