// Display-only fictional evening snapshot. Never used for scoring or simulation.
export const operationsSnapshot=Object.freeze({time:'19:42',registered:607,online:128,active:86,waiting:34,break:8,offline:479,orders:96,delivering:86,unassigned:10,late:7,averageMinutes:24});
export const operatingRegions=Object.freeze([
 Object.freeze({name:'북서 생활권',online:29,need:32,demand:'높음'}),
 Object.freeze({name:'북동 업무권',online:34,need:32,demand:'보통'}),
 Object.freeze({name:'남서 주거권',online:31,need:33,demand:'높음'}),
 Object.freeze({name:'남동 상업권',online:34,need:38,demand:'매우 높음'})
]);
export const screenRoles=Object.freeze(['배차 운영 현황','권역 운영 현황','주문 처리 목록','권역 인원 현황','배차 대기열']);
export const dashboardTheme=Object.freeze({background:'#162e38',panel:'#233e48',map:'#294650',ink:'#edf2e9',muted:'#b0c4c5',road:'#657c83',active:'#9acdb9',waiting:'#dcc296',offline:'#9eafbc',border:'#3b5962'});
export function drawOperationsIcon(g,kind,x,y,color,size=1){
 g.save();g.translate(x,y);g.scale(size,size);g.strokeStyle=color;g.fillStyle=color;g.lineWidth=2.5;g.lineCap='round';g.lineJoin='round';
 if(kind==='rider'){
  for(const dx of [-8,8]){g.beginPath();g.arc(dx,4,4,0,Math.PI*2);g.stroke();}
  g.beginPath();g.moveTo(-8,4);g.lineTo(-2,-4);g.lineTo(5,4);g.lineTo(-8,4);g.moveTo(8,4);g.lineTo(4,-9);g.lineTo(9,-9);g.moveTo(-3,-8);g.lineTo(2,-8);g.stroke();g.fillRect(-12,-8,6,5);
 }else{g.beginPath();g.arc(0,-2,10,0,Math.PI);g.closePath();g.fill();g.fillRect(-7,9,14,2);for(const x of [-4,4]){g.beginPath();g.moveTo(x,-7);g.lineTo(x+2,-12);g.stroke();}}
 g.restore();
}
// Common design primitives stay independent of the HTML minigames.
export function drawOperationsScreen(g,w,h,kind=0){
 const c=dashboardTheme,d=operationsSnapshot;
 g.save();g.scale(w/768,h/384);
 const rect=(x,y,width,height,color=c.panel)=>{g.fillStyle=color;g.fillRect(x,y,width,height);};
 const text=(s,x,y,size=22,color=c.ink,weight=500)=>{g.fillStyle=color;g.font=`${weight} ${size}px sans-serif`;g.fillText(String(s),x,y);};
 const rule=y=>rect(24,y,720,1,c.border);
 const pill=(s,x,y,width,color=c.active)=>{rect(x,y,width,30,c.background);text(s,x+10,y+22,19,color,600);};
 const metric=(label,value,x,y,width,color=c.ink)=>{rect(x,y,width,79);text(label,x+14,y+25,20,c.muted);text(value,x+14,y+65,34,color,700);};
 function map(x,y,width,height){
  g.save();g.translate(x,y);g.scale(width/300,height/200);rect(0,0,300,200,c.map);
  for(let r=0;r<3;r++)for(let col=0;col<4;col++)rect(10+col*76,10+r*68,55,42,(r+col)%2?'#375660':'#304e58');
  for(const yy of [61,129])rect(0,yy,300,10,c.road);for(const xx of [69,145,221])rect(xx,0,9,200,c.road);
  rect(13,149,44,37,'#47655b');
  g.strokeStyle=c.active;g.lineWidth=3;g.setLineDash([5,4]);g.beginPath();g.moveTo(73,38);g.lineTo(73,134);g.lineTo(225,134);g.lineTo(225,174);g.stroke();g.setLineDash([]);
  for(const [xx,yy,k] of [[73,38,'rider'],[149,100,'rider'],[225,174,'order'],[191,65,'order']]){g.fillStyle=c.background;g.beginPath();g.arc(xx,yy,15,0,Math.PI*2);g.fill();drawOperationsIcon(g,k,xx,yy,k==='rider'?c.active:c.waiting,.85);}
  g.restore();
 }
 rect(0,0,768,384,c.background);rect(0,0,6,384,c.active);
 text(screenRoles[kind],24,37,27,c.ink,700);text(`저녁 피크  /  ${d.time}`,526,35,21,c.active,600);rule(54);
 if(kind===0){
  metric('온라인 / 등록',`${d.online} / ${d.registered}명`,24,69,228,c.active);
  metric('진행 중 주문',`${d.orders}건`,266,69,232);metric('지연 · 진행 중 포함',`${d.late}건`,512,69,232,c.waiting);
  map(24,161,309,166);
  rect(347,161,397,166);text('라이더 상태',364,191,21,c.muted);
  [['운행',d.active,c.active],['대기',d.waiting,c.ink],['휴식',d.break,c.muted]].forEach(([s,n,col],i)=>{let x=364+i*125;text(s,x,224,20,c.muted);text(`${n}명`,x,257,29,col,700);});
  rect(364,272,363,1,c.border);text(`미배차 ${d.unassigned}건`,364,307,23,c.waiting,600);text(`평균 ${d.averageMinutes}분`,568,307,23,c.ink,600);
 }else if(kind===1){
  text('권역',36,84,20,c.muted);text('수요',283,84,20,c.muted);text('온라인',442,84,20,c.muted);text('필요 대비',596,84,20,c.muted);
  operatingRegions.forEach((r,i)=>{let y=96+i*43,delta=r.online-r.need;rect(24,y,720,38);text(r.name,36,y+27,23,c.ink,600);text(r.demand,283,y+26,21,c.muted);text(`${r.online}명`,461,y+27,24,c.active,700);text(delta<0?`부족 ${-delta}`:`여유 ${delta}`,607,y+26,22,delta<0?c.waiting:c.active,600);});
  text('운영 알림',24,294,19,c.muted);text('남동 · 지연 2건',24,324,21,c.waiting);text('북서 · 증원 필요',281,324,21,c.ink);text('우천 없음',563,324,21,c.muted);
 }else if(kind===2){
  metric('진행 주문',`${d.orders}건`,24,69,228);metric('배송 중',`${d.delivering}건`,266,69,232,c.active);metric('미배차',`${d.unassigned}건`,512,69,232,c.waiting);
  text('주문 · 최근 4건',36,176,19,c.muted);text('권역',276,176,19,c.muted);text('처리 상태',519,176,19,c.muted);
  [['#1942-18','남동 상업권','배차 대기'],['#1942-17','북서 생활권','픽업 이동'],['#1942-16','남서 주거권','음식 수령'],['#1942-15','북동 업무권','배달 이동']].forEach((r,i)=>{let y=188+i*37;rect(24,y,720,32);text(r[0],36,y+24,22);text(r[1],276,y+24,21,c.muted);text(r[2],519,y+24,21,i===0?c.waiting:c.active,600);});
 }else if(kind===3){
  metric('온라인',`${d.online}명`,24,69,228,c.active);metric('필요 인원','135명',266,69,232);metric('수요 대비 차이','−7명',512,69,232,c.waiting);
  operatingRegions.forEach((r,i)=>{let x=24+(i%2)*367,y=162+Math.floor(i/2)*86;rect(x,y,353,76);text(r.name,x+13,y+26,22,c.ink,600);text(`${r.online} / ${r.need}명`,x+13,y+59,25,c.active,700);pill(r.online<r.need?`부족 ${r.need-r.online}`:`여유 ${r.online-r.need}`,x+235,y+34,105,r.online<r.need?c.waiting:c.active);});
 }else{
  map(24,69,247,258);rect(285,69,459,65);text('미배차',300,110,23,c.muted);text(`${d.unassigned}건`,410,114,35,c.waiting,700);text('우선 확인 3건',560,110,21,c.muted);
  [['남동 상업권','4분 대기'],['북서 생활권','3분 대기'],['남서 주거권','2분 대기']].forEach(([name,status],i)=>{let y=147+i*49;rect(285,y,459,42);drawOperationsIcon(g,'order',307,y+23,c.waiting,.8);text(name,332,y+29,23,c.ink,600);text(status,613,y+28,20,c.waiting);});
  text('배차 가능 라이더',297,326,20,c.muted);text(`${d.waiting}명`,645,326,24,c.active,700);
 }
 rule(344);text(kind===0?`배송 ${d.delivering} + 미배차 ${d.unassigned} = 진행 ${d.orders}건`:kind===1?'온라인 합계 128명 · 도로 흐름 보통':kind===2?'최근 접수 일부 표시':kind===3?'부족 권역 3 · 여유 권역 1':'대기 시간 순 · 일부 표시',24,370,19,c.muted);
 text('가상 운영 데이터',596,370,17,c.muted);g.restore();
}
