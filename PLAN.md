# AI 이미지 판별 서비스 개발 계획서 (PLAN.md)

## 프로젝트 개요

### 서비스명
**AI-Detector** (가칭)

### 핵심 가치 제안
- 이미지가 AI로 생성되었는지 즉시 판별
- 파일 업로드 또는 URL 입력 지원
- 시각적 증거 및 신뢰도 리포트 제공
- 소액 단발 결제 모델 (구독 없음)

### 타겟 사용자
- 중고거래 사용자 (사기 방지)
- 소개팅 앱 이용자 (프로필 진위 확인)
- 뉴스 독자 (팩트체크)
- 콘텐츠 크리에이터 (저작권 확인)

---

## 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Hooks + Context API

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Image Processing**: Sharp
- **Web Scraping**: Cheerio / Puppeteer (선택적)

### AI/ML Services
- **Primary**: Google Gemini 1.5 Flash API
  - 이미지 분석 및 AI 생성 추론
  - 비용 효율적이고 빠른 응답
- **Secondary** (선택): Sightengine / Hive Moderation API
  - 신뢰도 보강용

### Infrastructure
- **Hosting**: Vercel
- **Storage**: Vercel Blob (임시 이미지 저장)
- **Database**: Supabase (사용 기록, 크레딧 관리)

### Payment
- **국내**: Toss Payments
- **글로벌/기부**: Buy Me a Coffee

---

## 개발 단계별 로드맵

### Phase 1: 환경 구축 (Day 1)

#### 목표
프로젝트 초기 설정 및 개발 환경 구성

#### 작업 내용
```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest ai-detector --typescript --tailwind --app

# 2. 필수 패키지 설치
npm install @google/generative-ai
npm install sharp
npm install cheerio
npm install axios
npm install dotenv

# 3. 개발 도구 설치
npm install -D @types/node
npm install -D eslint prettier
```

#### 산출물
- `/src/app` - Next.js 앱 디렉토리
- `/src/components` - 재사용 컴포넌트
- `/src/lib` - 유틸리티 함수
- `/src/api` - API 라우트
- `.env.local` - 환경 변수 설정

---

### Phase 2: 핵심 기능 구현 (Day 2-4)

#### 2.1 이미지 업로드 UI (Day 2)

**파일**: `/src/components/ImageUploader.tsx`

**기능 요구사항**:
- 드래그 앤 드롭 지원
- 미리보기 표시
- 파일 크기 제한 (최대 10MB)
- 지원 형식: JPG, PNG, WebP, GIF

**Claude Code 프롬프트**:
```
"ImageUploader.tsx 컴포넌트를 만들어줘. 
드래그 앤 드롭과 클릭 업로드를 모두 지원하고, 
Tailwind CSS로 깔끔하게 스타일링해줘. 
업로드된 이미지는 미리보기를 보여주고,
파일 크기는 10MB로 제한해줘."
```

---

#### 2.2 URL 입력 기능 (Day 2)

**파일**: `/src/components/UrlInput.tsx`

**기능 요구사항**:
- URL 유효성 검사
- 이미지 직접 URL과 웹페이지 URL 구분
- 로딩 상태 표시

**Claude Code 프롬프트**:
```
"URL 입력 컴포넌트를 만들어줘.
입력된 URL이 이미지인지 웹페이지인지 자동 감지하고,
유효성 검사를 수행해줘. 
로딩 스피너도 추가해줘."
```

---

#### 2.3 이미지 스크래핑 API (Day 3)

**파일**: `/src/app/api/scrape/route.ts`

**기능 요구사항**:
- URL에서 메인 이미지 추출
- OpenGraph 이미지 우선 탐색
- 실패 시 가장 큰 이미지 선택
- CORS 우회 처리

**Claude Code 프롬프트**:
```
"웹페이지 URL을 받아서 메인 이미지를 추출하는 
API 라우트를 만들어줘. Cheerio를 사용하고,
OpenGraph 메타태그를 우선적으로 확인한 후,
없으면 가장 큰 img 태그를 찾아줘.
CORS 문제도 처리해줘."
```

---

#### 2.4 AI 판별 엔진 API (Day 3-4)

**파일**: `/src/app/api/analyze/route.ts`

**기능 요구사항**:
- Gemini API 연동
- 이미지 분석 및 AI 생성 확률 계산
- 근거 텍스트 생성
- 메타데이터 추출 (C2PA, EXIF)

**프롬프트 구조**:
```typescript
const systemPrompt = `
당신은 이미지가 AI로 생성되었는지 판별하는 전문가입니다.
다음 요소들을 분석해주세요:

1. 픽셀 패턴의 부자연스러움
2. 손가락, 눈동자, 머리카락 등 세부 디테일
3. 배경의 논리적 일관성
4. 조명과 그림자의 물리적 타당성
5. 텍스트나 로고의 왜곡

