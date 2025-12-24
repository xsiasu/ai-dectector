"use client";

import { useState } from "react";
import { Link, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UrlInputProps {
  onUrlSubmit: (url: string, isDirectImage: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function isDirectImageUrl(url: string): boolean {
  const pathname = new URL(url).pathname.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

export function UrlInput({
  onUrlSubmit,
  isLoading = false,
  disabled = false,
}: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [urlType, setUrlType] = useState<"none" | "image" | "webpage">("none");
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setError(null);

    if (!value.trim()) {
      setUrlType("none");
      return;
    }

    if (!isValidUrl(value)) {
      setUrlType("none");
      return;
    }

    if (isDirectImageUrl(value)) {
      setUrlType("image");
    } else {
      setUrlType("webpage");
    }
  };

  const handleSubmit = () => {
    if (!url.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }

    if (!isValidUrl(url)) {
      setError("올바른 URL 형식이 아닙니다.");
      return;
    }

    onUrlSubmit(url, urlType === "image");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <Card className="px-4 py-10 ">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          <span className="font-medium">URL로 이미지 분석</span>
        </div>

        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg 또는 웹페이지 URL"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={disabled || isLoading || !url.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "분석"}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {urlType !== "none" && !error && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            {urlType === "image"
              ? "이미지 URL 감지됨"
              : "웹페이지 URL 감지됨 (이미지 자동 추출)"}
          </div>
        )}
      </div>
    </Card>
  );
}
