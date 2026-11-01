import * as T from '../src/vendor/three.module.min.js';
import {bevelBox,material,mesh} from '../src/models/pastel-shapes.js';
import {batchStatic} from '../src/models/static-batch.js';
export {T};
export const P={wall:0xd2d6c6,wallLight:0xe4e3d1,frame:0x628276,steel:0x899990,dark:0x3f5c54,wood:0xb6a07c,card:0xcabb99,floor:0xc7cbbd,road:0x909e97,line:0xf0e4b4,blue:0x789daa,red:0xb68e7c,glass:0xacc7c5,rubber:0x454e4b,green:0x8aab90};
export function workshop(root){
 const materials=new Map(),mat=(c,extra)=>{if(extra)return material(c,extra);if(!materials.has(c))materials.set(c,material(c));return materials.get(c);};
 const box=(w,h,d,c,x=0,y=0,z=0,parent=root,r=.035)=>mesh(parent,bevelBox(w,h,d,r),typeof c==='number'?mat(c):c,x,y,z);
 const cyl=(r,h,c,x=0,y=0,z=0,parent=root,n=12)=>mesh(parent,new T.CylinderGeometry(r,r,h,n),mat(c),x,y,z);
 const beam=(a,b,w,d,c,parent=root)=>{const va=new T.Vector3(...a),vb=new T.Vector3(...b),m=box(w,va.distanceTo(vb),d,c,0,0,0,parent);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return m;};
 const group=(x=0,y=0,z=0,parent=root)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;};
 // A shared sign atlas keeps all signs on one texture, including carton labels.
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const g=canvas.getContext('2d');g.fillStyle='#e9e5d1';g.fillRect(0,0,2048,1024);
 const labels=['01  입고 · 보관','02  분류 라인','03  출고 대기','04  하역장','01  파랑 · BLUE','02  빨강 · RED','보행 통로  →','관계자 전용','LIGHT / LOGISTICS','공간 디자인 스터디','입구  /  ENTRANCE','출고장  →','A-01  /  STORAGE','B-02  /  STORAGE','검수 · 작업대','WAREHOUSE  /  01'];
 labels.forEach((s,i)=>{const x=i%4*512,y=Math.floor(i/4)*256;g.fillStyle=i===4?'#6e94a4':i===5?'#b78c75':'#577b6b';g.fillRect(x+12,y+30,488,196);g.fillStyle='#f3eddb';g.font='600 '+(s.length>15?27:32)+'px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(s,x+256,y+128);});
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const signMat=material(0xffffff,{map:texture,roughness:1});
 function sign(id,w,h,x,y,z,parent=root){const geo=new T.PlaneGeometry(w,h),uv=geo.attributes.uv,col=id%4,row=Math.floor(id/4);for(let i=0;i<uv.count;i++)uv.setXY(i,(col+uv.getX(i))/4,1-(row+1-uv.getY(i))/4);const m=mesh(parent,geo,signMat,x,y,z);m.castShadow=false;return m;}
 function batch(target=root,excluded=new Set(),cellSize=8){const old=new Set();target.traverse(n=>{if(n.material&&!Array.isArray(n.material))old.add(n.material);});const result=batchStatic(target,excluded,{cellSize});const retained=new Set();root.traverse(n=>{for(const m of Array.isArray(n.material)?n.material:[n.material])if(m)retained.add(m);});for(const m of old)if(!retained.has(m))m.dispose();return result;}
 function stripe(x,z,w,d,color=P.line,parent=root){const m=box(w,.012,d,color,x,.121,z,parent,.001);m.castShadow=false;return m;}
 function arrow(x,z,angle=0,parent=root){const a=group(x,0,z,parent);a.rotation.y=angle;stripe(0,0,.15,1.5,P.line,a);const left=stripe(-.25,-.55,.15,.8,P.line,a);left.rotation.y=-.7;const right=stripe(.25,-.55,.15,.8,P.line,a);right.rotation.y=.7;return a;}
 return {root,mat,box,cyl,beam,group,sign,batch,stripe,arrow};
}
