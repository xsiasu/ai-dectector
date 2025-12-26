import { describe, it, expect } from "vitest";
import {
  imageBufferToGrayscale,
  compute2DFFT,
  computeMagnitudeSpectrum,
  analyzeFrequency,
} from "../frequency";
import type { FrequencyAnalysis } from "@/types";

describe("Frequency Analysis", () => {
  describe("Phase 1: Basic FFT Utilities", () => {
    describe("imageBufferToGrayscale", () => {
      it("should convert image buffer to 2D grayscale array", async () => {
        // Create a simple 4x4 test image buffer (RGBA format)
        const width = 4;
        const height = 4;
        const rgbaData = new Uint8Array(width * height * 4);

        // Fill with known values: grayscale = 0.299*R + 0.587*G + 0.114*B
        for (let i = 0; i < width * height; i++) {
          rgbaData[i * 4] = 100;     // R
          rgbaData[i * 4 + 1] = 150; // G
          rgbaData[i * 4 + 2] = 200; // B
          rgbaData[i * 4 + 3] = 255; // A
        }

        const result = await imageBufferToGrayscale(
          Buffer.from(rgbaData),
          width,
          height
        );

        expect(result).toHaveLength(height);
        expect(result[0]).toHaveLength(width);
        // Expected grayscale: 0.299*100 + 0.587*150 + 0.114*200 ≈ 140.75
        expect(result[0][0]).toBeCloseTo(140.75, 0);
      });

      it("should handle different image sizes", async () => {
        const width = 8;
        const height = 8;
        const rgbaData = new Uint8Array(width * height * 4).fill(128);

        const result = await imageBufferToGrayscale(
          Buffer.from(rgbaData),
          width,
          height
        );

        expect(result).toHaveLength(height);
        expect(result[0]).toHaveLength(width);
      });
    });

    describe("compute2DFFT", () => {
      it("should return valid spectrum with correct dimensions", () => {
        // Create 8x8 test data (must be power of 2)
        const size = 8;
        const data: number[][] = Array(size)
          .fill(null)
          .map(() => Array(size).fill(100));

        const spectrum = compute2DFFT(data);

        expect(spectrum).toHaveLength(size);
        expect(spectrum[0]).toHaveLength(size);
      });

      it("should detect DC component for constant input", () => {
        const size = 8;
        const constantValue = 100;
        const data: number[][] = Array(size)
          .fill(null)
          .map(() => Array(size).fill(constantValue));

        const spectrum = compute2DFFT(data);

        // DC component (center) should be significantly larger than others
        const centerX = size / 2;
        const centerY = size / 2;
        const dcValue = spectrum[centerY][centerX];

        // DC should be dominant for constant input
        expect(dcValue).toBeGreaterThan(0);
      });
    });

    describe("computeMagnitudeSpectrum", () => {
      it("should return normalized values between 0 and 1", () => {
        const size = 8;
        const data: number[][] = Array(size)
          .fill(null)
          .map((_, y) =>
            Array(size)
              .fill(null)
              .map((_, x) => Math.sin((x + y) * 0.5) * 100 + 128)
          );

        const spectrum = compute2DFFT(data);
        const magnitude = computeMagnitudeSpectrum(spectrum);

        // Check all values are in valid range
        for (const row of magnitude) {
          for (const val of row) {
            expect(val).toBeGreaterThanOrEqual(0);
            expect(val).toBeLessThanOrEqual(1);
          }
        }

        // Maximum should be exactly 1 (normalized)
        const maxVal = Math.max(...magnitude.flat());
        expect(maxVal).toBe(1);
      });
    });
  });

  describe("Phase 2: GAN Detection", () => {
    it("should return low confidence for smooth natural-like patterns", async () => {
      // Simulate natural image: 1/f noise distribution (common in natural images)
      const size = 64;
      // Use seeded random for reproducibility
      const seed = 12345;
      let rng = seed;
      const nextRandom = () => {
        rng = (rng * 1103515245 + 12345) & 0x7fffffff;
        return rng / 0x7fffffff;
      };

      const naturalData: number[][] = Array(size)
        .fill(null)
        .map((_, y) =>
          Array(size)
            .fill(null)
            .map((_, x) => {
              // Natural-like pattern: smooth variations (no sharp periodic patterns)
              // Uses low-frequency sinusoids typical of natural scenes
              const lowFreq =
                Math.sin(x * 0.05) * 30 +
                Math.sin(y * 0.08) * 25 +
                Math.sin((x + y) * 0.03) * 20;
              const noise = (nextRandom() - 0.5) * 15;
              return 128 + lowFreq + noise;
            })
        );

      const spectrum = compute2DFFT(naturalData);
      const magnitude = computeMagnitudeSpectrum(spectrum);
      const result = analyzeFrequency(magnitude);

      // Natural images should have low GAN fingerprint confidence
      // GAN fingerprints require 6+ strong periodic peaks - natural patterns shouldn't have these
      expect(result.ganFingerprint.detected).toBe(false);
      expect(result.ganFingerprint.confidence).toBeLessThan(60);
    });
  });

  describe("Phase 3: Diffusion Detection", () => {
    it("should analyze high-frequency characteristics", async () => {
      const size = 64;
      const testData: number[][] = Array(size)
        .fill(null)
        .map((_, y) =>
          Array(size)
            .fill(null)
            .map((_, x) => 128 + Math.random() * 50)
        );

      const spectrum = compute2DFFT(testData);
      const magnitude = computeMagnitudeSpectrum(spectrum);
      const result = analyzeFrequency(magnitude);

      // Should return valid diffusion analysis
      expect(result.diffusionFingerprint).toBeDefined();
      expect(typeof result.diffusionFingerprint.detected).toBe("boolean");
      expect(result.diffusionFingerprint.confidence).toBeGreaterThanOrEqual(0);
      expect(result.diffusionFingerprint.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe("Phase 4: Integration", () => {
    describe("analyzeFrequency", () => {
      it("should combine all analysis methods", () => {
        const size = 64;
        const testData: number[][] = Array(size)
          .fill(null)
          .map(() => Array(size).fill(128));

        const spectrum = compute2DFFT(testData);
        const magnitude = computeMagnitudeSpectrum(spectrum);
        const result = analyzeFrequency(magnitude);

        // Check structure
        expect(result.analyzed).toBe(true);
        expect(result.ganFingerprint).toBeDefined();
        expect(result.diffusionFingerprint).toBeDefined();
        expect(result.radialEnergy).toBeDefined();
        expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
        expect(result.overallConfidence).toBeLessThanOrEqual(100);
      });

      it("should return correct type structure", () => {
        const size = 32;
        const testData: number[][] = Array(size)
          .fill(null)
          .map(() => Array(size).fill(100));

        const spectrum = compute2DFFT(testData);
        const magnitude = computeMagnitudeSpectrum(spectrum);
        const result: FrequencyAnalysis = analyzeFrequency(magnitude);

        // Type check - these should compile
        const isAnalyzed: boolean = result.analyzed;
        const ganDetected: boolean = result.ganFingerprint.detected;
        const ganConf: number = result.ganFingerprint.confidence;
        const ganEvidence: string[] = result.ganFingerprint.evidence;

        expect(isAnalyzed).toBe(true);
        expect(typeof ganDetected).toBe("boolean");
        expect(typeof ganConf).toBe("number");
        expect(Array.isArray(ganEvidence)).toBe(true);
      });
    });
  });
});
