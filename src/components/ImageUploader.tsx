"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  onClear: () => void;
  selectedImage: string | null;
  isAnalyzing?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImageUploader({
  onImageSelect,
  onClear,
  selectedImage,
  isAnalyzing = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 가능)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기가 10MB를 초과합니다.";
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onImageSelect(file, preview);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  if (selectedImage) {
    return (
      <Card className="relative overflow-hidden">
        <div className="relative aspect-video w-full">
          <img
            src={selectedImage}
            alt="업로드된 이미지"
            className="h-full w-full object-contain bg-gray-100 dark:bg-gray-900"
          />
          {!isAnalyzing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Card
        className={`
          relative cursor-pointer border-1 border-dashed p-8 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"}
          ${error ? "border-red-500" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full">
            {isDragging ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-medium">
              {isDragging
                ? "여기에 놓으세요"
                : "이미지를 드래그하거나 클릭하여 업로드"}
            </p>
            <p className="text-sm">JPG, PNG, WebP, GIF • 최대 10MB</p>
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
