"use client";

import { useState } from "react";
import { Link, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

const KNOWN_IMAGE_HOSTS = [
  /^i\.imgur\.com/,
  /^pbs\.twimg\.com/,
  /^cdn\.discordapp\.com/,
  /^images\.unsplash\.com/,
  /^res\.cloudinary\.com/,
];

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function isKnownImageHost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return KNOWN_IMAGE_HOSTS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

function isDirectImageUrl(url: string): boolean {
  try {
    const { pathname, hostname } = new URL(url);

    // 1. 확장자 기반 판별
    if (IMAGE_EXTENSIONS.some((ext) => pathname.toLowerCase().endsWith(ext))) {
      return true;
    }

    // 2. 알려진 이미지 호스팅 서비스
    if (isKnownImageHost(url)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function UrlInput({
  onUrlSubmit,
  isLoading = false,
  disabled = false,
}: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [urlType, setUrlType] = useState<"none" | "image" | "invalid">("none");
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);

    if (!value.trim()) {
      setUrlType("none");
      setError(null);
      return;
    }

    if (!isValidUrl(value)) {
      setUrlType("none");
      setError(null);
      return;
    }

    if (isDirectImageUrl(value)) {
      setUrlType("image");
      setError(null);
    } else {
      setUrlType("invalid");
      setError(
        "직접 이미지 URL만 지원됩니다. (예: https://example.com/image.jpg)"
      );
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

    if (urlType !== "image") {
      return;
    }

    onUrlSubmit(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && !isLoading && urlType === "image") {
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
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={disabled || isLoading || !url.trim() || urlType !== "image"}
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

        {urlType === "image" && !error && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            이미지 URL 감지됨
          </div>
        )}
      </div>
    </Card>
  );
}
