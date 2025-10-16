const { getDatabase } = require('./database');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * 제목 해시 생성 (중복 검사용)
 */
function generateHash(title, agencyCode) {
    return crypto
        .createHash('md5')
        .update(`${title.trim().toLowerCase()}_${agencyCode}`)
        .digest('hex');
}

/**
 * 뉴스 아이템 저장
 */
async function saveNewsItem(newsData) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        const hash = generateHash(newsData.title, newsData.agencyCode);
        
        const sql = `
            INSERT INTO news (
                title, summary, url, agency, agency_code, 
                published_at, scraped_at, hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            newsData.title,
            newsData.summary,
            newsData.url,
            newsData.agency,
            newsData.agencyCode,
            newsData.publishedAt?.toISOString() || new Date().toISOString(),
            newsData.scrapedAt?.toISOString() || new Date().toISOString(),
            hash
        ];

        db.run(sql, params, function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    logger.warn(`중복 뉴스 건너뜀: ${newsData.title}`);
                    resolve({ id: null, duplicate: true });
                } else {
                    logger.error('뉴스 저장 오류:', err.message);
                    reject(err);
                }
            } else {
                logger.debug(`뉴스 저장됨 (ID: ${this.lastID}): ${newsData.title}`);
                resolve({ id: this.lastID, duplicate: false });
            }
        });
    });
}

/**
 * 중복 검사
 */
async function isDuplicate(title, agencyCode) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        const hash = generateHash(title, agencyCode);
        
        const sql = 'SELECT id FROM news WHERE hash = ? AND is_active = 1';
        
        db.get(sql, [hash], (err, row) => {
            if (err) {
                logger.error('중복 검사 오류:', err.message);
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
}

/**
 * 뉴스 목록 조회
 */
async function getNews(options = {}) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        let sql = `
            SELECT id, title, summary, url, agency, agency_code,
                   published_at, scraped_at, created_at
            FROM news 
            WHERE is_active = 1
        `;
        
        const params = [];
        
        // 기관별 필터
        if (options.agencyCode && options.agencyCode !== 'all') {
            sql += ' AND agency_code = ?';
            params.push(options.agencyCode);
        }
        
        // 날짜 필터
        if (options.since) {
            sql += ' AND published_at >= ?';
            params.push(options.since.toISOString());
        }
        
        // 정렬
        sql += ' ORDER BY published_at DESC, created_at DESC';
        
        // 페이징
        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(options.limit);
            
            if (options.offset) {
                sql += ' OFFSET ?';
                params.push(options.offset);
            }
        }

        db.all(sql, params, (err, rows) => {
            if (err) {
                logger.error('뉴스 조회 오류:', err.message);
                reject(err);
            } else {
                // 날짜 파싱
                const news = rows.map(row => ({
                    ...row,
                    published_at: new Date(row.published_at),
                    scraped_at: new Date(row.scraped_at),
                    created_at: new Date(row.created_at)
                }));
                resolve(news);
            }
        });
    });
}

/**
 * 뉴스 개수 조회
 */
async function getNewsCount(options = {}) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        let sql = 'SELECT COUNT(*) as count FROM news WHERE is_active = 1';
        const params = [];
        
        if (options.agencyCode && options.agencyCode !== 'all') {
            sql += ' AND agency_code = ?';
            params.push(options.agencyCode);
        }
        
        if (options.since) {
            sql += ' AND published_at >= ?';
            params.push(options.since.toISOString());
        }

        db.get(sql, params, (err, row) => {
            if (err) {
                logger.error('뉴스 개수 조회 오류:', err.message);
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
}

/**
 * 스크래핑 통계 조회
 */
async function getScrapingStats() {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        const queries = {
            total: 'SELECT COUNT(*) as count FROM news WHERE is_active = 1',
            today: `
                SELECT COUNT(*) as count FROM news 
                WHERE is_active = 1 AND DATE(scraped_at) = DATE('now')
            `,
            thisWeek: `
                SELECT COUNT(*) as count FROM news 
                WHERE is_active = 1 AND scraped_at >= DATE('now', '-7 days')
            `,
            byAgency: `
                SELECT agency_code, agency, COUNT(*) as count 
                FROM news 
                WHERE is_active = 1 
                GROUP BY agency_code, agency
                ORDER BY count DESC
            `
        };

        const stats = {};
        let completedQueries = 0;
        const totalQueries = Object.keys(queries).length;

        Object.entries(queries).forEach(([key, sql]) => {
            if (key === 'byAgency') {
                db.all(sql, [], (err, rows) => {
                    if (err) {
                        logger.error(`통계 조회 오류 (${key}):`, err.message);
                        stats[key] = [];
                    } else {
                        stats[key] = rows;
                    }
                    
                    completedQueries++;
                    if (completedQueries === totalQueries) {
                        resolve(stats);
                    }
                });
            } else {
                db.get(sql, [], (err, row) => {
                    if (err) {
                        logger.error(`통계 조회 오류 (${key}):`, err.message);
                        stats[key] = 0;
                    } else {
                        stats[key] = row.count;
                    }
                    
                    completedQueries++;
                    if (completedQueries === totalQueries) {
                        resolve(stats);
                    }
                });
            }
        });
    });
}

/**
 * 오래된 뉴스 정리 (30일 이전)
 */
async function cleanupOldNews(daysToKeep = 30) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        const sql = `
            UPDATE news 
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE published_at < DATE('now', '-' || ? || ' days')
            AND is_active = 1
        `;
        
        db.run(sql, [daysToKeep], function(err) {
            if (err) {
                logger.error('오래된 뉴스 정리 오류:', err.message);
                reject(err);
            } else {
                logger.info(`${this.changes}개의 오래된 뉴스가 비활성화되었습니다`);
                resolve(this.changes);
            }
        });
    });
}

module.exports = {
    saveNewsItem,
    isDuplicate,
    getNews,
    getNewsCount,
    getScrapingStats,
    cleanupOldNews
};