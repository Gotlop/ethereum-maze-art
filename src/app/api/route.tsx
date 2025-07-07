/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { isAddress, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export const runtime = 'edge';

type BaseParams = {
  address: `0x${string}`;
  data?: string;
};

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URLSearchParams(request.url?.split('?')[1]);
    const { address, data } = Object.fromEntries(
      searchParams.entries()
    ) as BaseParams;

    if (!address || !isAddress(address)) {
      return NextResponse.json(
        { error: 'Valid Ethereum address is required' },
        { status: 400 }
      );
    }

    const transactionCount = await client.getTransactionCount({ address });

    const addressHash = hashCode(address);
    const dataHash = data ? hashCode(data) : 0;

    const width = 420;
    const height = 420;
    const cellSize = 30;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    const maze = generateEmptyMaze(cols, rows);
    applyRetroJengaPattern(maze, hashCode(address + (data || '')));

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: '#0d0d0d',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'relative',
              width: `${width}px`,
              height: `${height}px`,
              background: '#0d0d0d',
            }}
          >
            {maze.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isWall = cell === 1;
                const fillColor = getRetroColor(rowIndex, colIndex, addressHash);
                const borderColor = isWall ? '#1a1a1a' : '#333333';
                const boxShadow = isWall
                  ? 'inset 0 0 6px rgba(0,0,0,0.6)'
                  : 'inset 0 0 2px rgba(255,255,255,0.2)';

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    style={{
                      position: 'absolute',
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      background: fillColor,
                      top: `${rowIndex * cellSize}px`,
                      left: `${colIndex * cellSize}px`,
                      border: `1px solid ${borderColor}`,
                      boxShadow,
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

function generateEmptyMaze(cols: number, rows: number) {
  return Array.from({ length: rows }, () => Array(cols).fill(1));
}

function applyRetroJengaPattern(maze: number[][], seed: number) {
  const rows = maze.length;
  const cols = maze[0].length;

  for (let row = 0; row < rows; row++) {
    const isHorizontal = row % 2 === 0;

    for (let col = 0; col < cols; col++) {
      maze[row][col] = 1; // default wall
    }

    if (isHorizontal) {
      // Buat blok Jenga horizontal
      for (let col = (row + seed) % 3; col < cols - 2; col += 4) {
        maze[row][col] = 0;
        maze[row][col + 1] = 0;
        maze[row][col + 2] = 0;
      }
    }
  }
}

function getRetroColor(x: number, y: number, seed: number) {
  const retroColors = [
    '#ff6ec7', // pink neon
    '#faff00', // yellow electric
    '#00ffd8', // cyan
    '#ff8c00', // orange retro
    '#8aff00', // lime green
    '#ff61a6', // hot pink
    '#a070ff', // purple retro
    '#00a2ff', // sky blue
  ];
  const index = Math.abs((x * 31 + y * 17 + seed) % retroColors.length);
  return retroColors[index];
}
