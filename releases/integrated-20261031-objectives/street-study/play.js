import '../experiments/register.js?v=door-ready-20261011';
import {spaces,minigames} from '../src/content/registry.js';
import {startGame} from '../src/runtime.js?v=webapp-20261011';
import {createSession} from '../experiments/scoring.js';
import {createWarehouseStudy} from '../warehouse-study/space.js';
import {warehouseSorting} from '../warehouse-study/sorting.js';
import {workflow} from '../warehouse-study/workflow-layout.js';
import {GameplayCamera} from '../src/systems/gameplay-camera.js';
import {createChapterAudio} from './audio-routing.js?v=seoul-audio-start-20261011';
import {installCharacters} from '../src/characters/install.js';

// Import the latest warehouse directly, never substitute the old life-warehouse adapter.
spaces.register('warehouse-workflow',{
 spawn:workflow.spawn,
 interactions:[{id:'sorting',...workflow.start,y:1.5,radius:1.6,label:'배송 분류 시작',kind:'object'}],
 cameraPresets:{free:{yaw:0,pitch:Math.PI/12,distance:3.8}},
 create(ctx){const fov=ctx.camera.fov;ctx.scope.own(()=>{ctx.camera.fov=fov;ctx.camera.updateProjectionMatrix();});ctx.camera.fov=60;ctx.camera.updateProjectionMatrix();return createWarehouseStudy(ctx);}
});
minigames.register('warehouse-sorting',warehouseSorting);
installCharacters();
document.title='2003 거리 개선 · 최신 물류창고 연결';
const set=(selector,text)=>document.querySelector(selector).textContent=text;
set('#welcome .eyebrow','2003 · STREET STUDY');
set('#sceneCaption span','2003 / NEIGHBOURHOOD');
set('#sceneCaption p','거리 양쪽을 천천히 둘러보세요.');
set('#help .small','주민과 물건은 선택해서 살펴볼 수 있습니다. 셔터가 닫히면 최신 물류창고 챕터로 이어집니다.');
set('#ending h2','다시, 불을 켜다');
set('#ending h2 + p','모든 날이 밝지는 않았다.');
set('#ending .next-story','그래도, 다시 불을 켜고 하루를 시작했다.');
set('#ending .end-meta','');
document.querySelector('#ending .secondary').remove();
const scores=await fetch(new URL('../experiments/data/scores.json',import.meta.url)).then(r=>r.json());
const session=createSession(scores,{full:true,storageKey:'between-lights:integrated-playtest:best'});
session.recordPrefix='between-lights:integrated-playtest';
await startGame({campaignUrl:new URL('./campaign.json',import.meta.url),session,cameraRig:new GameplayCamera(),audioFactory:createChapterAudio});
