import { deflateSync } from "node:zlib";

/**
 * Minimal PNG encoder (8-bit RGB, filter-type-none, one IDAT chunk) — just
 * enough to hand a decoded raw-pixel image to an external OCR binary.
 *
 * No `server-only` guard here (unlike its caller, `extract-page-image.ts`):
 * this module's only production import already carries that guard, and it's
 * also imported directly by test fixtures (which build synthetic PDFs with
 * embedded images) running under Node outside Next.js's bundler — where the
 * `server-only` package's own marker throws unconditionally, not just on a
 * real client-bundle inclusion.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Encodes raw, unfiltered top-to-bottom RGB pixel data (3 bytes/pixel, no row padding) as a standard PNG file. */
export function encodeRgbPng(width: number, height: number, rgb: Buffer): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filter type: none
    rgb.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3);
  }
  const idatData = deflateSync(raw);

  return Buffer.concat([signature, chunk("IHDR", ihdrData), chunk("IDAT", idatData), chunk("IEND", Buffer.alloc(0))]);
}
