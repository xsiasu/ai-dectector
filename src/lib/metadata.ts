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

// Editing tools that indicate manual editing (NOT AI generation)
const EDITING_TOOL_KEYWORDS = [
  // Professional editing software
  { keyword: "photoshop", name: "Adobe Photoshop" },
  { keyword: "lightroom", name: "Adobe Lightroom" },
  { keyword: "gimp", name: "GIMP" },
  { keyword: "affinity photo", name: "Affinity Photo" },
  { keyword: "capture one", name: "Capture One" },
  { keyword: "darktable", name: "Darktable" },
  { keyword: "rawtherapee", name: "RawTherapee" },
  { keyword: "pixelmator", name: "Pixelmator" },
  { keyword: "acorn", name: "Acorn" },
  { keyword: "paint.net", name: "Paint.NET" },
  { keyword: "corel", name: "Corel" },
  // Mobile editing apps
  { keyword: "snapseed", name: "Snapseed" },
  { keyword: "vsco", name: "VSCO" },
  { keyword: "instagram", name: "Instagram" },
  { keyword: "picsart", name: "PicsArt" },
  { keyword: "facetune", name: "Facetune" },
  // Screenshot tools
  { keyword: "screenshot", name: "Screenshot" },
  { keyword: "snipping", name: "Snipping Tool" },
  { keyword: "cleanshot", name: "CleanShot" },
  { keyword: "snagit", name: "Snagit" },
  { keyword: "greenshot", name: "Greenshot" },
  { keyword: "flameshot", name: "Flameshot" },
  // Camera apps (native)
  { keyword: "iphone", name: "iPhone Camera" },
  { keyword: "ipad", name: "iPad Camera" },
  { keyword: "samsung", name: "Samsung Camera" },
  { keyword: "google camera", name: "Google Camera" },
  { keyword: "pixel", name: "Google Pixel Camera" },
  { keyword: "huawei", name: "Huawei Camera" },
  { keyword: "xiaomi", name: "Xiaomi Camera" },
  { keyword: "oneplus", name: "OnePlus Camera" },
  { keyword: "oppo", name: "OPPO Camera" },
  // DSLR/Mirrorless
  { keyword: "canon", name: "Canon Camera" },
  { keyword: "nikon", name: "Nikon Camera" },
  { keyword: "sony", name: "Sony Camera" },
  { keyword: "fujifilm", name: "Fujifilm Camera" },
  { keyword: "olympus", name: "Olympus Camera" },
  { keyword: "panasonic", name: "Panasonic Camera" },
  { keyword: "leica", name: "Leica Camera" },
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

function detectEditingTool(
  software: string | undefined,
  make: string | undefined
): { name: string; type: "editor" | "screenshot" | "camera" } | undefined {
  // Check software field
  if (software) {
    const lowerSoftware = software.toLowerCase();
    for (const tool of EDITING_TOOL_KEYWORDS) {
      if (lowerSoftware.includes(tool.keyword)) {
        // Determine type based on keyword category
        const isScreenshot = ["screenshot", "snipping", "cleanshot", "snagit", "greenshot", "flameshot"].some(
          (s) => tool.keyword.includes(s)
        );
        const isCamera = [
          "iphone", "ipad", "samsung", "google camera", "pixel", "huawei",
          "xiaomi", "oneplus", "oppo", "canon", "nikon", "sony", "fujifilm",
          "olympus", "panasonic", "leica"
        ].some((s) => tool.keyword.includes(s));

        return {
          name: tool.name,
          type: isScreenshot ? "screenshot" : isCamera ? "camera" : "editor",
        };
      }
    }
  }

  // Check camera make field
  if (make) {
    const lowerMake = make.toLowerCase();
    for (const tool of EDITING_TOOL_KEYWORDS) {
      if (lowerMake.includes(tool.keyword)) {
        return {
          name: tool.name,
          type: "camera",
        };
      }
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

    // Editing tool detection (for false positive prevention)
    const editingTool = detectEditingTool(tags.Software, tags.Make);
    if (editingTool) {
      metadata.editingToolHint = editingTool;
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
