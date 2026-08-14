/** Test-fixture PNG helpers, built on the shared encoder in src/lib/ocr/png-codec.ts. */
import { encodeRgbPng } from "@/lib/ocr/png-codec";

/** A solid-color, noise-free raster image of the given size. */
export function makeSolidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 3] = rgb[0];
    pixels[i * 3 + 1] = rgb[1];
    pixels[i * 3 + 2] = rgb[2];
  }
  return encodeRgbPng(width, height, pixels);
}