결과는 다음 JSON 형식으로 제공하세요:
{
  "isAI": true/false,
  "confidence": 0-100,
  "evidence": ["근거1", "근거2", ...],
  "riskLevel": "low/medium/high"
}
`;
```

**Claude Code 프롬프트**:
```
"Gemini 1.5 Flash API를 사용해서 이미지를 분석하고
AI 생성 여부를 판별하는 API를 만들어줘.
위의 systemPrompt를 사용하고,
결과를 JSON으로 반환해줘.
환경변수 GEMINI_API_KEY를 사용해야 해."
```

---

#### 2.5 결과 표시 컴포넌트 (Day 4)

**파일**: `/src/components/AnalysisResult.tsx`

**기능 요구사항**:
- 판별 확률 게이지 (원형 또는 바 차트)
- 증거 리스트 표시
- 위험도 색상 코딩 (녹색/노란색/빨간색)
- 상세 리포트 다운로드 버튼

**Claude Code 프롬프트**:
```
"분석 결과를 보기 좋게 표시하는 컴포넌트를 만들어줘.
AI 확률은 원형 게이지로,
증거는 리스트 형태로,
위험도는 색상으로 구분해서 보여줘.
Tailwind CSS와 Lucide 아이콘을 사용해줘."
```

---

### Phase 3: 부가 기능 (Day 5-6)

#### 3.1 결제 시스템 연동 (Day 5)

**파일**: 
- `/src/app/api/payment/route.ts`
- `/src/components/PricingModal.tsx`

**기능 요구사항**:
- 무료 체험 5회 제한
- 크레딧 구매 (10회/1,000원)
- LocalStorage 기반 사용 횟수 추적
- Toss Payments 연동

**Claude Code 프롬프트**:
```
"사용자가 5회까지 무료로 분석할 수 있고,
그 이후에는 결제 모달을 표시하는 기능을 만들어줘.
LocalStorage로 사용 횟수를 추적하고,
Toss Payments로 결제하면 크레딧이 충전되게 해줘."
```

---

#### 3.2 히스토리 저장 (Day 5)

**파일**: 
- `/src/app/api/history/route.ts`
- `/src/components/HistoryList.tsx`

**기능 요구사항**:
- 최근 분석 10개 저장 (LocalStorage)
- 재분석 없이 결과 재확인
- 삭제 기능

**Claude Code 프롬프트**:
```
"사용자의 최근 분석 기록을 LocalStorage에 저장하고
표시하는 기능을 만들어줘. 
썸네일, 분석 날짜, AI 확률을 카드 형태로 보여주고,
클릭하면 상세 결과를 다시 볼 수 있게 해줘."
```

---

#### 3.3 SEO 최적화 (Day 6)

**파일**: `/src/app/layout.tsx`, `/src/app/page.tsx`

**기능 요구사항**:
- 메타 태그 설정
- OpenGraph 이미지
- JSON-LD 스키마
- Sitemap 생성

**Claude Code 프롬프트**:
```
"Next.js 메타데이터 API를 사용해서
SEO를 최적화해줘. 
OpenGraph, Twitter Card, 
그리고 구조화된 데이터(JSON-LD)를 추가해줘."
```

---

### Phase 4: 테스트 및 배포 (Day 7)

#### 4.1 테스트

**Claude Code 프롬프트**:
```
"주요 API 라우트에 대한 단위 테스트를 작성해줘.
Jest를 사용하고, 
/api/analyze와 /api/scrape 엔드포인트를 테스트해줘."
```

#### 4.2 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정
vercel env add GEMINI_API_KEY
vercel env add NEXT_PUBLIC_TOSS_CLIENT_KEY
```

---

## 프로젝트 구조

```
ai-detector/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── api/
│   │   │   ├── analyze/route.ts      # AI 판별 API
│   │   │   ├── scrape/route.ts       # URL 스크래핑
│   │   │   ├── payment/route.ts      # 결제 처리
│   │   │   └── history/route.ts      # 히스토리 관리
│   │   └── globals.css
│   ├── components/
│   │   ├── ImageUploader.tsx         # 이미지 업로드
│   │   ├── UrlInput.tsx              # URL 입력
│   │   ├── AnalysisResult.tsx        # 결과 표시
│   │   ├── PricingModal.tsx          # 결제 모달
│   │   └── HistoryList.tsx           # 히스토리
│   └── lib/
│       ├── gemini.ts                 # Gemini API 래퍼
│       ├── scraper.ts                # 스크래핑 유틸
│       └── utils.ts                  # 공통 유틸리티
├── public/
│   ├── images/
│   └── icons/
├── .env.local                        # 환경변수
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 환경 변수 (.env.local)

```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key

# Database (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
```

---

## 핵심 기능 플로우

