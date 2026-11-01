import {T} from '../experiments/spaces/kit.js';
import {createStreetResident} from '../street-study/resident.js';
import {crossings} from './traffic-network.js';

// The 2003 resident factory owns fresh skeletons/materials. Only these local copies change.
export function trafficPedestrians(world,ground,box,dynamic,state,characters){
 const shared=new T.MeshStandardMaterial({vertexColors:true,roughness:.88});
 const palettes=[[0x758b96,0x516775],[0xb79983,0x867463],[0x918997,0x675e73],[0x889b8f,0x536a61],[0x8294ad,0x5b647b],[0xaa9690,0x736864],[0x9ba88c,0x6b795e]];
 const actors=state.walkers.map(p=>{if(characters){const a=characters.create(['woman','man','elder','professor','grandmother','distantMan','distantWoman'][p.id],{background:true});a.object.name='2026Traffic/resident-'+p.id;a.object.traverse(n=>{n.castShadow=false;});world.add(a.object);dynamic.add(a.object);a.object.rotation.y=Math.atan2(p.dx,p.dz);return a;}const a=createStreetResident(p.id%2?'neighbour':'guide'),skin=a.object.getObjectByName('TailoredHumanContinuousSurfaces');
  skin.material[0].color.setHex(palettes[p.id][0]);skin.material[1].color.setHex(palettes[p.id][1]);skin.material[4].color.setHex([0x393a38,0x554b44,0x787772][p.id%3]);
  // Bake each independent palette into vertex colours: one draw per skinned resident.
  const old=skin.geometry,g=old.toNonIndexed(),colors=new Float32Array(g.attributes.position.count*3);
  for(const group of g.groups){const c=skin.material[group.materialIndex].color;for(let i=group.start;i<group.start+group.count;i++){colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;}}
  g.setAttribute('color',new T.BufferAttribute(colors,3));g.clearGroups();skin.geometry=g;old.dispose();skin.material.forEach(m=>m.dispose());skin.material=shared;
  a.object.name='2026Traffic/resident-'+p.id;a.object.scale.setScalar(.95+(p.id%3)*.035);a.object.traverse(n=>{n.castShadow=false;});world.add(a.object);dynamic.add(a.object);a.object.rotation.y=Math.atan2(p.dx,p.dz);return a;});
 // Exact standing/walking glyph construction and clearance blink convention from
 // street-study/traffic-models.js, in a smaller modern metal housing.
 const textures=[0,1].map(i=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=80;const c=canvas.getContext('2d');c.fillStyle=c.strokeStyle='#fff';c.lineWidth=8;c.lineCap='round';c.beginPath();c.arc(32,13,7,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(32,26);c.lineTo(32,48);c.moveTo(32,29);c.lineTo(i?16:22,43);c.moveTo(32,29);c.lineTo(i?49:42,39);c.moveTo(32,48);c.lineTo(i?17:25,70);c.moveTo(32,48);c.lineTo(i?49:39,70);c.stroke();const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;return t;});
 const heads=[];for(const c of crossings)for(const side of [-1,1]){const x=c.vertical?c.x+1.4:c.x+side*(c.half+1.1),z=c.vertical?c.z+side*(c.half+1.1):c.z+1.4,yaw=c.vertical?(side>0?Math.PI:0):(side>0?-Math.PI/2:Math.PI/2),y=ground+2.35;
  box(.075,2.6,.075,0x667782,x,ground+1.3,z);box(.44,.88,.24,0x72818b,x,y,z,yaw);box(.36,.79,.25,0x202d35,x,y,z,yaw);box(.49,.045,.43,0x3c4d57,x,y+.47,z,yaw);heads.push({junction:c.junction,crosswalk:c.id,x,z,y,yaw});}
 const dummy=new T.Object3D(),color=new T.Color();const lamps=textures.map((map,i)=>{const mesh=new T.InstancedMesh(new T.PlaneGeometry(.28,.33),new T.MeshBasicMaterial({map,transparent:true,alphaTest:.1,depthWrite:false,toneMapped:false}),heads.length);mesh.name='2026Traffic/pedestrian-'+(i?'walk':'stop');mesh.frustumCulled=false;world.add(mesh);dynamic.add(mesh);heads.forEach((h,n)=>{dummy.position.set(h.x+Math.sin(h.yaw)*.132,h.y+(i?-.20:.20),h.z+Math.cos(h.yaw)*.132);dummy.rotation.set(0,h.yaw,0);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);});return mesh;});
 function update(dt){state.walkers.forEach((p,i)=>{const a=actors[i],c=crossings[i],edge=Math.abs(c.vertical?p.z-c.z:p.x-c.x)-c.half,t=T.MathUtils.smoothstep(edge,0,.6);a.object.position.set(p.x,ground+.075+.125*t,p.z);const yaw=Math.atan2(p.dx,p.dz),diff=Math.atan2(Math.sin(yaw-a.object.rotation.y),Math.cos(yaw-a.object.rotation.y));a.object.rotation.y+=diff*Math.min(1,dt*9);a.update({dt,speed:p.speed});});
  heads.forEach((h,n)=>{const signal=state.signals[h.junction].pedestrian,walk=signal==='green'||(signal==='clearance'&&Math.floor(state.time*3)%2===0);for(let i=0;i<2;i++){color.setHex((i?walk:signal==='red')?(i?0x70e09e:0xf07669):0x25312e);lamps[i].setColorAt(n,color);}});lamps.forEach(l=>l.instanceColor.needsUpdate=true);
 }
 return {update,heads,drawBatches:9};
}
