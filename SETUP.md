# 🌶️ 김치스프레드 설치 가이드

## 📋 목차
1. [빠른 시작](#빠른-시작)
2. [텔레그램 봇 설정](#텔레그램-봇-설정)
3. [웹 배포하기](#웹-배포하기)
4. [문제 해결](#문제-해결)

---

## 🚀 빠른 시작

### 방법 1: 브라우저에서 바로 실행

1. **index.html 파일 열기**
   ```bash
   # 파일 탐색기에서 index.html 더블클릭
   # 또는 명령어로:
   start C:\Users\mibank\index.html
   ```

2. **데이터 확인**
   - BTC 선택하고 2-3초 기다리기
   - 차트에 데이터가 나타나면 성공!

> ⚠️ CORS 오류가 발생하면 방법 2를 사용하세요.

### 방법 2: 로컬 서버 실행 (권장)

1. **서버 시작**
   ```bash
   cd C:\Users\mibank
   npm install
   npm start
   ```

2. **브라우저에서 index.html 열기**
   ```bash
   start index.html
   ```

3. **프록시 모드 활성화**
   - UI에서 "프록시 서버 사용" 체크박스 클릭

---

## 📱 텔레그램 봇 설정

### 1단계: 텔레그램 봇 생성

1. **텔레그램 앱에서 @BotFather 검색**

2. **/newbot 명령어 입력**

3. **봇 이름 입력** (예: 김치스프레드알림봇)

4. **봇 사용자명 입력** (예: kimchi_spread_bot)
   - 반드시 `_bot` 또는 `Bot`으로 끝나야 합니다

5. **토큰 복사**
   ```
   예시: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### 2단계: Chat ID 확인

1. **텔레그램에서 @userinfobot 검색**

2. **/start 입력**

3. **Chat ID 복사** (예: 987654321)

### 3단계: 로컬 서버에 설정

**Windows:**
```bash
set TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
npm start
```

**Mac/Linux:**
```bash
export TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
npm start
```

### 4단계: 웹에서 연결

1. **index.html 열기**

2. **텔레그램 연동 패널에서:**
   - Chat ID 입력: `987654321`
   - "연결" 버튼 클릭

3. **테스트 메시지 수신 확인**

---

## 🌐 웹 배포하기

### Vercel 배포 (가장 쉬움)

1. **GitHub에 코드 업로드**
   ```bash
   cd C:\Users\mibank
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/kimchi-spread.git
   git push -u origin main
   ```

2. **Vercel에서 배포**
   - https://vercel.com 접속
   - "New Project" 클릭
   - GitHub 레포지토리 연결
   - "Deploy" 클릭

3. **환경 변수 설정**
   - Project Settings > Environment Variables
   - 추가: `TELEGRAM_BOT_TOKEN` = `your_bot_token`
   - Redeploy 클릭

4. **완료!**
   - 배포된 URL 접속 (예: `https://kimchi-spread.vercel.app`)
   - 자동으로 프록시 모드 활성화됨

### Netlify 배포

1. **GitHub에 코드 업로드** (위와 동일)

2. **Netlify에서 배포**
   - https://netlify.com 접속
   - "Add new site" > "Import an existing project"
   - GitHub 레포지토리 선택
   - "Deploy site" 클릭

3. **환경 변수 설정**
   - Site settings > Environment variables
   - 추가: `TELEGRAM_BOT_TOKEN` = `your_bot_token`
   - Trigger deploy

---

## 🔧 문제 해결

### 문제 1: CORS 오류

**증상:**
```
Access to fetch at 'https://api.upbit.com/...' has been blocked by CORS policy
```

**해결책:**
1. 로컬 서버 실행: `npm start`
2. "프록시 서버 사용" 체크박스 활성화

### 문제 2: 데이터가 안 나와요

**체크리스트:**
- [ ] 인터넷 연결 확인
- [ ] 브라우저 콘솔(F12) 에러 확인
- [ ] 프록시 모드 활성화 시도
- [ ] 다른 브라우저로 테스트

**브라우저 콘솔 여는 법:**
- Chrome/Edge: `F12` 또는 `Ctrl+Shift+I`
- Firefox: `F12`
- Safari: `Command+Option+I`

### 문제 3: 텔레그램 알림이 안 와요

**체크리스트:**
- [ ] TELEGRAM_BOT_TOKEN 환경 변수 설정 확인
- [ ] Chat ID가 올바른지 확인
- [ ] 봇이 차단되지 않았는지 확인
- [ ] 서버 로그에 에러 있는지 확인

**확인 방법:**
```bash
# 서버 로그 확인
# 다음 메시지가 보여야 합니다:
📱 Telegram: ✅ Configured
```

### 문제 4: 환율이 업데이트 안 돼요

**증상:**
- 환율이 계속 0으로 표시됨

**해결책:**
1. 브라우저 콘솔(F12) 확인
2. 다음 메시지가 보이는지 확인:
   ```
   ✅ 환율 업데이트: $1 = ₩1,300
   ```
3. 보이지 않으면:
   - 인터넷 연결 확인
   - API 제한이 걸렸을 수 있음 (10분 후 재시도)

### 문제 5: npm install 실패

**증상:**
```
npm ERR! code ELIFECYCLE
```

**해결책:**
```bash
# node_modules 삭제하고 재설치
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📞 추가 도움이 필요하면?

1. **브라우저 콘솔 확인** (F12)
   - 에러 메시지 복사

2. **서버 로그 확인**
   - 터미널에 표시되는 에러 확인

3. **테스트 명령어**
   ```bash
   # API 테스트
   curl http://localhost:3000/health

   # Upbit API 테스트
   curl http://localhost:3000/api/upbit?symbol=KRW-BTC

   # Binance API 테스트
   curl http://localhost:3000/api/binance?symbol=BTCUSDT
   ```

---

## 💡 유용한 팁

### 코인 추가하기

`index.html` 파일에서 `SYMBOL_MAP` 수정:

```javascript
const SYMBOL_MAP = {
    // 기존 코인들...
    'NEW': { upbit: 'KRW-NEW', binance: 'NEWUSDT', name: 'New Coin' }
};
```

그리고 드롭다운에도 추가:

```html
<option value="NEW">New Coin (NEW)</option>
```

### 알림 기준 변경

UI에서 "알림 기준 (%)" 값을 변경하거나
`index.html`에서 기본값 변경:

```javascript
const CONFIG = {
    telegramThreshold: 3.0  // 3%에서 원하는 값으로 변경
};
```

### 업데이트 간격 조정

- **빠른 업데이트**: 1000ms (1초) - 부하 높음
- **보통**: 2000ms (2초) - 권장
- **느린 업데이트**: 5000ms (5초) - 부하 낮음

---

**🎉 설정 완료! 행복한 트레이딩 되세요!**
