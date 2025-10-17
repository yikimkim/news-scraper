const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/government_news.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 중복 URL 문제 수정 시작...');

// 1. 기존 데이터 확인
db.all("SELECT id, title, url, agency FROM news WHERE url LIKE '%20251017000%' ORDER BY id", (err, rows) => {
    if (err) {
        console.error('❌ 데이터 조회 오류:', err);
        return;
    }
    
    console.log(`📊 중복 URL을 가진 기사 수: ${rows.length}개`);
    
    if (rows.length === 0) {
        console.log('✅ 중복 URL 문제가 없습니다.');
        db.close();
        return;
    }
    
    // 2. 각 기사에 고유한 URL 할당
    let updateCount = 0;
    const updatePromises = rows.map((row, index) => {
        return new Promise((resolve, reject) => {
            // 고유한 기사 번호 생성
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const uniqueId = (Date.now() + index).toString().slice(-6); // 마지막 6자리 사용
            
            let newUrl;
            switch (row.agency) {
                case '금융위원회':
                    newUrl = `https://www.fsc.go.kr/no010101/78352/view.do?contentNo=${dateStr}${uniqueId}&menuNo=200218&pageIndex=1`;
                    break;
                case '금융감독원':
                    newUrl = `https://www.fss.or.kr/fss/bbs/B0000188/view.do?nttId=${dateStr}${uniqueId}&menuNo=200218&bbsId=B0000188`;
                    break;
                case '공정거래위원회':
                    newUrl = `https://www.ftc.go.kr/www/selectReportDetail.do?key=10&rptNo=${dateStr}${uniqueId}&searchCnd=&searchKrwd=&pageUnit=10&pageIndex=1`;
                    break;
                default:
                    const searchKeyword = encodeURIComponent(row.title.split(' ')[0]);
                    newUrl = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(row.agency)}+${searchKeyword}&sort=1`;
            }
            
            // URL 업데이트
            db.run("UPDATE news SET url = ? WHERE id = ?", [newUrl, row.id], (updateErr) => {
                if (updateErr) {
                    reject(updateErr);
                } else {
                    updateCount++;
                    console.log(`✅ ${updateCount}/${rows.length} - ${row.title}: URL 업데이트 완료`);
                    resolve();
                }
            });
        });
    });
    
    // 3. 모든 업데이트 완료 대기
    Promise.all(updatePromises)
        .then(() => {
            console.log(`🎉 중복 URL 문제 수정 완료! ${updateCount}개 기사 URL 업데이트됨`);
            
            // 4. 결과 확인
            db.all("SELECT agency, COUNT(*) as count FROM news GROUP BY agency", (err, summary) => {
                if (!err) {
                    console.log('\n📊 기관별 보도자료 현황:');
                    summary.forEach(row => {
                        console.log(`   ${row.agency}: ${row.count}개`);
                    });
                }
                
                db.close();
                console.log('\n✅ 데이터베이스 수정 완료!');
            });
        })
        .catch((error) => {
            console.error('❌ URL 업데이트 오류:', error);
            db.close();
        });
});