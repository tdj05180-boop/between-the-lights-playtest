import {T} from '../experiments/spaces/kit.js';

// Baked local illumination for the distant, unlit city. No extra shadow maps or
// per-lamp realtime lights; clipping keeps pools off buildings and at each floor.
export function lightNightStreet(world,lamps,roads,footprints,ground){
 const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');
 const g=c.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,'rgba(245,225,173,.65)');g.addColorStop(.27,'rgba(236,218,173,.42)');
 g.addColorStop(.65,'rgba(226,214,181,.13)');g.addColorStop(1,'rgba(226,214,181,0)');
 c.fillStyle=g;c.fillRect(0,0,128,128);
 const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;
 const mat=new T.MeshBasicMaterial({map,transparent:true,opacity:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const positions=[],uv=[],indices=[],record=[];
 const inside=(x,z,r)=>Math.abs(x-r.x)<r.w/2&&Math.abs(z-r.z)<r.d/2;
 for(const l of lamps){
  const dx=Math.cos(l.angle),dz=-Math.sin(l.angle),cx=l.x+dx*3.5,cz=l.z+dz*3.5;
  const x1=cx-5.2,x2=cx+5.2,z1=cz-5.2,z2=cz+5.2;
  const nearby=[...roads,...footprints].filter(r=>r.x+r.w/2>x1&&r.x-r.w/2<x2&&r.z+r.d/2>z1&&r.z-r.d/2<z2);
  const xs=[...new Set([x1,x2,...nearby.flatMap(r=>[r.x-r.w/2,r.x+r.w/2]).filter(x=>x>x1&&x<x2)])].sort((a,b)=>a-b);
  const zs=[...new Set([z1,z2,...nearby.flatMap(r=>[r.z-r.d/2,r.z+r.d/2]).filter(z=>z>z1&&z<z2)])].sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
   const x=(xs[i-1]+xs[i])/2,z=(zs[j-1]+zs[j])/2;
   if(footprints.some(r=>inside(x,z,r)))continue;
   const road=roads.some(r=>inside(x,z,r)),y=ground+(road?.087:.196),start=positions.length/3;
   for(const [xx,zz] of [[xs[i-1],zs[j-1]],[xs[i-1],zs[j]],[xs[i],zs[j]],[xs[i],zs[j-1]]]){positions.push(xx,y,zz);uv.push((xx-x1)/10.4,(zz-z1)/10.4);}
   indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  record.push({x:l.x,z:l.z,head:[l.x+dx*1.15,ground+4.51,l.z+dz*1.15],pool:[cx,cz]});
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const pools=new T.Mesh(geo,mat);pools.name='2026Streetlights/ground-light';pools.renderOrder=1;world.add(pools);
 const lens=new T.InstancedMesh(new T.BoxGeometry(.53,.075,.225),new T.MeshBasicMaterial({color:0xffedba,toneMapped:false}),lamps.length);
 lens.name='2026Streetlights/lit-lenses';const m=new T.Matrix4(),q=new T.Quaternion();
 record.forEach((r,i)=>{q.setFromAxisAngle(new T.Vector3(0,1,0),lamps[i].angle);m.compose(new T.Vector3(...r.head),q,new T.Vector3(1,1,1));lens.setMatrixAt(i,m);});lens.computeBoundingSphere();world.add(lens);
 return {lamps:record,technique:'clipped baked ground pools and luminous lenses',dynamicLights:0,textures:1,drawCalls:2,triangles:indices.length/3+lamps.length*12};
}
