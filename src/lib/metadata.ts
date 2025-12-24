import ExifParser from "exif-parser";
import { ImageMetadata } from "@/types";

const AI_TOOL_KEYWORDS = [
  "midjourney",
  "dall-e",
  "dalle",
  "stable diffusion",
  "stablediffusion",
  "novelai",
  "nai diffusion",
  "comfyui",
  "automatic1111",
  "invokeai",
  "leonardo",
  "adobe firefly",
  "firefly",
  "bing image creator",
  "copilot",
  "imagen",
  "dreamstudio",
];

function detectAiTool(software: string | undefined): string | undefined {
  if (!software) return undefined;

  const lowerSoftware = software.toLowerCase();
  for (const keyword of AI_TOOL_KEYWORDS) {
    if (lowerSoftware.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  return undefined;
}

export function extractMetadataFromBuffer(buffer: Buffer): ImageMetadata {
  try {
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    const tags = result.tags;

    const metadata: ImageMetadata = {
      hasExif: Object.keys(tags).length > 0,
    };

    // Camera info
    if (tags.Make || tags.Model) {
      metadata.camera = {
        make: tags.Make,
        model: tags.Model,
      };
    }

    // Software
    if (tags.Software) {
      metadata.software = tags.Software;
      metadata.aiToolHint = detectAiTool(tags.Software);
    }

    // Date/Time
    if (tags.DateTimeOriginal) {
      const date = new Date(tags.DateTimeOriginal * 1000);
      metadata.dateTime = date.toISOString();
    } else if (tags.CreateDate) {
      const date = new Date(tags.CreateDate * 1000);
      metadata.dateTime = date.toISOString();
    }

    // GPS
    if (tags.GPSLatitude !== undefined && tags.GPSLongitude !== undefined) {
      metadata.gps = {
        latitude: tags.GPSLatitude,
        longitude: tags.GPSLongitude,
      };
    }

    // Image size
    if (result.imageSize) {
      metadata.imageSize = {
        width: result.imageSize.width,
        height: result.imageSize.height,
      };
    }

    return metadata;
  } catch {
    return {
      hasExif: false,
    };
  }
}

export async function extractMetadataFromUrl(
  imageUrl: string
): Promise<ImageMetadata> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return extractMetadataFromBuffer(buffer);
  } catch {
    return {
      hasExif: false,
    };
  }
}

export function extractMetadataFromBase64(base64: string): ImageMetadata {
  try {
    const buffer = Buffer.from(base64, "base64");
    return extractMetadataFromBuffer(buffer);
  } catch {
    return {
      hasExif: false,
    };
  }
}
