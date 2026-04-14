import { buildBannerSpec, type BannerInput } from "@/lib/banner/spec";

interface BannerProps extends BannerInput {
  className?: string;
  ariaLabel?: string;
  priority?: boolean;
}

export function Banner({ className, ariaLabel, priority = false, ...input }: BannerProps) {
  const { palette, motif } = buildBannerSpec(input);
  const motifUrl = `/banners/motifs/${motif}.svg`;

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `${input.title} 배너`}
      className={className}
      style={{
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bgAccent} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={motifUrl}
        alt=""
        aria-hidden
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "56%",
          height: "auto",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
