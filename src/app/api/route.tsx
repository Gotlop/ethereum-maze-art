/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { isAddress } from "viem";

export const runtime = "edge";

const colors = ["#F94144", "#F9C74F", "#90BE6D", "#577590"];
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
          background: "#111",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          fontFamily: "monospace",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 20 }}>Zugzwang Stack</div>
        <div style={{ display: "flex", flexDirection: "column-reverse" }}>
          {stack.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                margin: "1px 0",
              }}
            >
              {row.map((color, j) => (
                <div
                  key={j}
                  style={{
                    width: 40,
                    height: 20,
                    background: color || "transparent",
                    margin: "0 4px",
                    border: color ? "1px solid #222" : "1px dashed #333",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 16, marginTop: 20, opacity: 0.7 }}>
          {shortenAddress(address)}
        </div>
      </div>
    ),
    { width, height }
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

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
