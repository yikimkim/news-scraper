# 정부 보도자료 자동 스크래핑 서버

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
```bash
npm install
npm run dev
```

### 프로덕션 환경
```bash
npm install --production
npm start
```

### PM2 사용 (권장)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## API 엔드포인트

- `GET /api/news` - 보도자료 목록
- `GET /api/news/stats` - 통계 정보
- `POST /api/news/scrape` - 수동 스크래핑
- `GET /api/news/scheduler` - 스케줄러 상태
- `GET /health` - 헬스 체크

## 환경 변수
- `PORT`: 서버 포트 (기본: 3000)
- `NODE_ENV`: 환경 (development/production)
- `LOG_LEVEL`: 로그 레벨 (debug/info/warn/error)

## 로그 파일
- `logs/app.log`: 전체 로그
- `logs/error.log`: 에러 로그
- `logs/scraping.log`: 스크래핑 로그

## 데이터베이스
- SQLite3 사용 (`data/government_news.db`)
- 자동 스키마 생성
- 30일 이전 데이터 자동 정리
