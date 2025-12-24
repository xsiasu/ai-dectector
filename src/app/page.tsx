"use client";

import { useState } from "react";
import { Loader2, Bot, RefreshCw, X } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { UrlInput } from "@/components/UrlInput";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AnalysisResultData {
  isAI: boolean;
  confidence: number;
  evidence: string[];
  riskLevel: "low" | "medium" | "high";
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedFile(file);
    setImagePreview(preview);
    setAnalysisResult(null);
    setError(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleUrlSubmit = async (url: string, isDirectImage: boolean) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      let imageUrl = url;

      // If it's not a direct image URL, scrape the page first
      if (!isDirectImage) {
        const scrapeResponse = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!scrapeResponse.ok) {
          const errorData = await scrapeResponse.json();
          throw new Error(errorData.error || "스크래핑에 실패했습니다.");
        }

        const scrapeResult = await scrapeResponse.json();
        imageUrl = scrapeResult.imageUrl;
      }

      // Set preview
      setImagePreview(imageUrl);

      // Analyze the image
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || "분석에 실패했습니다.");
      }

      const result = await analyzeResponse.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUploadedImage = async () => {
    if (!selectedFile || !imagePreview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Extract base64 data from preview
      const base64Match = imagePreview.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error("이미지 데이터를 처리할 수 없습니다.");
      }

      const mimeType = base64Match[1];
      const imageBase64 = base64Match[2];

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "분석에 실패했습니다.");
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    handleClear();
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1677212004257-103cfa6b59d0?auto=format&fit=crop&w=1920&q=80')`,
      }}
    >
      <div className="min-h-screen bg-overlay backdrop-blur-xs">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          {/* Header */}
          <div className="text-center mb-10 relative">
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                AI Detector
              </h1>
            </div>
            <p className="text-lg">이미지가 AI로 생성되었는지 판별합니다</p>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Show result or input sections */}
            {analysisResult ? (
              <div className="space-y-6">
                {/* Image Preview */}
                {imagePreview && (
                  <Card className="overflow-hidden relative">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 z-10"
                      onClick={handleClear}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="relative aspect-video w-full">
                      <img
                        src={imagePreview}
                        alt="분석된 이미지"
                        className="h-full w-full object-contain bg-gray-100 dark:bg-gray-900"
                      />
                    </div>
                  </Card>
                )}

                {/* Analysis Result */}
                <AnalysisResult
                  result={analysisResult}
                  imagePreview={imagePreview || undefined}
                />

                {/* Reset Button */}
                <div className="flex justify-center">
                  <Button onClick={handleReset} variant="outline" size="lg">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    새로운 이미지 분석
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Image Upload Section */}
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  onClear={handleClear}
                  selectedImage={imagePreview}
                  isAnalyzing={isAnalyzing}
                />

                {/* Analyze Button (when image is uploaded) */}
                {imagePreview && !isAnalyzing && (
                  <Button
                    onClick={handleAnalyzeUploadedImage}
                    className="w-full"
                    size="lg"
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    AI 판별 시작
                  </Button>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-gray-600 dark:text-gray-400">
                        이미지를 분석하고 있습니다...
                      </p>
                    </div>
                  </Card>
                )}

                {/* Divider */}
                {!imagePreview && !isAnalyzing && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-gray-50 px-4 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                        또는
                      </span>
                    </div>
                  </div>
                )}

                {/* URL Input Section */}
                {!imagePreview && !isAnalyzing && (
                  <UrlInput
                    onUrlSubmit={handleUrlSubmit}
                    isLoading={isAnalyzing}
                    disabled={isAnalyzing}
                  />
                )}

                {/* Error Message */}
                {error && (
                  <Card className="p-4 bg-red-50 border-red-200">
                    <p className="text-red-600 text-center">{error}</p>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center text-sm text-gray-400">
            <p>
              본 서비스는 참고용 분석 도구이며, 법적 증거로 사용될 수 없습니다.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
