// Temporary atmosphere only: no claim about the subject's actual business or words.
export const observations=[
 {id:'street-boxes',x:2.3,z:.35,y:1.1,radius:1.55,kind:'object',name:'가게 앞 상자',action:'살펴보기',text:'[임시 관찰] 접어 둔 포장지와 이름 없는 상자. 무엇을 팔던 가게인지는 아직 정하지 않았습니다.'},
 {id:'street-neighbour',x:6.8,z:10.6,y:1.6,radius:1.55,kind:'npc',name:'동네 주민',action:'대화하기',text:'[분위기용 임시 대사] “햇볕이 좋네요. 잠깐 쉬었다 가세요.” 실제 인물의 발언이 아닙니다.'},
 {id:'street-board',x:-5.8,z:2.5,y:1.3,radius:1.45,kind:'object',name:'골목 안내판',action:'읽기',text:'[임시 관찰] 손으로 붙인 동네 안내문. 이 길의 이름과 실제 장소는 추후 인터뷰에 맞춰 정합니다.'},
 {id:'street-window',x:2.1,z:-.15,y:1.6,radius:1.3,kind:'object',name:'가게 옆 창문',action:'들여다보기',text:'[임시 관찰] 빈 선반과 작은 작업대가 보입니다. 업종을 특정하지 않은 임시 가게 내부입니다.'}
].map(t=>({...t,optional:true,label:`${t.name} · ${t.action}`}));
