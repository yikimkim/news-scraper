#!/usr/bin/env node

/**
 * 정부 보도자료 스크래핑 서버 설치 스크립트
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 정부 보도자료 스크래핑 서버 설치를 시작합니다...\n');

// 1. 필요한 디렉토리 생성
const directories = [
    'data',
    'logs',
    'config'
];

console.log('📁 디렉토리 생성 중...');
directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ ${dir} 디렉토리 생성됨`);
    } else {
        console.log(`  ℹ️  ${dir} 디렉토리 이미 존재함`);
    }
});

// 2. 환경 설정 파일 생성
const configPath = path.join(__dirname, '..', 'config', 'config.json');
if (!fs.existsSync(configPath)) {
    console.log('\n⚙️ 기본 설정 파일 생성 중...');
    
    const config = {
        server: {
            port: process.env.PORT || 3000,
            environment: process.env.NODE_ENV || 'development'
        },
        scraping: {
            schedules: {
                weekday_morning: '0 9 * * 1-5',
                weekday_afternoon: '0 13 * * 1-5', 
                weekday_evening: '0 17 * * 1-5',
                weekend: '0 14 * * 6'
            },
            timeout: 30000,
            retryAttempts: 3,
            delayBetweenAgencies: 2000
        },
        database: {
            path: './data/government_news.db',
            maxConnections: 10,
            cleanupDays: 30
        },
        logging: {
            level: 'info',
            maxFileSize: '5m',
            maxFiles: 5
        }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('  ✅ config/config.json 파일 생성됨');
} else {
    console.log('  ℹ️ 설정 파일이 이미 존재합니다');
}

// 3. PM2 ecosystem 파일 생성 (배포용)
const pm2ConfigPath = path.join(__dirname, '..', 'ecosystem.config.js');
if (!fs.existsSync(pm2ConfigPath)) {
    console.log('\n🔧 PM2 설정 파일 생성 중...');
    
    const pm2Config = `module.exports = {
    apps: [{
        name: 'government-news-scraper',
        script: './src/app.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        env_development: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        log_file: './logs/pm2.log',
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        time: true
    }]
};`;
    
    fs.writeFileSync(pm2ConfigPath, pm2Config);
    console.log('  ✅ ecosystem.config.js 파일 생성됨');
}

// 4. README 파일 생성
const readmePath = path.join(__dirname, '..', 'README.md');
if (!fs.existsSync(readmePath)) {
    console.log('\n📝 README 파일 생성 중...');
    
    const readme = `# 정부 보도자료 자동 스크래핑 서버

## 개요
한국의 주요 정부 기관(금융위원회, 금융감독원, 공정거래위원회)의 보도자료를 자동으로 수집하고 API로 제공하는 서버입니다.

## 주요 기능
- 🕘 자동 스케줄링: 평일 9시, 13시, 17시 + 주말 1회
- 🚫 중복 제거: 해시 기반 중복 보도자료 방지
- 📊 통계 제공: 수집 현황 및 기관별 통계
- 🔄 수동 스크래핑: 즉시 업데이트 기능
- 📱 REST API: 프론트엔드 연동 지원

## 실행 방법

### 개발 환경
\`\`\`bash
npm install
npm run dev
\`\`\`

### 프로덕션 환경
\`\`\`bash
npm install --production
npm start
\`\`\`

### PM2 사용 (권장)
\`\`\`bash
npm install -g pm2
pm2 start ecosystem.config.js
\`\`\`

## API 엔드포인트

- \`GET /api/news\` - 보도자료 목록
- \`GET /api/news/stats\` - 통계 정보
- \`POST /api/news/scrape\` - 수동 스크래핑
- \`GET /api/news/scheduler\` - 스케줄러 상태
- \`GET /health\` - 헬스 체크

## 환경 변수
- \`PORT\`: 서버 포트 (기본: 3000)
- \`NODE_ENV\`: 환경 (development/production)
- \`LOG_LEVEL\`: 로그 레벨 (debug/info/warn/error)

## 로그 파일
- \`logs/app.log\`: 전체 로그
- \`logs/error.log\`: 에러 로그
- \`logs/scraping.log\`: 스크래핑 로그

## 데이터베이스
- SQLite3 사용 (\`data/government_news.db\`)
- 자동 스키마 생성
- 30일 이전 데이터 자동 정리
`;

    fs.writeFileSync(readmePath, readme);
    console.log('  ✅ README.md 파일 생성됨');
}

// 5. 완료 메시지
console.log('\n🎉 설치가 완료되었습니다!');
console.log('\n📋 다음 단계:');
console.log('1. npm install          # 의존성 설치');
console.log('2. npm run dev          # 개발 서버 실행');
console.log('3. http://localhost:3000 # 브라우저에서 확인');
console.log('\n💡 프로덕션 배포 시:');
console.log('1. npm install -g pm2');
console.log('2. pm2 start ecosystem.config.js');
console.log('3. pm2 save && pm2 startup');
console.log('\n🔗 API 문서: http://localhost:3000/health');