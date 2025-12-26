"use client";

import { useState, useEffect } from "react";
import { Loader2, Bot, RefreshCw, X, Zap, History } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { UrlInput } from "@/components/UrlInput";
import { AnalysisResult } from "@/components/AnalysisResult";
import { HistoryList } from "@/components/HistoryList";
import { PricingModal } from "@/components/PricingModal";
import { LoginModal } from "@/components/LoginModal";
import { UsageWarning } from "@/components/UsageWarning";
import { PaymentHistory } from "@/components/PaymentHistory";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUsage } from "@/hooks/useUsage";
import { useHistory } from "@/hooks/useHistory";
import { useAuth } from "@/hooks/useAuth";
import { HistoryItem } from "@/types/history";
import { AnalysisResult as AnalysisResultType } from "@/types/index";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"upload" | "url">(
    "upload"
  );
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const {
    remainingCredits,
    remainingFreeUsage,
    paidCredits,
    canUse,
    incrementUsage,
    refresh: refreshUsage,
  } = useUsage();
  const { saveAnalysis, refresh: refreshHistory } = useHistory();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // 로그인 후 결제 모달 자동 표시
  useEffect(() => {
    if (pendingAction && isAuthenticated && !authLoading) {
      setPendingAction(false);
      setShowPricing(true);
    }
  }, [isAuthenticated, authLoading, pendingAction]);

  // 로그인 후 사용량 병합 완료 시 크레딧/기록 새로고침
  useEffect(() => {
    const handleUsageMerged = () => {
      refreshUsage();
      refreshHistory();
    };

    window.addEventListener("auth:usage-merged", handleUsageMerged);
    return () => {
      window.removeEventListener("auth:usage-merged", handleUsageMerged);
    };
  }, [refreshUsage, refreshHistory]);

  // 크레딧 소진 시 로그인/결제 모달 핸들링
  const handleNoCredits = () => {
    if (!isAuthenticated) {
      setPendingAction(true);
      setShowLogin(true);
    } else {
      setShowPricing(true);
    }
  };

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedFile(file);
    setImagePreview(preview);
    setAnalysisResult(null);
    setError(null);
    setAnalysisSource("upload");
    setSourceUrl(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    setSourceUrl(null);
  };

  const handleUrlSubmit = async (url: string) => {
    if (!canUse) {
      handleNoCredits();
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setAnalysisSource("url");
    setSourceUrl(url);

    try {
      setImagePreview(url);

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || "분석에 실패했습니다.");
      }

      const result = await analyzeResponse.json();
      setAnalysisResult(result);

      // Increment usage and save to history
      incrementUsage();
      await saveAnalysis({
        imageUrl: url,
        source: "url",
        sourceUrl: url,
        result,
      });
      refreshUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUploadedImage = async () => {
    if (!selectedFile || !imagePreview) return;

    if (!canUse) {
      handleNoCredits();
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
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

      // Increment usage and save to history
      incrementUsage();

      // Create a smaller thumbnail for history
      const thumbnail = await createThumbnail(imagePreview);
      await saveAnalysis({
        imageThumbnail: thumbnail,
        source: "upload",
        result,
      });
      refreshUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createThumbnail = async (base64Image: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 100;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(base64Image);
      img.src = base64Image;
    });
  };

  const handleReset = () => {
    handleClear();
    refreshHistory();
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    // Reconstruct the result from history item
    const result: AnalysisResultType = {
      isAI: item.isAI,
      confidence: item.confidence,
      evidence: item.evidence,
      riskLevel: item.riskLevel,
      contentType: item.contentType as AnalysisResultType["contentType"],
      analysisMethod:
        item.analysisMethod as AnalysisResultType["analysisMethod"],
    };

    setAnalysisResult(result);
    setImagePreview(item.imageUrl || item.imageThumbnail || null);
    setShowHistory(false);
  };

  return (
    <div
      className="invert dark:invert-0 min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1677212004257-103cfa6b59d0?auto=format&fit=crop&w=1920&q=80')`,
      }}
    >
      <div className="min-h-screen bg-overlay">
        <div className="container mx-auto max-w-[600] px-2 md:px-0 py-4">
          <Header
            onLoginClick={() => setShowLogin(true)}
            onPaymentHistoryClick={() => setShowPaymentHistory(true)}
          />

          {/* Usage Status Bar */}
          <div className="mb-4 flex items-center gap-2 z-[10]">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-white/20 transition-colors"
            >
              <History className="w-4 h-4" />
              기록
            </button>
            <button
              onClick={() => setShowPricing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-white/20 transition-colors"
            >
              <Zap className="w-4 h-4" />
              {remainingCredits} 크레딧
            </button>
          </div>

          {/* Usage Warning (1-2 credits remaining) */}
          {!analysisResult && (
            <div className="mb-4">
              <UsageWarning
                remainingCredits={remainingCredits}
                onUpgradeClick={() => setShowPricing(true)}
              />
            </div>
          )}

          <div
            className="mb-4 mx-auto w-30 flex justify-center items-center
          text-card-foreground rounded-xl border border-glass-border py-2 px-2 shadow-[inset_0_0_30px_var(--glass-shadow)] backdrop-blur-xl
          "
          >
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-xs  dark:text-white ml-2">AI Detector</h1>
          </div>

          <div className="flex items-center justify-center mb-7">
            <p className="text-4xl font-bold text-primary/90 text-center">
              <span>
                이미지가 AI로<br></br> 생성되었는지 판별합니다
              </span>
            </p>
          </div>

          {/* History Panel */}
          {showHistory && (
            <Card className="mb-6 p-4">
              <HistoryList onItemClick={handleHistoryItemClick} />
            </Card>
          )}

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
                    disabled={!canUse}
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    {canUse ? "AI 판별 시작" : "크레딧 충전 필요"}
                  </Button>
                )}

                {/* No credits warning */}
                {imagePreview && !isAnalyzing && !canUse && (
                  <p className="text-center text-sm text-amber-600 dark:text-amber-400">
                    크레딧이 부족합니다.{" "}
                    <button
                      onClick={() => setShowPricing(true)}
                      className="underline hover:no-underline"
                    >
                      충전하기
                    </button>
                  </p>
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

          <Footer />
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => {
          setShowPricing(false);
          refreshUsage();
        }}
        remainingFreeUsage={remainingFreeUsage}
        paidCredits={paidCredits}
      />

      {/* Login Modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
