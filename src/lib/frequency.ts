import FFT from "fft.js";
import sharp from "sharp";
import type { FrequencyAnalysis } from "@/types";

/**
 * Convert raw RGBA buffer to 2D grayscale array
 * Grayscale = 0.299*R + 0.587*G + 0.114*B
 */
export async function imageBufferToGrayscale(
  buffer: Buffer,
  width: number,
  height: number
): Promise<number[][]> {
  const result: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = buffer[idx];
      const g = buffer[idx + 1];
      const b = buffer[idx + 2];
      // Standard luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      row.push(gray);
    }
    result.push(row);
  }

  return result;
}

/**
 * Compute 2D FFT of grayscale image data
 * Returns complex spectrum with DC shifted to center
 */
export function compute2DFFT(data: number[][]): number[][] {
  const height = data.length;
  const width = data[0].length;

  // Ensure power of 2
  if ((width & (width - 1)) !== 0 || (height & (height - 1)) !== 0) {
    throw new Error("Image dimensions must be powers of 2");
  }

  // Create FFT instances
  const fftRow = new FFT(width);
  const fftCol = new FFT(height);

  // Step 1: FFT each row
  const rowTransformed: number[][][] = [];
  for (let y = 0; y < height; y++) {
    const input = fftRow.toComplexArray(data[y]);
    const output = fftRow.createComplexArray();
    fftRow.transform(output, input);
    // Store as [real, imag] pairs
    const complexRow: number[][] = [];
    for (let x = 0; x < width; x++) {
      complexRow.push([output[x * 2], output[x * 2 + 1]]);
    }
    rowTransformed.push(complexRow);
  }

  // Step 2: FFT each column
  const spectrum: number[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

  for (let x = 0; x < width; x++) {
    // Extract column
    const colReal: number[] = [];
    const colImag: number[] = [];
    for (let y = 0; y < height; y++) {
      colReal.push(rowTransformed[y][x][0]);
      colImag.push(rowTransformed[y][x][1]);
    }

    // Create complex input for column
    const colInput: number[] = [];
    for (let y = 0; y < height; y++) {
      colInput.push(colReal[y], colImag[y]);
    }

    const colOutput = fftCol.createComplexArray();
    fftCol.transform(colOutput, colInput);

    // Store magnitude
    for (let y = 0; y < height; y++) {
      const real = colOutput[y * 2];
      const imag = colOutput[y * 2 + 1];
      spectrum[y][x] = Math.sqrt(real * real + imag * imag);
    }
  }

  // Shift DC to center (fftshift)
  const shifted = fftShift(spectrum);

  return shifted;
}

/**
 * Shift zero-frequency component to center of spectrum
 */
function fftShift(spectrum: number[][]): number[][] {
  const height = spectrum.length;
  const width = spectrum[0].length;
  const halfH = Math.floor(height / 2);
  const halfW = Math.floor(width / 2);

  const shifted: number[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const newY = (y + halfH) % height;
      const newX = (x + halfW) % width;
      shifted[newY][newX] = spectrum[y][x];
    }
  }

  return shifted;
}

/**
 * Compute normalized magnitude spectrum (0-1 range)
 */
export function computeMagnitudeSpectrum(spectrum: number[][]): number[][] {
  const height = spectrum.length;
  const width = spectrum[0].length;

  // Apply log scale for better visualization
  const logSpectrum: number[][] = spectrum.map((row) =>
    row.map((val) => Math.log1p(val))
  );

  // Find max value for normalization
  let maxVal = 0;
  for (const row of logSpectrum) {
    for (const val of row) {
      if (val > maxVal) maxVal = val;
    }
  }

  // Normalize to 0-1
  if (maxVal === 0) {
    return logSpectrum; // Avoid division by zero
  }

  return logSpectrum.map((row) => row.map((val) => val / maxVal));
}

/**
 * Detect GAN upsampling artifacts (periodic peaks in spectrum)
 */
function detectGANArtifacts(magnitude: number[][]): {
  detected: boolean;
  confidence: number;
  evidence: string[];
} {
  const height = magnitude.length;
  const width = magnitude[0].length;
  const centerY = Math.floor(height / 2);
  const centerX = Math.floor(width / 2);

  const evidence: string[] = [];
  let peakCount = 0;

  // Look for periodic peaks (characteristic of GAN upsampling)
  // Check for peaks at regular intervals from center
  const checkDistances = [width / 4, width / 8, width / 16];

  for (const dist of checkDistances) {
    // Check horizontal and vertical axes
    const positions = [
      [centerY, centerX + dist],
      [centerY, centerX - dist],
      [centerY + dist, centerX],
      [centerY - dist, centerX],
    ];

    for (const [y, x] of positions) {
      const iy = Math.round(y);
      const ix = Math.round(x);
      if (iy >= 0 && iy < height && ix >= 0 && ix < width) {
        // Check if this position has a significant peak
        // Compare with local average to detect true peaks
        const val = magnitude[iy][ix];

        // Calculate local average in surrounding area
        let localSum = 0;
        let localCount = 0;
        const windowSize = 3;
        for (let dy = -windowSize; dy <= windowSize; dy++) {
          for (let dx = -windowSize; dx <= windowSize; dx++) {
            const ny = iy + dy;
            const nx = ix + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              localSum += magnitude[ny][nx];
              localCount++;
            }
          }
        }
        const localAvg = localSum / localCount;

        // Peak must be significantly above local average AND have high absolute value
        if (val > 0.5 && val > localAvg * 1.5) {
          peakCount++;
        }
      }
    }
  }

  // GAN images typically show 4+ periodic peaks
  const detected = peakCount >= 6;
  const confidence = Math.min(peakCount * 10, 100);

  if (peakCount > 0) {
    evidence.push(`Detected ${peakCount} periodic peaks in frequency spectrum`);
  }
  if (detected) {
    evidence.push("Pattern consistent with GAN upsampling artifacts");
  }

  return { detected, confidence, evidence };
}

