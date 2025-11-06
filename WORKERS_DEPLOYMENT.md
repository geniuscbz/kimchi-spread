# Cloudflare Workers 배포 가이드

## 필수 요구사항

1. **Cloudflare 계정** (무료 계정 가능)
2. **Wrangler CLI** 설치
```bash
npm install -g wrangler
```

## 배포 방법

### 1. Wrangler 로그인
```bash
wrangler login
```

### 2. Account ID 설정
1. Cloudflare Dashboard에서 Account ID 복사
2. `wrangler.toml` 파일에서 주석 제거 및 입력:
```toml
account_id = "your_account_id_here"
```

### 3. 배포
```bash
wrangler deploy
```

## 환경 변수 설정 (선택사항)

텔레그램 알림을 사용하려면:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

또는 Cloudflare Dashboard에서:
1. Workers & Pages 선택
2. kimchi-spread 선택
3. Settings > Variables
4. Add variable: `TELEGRAM_BOT_TOKEN`

## 배포 후 URL

```
https://kimchi-spread.your-subdomain.workers.dev
```

또는 커스텀 도메인 연결 가능

## API 엔드포인트

- `GET /` - 메인 페이지
- `GET /api/upbit?symbol=KRW-BTC` - 업비트 가격
- `GET /api/binance?symbol=BTCUSDT` - 바이낸스 가격
- `GET /api/exchange-rate` - 실시간 환율
- `POST /api/telegram` - 텔레그램 알림
- `GET /health` - 서버 상태

## Cloudflare Workers 장점

✅ **무제한 요청** - 무료 플랜: 100,000 req/day
✅ **빠른 글로벌 CDN** - 전 세계 300+ 데이터센터
✅ **0ms 콜드 스타트** - V8 Isolates 사용
✅ **자동 HTTPS** - SSL 인증서 자동
✅ **슬립 없음** - 24/7 항상 활성

## 로컬 개발

```bash
wrangler dev
```

로컬 서버: http://localhost:8787

## 문제 해결

### 에러: "account_id is required"
- `wrangler.toml`에 account_id 추가

### 에러: "authentication required"
- `wrangler login` 실행

### HTML이 표시되지 않음
- `wrangler deploy` 시 index.html이 자동으로 인라인됨
- worker.js의 `import indexHtml from './index.html'` 확인

## 커스텀 도메인 연결

1. Cloudflare에 도메인 추가
2. `wrangler.toml`의 routes 섹션 주석 제거 및 수정:
```toml
[[routes]]
pattern = "your-domain.com/*"
zone_name = "your-domain.com"
```
3. 재배포: `wrangler deploy`

## 비용

- **무료 플랜**: 100,000 requests/day
- **유료 플랜**: $5/month for 10M requests

대부분의 경우 무료 플랜으로 충분합니다!
