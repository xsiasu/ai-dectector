declare module "fft.js" {
  export default class FFT {
    constructor(size: number);
    size: number;

    /**
     * Create a complex array for FFT input/output
     */
    createComplexArray(): number[];

    /**
     * Convert real data to complex format
     */
    toComplexArray(input: number[], storage?: number[]): number[];

    /**
     * Convert complex data back to real format
     */
    fromComplexArray(complex: number[], storage?: number[]): number[];

    /**
     * Perform forward FFT transform
     */
    transform(output: number[], input: number[]): void;

    /**
     * Perform real-valued FFT (25% faster for real data)
     */
    realTransform(output: number[], input: number[]): void;

    /**
     * Complete the spectrum for real FFT
     */
    completeSpectrum(spectrum: number[]): void;

    /**
     * Perform inverse FFT transform
     */
    inverseTransform(output: number[], input: number[]): void;
  }
}
