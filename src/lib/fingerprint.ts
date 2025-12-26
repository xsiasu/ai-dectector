import type {
  FingerprintResult,
  FingerprintSource,
  AnalysisResult,
  FrequencyAnalysis,
  ImageMetadata,
  ContentType,
} from "@/types";
import ExifReader from "exifreader";

// Known AI generation tool patterns
const AI_GENERATOR_PATTERNS = [
  /midjourney/i,
  /dall-e/i,
  /dall·e/i,
  /stable.?diffusion/i,
  /adobe.?firefly/i,
  /openai/i,
  /runway/i,
  /leonardo\.ai/i,
  /bing.?image/i,
  /copilot/i,
  /imagen/i,
  /dreamstudio/i,
  /novelai/i,
  /comfyui/i,
  /automatic1111/i,
  /invoke.?ai/i,
  /gemini/i,
  /google.?ai/i,
];

// IPTC DigitalSourceType values indicating AI generation
const AI_DIGITAL_SOURCE_TYPES = [
  "trainedAlgorithmicMedia",
  "compositeWithTrainedAlgorithmicMedia",
  "algorithmicMedia",
];

/**
 * Detect C2PA (Content Credentials) manifest in an image
 * Uses WebAssembly-based @contentauth/c2pa-web library
 */
export async function detectC2PA(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<FingerprintResult | null> {
  try {
    // Dynamic import to avoid SSR issues with WASM
    const { createC2pa } = await import("@contentauth/c2pa-web");

    const c2pa = await createC2pa({
      wasmSrc: "https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web/dist/assets/wasm/toolkit_bg.wasm",
    });

    const blob = new Blob([buffer], { type: mimeType });
    const reader = await c2pa.reader.fromBlob(mimeType, blob);

    if (!reader) {
      return null;
    }

    const manifestStore = await reader.manifestStore();
    const activeManifest = await reader.activeManifest();

    if (!activeManifest) {
      reader.free();
      return null;
    }

    const evidence: string[] = [];

    if (activeManifest.claim_generator) {
      evidence.push(`C2PA Content Credentials: ${activeManifest.claim_generator}`);
    }

    // Check validation status
    const hasValidationErrors =
      manifestStore.validation_status &&
      manifestStore.validation_status.length > 0;

    const validationStatus = hasValidationErrors ? "invalid" : "valid";

    reader.free();

    return {
      detected: true,
      confidence: validationStatus === "valid" ? 98 : 85,
      source: "c2pa",
      details: {
        generator: activeManifest.claim_generator ?? undefined,
        signedBy: activeManifest.signature_info?.issuer ?? undefined,
        timestamp: activeManifest.signature_info?.time ?? undefined,
        validationStatus,
      },
      evidence,
    };
  } catch {
    // C2PA not found or parsing error
    return null;
  }
}

/**
 * Check if a string matches any known AI generator pattern
 */
function matchesAIPattern(value: string): boolean {
  return AI_GENERATOR_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Detect AI generation markers in IPTC/XMP metadata
 * Uses exifreader library for metadata extraction
 */
export async function detectIPTCXMP(
  buffer: ArrayBuffer
): Promise<FingerprintResult | null> {
  try {
    const tags = ExifReader.load(buffer, { expanded: true });
    const evidence: string[] = [];
    let source: FingerprintSource = "none";
    let confidence = 0;
    let softwareAgent: string | undefined;

    // Check XMP tags
    if (tags.xmp) {
      // Check CreatorTool
      const creatorTool =
        tags.xmp.CreatorTool?.value ||
        (tags.xmp.CreatorTool as unknown as string);
      if (creatorTool && typeof creatorTool === "string" && matchesAIPattern(creatorTool)) {
        source = "xmp";
        softwareAgent = creatorTool;
        confidence = Math.max(confidence, 90);
        evidence.push(`XMP CreatorTool: ${creatorTool}`);
      }

      // Check Software/SoftwareAgent
      const software =
        tags.xmp.Software?.value || (tags.xmp.Software as unknown as string);
      if (software && typeof software === "string" && matchesAIPattern(software)) {
        source = "xmp";
        softwareAgent = softwareAgent || software;
        confidence = Math.max(confidence, 88);
        evidence.push(`XMP Software: ${software}`);
      }
    }

    // Check IPTC tags
    if (tags.iptc) {
      // Check Digital Source Type (IPTC standard for AI-generated content)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iptc = tags.iptc as Record<string, any>;
      const digitalSourceType =
        iptc["Digital Source Type"]?.value ||
        iptc["DigitalSourceType"]?.value;
      if (
        digitalSourceType &&
        typeof digitalSourceType === "string" &&
        AI_DIGITAL_SOURCE_TYPES.includes(digitalSourceType)
      ) {
        source = source === "none" ? "iptc" : source;
        confidence = Math.max(confidence, 95);
        evidence.push(`IPTC DigitalSourceType: ${digitalSourceType}`);
      }
    }

    // Check EXIF Software field as fallback
    if (tags.exif?.Software) {
      const software =
        tags.exif.Software.value ||
        (tags.exif.Software.description as string);
      if (software && typeof software === "string" && matchesAIPattern(software)) {
        source = source === "none" ? "xmp" : source;
        softwareAgent = softwareAgent || software;
        confidence = Math.max(confidence, 85);
        evidence.push(`EXIF Software: ${software}`);
      }
    }

    if (confidence === 0) {
      return null;
    }

    return {
      detected: true,
      confidence,
      source,
      details: {
        softwareAgent,
      },
      evidence,
    };
  } catch {
    // Metadata parsing error
    return null;
  }
}

/**
 * Detect digital fingerprints in an image
 * Tries detection methods in order of reliability:
 * 1. C2PA (cryptographic - highest trust)
 * 2. IPTC/XMP metadata analysis
 */
export async function detectFingerprint(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<FingerprintResult | null> {
  // Try C2PA first (cryptographically signed - highest priority)
  const c2paResult = await detectC2PA(buffer, mimeType);
  if (c2paResult) {
    return c2paResult;
  }

  // Fall back to IPTC/XMP metadata analysis
  const metadataResult = await detectIPTCXMP(buffer);
  if (metadataResult) {
    return metadataResult;
  }

  return null;
}

/**
 * Visual analysis result from Gemini
 */
interface VisualAnalysisResult {
  isAI: boolean;
  confidence: number;
  evidence: string[];
  riskLevel: "low" | "medium" | "high";
  contentType?: ContentType;
}

/**
 * Combine fingerprint detection with visual analysis results
 * Priority: Fingerprint >= 90% confidence takes precedence
 */
export function combineAnalysisResults(
  fingerprint: FingerprintResult | null,
  visualAnalysis: VisualAnalysisResult
): AnalysisResult {
  // No fingerprint detected - use visual analysis only
  if (!fingerprint) {
    return {
      ...visualAnalysis,
      analysisMethod: "visual",
    };
  }

  // High-confidence fingerprint (>= 90%) takes priority
  if (fingerprint.detected && fingerprint.confidence >= 90) {
    return {
      isAI: true,
      confidence: fingerprint.confidence,
      evidence: [
        ...(fingerprint.evidence || []),
        "디지털 지문 감지 - 높은 신뢰도 지표",
      ],
      riskLevel: "high",
      fingerprint,
      analysisMethod: "fingerprint",
    };
  }

  // Moderate fingerprint confidence (< 90%) - combine with visual analysis
  if (fingerprint.detected) {
    // Weighted combination: 60% fingerprint, 40% visual
    const combinedConfidence = Math.round(
      fingerprint.confidence * 0.6 + visualAnalysis.confidence * 0.4
    );

    // AI if either fingerprint or visual analysis indicates AI
    const isAI = fingerprint.detected || visualAnalysis.isAI;

    // Determine risk level based on combined confidence
    const riskLevel: "low" | "medium" | "high" =
      combinedConfidence >= 80 ? "high" :
      combinedConfidence >= 50 ? "medium" : "low";

    return {
      isAI,
      confidence: combinedConfidence,
      evidence: [
        ...(fingerprint.evidence || []),
        ...visualAnalysis.evidence,
      ],
      riskLevel,
      fingerprint,
      analysisMethod: "combined",
    };
  }

  // Fingerprint detection ran but found nothing - use visual analysis
  return {
    ...visualAnalysis,
    fingerprint,
    analysisMethod: "visual",
  };
}

/**
 * Combine all analysis methods: fingerprint, frequency, and visual
 * Weights: fingerprint 40%, frequency 30%, visual 30%
 * Applies penalties for detected screenshots or edited images
 */
export function combineAllAnalysisResults(
  fingerprint: FingerprintResult | null,
  frequency: FrequencyAnalysis | null,
  visualAnalysis: VisualAnalysisResult,
  metadata?: ImageMetadata | null
): AnalysisResult {
  const evidence: string[] = [];

  // Collect all evidence
  if (fingerprint?.evidence) {
    evidence.push(...fingerprint.evidence);
  }
  if (frequency?.analyzed) {
    if (frequency.ganFingerprint.detected) {
      evidence.push(...frequency.ganFingerprint.evidence);
    }
    if (frequency.diffusionFingerprint.detected) {
      evidence.push(...frequency.diffusionFingerprint.evidence);
    }
  }
  evidence.push(...visualAnalysis.evidence);

  // Determine content type from visual analysis or metadata
  let contentType: ContentType = visualAnalysis.contentType || "unknown";

  // Calculate screenshot/editing penalties based on metadata
  let screenshotPenalty = 0;
  let editingPenalty = 0;

  if (metadata?.editingToolHint) {
    const toolType = metadata.editingToolHint.type;
    const toolName = metadata.editingToolHint.name;

    if (toolType === "screenshot") {
      // Screenshot tool detected → 50% confidence penalty
      screenshotPenalty = 50;
      contentType = "screenshot";
      evidence.push(`스크린샷 도구 감지: ${toolName} → AI 아님 가능성 높음`);
    } else if (toolType === "camera") {
      // Camera detected → 40% confidence penalty
      editingPenalty = 40;
      contentType = "photograph";
      evidence.push(`카메라 촬영 감지: ${toolName} → AI 아님 가능성 높음`);
    } else if (toolType === "editor") {
      // Editing software detected → 35% confidence penalty
      editingPenalty = 35;
      contentType = "edited";
      evidence.push(`편집 소프트웨어 감지: ${toolName} → 편집된 사진`);
    }
  }

  // If visual analysis detected screenshot, apply penalty
  if (visualAnalysis.contentType === "screenshot" && screenshotPenalty === 0) {
    screenshotPenalty = 40;
    contentType = "screenshot";
    evidence.push("시각 분석으로 스크린샷 감지됨");
  }

  // If visual analysis detected edited image, apply penalty
  if (visualAnalysis.contentType === "edited" && editingPenalty === 0) {
    editingPenalty = 30;
    contentType = "edited";
  }

  // High-confidence fingerprint (>= 95%) takes absolute priority (no penalty override)
  if (fingerprint?.detected && fingerprint.confidence >= 95) {
    return {
      isAI: true,
      confidence: fingerprint.confidence,
      evidence: [
        ...evidence,
        "디지털 지문 감지 - 확정적 AI 지표",
      ],
      riskLevel: "high",
      fingerprint,
      frequency: frequency || undefined,
      analysisMethod: "fingerprint",
      contentType: "ai_generated",
    };
  }

  // High-confidence fingerprint (>= 90%) - reduced penalty
  if (fingerprint?.detected && fingerprint.confidence >= 90) {
    // Still apply some penalty but reduced
    const reducedPenalty = Math.max(screenshotPenalty, editingPenalty) * 0.3;
    const adjustedConfidence = Math.max(0, Math.round(fingerprint.confidence - reducedPenalty));

    return {
      isAI: adjustedConfidence >= 50,
      confidence: adjustedConfidence,
      evidence: [
        ...evidence,
        "디지털 지문 감지 - 높은 신뢰도 지표",
      ],
      riskLevel: adjustedConfidence >= 80 ? "high" : adjustedConfidence >= 50 ? "medium" : "low",
      fingerprint,
      frequency: frequency || undefined,
      analysisMethod: "fingerprint",
      contentType: adjustedConfidence >= 50 ? "ai_generated" : contentType,
    };
  }

  // Calculate weighted confidence
  // fingerprint: 40%, frequency: 30%, visual: 30%
  const fingerprintConf = fingerprint?.detected ? fingerprint.confidence : 0;
  const frequencyConf = frequency?.analyzed ? frequency.overallConfidence : 0;
  const visualConf = visualAnalysis.confidence;

  // If no fingerprint, redistribute weights: frequency 40%, visual 60%
  // If no frequency, redistribute weights: fingerprint 60%, visual 40%
  let baseConfidence: number;

  if (!fingerprint?.detected && (!frequency?.analyzed || frequencyConf === 0)) {
    // Only visual analysis
    baseConfidence = visualConf;
  } else if (!fingerprint?.detected) {
    // Frequency + visual (40% / 60%)
    baseConfidence = Math.round(frequencyConf * 0.4 + visualConf * 0.6);
  } else if (!frequency?.analyzed || frequencyConf === 0) {
    // Fingerprint + visual (60% / 40%)
    baseConfidence = Math.round(fingerprintConf * 0.6 + visualConf * 0.4);
  } else {
    // All three methods (40% / 30% / 30%)
    baseConfidence = Math.round(
      fingerprintConf * 0.4 + frequencyConf * 0.3 + visualConf * 0.3
    );
  }

  // Apply screenshot and editing penalties
  const totalPenalty = screenshotPenalty + editingPenalty;
  const combinedConfidence = Math.max(0, Math.round(baseConfidence - totalPenalty));

  // Determine if AI based on final confidence and detections
  // With penalty applied, use the adjusted confidence
  const isAI = combinedConfidence >= 50 && (
    (fingerprint?.detected ?? false) ||
    (frequency?.ganFingerprint.detected ?? false) ||
    (frequency?.diffusionFingerprint.detected ?? false) ||
    visualAnalysis.isAI
  );

  // Determine risk level based on penalty-adjusted confidence
  const riskLevel: "low" | "medium" | "high" =
    combinedConfidence >= 80 ? "high" :
    combinedConfidence >= 50 ? "medium" : "low";

  // Determine analysis method
  let analysisMethod: "fingerprint" | "visual" | "combined" | "frequency" = "visual";
  if (fingerprint?.detected && frequency?.analyzed) {
    analysisMethod = "combined";
  } else if (fingerprint?.detected) {
    analysisMethod = fingerprint.confidence >= 90 ? "fingerprint" : "combined";
  } else if (frequency?.analyzed && frequencyConf > 0) {
    analysisMethod = frequencyConf >= 70 ? "frequency" : "combined";
  }

  // Update content type based on final determination
  if (isAI && combinedConfidence >= 70) {
    contentType = "ai_generated";
  } else if (!isAI && contentType === "unknown") {
    contentType = "photograph";
  }

  return {
    isAI,
    confidence: combinedConfidence,
    evidence,
    riskLevel,
    fingerprint: fingerprint || undefined,
    frequency: frequency || undefined,
    analysisMethod,
    contentType,
    metadata: metadata || undefined,
  };
}