/**
 * Detect Diffusion model artifacts (high-frequency characteristics)
 */
function detectDiffusionArtifacts(magnitude: number[][]): {
  detected: boolean;
  confidence: number;
  evidence: string[];
} {
  const height = magnitude.length;
  const width = magnitude[0].length;
  const centerY = Math.floor(height / 2);
  const centerX = Math.floor(width / 2);

  const evidence: string[] = [];

  // Analyze high-frequency energy distribution
  let highFreqEnergy = 0;
  let totalEnergy = 0;
  const highFreqThreshold = Math.min(width, height) * 0.3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt(
        Math.pow(y - centerY, 2) + Math.pow(x - centerX, 2)
      );
      const energy = magnitude[y][x];
      totalEnergy += energy;

      if (dist > highFreqThreshold) {
        highFreqEnergy += energy;
      }
    }
  }

  const highFreqRatio = totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;

  // Diffusion models tend to have unusual high-frequency distribution
  // Natural images typically have most energy in low frequencies
  const detected = highFreqRatio > 0.15;
  const confidence = Math.min(highFreqRatio * 300, 100);

  if (highFreqRatio > 0.1) {
    evidence.push(
      `High-frequency energy ratio: ${(highFreqRatio * 100).toFixed(1)}%`
    );
  }
  if (detected) {
    evidence.push("High-frequency distribution anomaly detected");
  }

  return { detected, confidence, evidence };
}

/**
 * Analyze radial energy distribution
 */
function analyzeRadialEnergy(magnitude: number[][]): {
  isNatural: boolean;
  confidence: number;
} {
  const height = magnitude.length;
  const width = magnitude[0].length;
  const centerY = Math.floor(height / 2);
  const centerX = Math.floor(width / 2);
  const maxRadius = Math.min(width, height) / 2;

  // Calculate radial energy profile
  const numBins = 32;
  const binEnergy: number[] = Array(numBins).fill(0);
  const binCount: number[] = Array(numBins).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt(
        Math.pow(y - centerY, 2) + Math.pow(x - centerX, 2)
      );
      const bin = Math.min(
        Math.floor((dist / maxRadius) * numBins),
        numBins - 1
      );
      binEnergy[bin] += magnitude[y][x];
      binCount[bin]++;
    }
  }

  // Normalize by bin count
  const profile = binEnergy.map((e, i) => (binCount[i] > 0 ? e / binCount[i] : 0));

  // Natural images follow roughly 1/f distribution
  // Check if energy decreases smoothly from center
  let monotonicallyDecreasing = 0;
  for (let i = 1; i < profile.length; i++) {
    if (profile[i] <= profile[i - 1]) {
      monotonicallyDecreasing++;
    }
  }

  const smoothnessRatio = monotonicallyDecreasing / (profile.length - 1);
  const isNatural = smoothnessRatio > 0.6;
  const confidence = smoothnessRatio * 100;

  return { isNatural, confidence };
}

/**
 * Detect UI pattern artifacts (horizontal/vertical lines from UI elements)
 * UI elements create strong horizontal and vertical frequency components
 */
function detectUIPatternArtifacts(magnitude: number[][]): {
  hasUIPatterns: boolean;
  confidence: number;
  evidence: string[];
} {
  const height = magnitude.length;
  const width = magnitude[0].length;
  const centerY = Math.floor(height / 2);
  const centerX = Math.floor(width / 2);

  const evidence: string[] = [];

  // UI elements create strong horizontal/vertical lines in frequency domain
  // Measure energy along horizontal and vertical axes (excluding DC component)

  let horizontalEnergy = 0;
  let verticalEnergy = 0;
  let totalEnergy = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const energy = magnitude[y][x];
      totalEnergy += energy;

      // Horizontal axis (y = centerY)
      if (y === centerY && x !== centerX) {
        horizontalEnergy += energy;
      }
      // Vertical axis (x = centerX)
      if (x === centerX && y !== centerY) {
        verticalEnergy += energy;
      }
    }
  }

  // Calculate the ratio of axis energy to total energy
  const axisEnergy = horizontalEnergy + verticalEnergy;
  const axisRatio = totalEnergy > 0 ? axisEnergy / totalEnergy : 0;

  // UI elements typically have 15%+ of energy on horizontal/vertical axes
  const hasUIPatterns = axisRatio > 0.12;
  const confidence = Math.min(axisRatio * 500, 100);

  if (axisRatio > 0.08) {
    evidence.push(`수평/수직 주파수 에너지 비율: ${(axisRatio * 100).toFixed(1)}%`);
  }
  if (hasUIPatterns) {
    evidence.push("UI 요소 특성의 주파수 패턴 감지됨");
  }

  return { hasUIPatterns, confidence, evidence };
}

