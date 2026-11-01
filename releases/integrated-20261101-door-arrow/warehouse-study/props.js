import {P,T} from './geometry.js';
import {warehouseTruck} from './truck-model.js';
import {warehouseForklift} from './forklift-model.js';
import {rackFrame,conveyorDrive} from './equipment-details.js';
export function pallet(k,x,z,{stack=0,color=P.card,parent=k.root,stock='rice'}={}){const g=k.group(x,.065,z,parent);for(const dz of [-.46,0,.46])k.box(1.25,.11,.16,P.wood,0,.1,dz,g,.01);for(const dx of [-.48,0,.48])for(const dz of [-.42,.42])k.box(.15,.14,.2,P.wood,dx,.22,dz,g,.012);for(let i=0;i<5;i++)k.box(.21,.09,1.05,P.wood,-.48+i*.24,.335,0,g,.01);for(let layer=0;layer<stack;layer++)for(const dx of [-.3,.3])for(const dz of [-.25,.25]){const variation=layer*4+(dx>0?2:0)+(dz>0?1:0);if(k.foodCargo)k.foodCargo.stock(g,stock,dx,(stock==='rice'?.46:.63)+layer*(stock==='rice'?.165:.46),dz,variation);else carton(k,dx,.63+layer*.46,dz,{parent:g,color});}return g;}
export function carton(k,x,y,z,{parent=k.root,color=P.card}={}){const g=k.group(x,y,z,parent);k.box(.56,.44,.46,color,0,0,0,g,.024);k.box(.066,.014,.45,P.wallLight,0,.226,0,g,.002);k.box(.066,.32,.014,P.wallLight,0,.05,.236,g,.002);k.box(.18,.09,.018,0x9d9177,.15,.03,.239,g,.008);for(let i=0;i<5;i++)k.box(.008,.055,.003,P.dark,.095+i*.016,-.095,.242,g,.001);return g;}
export function rack(k,x,z,{length=7,height=5.5,loaded=true}={}){const g=k.group(x,0,z);rackFrame(k,g,length,height);for(const y of [.5,2.2,3.9]){k.box(1.5,.085,length-.1,P.wallLight,0,y+.05,0,g,.01);if(loaded)for(const dz of [-2.35,0,2.35]){const p=pallet(k,0,dz,{stack:2,parent:g,stock:'food'});p.position.y=y+.0475;}}
 k.sign(x< -15?12:13,1.3,.45,0,height+.15,length/2+.08,g);return g;}
export function conveyor(k,x,z,{length=12,rotation=0,openEnds=false}={}){const g=k.group(x,0,z);g.rotation.y=rotation;
 k.box(1.32,.18,length,P.steel,0,.86,0,g);k.box(1.12,.045,length-.2,P.dark,0,.977,0,g,.008);
 for(const dx of [-.66,.66]){k.box(.065,.23,length-(openEnds?1.7:0),P.wallLight,dx,.98,0,g,.012);for(let s=-length/2+.6;s<length/2;s+=2.5){k.beam([dx,.16,s],[dx,.82,s],.1,.1,P.frame,g);k.box(.34,.06,.4,P.dark,dx,.15,s,g);k.beam([-.57,.24,s],[.57,.24,s],.075,.075,P.frame,g);}}
 const rollers=new T.InstancedMesh(new T.CylinderGeometry(.055,.055,1.11,10),k.mat(0xb1bcb1),Math.floor(length/.19));rollers.rotation.z=Math.PI/2;const m=new T.Matrix4();for(let i=0;i<rollers.count;i++){m.makeTranslation(.997,0,-length/2+.18+i*.19);rollers.setMatrixAt(i,m);}g.add(rollers);
 for(const s of (openEnds?[0]:[-length/2+.23,length/2-.23])){k.box(.12,.43,.14,P.frame,.78,1.08,s,g);k.box(.18,.11,.21,P.red,.79,1.32,s,g);}
 conveyorDrive(k,g);
 return {object:g,rollers};}
export function truck(k,x,z,color,options){return warehouseTruck(k,x,z,color,options,pallet);}
export function forklift(k,x,z){return warehouseForklift(k,x,z);}
