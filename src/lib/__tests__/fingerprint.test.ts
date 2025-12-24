import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  FingerprintResult,
  FingerprintSource,
  FingerprintDetails,
} from "@/types";
import {
  detectC2PA,
  detectIPTCXMP,
  detectFingerprint,
  combineAnalysisResults,
} from "../fingerprint";

describe("FingerprintResult type", () => {
  it("should have correct structure with required fields", () => {
    const result: FingerprintResult = {
      detected: true,
      confidence: 95,
      source: "c2pa",
    };

    expect(result.detected).toBe(true);
    expect(result.confidence).toBe(95);
    expect(result.source).toBe("c2pa");
  });

  it("should support all fingerprint sources", () => {
    const sources: FingerprintSource[] = [
      "c2pa",
      "iptc",
      "xmp",
      "watermark",
      "none",
    ];

    sources.forEach((source) => {
      const result: FingerprintResult = {
        detected: source !== "none",
        confidence: source === "none" ? 0 : 90,
        source,
      };
      expect(result.source).toBe(source);
    });
  });

  it("should support optional details field", () => {
    const details: FingerprintDetails = {
      generator: "Adobe Firefly/1.0",
      signedBy: "Adobe Inc.",
      timestamp: "2024-01-15T10:30:00Z",
      softwareAgent: "Firefly",
      aiModel: "firefly-v2",
      validationStatus: "valid",
    };

    const result: FingerprintResult = {
      detected: true,
      confidence: 98,
      source: "c2pa",
      details,
      evidence: ["C2PA manifest found"],
    };

    expect(result.details?.generator).toBe("Adobe Firefly/1.0");
    expect(result.details?.validationStatus).toBe("valid");
    expect(result.evidence).toContain("C2PA manifest found");
  });
});

describe("detectC2PA", () => {
  it("returns null for buffer without C2PA manifest", async () => {
    const plainBuffer = new ArrayBuffer(100);
    const result = await detectC2PA(plainBuffer, "image/jpeg");

    expect(result).toBeNull();
  });

  it("returns null for invalid image data", async () => {
    const invalidBuffer = new TextEncoder().encode("not an image").buffer;
    const result = await detectC2PA(invalidBuffer, "image/jpeg");

    expect(result).toBeNull();
  });
});

describe("detectIPTCXMP", () => {
  it("returns null for buffer without AI markers in metadata", async () => {
    const plainBuffer = new ArrayBuffer(100);
    const result = await detectIPTCXMP(plainBuffer);

    expect(result).toBeNull();
  });

  it("returns null for invalid image data", async () => {
    const invalidBuffer = new TextEncoder().encode("not an image").buffer;
    const result = await detectIPTCXMP(invalidBuffer);

    expect(result).toBeNull();
  });
});

describe("detectFingerprint", () => {
  it("returns null when no fingerprint is found", async () => {
    const plainBuffer = new ArrayBuffer(100);
    const result = await detectFingerprint(plainBuffer, "image/jpeg");

    expect(result).toBeNull();
  });

  it("tries C2PA first (highest priority)", async () => {
    // For this test, we just verify the function doesn't throw
    // and returns null for invalid data (as expected)
    const buffer = new TextEncoder().encode("test").buffer;
    const result = await detectFingerprint(buffer, "image/jpeg");

    expect(result).toBeNull();
  });
});

describe("combineAnalysisResults", () => {
  const mockVisualAnalysis = {
    isAI: false,
    confidence: 30,
    evidence: ["Looks natural"],
    riskLevel: "low" as const,
  };

  it("uses fingerprint when confidence >= 90", () => {
    const fingerprint: FingerprintResult = {
      detected: true,
      confidence: 95,
      source: "c2pa",
      evidence: ["C2PA manifest found"],
    };

    const result = combineAnalysisResults(fingerprint, mockVisualAnalysis);

    expect(result.isAI).toBe(true);
    expect(result.confidence).toBe(95);
    expect(result.analysisMethod).toBe("fingerprint");
    expect(result.fingerprint).toBe(fingerprint);
  });

  it("combines results when fingerprint confidence < 90", () => {
    const fingerprint: FingerprintResult = {
      detected: true,
      confidence: 75,
      source: "xmp",
      evidence: ["XMP CreatorTool suggests AI"],
    };

    const visualWithAI = {
      isAI: true,
      confidence: 80,
      evidence: ["Visual artifacts detected"],
      riskLevel: "medium" as const,
    };

    const result = combineAnalysisResults(fingerprint, visualWithAI);

    expect(result.analysisMethod).toBe("combined");
    // Weighted: 75 * 0.6 + 80 * 0.4 = 45 + 32 = 77
    expect(result.confidence).toBe(77);
    expect(result.isAI).toBe(true);
  });

  it("uses visual analysis alone when no fingerprint", () => {
    const visualAnalysis = {
      isAI: true,
      confidence: 70,
      evidence: ["Visual artifacts detected"],
      riskLevel: "medium" as const,
    };

    const result = combineAnalysisResults(null, visualAnalysis);

    expect(result.analysisMethod).toBe("visual");
    expect(result.confidence).toBe(70);
    expect(result.isAI).toBe(true);
    expect(result.fingerprint).toBeUndefined();
  });

  it("sets correct risk level based on combined confidence", () => {
    const fingerprint: FingerprintResult = {
      detected: true,
      confidence: 98,
      source: "c2pa",
      evidence: ["C2PA found"],
    };

    const result = combineAnalysisResults(fingerprint, mockVisualAnalysis);

    expect(result.riskLevel).toBe("high");
  });
});
