import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalysisResult } from "../AnalysisResult";

describe("AnalysisResult", () => {
  const mockResult = {
    isAI: true,
    confidence: 85,
    evidence: ["근거 1", "근거 2", "근거 3"],
    riskLevel: "high" as const,
  };

  it("renders confidence percentage correctly", () => {
    render(<AnalysisResult result={mockResult} />);

    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("AI 생성 확률")).toBeInTheDocument();
  });

  it("displays correct risk level label", () => {
    render(<AnalysisResult result={mockResult} />);

    expect(screen.getByText("높음")).toBeInTheDocument();
  });

  it("shows AI generated message when isAI is true", () => {
    render(<AnalysisResult result={mockResult} />);

    expect(screen.getByText("AI 생성 이미지로 추정")).toBeInTheDocument();
  });

  it("shows real image message when isAI is false", () => {
    const result = { ...mockResult, isAI: false, confidence: 20, riskLevel: "low" as const };
    render(<AnalysisResult result={result} />);

    expect(screen.getByText("실제 이미지로 추정")).toBeInTheDocument();
  });

  it("renders all evidence items", () => {
    render(<AnalysisResult result={mockResult} />);

    expect(screen.getByText("근거 1")).toBeInTheDocument();
    expect(screen.getByText("근거 2")).toBeInTheDocument();
    expect(screen.getByText("근거 3")).toBeInTheDocument();
  });

  it("renders download button", () => {
    render(<AnalysisResult result={mockResult} />);

    expect(screen.getByText("리포트 다운로드")).toBeInTheDocument();
  });

  it("renders disclaimer text", () => {
    render(<AnalysisResult result={mockResult} />);

    expect(
      screen.getByText("본 분석 결과는 참고용이며, 법적 증거로 사용될 수 없습니다.")
    ).toBeInTheDocument();
  });

  describe("with metadata", () => {
    it("shows metadata section when metadata is provided", () => {
      const resultWithMetadata = {
        ...mockResult,
        metadata: {
          hasExif: true,
          camera: { make: "Canon", model: "EOS 5D" },
          software: "Adobe Photoshop",
          dateTime: "2024-01-15T10:30:00.000Z",
        },
      };

      render(<AnalysisResult result={resultWithMetadata} />);

      expect(screen.getByText("이미지 메타데이터")).toBeInTheDocument();
      expect(screen.getByText("Canon EOS 5D")).toBeInTheDocument();
      expect(screen.getByText("Adobe Photoshop")).toBeInTheDocument();
    });

    it("shows no EXIF message when hasExif is false", () => {
      const resultWithNoExif = {
        ...mockResult,
        metadata: {
          hasExif: false,
        },
      };

      render(<AnalysisResult result={resultWithNoExif} />);

      expect(
        screen.getByText(
          "EXIF 메타데이터가 없습니다. AI 생성 이미지는 보통 메타데이터가 없거나 제거되어 있습니다."
        )
      ).toBeInTheDocument();
    });

    it("shows AI tool hint when detected", () => {
      const resultWithAiHint = {
        ...mockResult,
        metadata: {
          hasExif: true,
          software: "Midjourney",
          aiToolHint: "Midjourney",
        },
      };

      render(<AnalysisResult result={resultWithAiHint} />);

      expect(screen.getByText("AI 도구 감지")).toBeInTheDocument();
      expect(screen.getByText("Midjourney 로 생성된 것으로 추정")).toBeInTheDocument();
    });
  });

  describe("risk level styling", () => {
    it("renders with correct style for low risk", () => {
      const lowRiskResult = { ...mockResult, riskLevel: "low" as const, confidence: 20 };
      render(<AnalysisResult result={lowRiskResult} />);

      expect(screen.getByText("낮음")).toBeInTheDocument();
    });

    it("renders with correct style for medium risk", () => {
      const mediumRiskResult = { ...mockResult, riskLevel: "medium" as const, confidence: 55 };
      render(<AnalysisResult result={mediumRiskResult} />);

      expect(screen.getByText("중간")).toBeInTheDocument();
    });
  });

  describe("fingerprint detection banner", () => {
    it("shows fingerprint detection banner when fingerprint is detected", () => {
      const resultWithFingerprint = {
        ...mockResult,
        fingerprint: {
          detected: true,
          confidence: 95,
          source: "c2pa" as const,
          details: {
            generator: "Adobe Firefly",
          },
        },
      };

      render(<AnalysisResult result={resultWithFingerprint} />);

      expect(screen.getByText(/디지털 지문이 감지되었습니다/)).toBeInTheDocument();
      expect(screen.getByText(/C2PA Content Credentials/)).toBeInTheDocument();
    });

    it("does not show fingerprint banner when fingerprint is not detected", () => {
      render(<AnalysisResult result={mockResult} />);

      expect(screen.queryByText(/디지털 지문이 감지되었습니다/)).not.toBeInTheDocument();
    });
  });
});
