"use client";

import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Camera,
  Info,
  Fingerprint,
  ShieldCheck,
  Eye,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ImageMetadata, FingerprintResult, FingerprintSource } from "@/types";

interface AnalysisResultProps {
  result: {
    isAI: boolean;
    confidence: number;
    evidence: string[];
    riskLevel: "low" | "medium" | "high";
    metadata?: ImageMetadata;
    fingerprint?: FingerprintResult;
    analysisMethod?: "fingerprint" | "visual" | "combined";
  };
  imagePreview?: string;
}

const riskConfig = {
  low: {
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    gaugeColor: "stroke-green-500",
    label: "낮음",
    icon: CheckCircle,
  },
  medium: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    gaugeColor: "stroke-yellow-500",
    label: "중간",
    icon: AlertTriangle,
  },
  high: {
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    gaugeColor: "stroke-red-500",
    label: "높음",
    icon: XCircle,
  },
};

function CircularGauge({
  percentage,
  riskLevel,
}: {
  percentage: number;
  riskLevel: "low" | "medium" | "high";
}) {
  const config = riskConfig[riskLevel];
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-40 h-40 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          className={config.gaugeColor}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${config.color}`}>
          {percentage}%
        </span>
        <span className="text-sm text-gray-500">AI 생성 확률</span>
      </div>
    </div>
  );
}

// Source labels for fingerprint detection methods
const sourceLabels: Record<FingerprintSource, string> = {
  c2pa: "C2PA Content Credentials",
  iptc: "IPTC 메타데이터",
  xmp: "XMP 메타데이터",
  watermark: "디지털 워터마크",
  none: "없음",
};

// Analysis method badge configuration
const analysisMethodConfig = {
  fingerprint: {
    label: "디지털 지문 기반",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900",
    icon: Fingerprint,
  },
  visual: {
    label: "시각 분석 기반",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    icon: Eye,
  },
  combined: {
    label: "복합 분석",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    icon: Layers,
  },
};

function AnalysisMethodBadge({
  method,
}: {
  method: "fingerprint" | "visual" | "combined";
}) {
  const config = analysisMethodConfig[method];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function FingerprintBadge({ fingerprint }: { fingerprint: FingerprintResult }) {
  return (
    <Card className="p-4 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 border-2">
      <div className="flex items-center gap-2 mb-3">
        <Fingerprint className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <h4 className="font-semibold text-purple-800 dark:text-purple-200">
          디지털 지문 감지
        </h4>
        {fingerprint.details?.validationStatus === "valid" && (
          <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" />
            서명 검증됨
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">감지 방식</span>
          <p className="font-medium text-purple-700 dark:text-purple-300">
            {sourceLabels[fingerprint.source]}
          </p>
        </div>

        <div>
          <span className="text-gray-500 dark:text-gray-400">신뢰도</span>
          <p className="font-medium text-purple-700 dark:text-purple-300">
            {fingerprint.confidence}%
          </p>
        </div>

        {fingerprint.details?.generator && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">생성 도구</span>
            <p className="font-medium text-purple-700 dark:text-purple-300">
              {fingerprint.details.generator}
            </p>
          </div>
        )}

        {fingerprint.details?.softwareAgent && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">소프트웨어</span>
            <p className="font-medium text-purple-700 dark:text-purple-300">
              {fingerprint.details.softwareAgent}
            </p>
          </div>
        )}

        {fingerprint.details?.signedBy && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">서명자</span>
            <p className="font-medium text-purple-700 dark:text-purple-300">
              {fingerprint.details.signedBy}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const config = riskConfig[result.riskLevel];
  const RiskIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Main Result Card */}
      <Card className={`p-6 ${config.bgColor} ${config.borderColor} border-2`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Circular Gauge */}
          <div className="flex-shrink-0">
            <CircularGauge
              percentage={result.confidence}
              riskLevel={result.riskLevel}
            />
          </div>

          {/* Result Summary */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <RiskIcon className={`h-6 w-6 ${config.color}`} />
              <h3 className={`text-xl font-bold ${config.color}`}>
                {result.isAI ? "AI 생성 이미지로 추정" : "실제 이미지로 추정"}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              위험도:{" "}
              <span className={`font-semibold ${config.color}`}>
                {config.label}
              </span>
            </p>
            {result.analysisMethod && (
              <div className="mt-2">
                <AnalysisMethodBadge method={result.analysisMethod} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Fingerprint Badge - displayed prominently when detected */}
      {result.fingerprint?.detected && (
        <FingerprintBadge fingerprint={result.fingerprint} />
      )}

      {/* Evidence Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-gray-400" />
          <h4 className="font-semibold text-lg">판별 근거</h4>
        </div>
        <ul className="space-y-2">
          {result.evidence.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
            >
              <span className="text-gray-400 font-mono text-sm mt-0.5">
                {index + 1}.
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Metadata Card */}
      {result.metadata && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-gray-400" />
            <h4 className="font-semibold text-lg">이미지 메타데이터</h4>
          </div>

          {result.metadata.hasExif ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {result.metadata.camera && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">
                    카메라
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {[result.metadata.camera.make, result.metadata.camera.model]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </span>
                </div>
              )}

              {result.metadata.software && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">
                    소프트웨어
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {result.metadata.software}
                  </span>
                </div>
              )}

              {result.metadata.dateTime && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">
                    촬영 날짜
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(result.metadata.dateTime).toLocaleString("ko-KR")}
                  </span>
                </div>
              )}

              {result.metadata.imageSize && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">
                    이미지 크기
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {result.metadata.imageSize.width} x{" "}
                    {result.metadata.imageSize.height}
                  </span>
                </div>
              )}

              {result.metadata.gps && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">
                    GPS 좌표
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {result.metadata.gps.latitude?.toFixed(6)},{" "}
                    {result.metadata.gps.longitude?.toFixed(6)}
                  </span>
                </div>
              )}

              {result.metadata.aiToolHint && (
                <div className="flex flex-col md:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    AI 도구 감지
                  </span>
                  <span className="text-red-600 font-semibold">
                    {result.metadata.aiToolHint} 로 생성된 것으로 추정
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              EXIF 메타데이터가 없습니다. AI 생성 이미지는 보통 메타데이터가
              없거나 제거되어 있습니다.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
