import { describe, it, expect } from "vitest";
import {
  extractMetadataFromBuffer,
  extractMetadataFromBase64,
} from "../metadata";

describe("metadata extraction", () => {
  describe("extractMetadataFromBuffer", () => {
    it("returns hasExif: false for invalid buffer", () => {
      const invalidBuffer = Buffer.from("not an image");
      const result = extractMetadataFromBuffer(invalidBuffer);

      expect(result.hasExif).toBe(false);
    });

    it("returns hasExif: false for empty buffer", () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = extractMetadataFromBuffer(emptyBuffer);

      expect(result.hasExif).toBe(false);
    });
  });

  describe("extractMetadataFromBase64", () => {
    it("returns hasExif: false for invalid base64", () => {
      const result = extractMetadataFromBase64("invalid-base64");

      expect(result.hasExif).toBe(false);
    });

    it("returns hasExif: false for non-image base64", () => {
      const textBase64 = Buffer.from("Hello World").toString("base64");
      const result = extractMetadataFromBase64(textBase64);

      expect(result.hasExif).toBe(false);
    });
  });

  describe("AI tool detection", () => {
    it("returns correct structure for metadata without EXIF", () => {
      const result = extractMetadataFromBase64("dGVzdA=="); // "test" in base64

      expect(result).toHaveProperty("hasExif");
      expect(typeof result.hasExif).toBe("boolean");
    });
  });
});
