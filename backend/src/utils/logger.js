const winston = require('winston');
const path = require('path');

// 로그 디렉토리 생성
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Winston 로거 설정
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
        })
    ),
    transports: [
        // 콘솔 출력
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // 전체 로그 파일
        new winston.transports.File({
            filename: path.join(logDir, 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // 에러 로그 파일
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 3
        }),
        // 스크래핑 전용 로그 파일
        new winston.transports.File({
            filename: path.join(logDir, 'scraping.log'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 7
        })
    ]
});

// 개발 환경에서는 더 자세한 로그
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} [${level}]: ${message}`;
            })
        )
    }));
}

// 스크래핑 전용 로거
const scrapingLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'scraping-details.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10
        })
    ]
});

/**
 * 스크래핑 결과 로깅
 */
function logScrapingResult(agencyCode, result) {
    const logData = {
        timestamp: new Date().toISOString(),
        agency: agencyCode,
        success: result.success || false,
        newItems: result.newItems || 0,
        totalItems: result.totalItems || 0,
        duration: result.duration || 0,
        errors: result.errors || []
    };

    scrapingLogger.info('scraping-result', logData);
    
    if (result.success) {
        logger.info(`✅ ${agencyCode}: ${result.newItems}개 신규 항목 (${result.duration}ms)`);
    } else {
        logger.error(`❌ ${agencyCode}: 스크래핑 실패 - ${result.error}`);
    }
}

/**
 * 성능 측정 헬퍼
 */
function createTimer(name) {
    const start = Date.now();
    
    return {
        end: () => {
            const duration = Date.now() - start;
            logger.info(`⏱️ ${name}: ${duration}ms`);
            return duration;
        }
    };
}

/**
 * 에러 로깅 헬퍼
 */
function logError(context, error) {
    logger.error(`${context}:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    logger,
    scrapingLogger,
    logScrapingResult,
    createTimer,
    logError
};