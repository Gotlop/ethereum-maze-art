/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';

export const runtime = 'edge';

type BaseParams = {
  address: `0x${string}`;
  data?: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address') as `0x${string}` | null;
    const data = searchParams.get('data') ?? '';

    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
    }

    const seed = hashCode(address + data);
    const width = 420;
    const height = 420;
    const cellSize = 30;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    const blocks = generate3DBlocks(cols, rows, seed);

    return new ImageResponse(
      (
        <div
          style={{
            width,
            height,
            background: '#002244',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {blocks.map(({ x, y, color, shadow }, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x * cellSize,
                top: y * cellSize,
                width: cellSize,
                height: cellSize,
                background: color,
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: `
                  2px 2px 0 ${shadow},
                  0 0 4px ${color},
                  0 0 8px ${color},
                  0 0 12px ${color}
                `,
              }}
            />
          ))}
        </div>
      ),
      { width, height }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (const ch of str) hash = (hash << 5) - hash + ch.charCodeAt(0), hash |= 0;
  return Math.abs(hash);
}

function generate3DBlocks(cols: number, rows: number, seed: number) {
  const retroColors = [
    '#ff6ec7', '#faff00', '#00ffd8', '#ff8c00',
    '#8aff00', '#ff61a6', '#a070ff', '#00a2ff',
  ];

  const blocks: { x: number; y: number; color: string; shadow: string }[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const hash = Math.sin((x * 9283 + y * 3851 + seed) * 0.5) * 10000;
      const value = hash % 1;
      if (value > 0.5) {
        const colorIndex = Math.floor(Math.abs(hash * 7)) % retroColors.length;
        const base = retroColors[colorIndex];
        const shadow = shadeColor(base, -40);
        blocks.push({ x, y, color: base, shadow });
      }
    }
  }

  return blocks;
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (Math.min(255, Math.max(0, R)) << 16) +
      (Math.min(255, Math.max(0, G)) << 8) +
      Math.min(255, Math.max(0, B))
    )
      .toString(16)
      .slice(1)
  );
}
