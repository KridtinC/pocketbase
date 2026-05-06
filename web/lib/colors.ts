import sharp from "sharp";

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
  const dark = adjustBrightness(hex, -65);
  return `linear-gradient(145deg, ${light} 0%, ${dark} 100%)`;
}

/**
 * Fetch a PNG sprite and return the saturation-weighted dominant color as a
 * hex string. Transparent pixels are skipped so the pokemon's body color wins
 * over the transparent background.
 */
export async function extractSpriteColor(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());

    const { data } = await sharp(buf)
      .resize(24, 24, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let totalR = 0, totalG = 0, totalB = 0, totalW = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 120) continue; // skip transparent / semi-transparent pixels
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      // Saturation-based weight so vivid body colors dominate over pale shadows
      const sat = max === 0 ? 0 : (max - min) / max;
      const w = sat * 0.9 + 0.1;
      totalR += r * w;
      totalG += g * w;
      totalB += b * w;
      totalW += w;
    }

    if (totalW === 0) return null;
    const r = Math.round(totalR / totalW);
    const g = Math.round(totalG / totalW);
    const b = Math.round(totalB / totalW);
    return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
  } catch {
    return null;
  }
}
