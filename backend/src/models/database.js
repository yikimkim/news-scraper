const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('../utils/logger');

// 데이터베이스 경로
const DB_PATH = path.join(__dirname, '../../data/government_news.db');

let db;

/**
 * 데이터베이스 초기화
 */
async function initDatabase() {
    return new Promise((resolve, reject) => {
        // data 디렉토리 생성
        const fs = require('fs');
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                logger.error('데이터베이스 연결 오류:', err.message);
                reject(err);
                return;
            }
            
            logger.info(`데이터베이스 연결됨: ${DB_PATH}`);
            createTables()
                .then(resolve)
                .catch(reject);
        });
    });
}

/**
 * 데이터베이스 테이블 생성
 */
function createTables() {
    return new Promise((resolve, reject) => {
        const createNewsTable = `
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                summary TEXT,
                url TEXT,
                agency TEXT NOT NULL,
                agency_code TEXT NOT NULL,
                published_at DATETIME,
                scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                hash TEXT UNIQUE
            )
        `;

        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_agency_code ON news(agency_code)',
            'CREATE INDEX IF NOT EXISTS idx_published_at ON news(published_at)',
            'CREATE INDEX IF NOT EXISTS idx_scraped_at ON news(scraped_at)', 
            'CREATE INDEX IF NOT EXISTS idx_hash ON news(hash)',
            'CREATE INDEX IF NOT EXISTS idx_active ON news(is_active)'
        ];

        const createStatsTable = `
            CREATE TABLE IF NOT EXISTS scraping_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                agency_code TEXT NOT NULL,
                total_scraped INTEGER DEFAULT 0,
                new_items INTEGER DEFAULT 0,
                errors INTEGER DEFAULT 0,
                duration_seconds INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(date, agency_code)
            )
        `;

        db.serialize(() => {
            // 뉴스 테이블 생성
            db.run(createNewsTable, (err) => {
                if (err) {
                    logger.error('뉴스 테이블 생성 오류:', err.message);
                    reject(err);
                    return;
                }
                logger.info('뉴스 테이블 생성/확인 완료');
            });

            // 인덱스 생성
            createIndexes.forEach((indexSql, i) => {
                db.run(indexSql, (err) => {
                    if (err) {
                        logger.error(`인덱스 ${i + 1} 생성 오류:`, err.message);
                    }
                });
            });

            // 통계 테이블 생성
            db.run(createStatsTable, (err) => {
                if (err) {
                    logger.error('통계 테이블 생성 오류:', err.message);
                    reject(err);
                    return;
                }
                logger.info('통계 테이블 생성/확인 완료');
                resolve();
            });
        });
    });
}

/**
 * 데이터베이스 연결 반환
 */
function getDatabase() {
    if (!db) {
        throw new Error('데이터베이스가 초기화되지 않았습니다');
    }
    return db;
}

/**
 * 데이터베이스 종료
 */
function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    logger.error('데이터베이스 종료 오류:', err.message);
                    reject(err);
                } else {
                    logger.info('데이터베이스 연결이 종료되었습니다');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase
};