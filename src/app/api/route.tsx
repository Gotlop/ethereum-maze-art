/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { isAddress, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const runtime = "edge";

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
    const searchParams = new URLSearchParams(request.url?.split("?")[1]);
    const { address, data } = Object.fromEntries(
      searchParams.entries()
    ) as BaseParams;

    // Validate Ethereum address
    if (!address || !isAddress(address)) {
      return NextResponse.json(
        { error: "Valid Ethereum address is required" },
        { status: 400 }
      );
    }

    // Fetch Ethereum transaction count for the given address
    const transactionCount = await client.getTransactionCount({
      address,
    });

    // Use the transaction count to influence art generation
    const addressHash = hashCode(address);
    const dataHash = data ? hashCode(data) : 0;

    const width = 420;
    const height = 420;
    const cellSize = 30;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    const colorScheme = generateColorScheme(
      addressHash,
      dataHash,
      transactionCount
    );

    const maze = generateMaze(cols, rows, address + (data || ""), {
      branchingFactor: (Math.abs(addressHash) % 3) + 1,
      deadEndRemovalRate: (Math.abs(dataHash) % 50) / 100,
    });

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "#eff0f3",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: `${width}px`,
              height: `${height}px`,
              background: "#eff0f3",
            }}
          >
            {maze.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isWall = cell === 1;
                const distanceFromCenter = Math.sqrt(
                  Math.pow(rowIndex - rows / 2, 2) +
                    Math.pow(colIndex - cols / 2, 2)
                );
                const gradientColor = isWall ? "#0052ff" : "#eff0f3";

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    style={{
                      position: "absolute",
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      background: gradientColor,
                      top: `${rowIndex * cellSize}px`,
                      left: `${colIndex * cellSize}px`,
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
    console.error("Error generating maze image:", error);
    return NextResponse.json(
      { error: "Failed to generate maze image" },
      { status: 500 }
    );
  }
}

function generateColorScheme(
  addressHash: number,
  dataHash: number,
  transactionCount: number
) {
  return {
    walls: ["#0052ff", "#0052ff", "#0052ff", "#0052ff"],
  };
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

function generateMaze(
  cols: number,
  rows: number,
  seed: string,
  options: {
    branchingFactor: number;
    deadEndRemovalRate: number;
  }
) {
  const seededRandom = () => {
    const x = Math.sin(hashCode(seed)) * 10000;
    return x - Math.floor(x);
  };

  const maze = Array.from({ length: rows }, () => Array(cols).fill(1));
  const stack: [number, number][] = [];
  const start: [number, number] = [1, 1];

  function isValid(x: number, y: number) {
    return x > 0 && x < rows - 1 && y > 0 && y < cols - 1;
  }

  function getUnvisitedNeighbors(x: number, y: number) {
    const directions = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ];

    if (options.branchingFactor > 1) {
      directions.push([-2, -2], [-2, 2], [2, -2], [2, 2]);
    }

    return directions
      .map(([dx, dy]) => [x + dx, y + dy])
      .filter(([nx, ny]) => isValid(nx, ny) && maze[nx][ny] === 1)
      .sort(() => seededRandom() - 0.5);
  }

  maze[start[0]][start[1]] = 0;
  stack.push(start);

  while (stack.length > 0) {
    const [currentX, currentY] = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(currentX, currentY);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const pathCount = Math.min(neighbors.length, options.branchingFactor);
    for (let i = 0; i < pathCount; i++) {
      const [nextX, nextY] = neighbors[i];
      maze[nextX][nextY] = 0;
      maze[currentX + (nextX - currentX) / 2][
        currentY + (nextY - currentY) / 2
      ] = 0;
      if (i === 0) stack.push([nextX, nextY]);
    }
  }

  if (options.deadEndRemovalRate > 0) {
    for (let i = 1; i < rows - 1; i++) {
      for (let j = 1; j < cols - 1; j++) {
        if (maze[i][j] === 0 && seededRandom() < options.deadEndRemovalRate) {
          let wallCount = 0;
          if (maze[i - 1][j] === 1) wallCount++;
          if (maze[i + 1][j] === 1) wallCount++;
          if (maze[i][j - 1] === 1) wallCount++;
          if (maze[i][j + 1] === 1) wallCount++;
          if (wallCount >= 3) maze[i][j] = 1;
        }
      }
    }
  }

  const entranceExit = [
    [0, 1],
    [1, 1],
    [1, 0],
    [rows - 1, cols - 2],
    [rows - 2, cols - 2],
    [rows - 2, cols - 1],
  ];

  entranceExit.forEach(([x, y]) => {
    if (isValid(x, y)) maze[x][y] = 0;
  });

  return maze;
}
