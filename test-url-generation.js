// URL 생성 테스트 스크립트
function generateArticleUrl(item) {
    // 기존 URL이 개별 보도자료를 지시하는 경우
    if (item.url && (item.url.includes('view.do') || item.url.includes('Detail.do') || item.url.includes('/view/') || item.url.includes('/detail/'))) {
        return item.url;
    }
    
    // 제목에서 핵심 키워드 추출
    const titleKeywords = item.title.replace(/- \d+월 \d+일$/, '').trim().split(' ');
    const mainKeyword = titleKeywords[0] || '보도자료';
    
    // 날짜 정보 추출
    let searchDate = '';
    if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        searchDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // 기관별 검색 URL 생성
    let searchUrl;
    const encodedKeyword = encodeURIComponent(mainKeyword);
    const encodedAgency = encodeURIComponent(item.agency);
    const encodedDate = encodeURIComponent(searchDate);
    
    switch (item.agencyCode) {
        case 'fsc':
            if (searchDate) {
                searchUrl = `https://search.naver.com/search.naver?where=news&query=site:fsc.go.kr+${encodedKeyword}+${encodedDate}&sort=1`;
            } else {
                searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodedAgency}+${encodedKeyword}+보도자료&sort=1`;
            }
            break;
        case 'fss':
            if (searchDate) {
                searchUrl = `https://search.naver.com/search.naver?where=news&query=site:fss.or.kr+${encodedKeyword}+${encodedDate}&sort=1`;
            } else {
                searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodedAgency}+${encodedKeyword}+보도자료&sort=1`;
            }
            break;
        case 'ftc':
            if (searchDate) {
                searchUrl = `https://search.naver.com/search.naver?where=news&query=site:ftc.go.kr+${encodedKeyword}+${encodedDate}&sort=1`;
            } else {
                searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodedAgency}+${encodedKeyword}+보도자료&sort=1`;
            }
            break;
        default:
            searchUrl = `https://search.naver.com/search.naver?where=news&query=${encodedAgency}+${encodedKeyword}&sort=1`;
    }
    
    return searchUrl;
}

// 테스트 데이터
const testItem = {
    "title": "온라인 플랫폼 독점행위 조사 착수 - 10월 17일",
    "agency": "공정거래위원회", 
    "agencyCode": "ftc",
    "publishedAt": "2025-10-17T00:07:56.779Z",
    "url": "https://www.ftc.go.kr/www/selectReportList.do?key=10"
};

console.log('📊 URL 생성 테스트');
console.log('입력 데이터:', JSON.stringify(testItem, null, 2));
console.log('\n🔗 결과:');
console.log('기존 URL:', testItem.url);
console.log('개선된 URL:', generateArticleUrl(testItem));

// 추출된 정보 확인
const titleKeywords = testItem.title.replace(/- \d+월 \d+일$/, '').trim().split(' ');
const mainKeyword = titleKeywords[0];
const date = new Date(testItem.publishedAt);
const searchDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

console.log('\n🔍 추출된 정보:');
console.log('핵심 키워드:', mainKeyword);
console.log('검색 날짜:', searchDate);
console.log('기관 코드:', testItem.agencyCode);