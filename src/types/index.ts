// Fingerprint Detection Types
export type FingerprintSource = "c2pa" | "iptc" | "xmp" | "watermark" | "none";

export interface FingerprintDetails {
  generator?: string;
  signedBy?: string;
  timestamp?: string;
  softwareAgent?: string;
  aiModel?: string;
  validationStatus?: "valid" | "invalid" | "unknown";
}

export interface FingerprintResult {
  detected: boolean;
  confidence: number;
  source: FingerprintSource;
  details?: FingerprintDetails;
  evidence?: string[];
}

// Frequency Analysis Types
export interface GANFingerprint {
  detected: boolean;
  confidence: number;
  evidence: string[];
}

export interface DiffusionFingerprint {
  detected: boolean;
  confidence: number;
  evidence: string[];
}

export interface RadialEnergy {
  isNatural: boolean;
  confidence: number;
}

export interface FrequencyAnalysis {
  analyzed: boolean;
  ganFingerprint: GANFingerprint;
  diffusionFingerprint: DiffusionFingerprint;
  radialEnergy: RadialEnergy;
  overallConfidence: number;
}

// Screenshot/Editing Analysis Types (for false positive prevention)
export interface ScreenshotAnalysis {
  isScreenshot: boolean;
  confidence: number;
  evidence: string[];
  deviceType?: "mobile" | "tablet" | "desktop" | "unknown";
}

export interface EditingAnalysis {
  isEdited: boolean;
  isAIGenerated: boolean;
  editingTool?: string;
  confidence: number;
  evidence: string[];
}

export type ContentType = "photograph" | "screenshot" | "edited" | "ai_generated" | "unknown";

// Analysis Result Types
export interface AnalysisResult {
  isAI: boolean;
  confidence: number;
  evidence: string[];
  riskLevel: "low" | "medium" | "high";
  metadata?: ImageMetadata;
  fingerprint?: FingerprintResult;
  frequency?: FrequencyAnalysis;
  screenshot?: ScreenshotAnalysis;
  editing?: EditingAnalysis;
  contentType?: ContentType;
  analysisMethod?: "fingerprint" | "visual" | "combined" | "frequency";
}

export interface ScrapeResult {
  imageUrl: string;
  sourceUrl: string;
  title?: string;
}

export interface ImageMetadata {
  camera?: {
    make?: string;
    model?: string;
  };
  software?: string;
  dateTime?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
  };
  imageSize?: {
    width?: number;
    height?: number;
  };
  hasExif: boolean;
  aiToolHint?: string;
  editingToolHint?: {
    name: string;
    type: "editor" | "screenshot" | "camera";
  };
}