/**
 * Main function: Analyze frequency characteristics of magnitude spectrum
 */
export function analyzeFrequency(
  magnitude: number[][],
  isScreenshotLikely: boolean = false
): FrequencyAnalysis {
  const ganResult = detectGANArtifacts(magnitude);
  const diffusionResult = detectDiffusionArtifacts(magnitude);
  const radialResult = analyzeRadialEnergy(magnitude);
  const uiResult = detectUIPatternArtifacts(magnitude);

  // Calculate overall AI confidence
  // Higher confidence if any synthetic fingerprint detected
  let maxSyntheticConfidence = Math.max(
    ganResult.confidence,
    diffusionResult.confidence
  );

  // Adjust based on radial energy (natural patterns reduce confidence)
  const naturalPenalty = radialResult.isNatural ? 20 : 0;

  // Adjust based on UI patterns (UI patterns indicate screenshot, not AI)
  const uiPenalty = uiResult.hasUIPatterns ? uiResult.confidence * 0.5 : 0;

  // Apply screenshot penalty if indicated
  const screenshotPenalty = isScreenshotLikely ? 30 : 0;

  let overallConfidence = Math.max(
    0,
    maxSyntheticConfidence - naturalPenalty - uiPenalty - screenshotPenalty
  );

  // Update evidence with UI detection info
  if (uiResult.hasUIPatterns) {
    ganResult.evidence.push(...uiResult.evidence);
    diffusionResult.evidence.push("UI 패턴으로 인해 신뢰도 감소");
  }

  return {
    analyzed: true,
    ganFingerprint: ganResult,
    diffusionFingerprint: diffusionResult,
    radialEnergy: radialResult,
    overallConfidence,
  };
}

/**
 * Find the nearest power of 2 that is <= n
 */
function nearestPowerOf2(n: number): number {
  return Math.pow(2, Math.floor(Math.log2(n)));
}

/**
 * Options for frequency analysis
 */
export interface FrequencyAnalysisOptions {
  mimeType?: string;
  isScreenshotLikely?: boolean;
}

/**
 * Analyze frequency characteristics of an image buffer
 * High-level function that handles the entire pipeline:
 * 1. Convert image to grayscale
 * 2. Resize to power-of-2 dimensions for FFT
 * 3. Compute 2D FFT and magnitude spectrum
 * 4. Analyze for AI generation artifacts
 * 5. Apply format-specific adjustments
 */
export async function analyzeImageFrequency(
  buffer: ArrayBuffer,
  options?: FrequencyAnalysisOptions
): Promise<FrequencyAnalysis> {
  try {
    // Use sharp to get image metadata and raw grayscale data
    const image = sharp(Buffer.from(buffer));
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return createEmptyResult();
    }

    // Determine analysis size (power of 2, max 256 for performance)
    const targetSize = Math.min(
      256,
      nearestPowerOf2(Math.min(metadata.width, metadata.height))
    );

    // Ensure we have at least 32x32 for meaningful analysis
    if (targetSize < 32) {
      return createEmptyResult();
    }

    // Resize and convert to grayscale
    const grayscaleBuffer = await image
      .resize(targetSize, targetSize, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();

    // Convert to 2D array
    const data: number[][] = [];
    for (let y = 0; y < targetSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < targetSize; x++) {
        row.push(grayscaleBuffer[y * targetSize + x]);
      }
      data.push(row);
    }

    // Compute FFT and analyze
    const spectrum = compute2DFFT(data);
    const magnitude = computeMagnitudeSpectrum(spectrum);

    // Check if this is likely a screenshot based on format
    const isPNG = options?.mimeType?.includes("png") || metadata.format === "png";
    const isScreenshotLikely = options?.isScreenshotLikely || isPNG;

    // Run analysis with screenshot awareness
    const result = analyzeFrequency(magnitude, isScreenshotLikely);

    // Apply additional PNG format penalty (screenshots are often PNG)
    if (isPNG && result.overallConfidence > 0) {
      result.overallConfidence = Math.max(0, result.overallConfidence * 0.7);
      result.ganFingerprint.evidence.push("PNG 형식 - 스크린샷 가능성 고려됨");
    }

    return result;
  } catch (error) {
    console.error("Frequency analysis error:", error);
    return createEmptyResult();
  }
}

/**
 * Create an empty/default frequency analysis result
 */
function createEmptyResult(): FrequencyAnalysis {
  return {
    analyzed: false,
    ganFingerprint: { detected: false, confidence: 0, evidence: [] },
    diffusionFingerprint: { detected: false, confidence: 0, evidence: [] },
    radialEnergy: { isNatural: true, confidence: 50 },
    overallConfidence: 0,
  };
}
