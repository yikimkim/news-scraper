// 메인 앱에서 실행할 수 있는 테스트 코드
console.log('🔍 수동 테스트 시작');

// 1. 정부 보도자료 탭 클릭 테스트
function testGovernmentTabClick() {
    console.log('1. 정부 보도자료 탭 클릭 테스트');
    
    const govButton = document.querySelector('[data-tab="government"]');
    if (govButton) {
        console.log('✅ 정부 보도자료 탭 버튼 발견');
        govButton.click();
        
        setTimeout(() => {
            const govTab = document.getElementById('government-tab');
            if (govTab && govTab.classList.contains('active')) {
                console.log('✅ 정부 보도자료 탭 활성화 성공');
                
                // API 호출 상태 확인
                const newsList = document.getElementById('government-news-list');
                if (newsList) {
                    console.log('뉴스 목록 내용:', newsList.innerHTML.substring(0, 300));
                }
            } else {
                console.log('❌ 정부 보도자료 탭 활성화 실패');
            }
        }, 3000);
    } else {
        console.log('❌ 정부 보도자료 탭 버튼을 찾을 수 없음');
    }
}

// 2. API 직접 테스트
async function testDirectAPI() {
    console.log('2. API 직접 테스트');
    
    try {
        const response = await fetch('/api/news?agency=all&page=1&limit=3');
        const result = await response.json();
        console.log('API 응답:', result);
        
        if (result.success) {
            console.log('✅ API 정상 작동, 데이터 수:', result.data?.length);
        } else {
            console.log('❌ API 오류:', result.error);
        }
    } catch (error) {
        console.log('❌ API 호출 오류:', error.message);
    }
}

// 3. 기관 필터 버튼 테스트
function testAgencyButtons() {
    console.log('3. 기관 필터 버튼 테스트');
    
    const buttons = document.querySelectorAll('.agency-btn[data-agency]');
    console.log(`기관 버튼 수: ${buttons.length}`);
    
    buttons.forEach((btn, index) => {
        const agency = btn.getAttribute('data-agency');
        console.log(`버튼 ${index + 1}: ${agency} - "${btn.textContent.trim()}"`);
        
        // 첫 번째 버튼 클릭 테스트
        if (index === 1) { // 금융위원회 버튼
            console.log('금융위원회 버튼 클릭 테스트...');
            btn.click();
        }
    });
}

// 4. 새로고침 버튼 테스트
function testRefreshButton() {
    console.log('4. 새로고침 버튼 테스트');
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        console.log('✅ 새로고침 버튼 발견');
        console.log('새로고침 버튼 클릭...');
        refreshBtn.click();
    } else {
        console.log('❌ 새로고침 버튼을 찾을 수 없음');
    }
}

// 5. 모든 테스트 실행
async function runAllTests() {
    console.log('🚀 모든 테스트 실행 시작');
    
    // API 직접 테스트부터
    await testDirectAPI();
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 정부 탭 클릭
    testGovernmentTabClick();
    
    // 잠시 대기 후 다른 테스트들
    setTimeout(() => {
        testAgencyButtons();
        setTimeout(() => {
            testRefreshButton();
        }, 2000);
    }, 4000);
}

// 전역에서 사용할 수 있도록 window 객체에 추가
window.testGov = {
    runAllTests,
    testGovernmentTabClick,
    testDirectAPI,
    testAgencyButtons,
    testRefreshButton
};

console.log('🎯 테스트 함수 준비 완료. 사용법:');
console.log('- window.testGov.runAllTests() : 모든 테스트 실행');
console.log('- window.testGov.testGovernmentTabClick() : 탭 클릭 테스트');
console.log('- window.testGov.testDirectAPI() : API 직접 테스트');
console.log('- window.testGov.testAgencyButtons() : 기관 버튼 테스트');
console.log('- window.testGov.testRefreshButton() : 새로고침 버튼 테스트');