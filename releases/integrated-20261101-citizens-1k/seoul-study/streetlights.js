import {T} from '../experiments/spaces/kit.js';
import {bevelBox} from '../src/models/pastel-shapes.js';

// Daytime street furniture. All poles are outside the unchanged walkable boundary.
export const seoulLampAnchors=[
 ...[-123.5,-96.5,-69.5,-51.5,-19,20.5,60.5,87.5,114.5].map(x=>({x,z:-7.35,reach:1.8})),
 ...[-114.5,-87.5,-60.5,-18.5,20.5,51.5,78.5,105.5,132.5].map(x=>({x,z:7.35,reach:1.8})),
 {x:4.1,z:-11.14,reach:3.1},{x:-12.3,z:11.14,reach:3.1}
];
export function addSeoulStreetlights(k,trees){
 const metal=new T.MeshStandardMaterial({color:0x718183,roughness:.5,metalness:.36}),dark=new T.MeshStandardMaterial({color:0x536b6f,roughness:.58,metalness:.2}),lens=new T.MeshStandardMaterial({color:0xd3d9d2,roughness:.45});
 const report={lamps:[],daytime:true,additionalLights:0};
 const stemGeo=new T.CylinderGeometry(.057,.09,5.70,12),baseGeo=bevelBox(.24,.10,.24,.015),housing=bevelBox(.29,.13,.63,.035),diffuser=bevelBox(.235,.025,.51,.008);
 for(const a of seoulLampAnchors){
  const side=Math.sign(a.z),root=new T.Group();root.name='SeoulStreetlight';root.position.set(a.x,.145,a.z);root.rotation.y=side<0?0:Math.PI;k.world.add(root);
  const add=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;};
  add(baseGeo,metal,0,.05,0);add(stemGeo,metal,0,2.85,0);
  const path=new T.CatmullRomCurve3([[0,5.52,0],[0,5.96,.09],[0,6.12,.40],[0,6.16,a.reach-.22],[0,6.13,a.reach]].map(v=>new T.Vector3(...v)));
  add(new T.TubeGeometry(path,18,.045,7,false),metal,0,0,0);
  add(housing,dark,0,6.10,a.reach);add(diffuser,lens,0,6.034,a.reach);
  add(bevelBox(.09,.34,.018,.008),dark,0,.62,-.092);
  // The two centre-block poles use existing gaps between shops, behind the
  // playable edge, with longer arms. No new invisible obstacle is introduced.
  report.lamps.push({...a,baseWidth:.24,height:6.39,minTreeDistance:Math.min(...trees.map(t=>Math.hypot(a.x-t.x,a.z-t.z)))});
 }
 k.world.userData.seoulStreetlights=report;return report;
}
