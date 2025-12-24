declare module "exif-parser" {
  interface ExifTags {
    Make?: string;
    Model?: string;
    Software?: string;
    DateTimeOriginal?: number;
    CreateDate?: number;
    GPSLatitude?: number;
    GPSLongitude?: number;
    [key: string]: unknown;
  }

  interface ImageSize {
    width?: number;
    height?: number;
  }

  interface ExifResult {
    tags: ExifTags;
    imageSize?: ImageSize;
  }

  interface ExifParser {
    parse(): ExifResult;
  }

  function create(buffer: Buffer): ExifParser;

  export = { create };
}
