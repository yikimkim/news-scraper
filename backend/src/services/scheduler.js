const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { scrapeAllAgencies } = require('./scraper');
const { getScrapingStats } = require('../models/news');

/**
 * 스케줄된 스크래핑 작업 상태
 */
let scheduledTasks = [];
let isRunning = false;

/**
 * 스크래핑 작업 실행
 */
async function executeScraping(scheduledTime = 'manual') {
    if (isRunning) {
        logger.warn('이미 스크래핑이 실행 중입니다. 중복 실행을 방지합니다.');
        return { error: 'Already running' };
    }

    isRunning = true;
    const startTime = new Date();
    
    logger.info(`🚀 정기 스크래핑 시작 (${scheduledTime})`);
    
    try {
        // 스크래핑 실행
        const results = await scrapeAllAgencies();
        
        // 실행 시간 계산
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);
        
        // 결과 로깅
        logger.info(`✅ 스크래핑 완료 (${duration}초 소요)`);
        logger.info(`📊 결과: 신규 ${results.summary.totalNew}개, 총 처리 ${results.summary.totalProcessed}개`);
        
        if (results.errors.length > 0) {
            logger.warn(`⚠️ 오류 발생: ${results.errors.length}개 기관에서 문제 발생`);
            results.errors.forEach(err => {
                logger.error(`  - ${err.agency}: ${err.error}`);
            });
        }

        // 통계 업데이트
        const stats = await getScrapingStats();
        logger.info(`📈 현재 DB 상태: 총 ${stats.total}개 보도자료 저장됨`);

        return {
            success: true,
            results,
            duration,
            timestamp: endTime,
            scheduledTime
        };

    } catch (error) {
        logger.error('스크래핑 실행 중 오류:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date(),
            scheduledTime
        };
    } finally {
        isRunning = false;
    }
}

/**
 * 크론 스케줄 시작
 */
function startScheduledScraping() {
    logger.info('⏰ 자동 스크래핑 스케줄러 설정 중...');

    // 기존 스케줄 정리
    scheduledTasks.forEach(task => {
        if (task.destroy) task.destroy();
    });
    scheduledTasks = [];

    // 1. 오전 9시 스크래핑 (월-금)
    const morningTask = cron.schedule('0 9 * * 1-5', async () => {
        await executeScraping('오전 9시 정기');
    }, {
        scheduled: false,
        timezone: "Asia/Seoul"
    });

    // 2. 오후 1시 스크래핑 (월-금)  
    const afternoonTask = cron.schedule('0 13 * * 1-5', async () => {
        await executeScraping('오후 1시 정기');
    }, {
        scheduled: false,
        timezone: "Asia/Seoul"
    });

    // 3. 오후 5시 스크래핑 (월-금)
    const eveningTask = cron.schedule('0 17 * * 1-5', async () => {
        await executeScraping('오후 5시 정기');
    }, {
        scheduled: false,
        timezone: "Asia/Seoul"
    });

    // 4. 주말 한 번 스크래핑 (토요일 오후 2시)
    const weekendTask = cron.schedule('0 14 * * 6', async () => {
        await executeScraping('주말 정기');
    }, {
        scheduled: false,
        timezone: "Asia/Seoul"
    });

    // 스케줄 시작
    morningTask.start();
    afternoonTask.start();
    eveningTask.start();
    weekendTask.start();

    // 작업 목록에 추가
    scheduledTasks.push(
        { name: '오전 9시', task: morningTask, cron: '0 9 * * 1-5' },
        { name: '오후 1시', task: afternoonTask, cron: '0 13 * * 1-5' },
        { name: '오후 5시', task: eveningTask, cron: '0 17 * * 1-5' },
        { name: '주말', task: weekendTask, cron: '0 14 * * 6' }
    );

    logger.info('✅ 스케줄러 설정 완료:');
    scheduledTasks.forEach(({ name, cron }) => {
        logger.info(`  - ${name}: ${cron} (한국시간)`);
    });

    // 초기 스크래핑 실행 (서버 시작 시)
    setTimeout(async () => {
        logger.info('🔄 서버 시작 후 초기 스크래핑 실행');
        await executeScraping('서버 시작');
    }, 5000); // 5초 후 실행
}

/**
 * 스케줄러 중지
 */
function stopScheduledScraping() {
    logger.info('⏹️ 스케줄된 스크래핑 중지');
    
    scheduledTasks.forEach(({ name, task }) => {
        task.stop();
        logger.info(`  - ${name} 스케줄 중지됨`);
    });
    
    scheduledTasks = [];
}

/**
 * 다음 스크래핑 시간 계산
 */
function getNextScheduledTime() {
    const now = new Date();
    const koreanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    
    // 오늘의 스케줄된 시간들 (한국시간)
    const today = new Date(koreanTime);
    const schedules = [
        new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),  // 9시
        new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0), // 13시
        new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0)  // 17시
    ];

    // 오늘 남은 시간 중 가장 가까운 시간 찾기
    for (const schedule of schedules) {
        if (schedule > koreanTime) {
            return schedule;
        }
    }

    // 오늘 스케줄이 모두 지났으면 내일 9시
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    return tomorrow;
}

/**
 * 스크래핑 상태 정보
 */
function getSchedulerStatus() {
    return {
        isRunning,
        activeTasks: scheduledTasks.length,
        nextScheduledTime: getNextScheduledTime(),
        schedules: scheduledTasks.map(({ name, cron }) => ({ name, cron }))
    };
}

/**
 * 테스트용 즉시 스크래핑 실행
 */
async function runImmediateScraping() {
    logger.info('🧪 테스트 스크래핑 실행 요청');
    return await executeScraping('수동 테스트');
}

module.exports = {
    startScheduledScraping,
    stopScheduledScraping,
    getSchedulerStatus,
    runImmediateScraping,
    executeScraping
};