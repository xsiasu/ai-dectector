import { NextRequest, NextResponse } from "next/server";
import { analyzeImage, analyzeImageFromUrl } from "@/lib/gemini";
import {
  extractMetadataFromBase64,
  extractMetadataFromUrl,
} from "@/lib/metadata";
import {
  detectFingerprint,
  combineAllAnalysisResults,
} from "@/lib/fingerprint";
import { analyzeImageFrequency } from "@/lib/frequency";
import {
  getClientIp,
  hashIp,
  checkUsageLimit,
  incrementUsage,
  isSupabaseConfigured,
} from "@/lib/server/usage";

// High confidence threshold - skip visual analysis if fingerprint is this confident
const HIGH_CONFIDENCE_THRESHOLD = 95;

export async function POST(request: NextRequest) {
  try {
    // Server-side usage validation
    if (isSupabaseConfigured()) {
      const clientIp = getClientIp(request);
      const ipHash = hashIp(clientIp);
      const usageStatus = await checkUsageLimit(ipHash);

      if (!usageStatus.canUse) {
        return NextResponse.json(
          {
            error: "크레딧이 부족합니다. 충전 후 다시 시도해주세요.",
            code: "USAGE_LIMIT_EXCEEDED",
            remainingCredits: 0,
          },
          { status: 402 }
        );
      }
    }

    const body = await request.json();

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    let buffer: ArrayBuffer;
    let mimeType: string;
    let isUrlBased = false;

    // Prepare image buffer based on input type
    if (body.imageUrl) {
      isUrlBased = true;
      const response = await fetch(body.imageUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: "이미지를 가져오는데 실패했습니다." },
          { status: 400 }
        );
      }
      buffer = await response.arrayBuffer();
      mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    } else if (body.imageBase64 && body.mimeType) {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(body.imageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer = bytes.buffer;
      mimeType = body.mimeType;
    } else {
      return NextResponse.json(
        { error: "이미지 데이터가 필요합니다. (imageUrl 또는 imageBase64 + mimeType)" },
        { status: 400 }
      );
    }

    // Step 1: Run fingerprint detection FIRST (highest priority)
    const fingerprint = await detectFingerprint(buffer, mimeType);

    // Step 2: If high-confidence fingerprint, skip expensive visual and frequency analysis
    if (fingerprint?.detected && fingerprint.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
      const metadata = isUrlBased
        ? await extractMetadataFromUrl(body.imageUrl)
        : extractMetadataFromBase64(body.imageBase64);

      // Increment usage after successful analysis
      if (isSupabaseConfigured()) {
        const clientIp = getClientIp(request);
        const ipHash = hashIp(clientIp);
        await incrementUsage(ipHash);
      }

      return NextResponse.json({
        isAI: true,
        confidence: fingerprint.confidence,
        evidence: [
          ...(fingerprint.evidence || []),
          "디지털 지문 감지 - 높은 신뢰도로 AI 생성 이미지 확인",
        ],
        riskLevel: "high",
        metadata,
        fingerprint,
        analysisMethod: "fingerprint",
      });
    }

    // Step 3: Run frequency analysis, visual analysis, and metadata extraction in parallel
    const [frequencyResult, visualResult, metadata] = await Promise.all([
      analyzeImageFrequency(buffer, { mimeType }),
      isUrlBased
        ? analyzeImageFromUrl(body.imageUrl)
        : analyzeImage(body.imageBase64, body.mimeType),
      isUrlBased
        ? extractMetadataFromUrl(body.imageUrl)
        : Promise.resolve(extractMetadataFromBase64(body.imageBase64)),
    ]);

    // Step 4: Combine all analysis methods (fingerprint, frequency, visual)
    // Pass metadata for screenshot/editing detection penalties
    const combinedResult = combineAllAnalysisResults(
      fingerprint,
      frequencyResult,
      visualResult,
      metadata
    );

    // Increment usage after successful analysis
    if (isSupabaseConfigured()) {
      const clientIp = getClientIp(request);
      const ipHash = hashIp(clientIp);
      await incrementUsage(ipHash);
    }

    return NextResponse.json(combinedResult);
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "API 키가 유효하지 않습니다." },
          { status: 401 }
        );
      }
      if (error.message.includes("parse")) {
        return NextResponse.json(
          { error: "AI 응답을 처리하는 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "이미지 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
