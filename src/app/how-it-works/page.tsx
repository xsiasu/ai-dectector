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
  Activity,
  Radio,
  Waves,
  Camera,
  Monitor,
  Paintbrush,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header, Footer } from "@/components/layout";

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

const editingTools = [
  "Adobe Photoshop",
  "Lightroom",
  "GIMP",
  "Affinity Photo",
  "Snapseed",
  "VSCO",
];

const screenshotTools = [
  "CleanShot",
  "Snagit",
  "Greenshot",
  "Snipping Tool",
  "Flameshot",
];

const cameraBrands = [
  "iPhone",
  "Samsung",
  "Google Pixel",
  "Canon",
  "Nikon",
  "Sony",
  "Fujifilm",
];

const contentTypes = [
  {
    type: "photograph",
    label: "사진",
    color: "green",
    description: "자연 촬영 이미지",
  },
  {
    type: "screenshot",
    label: "스크린샷",
    color: "blue",
    description: "화면 캡처",
  },
  {
    type: "edited",
    label: "편집됨",
    color: "orange",
    description: "편집 소프트웨어로 수정",
  },
  {
    type: "ai_generated",
    label: "AI 생성",
    color: "red",
    description: "AI로 생성된 이미지",
  },
  {
    type: "unknown",
    label: "알 수 없음",
    color: "gray",
    description: "판별 불가",
  },
];

const visualAnalysisItems = [
  {
    title: "해부학적 불일치",
    description: "손가락 관절, 귀 형태, 치아 개수 이상",
    icon: Sparkles,
  },
  {
    title: "물리적 불가능",
    description: "그림자 방향 모순, 중력 위반",
    icon: ImageIcon,
  },
  {
    title: "텍스트 왜곡",
    description: "읽을 수 없는 문자, 간판 왜곡",
    icon: FileSearch,
  },
  {
    title: "질감 이상",
    description: "균일한 피부, 반복 패턴 머리카락",
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
        <div className="container mx-auto max-w-3xl px-4 py-4">
          <Header />

          {/* Page Title */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              AI 이미지, 어떻게 판별하나요?
            </h2>
            <p className="">
              5단계 분석 프로세스로 AI 생성 이미지를 정확하게 탐지합니다
            </p>
          </div>

          {/* Process Overview - 5 Steps */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              판별 프로세스
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Fingerprint className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  1. 디지털 지문
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Camera className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  2. 메타데이터
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-100 dark:bg-cyan-900 rounded-full">
                <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                  3. 주파수 분석
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  4. 시각 분석
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 hidden md:block" />
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  5. 결과 통합
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
                <h3 className="text-lg font-semibold">
                  1단계: 디지털 지문 검사
                </h3>
                <p className="text-sm">가장 정확한 방법 (신뢰도 90-98%)</p>
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
                <p className="text-sm mb-2">감지 가능한 AI 도구:</p>
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

          {/* Step 2: Metadata Analysis (NEW) */}
          <Card className="p-6 mb-6 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Camera className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  2단계: 메타데이터 분석
                </h3>
                <p className="text-sm">
                  EXIF 데이터로 촬영 기기 및 편집 도구 감지 (오탐지 방지)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4 text-green-600" />
                    <span className="font-medium">카메라 감지</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    실제 촬영 기기 인식
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cameraBrands.slice(0, 4).map((brand) => (
                      <span
                        key={brand}
                        className="px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Paintbrush className="h-4 w-4 text-green-600" />
                    <span className="font-medium">편집 도구 감지</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    편집 소프트웨어 인식
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {editingTools.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="h-4 w-4 text-green-600" />
                    <span className="font-medium">스크린샷 감지</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    화면 캡처 도구 인식
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {screenshotTools.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    오탐지 방지 목적
                  </p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  카메라로 촬영한 사진, Photoshop으로 편집한 이미지, 스크린샷을
                  AI 생성 이미지로 잘못 판별하지 않도록 메타데이터를 분석합니다.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 3: Frequency Analysis */}
          <Card className="p-6 mb-6 border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <Activity className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">3단계: 주파수 분석</h3>
                <p className="text-sm">
                  FFT 기반 주파수 도메인 분석 (신뢰도 최대 70%)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="h-4 w-4 text-cyan-600" />
                    <span className="font-medium">GAN 핑거프린트</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    업샘플링으로 인한 주기적 피크 패턴 탐지
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="h-4 w-4 text-cyan-600" />
                    <span className="font-medium">Diffusion 핑거프린트</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    고주파 에너지 분포 이상 탐지
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg">
                  <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200 mb-2">
                    분석 원리
                  </p>
                  <ul className="text-sm text-cyan-700 dark:text-cyan-300 space-y-1">
                    <li>• 이미지를 주파수 도메인으로 변환 (2D FFT)</li>
                    <li>• AI 모델 특유의 주파수 패턴 분석</li>
                    <li>• 자연 이미지의 1/f 분포와 비교</li>
                  </ul>
                </div>
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="h-4 w-4 text-cyan-600" />
                    <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                      UI 패턴 감지
                    </p>
                  </div>
                  <p className="text-sm text-cyan-700 dark:text-cyan-300">
                    스크린샷의 수평/수직 UI 요소를 감지하여 AI 이미지와
                    구분합니다. PNG 포맷도 스크린샷 가능성으로 고려됩니다.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 4: Visual Analysis */}
          <Card className="p-6 mb-6 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Eye className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">4단계: 시각 분석</h3>
                <p className="text-sm">
                  Gemini Vision AI가 이미지 특성을 분석 (신뢰도 70-85%)
                </p>
              </div>
            </div>

            <div className="space-y-4">
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

              {/* ContentType Classification */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  이미지 유형 분류 (ContentType)
                </p>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((ct) => (
                    <div
                      key={ct.type}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium
                        ${ct.color === "green" ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300" : ""}
                        ${ct.color === "blue" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : ""}
                        ${ct.color === "orange" ? "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300" : ""}
                        ${ct.color === "red" ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" : ""}
                        ${ct.color === "gray" ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : ""}
                      `}
                    >
                      {ct.label}: {ct.description}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Step 5: Result Combination */}
          <Card className="p-6 mb-6 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  5단계: 결과 통합 및 보정
                </h3>
                <p className="text-sm">
                  모든 분석 결과를 종합하고 오탐지를 보정
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  신뢰도 계산 방식
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 지문 신뢰도 95% 이상 → AI 확정 (최우선)</li>
                  <li>• 지문 신뢰도 90% 이상 → 지문 결과 우선</li>
                  <li>• 그 외 → 지문 40% + 주파수 30% + 시각 30% 가중치</li>
                </ul>
              </div>

              {/* Penalty System */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    오탐지 방지 패널티 시스템
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-orange-700 dark:text-orange-300">
                    스크린샷 도구 감지
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 font-medium">
                    -50%
                  </div>
                  <div className="text-orange-700 dark:text-orange-300">
                    카메라 촬영 감지
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 font-medium">
                    -40%
                  </div>
                  <div className="text-orange-700 dark:text-orange-300">
                    편집 소프트웨어 감지
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 font-medium">
                    -35%
                  </div>
                  <div className="text-orange-700 dark:text-orange-300">
                    시각 분석 스크린샷 감지
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 font-medium">
                    -40%
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm mb-3">위험도 레벨:</p>
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

          <Footer />
        </div>
      </div>
    </div>
  );
}
