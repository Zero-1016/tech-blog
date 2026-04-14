import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { posts } from "#site/content";
import { buildBannerSpec, seededRandom } from "@/lib/banner/spec";

export const runtime = "nodejs";

export async function generateStaticParams() {
  return posts.filter((p) => p.published).map((p) => ({ slug: p.slug }));
}

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return new Response("Not found", { status: 404 });

  const spec = buildBannerSpec({
    title: post.title,
    slug: post.slug,
    tags: post.tags,
    series: post.series,
  });

  const motifPath = path.join(process.cwd(), "public", "banners", "motifs", `${spec.motif}.svg`);
  let motifDataUrl: string | undefined;
  try {
    const buf = await readFile(motifPath);
    motifDataUrl = `data:image/svg+xml;base64,${buf.toString("base64")}`;
  } catch {
    motifDataUrl = undefined;
  }

  const rand = seededRandom(spec.seed);
  const dots = Array.from({ length: 14 }, () => ({
    x: rand() * 1200,
    y: rand() * 630,
    r: 2 + rand() * 4,
    op: 0.15 + rand() * 0.3,
  }));
  const { palette } = spec;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bgAccent} 100%)`,
        color: palette.text,
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: d.y,
            width: d.r * 2,
            height: d.r * 2,
            borderRadius: "50%",
            background: i % 3 === 0 ? palette.accent : palette.primary,
            opacity: d.op,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          right: -120,
          top: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: palette.primary,
          opacity: 0.08,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: -80,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: palette.accent,
          opacity: 0.1,
        }}
      />
      {motifDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={motifDataUrl}
          alt=""
          width={360}
          height={360}
          style={{ position: "absolute", right: 80, top: 135 }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 80,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 20,
          fontWeight: 700,
          color: palette.primary,
          letterSpacing: "0.08em",
        }}
      >
        TECH BLOG
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 200,
          display: "flex",
          fontSize: post.title.length > 36 ? 52 : 64,
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          maxWidth: 640,
          color: palette.text,
        }}
      >
        {post.title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 80,
          display: "flex",
          fontSize: 22,
          color: palette.text,
          opacity: 0.75,
          maxWidth: 720,
          lineHeight: 1.4,
        }}
      >
        {post.description.slice(0, 110)}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
