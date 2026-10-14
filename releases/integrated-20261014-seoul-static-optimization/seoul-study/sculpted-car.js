import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,mesh} from '../src/models/pastel-shapes.js';
import {batchStatic} from '../src/models/static-batch.js';

// Original procedural model. Same +X forward, axle X/Y, envelope and plate anchors.
const smooth=(a,b,t)=>{t=T.MathUtils.clamp((t-a)/(b-a),0,1);return t*t*(3-2*t)};
let reflection;
function glassMap(){if(reflection)return reflection;const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d'),v=g.createLinearGradient(0,0,0,64);v.addColorStop(0,'#b2c5ca');v.addColorStop(.40,'#6c858e');v.addColorStop(.49,'#35444e');v.addColorStop(1,'#18282f');g.fillStyle=v;g.fillRect(0,0,128,64);reflection=new T.CanvasTexture(c);reflection.colorSpace=T.SRGBColorSpace;return reflection;}
function surface(rows){const p=[],uv=[],idx=[],n=rows[0].length;rows.forEach((row,i)=>row.forEach((v,j)=>{p.push(...v);uv.push(i/(rows.length-1),j/(n-1));}));for(let i=0;i<rows.length-1;i++)for(let j=0;j<n-1;j++){const a=i*n+j;idx.push(a,a+1,a+n,a+1,a+n+1,a+n)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
export function sculptedCar(color,estate=false){
 const root=new T.Group(),wheels=[];root.name=estate?'RefinedEstate':'RefinedSedan';root.userData.forwardAxis=[1,0,0];root.userData.visualRevision='sculpted-ensemble-v1';
 const paint=new T.MeshStandardMaterial({color,roughness:.34,metalness:.22,side:T.DoubleSide}),rubber=new T.MeshStandardMaterial({color:0x242b2d,roughness:.86}),metal=new T.MeshStandardMaterial({color:0xadb5b7,roughness:.28,metalness:.65}),dark=new T.MeshStandardMaterial({color:0x303b3e,roughness:.58}),glass=new T.MeshStandardMaterial({color:0xe0eef0,map:glassMap(),roughness:.16,metalness:.28,side:T.DoubleSide}),red=new T.MeshStandardMaterial({color:0x983c39,roughness:.25,metalness:.1}),lamp=new T.MeshStandardMaterial({color:0xdbe2da,roughness:.22,metalness:.28});
 // Shared opaque finish allows vertex-colour batching; glazing is the only separate surface.
 for(const m of [paint,metal,dark,red,lamp]){m.roughness=.43;m.metalness=.16;m.side=T.FrontSide;}
 const wheelMetal=metal.clone();wheelMetal.roughness=rubber.roughness=.64;wheelMetal.metalness=rubber.metalness=.08;
 const box=(w,h,d,mat,x,y,z,p=root,r=.015)=>mesh(p,r>=.02?bevelBox(w,h,d,r):new T.BoxGeometry(w,h,d),mat,x,y,z);
 const line=(points,r,mat,p=root)=>mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),Math.max(4,points.length*2),r,4,false),mat);
 function skin(rows,mat){return mesh(root,surface(rows),mat)}
 // The rocker sits below the axle, while each wheel has a separate opening.
 // Explicit semicircle samples and vertical returns avoid stretched triangles
 // at the arch ends; wheel centres, rolling radius and ground contact stay fixed.
 const sill=x=>.205+.135*smooth(1.60,2,Math.abs(x)),profile=[];
 for(let i=0;i<=80;i++){const x=-2+i*.05;if([-1.22,1.22].every(cx=>Math.abs(x-cx)>.385))profile.push([x,sill(x)]);}
 for(const cx of [-1.22,1.22]){
  profile.push([cx-.385,sill(cx-.385)]);
  for(let i=0;i<=20;i++){const a=Math.PI-i*Math.PI/20;profile.push([cx+.385*Math.cos(a),.345+.385*Math.sin(a)]);}
  profile.push([cx+.385,sill(cx+.385)]);
 }
 profile.sort((a,b)=>a[0]-b[0]);
 const rows=[];for(const [x,bottom] of profile){const width=.795-.115*(Math.abs(x)/2)**5,top=.952-.105*(Math.abs(x)/2)**3,lowerWidth=width*(.97-.07*smooth(1.60,2,Math.abs(x)));
 rows.push([[x,top+.024,0],[x,top+.01,width*.70],[x,top-.025,width*.93],[x,top-.095,width],[x,Math.max(bottom+.018,top-.235),width],[x,bottom,lowerWidth],[x,bottom,0],[x,bottom,-lowerWidth],[x,Math.max(bottom+.018,top-.235),-width],[x,top-.095,-width],[x,top-.025,-width*.93],[x,top+.01,-width*.70],[x,top+.024,0]]);}
 skin(rows,paint);
 for(const end of [-1,1]){const edge=end<0?rows[0]:rows.at(-1),g=surface(end<0?[edge.map(([x,y,z])=>[x,.65,0]),edge]:[edge,edge.map(([x,y,z])=>[x,.65,0])]);mesh(root,g,paint);box(.035,.13,1.22,dark,end*2.014,.515,0);box(.025,.035,1.14,metal,end*2.036,.565,0);}
 const rear=estate?-1.48:-1.31,roofRear=estate?-.99:-.72;
 const topAt=x=>x<roofRear?.965+.391*smooth(rear,roofRear,x):x>.25?1.356-.366*smooth(.25,.94,x):1.356+.020*Math.sin((x-roofRear)/(.25-roofRear)*Math.PI);
 const canopy=[];for(let i=0;i<=24;i++){const x=rear+(.94-rear)*i/24,h=topAt(x),rise=smooth(.98,1.32,h),w=.73-.12*rise;canopy.push([[x,.949,-.741],[x,h-.025,-w],[x,h+.006,-w*.7],[x,h+.025,0],[x,h+.006,w*.7],[x,h-.025,w],[x,.949,.741]]);}skin(canopy,paint);
 // Side glass inset in its own curved recess; width follows cabin taper.
 const sideZ=y=>.746-(y-.95)*.335;
 function windowSide(xs,side){const r=[];for(let i=0;i<=16;i++){const x=xs[0]+(xs[1]-xs[0])*i/16,hi=topAt(x)-.048,lo=.998;r.push([[x,lo,side*sideZ(lo)],[x,Math.max(lo+.005,hi),side*sideZ(hi)]]);}skin(r,glass);line(r.map(v=>v[1]),.012,dark);line(r.map(v=>v[0]),.012,dark);for(const v of [r[0],r[16]])line(v,.015,dark);}
 for(const side of [-1,1]){windowSide([rear+.14,-.20],side);windowSide([-.11,.76],side);
  const z=side*.799;line([[-1.55,.916,z],[-.6,.93,z],[.4,.93,z],[1.65,.895,z]],.006,metal);
  for(const x of [-.16,.78])line([[x,.89,z],[x+.015,.70,z],[x-.025,.28,z]],.005,dark);
  for(const x of [-.37,.56])box(.17,.023,.027,metal,x,.895,z+side*.006);
  box(.255,.112,.16,paint,.58,1.017,side*.849,root,.034);box(.17,.07,.016,glass,.56,1.025,side*.935);
  // Trim belongs to the rocker between wheel openings, never across a tire.
  box(1.57,.032,.038,dark,0,.237,side*.766);
 }
 // Front / rear glazing follow the curved roof profile, not a flat rectangular roof extrusion.
 for(const [a,b] of [[.34,.875],[rear+.05,roofRear-.03]]){const rs=[];for(let i=0;i<=10;i++){const x=a+(b-a)*i/10,h=topAt(x),w=.73-.12*smooth(.98,1.32,h);const row=[];for(let j=0;j<=8;j++){const u=-.92+1.84*j/8;row.push([x,h+.045-.05*Math.abs(u)**2,w*u]);}rs.push(row);}skin(rs,glass);line(rs[0],.011,dark);line(rs.at(-1),.011,dark);}
 for(const side of [-1,1]){line([[.87,1.001,side*.06],[.74,1.08,side*.52]],.007,dark);
  box(.033,.105,.39,lamp,2.005,.788,side*.45,root,.027);box(.04,.019,.33,lamp,2.029,.818,side*.45,root,.006);
  box(.035,.092,.4,red,-2.004,.790,side*.45,root,.023);box(.041,.016,.34,lamp,-2.023,.804,side*.45,root,.004);
 }
 box(.035,.018,.44,metal,2.039,.87,0);box(.03,.022,.65,metal,-2.027,.885,0);
 for(let j=0;j<4;j++)box(.028,.008,.53,dark,2.029,.59+j*.035,0,root,.001);
 for(const side of [-1,1])for(const x of [-1.22,1.22]){
  // Recess tire and hub into the existing arch. Preserve axle height/radius and
  // longitudinal position; the complete rolling assembly stays behind the fender.
  const wheel=new T.Group();wheel.name='rolling-wheel';wheel.position.set(x,.345,side*.635);root.add(wheel);wheels.push(wheel);
  const tire=mesh(wheel,new T.TorusGeometry(.270,.075,8,24),rubber);tire.scale.z=1.32;
  const drum=mesh(wheel,new T.CylinderGeometry(.205,.205,.14,24),rubber);drum.rotation.x=Math.PI/2;
  const outer=mesh(wheel,new T.TorusGeometry(.208,.014,6,32),wheelMetal,0,0,side*.106);
  const hub=mesh(wheel,new T.CylinderGeometry(.056,.056,.03,16),wheelMetal,0,0,side*.115);hub.rotation.x=Math.PI/2;
  for(let n=0;n<5;n++){const a=n*Math.PI*2/5;line([[Math.sin(a)*.05,Math.cos(a)*.05,side*.12],[Math.sin(a+.12)*.13,Math.cos(a+.12)*.13,side*.112],[Math.sin(a+.18)*.197,Math.cos(a+.18)*.197,side*.105]],.019,wheelMetal,wheel);}
  batchStatic(wheel,new Set());
 }
 root.scale.x=1.075;batchStatic(root,new Set(wheels));root.userData.modelBounds={length:4.4,width:1.91,height:1.40};
 return {root,update(distance){for(const w of wheels)w.rotation.z=-distance/.345;}};
}
