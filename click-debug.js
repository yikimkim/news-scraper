// 브라우저 콘솔에서 실행할 디버깅 스크립트

console.log('🔍 탭 클릭 디버깅 시작');

// 1. switchTab 함수 존재 확인
console.log('1. switchTab 함수 확인:', typeof switchTab);
if (typeof switchTab !== 'function') {
    console.error('❌ switchTab 함수가 정의되지 않았습니다!');
    console.log('window 객체에서 찾기:', typeof window.switchTab);
    console.log('전역 스코프 함수들:', Object.getOwnPropertyNames(window).filter(name => typeof window[name] === 'function').slice(0, 20));
} else {
    console.log('✅ switchTab 함수가 정의되어 있습니다');
}

// 2. 탭 버튼들 확인
const tabButtons = document.querySelectorAll('.nav-tab');
console.log('2. 탭 버튼 개수:', tabButtons.length);
tabButtons.forEach((btn, index) => {
    console.log(`   버튼 ${index + 1}: "${btn.textContent.trim()}" - onclick: ${btn.onclick ? '있음' : '없음'}`);
    console.log(`   onclick 속성: ${btn.getAttribute('onclick')}`);
});

// 3. 탭 컨텐츠들 확인
const tabContents = document.querySelectorAll('.tab-content');
console.log('3. 탭 컨텐츠 개수:', tabContents.length);
tabContents.forEach((content, index) => {
    const style = getComputedStyle(content);
    console.log(`   컨텐츠 ${index + 1}: ${content.id} - display: ${style.display}, active: ${content.classList.contains('active')}`);
});

// 4. 실제 클릭 이벤트 테스트
console.log('4. 실제 클릭 이벤트 테스트');
const boardsButton = document.querySelector('[onclick*="boards"]');
const governmentButton = document.querySelector('[onclick*="government"]');

if (boardsButton) {
    console.log('✅ 내 게시판 버튼 발견:', boardsButton.textContent.trim());
    try {
        console.log('   → 클릭 이벤트 시뮬레이션 중...');
        boardsButton.click();
        console.log('   → 클릭 완료');
        
        setTimeout(() => {
            const boardsContent = document.getElementById('boards-tab');
            if (boardsContent && boardsContent.classList.contains('active')) {
                console.log('   ✅ 내 게시판 탭 활성화 성공');
            } else {
                console.log('   ❌ 내 게시판 탭 활성화 실패');
            }
        }, 500);
        
    } catch (error) {
        console.error('   ❌ 내 게시판 클릭 오류:', error);
    }
} else {
    console.error('❌ 내 게시판 버튼을 찾을 수 없습니다');
}

if (governmentButton) {
    console.log('✅ 정부 보도자료 버튼 발견:', governmentButton.textContent.trim());
    try {
        console.log('   → 2초 후 클릭 이벤트 시뮬레이션...');
        setTimeout(() => {
            governmentButton.click();
            console.log('   → 클릭 완료');
            
            setTimeout(() => {
                const governmentContent = document.getElementById('government-tab');
                if (governmentContent && governmentContent.classList.contains('active')) {
                    console.log('   ✅ 정부 보도자료 탭 활성화 성공');
                } else {
                    console.log('   ❌ 정부 보도자료 탭 활성화 실패');
                }
            }, 1000);
        }, 2000);
        
    } catch (error) {
        console.error('   ❌ 정부 보도자료 클릭 오류:', error);
    }
} else {
    console.error('❌ 정부 보도자료 버튼을 찾을 수 없습니다');
}

// 5. 수동 함수 호출 테스트 (만약 클릭이 안 된다면)
console.log('5. 수동 함수 호출 테스트 (3초 후)');
setTimeout(() => {
    if (typeof switchTab === 'function') {
        console.log('   → switchTab("boards") 호출 중...');
        try {
            switchTab('boards');
            console.log('   ✅ 수동 호출 성공');
        } catch (error) {
            console.error('   ❌ 수동 호출 오류:', error);
        }
    } else {
        console.error('   ❌ switchTab 함수가 없어서 수동 호출 불가');
    }
}, 3000);

console.log('🔍 디버깅 스크립트 완료 - 결과를 위에서 확인하세요');