import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Tech Blog";
  const description = searchParams.get("description") ?? "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
        color: "#ededed",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 20,
          color: "#3b82f6",
          fontWeight: 700,
          marginBottom: 16,
          letterSpacing: "0.05em",
        }}
      >
        TECH BLOG
      </div>
      <div
        style={{
          fontSize: title.length > 40 ? 40 : 52,
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: "-0.03em",
          marginBottom: 20,
          maxWidth: "90%",
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 22,
            color: "#a1a1aa",
            lineHeight: 1.5,
            maxWidth: "80%",
          }}
        >
          {description.slice(0, 120)}
        </div>
      )}
    </div>,
    { width: 1200, height: 630 }
  );
}
