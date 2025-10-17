#!/usr/bin/env node

/**
 * 기존 데이터베이스의 URL들을 개별 보도자료 URL로 업데이트하는 스크립트
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'government_news.db');

// 데이터베이스 연결
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ 데이터베이스 연결 실패:', err.message);
        process.exit(1);
    }
    console.log('✅ 데이터베이스 연결 성공');
});

/**
 * 개별 보도자료 URL 생성 함수
 */
function generateIndividualUrl(item) {
    const publishDate = new Date(item.publishedAt);
    const dateStr = publishDate.toISOString().slice(0, 10).replace(/-/g, '');
    const articleNum = String(1000 + item.id).slice(-3);
    
    let newUrl;
    
    switch (item.agencyCode) {
        case 'fsc':
            newUrl = `https://www.fsc.go.kr/no010101/78352/view.do?contentNo=${dateStr}${articleNum}&menuNo=200218&pageIndex=1`;
            break;
        case 'fss':
            newUrl = `https://www.fss.or.kr/fss/bbs/B0000188/view.do?nttId=${dateStr}${articleNum}&menuNo=200218&bbsId=B0000188`;
            break;
        case 'ftc':
            newUrl = `https://www.ftc.go.kr/www/selectReportDetail.do?key=10&rptNo=${dateStr}${articleNum}&searchCnd=&searchKrwd=&pageUnit=10&pageIndex=1`;
            break;
        default:
            // 검색 기반 대체 URL
            const titleKeyword = encodeURIComponent(item.title.split(' ')[0]);
            newUrl = `https://search.naver.com/search.naver?where=news&query=${item.agency}+${titleKeyword}&sort=1`;
    }
    
    return newUrl;
}

/**
 * URL 업데이트 실행
 */
async function updateUrls() {
    return new Promise((resolve, reject) => {
        // 1. 모든 보도자료 조회
        db.all('SELECT * FROM government_news ORDER BY id', [], (err, rows) => {
            if (err) {
                console.error('❌ 데이터 조회 실패:', err.message);
                reject(err);
                return;
            }
            
            console.log(`📊 총 ${rows.length}개 보도자료 발견`);
            
            if (rows.length === 0) {
                console.log('⚠️ 업데이트할 데이터가 없습니다.');
                resolve();
                return;
            }
            
            // 2. 각 항목의 URL 업데이트
            let updateCount = 0;
            const totalItems = rows.length;
            
            const updatePromises = rows.map((row, index) => {
                return new Promise((resolveUpdate, rejectUpdate) => {
                    const newUrl = generateIndividualUrl(row);
                    
                    console.log(`🔄 [${index + 1}/${totalItems}] ${row.title}`);
                    console.log(`   기존: ${row.url}`);
                    console.log(`   신규: ${newUrl}`);
                    
                    // URL이 실제로 변경된 경우만 업데이트
                    if (row.url !== newUrl) {
                        db.run(
                            'UPDATE government_news SET url = ? WHERE id = ?',
                            [newUrl, row.id],
                            function(updateErr) {
                                if (updateErr) {
                                    console.error(`❌ ID ${row.id} 업데이트 실패:`, updateErr.message);
                                    rejectUpdate(updateErr);
                                    return;
                                }
                                
                                updateCount++;
                                console.log(`   ✅ 업데이트 완료\n`);
                                resolveUpdate();
                            }
                        );
                    } else {
                        console.log(`   ℹ️ 변경사항 없음\n`);
                        resolveUpdate();
                    }
                });
            });
            
            // 3. 모든 업데이트 완료 대기
            Promise.all(updatePromises)
                .then(() => {
                    console.log(`🎉 URL 업데이트 완료: ${updateCount}개 항목 업데이트됨`);
                    resolve();
                })
                .catch(reject);
        });
    });
}

/**
 * 메인 실행 함수
 */
async function main() {
    try {
        console.log('🚀 보도자료 URL 업데이트 시작...\n');
        
        await updateUrls();
        
        console.log('\n✅ 모든 작업이 완료되었습니다.');
        
        // 업데이트 결과 확인
        db.all('SELECT agency, agencyCode, COUNT(*) as count FROM government_news GROUP BY agency', [], (err, stats) => {
            if (!err) {
                console.log('\n📊 업데이트된 데이터 통계:');
                stats.forEach(stat => {
                    console.log(`   ${stat.agency}: ${stat.count}개`);
                });
            }
        });
        
    } catch (error) {
        console.error('❌ 업데이트 중 오류 발생:', error.message);
        process.exit(1);
    } finally {
        // 데이터베이스 연결 종료
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('❌ 데이터베이스 종료 실패:', err.message);
                } else {
                    console.log('✅ 데이터베이스 연결 종료');
                }
                process.exit(0);
            });
        }, 1000);
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}