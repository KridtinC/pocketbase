// Pure-JS PNG color extractor — no native dependencies.
// Uses only Web APIs (fetch, DecompressionStream, Uint8Array) so it works on
// Node.js 18+, Cloudflare Workers/Pages Edge runtime, and Vercel Edge.

function hexByte(n: number): string {
  return Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, "0");
}

function adjustBrightness(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16) + amount;
  const g = parseInt(hex.slice(3, 5), 16) + amount;
  const b = parseInt(hex.slice(5, 7), 16) + amount;
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}

export function hexToGradient(hex: string): string {
  const light = adjustBrightness(hex, 35);
  const dark  = adjustBrightness(hex, -65);
  return `linear-gradient(145deg, ${light} 0%, ${dark} 100%)`;
}

function paethPredictor(a: number, b: number, c: number): number {
  const p  = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Fetch a PNG sprite and return the saturation-weighted dominant colour as a
 * hex string. Transparent pixels are skipped so the Pokémon's body colour wins
 * over the transparent background.
 *
 * Supports 8-bit RGBA (colour type 6) and RGB (colour type 2) PNGs — the two
 * formats PokéAPI uses for official artwork.
 */
export async function extractSpriteColor(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = new Uint8Array(await res.arrayBuffer());

    // ── 1. Validate PNG signature ──────────────────────────────────────────
    const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (raw[i] !== SIG[i]) return null;

    // ── 2. Parse chunks ────────────────────────────────────────────────────
    let width = 0, height = 0, colorType = 0, bitDepth = 0;
    const idatParts: Uint8Array[] = [];
    let pos = 8;

    while (pos + 12 <= raw.length) {
      const len  = ((raw[pos] << 24) | (raw[pos+1] << 16) | (raw[pos+2] << 8) | raw[pos+3]) >>> 0;
      const type = String.fromCharCode(raw[pos+4], raw[pos+5], raw[pos+6], raw[pos+7]);
      const data = raw.subarray(pos + 8, pos + 8 + len);

      if (type === "IHDR") {
        width     = ((data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3]) >>> 0;
        height    = ((data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7]) >>> 0;
        bitDepth  = data[8];
        colorType = data[9];
      } else if (type === "IDAT") {
        idatParts.push(data.slice());
      } else if (type === "IEND") {
        break;
      }
      pos += 12 + len;
    }

    // Only handle 8-bit RGBA (6) or RGB (2)
    if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) return null;
    if (width === 0 || height === 0) return null;

    // ── 3. Concatenate IDAT and decompress (PNG uses zlib = deflate+header) ─
    const totalLen = idatParts.reduce((s, p) => s + p.length, 0);
    const idat = new Uint8Array(totalLen);
    let off = 0;
    for (const p of idatParts) { idat.set(p, off); off += p.length; }

    const ds     = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(idat);
    writer.close();

    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const dLen = chunks.reduce((s, p) => s + p.length, 0);
    const dBuf = new Uint8Array(dLen);
    off = 0;
    for (const p of chunks) { dBuf.set(p, off); off += p.length; }

    // ── 4. Reconstruct pixels by reversing PNG row filters ─────────────────
    const ch       = colorType === 6 ? 4 : 3;
    const rowBytes = width * ch;
    const pixels   = new Uint8Array(width * height * ch);

    for (let y = 0; y < height; y++) {
      const filterType = dBuf[y * (rowBytes + 1)];
      const srcOff     = y * (rowBytes + 1) + 1;
      const dstOff     = y * rowBytes;
      const prevOff    = y > 0 ? (y - 1) * rowBytes : -1;

      for (let x = 0; x < rowBytes; x++) {
        const rv = dBuf[srcOff + x];
        const a  = x >= ch          ? pixels[dstOff  + x - ch] : 0;
        const b  = prevOff >= 0     ? pixels[prevOff + x]      : 0;
        const c  = (x >= ch && prevOff >= 0) ? pixels[prevOff + x - ch] : 0;

        let val: number;
        if      (filterType === 0) val = rv;
        else if (filterType === 1) val = (rv + a) & 0xFF;
        else if (filterType === 2) val = (rv + b) & 0xFF;
        else if (filterType === 3) val = (rv + Math.floor((a + b) / 2)) & 0xFF;
        else if (filterType === 4) val = (rv + paethPredictor(a, b, c))  & 0xFF;
        else                       val = rv;

        pixels[dstOff + x] = val;
      }
    }

    // ── 5. Saturation-weighted dominant colour ─────────────────────────────
    let totalR = 0, totalG = 0, totalB = 0, totalW = 0;
    for (let i = 0; i < pixels.length; i += ch) {
      if (ch === 4 && pixels[i + 3] < 120) continue; // skip transparent
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const w   = sat * 0.9 + 0.1;
      totalR += r * w; totalG += g * w; totalB += b * w; totalW += w;
    }

    if (totalW === 0) return null;
    return `#${hexByte(Math.round(totalR / totalW))}${hexByte(Math.round(totalG / totalW))}${hexByte(Math.round(totalB / totalW))}`;
  } catch {
    return null;
  }
}
