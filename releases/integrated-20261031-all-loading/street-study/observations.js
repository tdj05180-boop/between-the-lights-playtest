// Temporary atmosphere only: no claim about the subject's actual business or words.
export const observations=[
 {id:'street-boxes',x:2.3,z:.35,y:1.1,radius:1.55,kind:'object',name:'가게 앞 상자',action:'살펴보기',text:'상자부터 정리해 두자. 할 수 있는 것부터 하나씩.'},
 {id:'street-neighbour',x:6.8,z:10.6,y:1.6,radius:1.55,kind:'npc',name:'서형원 교수님',action:'대화하기',text:'“요즘 같은 시대에는 AI를 잘 활용하는 능력이 중요합니다.”'},
 {id:'street-window',x:2.1,z:-.15,y:1.6,radius:1.3,kind:'object',name:'가게 옆 창문',action:'들여다보기',text:'아직은 이 가게를 지키고 싶다.'}
].map(t=>({...t,optional:true,label:`${t.name} · ${t.action}`}));