### 1. 이미지 업로드 플로우
```
사용자 액션: 파일 선택/드래그
    ↓
프론트엔드: 파일 검증 (크기, 형식)
    ↓
프론트엔드: Base64 인코딩 또는 FormData
    ↓
API: /api/analyze (POST)
    ↓
백엔드: Gemini API 호출
    ↓
백엔드: 분석 결과 반환
    ↓
프론트엔드: 결과 표시
```

### 2. URL 입력 플로우
```
사용자 액션: URL 입력
    ↓
API: /api/scrape (POST)
    ↓
백엔드: URL에서 이미지 추출
    ↓
백엔드: 이미지 다운로드
    ↓
API: /api/analyze (자동 호출)
    ↓
프론트엔드: 결과 표시
```

---

## 수익화 전략

### 무료 티어
- 5회 무료 분석
- 기본 리포트 제공
- 광고 없음

### 유료 옵션
1. **크레딧 구매**
   - 10회권: 1,000원
   - 50회권: 4,000원
   - 100회권: 7,000원

2. **기부 모델**
   - Buy Me a Coffee 버튼
   - "서비스가 도움이 되셨나요?"

3. **B2B 옵션** (향후)
   - API 키 판매
   - 월간 구독 (무제한)

---

## 마케팅 채널

### 초기 론칭
1. 중고나라, 당근마켓 카페에 "AI 사기 방지 도구" 소개
2. 인스타그램, 틱톡 크리에이터 커뮤니티 공유
3. Product Hunt 출시

### 콘텐츠 마케팅
- "AI가 만든 중고차 사진 판별하기"
- "소개팅 앱 프로필, 진짜일까?"
- 유튜브 쇼츠/릴스 제작

---

## 법적 고려사항

### 면책 조항
```
본 서비스는 참고용 분석 도구이며, 
법적 증거로 사용될 수 없습니다.
최종 판단은 사용자의 책임입니다.
```

### 개인정보 보호
- 업로드된 이미지는 분석 후 즉시 삭제
- 사용자 데이터는 최소한으로 수집
- GDPR/PIPA 준수

---

## 성공 지표 (KPI)

### 1개월 목표
- MAU (월간 활성 사용자): 500명
- 분석 요청 수: 2,000회
- 유료 전환율: 5%
- 수익: 최소 50,000원

### 3개월 목표
- MAU: 5,000명
- 유료 전환율: 10%
- 수익: 500,000원
- 언론 보도: 1건 이상

---

## 다음 단계 체크리스트

### 개발 전 준비
- [ ] Google AI Studio에서 Gemini API 키 발급
- [ ] Vercel 계정 생성
- [ ] Toss Payments 개발자 등록
- [ ] 도메인 구매 (선택)

### 개발 시작
- [ ] `npx create-next-app@latest ai-detector` 실행
- [ ] Claude Code 세션 시작
- [ ] 첫 번째 컴포넌트 구현 (ImageUploader)

### 테스트
- [ ] 실제 AI 이미지로 테스트 (Midjourney, DALL-E)
- [ ] 실제 사진으로 테스트 (스마트폰 카메라)
- [ ] 모바일 반응형 확인

### 배포 후
- [ ] Google Analytics 연동
- [ ] 에러 모니터링 (Sentry)
- [ ] 첫 10명 피드백 수집

---

## Claude Code 사용 팁

### 효과적인 프롬프트 작성법
```
❌ 나쁜 예: "웹사이트 만들어줘"
✅ 좋은 예: "Next.js 15와 Tailwind를 사용해서 
이미지 업로드 페이지를 만들어줘. 
드래그 앤 드롭을 지원하고, 
미리보기를 보여주며, 
파일 크기는 10MB로 제한해야 해."
```

### 단계별 작업 요청
```
1. "먼저 이 기능을 구현하기 위한 계획을 세워줘"
2. 계획 확인 후 "좋아, 이제 1단계부터 구현해줘"
3. "이제 2단계를 진행하되, 1단계 코드와 연동되게 해줘"
```

### 에러 발생 시
```
"방금 발생한 에러를 분석하고 수정해줘.
에러 메시지는 다음과 같아: [에러 내용]"
```

---

## 참고 자료

- [Google Gemini API 문서](https://ai.google.dev/docs)
- [Next.js 15 공식 문서](https://nextjs.org/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Toss Payments 개발 문서](https://docs.tosspayments.com/)
- [SynthID 기술 설명](https://support.google.com/gemini?p=synthid)

---

## 버전 히스토리

- **v0.1** (2025-12-23): 초기 개발 계획 수립
- **v1.0** (목표: 2025-12-30): MVP 출시
- **v1.1** (목표: 2026-01-15): 피드백 반영 및 개선
- **v2.0** (목표: 2026-02): 영상 판별 기능 추가

---

**이 계획서는 Claude Code와 함께 진행하는 애자일 개발을 전제로 작성되었습니다.**
**각 단계마다 테스트하고, 피드백을 받으며, 빠르게 수정하는 것이 핵심입니다.**
