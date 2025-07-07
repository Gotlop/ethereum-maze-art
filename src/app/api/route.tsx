import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { isAddress } from "viem";

export const runtime = "edge";

// 🎨 Vaporwave palette
const colors = ["#FF77FF", "#00E8F8", "#F9F871", "#FFD6E8"];

const width = 420;
const height = 800;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !isAddress(address)) {
    return new ImageResponse(<div>Invalid address</div>, {
      width,
      height,
    });
  }

  const stack = generateZugzwangStack(address, 20);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column-reverse" }}>
          {stack.map((row, i) => (
            <div key={i} style={{ display: "flex", margin: "2px 0" }}>
              {row.map((color, j) => (
                <div
                  key={j}
                  style={{
                    width: 36,
                    height: 20,
                    background: color
                      ? `linear-gradient(to bottom right, ${color}, #222)`
                      : "transparent",
                    transform: "skewY(-12deg) skewX(-12deg)",
                    boxShadow: color
                      ? "2px 2px 4px rgba(0, 0, 0, 0.3)"
                      : undefined,
                    margin: "0 4px",
                    border: color ? "1px solid #000" : "1px dashed #333",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}

function generateZugzwangStack(address: string, levels: number = 20) {
  const seed = hashCode(address);
  const rng = mulberry32(seed);
  const stack = [];

  for (let i = 0; i < levels; i++) {
    const missingIndex = Math.floor(rng() * 3);
    const row = [];
    for (let j = 0; j < 3; j++) {
      if (j === missingIndex) {
        row.push(null);
      } else {
        const color = colors[Math.floor(rng() * colors.length)];
        row.push(color);
      }
    }
    stack.push(row);
  }

  return stack;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
