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

// Analysis Result Types
export interface AnalysisResult {
  isAI: boolean;
  confidence: number;
  evidence: string[];
  riskLevel: "low" | "medium" | "high";
  metadata?: ImageMetadata;
  fingerprint?: FingerprintResult;
  analysisMethod?: "fingerprint" | "visual" | "combined";
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
}
