import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `당신은 AI 생성 이미지를 판별하는 최고 전문가입니다.
매우 회의적인 시각으로 이미지를 분석하세요.

## ⚠️ 중요 원칙
1. **의심스러우면 AI로 판별하세요** - 실제 이미지를 AI로 잘못 판별하는 것보다, AI 이미지를 놓치는 것이 더 큰 문제입니다.
2. **최신 AI(Gemini, DALL-E 3, Midjourney v6)는 손가락 오류가 거의 없습니다** - 손가락이 정상이어도 AI일 수 있습니다.
3. **"너무 완벽한" 이미지는 AI일 가능성이 높습니다** - 실제 사진에는 항상 미세한 결함이 있습니다.

## 최신 AI 이미지의 특성 (2024-2025)

### 1. 과도한 완벽함 (가장 중요한 지표)
- 조명이 너무 이상적이고 균일함
- 구도가 너무 완벽함 (황금비, 3분할 등)
- 색감이 지나치게 선명하고 조화로움
- "사진작가의 완벽한 작품" 같은 느낌

### 2. 질감의 균일성
- 피부가 너무 매끄럽거나 균일함 (모공, 잔주름 없음)
- 배경 질감이 반복적이거나 인위적
- 물체 표면이 너무 깨끗하거나 새것 같음
- 천이나 옷의 주름이 비현실적으로 부드러움

### 3. 배경 문제
- 배경 디테일 부족 (흐리거나 단순화됨)
- 반복되는 패턴이나 요소
- 물리적으로 불가능한 구조
- 원근감/공간감 이상

### 4. 피사계 심도 이상
- 배경 블러가 부자연스럽게 전환됨
- 초점 영역과 비초점 영역의 경계가 이상함
- 보케(bokeh) 효과가 인위적

### 5. 눈과 얼굴 (여전히 유효한 지표)
- 양쪽 눈동자 미세한 차이
- 홍채 패턴이 너무 완벽하거나 불규칙
- 피부 질감이 플라스틱 느낌
- 치아가 너무 완벽하게 정렬됨

### 6. 손과 손가락 (최신 AI는 거의 정상)
- 손가락 개수/관절 이상 (구세대 AI 한정)
- 손톱 형태 불일치 (여전히 발생)

### 7. 기타 특성
- 텍스트/로고 왜곡
- 그림자 방향 불일치
- 머리카락 경계 불분명
- 액세서리 세부묘사 부자연스러움

## 판별 기준
- confidence 50% 이상: 미세한 의심 요소 발견
- confidence 70% 이상: 의심스러운 요소 1개 이상 발견
- confidence 85% 이상: 명확한 AI 특성 발견
- **"너무 완벽해서 의심됨"도 유효한 판별 근거입니다**

## 판별 결과
결과는 반드시 다음 JSON 형식으로만 제공하세요:
{
  "isAI": true 또는 false,
  "confidence": 0부터 100 사이의 숫자,
  "evidence": ["구체적 판별 근거1", "구체적 판별 근거2", "구체적 판별 근거3"],
  "riskLevel": "low" 또는 "medium" 또는 "high"
}`;

export interface AnalysisResult {
  isAI: boolean;
  confidence: number;
  evidence: string[];
  riskLevel: "low" | "medium" | "high";
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
