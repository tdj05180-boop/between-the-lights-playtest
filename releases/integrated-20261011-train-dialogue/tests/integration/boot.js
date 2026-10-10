import '../../experiments/register.js';
import {spaces,minigames} from '../../src/content/registry.js';
import {startGame} from '../../src/runtime.js';
import {createSession} from '../../experiments/scoring.js';
import {createWarehouseStudy} from '../../warehouse-study/space.js';
import {warehouseSorting} from '../../warehouse-study/sorting.js';
import {workflow} from '../../warehouse-study/workflow-layout.js';
import {GameplayCamera} from '../../src/systems/gameplay-camera.js';
import {createChapterAudio} from '../../street-study/audio-routing.js';

// Import the latest warehouse directly, never substitute the old life-warehouse adapter.
spaces.register('warehouse-workflow',{
 spawn:workflow.spawn,
 interactions:[{id:'sorting',...workflow.start,y:1.5,radius:1.6,label:'배송 분류 시작',kind:'object'}],
 cameraPresets:{free:{yaw:0,pitch:Math.PI/12,distance:3.8}},
 create(ctx){const fov=ctx.camera.fov;ctx.scope.own(()=>{ctx.camera.fov=fov;ctx.camera.updateProjectionMatrix();});ctx.camera.fov=60;ctx.camera.updateProjectionMatrix();const v=createWarehouseStudy(ctx);window.foodView=v;window.inboundInspect=()=>v.features.inbound.snapshot();return v;}
});
minigames.register('warehouse-sorting',warehouseSorting);
document.title='2003 거리 개선 · 최신 물류창고 연결';
const set=(selector,text)=>document.querySelector(selector).textContent=text;
set('#welcome .eyebrow','2003 · STREET STUDY');
set('#welcome .playtime','거리 개선 작업본 · 최신 물류창고로 연결');
set('#welcome .intro-note','가게와 동네, 선택형 관찰은 미술·공간 검증용 임시 표현입니다. 실제 장소와 업종은 확정하지 않았습니다.');
set('#sceneCaption span','2003 / NEIGHBOURHOOD');
set('#sceneCaption p','거리 양쪽을 천천히 둘러보세요.');
set('#help .small','주민과 물건은 선택해서 살펴볼 수 있습니다. 셔터가 닫히면 최신 물류창고 챕터로 이어집니다.');
set('#ending h2','여기까지, 이어 온 길.');
set('#ending h2 + p','전체 흐름 실험작의 마지막에 도착했습니다.');
set('#ending .next-story','공간과 대사는 인터뷰 후 다듬을 임시 표현입니다.');
set('#ending .end-meta','로컬 테스트 · 최종 콘텐츠 아님');
document.querySelector('#ending .secondary').remove();
const scores=await fetch(new URL('../../experiments/data/scores.json',import.meta.url)).then(r=>r.json());
const session=createSession(scores,{full:true,storageKey:'between-lights:integrated-playtest:best'});
session.recordPrefix='between-lights:integrated-playtest';
await startGame({campaignUrl:new URL('./'+(new URLSearchParams(location.search).get('chapter')||'all')+'.json',import.meta.url),session,cameraRig:new GameplayCamera(),audioFactory:createChapterAudio});
