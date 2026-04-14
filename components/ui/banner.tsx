import {
  buildBannerSpec,
  seededRandom,
  type BannerInput,
  type BannerSpec,
} from "@/lib/banner/spec";

interface BannerProps extends BannerInput {
  className?: string;
  showTitle?: boolean;
  ariaLabel?: string;
}

export function Banner({ className, showTitle = false, ariaLabel, ...input }: BannerProps) {
  const spec = buildBannerSpec(input);
  return (
    <BannerSvg
      spec={spec}
      className={className}
      showTitle={showTitle}
      ariaLabel={ariaLabel ?? `${input.title} 배너`}
    />
  );
}

interface BannerSvgProps {
  spec: BannerSpec;
  className?: string;
  showTitle?: boolean;
  ariaLabel?: string;
  motifHref?: string;
}

export function BannerSvg({ spec, className, showTitle, ariaLabel, motifHref }: BannerSvgProps) {
  const { palette, seed, motif, initials, title } = spec;
  const rand = seededRandom(seed);
  const blobs = [
    {
      cx: rand() * 320 - 60,
      cy: rand() * 280 + 60,
      r: 120 + rand() * 60,
      fill: palette.primary,
      op: 0.08,
    },
    {
      cx: 1260 - rand() * 320,
      cy: 600 - (rand() * 220 + 40),
      r: 90 + rand() * 60,
      fill: palette.accent,
      op: 0.1,
    },
    {
      cx: rand() * 1200,
      cy: rand() * 600,
      r: 40 + rand() * 50,
      fill: rand() > 0.5 ? palette.primary : palette.accent,
      op: 0.06,
    },
  ];
  const dots = Array.from({ length: 18 }, () => ({
    cx: rand() * 1200,
    cy: rand() * 600,
    r: 1 + rand() * 3,
    op: 0.15 + rand() * 0.35,
  }));
  const gradId = `bg-${motif}-${seed.toString(36)}`;
  const motifUrl = motifHref ?? `/banners/motifs/${motif}.svg`;

  return (
    <svg
      viewBox="0 0 1200 600"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.bg} />
          <stop offset="100%" stopColor={palette.bgAccent} />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill={`url(#${gradId})`} />
      {blobs.map((b, i) => (
        <circle key={`b${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={b.fill} opacity={b.op} />
      ))}
      <g>
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill={i % 3 === 0 ? palette.accent : palette.primary}
            opacity={d.op}
          />
        ))}
      </g>
      <image
        href={motifUrl}
        x={430}
        y={130}
        width={340}
        height={340}
        preserveAspectRatio="xMidYMid meet"
        opacity={0.95}
      />
      {showTitle && (
        <text
          x={80}
          y={320}
          fontFamily="system-ui, sans-serif"
          fontSize={56}
          fontWeight={800}
          fill={palette.text}
          letterSpacing="-0.03em"
        >
          {clip(title, 28)}
        </text>
      )}
    </svg>
  );
}

function clip(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
