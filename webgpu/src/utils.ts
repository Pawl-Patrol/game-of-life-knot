import { Vec2, Vec3 } from "wgpu-matrix";

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) throw new Error(msg);
}

export function fetchBitmaps(...imageUrls: string[]) {
  return Promise.all(
    imageUrls.map(async (url) => {
      const response = await fetch(url);
      return createImageBitmap(await response.blob());
    })
  );
}

export function first<T>(iterable: Iterable<T>) {
  for (const x of iterable) return x;
}

export function hsl2rgb(h: number, s: number, l: number) {
  let a = s * Math.min(l, 1 - l);
  let f = (n: number, k = (n + h / 30) % 12) =>
    l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
}

export function generateVertices(
  f: (_: Vec2) => Vec3,
  width: number,
  height: number
) {
  // bl, tl, br, tr, color
  const result = new Float32Array(width * height * 15);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const left = x / width;
      const right = (x + 1) / width;
      const top = y / height;
      const bottom = (y + 1) / height;

      const color = hsl2rgb(left * 360, 1, 0.5);

      const i = (x + y * width) * 15;
      result.set(color, i);
      result.set(f([left, bottom]), i + 3);
      result.set(f([left, top]), i + 6);
      result.set(f([right, bottom]), i + 9);
      result.set(f([right, top]), i + 12);
    }
  }
  return result;
}
