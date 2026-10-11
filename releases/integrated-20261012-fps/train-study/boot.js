import '../experiments/register.js';
import {startGame} from '../src/runtime.js';
import {spaces} from '../src/content/registry.js';
import {createSession} from '../experiments/scoring.js';
import {GameplayCamera} from '../src/systems/gameplay-camera.js';
import {createChapterAudio} from '../street-study/audio-routing.js';
for(const [id,name] of [['life-train','trainView'],['life-office','officeView']]){const def=spaces.get(id),create=def.create;def.create=ctx=>{const v=create(ctx);window[name]=v;return v;};}
const office=new URLSearchParams(location.search).has('office');document.title='서울행 기차 · 15초 컷신 로컬 검증';document.querySelector('#welcome .year').textContent=office?'2019':'SEOUL';document.querySelector('#welcome .lead').textContent='서울로 향하는 길 · 상징적 이동 장면';document.querySelector('#welcome .playtime').textContent='약 15초 · 로컬 컷신 검증';
const scores=await fetch(new URL('../experiments/data/scores.json',import.meta.url)).then(r=>r.json());await startGame({campaignUrl:new URL(office?'./office-campaign.json':'./campaign.json',import.meta.url),session:createSession(scores,{full:false,storageKey:'train-cutscene-local'}),cameraRig:new GameplayCamera(),audioFactory:createChapterAudio});
