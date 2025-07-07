/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';

export const runtime = 'edge';

type BaseParams = { address: `0x${string}`; data?: string };

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const address = params.get('address') as BaseParams['address'];
    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const seed = hashCode(address);
    const width = 420, height = 420;
    const cellSize = 10;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    const squiggle = generateSquigglePath(rows, cols, seed);

    return new ImageResponse(
      <div
        style={{
          width,
          height,
          background: '#000',
          position: 'relative',
        }}
      >
        {squiggle.map(({ x, y, color }, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x * cellSize,
              top: y * cellSize,
              width: cellSize,
              height: cellSize,
              background: color,
            }}
          />
        ))}
      </div>,
      { width, height }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateSquigglePath(rows: number, cols: number, seed: number) {
  const rng = (x: number, y: number) =>
    (Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453) % 1;

  const path: { x: number; y: number; color: string }[] = [];
  let r = Math.floor(rows / 2), c = 0;

  for (let i = 0; i < cols * 2; i++) {
    const dir = rng(r, c) < 0.5 ? 1 : -1;
    c = Math.min(cols - 1, Math.max(0, c + 1));
    r = Math.min(rows - 1, Math.max(0, r + dir));
    const t = rng(r, c);
    const hue = (t * 360 + seed) % 360;
    const color = `hsl(${hue}, ${70 + 20 * t}%, ${50 + 10 * Math.sin(seed + i)}%)`;
    path.push({ x: c, y: r, color });
  }

  return path;
}
