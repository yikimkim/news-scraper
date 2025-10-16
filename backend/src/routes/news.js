const express = require('express');
const router = express.Router();
const { getNews, getNewsCount, getScrapingStats } = require('../models/news');
const { runImmediateScraping, getSchedulerStatus } = require('../services/scheduler');
const { logger } = require('../utils/logger');

/**
 * 정부 보도자료 목록 조회
 * GET /api/news
 */
router.get('/', async (req, res) => {
    try {
        const {
            agency = 'all',
            page = 1,
            limit = 6,
            since
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const options = {
            agencyCode: agency,
            limit: limitNum,
            offset: offset
        };

        // 날짜 필터
        if (since) {
            options.since = new Date(since);
        }

        // 뉴스 목록과 총 개수 조회
        const [news, totalCount] = await Promise.all([
            getNews(options),
            getNewsCount({ agencyCode: agency, since: options.since })
        ]);

        // 응답 데이터 포맷
        const formattedNews = news.map(item => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            url: item.url,
            agency: item.agency,
            agencyCode: item.agency_code,
            publishedAt: item.published_at,
            scrapedAt: item.scraped_at,
            date: formatDate(item.published_at)
        }));

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            success: true,
            data: formattedNews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalCount,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            },
            agency: agency,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('뉴스 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '뉴스 목록을 불러오는 중 오류가 발생했습니다.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 통계 정보 조회
 * GET /api/news/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await getScrapingStats();
        
        res.json({
            success: true,
            data: {
                total: stats.total || 0,
                today: stats.today || 0,
                thisWeek: stats.thisWeek || 0,
                byAgency: stats.byAgency || []
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '통계 정보를 불러오는 중 오류가 발생했습니다.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 수동 스크래핑 실행
 * POST /api/news/scrape
 */
router.post('/scrape', async (req, res) => {
    try {
        logger.info('수동 스크래핑 요청 받음');
        
        // 스크래핑 실행 (비동기)
        const result = await runImmediateScraping();
        
        if (result.success) {
            res.json({
                success: true,
                message: '스크래핑이 완료되었습니다.',
                data: {
                    newItems: result.results.summary.totalNew,
                    totalProcessed: result.results.summary.totalProcessed,
                    duration: result.duration,
                    agencies: result.results.success.map(r => ({
                        agency: r.agency,
                        newItems: r.newItems,
                        total: r.total
                    })),
                    errors: result.results.errors
                },
                timestamp: result.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                timestamp: result.timestamp
            });
        }

    } catch (error) {
        logger.error('수동 스크래핑 오류:', error);
        res.status(500).json({
            success: false,
            error: '스크래핑 중 오류가 발생했습니다.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 스케줄러 상태 조회
 * GET /api/news/scheduler
 */
router.get('/scheduler', (req, res) => {
    try {
        const status = getSchedulerStatus();
        
        res.json({
            success: true,
            data: {
                isRunning: status.isRunning,
                activeTasks: status.activeTasks,
                nextScheduledTime: status.nextScheduledTime,
                schedules: status.schedules
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('스케줄러 상태 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '스케줄러 상태를 불러오는 중 오류가 발생했습니다.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 특정 기관의 최신 뉴스 조회
 * GET /api/news/agency/:code
 */
router.get('/agency/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { limit = 10 } = req.query;

        const news = await getNews({
            agencyCode: code,
            limit: parseInt(limit)
        });

        const formattedNews = news.map(item => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            url: item.url,
            agency: item.agency,
            publishedAt: item.published_at,
            date: formatDate(item.published_at)
        }));

        res.json({
            success: true,
            data: formattedNews,
            agency: code,
            count: formattedNews.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error(`기관별 뉴스 조회 오류 (${req.params.code}):`, error);
        res.status(500).json({
            success: false,
            error: '기관별 뉴스를 불러오는 중 오류가 발생했습니다.',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 헬스 체크 (뉴스 API)
 * GET /api/news/health
 */
router.get('/health', async (req, res) => {
    try {
        const stats = await getScrapingStats();
        
        res.json({
            success: true,
            status: 'healthy',
            data: {
                totalNews: stats.total,
                lastUpdate: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 날짜 포맷팅 함수
 */
function formatDate(date) {
    const now = new Date();
    const inputDate = new Date(date);
    const diffMs = now - inputDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${Math.max(1, diffMinutes)}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        const month = inputDate.getMonth() + 1;
        const day = inputDate.getDate();
        return `${month}월 ${day}일`;
    }
}

module.exports = router;