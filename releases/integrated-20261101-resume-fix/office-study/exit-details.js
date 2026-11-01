import {T} from '../experiments/spaces/kit.js';
import {cablePath} from './furniture-cable.js';

// A visual-only recess beyond the existing north door. Never register walkable
// space, collision boxes, interactions or progression here.
export function addExitVestibule(k){
 const root=new T.Group();root.name='2019-exit-vestibule';k.world.add(root);
 const b=(name,w,h,d,color,x,y,z)=>{
  const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),k.mat(color));
  mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;
 };
 // Inner end at -10.26: 2.65 m beyond the back face of the old door wall.
 // Floor overlaps the original threshold below its surface, avoiding z-fighting.
 b('vestibule-floor',3.12,.16,2.92,0x424c49,0,.045,-8.96);
 for(const x of [-1.48,1.48]){
  b('vestibule-side-wall',.16,3.10,2.92,0x59645d,x,1.675,-8.96);
  b('vestibule-base-trim',.035,.13,2.84,0x35483f,x-Math.sign(x)*.092,.195,-8.96);
 }
 b('vestibule-end-wall',3.12,3.10,.16,0x505d55,0,1.675,-10.34);
 b('vestibule-end-trim',2.8,.13,.035,0x35483f,0,.195,-10.244);
 b('vestibule-ceiling',3.12,.14,2.92,0x384640,0,3.295,-8.96);
 b('vestibule-lamp-body',.64,.065,.27,0x303c37,0,3.1875,-9.0);
 const diffuser=b('vestibule-lamp-diffuser',.54,.018,.19,0xc7c8af,0,3.146,-9.0);
 diffuser.material=new T.MeshStandardMaterial({color:0xa8af99,roughness:1,emissive:0xc6c9a9,emissiveIntensity:.35});diffuser.castShadow=false;
 const light=new T.PointLight(0xcbd1b4,1.1,3.4,2);light.name='2019-vestibule-dim-light';light.position.set(0,3.06,-9.0);light.castShadow=false;k.scene.add(light);
 return root;
}

// Added only by the 2019 scene, not by the furniture factory shared with the warehouse.
export function addOfficeLan(k,desk){
 const side=desk.position.x<0?-1:1,tx=side*.83;
 const box=(w,h,d,c,x,y,z)=>k.box(w,h,d,c,x,y,z,desk);
 // Rear tower network socket and a separate flush floor data outlet under the desk.
 box(.038,.025,.032,0x303b3a,tx,.46,-.255);
 box(.12,.012,.13,0x586761,tx,.142,-.48);
 box(.046,.019,.04,0x9a9d8c,tx,.1575,-.48);
 box(.031,.019,.025,0x526965,tx,.1765,-.48);
 const anchors=[[tx,.46,-.271],[tx,.46,-.35],[tx+side*.08,.34,-.43],[tx+side*.08,.225,-.48],[tx,.205,-.48],[tx,.186,-.48]];
 const path=cablePath(anchors),wire=new T.Mesh(new T.TubeGeometry(path,32,.0055,4,false),k.mat(0x617975));
 wire.name='2019-cable-lan';wire.castShadow=false;wire.receiveShadow=true;desk.add(wire);
 const entry={desk:desk.name,anchors,samples:path.getPoints(200).map(v=>v.toArray())};
 (k.world.userData.officeLan2019??=[]).push(entry);
 return wire;
}
