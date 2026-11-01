// 2026-only protected approach phases. No source chapter traffic is mutated.
export const junctions=[{id:'J1',x:3,z:-28,offset:0,approaches:['W','E','N'],cycle:83},{id:'J2',x:3,z:-88,offset:17,approaches:['W','E','N','S'],cycle:100}];
export const leftApproaches={J1:['W','N'],J2:['W','E','N','S']};
export function phaseAt(time,id){const j=junctions.find(j=>j.id===id),t=(time+j.offset)%j.cycle,p={W:'red',E:'red',N:'red',S:'red',pedestrian:'red',walkElapsed:-1,cycle:j.cycle};const vehicleEnd=j.approaches.length*17;if(t<vehicleEnd){const i=Math.floor(t/17),local=t%17;p[j.approaches[i]]=local<12?'green':local<15?'amber':'red';}else{p.walkElapsed=t-vehicleEnd;p.pedestrian=p.walkElapsed<10?'green':'clearance';}return p;}
function path(points){let length=0;const segments=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<.00001)continue;segments.push({a,b,start:length,d});length+=d;}return {length,at(s){const p=segments.find(p=>s<=p.start+p.d)||segments.at(-1),t=Math.max(0,Math.min(1,(s-p.start)/p.d));return {x:p.a[0]+(p.b[0]-p.a[0])*t,z:p.a[1]+(p.b[1]-p.a[1])*t,dx:(p.b[0]-p.a[0])/p.d,dz:(p.b[1]-p.a[1])/p.d};},nearest(x,z){let best=Infinity,result=0;for(const p of segments){const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],t=Math.max(0,Math.min(1,((x-p.a[0])*dx+(z-p.a[1])*dz)/(p.d*p.d))),err=Math.hypot(p.a[0]+dx*t-x,p.a[1]+dz*t-z);if(err<best){best=err;result=p.start+p.d*t;}}return result;}};}
const arc=(cx,cz,r,a,b)=>Array.from({length:33},(_,i)=>[cx+Math.cos(a+(b-a)*i/32)*r,cz+Math.sin(a+(b-a)*i/32)*r]);
function route(id,points,gates,turns=[]){const p=path(points);return {id,...p,gates:gates.map(g=>({id:g[0],group:g[1],movement:g[2],stop:p.nearest(g[3],g[4]),exit:p.nearest(g[5],g[6])})),turns:turns.map(([a,b])=>[p.nearest(...a),p.nearest(...b)])};}
const rightIn=arc(11.5,-40.5,6,Math.PI/2,Math.PI),rightOut=arc(-7.5,-42.5,8,0,Math.PI/2);
const g1E=['J1','E','right',18.8,-34.5,5.5,-49],g1N=['J1','N','right',.5,-46.8,-16,-34.5],g2S=['J2','S','straight',5.5,-72.2,5.5,-106],g2N=['J2','N','straight',.5,-103.8,.5,-71];
const turnIn=[[11.5,-34.5],[5.5,-40.5]],turnOut=[[.5,-42.5],[-7.5,-34.5]];
export const routes=[
 ...[-21.5,-25,-31,-34.5].map((z,i)=>{const east=i<2;return route('A1-'+i,[[east?-225:225,z],[east?225:-225,z]],[['J1',east?'W':'E','straight',east?-12.8:18.8,z,east?21:-15,z]]);}),
 route('A2-0',[[-205,-85.5],[205,-85.5]],[['J2','W','straight',-12.8,-85.5,21,-85.5]]),
 route('A2-1',[[205,-90.5],[-205,-90.5]],[['J2','E','straight',18.8,-90.5,-15,-90.5]]),
 route('C1-north',[[225,-34.5],...rightIn,[5.5,-203]],[g1E,g2S],[turnIn]),
 route('C1-south',[[.5,-203],[.5,-42.5],...rightOut,[-225,-34.5]],[g2N,g1N],[turnOut]),
 route('J1-left-W',[[-225,-25],...arc(-2.5,-33,8,Math.PI/2,0),[5.5,-203]],[['J1','W','left',-12.8,-25,5.5,-49],g2S],[[[-2.5,-25],[5.5,-33]]]),
 route('J1-left-N',[[.5,-203],...arc(10.5,-35,10,Math.PI,Math.PI/2),[225,-25]],[g2N,['J1','N','left',.5,-46.8,21,-25]],[[[.5,-35],[10.5,-25]]]),
 route('J2-left-W',[[-205,-85.5],...arc(-2.5,-93.5,8,Math.PI/2,0),[5.5,-203]],[['J2','W','left',-12.8,-85.5,5.5,-106]],[[[-2.5,-85.5],[5.5,-93.5]]]),
 route('J2-left-E',[[205,-90.5],...arc(8.5,-82.5,8,-Math.PI/2,-Math.PI),[.5,-42.5],...rightOut,[-225,-34.5]],[['J2','E','left',18.8,-90.5,.5,-71],g1N],[[[8.5,-90.5],[.5,-82.5]],turnOut]),
 route('J2-left-N',[[.5,-203],...arc(8.5,-93.5,8,Math.PI,Math.PI/2),[205,-85.5]],[['J2','N','left',.5,-103.8,21,-85.5]],[[[.5,-93.5],[8.5,-85.5]]]),
 route('J2-left-S',[[225,-34.5],...rightIn,[5.5,-82.5],...arc(-2.5,-82.5,8,0,-Math.PI/2),[-205,-90.5]],[g1E,['J2','S','left',5.5,-72.2,-15,-90.5]],[turnIn,[[5.5,-82.5],[-2.5,-90.5]]])
];
// Existing zebra coordinates; the loop stays on pavement except these exact crossings.
export const crossings=[{id:'J1-W',junction:'J1',x:-7,z:-28,vertical:true,half:9},{id:'J1-E',junction:'J1',x:13,z:-28,vertical:true,half:9},{id:'J1-N',junction:'J1',x:3,z:-41,vertical:false,half:6},{id:'J2-W',junction:'J2',x:-7,z:-88,vertical:true,half:6},{id:'J2-E',junction:'J2',x:13,z:-88,vertical:true,half:6},{id:'J2-N',junction:'J2',x:3,z:-98,vertical:false,half:6},{id:'J2-S',junction:'J2',x:3,z:-78,vertical:false,half:6}];
function pedestrianRoute(c){const h=c.half,local=[[-.45,h+2.2],[-.45,h+.8],[-.45,-h-.8],[-.45,-h-2.2],[.45,-h-2.2],[.45,-h-.8],[.45,h+.8],[.45,h+2.2],[-.45,h+2.2]];const points=local.map(([across,along])=>c.vertical?[c.x+across,c.z+along]:[c.x+along,c.z+across]),p=path(points);return {...p,points,entry:[p.nearest(...points[1]),p.nearest(...points[5])],exit:[p.nearest(...points[2]),p.nearest(...points[6])]};}
export function overlap(a,b,pad=0){for(const axis of [[a.dx,a.dz],[-a.dz,a.dx],[b.dx,b.dz],[-b.dz,b.dx]]){const dist=Math.abs((a.x-b.x)*axis[0]+(a.z-b.z)*axis[1]),extent=c=>2.25*Math.abs(c.dx*axis[0]+c.dz*axis[1])+1.02*Math.abs(-c.dz*axis[0]+c.dx*axis[1])+pad;if(dist>=extent(a)+extent(b))return false;}return true;}
export function hitsPerson(car,p){const x=p.x-car.x,z=p.z-car.z;return Math.abs(x*car.dx+z*car.dz)<2.6&&Math.abs(-x*car.dz+z*car.dx)<1.37;}
export function createNetwork(){
 const cars=[],events=[],counts=[2,1,1,2,2,2,1,1,1,1,1,1,1,1];
 for(let r=0;r<routes.length;r++)for(let n=0;n<counts[r];n++){const id=cars.length,road=routes[r];let s=32+n*(road.length-65)/counts[r]+(r%3)*9;for(let tries=0;tries<40;tries++){const g=road.gates.find(g=>s>g.stop-12&&s<g.exit+12);if(g)s=g.exit+15;else if(cars.some(c=>Math.hypot(c.x-road.at(s).x,c.z-road.at(s).z)<12))s+=15;else break;}cars.push({id,route:r,s,speed:5.5+(id%4)*.45,cruise:7.4+(id*7%9)*.27,distance:0,claim:null,wait:null,...road.at(s)});}
 const walkers=crossings.map((c,id)=>{const r=pedestrianRoute(c),s=id%2?r.entry[1]:r.entry[0];return {id,junction:c.junction,crosswalk:c.id,route:r,s,distance:0,speed:0,maxSpeed:1.08+(id%4)*.075,crossing:false,crossingIndex:-1,wait:'red',...r.at(s)};});
 const state={cars,walkers,time:0,events,recycles:0,signals:{},steps:0};const record=e=>{events.push({t:state.time,...e});if(events.length>1800)events.shift();};
 function signals(){return Object.fromEntries(junctions.map(j=>{const p=phaseAt(state.time,j.id),claims=cars.filter(c=>c.claim?.id===j.id),crossing=walkers.some(w=>w.junction===j.id&&w.crossing);for(const group of j.approaches)if(p[group]!=='red'&&(crossing||claims.some(c=>c.claim.group!==group)))p[group]='red';if(p.pedestrian==='green'&&claims.length)p.pedestrian='red';p.pedestrianOccupied=crossing;return[j.id,p];}));}
 function step(dt,hidden=()=>true){state.time+=dt;state.steps++;state.signals=signals();
  for(const p of walkers){const r=p.route,gate=r.entry.findIndex((entry,i)=>p.s<=entry+.001&&p.s<r.exit[i]),signal=state.signals[p.junction];let move=p.maxSpeed*dt;p.wait=null;
   if(gate>=0&&!p.crossing&&p.s+move>=r.entry[gate]){if(signal.pedestrian==='green'&&signal.walkElapsed>=p.id*.43){p.crossing=true;p.crossingIndex=gate;record({kind:'ped-enter',pedestrian:p.id,junction:p.junction,signal:signal.pedestrian});}else{move=Math.max(0,r.entry[gate]-p.s);p.wait='red';}}
   p.s=Math.min(r.length,p.s+move);p.distance+=move;p.speed=move/dt;Object.assign(p,r.at(p.s));if(p.crossing&&p.s>=r.exit[p.crossingIndex]){p.crossing=false;record({kind:'ped-exit',pedestrian:p.id,junction:p.junction});}if(p.s>=r.length-.00001){p.s=0;Object.assign(p,r.at(0));}
  }
  for(const c of [...cars].sort((a,b)=>b.s-a.s)){
   const r=routes[c.route];if(c.claim&&c.s>c.claim.exit){record({kind:'exit',car:c.id,junction:c.claim.id,group:c.claim.group,movement:c.claim.movement});c.claim=null;}
   let target=c.cruise,limit=Infinity,reason=null;for(const [entry,end]of r.turns)if(c.s<=end)target=Math.min(target,Math.sqrt(4.2*4.2+5*Math.max(0,entry-c.s)));
   const gate=r.gates.find(g=>c.s<=g.exit&&(!c.claim||c.claim!==g));
   if(gate&&!c.claim&&c.s<=gate.stop+.1){const p=state.signals[gate.id],signal=p[gate.group],distance=gate.stop-c.s,amberGo=signal==='amber'&&distance<c.speed*c.speed/9+.4&&distance>0;
    if(signal==='green'||amberGo){if(distance<Math.max(.15,c.speed*dt+.05)){c.claim=gate;record({kind:'enter',car:c.id,junction:gate.id,group:gate.group,movement:gate.movement,signal});}}
    else{limit=Math.max(0,distance);reason=(gate.movement==='right'&&(p.pedestrian!=='red'||p.pedestrianOccupied)?'pedestrian:':'signal:')+gate.id;}
   }
   for(const other of cars){if(other===c)continue;const dx=other.x-c.x,dz=other.z-c.z,ahead=dx*c.dx+dz*c.dz,lateral=Math.abs(-dx*c.dz+dz*c.dx),aligned=other.dx*c.dx+other.dz*c.dz;if(ahead>0&&lateral<1.95&&aligned>.65){const gap=ahead-6.5;if(gap<limit){limit=Math.max(0,gap);reason='leader';}}}
   if(Number.isFinite(limit))target=Math.min(target,Math.sqrt(6.8*limit));const old=c.speed;c.speed=Math.max(0,Math.min(target,c.speed+1.8*dt));if(target<old)c.speed=Math.max(target,old-4.5*dt);
   let move=Math.min(c.speed*dt,limit,r.length-c.s);const next={...c,...r.at(c.s+move)};
   if(cars.some(o=>o!==c&&overlap(next,o,.1))){move=0;c.speed=0;reason='yield';}
   if(walkers.some(p=>hitsPerson(next,p))){move=0;c.speed=0;reason='pedestrian-safety';}
   if(move>0){c.s+=move;c.distance+=move;Object.assign(c,r.at(c.s));}else c.speed=0;
   const stopped=c.speed<.08&&reason;if(stopped&&c.wait!==reason)record({kind:'stop',car:c.id,reason});if(c.wait&&c.speed>.2)record({kind:'restart',car:c.id,reason:c.wait});c.wait=stopped?reason:(c.speed>.2?null:c.wait);
   if(c.s>=r.length-.01){const nextRoute=c.route===6?7:c.route===7?6:c.route,spawn=routes[nextRoute].at(0);if(hidden(c)&&hidden(spawn)&&cars.every(o=>o===c||(!overlap(spawn,o,.1)&&(Math.abs((o.x-spawn.x)*spawn.dx+(o.z-spawn.z)*spawn.dz)>9||Math.abs(-(o.x-spawn.x)*spawn.dz+(o.z-spawn.z)*spawn.dx)>1.95)))){record({kind:'recycle',car:c.id,from:{x:c.x,z:c.z},to:spawn});c.route=nextRoute;c.s=0;c.speed=0;c.claim=null;c.wait=null;Object.assign(c,spawn);state.recycles++;}}
  }
 }
 function advance(dt,hidden){while(dt>1e-8){const d=Math.min(dt,1/60);step(d,hidden);dt-=d;}}
 state.signals=signals();return {state,advance};
}
