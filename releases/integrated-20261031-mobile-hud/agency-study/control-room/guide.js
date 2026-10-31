import {MANAGEMENT_MS,WAVE_MS} from './state.js';
import {bike,bowl} from './data.js';

// Text and static control samples only: no gameplay runs behind this page.
export function showControlGuide(root){
 root.dataset.mode='guide';
 root.innerHTML=`<header class="topbar"><span class="brand">다시, 불을 켜다</span><div class="chapter">CHAPTER 2026 <span>배달 플랫폼 운영</span></div><div class="clock">저녁 피크 <b>19:42</b></div></header>
 <main class="control-guide"><div class="guide-intro"><div class="eyebrow">OPERATIONS GUIDE</div><h1>업무를 시작하기 전에</h1><p>배차 관제와 권역 운영, 두 업무를 차례로 진행합니다.</p></div>
 <div class="guide-grid"><section class="card guide-card"><div class="guide-heading"><span class="chip">01</span><h2>배차 관제</h2><span class="guide-meta">주문 5건 · 최대 500점</span></div>
 <div class="guide-samples" aria-hidden="true"><span>${bowl} 주문 선택</span><i>→</i><span>${bike} 라이더 선택</span><i>→</i><span class="guide-button">배차하기</span></div>
 <ol><li><b>급한 주문부터 선택하세요.</b><p>주문의 남은 시간과 라이더의 픽업 예상 시간을 함께 확인하세요.</p></li><li><b>대기 중인 라이더를 골라 ‘배차하기’를 누르세요.</b><p>마감 전에 픽업할 수 있는 가까운 라이더가 유리합니다. 픽업이 늦으면 주문이 취소되어 감점됩니다.</p></li><li><b>라이더 3명으로 주문 5건을 처리하세요.</b><p>운행 중인 라이더는 선택할 수 없습니다. 배달을 마치면 도착 위치에서 다시 배차할 수 있어요.</p></li></ol>
 <p class="guide-note">모든 주문의 처리와 운행이 끝나면 권역 운영이 자동으로 시작됩니다.</p></section>
 <section class="card guide-card"><div class="guide-heading"><span class="chip">02</span><h2>권역 운영</h2><span class="guide-meta">${MANAGEMENT_MS/1000}초 · 최대 500점</span></div>
 <div class="guide-samples" aria-hidden="true"><span class="guide-button secondary">− 회수</span><i>→</i><span>대기 인력</span><i>→</i><span class="guide-button">＋ 배치</span></div>
 <ol><li><b>여유 권역에서 ‘− 회수’를 누르세요.</b><p>한 번 누를 때마다 1명이 재배치 대기로 이동합니다. 업무에 필요한 인원은 회수할 수 없어요.</p></li><li><b>부족 권역에서 ‘＋ 배치’를 누르세요.</b><p>대기 인력 1명을 해당 권역에 보냅니다. 대기가 없다면 먼저 여유 권역에서 회수하세요.</p></li><li><b>${WAVE_MS/1000}초마다 바뀌는 수요에 계속 대응하세요.</b><p>부족한 인원이 오래 남을수록 점수가 줄어듭니다. 시간이 끝날 때까지 부족을 줄여주세요.</p></li></ol>
 <p class="guide-note">온라인 총원 128명은 유지됩니다. 업무 중인 인원을 제외한 재배치 가능 인력만 옮깁니다.</p></section></div>
 <div class="guide-start"><p>안내를 읽는 동안 주문 마감과 제한 시간은 흐르지 않습니다.</p><button class="primary" data-action="begin">시작하기 <span aria-hidden="true">→</span></button></div></main>
 <footer><strong>업무 안내</strong><span>배차 관제 → 권역 운영 → 통합 결과</span></footer>`;
}
