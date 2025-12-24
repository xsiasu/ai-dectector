"use client";

import Link from "next/link";
import {
  Bot,
  Fingerprint,
  Eye,
  Layers,
  ShieldCheck,
  FileSearch,
  Sparkles,
  Focus,
  ImageIcon,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const aiTools = [
  "Midjourney",
  "DALL-E",
  "Stable Diffusion",
  "Adobe Firefly",
  "Gemini",
  "Runway",
  "Leonardo.ai",
  "Bing Image",
  "Copilot",
  "DreamStudio",
];

const visualAnalysisItems = [
  {
    title: "과도한 완벽함",
    description: "조명, 구도, 색감이 너무 이상적인 경우",
    icon: Sparkles,
  },
  {
    title: "질감 균일성",
    description: "피부나 배경이 비정상적으로 균일한 경우",
    icon: ImageIcon,
  },
  {
    title: "배경 문제",
    description: "디테일 부족, 물리적으로 불가능한 구조",
    icon: FileSearch,
  },
  {
    title: "피사계 심도",
    description: "블러 전환이 부자연스러운 경우",
    icon: Focus,
  },
];

export default function HowItWorks() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1677212004257-103cfa6b59d0?auto=format&fit=crop&w=1920&q=80')`,
      }}
    >
      <div className="min-h-screen bg-overlay backdrop-blur-sm">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로
              </Button>
            </Link>
            <ThemeToggle />
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI 이미지, 어떻게 판별하나요?
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              3단계 분석 프로세스로 AI 생성 이미지를 탐지합니다
            </p>
          </div>

          {/* Process Overview */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              판별 프로세스
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Fingerprint className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  1. 디지털 지문
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  2. 시각 분석
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  3. 결과 합산
                </span>
              </div>
            </div>
          </Card>

          {/* Step 1: Digital Fingerprint */}
          <Card className="p-6 mb-6 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Fingerprint className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">1단계: 디지털 지문 검사</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  가장 정확한 방법 (신뢰도 90-98%)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">C2PA 서명</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adobe 등이 사용하는 암호화된 콘텐츠 인증 서명
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSearch className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">IPTC/XMP 메타데이터</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    이미지에 포함된 AI 도구 정보 분석
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  감지 가능한 AI 도구:
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiTools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2: Visual Analysis */}
          <Card className="p-6 mb-6 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Eye className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">2단계: 시각 분석</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI가 이미지 특성을 분석 (신뢰도 70-85%)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visualAnalysisItems.map((item) => (
                <div
                  key={item.title}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 3: Result Combination */}
          <Card className="p-6 mb-6 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">3단계: 결과 합산</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  두 분석 결과를 종합하여 최종 판정
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  신뢰도 계산 방식
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 지문 신뢰도 95% 이상 → AI 확정</li>
                  <li>• 지문 신뢰도 90% 이상 → 지문 결과 우선</li>
                  <li>• 그 외 → 지문 60% + 시각 40% 가중치</li>
                </ul>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  위험도 레벨:
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      낮음 (50% 미만)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                      중간 (50-80%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      높음 (80% 이상)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA Button */}
          <div className="flex justify-center mb-10">
            <Link href="/">
              <Button size="lg">
                <Bot className="h-5 w-5 mr-2" />
                지금 분석하기
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-gray-400">
            <p>
              본 서비스는 참고용 분석 도구이며, 법적 증거로 사용될 수 없습니다.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
