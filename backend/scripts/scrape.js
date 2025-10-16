#!/usr/bin/env node

/**
 * 수동 스크래핑 실행 스크립트
 */

const { initDatabase } = require('../src/models/database');
const { scrapeAllAgencies } = require('../src/services/scraper');
const { logger } = require('../src/utils/logger');

async function runManualScraping() {
    console.log('🔄 수동 스크래핑을 시작합니다...\n');
    
    try {
        // 데이터베이스 초기화
        await initDatabase();
        console.log('✅ 데이터베이스 연결 완료\n');
        
        // 스크래핑 실행
        const startTime = Date.now();
        const results = await scrapeAllAgencies();
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        // 결과 출력
        console.log('\n📊 스크래핑 결과:');
        console.log('='.repeat(50));
        
        if (results.success.length > 0) {
            console.log('✅ 성공한 기관:');
            results.success.forEach(result => {
                console.log(`  - ${result.agency}: 신규 ${result.newItems}개 / 총 ${result.total}개`);
            });
        }
        
        if (results.errors.length > 0) {
            console.log('\n❌ 실패한 기관:');
            results.errors.forEach(error => {
                console.log(`  - ${error.agency}: ${error.error}`);
            });
        }
        
        console.log('\n📈 요약:');
        console.log(`  • 총 신규 항목: ${results.summary.totalNew}개`);
        console.log(`  • 총 처리 항목: ${results.summary.totalProcessed}개`);
        console.log(`  • 소요 시간: ${duration}초`);
        console.log(`  • 성공 기관: ${results.success.length}개`);
        console.log(`  • 실패 기관: ${results.errors.length}개`);
        
        console.log('\n🎉 스크래핑이 완료되었습니다!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n💥 스크래핑 중 오류가 발생했습니다:');
        console.error(error.message);
        logger.error('수동 스크래핑 오류:', error);
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    runManualScraping();
}

module.exports = { runManualScraping };