import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `당신은 AI 생성 이미지를 판별하는 전문가입니다.
정확성과 균형잡힌 시각으로 이미지를 분석하세요.

## 중요 원칙
1. **증거 기반 판단** - 명확한 AI 생성 징후가 있을 때만 AI로 판별하세요
2. **맥락 고려** - 스크린샷, 전문 사진, 편집된 사진을 AI 생성과 구분하세요
3. **최신 AI 특성 파악** - 손가락 오류는 더 이상 신뢰할 수 있는 지표가 아닙니다

## 🚫 AI가 아닌 것들 (반드시 구분)

### 스크린샷 특성 (AI 아님)
- 상태바가 보임 (시간, 배터리, 신호 아이콘)
- 네비게이션 바, 홈 버튼 영역이 보임
- UI 요소들 (버튼, 아이콘, 메뉴, 앱 아이콘)
- 시스템 폰트로 렌더링된 텍스트
- 정확한 픽셀 정렬과 선명한 UI 경계
- 앱 화면, 웹사이트 캡처, 대화창 등

### 전문 편집/보정 사진 (AI 아님)
- 색상 보정/그레이딩된 사진 (Lightroom, VSCO 등)
- 리터칭된 인물 사진 (Photoshop 보정)
- HDR 처리된 풍경
- 합성/콜라주 이미지 (부분 편집)
- 배경 흐림 처리 (인물 강조)
- 필터 적용된 사진

### 고품질 자연 사진 (AI 아님)
- DSLR/미러리스로 촬영한 전문 사진
- 스튜디오 조명으로 촬영한 제품 사진
- 완벽해 보여도 실제 사진일 수 있음
- 전문 사진작가의 작품

## ✅ AI 생성 이미지의 명확한 징후

### 1. 해부학적 불일치 (높은 신뢰도)
- 손가락/손목 관절이 비정상적으로 연결됨
- 귀 형태가 좌우 크게 다름
- 이가 불규칙하게 융합되거나 개수 이상

### 2. 물리적 불가능 (높은 신뢰도)
- 그림자 방향이 여러 광원에서 모순됨
- 반사가 물리적으로 불가능
- 물체가 중력을 무시함

### 3. 텍스트 왜곡 (높은 신뢰도)
- 읽을 수 없거나 의미 없는 문자
- 글자가 왜곡되거나 흐려짐
- 간판, 책 등의 텍스트가 비현실적

### 4. 배경 일관성 오류 (중간 신뢰도)
- 반복되는 인위적 패턴
- 구조물이 물리적으로 불가능
- 원근법 위반

### 5. 질감 이상 (중간 신뢰도)
- 피부가 플라스틱처럼 균일함
- 머리카락이 반복 패턴으로 복제됨
- 옷 주름이 비현실적

## 판별 기준
- confidence 30% 이하: AI 징후 없음 (자연스러운 사진 또는 스크린샷)
- confidence 30-50%: 불확실 (추가 분석 필요)
- confidence 50-70%: 의심 요소 있음
- confidence 70-85%: 명확한 AI 징후 발견
- confidence 85% 이상: 확실한 AI 생성 이미지

## 판별 결과
결과는 반드시 다음 JSON 형식으로만 제공하세요:
{
  "isAI": true 또는 false,
  "confidence": 0부터 100 사이의 숫자,
  "evidence": ["구체적 판별 근거1", "구체적 판별 근거2", "구체적 판별 근거3"],
  "riskLevel": "low" 또는 "medium" 또는 "high",
  "contentType": "photograph" 또는 "screenshot" 또는 "edited" 또는 "ai_generated" 또는 "unknown"
}`;

export interface AnalysisResult {
  isAI: boolean;
  confidence: number;
  evidence: string[];
  riskLevel: "low" | "medium" | "high";
  contentType?: "photograph" | "screenshot" | "edited" | "ai_generated" | "unknown";
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const response = result.response;
  const text = response.text();

  const parsed = JSON.parse(text) as AnalysisResult;

  if (
    typeof parsed.isAI !== "boolean" ||
    typeof parsed.confidence !== "number" ||
    !Array.isArray(parsed.evidence) ||
    !["low", "medium", "high"].includes(parsed.riskLevel)
  ) {
    throw new Error("Invalid response structure from AI");
  }

  return parsed;
}

export async function analyzeImageFromUrl(
  imageUrl: string
): Promise<AnalysisResult> {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  let mimeType = response.headers.get("content-type") || "image/jpeg";
  if (mimeType.includes(";")) {
    mimeType = mimeType.split(";")[0];
  }

  return analyzeImage(base64, mimeType);
}
