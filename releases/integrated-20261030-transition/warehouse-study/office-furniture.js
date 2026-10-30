import {T} from './geometry.js';
import {officeFurniture2019} from '../office-study/furniture.js';
import {cablePath} from '../office-study/furniture-cable.js';

// Visual-only warehouse instances: the 2019 source and its scene remain untouched.
export function addWarehouseOfficeFurniture(k,parent){
 const stations=[];
 for(const [index,z] of [8.25,10.95].entries()){
  const root=k.group(19.6,.0361,z,parent);
  root.name='warehouse-office-workstation-'+index;
  root.rotation.y=-Math.PI/2;root.scale.setScalar(.85);
  const furniture=officeFurniture2019({world:root,box:k.box,mat:k.mat});
  furniture.workstation(0,0,index);
  const desk=root.getObjectByName('2019-desk-'+index);
  // Set the reused casters on this room's finished floor.
  root.getObjectByName('2019-chair-'+index).position.y-=.008;
  // Plain, muted LCDs; no dispatch dashboards or period-specific branding.
  const screen=root.getObjectByName('2019-monitor-off-'+index);
  screen.material.color.setHex(0xa7bab0);
  screen.material.emissive.setHex(0x344c42);screen.material.emissiveIntensity=.12;
  // Retain the reused monitor/data/power leads and plugged floor power box.
  // Add a separate tower LAN socket and a wall jack, routed behind the desk.
  // Plate thickness .024 at scale .85: its back meets the wall at X=21.62.
  const rear=-(21.6098-19.6)/.85;
  k.box(.038,.025,.032,0x303b3a,.83,.46,-.255,desk,.003);
  k.box(.10,.15,.024,0xd7d7c7,.83,.46,rear,desk,.004);
  k.box(.043,.034,.015,0x586761,.83,.46,rear+.0195,desk,.002);
  const points=[[.83,.46,-.271],[.83,.46,-.38],[.83,.25,-.72],[.83,.22,rear+.18],[.83,.46,rear+.12],[.83,.46,rear+.027]];
  const curve=cablePath(points),cable=new T.Mesh(new T.TubeGeometry(curve,48,.0055,4,false),k.mat(0x667d87));
  cable.name='warehouse-office-lan';cable.castShadow=false;cable.receiveShadow=true;desk.add(cable);
  root.userData.lan={anchors:points,samples:curve.getPoints(200).map(p=>p.toArray())};
  stations.push(root);
 }
 return stations;
}
