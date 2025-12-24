import type { FingerprintResult, FingerprintSource, AnalysisResult } from "@/types";
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
