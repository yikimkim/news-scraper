const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const winston = require('winston');

const { initDatabase } = require('./models/database');
const { startScheduledScraping } = require('./services/scheduler');
const newsRoutes = require('./routes/news');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(compression());
app.use(cors({
    origin: [
        'http://localhost:8000',
        'http://localhost:8080',
        'https://yikimkim.github.io',
        'https://8000-imyjsakhqpzwgwbkwlqpw-5c13a017.sandbox.novita.ai',
        'https://8080-imyjsakhqpzwgwbkwlqpw-5c13a017.sandbox.novita.ai', // 정확한 프론트엔드 URL
        /^https:\/\/\d+-.*\.sandbox\.novita\.ai$/ // 모든 sandbox URL 패턴
    ],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100 요청
    message: { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.static('../')); // 프론트엔드 파일 서빙

// API 라우트
app.use('/api/news', newsRoutes);

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../' });
});

// 헬스 체크
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 에러 핸들링
app.use((err, req, res, next) => {
    logger.error('서버 에러:', err);
    res.status(500).json({ 
        error: '내부 서버 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
    });
});

// 404 핸들링
app.use((req, res) => {
    res.status(404).json({ 
        error: '요청한 리소스를 찾을 수 없습니다.',
        path: req.path
    });
});

// 서버 시작
async function startServer() {
    try {
        // 데이터베이스 초기화
        await initDatabase();
        logger.info('데이터베이스 초기화 완료');

        // 서버 시작
        app.listen(PORT, () => {
            logger.info(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
            logger.info(`📊 헬스 체크: http://localhost:${PORT}/health`);
            logger.info(`🌐 프론트엔드: http://localhost:${PORT}/`);
        });

        // 스케줄된 스크래핑 시작
        startScheduledScraping();
        logger.info('⏰ 자동 스크래핑 스케줄러 시작 완료');

    } catch (error) {
        logger.error('서버 시작 중 오류:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('서버 종료 신호를 받았습니다.');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('서버를 종료합니다.');
    process.exit(0);
});

startServer();

module.exports = app;