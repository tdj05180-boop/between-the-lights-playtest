import {officeConnections} from '../src/models/office-connections.js';
import {cablePath} from './furniture-cable.js';

export function connectOffice2019(k,p,ports,pc,tx){
 const c=officeConnections(k,p),sx=tx*.44,fx=sx+(tx<0?1:-1)*.21;
 const floor=c.floorBox(fx,.08),lan=c.rj45([tx,.46,-.246],[0,0,-1],'PC-RJ45');
 const wire=(name,points,r,color)=>c.cable(name,points,cablePath,r,color);
 // Retain the approved video path and the monitor's rear-edge drop.
 wire('monitor-data',[ports.data,[-.10,1.28,-.37],[-.10,1.14,-.62],[-.10,.56,-.62],[tx,.55,-.62],[tx,.566,-.33],pc.data],.0055);
 const mp=floor.power[0],pp=floor.power[1],lp=floor.lan;
 wire('monitor-power',[ports.power,[.12,1.27,-.39],[.16,1.13,-.66],[.16,.38,-.66],[mp[0],.25,-.48],[mp[0],.25,mp[2]],mp]);
 wire('tower-power',[pc.power,[tx,.30,-.38],[tx*.75,.26,-.39],[pp[0],.25,-.25],[pp[0],.25,pp[2]],pp]);
 wire('PC-LAN',[lan,[tx,.46,-.38],[tx,.20,-.46],[lp[0],.17,-.46],[lp[0],.17,-.12],[lp[0],.245,lp[2]],lp],.0035,0x647d7c);
}
